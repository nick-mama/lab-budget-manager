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

    query += " GROUP BY u.id, u.name, u.email, u.role, u.avatar, u.created_at ORDER BY u.name ASC";

    const users = await all(query, params);

    const result = users.map((user) => ({
      ...user,
      projects: user.project_names ? user.project_names.split("||") : ["No Projects"],
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
      return res.status(400).json({ error: "name, email, and role are required" });
    }

    const parts = name.trim().split(" ");
    const avatar =
      parts.length >= 2
        ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
        : parts[0].substring(0, 2).toUpperCase();

    const result = await run(
      "INSERT INTO users (name, email, role, avatar) VALUES (?, ?, ?, ?)",
      [name, email, role, avatar]
    );

    const user = await get("SELECT * FROM users WHERE id = ?", [result.lastInsertRowid]);
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

    const updated = await get("SELECT * FROM users WHERE id = ?", [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete a user
router.delete("/:id", requireRole("Financial Admin"), async (req, res) => {
  try {
    const user = await get("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "user not found" });

    await run("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ message: "user deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
