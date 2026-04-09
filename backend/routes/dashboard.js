const express = require("express");
const router = express.Router();
const { prepare } = require("../db");

// summary counts for the 4 stat cards on the dashboard
router.get("/stats", (req, res) => {
  try {
    const activeProjects = prepare(
      "SELECT COUNT(*) as count FROM projects WHERE status = 'active'"
    ).get();

    const totalBudget = prepare(
      "SELECT COALESCE(SUM(budget), 0) as total FROM projects"
    ).get();

    const pendingRequests = prepare(
      "SELECT COUNT(*) as count FROM line_items WHERE status = 'pending'"
    ).get();

    const teamMembers = prepare("SELECT COUNT(*) as count FROM users").get();

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
router.get("/budget-chart", (req, res) => {
  try {
    const data = prepare(`
      SELECT
        p.name,
        p.budget as allocated,
        COALESCE(SUM(CASE WHEN li.type = 'expense' AND li.status != 'rejected' THEN li.amount ELSE 0 END), 0) as spent
      FROM projects p
      LEFT JOIN line_items li ON li.project_id = p.id
      GROUP BY p.id
      ORDER BY p.budget DESC
    `).all();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// counts and totals by status for the line items stats cards
router.get("/line-item-stats", (req, res) => {
  try {
    const statuses = ["pending", "approved", "rejected", "reimbursed"];
    const result = {};

    for (const status of statuses) {
      const row = prepare(
        "SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM line_items WHERE status = ?"
      ).get(status);
      result[status] = { count: row.count, total: row.total };
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// last 5 line item actions for the recent activity feed
router.get("/recent-activity", (req, res) => {
  try {
    const items = prepare(`
      SELECT li.*, u.name as requestor_name, p.name as project_name
      FROM line_items li
      JOIN users u ON li.requestor_id = u.id
      JOIN projects p ON li.project_id = p.id
      ORDER BY li.created_at DESC
      LIMIT 5
    `).all();

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// totals for the budget summary cards on the budgets page
router.get("/budget-summary", (req, res) => {
  try {
    const totals = prepare(`
      SELECT
        COALESCE(SUM(p.budget), 0) as total_allocated,
        COALESCE(SUM(CASE WHEN li.type = 'expense' AND li.status != 'rejected' THEN li.amount ELSE 0 END), 0) as total_spent
      FROM projects p
      LEFT JOIN line_items li ON li.project_id = p.id
    `).get();

    const pending = prepare(
      "SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM line_items WHERE status = 'pending'"
    ).get();

    res.json({
      total_allocated: totals.total_allocated,
      total_spent: totals.total_spent,
      remaining: totals.total_allocated - totals.total_spent,
      pending_expenses: pending.total,
      pending_count: pending.count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;