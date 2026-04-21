const mysql = require("mysql2/promise");

jest.mock("mysql2/promise");
jest.mock("dotenv", () => ({ config: jest.fn() }));

const mockExecute = jest.fn();
const mockPool = { execute: mockExecute };

mysql.createPool.mockReturnValue(mockPool);

const db = require("../db");

describe("db module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.MYSQL_USER = "testuser";
    process.env.MYSQL_DATABASE = "testdb";
    process.env.MYSQL_HOST = "127.0.0.1";
    process.env.MYSQL_PORT = "3306";
    process.env.MYSQL_PASSWORD = "secret";
  });

  describe("initDb", () => {
    it("throws if MYSQL_USER is missing", async () => {
      delete process.env.MYSQL_USER;
      let freshDb;
      jest.isolateModules(() => { freshDb = require("../db"); });
      await expect(freshDb.initDb()).rejects.toThrow("Set MYSQL_USER and MYSQL_DATABASE");
    });

    it("throws if MYSQL_DATABASE is missing", async () => {
      delete process.env.MYSQL_DATABASE;
      let freshDb;
      jest.isolateModules(() => { freshDb = require("../db"); });
      await expect(freshDb.initDb()).rejects.toThrow("Set MYSQL_USER and MYSQL_DATABASE");
    });

    it("creates a pool with correct config", async () => {
      mockExecute.mockResolvedValue([[{ count: 1 }]]);
      let freshDb;
      jest.isolateModules(() => { freshDb = require("../db"); });
      await freshDb.initDb();
      expect(mysql.createPool).toHaveBeenCalledWith(
        expect.objectContaining({
          host: "127.0.0.1",
          user: "testuser",
          database: "testdb",
          decimalNumbers: true,
        })
      );
    });

    it("calls execute at least once during schema setup", async () => {
      mockExecute.mockResolvedValue([[{ count: 1 }]]);
      let freshDb;
      jest.isolateModules(() => { freshDb = require("../db"); });
      await freshDb.initDb();
      expect(mockExecute).toHaveBeenCalled();
    });
  });
});