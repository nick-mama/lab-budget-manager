const request = require("supertest");
const express = require("express");
const { mockDb, makeUser } = require("./helpers");

jest.mock("../middleware/auth", () => ({
  attachUser: (req, _res, next) => next(),
  requireUser: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "unauthorized" });
    }
    next();
  },
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
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns a list of users", async () => {
    const users = [
      { ...makeUser(), project_names: "Test Project" },
      {
        ...makeUser({ id: 2, name: "Bob Smith", avatar: "BS" }),
        project_names: null,
      },
    ];
    mockDb.all.mockResolvedValue(users);

    const res = await request(buildApp(makeUser())).get("/api/users");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].projects).toEqual(["Test Project"]);
    expect(res.body[1].projects).toEqual([]);
  });

  it("supports ?role= filter", async () => {
    mockDb.all.mockResolvedValue([]);

    const res = await request(buildApp(makeUser())).get(
      "/api/users?role=Researcher",
    );

    expect(res.status).toBe(200);
    expect(mockDb.all).toHaveBeenCalledWith(
      expect.stringContaining("WHERE u.role = ?"),
      ["Researcher"],
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
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns a single user", async () => {
    const user = makeUser();

    mockDb.get.mockResolvedValue(user);
    mockDb.all.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const res = await request(buildApp(makeUser())).get("/api/users/1");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
    expect(res.body.managed_projects).toEqual([]);
    expect(res.body.member_projects).toEqual([]);
  });

  it("returns 404 when user not found", async () => {
    mockDb.get.mockResolvedValue(null);

    const res = await request(buildApp(makeUser())).get("/api/users/99");

    expect(res.status).toBe(404);
  });
});

describe("POST /api/users", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("creates a user and returns 201", async () => {
    const created = makeUser({
      id: 6,
      name: "Test User",
      email: "test@university.edu",
      role: "Researcher",
      avatar: "TU",
      username: "test.user",
    });

    mockDb.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(created);

    mockDb.run.mockResolvedValue({ lastInsertRowid: 6 });

    const res = await request(
      buildApp(makeUser({ role: "Financial Admin" })),
    )
      .post("/api/users")
      .send({
        name: "Test User",
        email: "test@university.edu",
        role: "Researcher",
        username: "test.user",
        password: "Password123!",
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(6);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(
      buildApp(makeUser({ role: "Financial Admin" })),
    )
      .post("/api/users")
      .send({
        name: "No Email",
      });

    expect(res.status).toBe(400);
  });

  it("returns 403 when caller is not Financial Admin", async () => {
    const res = await request(buildApp(makeUser({ role: "Researcher" })))
      .post("/api/users")
      .send({
        name: "X",
        email: "x@u.edu",
        role: "Researcher",
        username: "x.user",
        password: "Password123!",
      });

    expect(res.status).toBe(403);
  });

  it("returns 400 on duplicate email", async () => {
    mockDb.get.mockResolvedValueOnce({ id: 10 });

    const res = await request(
      buildApp(makeUser({ role: "Financial Admin" })),
    )
      .post("/api/users")
      .send({
        name: "Test User",
        email: "duplicate@university.edu",
        role: "Researcher",
        username: "duplicate.user",
        password: "Password123!",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Email already exists");
  });

  it("generates a two-letter avatar from first and last name", async () => {
    mockDb.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeUser({ id: 7, avatar: "JD" }));

    mockDb.run.mockResolvedValue({ lastInsertRowid: 7 });

    await request(buildApp(makeUser({ role: "Financial Admin" })))
      .post("/api/users")
      .send({
        name: "John Doe",
        email: "jdoe@university.edu",
        role: "Researcher",
        username: "john.doe",
        password: "Password123!",
      });

    expect(mockDb.run).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(["JD"]),
    );
  });
});

describe("PUT /api/users/:id", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("updates and returns the user", async () => {
    mockDb.get.mockImplementation((sql) => {
      if (sql.includes("SELECT id, role FROM users WHERE id = ?")) {
        return Promise.resolve({ id: 1, role: "Researcher" });
      }

      if (sql.includes("SELECT id FROM users WHERE email = ? AND id != ?")) {
        return Promise.resolve(null);
      }

      if (sql.includes("SELECT id FROM users WHERE username = ? AND id != ?")) {
        return Promise.resolve(null);
      }

      if (
        sql.includes("SELECT id, name, email, role, avatar, username") &&
        sql.includes("FROM users") &&
        sql.includes("WHERE id = ?")
      ) {
        return Promise.resolve({
          id: 1,
          name: "Updated Name",
          email: "updated@university.edu",
          role: "Researcher",
          avatar: "TU",
          username: "updated.name",
        });
      }

      return Promise.resolve(null);
    });

    mockDb.run.mockResolvedValue({});

    const res = await request(
      buildApp(makeUser({ id: 99, role: "Financial Admin" })),
    )
      .put("/api/users/1")
      .send({
        firstName: "Updated",
        lastName: "Name",
        email: "updated@university.edu",
        role: "Researcher",
        username: "updated.name",
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Name");
  });

  it("returns 404 when user does not exist", async () => {
    mockDb.get.mockImplementation((sql) => {
      if (sql.includes("SELECT id, role FROM users WHERE id = ?")) {
        return Promise.resolve(null);
      }

      return Promise.resolve(null);
    });

    const res = await request(
      buildApp(makeUser({ id: 99, role: "Financial Admin" })),
    )
      .put("/api/users/99")
      .send({
        firstName: "X",
        lastName: "Y",
        email: "x@u.edu",
        role: "Researcher",
        username: "x.y",
      });

    expect(res.status).toBe(404);
  });

  it("returns 403 for non-Financial Admin updating another user", async () => {
    const res = await request(
      buildApp(makeUser({ id: 2, role: "Lab Manager" })),
    )
      .put("/api/users/1")
      .send({
        firstName: "X",
        lastName: "Y",
        email: "x@u.edu",
        role: "Researcher",
        username: "x.y",
      });

    expect(res.status).toBe(403);
    expect(mockDb.get).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/users/:id", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("deletes a user and returns message", async () => {
    mockDb.get
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 });

    mockDb.run.mockResolvedValue({});

    const res = await request(
      buildApp(makeUser({ id: 99, role: "Financial Admin" })),
    ).delete("/api/users/1");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User removed");
  });

  it("returns 404 when user does not exist", async () => {
    mockDb.get.mockResolvedValueOnce(null);

    const res = await request(
      buildApp(makeUser({ id: 1, role: "Financial Admin" })),
    ).delete("/api/users/99");

    expect(res.status).toBe(404);
  });
});