const express = require("express");
const router = express.Router();
const { get, all, run } = require("../db");
const { requireRole } = require("../middleware/auth");

// get all users, optional ?role= filter
router.get("/", async (req, res) => {
  try {
    const { role } = req.query;

    let query = `
      SELECT u.*, GROUP_CONCAT(p.name SEPARATOR '||') as project_names
      FROM users u
      LEFT JOIN projects p ON p.manager_id = u.id
    `;
    const params = [];

    if (role && role !== "all") {
      query += " WHERE u.role = ?";
      params.push(role);
    }

    query +=
      " GROUP BY u.id, u.name, u.email, u.role, u.avatar, u.created_at ORDER BY u.name ASC";

    const users = await all(query, params);

    const result = users.map((user) => ({
      ...user,
      projects: user.project_names
        ? user.project_names.split("||")
        : ["No Projects"],
      project_names: undefined,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get a single user
router.get("/:id", async (req, res) => {
  try {
    const user = await get("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "user not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create a user
router.post("/", requireRole("Financial Admin"), async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res
        .status(400)
        .json({ error: "name, email, and role are required" });
    }

    const parts = name.trim().split(" ");
    const avatar =
      parts.length >= 2
        ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
        : parts[0].substring(0, 2).toUpperCase();

    const result = await run(
      "INSERT INTO users (name, email, role, avatar) VALUES (?, ?, ?, ?)",
      [name, email, role, avatar],
    );

    const user = await get("SELECT * FROM users WHERE id = ?", [
      result.lastInsertRowid,
    ]);
    res.status(201).json(user);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "email already in use" });
    }
    res.status(500).json({ error: err.message });
  }
});

// update a user
router.put("/:id", requireRole("Financial Admin"), async (req, res) => {
  try {
    const user = await get("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "user not found" });

    const { name, email, role } = req.body;

    await run("UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?", [
      name ?? user.name,
      email ?? user.email,
      role ?? user.role,
      req.params.id,
    ]);

    const updated = await get("SELECT * FROM users WHERE id = ?", [
      req.params.id,
    ]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete a user (financial admins only, with safety checks)
router.delete("/:id", requireRole(["Financial Admin"]), async (req, res) => {
  try {
    const targetUserId = Number(req.params.id);

    if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
      return res.status(400).json({ error: "invalid user id" });
    }

    // optional safety: don't let the active financial admin delete themself
    if (Number(req.user.id) === targetUserId) {
      return res.status(400).json({ error: "cannot remove the active user" });
    }

    const user = await get("SELECT * FROM users WHERE id = ?", [targetUserId]);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }

    // prevent deleting users who still manage projects
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

    // prevent deleting users referenced by line items
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

    // remove project membership rows first
    await run("DELETE FROM project_users WHERE user_id = ?", [targetUserId]);

    // then remove the user
    await run("DELETE FROM users WHERE id = ?", [targetUserId]);

    res.json({ message: "user removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update a user with separate firstName and lastName fields
router.put("/:id", async (req, res) => {
  try {
    const { firstName, lastName, email, role } = req.body;

    if (!firstName || !lastName || !email || !role) {
      return res.status(400).json({
        error: "firstName, lastName, email, and role are required",
      });
    }

    const fullName = `${firstName} ${lastName}`.trim();

    await run(
      `
      UPDATE users
      SET name = ?, email = ?, role = ?
      WHERE id = ?
      `,
      [fullName, email, role, req.params.id],
    );

    const updatedUser = await get("SELECT * FROM users WHERE id = ?", [
      req.params.id,
    ]);

    if (!updatedUser) {
      return res.status(404).json({ error: "user not found" });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
