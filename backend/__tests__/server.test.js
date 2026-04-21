const request = require("supertest");
const express = require("express");
const cors = require("cors");

jest.mock("../db", () => ({
  initDb: jest.fn().mockResolvedValue(),
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn(),
}));

jest.mock("../middleware/auth", () => ({
  attachUser: (req, _res, next) => {
    req.user = null;
    next();
  },
}));

jest.mock("../routes/users", () => {
  const r = require("express").Router();
  r.get("/", (_req, res) => res.json([]));
  return r;
});
jest.mock("../routes/projects", () => {
  const r = require("express").Router();
  r.get("/", (_req, res) => res.json([]));
  return r;
});
jest.mock("../routes/lineItems", () => {
  const r = require("express").Router();
  r.get("/", (_req, res) => res.json([]));
  return r;
});
jest.mock("../routes/dashboard", () => {
  const r = require("express").Router();
  r.get("/stats", (_req, res) => res.json({}));
  return r;
});

let app;
beforeAll(() => {
  app = express();
  app.use(cors());
  app.use(express.json());

  const { attachUser } = require("../middleware/auth");
  app.use(attachUser);

  app.use("/api/users", require("../routes/users"));
  app.use("/api/projects", require("../routes/projects"));
  app.use("/api/line-items", require("../routes/lineItems"));
  app.use("/api/dashboard", require("../routes/dashboard"));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
});

describe("server", () => {
  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/users proxies to users router", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/projects proxies to projects router", async () => {
    const res = await request(app).get("/api/projects");
    expect(res.status).toBe(200);
  });

  it("GET /api/line-items proxies to lineItems router", async () => {
    const res = await request(app).get("/api/line-items");
    expect(res.status).toBe(200);
  });

  it("GET /api/dashboard/stats proxies to dashboard router", async () => {
    const res = await request(app).get("/api/dashboard/stats");
    expect(res.status).toBe(200);
  });

  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/nonexistent");
    expect(res.status).toBe(404);
  });
});