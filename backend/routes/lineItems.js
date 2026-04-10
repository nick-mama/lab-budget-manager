const express = require("express");
const router = express.Router();
const { get, all, run } = require("../db");

// get all line items, supports ?status= ?type= ?project_id= filters
router.get("/", async (req, res) => {
  try {
    const { status, type, project_id } = req.query;

    let query = `
      SELECT li.*, u.name as requestor_name, p.name as project_name, p.project_code
      FROM line_items li
      JOIN users u ON li.requestor_id = u.id
      JOIN projects p ON li.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== "all-status") {
      query += " AND li.status = ?";
      params.push(status);
    }
    if (type && type !== "all-type") {
      query += " AND li.type = ?";
      params.push(type);
    }
    if (project_id && project_id !== "all-projects") {
      query += " AND li.project_id = ?";
      params.push(project_id);
    }

    query += " ORDER BY li.request_date DESC";

    const items = await all(query, params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get a single line item
router.get("/:id", async (req, res) => {
  try {
    const item = await get(
      `
      SELECT li.*, u.name as requestor_name, p.name as project_name
      FROM line_items li
      JOIN users u ON li.requestor_id = u.id
      JOIN projects p ON li.project_id = p.id
      WHERE li.id = ?
    `,
      [req.params.id]
    );

    if (!item) return res.status(404).json({ error: "line item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create a line item — status always starts as pending
router.post("/", async (req, res) => {
  try {
    const { description, project_id, requestor_id, type, amount, request_date } = req.body;
    if (!description || !project_id || !requestor_id || !type || amount === undefined || !request_date) {
      return res.status(400).json({
        error: "description, project_id, requestor_id, type, amount, and request_date are required",
      });
    }

    const last = await get("SELECT item_code FROM line_items ORDER BY id DESC LIMIT 1");
    let nextNum = 1;
    if (last) {
      nextNum = parseInt(String(last.item_code).replace("LI-", ""), 10) + 1;
    }
    const item_code = `LI-${String(nextNum).padStart(3, "0")}`;

    const result = await run(
      "INSERT INTO line_items (item_code, description, project_id, requestor_id, type, amount, request_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [item_code, description, project_id, requestor_id, type, amount, request_date, "pending"]
    );

    const item = await get("SELECT * FROM line_items WHERE id = ?", [result.lastInsertRowid]);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update a line item — use this to approve, reject, or reimburse by passing { status: "approved" } etc.
router.put("/:id", async (req, res) => {
  try {
    const item = await get("SELECT * FROM line_items WHERE id = ?", [req.params.id]);
    if (!item) return res.status(404).json({ error: "line item not found" });

    const { description, project_id, requestor_id, type, amount, request_date, status } = req.body;

    await run(
      `
      UPDATE line_items
      SET description = ?, project_id = ?, requestor_id = ?, type = ?, amount = ?, request_date = ?, status = ?
      WHERE id = ?
    `,
      [
        description ?? item.description,
        project_id ?? item.project_id,
        requestor_id ?? item.requestor_id,
        type ?? item.type,
        amount ?? item.amount,
        request_date ?? item.request_date,
        status ?? item.status,
        req.params.id,
      ]
    );

    const updated = await get("SELECT * FROM line_items WHERE id = ?", [req.params.id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete a line item
router.delete("/:id", async (req, res) => {
  try {
    const item = await get("SELECT * FROM line_items WHERE id = ?", [req.params.id]);
    if (!item) return res.status(404).json({ error: "line item not found" });

    await run("DELETE FROM line_items WHERE id = ?", [req.params.id]);
    res.json({ message: "line item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
