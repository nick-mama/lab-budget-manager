const request = require("supertest");
const express = require("express");
const { mockDb, makeUser, makeLineItem, makeProject } = require("./helpers");

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

function buildApp(user = null) {
  jest.resetModules();
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.user = user;
    next();
  });
  app.use("/api/line-items", require("../routes/lineItems"));
  return app;
}

describe("GET /api/line-items", () => {
  it("returns all items for Financial Admin", async () => {
    mockDb.all.mockResolvedValue([makeLineItem()]);
    const res = await request(
      buildApp(makeUser({ role: "Financial Admin" })),
    ).get("/api/line-items");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("scopes to own items for Researcher", async () => {
    mockDb.all.mockResolvedValue([]);
    await request(buildApp(makeUser({ id: 2, role: "Researcher" }))).get(
      "/api/line-items",
    );
    expect(mockDb.all).toHaveBeenCalledWith(
      expect.stringContaining("li.requestor_id = ?"),
      expect.arrayContaining([2]),
    );
  });

  it("scopes to managed projects for Lab Manager", async () => {
    mockDb.all.mockResolvedValue([]);
    await request(buildApp(makeUser({ id: 1, role: "Lab Manager" }))).get(
      "/api/line-items",
    );
    expect(mockDb.all).toHaveBeenCalledWith(
      expect.stringContaining("p.manager_id = ?"),
      expect.arrayContaining([1]),
    );
  });

  it("supports ?status= filter", async () => {
    mockDb.all.mockResolvedValue([]);
    await request(buildApp(makeUser({ role: "Financial Admin" }))).get(
      "/api/line-items?status=pending",
    );
    expect(mockDb.all).toHaveBeenCalledWith(
      expect.stringContaining("li.status = ?"),
      expect.arrayContaining(["pending"]),
    );
  });

  it("supports ?type= filter", async () => {
    mockDb.all.mockResolvedValue([]);
    await request(buildApp(makeUser({ role: "Financial Admin" }))).get(
      "/api/line-items?type=expense",
    );
    expect(mockDb.all).toHaveBeenCalledWith(
      expect.stringContaining("li.type = ?"),
      expect.arrayContaining(["expense"]),
    );
  });

  it("supports ?project_id= filter", async () => {
    mockDb.all.mockResolvedValue([]);
    await request(buildApp(makeUser({ role: "Financial Admin" }))).get(
      "/api/line-items?project_id=1",
    );
    expect(mockDb.all).toHaveBeenCalledWith(
      expect.stringContaining("li.project_id = ?"),
      expect.arrayContaining(["1"]),
    );
  });
});

describe("GET /api/line-items/:id", () => {
  it("returns a single line item", async () => {
    mockDb.get.mockResolvedValue(makeLineItem());
    const res = await request(
      buildApp(makeUser({ role: "Financial Admin" })),
    ).get("/api/line-items/1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("returns 404 when not found", async () => {
    mockDb.get.mockResolvedValue(null);
    const res = await request(
      buildApp(makeUser({ role: "Financial Admin" })),
    ).get("/api/line-items/99");
    expect(res.status).toBe(404);
  });

  it("returns 403 when Researcher tries to view another user's item", async () => {
    mockDb.get.mockResolvedValue(makeLineItem({ requestor_id: 99 }));
    const res = await request(
      buildApp(makeUser({ id: 2, role: "Researcher" })),
    ).get("/api/line-items/1");
    expect(res.status).toBe(403);
  });

  it("returns 403 when Lab Manager does not manage the project", async () => {
    mockDb.get
      .mockResolvedValueOnce(makeLineItem({ project_id: 5 }))
      .mockResolvedValueOnce(null);
    const res = await request(
      buildApp(makeUser({ id: 1, role: "Lab Manager" })),
    ).get("/api/line-items/1");
    expect(res.status).toBe(403);
  });
});

describe("POST /api/line-items", () => {
  const validPayload = {
    description: "Lab Supplies",
    project_id: 1,
    type: "expense",
    amount: 500,
    request_date: "2024-03-01",
  };

  it("creates a line item and returns 201", async () => {
    mockDb.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce(makeLineItem());
    mockDb.run.mockResolvedValue({ lastInsertRowid: 1 });

    const res = await request(
      buildApp(makeUser({ role: "Financial Admin" })),
    )
      .post("/api/line-items")
      .send(validPayload);
    expect(res.status).toBe(201);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(
      buildApp(makeUser({ role: "Financial Admin" })),
    )
      .post("/api/line-items")
      .send({ description: "only this" });
    expect(res.status).toBe(400);
  });

  it("returns 403 when Researcher is not a project member", async () => {
    mockDb.get.mockResolvedValue(null);
    const res = await request(
      buildApp(makeUser({ id: 2, role: "Researcher" })),
    )
      .post("/api/line-items")
      .send(validPayload);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("not assigned to this project");
  });

  it("returns 403 when Lab Manager does not manage the project", async () => {
    mockDb.get.mockResolvedValue(null);
    const res = await request(
      buildApp(makeUser({ id: 1, role: "Lab Manager" })),
    )
      .post("/api/line-items")
      .send(validPayload);
    expect(res.status).toBe(403);
  });

  it("returns 400 when project has no budget", async () => {
    mockDb.get.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    mockDb.run.mockResolvedValue({});

    const res = await request(
      buildApp(makeUser({ role: "Financial Admin" })),
    )
      .post("/api/line-items")
      .send(validPayload);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("project has no budget");
  });

  it("generates sequential item_code based on last item", async () => {
    mockDb.get
      .mockResolvedValueOnce({ item_code: "LI-005" })
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce(makeLineItem({ item_code: "LI-006" }));
    mockDb.run.mockResolvedValue({ lastInsertRowid: 1 });

    await request(buildApp(makeUser({ role: "Financial Admin" })))
      .post("/api/line-items")
      .send(validPayload);

    expect(mockDb.run).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO line_items"),
      expect.arrayContaining(["LI-006"]),
    );
  });
});

describe("PUT /api/line-items/:id", () => {
  it("returns 404 when item not found", async () => {
    mockDb.get.mockResolvedValue(null);
    const res = await request(
      buildApp(makeUser({ role: "Financial Admin" })),
    )
      .put("/api/line-items/99")
      .send({ description: "new" });
    expect(res.status).toBe(404);
  });

  it("returns 401 when no user is set", async () => {
    const res = await request(buildApp(null))
      .put("/api/line-items/1")
      .send({ status: "approved" });
    expect(res.status).toBe(401);
  });

  it("returns 403 when non-requestor tries to edit content fields", async () => {
    mockDb.get.mockResolvedValue(makeLineItem({ requestor_id: 99 }));
    const res = await request(
      buildApp(makeUser({ id: 1, role: "Financial Admin" })),
    )
      .put("/api/line-items/1")
      .send({ description: "changed" });
    expect(res.status).toBe(403);
  });

  it("returns 409 when editing a non-pending item's content", async () => {
    mockDb.get.mockResolvedValue(
      makeLineItem({ requestor_id: 1, status: "approved" }),
    );
    const res = await request(
      buildApp(makeUser({ id: 1, role: "Researcher" })),
    )
      .put("/api/line-items/1")
      .send({ description: "changed" });
    expect(res.status).toBe(409);
  });

  it("returns 403 when non-Lab Manager tries to approve", async () => {
    mockDb.get.mockResolvedValue(makeLineItem({ status: "pending" }));
    const res = await request(
      buildApp(makeUser({ role: "Researcher" })),
    )
      .put("/api/line-items/1")
      .send({ status: "approved" });
    expect(res.status).toBe(403);
  });

  it("returns 400 when rejecting without a reason", async () => {
    mockDb.get
      .mockResolvedValueOnce(makeLineItem({ status: "pending", project_id: 1 }))
      .mockResolvedValueOnce({ manager_id: 1 });
    const res = await request(
      buildApp(makeUser({ id: 1, role: "Lab Manager" })),
    )
      .put("/api/line-items/1")
      .send({ status: "rejected" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/rejection_reason/);
  });

  it("returns 403 when non-Financial Admin tries to reimburse", async () => {
    mockDb.get.mockResolvedValue(makeLineItem({ status: "approved" }));
    const res = await request(
      buildApp(makeUser({ role: "Lab Manager" })),
    )
      .put("/api/line-items/1")
      .send({ status: "reimbursed" });
    expect(res.status).toBe(403);
  });

  it("returns 409 when reimbursing a non-approved item", async () => {
    mockDb.get.mockResolvedValue(makeLineItem({ status: "pending" }));
    const res = await request(
      buildApp(makeUser({ role: "Financial Admin" })),
    )
      .put("/api/line-items/1")
      .send({ status: "reimbursed" });
    expect(res.status).toBe(409);
  });

  it("returns 400 when trying to set status back to pending", async () => {
    mockDb.get.mockResolvedValue(makeLineItem({ status: "approved" }));
    const res = await request(
      buildApp(makeUser({ role: "Financial Admin" })),
    )
      .put("/api/line-items/1")
      .send({ status: "pending" });
    expect(res.status).toBe(400);
  });

  it("Lab Manager can approve a pending item on their project", async () => {
    mockDb.get
      .mockResolvedValueOnce(
        makeLineItem({ status: "pending", project_id: 1, budget_id: 1 }),
      )
      .mockResolvedValueOnce({ manager_id: 1 })
      .mockResolvedValueOnce(makeLineItem({ status: "approved" }))
      .mockResolvedValueOnce({ id: 1, total_allocated_amount: 100000 })
      .mockResolvedValueOnce({ expenses: 500, revenue: 0 });
    mockDb.run.mockResolvedValue({});

    const res = await request(
      buildApp(makeUser({ id: 1, role: "Lab Manager" })),
    )
      .put("/api/line-items/1")
      .send({ status: "approved" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");
  });
});

describe("DELETE /api/line-items/:id", () => {
  it("Financial Admin can delete any item", async () => {
    mockDb.get
      .mockResolvedValueOnce(makeLineItem())
      .mockResolvedValueOnce({ id: 1, total_allocated_amount: 100000 })
      .mockResolvedValueOnce({ expenses: 0, revenue: 0 });
    mockDb.run.mockResolvedValue({});

    const res = await request(
      buildApp(makeUser({ role: "Financial Admin" })),
    ).delete("/api/line-items/1");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("line item deleted");
  });

  it("returns 404 when item not found", async () => {
    mockDb.get.mockResolvedValueOnce(null);
    const res = await request(
      buildApp(makeUser({ role: "Financial Admin" })),
    ).delete("/api/line-items/99");
    expect(res.status).toBe(404);
  });

  it("returns 403 when non-requestor tries to delete", async () => {
    mockDb.get.mockResolvedValue(
      makeLineItem({ requestor_id: 99, status: "pending" }),
    );
    const res = await request(
      buildApp(makeUser({ id: 1, role: "Researcher" })),
    ).delete("/api/line-items/1");
    expect(res.status).toBe(403);
  });

  it("returns 403 when requestor tries to delete a non-pending item", async () => {
    mockDb.get.mockResolvedValue(
      makeLineItem({ requestor_id: 1, status: "approved" }),
    );
    const res = await request(
      buildApp(makeUser({ id: 1, role: "Researcher" })),
    ).delete("/api/line-items/1");
    expect(res.status).toBe(403);
  });

  it("returns 403 when requestor tries to delete their own pending item", async () => {
    mockDb.get
      .mockResolvedValueOnce(makeLineItem({ requestor_id: 1, status: "pending" }))
      .mockResolvedValueOnce({ id: 1, total_allocated_amount: 100000 })
      .mockResolvedValueOnce({ expenses: 0, revenue: 0 });
    mockDb.run.mockResolvedValue({});

    const res = await request(
      buildApp(makeUser({ id: 1, role: "Researcher" })),
    ).delete("/api/line-items/1");
    expect(res.status).toBe(403);
  });
});