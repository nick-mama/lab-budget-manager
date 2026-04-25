const express = require("express");
const router = express.Router();
const { all } = require("../db");
const { requireUser } = require("../middleware/auth");

router.get("/", requireUser, async (req, res) => {
  try {
    let query = `
      SELECT
        b.id,
        b.project_id,
        b.total_allocated_amount,
        b.remaining_balance,
        (b.total_allocated_amount - b.remaining_balance) AS spent,
        p.name AS project_name,
        p.project_code,
        p.manager_id,
        COALESCE(c.line_item_count, 0) AS line_item_count
      FROM budgets b
      JOIN projects p ON p.id = b.project_id
      LEFT JOIN (
        SELECT project_id, COUNT(*) AS line_item_count
        FROM line_items
        GROUP BY project_id
      ) c ON c.project_id = b.project_id
    `;

    const params = [];

    if (req.user.role === "Lab Manager") {
      query += ` WHERE p.manager_id = ? `;
      params.push(req.user.id);
    } else if (req.user.role === "Researcher") {
      query += `
        WHERE EXISTS (
          SELECT 1
          FROM project_users pu
          WHERE pu.project_id = p.id
            AND pu.user_id = ?
        )
      `;
      params.push(req.user.id);
    }

    query += ` ORDER BY p.created_at DESC `;

    const budgets = await all(query, params);
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;