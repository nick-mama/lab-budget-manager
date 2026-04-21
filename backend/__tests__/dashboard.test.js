const request = require("supertest");
const express = require("express");
const { mockDb } = require("./helpers");

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/dashboard", require("../routes/dashboard"));
  return app;
}

describe("GET /api/dashboard/stats", () => {
  it("returns all four stat card values", async () => {
    mockDb.get
      .mockResolvedValueOnce({ count: 4 })      // active projects
      .mockResolvedValueOnce({ total: 655000 }) // total budget
      .mockResolvedValueOnce({ count: 3 })      // pending requests
      .mockResolvedValueOnce({ count: 5 });     // team members

    const res = await request(buildApp()).get("/api/dashboard/stats");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      active_projects: 4,
      total_budget: 655000,
      pending_requests: 3,
      team_members: 5,
    });
  });

  it("returns 500 on db error", async () => {
    mockDb.get.mockRejectedValue(new Error("db down"));
    const res = await request(buildApp()).get("/api/dashboard/stats");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("db down");
  });
});

describe("GET /api/dashboard/budget-chart", () => {
  it("returns per-project allocated vs spent data", async () => {
    mockDb.all.mockResolvedValue([
      { name: "Project A", allocated: 100000, spent: 30000 },
      { name: "Project B", allocated: 50000, spent: 50000 },
    ]);

    const res = await request(buildApp()).get("/api/dashboard/budget-chart");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toHaveProperty("allocated");
    expect(res.body[0]).toHaveProperty("spent");
  });

  it("returns empty array when no projects exist", async () => {
    mockDb.all.mockResolvedValue([]);
    const res = await request(buildApp()).get("/api/dashboard/budget-chart");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns 500 on db error", async () => {
    mockDb.all.mockRejectedValue(new Error("query failed"));
    const res = await request(buildApp()).get("/api/dashboard/budget-chart");
    expect(res.status).toBe(500);
  });
});

describe("GET /api/dashboard/line-item-stats", () => {
  it("returns counts and totals for all four statuses", async () => {
    mockDb.get
      .mockResolvedValueOnce({ count: 3, total: 6700 })   // pending
      .mockResolvedValueOnce({ count: 5, total: 126800 }) // approved
      .mockResolvedValueOnce({ count: 1, total: 5000 })   // rejected
      .mockResolvedValueOnce({ count: 2, total: 10980 }); // reimbursed

    const res = await request(buildApp()).get("/api/dashboard/line-item-stats");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("pending");
    expect(res.body).toHaveProperty("approved");
    expect(res.body).toHaveProperty("rejected");
    expect(res.body).toHaveProperty("reimbursed");
    expect(res.body.pending).toEqual({ count: 3, total: 6700 });
  });

  it("returns 500 on db error", async () => {
    mockDb.get.mockRejectedValue(new Error("stats fail"));
    const res = await request(buildApp()).get("/api/dashboard/line-item-stats");
    expect(res.status).toBe(500);
  });
});

describe("GET /api/dashboard/recent-activity", () => {
  it("returns up to 5 most recent line items", async () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      description: `Item ${i + 1}`,
      requestor_name: "Some User",
      project_name: "Some Project",
    }));
    mockDb.all.mockResolvedValue(items);

    const res = await request(buildApp()).get("/api/dashboard/recent-activity");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(5);
  });

  it("returns 500 on db error", async () => {
    mockDb.all.mockRejectedValue(new Error("activity fail"));
    const res = await request(buildApp()).get("/api/dashboard/recent-activity");
    expect(res.status).toBe(500);
  });
});

describe("GET /api/dashboard/budget-summary", () => {
  it("returns allocation, spend, remaining, and pending data", async () => {
    mockDb.get
      .mockResolvedValueOnce({ total_allocated: 655000, total_spent: 180000 })
      .mockResolvedValueOnce({ total: 6700, count: 3 });

    const res = await request(buildApp()).get("/api/dashboard/budget-summary");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total_allocated: 655000,
      total_spent: 180000,
      remaining: 475000,
      pending_expenses: 6700,
      pending_count: 3,
    });
  });

  it("computes remaining as total_allocated - total_spent", async () => {
    mockDb.get
      .mockResolvedValueOnce({ total_allocated: 200000, total_spent: 75000 })
      .mockResolvedValueOnce({ total: 0, count: 0 });

    const res = await request(buildApp()).get("/api/dashboard/budget-summary");
    expect(res.body.remaining).toBe(125000);
  });

  it("returns 500 on db error", async () => {
    mockDb.get.mockRejectedValue(new Error("summary fail"));
    const res = await request(buildApp()).get("/api/dashboard/budget-summary");
    expect(res.status).toBe(500);
  });
});