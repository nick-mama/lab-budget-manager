const express = require("express");
const router = express.Router();
const { get, all, run, withTransaction } = require("../db");
const { requireRole, requireUser } = require("../middleware/auth");

async function isProjectMember(projectId, userId) {
  const row = await get(
    "SELECT 1 as ok FROM project_users WHERE project_id = ? AND user_id = ? LIMIT 1",
    [projectId, userId],
  );
  return !!row;
}

async function isProjectManager(projectId, userId) {
  const row = await get("SELECT manager_id FROM projects WHERE id = ?", [
    projectId,
  ]);
  if (!row) return false;
  return Number(row.manager_id) === Number(userId);
}

async function recalcBudgetForProject(projectId, db = { get, run }) {
  const budget = await db.get(
    "SELECT id, total_allocated_amount FROM budgets WHERE project_id = ?",
    [projectId],
  );
  if (!budget) return;

  const sums = await db.get(
    `
    SELECT
      COALESCE(SUM(CASE WHEN type = 'expense' AND status IN ('approved','reimbursed') THEN amount ELSE 0 END), 0) as expenses,
      COALESCE(SUM(CASE WHEN type = 'revenue' AND status IN ('approved','reimbursed') THEN amount ELSE 0 END), 0) as revenue
    FROM line_items
    WHERE project_id = ?
  `,
    [projectId],
  );

  const allocated = Number(budget.total_allocated_amount ?? 0);
  const expenses = Number(sums.expenses ?? 0);
  const revenue = Number(sums.revenue ?? 0);
  const remaining = allocated + revenue - expenses;

  await db.run("UPDATE budgets SET remaining_balance = ? WHERE id = ?", [
    remaining,
    budget.id,
  ]);
}

