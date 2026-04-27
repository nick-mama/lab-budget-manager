// SJSU CMPE 138 SPRING 2026 TEAM1
const { mockDb, makeUser } = require("./helpers");

const { attachUser, requireUser, requireRole } = require("../middleware/auth");

describe("auth middleware", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();

    req = { header: jest.fn() };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe("attachUser", () => {
    it("sets req.user to null when authorization header is absent", async () => {
      req.header.mockReturnValue(undefined);

      await attachUser(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    it("sets req.user to null when authorization header is not bearer", async () => {
      req.header.mockReturnValue("Basic abc123");

      await attachUser(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    it("sets req.user to null when bearer token is empty", async () => {
      req.header.mockReturnValue("Bearer ");

      await attachUser(req, res, next);

      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    it("sets req.user to null when token is not found", async () => {
      req.header.mockReturnValue("Bearer missing-token");
      mockDb.get.mockResolvedValue(null);

      await attachUser(req, res, next);

      expect(mockDb.get).toHaveBeenCalled();
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    it("sets req.user when token resolves to a user", async () => {
      const user = makeUser({ id: 7, role: "Financial Admin" });

      req.header.mockReturnValue("Bearer test-token");
      mockDb.get.mockResolvedValue(user);

      await attachUser(req, res, next);

      expect(mockDb.get).toHaveBeenCalled();
      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("requireUser", () => {
    it("returns 401 when req.user is missing", () => {
      req.user = null;

      requireUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "unauthorized" });
      expect(next).not.toHaveBeenCalled();
    });

    it("calls next when req.user exists", () => {
      req.user = makeUser();

      requireUser(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("requireRole", () => {
    it("returns 401 when req.user is missing", () => {
      req.user = null;

      requireRole(["Financial Admin"])(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "unauthorized" });
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 403 when req.user role is not allowed", () => {
      req.user = makeUser({ role: "Researcher" });

      requireRole(["Financial Admin"])(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "forbidden" });
      expect(next).not.toHaveBeenCalled();
    });

    it("calls next when req.user role is allowed", () => {
      req.user = makeUser({ role: "Financial Admin" });

      requireRole(["Financial Admin"])(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});