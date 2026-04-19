const express = require("express");
const router = express.Router();
const { get, all, run } = require("../db");
const { requireRole } = require("../middleware/auth");

// get all projects with manager name and spending totals, optional ?status= filter
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        p.*,
        u.name as manager_name,
        COALESCE(s.spent, 0) as spent,
        COALESCE(c.line_item_count, 0) as line_item_count
      FROM projects p
      JOIN users u ON p.manager_id = u.id
      LEFT JOIN (
        SELECT project_id,
          SUM(CASE WHEN type = 'expense' AND status != 'rejected' THEN amount ELSE 0 END) as spent
        FROM line_items
        GROUP BY project_id
      ) s ON s.project_id = p.id
      LEFT JOIN (
        SELECT project_id, COUNT(*) as line_item_count
        FROM line_items
        GROUP BY project_id
      ) c ON c.project_id = p.id
    `;
    const params = [];

    // Role-scoped reads (backwards-compatible: if no x-user-id, return all)
    if (req.user?.role === "Lab Manager") {
      query += " WHERE p.manager_id = ?";
      params.push(req.user.id);
      if (status && status !== "all") {
        query += " AND p.status = ?";
        params.push(status);
      }
    } else if (req.user?.role === "Researcher") {
      query +=
        " JOIN project_users pu ON pu.project_id = p.id WHERE pu.user_id = ?";
      params.push(req.user.id);
      if (status && status !== "all") {
        query += " AND p.status = ?";
        params.push(status);
      }
    } else {
      // Financial Admin (or unauthenticated) -> can view all
      if (status && status !== "all") {
        query += " WHERE p.status = ?";
        params.push(status);
      }
    }

    query += " ORDER BY p.created_at DESC";

    const projects = await all(query, params);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get a single project with its line items
router.get("/:id", async (req, res) => {
  try {
    // Role-scoped reads (backwards-compatible: if no x-user-id, allow)
    if (req.user?.role === "Lab Manager") {
      const ok = await get(
        "SELECT 1 as ok FROM projects WHERE id = ? AND manager_id = ?",
        [req.params.id, req.user.id]
      );
      if (!ok) return res.status(403).json({ error: "forbidden" });
    } else if (req.user?.role === "Researcher") {
      const ok = await get(
        "SELECT 1 as ok FROM project_users WHERE project_id = ? AND user_id = ?",
        [req.params.id, req.user.id]
      );
      if (!ok) return res.status(403).json({ error: "forbidden" });
    }

    const project = await get(
      `
      SELECT
        p.*,
        u.name as manager_name,
        COALESCE(s.spent, 0) as spent
      FROM projects p
      JOIN users u ON p.manager_id = u.id
      LEFT JOIN (
        SELECT project_id,
          SUM(CASE WHEN type = 'expense' AND status != 'rejected' THEN amount ELSE 0 END) as spent
        FROM line_items
        GROUP BY project_id
      ) s ON s.project_id = p.id
      WHERE p.id = ?
    `,
      [req.params.id]
    );

    if (!project) return res.status(404).json({ error: "project not found" });

    let lineItemsQuery = `
      SELECT li.*, u.name as requestor_name
      FROM line_items li
      JOIN users u ON li.requestor_id = u.id
      WHERE li.project_id = ?
    `;
    const liParams = [req.params.id];
    if (req.user?.role === "Researcher") {
      lineItemsQuery += " AND li.requestor_id = ?";
      liParams.push(req.user.id);
    }
    lineItemsQuery += " ORDER BY li.request_date DESC";

    const lineItems = await all(lineItemsQuery, liParams);

    res.json({ ...project, line_items: lineItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create a project
router.post("/", requireRole(["Lab Manager", "Financial Admin"]), async (req, res) => {
  try {
    const { name, manager_id, start_date, end_date, budget, status } = req.body;
    if (!name || !manager_id || !start_date || !end_date || budget === undefined) {
      return res.status(400).json({
        error: "name, manager_id, start_date, end_date, and budget are required",
      });
    }

    // Lab managers can only create projects they manage
    if (req.user.role === "Lab Manager" && Number(manager_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: "lab managers can only create projects for themselves" });
    }

    const last = await get("SELECT project_code FROM projects ORDER BY id DESC LIMIT 1");
    let nextNum = 1;
    if (last) {
      nextNum = parseInt(String(last.project_code).replace("PRJ-", ""), 10) + 1;
    }
    const project_code = `PRJ-${String(nextNum).padStart(3, "0")}`;

    const result = await run(
      "INSERT INTO projects (project_code, name, manager_id, start_date, end_date, budget, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [project_code, name, manager_id, start_date, end_date, budget, status ?? "active"]
    );

    // FIX: create a budget row for the new project
    await run(
      "INSERT INTO budgets (project_id, total_allocated_amount, remaining_balance) VALUES (?, ?, ?)",
      [result.lastInsertRowid, budget, budget]
    );

    const project = await get("SELECT * FROM projects WHERE id = ?", [result.lastInsertRowid]);

    // ensure membership for manager
    await run("INSERT IGNORE INTO project_users (project_id, user_id) VALUES (?, ?)", [
      result.lastInsertRowid,
      manager_id,
    ]);

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update a project
router.put("/:id", requireRole(["Lab Manager", "Financial Admin"]), async (req, res) => {
  try {
    const project = await get("SELECT * FROM projects WHERE id = ?", [req.params.id]);
    if (!project) return res.status(404).json({ error: "project not found" });

    // Lab managers can only update projects they manage
    if (req.user.role === "Lab Manager" && Number(project.manager_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: "forbidden" });
    }

    const { name, manager_id, start_date, end_date, budget, status } = req.body;

    if (req.user.role === "Lab Manager" && manager_id && Number(manager_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: "lab managers cannot reassign project manager" });
    }

    const newBudget = budget ?? project.budget;

    await run(
      `
      UPDATE projects
      SET name = ?, manager_id = ?, start_date = ?, end_date = ?, budget = ?, status = ?
      WHERE id = ?
    `,
      [
        name ?? project.name,
        manager_id ?? project.manager_id,
        start_date ?? project.start_date,
        end_date ?? project.end_date,
        newBudget,
        status ?? project.status,
        req.params.id,
      ]
    );

    // FIX: sync budget table when project budget changes
    if (budget !== undefined && Number(budget) !== Number(project.budget)) {
      const diff = Number(budget) - Number(project.budget);
      await run(
        "UPDATE budgets SET total_allocated_amount = ?, remaining_balance = remaining_balance + ? WHERE project_id = ?",
        [budget, diff, req.params.id]
      );
    }

    const updated = await get("SELECT * FROM projects WHERE id = ?", [req.params.id]);
    await run("INSERT IGNORE INTO project_users (project_id, user_id) VALUES (?, ?)", [
      req.params.id,
      updated.manager_id,
    ]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete a project and all its line items
router.delete("/:id", requireRole(["Lab Manager", "Financial Admin"]), async (req, res) => {
  try {
    const project = await get("SELECT * FROM projects WHERE id = ?", [req.params.id]);
    if (!project) return res.status(404).json({ error: "project not found" });

    if (req.user.role === "Lab Manager" && Number(project.manager_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: "forbidden" });
    }

    await run("DELETE FROM line_items WHERE project_id = ?", [req.params.id]);
    await run("DELETE FROM budgets WHERE project_id = ?", [req.params.id]);
    await run("DELETE FROM project_users WHERE project_id = ?", [req.params.id]);
    await run("DELETE FROM projects WHERE id = ?", [req.params.id]);

    res.json({ message: "project deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;