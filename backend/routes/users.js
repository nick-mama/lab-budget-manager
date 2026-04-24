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
    const user = await get(
      `
      SELECT ${PUBLIC_USER_FIELDS}
      FROM users
      WHERE id = ?
      `,
      [req.params.id],
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
      [req.params.id],
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
      [req.params.id, req.params.id],
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

router.put("/:id", requireUser, async (req, res) => {
  try {
    const targetUserId = Number(req.params.id);
    const { firstName, lastName, email, role, username } = req.body;

    if (!firstName || !lastName || !email || !username) {
      return res.status(400).json({
        error: "firstName, lastName, email, and username are required",
      });
    }

    const isFinancialAdmin = req.user.role === "Financial Admin";
    const isSelf = Number(req.user.id) === targetUserId;

    if (!isFinancialAdmin && !isSelf) {
      return res.status(403).json({ error: "forbidden" });
    }

    const existingUser = await get(
      "SELECT id, role FROM users WHERE id = ?",
      [targetUserId],
    );

    if (!existingUser) {
      return res.status(404).json({ error: "user not found" });
    }

    const emailOwner = await get(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email.trim(), targetUserId],
    );

    if (emailOwner) {
      return res.status(400).json({ error: "email already exists" });
    }

    const usernameOwner = await get(
      "SELECT id FROM users WHERE username = ? AND id != ?",
      [username.trim(), targetUserId],
    );

    if (usernameOwner) {
      return res.status(400).json({ error: "username already exists" });
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const nextRole = isFinancialAdmin ? role : existingUser.role;

    await run(
      `
      UPDATE users
      SET name = ?, email = ?, role = ?, username = ?
      WHERE id = ?
      `,
      [fullName, email.trim(), nextRole, username.trim(), targetUserId],
    );

    const updatedUser = await get(
      `SELECT ${PUBLIC_USER_FIELDS} FROM users WHERE id = ?`,
      [targetUserId],
    );

    res.json(updatedUser);
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
      return res.status(403).json({ error: "forbidden" });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        error: "new password must be at least 8 characters",
      });
    }

    const user = await get(
      "SELECT id, password_hash FROM users WHERE id = ?",
      [targetUserId],
    );

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    if (isSelf) {
      if (!currentPassword) {
        return res.status(400).json({
          error: "currentPassword is required",
        });
      }

      const matches = await bcrypt.compare(currentPassword, user.password_hash);

      if (!matches) {
        return res.status(401).json({ error: "current password is incorrect" });
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
      return res.status(400).json({ error: "invalid user id" });
    }

    if (Number(req.user.id) === targetUserId) {
      return res.status(400).json({ error: "cannot remove the active user" });
    }

    const user = await get("SELECT id FROM users WHERE id = ?", [targetUserId]);

    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const managedProjects = await get(
      "SELECT COUNT(*) AS count FROM projects WHERE manager_id = ?",
      [targetUserId],
    );

    if (Number(managedProjects?.count ?? 0) > 0) {
      return res.status(400).json({
        error: "cannot remove a user who is still assigned as a project manager",
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
        error: "cannot remove a user who is referenced by line items",
      });
    }

    await run("DELETE FROM auth_tokens WHERE user_id = ?", [targetUserId]);
    await run("DELETE FROM project_users WHERE user_id = ?", [targetUserId]);
    await run("DELETE FROM users WHERE id = ?", [targetUserId]);

    res.json({ message: "user removed" });
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
      return res.status(400).json({ error: "email already exists" });
    }

    const existingUsername = await get(
      "SELECT id FROM users WHERE username = ?",
      [username.trim()],
    );

    if (existingUsername) {
      return res.status(400).json({ error: "username already exists" });
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