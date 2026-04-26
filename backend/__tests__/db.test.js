jest.mock("mysql2/promise", () => ({
  createPool: jest.fn(),
}));

describe("db module", () => {
  let mysql;
  let fakePool;
  let db;

  beforeEach(async () => {
    jest.resetModules();

    mysql = require("mysql2/promise");

    fakePool = {
      execute: jest.fn(),
    };

    mysql.createPool.mockReturnValue(fakePool);

    process.env.MYSQL_USER = "test_user";
    process.env.MYSQL_DATABASE = "test_db";
    process.env.MYSQL_PASSWORD = "";
    process.env.MYSQL_HOST = "127.0.0.1";
    process.env.MYSQL_PORT = "3306";

    db = require("../db");

    fakePool.execute.mockResolvedValue([[]]);
    await db.initDb();
    fakePool.execute.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("get", () => {
    it("returns the first row", async () => {
      fakePool.execute.mockResolvedValueOnce([[{ id: 1, name: "Test" }]]);

      const result = await db.get("SELECT * FROM users WHERE id = ?", [1]);

      expect(fakePool.execute).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE id = ?",
        [1],
      );
      expect(result).toEqual({ id: 1, name: "Test" });
    });

    it("returns null when no rows are found", async () => {
      fakePool.execute.mockResolvedValueOnce([[]]);

      const result = await db.get("SELECT * FROM users WHERE id = ?", [1]);

      expect(result).toBeNull();
    });
  });

  describe("all", () => {
    it("returns all rows", async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      fakePool.execute.mockResolvedValueOnce([rows]);

      const result = await db.all("SELECT * FROM users");

      expect(fakePool.execute).toHaveBeenCalledWith("SELECT * FROM users", []);
      expect(result).toEqual(rows);
    });
  });

  describe("run", () => {
    it("returns lastInsertRowid", async () => {
      fakePool.execute.mockResolvedValueOnce([{ insertId: 42 }]);

      const result = await db.run("INSERT INTO users (name) VALUES (?)", [
        "Test",
      ]);

      expect(fakePool.execute).toHaveBeenCalledWith(
        "INSERT INTO users (name) VALUES (?)",
        ["Test"],
      );
      expect(result).toEqual({ lastInsertRowid: 42 });
    });
  });

  describe("search", () => {
    it("returns safe user fields when no keyword is provided", async () => {
      fakePool.execute.mockResolvedValueOnce([[]]);

      await db.search("users", ["name", "email"], "");

      expect(fakePool.execute).toHaveBeenCalledWith(
        "SELECT id, name, email, role, avatar, username FROM users",
        [],
      );
    });

    it("constructs correct SQL for keyword search", async () => {
      fakePool.execute.mockResolvedValueOnce([[]]);

      await db.search("users", ["name", "email"], "nick");

      expect(fakePool.execute).toHaveBeenCalledWith(
        "SELECT id, name, email, role, avatar, username FROM users WHERE name LIKE ? OR email LIKE ?",
        ["%nick%", "%nick%"],
      );
    });
  });
});