// get all line items, supports ?status= ?type= ?project_id= filters
router.get("/", requireUser, async (req, res) => {
  try {
    const { status, type, project_id } = req.query;

    let query = `
      SELECT
        li.*,
        u.name as requestor_name,
        p.name as project_name,
        p.project_code,
        p.manager_id as project_manager_id
      FROM line_items li
      JOIN users u ON li.requestor_id = u.id
      JOIN projects p ON li.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user?.role === "Researcher") {
      query += " AND li.requestor_id = ?";
      params.push(req.user.id);
    } else if (req.user?.role === "Lab Manager") {
      query += " AND p.manager_id = ?";
      params.push(req.user.id);
    } else if (req.user?.role === "Financial Admin") {
      // allow all
    }

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
router.get("/:id", requireUser, async (req, res) => {
  try {
    const item = await get(
      `
      SELECT
        li.*,
        u.name as requestor_name,
        p.name as project_name,
        p.manager_id as project_manager_id
      FROM line_items li
      JOIN users u ON li.requestor_id = u.id
      JOIN projects p ON li.project_id = p.id
      WHERE li.id = ?
      `,
      [req.params.id],
    );

    if (!item) return res.status(404).json({ error: "line item not found" });

    if (req.user?.role === "Researcher") {
      if (Number(item.requestor_id) !== Number(req.user.id)) {
        return res.status(403).json({ error: "forbidden" });
      }
    } else if (req.user?.role === "Lab Manager") {
      const ok = await isProjectManager(Number(item.project_id), req.user.id);
      if (!ok) return res.status(403).json({ error: "forbidden" });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// create a line item — status always starts as pending
router.post(
  "/",
  requireRole(["Researcher", "Lab Manager", "Financial Admin"]),
  async (req, res) => {
    try {
      const { description, project_id, type, amount, request_date } = req.body;
      if (
        !description ||
        !project_id ||
        !type ||
        amount === undefined ||
        !request_date
      ) {
        return res.status(400).json({
          error:
            "description, project_id, type, amount, and request_date are required",
        });
      }

      const pid = Number(project_id);

      if (req.user.role === "Researcher") {
        const member = await isProjectMember(pid, req.user.id);
        if (!member) {
          return res
            .status(403)
            .json({ error: "not assigned to this project" });
        }
      }

      if (req.user.role === "Lab Manager") {
        const ok = await isProjectManager(pid, req.user.id);
        if (!ok) return res.status(403).json({ error: "forbidden" });
      }

      const last = await get(
        "SELECT item_code FROM line_items ORDER BY id DESC LIMIT 1",
      );
      let nextNum = 1;
      if (last) {
        nextNum = parseInt(String(last.item_code).replace("LI-", ""), 10) + 1;
      }
      const item_code = `LI-${String(nextNum).padStart(3, "0")}`;

      const budget = await get("SELECT id FROM budgets WHERE project_id = ?", [
        pid,
      ]);
      if (!budget) {
        return res.status(400).json({ error: "project has no budget" });
      }

      const item = await withTransaction(async (tx) => {
        const result = await tx.run(
          "INSERT INTO line_items (item_code, description, project_id, budget_id, requestor_id, type, amount, request_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            item_code,
            description,
            pid,
            budget.id,
            req.user.id,
            type,
            amount,
            request_date,
            "pending",
          ],
        );

        return tx.get("SELECT * FROM line_items WHERE id = ?", [
          result.lastInsertRowid,
        ]);
      });

      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
);

// update a line item — approve/reject/reimburse are controlled by role-based rules
router.put("/:id", requireUser, async (req, res) => {
  try {
    const item = await get("SELECT * FROM line_items WHERE id = ?", [
      req.params.id,
    ]);
    if (!item) return res.status(404).json({ error: "line item not found" });

    const {
      description,
      project_id,
      type,
      amount,
      request_date,
      status,
      rejection_reason,
    } = req.body;

    const nextStatus = status ?? item.status;

    const contentFieldsChanging =
      description !== undefined ||
      project_id !== undefined ||
      type !== undefined ||
      amount !== undefined ||
      request_date !== undefined;

    if (contentFieldsChanging) {
      if (Number(item.requestor_id) !== Number(req.user.id)) {
        return res
          .status(403)
          .json({ error: "only the requestor can edit this line item" });
      }
      if (item.status !== "pending") {
        return res
          .status(409)
          .json({ error: "can only edit a pending line item" });
      }
    }

    // Keep your existing status-transition rules
    if (nextStatus !== item.status) {
      const pid = Number(item.project_id);

      if (nextStatus === "approved" || nextStatus === "rejected") {
        if (req.user.role !== "Lab Manager") {
          return res
            .status(403)
            .json({ error: "only lab managers can approve/reject" });
        }
        const ok = await isProjectManager(pid, req.user.id);
        if (!ok) return res.status(403).json({ error: "forbidden" });
        if (item.status !== "pending") {
          return res
            .status(409)
            .json({ error: "only pending items can be approved/rejected" });
        }
        if (
          nextStatus === "rejected" &&
          (!rejection_reason || !String(rejection_reason).trim())
        ) {
          return res
            .status(400)
            .json({ error: "rejection_reason is required when rejecting" });
        }
      } else if (nextStatus === "reimbursed") {
        if (req.user.role !== "Financial Admin") {
          return res
            .status(403)
            .json({ error: "only financial admins can reimburse" });
        }
        if (item.status !== "approved") {
          return res
            .status(409)
            .json({ error: "only approved items can be reimbursed" });
        }
      } else if (nextStatus === "pending") {
        return res
          .status(400)
          .json({ error: "cannot transition back to pending" });
      }
    }

    const newPid = Number(project_id ?? item.project_id);
    const oldPid = Number(item.project_id);
    const projectChanged = newPid !== oldPid;

    let newBudgetId = item.budget_id;
    if (projectChanged) {
      const newBudget = await get(
        "SELECT id FROM budgets WHERE project_id = ?",
        [newPid],
      );
      if (!newBudget) {
        return res.status(400).json({ error: "target project has no budget" });
      }
      newBudgetId = newBudget.id;
    }

    const updatedRow = await withTransaction(async (tx) => {
      await tx.run(
        `
        UPDATE line_items
        SET
          description = ?,
          project_id = ?,
          budget_id = ?,
          type = ?,
          amount = ?,
          request_date = ?,
          status = ?,
          approver_id = CASE
            WHEN ? IN ('approved','rejected') THEN ?
            ELSE approver_id
          END,
          decision_date = CASE
            WHEN ? IN ('approved','rejected') THEN CURRENT_DATE()
            ELSE decision_date
          END,
          payment_date = CASE
            WHEN ? = 'reimbursed' THEN CURRENT_DATE()
            ELSE payment_date
          END,
          rejection_reason = CASE
            WHEN ? = 'rejected' THEN ?
            ELSE rejection_reason
          END
        WHERE id = ?
        `,
        [
          description ?? item.description,
          newPid,
          newBudgetId,
          type ?? item.type,
          amount ?? item.amount,
          request_date ?? item.request_date,
          nextStatus,
          nextStatus,
          req.user.id,
          nextStatus,
          nextStatus,
          nextStatus,
          rejection_reason ?? item.rejection_reason,
          req.params.id,
        ],
      );

      await recalcBudgetForProject(newPid, tx);
      if (projectChanged) {
        await recalcBudgetForProject(oldPid, tx);
      }

      return tx.get("SELECT * FROM line_items WHERE id = ?", [req.params.id]);
    });

    res.json(updatedRow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete a line item
router.delete("/:id", requireUser, async (req, res) => {
  try {
    const item = await get("SELECT * FROM line_items WHERE id = ?", [
      req.params.id,
    ]);
    if (!item) return res.status(404).json({ error: "line item not found" });

    const pid = Number(item.project_id);
    const isAdmin = req.user.role === "Financial Admin";
    const isManager = await isProjectManager(pid, req.user.id);

    if (isAdmin || isManager) {
      await withTransaction(async (tx) => {
        await tx.run("DELETE FROM line_items WHERE id = ?", [req.params.id]);
        await recalcBudgetForProject(pid, tx);
      });
      return res.json({ message: "line item deleted" });
    }

    return res.status(403).json({ error: "forbidden" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
