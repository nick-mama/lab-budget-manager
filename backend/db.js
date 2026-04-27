const mysql = require("mysql2/promise");
const path = require("path");
const bcrypt = require("bcrypt");
const logger = require("./logger");

const SALT_ROUNDS = 12;
const SAFE_SELECT_FIELDS = {
  users: "id, name, email, role, avatar, username",
  projects: "*",
  line_items: "*",
  budgets: "*",
  project_users: "*",
};

// Load .env from repo root when running from backend/
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

let pool = null;

function getPool() {
  if (!pool) {
    throw new Error("database not initialized; call initDb() first");
  }

  return pool;
}

async function get(sql, params = []) {
  try {
    const [rows] = await getPool().execute(sql, params);
    return rows[0] ?? null;
  } catch (err) {
    logger.error("DB get failed", {
      sql,
      params,
      error: err.message,
    });
    throw err;
  }
}

async function all(sql, params = []) {
  try {
    const [rows] = await getPool().execute(sql, params);
    return rows;
  } catch (err) {
    logger.error("DB all failed", {
      sql,
      params,
      error: err.message,
    });
    throw err;
  }
}

async function run(sql, params = []) {
  try {
    const [result] = await getPool().execute(sql, params);
    return { lastInsertRowid: result.insertId };
  } catch (err) {
    logger.error("DB run failed", {
      sql,
      params,
      error: err.message,
    });
    throw err;
  }
}

async function withTransaction(work) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();

    const tx = {
      async get(sql, params = []) {
        try {
          const [rows] = await connection.execute(sql, params);
          return rows[0] ?? null;
        } catch (err) {
          logger.error("DB tx get failed", {
            sql,
            params,
            error: err.message,
          });
          throw err;
        }
      },
      async all(sql, params = []) {
        try {
          const [rows] = await connection.execute(sql, params);
          return rows;
        } catch (err) {
          logger.error("DB tx all failed", {
            sql,
            params,
            error: err.message,
          });
          throw err;
        }
      },
      async run(sql, params = []) {
        try {
          const [result] = await connection.execute(sql, params);
          return { lastInsertRowid: result.insertId };
        } catch (err) {
          logger.error("DB tx run failed", {
            sql,
            params,
            error: err.message,
          });
          throw err;
        }
      },
    };

    const result = await work(tx);
    await connection.commit();
    return result;
  } catch (err) {
    await connection.rollback();
    logger.error("DB transaction failed", {
      error: err.message,
    });
    throw err;
  } finally {
    connection.release();
  }
}

async function search(tableName, columns, keyword) {
  const safeSelect = SAFE_SELECT_FIELDS[tableName] || "*";

  if (!keyword || !columns || columns.length === 0) {
    return all(`SELECT ${safeSelect} FROM ${tableName}`);
  }

  const whereClause = columns.map((col) => `${col} LIKE ?`).join(" OR ");
  const sql = `SELECT ${safeSelect} FROM ${tableName} WHERE ${whereClause}`;
  const params = columns.map(() => `%${keyword}%`);

  return all(sql, params);
}

async function tableExists(tableName) {
  const row = await get(
    `
    SELECT COUNT(*) AS count
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = ?
    `,
    [tableName],
  );

  return Number(row?.count ?? 0) > 0;
}

async function columnExists(tableName, columnName) {
  const row = await get(
    `
    SELECT COUNT(*) AS count
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND column_name = ?
    `,
    [tableName, columnName],
  );

  return Number(row?.count ?? 0) > 0;
}

async function dropColumnIfExists(tableName, columnName) {
  if (await columnExists(tableName, columnName)) {
    await getPool().execute(
      `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`
    );
  }
}

function makeUsername(name, email) {
  const baseFromName = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".");

  const cleanedName = baseFromName.replace(/^\.+|\.+$/g, "");
  if (cleanedName) return cleanedName;

  return String(email).split("@")[0].toLowerCase();
}

