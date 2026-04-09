const express = require("express");
const router = express.Router();
const { prepare } = require("../db");

// get all projects with manager name and spending totals, optional ?status= filter
router.get("/", (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        p.*,
        u.name as manager_name,
        COALESCE(SUM(CASE WHEN li.type = 'expense' AND li.status != 'rejected' THEN li.amount ELSE 0 END), 0) as spent,
        COUNT(li.id) as line_item_count
      FROM projects p
      JOIN users u ON p.manager_id = u.id
      LEFT JOIN line_items li ON li.project_id = p.id
    `;
    const params = [];

    if (status && status !== "all") {
      query += " WHERE p.status = ?";
      params.push(status);
    }

    query += " GROUP BY p.id ORDER BY p.created_at DESC";

    const projects = prepare(query).all(...params);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get a single project with its line items
router.get("/:id", (req, res) => {
  try {
    const project = prepare(`
      SELECT
        p.*,
        u.name as manager_name,
        COALESCE(SUM(CASE WHEN li.type = 'expense' AND li.status != 'rejected' THEN li.amount ELSE 0 END), 0) as spent
      FROM projects p
      JOIN users u ON p.manager_id = u.id
      LEFT JOIN line_items li ON li.project_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(req.params.id);

    if (!project) return res.status(404).json({ error: "project not found" });

    const lineItems = prepare(`
      SELECT li.*, u.name as requestor_name
      FROM line_items li
      JOIN users u ON li.requestor_id = u.id
      WHERE li.project_id = ?
      ORDER BY li.request_date DESC
    `).all(req.params.id);

    res.json({ ...project, line_items: lineItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create a project
router.post("/", (req, res) => {
  try {
    const { name, manager_id, start_date, end_date, budget, status } = req.body;
    if (!name || !manager_id || !start_date || !end_date || budget === undefined) {
      return res.status(400).json({
        error: "name, manager_id, start_date, end_date, and budget are required",
      });
    }

    // generate the next sequential project code
    const last = prepare("SELECT project_code FROM projects ORDER BY id DESC LIMIT 1").get();
    let nextNum = 1;
    if (last) {
      nextNum = parseInt(last.project_code.replace("PRJ-", ""), 10) + 1;
    }
    const project_code = `PRJ-${String(nextNum).padStart(3, "0")}`;

    const result = prepare(
      "INSERT INTO projects (project_code, name, manager_id, start_date, end_date, budget, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(project_code, name, manager_id, start_date, end_date, budget, status ?? "active");

    const project = prepare("SELECT * FROM projects WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update a project
router.put("/:id", (req, res) => {
  try {
    const project = prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    if (!project) return res.status(404).json({ error: "project not found" });

    const { name, manager_id, start_date, end_date, budget, status } = req.body;

    prepare(`
      UPDATE projects
      SET name = ?, manager_id = ?, start_date = ?, end_date = ?, budget = ?, status = ?
      WHERE id = ?
    `).run(
      name ?? project.name,
      manager_id ?? project.manager_id,
      start_date ?? project.start_date,
      end_date ?? project.end_date,
      budget ?? project.budget,
      status ?? project.status,
      req.params.id
    );

    const updated = prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete a project and all its line items
router.delete("/:id", (req, res) => {
  try {
    const project = prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    if (!project) return res.status(404).json({ error: "project not found" });

    prepare("DELETE FROM line_items WHERE project_id = ?").run(req.params.id);
    prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);

    res.json({ message: "project deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;