const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { get, run } = require("../db");
const { requireUser } = require("../middleware/auth");

const router = express.Router();

const SALT_ROUNDS = 12;

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "username and password are required",
      });
    }

    const user = await get(
      `
      SELECT id, name, email, role, avatar, username, password_hash
      FROM users
      WHERE username = ?
      `,
      [String(username).trim()],
    );

    if (!user) {
      return res.status(401).json({ error: "invalid username or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: "invalid username or password" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await run(
      `
      INSERT INTO auth_tokens (token, user_id, expires_at)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
      `,
      [token, user.id],
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        username: user.username,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({
        error: "name, email, username, and password are required",
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
    const role = "Researcher";

    const result = await run(
      `
      INSERT INTO users (name, email, role, avatar, username, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [name.trim(), email.trim(), role, avatar || "U", username.trim(), passwordHash],
    );

    const createdUser = await get(
      `
      SELECT id, name, email, role, avatar, username
      FROM users
      WHERE id = ?
      `,
      [result.lastInsertRowid],
    );

    res.status(201).json(createdUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", requireUser, async (req, res) => {
  res.json(req.user);
});

router.post("/logout", requireUser, async (req, res) => {
  try {
    const authHeader = req.header("authorization");
    const token = authHeader.slice(7).trim();

    await run("DELETE FROM auth_tokens WHERE token = ?", [token]);

    res.json({ message: "logged out" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
