const express = require("express");
const router = express.Router();
const { get, all, run } = require("../db");
const { requireRole, requireUser } = require("../middleware/auth");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 12;
const PUBLIC_USER_FIELDS = `
  id,
  name,
  email,
  role,
  avatar,
  username
`;

router.get("/", requireUser, async (req, res) => {
  try {
    const { role } = req.query;

    let query = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.avatar,
        u.username,
        GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR '||') AS project_names
      FROM users u
      LEFT JOIN project_users pu ON pu.user_id = u.id
      LEFT JOIN projects p ON p.id = pu.project_id
    `;

    const params = [];

    if (role && role !== "all") {
      query += " WHERE u.role = ?";
      params.push(role);
    }

    query += `
      GROUP BY u.id, u.name, u.email, u.role, u.avatar, u.username
      ORDER BY u.name ASC
    `;

    const rows = await all(query, params);

    const users = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      avatar: row.avatar,
      username: row.username,
      projects: row.project_names ? String(row.project_names).split("||") : [],
    }));

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", requireUser, async (req, res) => {
  try {
    const targetUserId = Number(req.params.id);

    if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ error: "invalid user id" });
    }

    const user = await get(
      `
      SELECT
        id,
        name,
        email,
        role,
        avatar,
        username
      FROM users
      WHERE id = ?
      `,
      [targetUserId],
    );

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const managedProjects = await all(
      `
      SELECT
        p.id,
        p.name,
        p.project_code
      FROM projects p
      WHERE p.manager_id = ?
      ORDER BY p.name ASC
      `,
      [targetUserId],
    );

    const memberProjects = await all(
      `
      SELECT
        p.id,
        p.name,
        p.project_code
      FROM project_users pu
      JOIN projects p ON p.id = pu.project_id
      WHERE pu.user_id = ?
        AND p.manager_id != ?
      ORDER BY p.name ASC
      `,
      [targetUserId, targetUserId],
    );

    res.json({
      ...user,
      managed_projects: managedProjects,
      member_projects: memberProjects,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id/password", requireUser, async (req, res) => {
  try {
    const targetUserId = Number(req.params.id);
    const { currentPassword, newPassword } = req.body;

    const isFinancialAdmin = req.user.role === "Financial Admin";
    const isSelf = Number(req.user.id) === targetUserId;

    if (!isFinancialAdmin && !isSelf) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        error: "New password must be at least 8 characters",
      });
    }

    const user = await get(
      "SELECT id, password_hash FROM users WHERE id = ?",
      [targetUserId],
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (isSelf) {
      if (!currentPassword) {
        return res.status(400).json({
          error: "CurrentPassword is required",
        });
      }

      const matches = await bcrypt.compare(currentPassword, user.password_hash);

      if (!matches) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await run(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [passwordHash, targetUserId],
    );

    await run("DELETE FROM auth_tokens WHERE user_id = ?", [targetUserId]);

    res.json({ message: "password updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", requireRole(["Financial Admin"]), async (req, res) => {
  try {
    const targetUserId = Number(req.params.id);

    if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    if (Number(req.user.id) === targetUserId) {
      return res.status(400).json({ error: "Cannot remove the active user" });
    }

    const user = await get("SELECT id FROM users WHERE id = ?", [targetUserId]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const managedProjects = await get(
      "SELECT COUNT(*) AS count FROM projects WHERE manager_id = ?",
      [targetUserId],
    );

    if (Number(managedProjects?.count ?? 0) > 0) {
      return res.status(400).json({
        error: "Cannot remove a user who is still assigned as a project manager",
      });
    }

    const referencedLineItems = await get(
      `
      SELECT COUNT(*) AS count
      FROM line_items
      WHERE requestor_id = ?
         OR approver_id = ?
      `,
      [targetUserId, targetUserId],
    );

    if (Number(referencedLineItems?.count ?? 0) > 0) {
      return res.status(400).json({
        error: "Cannot remove a user who is referenced by line items",
      });
    }

    await run("DELETE FROM auth_tokens WHERE user_id = ?", [targetUserId]);
    await run("DELETE FROM project_users WHERE user_id = ?", [targetUserId]);
    await run("DELETE FROM users WHERE id = ?", [targetUserId]);

    res.json({ message: "User removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", requireRole(["Financial Admin"]), async (req, res) => {
  try {
    const { name, email, role, username, password } = req.body;

    if (!name || !email || !role || !username || !password) {
      return res.status(400).json({
        error: "name, email, role, username, and password are required",
      });
    }

    const existingEmail = await get("SELECT id FROM users WHERE email = ?", [
      email.trim(),
    ]);

    if (existingEmail) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const existingUsername = await get(
      "SELECT id FROM users WHERE username = ?",
      [username.trim()],
    );

    if (existingUsername) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const avatar = String(name)
      .trim()
      .split(/\s+/)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await run(
      `
      INSERT INTO users (name, email, role, avatar, username, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [name.trim(), email.trim(), role, avatar || "U", username.trim(), passwordHash],
    );

    const createdUser = await get(
      `SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE id = ?`,
      [result.lastInsertRowid],
    );

    res.status(201).json(createdUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;