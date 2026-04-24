const mysql = require("mysql2/promise");
const path = require("path");

// Load .env from repo root when running from backend/
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

let pool = null;

function getPool() {
  if (!pool) {
    throw new Error("database not initialized; call initDb() first");
  }
  return pool;
}

/** First row or null */
async function get(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows[0] ?? null;
}

/** All rows */
async function all(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

/** INSERT/UPDATE/DELETE — returns { lastInsertRowid } for API parity */
async function run(sql, params = []) {
  const [result] = await getPool().execute(sql, params);
  return { lastInsertRowid: result.insertId };
}

/**
 * Searches a table for a keyword across specified columns.
 * @param {string} tableName - The name of the table to search in.
 * @param {string[]} columns - An array of column names to search against.
 * @param {string} keyword - The search term.
 */
async function search(tableName, columns, keyword) {
  if (!keyword || !columns || columns.length === 0) {
    return all(`SELECT * FROM ${tableName}`);
  }
  const whereClause = columns.map((col) => `${col} LIKE ?`).join(" OR ");
  const sql = `SELECT * FROM ${tableName} WHERE ${whereClause}`;
  const params = columns.map(() => `%${keyword}%`);
  return all(sql, params);
}

async function tableExists(tableName) {
  const row = await get(
    `
    SELECT COUNT(*) AS count
    FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = ?
  `,
    [tableName]
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
    [tableName, columnName]
  );
  return Number(row?.count ?? 0) > 0;
}

async function ensureSchema() {
  await getPool().execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      role VARCHAR(100) NOT NULL,
      avatar VARCHAR(32) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await getPool().execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(255) NOT 
      NULL,
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
      type VARCHAR(50) NOT NULL,
      amount DECIMAL(15, 2) NOT NULL,
      request_date DATE NOT NULL,
      status VARCHAR(50) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // --- Design-doc aligned tables ---
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

  // --- Add missing line item fields from design doc (safe ALTERs) ---
  if (!(await columnExists("line_items", "approver_id"))) {
    await getPool().execute("ALTER TABLE line_items ADD COLUMN approver_id INT NULL");
  }
  if (!(await columnExists("line_items", "decision_date"))) {
    await getPool().execute("ALTER TABLE line_items ADD COLUMN decision_date DATE NULL");
  }
  if (!(await columnExists("line_items", "payment_date"))) {
    await getPool().execute("ALTER TABLE line_items ADD COLUMN payment_date DATE NULL");
  }
  if (!(await columnExists("line_items", "rejection_reason"))) {
    await getPool().execute("ALTER TABLE line_items ADD COLUMN rejection_reason TEXT NULL");
  }
  if (!(await columnExists("line_items", "budget_id"))) {
    await getPool().execute("ALTER TABLE line_items ADD COLUMN budget_id INT NULL");
  }

  // --- Backfill: create one budget per project and link existing line_items to it ---
  const hasBudgets = await tableExists("budgets");
  if (hasBudgets) {
    await getPool().execute(`
      INSERT INTO budgets (project_id, total_allocated_amount, remaining_balance)
      SELECT
        p.id as project_id,
        COALESCE(p.budget, 0) as total_allocated_amount,
        COALESCE(p.budget, 0) -
          COALESCE((
            SELECT SUM(li.amount)
            FROM line_items li
            WHERE li.project_id = p.id
              AND li.type = 'expense'
              AND li.status != 'rejected'
          ), 0) as remaining_balance
      FROM projects p
      LEFT JOIN budgets b ON b.project_id = p.id
      WHERE b.project_id IS NULL
    `);

    // Link existing line_items to their project's budget if budget_id is null
    await getPool().execute(`
      UPDATE line_items li
      JOIN budgets b ON b.project_id = li.project_id
      SET li.budget_id = b.id
      WHERE li.budget_id IS NULL
    `);
  }

  // --- Backfill: project_users membership for managers and requestors ---
  await getPool().execute(`
    INSERT IGNORE INTO project_users (project_id, user_id)
    SELECT id as project_id, manager_id as user_id
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
    ["Geoffrey Agustin", "geoffrey.agustin@university.edu", "Lab Manager", "GA"],
    ["Camden Forbes", "camden.forbes@university.edu", "Researcher", "CF"],
    ["Mehak Jammu", "mehak.jammu@university.edu", "Lab Manager", "MJ"],
    ["Nick Mamaoag", "nick.mamaoag@university.edu", "Lab Manager", "NM"],
    ["Christopher Velez", "christopher.velez@university.edu", "Financial Admin", "CV"],
  ];

  for (const u of users) {
    await run("INSERT INTO users (name, email, role, avatar) VALUES (?, ?, ?, ?)", u);
  }

  const projects = [
    ["PRJ-001", "Biotech Lab Development", 4, "2024-03-01", "2025-06-30", 200000, "active"],
    ["PRJ-002", "Quantum Computing Lab", 2, "2023-09-01", "2024-09-01", 180000, "completed"],
    ["PRJ-003", "Neural Networks Study", 1, "2023-06-01", "2024-06-01", 85000, "closed"],
    ["PRJ-004", "AI Research Initiative", 3, "2024-01-01", "2025-01-01", 120000, "active"],
    ["PRJ-005", "Climate Study Analysis", 4, "2023-11-01", "2024-11-01", 75000, "active"],
    ["PRJ-006", "Robotics Engineering", 1, "2024-02-01", "2025-02-01", 95000, "active"],
  ];

  for (const p of projects) {
    await run(
      "INSERT INTO projects (project_code, name, manager_id, start_date, end_date, budget, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      p
    );
  }

  const items = [
    ["LI-001", "Grant Funding - NSF Award", 1, 2, "revenue", 50000, "2024-03-14", "approved"],
    ["LI-002", "Software Licenses", 2, 1, "expense", 5000, "2024-03-12", "rejected"],
    ["LI-003", "Equipment Maintenance", 1, 5, "expense", 3200, "2024-03-09", "pending"],
    ["LI-004", "Equipment Maintenance", 3, 3, "revenue", 10000, "2024-03-28", "reimbursed"],
    ["LI-005", "Lab Supplies", 4, 2, "expense", 2500, "2024-03-15", "pending"],
    ["LI-006", "Conference Travel", 1, 1, "expense", 1800, "2024-03-10", "approved"],
    ["LI-007", "Research Grant - DOE", 2, 5, "revenue", 75000, "2024-02-20", "approved"],
    ["LI-008", "Equipment Purchase - Microscope", 1, 4, "expense", 15000, "2024-03-05", "pending"],
    ["LI-009", "Personnel Reimbursement", 4, 3, "expense", 980, "2024-03-18", "reimbursed"],
    ["LI-010", "Publication Fees", 3, 2, "expense", 500, "2024-03-22", "approved"],
  ];

  for (const li of items) {
    await run(
      "INSERT INTO line_items (item_code, description, project_id, requestor_id, type, amount, request_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      li
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
      "Set MYSQL_USER and MYSQL_DATABASE (and optionally MYSQL_HOST, MYSQL_PORT, MYSQL_PASSWORD) in a root .env file or the environment."
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

  await ensureSchema();

  const userCountRow = await get("SELECT COUNT(*) AS count FROM users");
  const count = Number(userCountRow?.count ?? 0);
  if (count === 0) {
    await seedData();
  }
}

module.exports = { initDb, get, all, run, search };
