const express = require("express");
const router = express.Router();
const { get, all } = require("../db");
const { requireUser } = require("../middleware/auth");

// summary counts for the 4 stat cards on the dashboard
router.get("/stats", requireUser, async (req, res) => {
  try {
    const activeProjects = await get(
      "SELECT COUNT(*) as count FROM projects WHERE status = 'active'"
    );

    const totalBudget = await get("SELECT COALESCE(SUM(budget), 0) as total FROM projects");

    const pendingRequests = await get(
      "SELECT COUNT(*) as count FROM line_items WHERE status = 'pending'"
    );

    const teamMembers = await get("SELECT COUNT(*) as count FROM users");

    res.json({
      active_projects: activeProjects.count,
      total_budget: totalBudget.total,
      pending_requests: pendingRequests.count,
      team_members: teamMembers.count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// per-project allocated vs spent for the bar chart
router.get("/budget-chart", requireUser, async (req, res) => {
  try {
    const data = await all(`
      SELECT
        p.name,
        p.budget as allocated,
        COALESCE(SUM(CASE WHEN li.type = 'expense' AND li.status != 'rejected' THEN li.amount ELSE 0 END), 0) as spent
      FROM projects p
      LEFT JOIN line_items li ON li.project_id = p.id
      GROUP BY p.id, p.name, p.budget
      ORDER BY p.budget DESC
    `);

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// counts and totals by status for the line items stats cards
router.get("/line-item-stats", requireUser, async (req, res) => {
  try {
    const statuses = ["pending", "approved", "rejected", "reimbursed"];
    const result = {};

    for (const status of statuses) {
      const row = await get(
        "SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM line_items WHERE status = ?",
        [status]
      );
      result[status] = { count: row.count, total: row.total };
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// last 5 line item actions for the recent activity feed
router.get("/recent-activity", requireUser, async (req, res) => {
  try {
    const items = await all(`
      SELECT li.*, u.name as requestor_name, p.name as project_name
      FROM line_items li
      JOIN users u ON li.requestor_id = u.id
      JOIN projects p ON li.project_id = p.id
      ORDER BY li.created_at DESC
      LIMIT 5
    `);

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// totals for the budget summary cards on the budgets page (subqueries avoid join inflation)
router.get("/budget-summary", requireUser, async (req, res) => {
  try {
    const totals = await get(`
      SELECT
        (SELECT COALESCE(SUM(budget), 0) FROM projects) as total_allocated,
        (SELECT COALESCE(SUM(amount), 0) FROM line_items WHERE type = 'expense' AND status != 'rejected') as total_spent
    `);

    const pending = await get(
      "SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM line_items WHERE status = 'pending'"
    );

    const totalAllocated = Number(totals.total_allocated);
    const totalSpent = Number(totals.total_spent);

    res.json({
      total_allocated: totalAllocated,
      total_spent: totalSpent,
      remaining: totalAllocated - totalSpent,
      pending_expenses: pending.total,
      pending_count: pending.count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
