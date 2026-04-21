const request = require("supertest");
const express = require("express");
const { mockDb, makeUser } = require("./helpers");

jest.mock("../middleware/auth", () => ({
  attachUser: (req, _res, next) => next(),
  requireUser: (req, res, next) => next(),
  requireRole: (roles) => (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "missing or invalid x-user-id" });
    const allowed = Array.isArray(roles) ? roles : [roles];
    if (!allowed.includes(req.user.role))
      return res.status(403).json({ error: "forbidden" });
    next();
  },
}));

function buildApp(userOverride = null) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = userOverride;
    next();
  });
  app.use("/api/users", require("../routes/users"));
  return app;
}

describe("GET /api/users", () => {
  beforeEach(() => jest.resetModules());

  it("returns a list of users", async () => {
    const users = [
      { ...makeUser(), project_names: "Test Project" },
      { ...makeUser({ id: 2, name: "Bob Smith", avatar: "BS" }), project_names: null },
    ];
    mockDb.all.mockResolvedValue(users);

    const res = await request(buildApp(makeUser())).get("/api/users");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].projects).toEqual(["Test Project"]);
    expect(res.body[1].projects).toEqual(["No Projects"]);
  });

  it("supports ?role= filter", async () => {
    mockDb.all.mockResolvedValue([]);
    const res = await request(buildApp(makeUser())).get("/api/users?role=Researcher");
    expect(res.status).toBe(200);
    expect(mockDb.all).toHaveBeenCalledWith(
      expect.stringContaining("WHERE u.role = ?"),
      ["Researcher"]
    );
  });

  it("returns 500 on db error", async () => {
    mockDb.all.mockRejectedValue(new Error("db failure"));
    const res = await request(buildApp(makeUser())).get("/api/users");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("db failure");
  });
});

describe("GET /api/users/:id", () => {
  it("returns a single user", async () => {
    const user = makeUser();
    mockDb.get.mockResolvedValue(user);
    const res = await request(buildApp(makeUser())).get("/api/users/1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("returns 404 when user not found", async () => {
    mockDb.get.mockResolvedValue(null);
    const res = await request(buildApp(makeUser())).get("/api/users/99");
    expect(res.status).toBe(404);
  });
});

describe("POST /api/users", () => {
  it("creates a user and returns 201", async () => {
    const created = makeUser({ id: 6 });
    mockDb.run.mockResolvedValue({ lastInsertRowid: 6 });
    mockDb.get.mockResolvedValue(created);

    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).post("/api/users").send({
      name: "Test User",
      email: "test@university.edu",
      role: "Researcher",
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(6);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).post("/api/users").send({
      name: "No Email",
    });
    expect(res.status).toBe(400);
  });

  it("returns 403 when caller is not Financial Admin", async () => {
    const res = await request(buildApp(makeUser({ role: "Researcher" }))).post("/api/users").send({
      name: "X",
      email: "x@u.edu",
      role: "Researcher",
    });
    expect(res.status).toBe(403);
  });

  it("returns 409 on duplicate email", async () => {
    mockDb.run.mockRejectedValue({ code: "ER_DUP_ENTRY" });
    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).post("/api/users").send({
      name: "Test User",
      email: "duplicate@university.edu",
      role: "Researcher",
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe("email already in use");
  });

  it("generates a two-letter avatar from first and last name", async () => {
    mockDb.run.mockResolvedValue({ lastInsertRowid: 7 });
    mockDb.get.mockResolvedValue(makeUser({ avatar: "JD" }));

    await request(buildApp(makeUser({ role: "Financial Admin" }))).post("/api/users").send({
      name: "John Doe",
      email: "jdoe@university.edu",
      role: "Researcher",
    });

    expect(mockDb.run).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(["JD"])
    );
  });
});

describe("PUT /api/users/:id", () => {
  it("updates and returns the user", async () => {
    const existing = makeUser();
    const updated = { ...existing, name: "Updated Name" };
    mockDb.get.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);
    mockDb.run.mockResolvedValue({});

    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).put("/api/users/1").send({ name: "Updated Name" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Name");
  });

  it("returns 404 when user does not exist", async () => {
    mockDb.get.mockResolvedValue(null);
    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).put("/api/users/99").send({ name: "X" });
    expect(res.status).toBe(404);
  });

  it("returns 403 for non-Financial Admin", async () => {
    const res = await request(buildApp(makeUser({ role: "Lab Manager" }))).put("/api/users/1").send({ name: "X" });
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/users/:id", () => {
  it("deletes a user and returns message", async () => {
    mockDb.get.mockResolvedValue(makeUser());
    mockDb.run.mockResolvedValue({});

    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).delete("/api/users/1");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("user deleted");
  });

  it("returns 404 when user does not exist", async () => {
    mockDb.get.mockResolvedValue(null);
    const res = await request(buildApp(makeUser({ role: "Financial Admin" }))).delete("/api/users/99");
    expect(res.status).toBe(404);
  });
});