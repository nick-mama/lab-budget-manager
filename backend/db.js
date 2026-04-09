const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "lab_budget.db");

let db = null;

// converts sql.js column/values result format into an array of plain objects
function rowsToObjects(results) {
  if (!results || results.length === 0) return [];
  const { columns, values } = results[0];
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

// saves the in-memory database back to disk after every write
function persist() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// wraps sql.js to give us a friendlier api similar to better-sqlite3
// .get()  -> returns first row as object or null
// .all()  -> returns all rows as array of objects
// .run()  -> executes a write, saves to disk, returns { lastInsertRowid }
function prepare(sql) {
  return {
    get(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const row = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      return row;
    },
    all(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    },
    run(...params) {
      db.run(sql, params);
      const idResult = db.exec("SELECT last_insert_rowid() as id");
      const lastInsertRowid = idResult[0]?.values[0][0] ?? null;
      persist();
      return { lastInsertRowid };
    },
  };
}

function exec(sql) {
  const result = db.exec(sql);
  persist();
  return result;
}

async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      avatar TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      manager_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      budget REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_code TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      project_id INTEGER NOT NULL,
      requestor_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      request_date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  persist();

  const userCount = prepare("SELECT COUNT(*) as count FROM users").get();
  if (!userCount || userCount.count === 0) {
    seedData();
  }
}

function seedData() {
  const users = [
    ["Geoffrey Agustin", "geoffrey.agustin@university.edu", "Lab Manager", "GA"],
    ["Camden Forbes", "camden.forbes@university.edu", "Researcher", "CF"],
    ["Mehak Jammu", "mehak.jammu@university.edu", "Lab Manager", "MJ"],
    ["Nick Mamaoag", "nick.mamaoag@university.edu", "Lab Manager", "NM"],
    ["Christopher Velez", "christopher.velez@university.edu", "Financial Admin", "CV"],
  ];

  for (const u of users) {
    prepare("INSERT INTO users (name, email, role, avatar) VALUES (?, ?, ?, ?)").run(...u);
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
    prepare(
      "INSERT INTO projects (project_code, name, manager_id, start_date, end_date, budget, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(...p);
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
    prepare(
      "INSERT INTO line_items (item_code, description, project_id, requestor_id, type, amount, request_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(...li);
  }
}

module.exports = { initDb, prepare, exec };