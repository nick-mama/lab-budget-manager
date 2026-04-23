const express = require("express");
const router = express.Router();
const { get, all, run } = require("../db");
const { requireRole } = require("../middleware/auth");

// get all users with project membership
router.get("/", async (req, res) => {
  try {
    const { role } = req.query;

    let query = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.avatar,
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
      GROUP BY u.id, u.name, u.email, u.role, u.avatar
      ORDER BY u.name ASC
    `;

    const rows = await all(query, params);

    const users = rows.map((row) => ({
      ...row,
      projects: row.project_names ? String(row.project_names).split("||") : [],
    }));

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get one user with project membership
router.get("/:id", async (req, res) => {
  try {
    const user = await get(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.avatar
      FROM users u
      WHERE u.id = ?
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

// update user
router.put("/:id", async (req, res) => {
  try {
    const targetUserId = Number(req.params.id);
    const { firstName, lastName, email, role } = req.body;

    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({
        error: "firstName, lastName, email, and role are required",
      });
    }

    if (!req.user) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const isFinancialAdmin = req.user.role === "Financial Admin";
    const isSelf = Number(req.user.id) === targetUserId;

    if (!isFinancialAdmin && !isSelf) {
      return res.status(403).json({ error: "forbidden" });
    }

    const existingUser = await get("SELECT * FROM users WHERE id = ?", [
      targetUserId,
    ]);
    if (!existingUser) {
      return res.status(404).json({ error: "user not found" });
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const nextRole = isFinancialAdmin ? role : existingUser.role;

    await run(
      `
      UPDATE users
      SET name = ?, email = ?, role = ?
      WHERE id = ?
      `,
      [fullName, email, nextRole, targetUserId],
    );

    const updatedUser = await get("SELECT * FROM users WHERE id = ?", [
      targetUserId,
    ]);
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete user
router.delete("/:id", requireRole(["Financial Admin"]), async (req, res) => {
  try {
    const targetUserId = Number(req.params.id);

    if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ error: "invalid user id" });
    }

    if (Number(req.user.id) === targetUserId) {
      return res.status(400).json({ error: "cannot remove the active user" });
    }

    const user = await get("SELECT * FROM users WHERE id = ?", [targetUserId]);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    const managedProjects = await get(
      "SELECT COUNT(*) AS count FROM projects WHERE manager_id = ?",
      [targetUserId],
    );

    if (Number(managedProjects?.count ?? 0) > 0) {
      return res.status(400).json({
        error:
          "cannot remove a user who is still assigned as a project manager",
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

    await run("DELETE FROM project_users WHERE user_id = ?", [targetUserId]);
    await run("DELETE FROM users WHERE id = ?", [targetUserId]);

    res.json({ message: "user removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create user
router.post("/", requireRole(["Financial Admin"]), async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        error: "name, email, and role are required",
      });
    }

    const existing = await get("SELECT id FROM users WHERE email = ?", [email]);
    if (existing) {
      return res.status(400).json({ error: "email already exists" });
    }

    const avatar = String(name)
      .trim()
      .split(/\s+/)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const result = await run(
      `
      INSERT INTO users (name, email, role, avatar)
      VALUES (?, ?, ?, ?)
      `,
      [name.trim(), email.trim(), role, avatar || "U"],
    );

    const createdUser = await get("SELECT * FROM users WHERE id = ?", [
      result.lastInsertRowid,
    ]);

    res.status(201).json(createdUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
