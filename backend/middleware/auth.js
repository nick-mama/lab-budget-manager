// SJSU CMPE 138 SPRING 2026 TEAM1
const { get } = require("../db");

const PUBLIC_USER_FIELDS = `
  u.id,
  u.name,
  u.email,
  u.role,
  u.avatar,
  u.username
`;

async function loadUserFromToken(req) {
  const authHeader = req.header("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return null;
  }

  return await get(
    `
    SELECT ${PUBLIC_USER_FIELDS}
    FROM auth_tokens t
    JOIN users u ON u.id = t.user_id
    WHERE t.token = ?
      AND t.expires_at > NOW()
    `,
    [token],
  );
}

async function attachUser(req, _res, next) {
  try {
    req.user = await loadUserFromToken(req);
    next();
  } catch (err) {
    next(err);
  }
}

function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized" });
  }

  next();
}

function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "unauthorized" });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }

    next();
  };
}

module.exports = {
  attachUser,
  requireUser,
  requireRole,
};