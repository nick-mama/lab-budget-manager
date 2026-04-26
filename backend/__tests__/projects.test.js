const request = require("supertest");
const express = require("express");
const { mockDb, makeUser, makeProject } = require("./helpers");

jest.mock("../middleware/auth", () => ({
  attachUser: (req, _res, next) => next(),
  requireUser: (req, res, next) => next(),
  requireRole: (roles) => (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const allowed = Array.isArray(roles) ? roles : [roles];

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }

    next();
  },
}));

function buildApp(user = null) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = user;
    next();
  });
  app.use("/api/projects", require("../routes/projects"));
  return app;
}

describe("GET /api/projects", () => {
  it("returns all projects for Financial Admin", async () => {
    mockDb.all.mockResolvedValue([makeProject()]);
    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).get("/api/projects");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("scopes to manager's projects for Lab Manager", async () => {
    mockDb.all.mockResolvedValue([makeProject()]);
    const res = await request(buildApp(makeUser({ id: 1, role: "Lab Manager" }))).get("/api/projects");
    expect(res.status).toBe(200);
    expect(mockDb.all).toHaveBeenCalledWith(
      expect.stringContaining("manager_id = ?"),
      expect.arrayContaining([1])
    );
  });

  it("scopes to assigned projects for Researcher", async () => {
    mockDb.all.mockResolvedValue([]);
    const res = await request(buildApp(makeUser({ id: 2, role: "Researcher" }))).get("/api/projects");
    expect(res.status).toBe(200);
    expect(mockDb.all).toHaveBeenCalledWith(
      expect.stringContaining("project_users"),
      expect.arrayContaining([2])
    );
  });

  it("supports ?status= filter", async () => {
    mockDb.all.mockResolvedValue([]);
    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).get("/api/projects?status=active");
    expect(res.status).toBe(200);
    expect(mockDb.all).toHaveBeenCalledWith(
      expect.stringContaining("p.status = ?"),
      ["active"]
    );
  });

  it("returns 500 on db error", async () => {
    mockDb.all.mockRejectedValue(new Error("boom"));
    const res = await request(buildApp(makeUser())).get("/api/projects");
    expect(res.status).toBe(500);
  });
});

describe("GET /api/projects/:id", () => {
  it("returns project with line items", async () => {
    mockDb.get.mockResolvedValue(makeProject());
    mockDb.all.mockResolvedValue([]);

    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).get("/api/projects/1");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("line_items");
  });

  it("returns 404 when project not found", async () => {
    mockDb.get.mockResolvedValue(null);
    mockDb.all.mockResolvedValue([]);
    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).get("/api/projects/99");
    expect(res.status).toBe(404);
  });

  it("returns 403 for Lab Manager who does not own the project", async () => {
    mockDb.get.mockResolvedValue(null); // isProjectManager check fails
    const res = await request(buildApp(makeUser({ id: 2, role: "Lab Manager" }))).get("/api/projects/1");
    expect(res.status).toBe(403);
  });

  it("returns 403 for Researcher not assigned to project", async () => {
    mockDb.get.mockResolvedValue(null);
    const res = await request(buildApp(makeUser({ id: 2, role: "Researcher" }))).get("/api/projects/1");
    expect(res.status).toBe(403);
  });
});

describe("POST /api/projects", () => {
  it("creates a project and budget row, returns 201", async () => {
    const project = makeProject({ id: 7 });
    mockDb.get.mockResolvedValue(project);
    mockDb.run.mockResolvedValue({ lastInsertRowid: 7 });

    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).post("/api/projects").send({
      name: "New Lab",
      manager_id: 1,
      start_date: "2024-01-01",
      end_date: "2025-01-01",
      budget: 50000,
    });

    expect(res.status).toBe(201);
    expect(mockDb.run).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO budgets"),
      expect.any(Array)
    );
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).post("/api/projects").send({ name: "Only Name" });
    expect(res.status).toBe(400);
  });

  it("returns 403 when Lab Manager tries to assign another manager", async () => {
    const res = await request(buildApp(makeUser({ id: 1, role: "Lab Manager" }))).post("/api/projects").send({
      name: "Lab",
      manager_id: 99,
      start_date: "2024-01-01",
      end_date: "2025-01-01",
      budget: 10000,
    });
    expect(res.status).toBe(403);
  });

  it("returns 403 for Researcher", async () => {
    const res = await request(buildApp(makeUser({ role: "Researcher" }))).post("/api/projects").send({
      name: "Lab",
      manager_id: 2,
      start_date: "2024-01-01",
      end_date: "2025-01-01",
      budget: 10000,
    });
    expect(res.status).toBe(403);
  });
});

describe("PUT /api/projects/:id", () => {
  it("updates a project and returns updated record", async () => {
    const existing = makeProject();
    const updated = { ...existing, name: "Renamed Lab" };
    mockDb.get.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);
    mockDb.run.mockResolvedValue({});

    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).put("/api/projects/1").send({ name: "Renamed Lab" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Renamed Lab");
  });

  it("returns 404 when project not found", async () => {
    mockDb.get.mockResolvedValue(null);
    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).put("/api/projects/99").send({ name: "X" });
    expect(res.status).toBe(404);
  });

  it("returns 403 when Lab Manager does not own the project", async () => {
    mockDb.get.mockResolvedValue(makeProject({ manager_id: 99 }));
    const res = await request(buildApp(makeUser({ id: 1, role: "Lab Manager" }))).put("/api/projects/1").send({ name: "X" });
    expect(res.status).toBe(403);
  });

  it("syncs budgets table when budget changes", async () => {
    const existing = makeProject({ budget: 100000 });
    const updated = { ...existing, budget: 150000 };
    mockDb.get.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);
    mockDb.run.mockResolvedValue({});

    await request(buildApp(makeUser({ role: "Financial Admin" }))).put("/api/projects/1").send({ budget: 150000 });

    expect(mockDb.run).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE budgets"),
      expect.arrayContaining([150000])
    );
  });
});

describe("DELETE /api/projects/:id", () => {
  it("deletes project and all related records", async () => {
    mockDb.get.mockResolvedValue(makeProject());
    mockDb.run.mockResolvedValue({});

    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).delete("/api/projects/1");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("project deleted");

    const deleteCalls = mockDb.run.mock.calls.map((c) => c[0]);
    expect(deleteCalls.some((s) => s.includes("DELETE FROM line_items"))).toBe(true);
    expect(deleteCalls.some((s) => s.includes("DELETE FROM budgets"))).toBe(true);
    expect(deleteCalls.some((s) => s.includes("DELETE FROM project_users"))).toBe(true);
    expect(deleteCalls.some((s) => s.includes("DELETE FROM projects"))).toBe(true);
  });

  it("returns 403 when Lab Manager does not own the project", async () => {
    mockDb.get.mockResolvedValue(makeProject({ manager_id: 99 }));
    const res = await request(buildApp(makeUser({ id: 1, role: "Lab Manager" }))).delete("/api/projects/1");
    expect(res.status).toBe(403);
  });

  it("returns 404 when project not found", async () => {
    mockDb.get.mockResolvedValue(null);
    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).delete("/api/projects/99");
    expect(res.status).toBe(404);
  });
});