async function ensureSchema() {
  await getPool().execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      role VARCHAR(100) NOT NULL,
      avatar VARCHAR(32) NOT NULL,
      username VARCHAR(100) NULL UNIQUE,
      password_hash VARCHAR(255) NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await getPool().execute(`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      token VARCHAR(128) PRIMARY KEY,
      user_id INT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await getPool().execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      manager_id INT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      budget DECIMAL(15, 2) NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await getPool().execute(`
    CREATE TABLE IF NOT EXISTS line_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT NOT NULL,
      project_id INT NOT NULL,
      requestor_id INT NOT NULL,
      approver_id INT NULL,
      type VARCHAR(50) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      request_date DATE NOT NULL,
      decision_date DATE NULL,
      payment_date DATE NULL,
      rejection_reason TEXT NULL,
      status VARCHAR(50) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_line_items_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      CONSTRAINT fk_line_items_requestor
        FOREIGN KEY (requestor_id) REFERENCES users(id) ON DELETE RESTRICT,
      CONSTRAINT fk_line_items_approver
        FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  await getPool().execute(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL UNIQUE,
      total_allocated_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
      remaining_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await getPool().execute(`
    CREATE TABLE IF NOT EXISTS project_users (
      project_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, user_id)
    )
  `);

  if (!(await columnExists("users", "username"))) {
    await getPool().execute(
      "ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL UNIQUE",
    );
  }

  if (!(await columnExists("users", "password_hash"))) {
    await getPool().execute(
      "ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL",
    );
  }

  const existingUsers = await all("SELECT id, name, email FROM users");

  for (const user of existingUsers) {
    const username = makeUsername(user.name, user.email);
    const defaultPasswordHash = await bcrypt.hash(
      "ChangeMe123!",
      SALT_ROUNDS,
    );

    await getPool().execute(
      `
      UPDATE users
      SET username = COALESCE(username, ?),
          password_hash = COALESCE(password_hash, ?)
      WHERE id = ?
      `,
      [username, defaultPasswordHash, user.id],
    );
  }

  if (!(await columnExists("line_items", "approver_id"))) {
    await getPool().execute(
      "ALTER TABLE line_items ADD COLUMN approver_id INT NULL",
    );
  }

  if (!(await columnExists("line_items", "decision_date"))) {
    await getPool().execute(
      "ALTER TABLE line_items ADD COLUMN decision_date DATE NULL",
    );
  }

  if (!(await columnExists("line_items", "payment_date"))) {
    await getPool().execute(
      "ALTER TABLE line_items ADD COLUMN payment_date DATE NULL",
    );
  }

  if (!(await columnExists("line_items", "rejection_reason"))) {
    await getPool().execute(
      "ALTER TABLE line_items ADD COLUMN rejection_reason TEXT NULL",
    );
  }

  await dropColumnIfExists("line_items", "budget_id");

  const hasBudgets = await tableExists("budgets");

  if (hasBudgets) {
    await getPool().execute(`
      INSERT INTO budgets (project_id, total_allocated_amount, remaining_balance)
      SELECT
        p.id,
        COALESCE(p.budget, 0),
        COALESCE(p.budget, 0) - COALESCE((
          SELECT SUM(li.amount)
          FROM line_items li
          WHERE li.project_id = p.id
            AND li.type = 'expense'
            AND li.status != 'rejected'
        ), 0)
      FROM projects p
      LEFT JOIN budgets b ON b.project_id = p.id
      WHERE b.project_id IS NULL
    `);
  }

  await getPool().execute(`
    INSERT IGNORE INTO project_users (project_id, user_id)
    SELECT id, manager_id
    FROM projects
  `);

  await getPool().execute(`
    INSERT IGNORE INTO project_users (project_id, user_id)
    SELECT DISTINCT project_id, requestor_id
    FROM line_items
  `);
}

async function seedData() {
  const users = [
    [
      "Geoffrey Agustin",
      "geoffrey.agustin@university.edu",
      "Lab Manager",
      "GA",
      "geoffrey.agustin",
    ],
    [
      "Camden Forbes",
      "camden.forbes@university.edu",
      "Researcher",
      "CF",
      "camden.forbes",
    ],
    [
      "Mehak Jammu",
      "mehak.jammu@university.edu",
      "Lab Manager",
      "MJ",
      "mehak.jammu",
    ],
    [
      "Nick Mamaoag",
      "nick.mamaoag@university.edu",
      "Lab Manager",
      "NM",
      "nick.mamaoag",
    ],
    [
      "Christopher Velez",
      "christopher.velez@university.edu",
      "Financial Admin",
      "CV",
      "christopher.velez",
    ],
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash("Password123!", SALT_ROUNDS);

    await run(
      `
      INSERT INTO users (name, email, role, avatar, username, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [...u, passwordHash],
    );
  }

  const projects = [
    [
      "PRJ-001",
      "Biotech Lab Development",
      4,
      "2024-03-01",
      "2025-06-30",
      200000,
      "active",
    ],
    [
      "PRJ-002",
      "Quantum Computing Lab",
      2,
      "2023-09-01",
      "2024-09-01",
      180000,
      "completed",
    ],
    [
      "PRJ-003",
      "Neural Networks Study",
      1,
      "2023-06-01",
      "2024-06-01",
      85000,
      "closed",
    ],
    [
      "PRJ-004",
      "AI Research Initiative",
      3,
      "2024-01-01",
      "2025-01-01",
      120000,
      "active",
    ],
    [
      "PRJ-005",
      "Climate Study Analysis",
      4,
      "2023-11-01",
      "2024-11-01",
      75000,
      "active",
    ],
    [
      "PRJ-006",
      "Robotics Engineering",
      1,
      "2024-02-01",
      "2025-02-01",
      95000,
      "active",
    ],
  ];

  for (const p of projects) {
    await run(
      `
      INSERT INTO projects (project_code, name, manager_id, start_date, end_date, budget, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      p,
    );
  }

  const items = [
    [
      "LI-001",
      "Grant Funding - NSF Award",
      1,
      2,
      "revenue",
      50000,
      "2024-03-14",
      "approved",
    ],
    [
      "LI-002",
      "Software Licenses",
      2,
      1,
      "expense",
      5000,
      "2024-03-12",
      "rejected",
    ],
    [
      "LI-003",
      "Equipment Maintenance",
      1,
      5,
      "expense",
      3200,
      "2024-03-09",
      "pending",
    ],
    [
      "LI-004",
      "Equipment Maintenance",
      3,
      3,
      "revenue",
      10000,
      "2024-03-28",
      "reimbursed",
    ],
    [
      "LI-005",
      "Lab Supplies",
      4,
      2,
      "expense",
      2500,
      "2024-03-15",
      "pending",
    ],
    [
      "LI-006",
      "Conference Travel",
      1,
      1,
      "expense",
      1800,
      "2024-03-10",
      "approved",
    ],
    [
      "LI-007",
      "Research Grant - DOE",
      2,
      5,
      "revenue",
      75000,
      "2024-02-20",
      "approved",
    ],
    [
      "LI-008",
      "Equipment Purchase - Microscope",
      1,
      4,
      "expense",
      15000,
      "2024-03-05",
      "pending",
    ],
    [
      "LI-009",
      "Personnel Reimbursement",
      4,
      3,
      "expense",
      980,
      "2024-03-18",
      "reimbursed",
    ],
    [
      "LI-010",
      "Publication Fees",
      3,
      2,
      "expense",
      500,
      "2024-03-22",
      "approved",
    ],
  ];

  for (const li of items) {
    await run(
      `
      INSERT INTO line_items (item_code, description, project_id, requestor_id, type, amount, request_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      li,
    );
  }
}

async function initDb() {
  const host = process.env.MYSQL_HOST || "127.0.0.1";
  const port = Number(process.env.MYSQL_PORT || 3306);
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD ?? "";
  const database = process.env.MYSQL_DATABASE;

  if (!user || !database) {
    throw new Error(
      "Set MYSQL_USER and MYSQL_DATABASE in the root .env file.",
    );
  }

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    decimalNumbers: true,
  });

  try {
    await ensureSchema();

    const userCountRow = await get("SELECT COUNT(*) AS count FROM users");
    const count = Number(userCountRow?.count ?? 0);

    if (count === 0) {
      await seedData();
    }
  } catch (err) {
    logger.error("Database initialization failed", {
      error: err.message,
    });
    throw err;
  }
}

module.exports = {
  initDb,
  get,
  all,
  run,
  withTransaction,
  search,
};