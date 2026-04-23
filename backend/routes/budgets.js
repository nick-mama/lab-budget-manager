const express = require("express");
const router = express.Router();
const { all } = require("../db");

router.get("/", async (req, res) => {
  try {
    const budgets = await all(`
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
        SELECT
          project_id,
          COUNT(*) AS line_item_count
        FROM line_items
        GROUP BY project_id
      ) c ON c.project_id = b.project_id
      ORDER BY p.created_at DESC
    `);

    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
