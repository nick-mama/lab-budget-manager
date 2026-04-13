const { get } = require("../db");

async function loadUserFromHeader(req) {
  const raw = req.header("x-user-id");
  if (!raw) return null;
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return await get("SELECT * FROM users WHERE id = ?", [id]);
}

/**
 * Attaches req.user if x-user-id is provided and valid.
 * Does not reject if missing.
 */
async function attachUser(req, _res, next) {
  try {
    req.user = await loadUserFromHeader(req);
    next();
  } catch (err) {
    next(err);
  }
}

function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "missing or invalid x-user-id" });
  }
  next();
}

function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "missing or invalid x-user-id" });
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }
    next();
  };
}

module.exports = { attachUser, requireUser, requireRole };

