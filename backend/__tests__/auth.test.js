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
    it("sets req.user to null when x-user-id header is absent", async () => {
      req.header.mockReturnValue(undefined);
      await attachUser(req, res, next);
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    it("sets req.user to null for non-integer x-user-id", async () => {
      req.header.mockReturnValue("abc");
      await attachUser(req, res, next);
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    it("sets req.user to null for id <= 0", async () => {
      req.header.mockReturnValue("0");
      await attachUser(req, res, next);
      expect(req.user).toBeNull();
    });

    it("fetches user from db and attaches to req", async () => {
      const user = makeUser({ id: 3 });
      req.header.mockReturnValue("3");
      mockDb.get.mockResolvedValue(user);
      await attachUser(req, res, next);
      expect(mockDb.get).toHaveBeenCalledWith("SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE id = ?", [3]);
      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalledWith();
    });

    it("sets req.user null when user is not found in db", async () => {
      req.header.mockReturnValue("99");
      mockDb.get.mockResolvedValue(null);
      await attachUser(req, res, next);
      expect(req.user).toBeNull();
    });

    it("calls next with error on db failure", async () => {
      req.header.mockReturnValue("1");
      const err = new Error("db error");
      mockDb.get.mockRejectedValue(err);
      await attachUser(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("requireUser", () => {
    it("calls next when req.user is set", () => {
      req.user = makeUser();
      requireUser(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("returns 401 when req.user is null", () => {
      req.user = null;
      requireUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "missing or invalid x-user-id" });
    });
  });

  describe("requireRole", () => {
    it("calls next when user has a matching role", () => {
      req.user = makeUser({ role: "Financial Admin" });
      requireRole("Financial Admin")(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("calls next when user role is in allowed array", () => {
      req.user = makeUser({ role: "Lab Manager" });
      requireRole(["Lab Manager", "Financial Admin"])(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("returns 403 when role does not match", () => {
      req.user = makeUser({ role: "Researcher" });
      requireRole("Financial Admin")(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "forbidden" });
    });

    it("returns 401 when user is not attached", () => {
      req.user = null;
      requireRole("Lab Manager")(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});