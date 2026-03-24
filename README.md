# Research Lab Grant & Budget Management System

---

## Overview

This application is designed to provide a transparent and organized platform for managing research project finances. It supports multiple user roles and enables efficient tracking of budgets, expense requests, approvals, and reimbursements.

The system helps research labs stay within budget while improving visibility into project spending and simplifying communication between researchers, lab managers, and financial administrators.

---

## Features

- **Project & Budget Tracking**
  - View project budgets, allocated funds, expenses, and remaining balance
- **Expense & Revenue Requests**
  - Submit, review, and manage financial line items
- **Approval Workflow**
  - Approve or reject requests with role-based permissions
- **Reimbursement Management**
  - Mark approved requests as reimbursed or paid
- **Financial Summaries**
  - Generate budget and spending summaries across projects
- **Role-Based Access Control**
  - Researcher, Lab Manager, Financial Admin

---

## User Roles

### Researcher

- View assigned projects
- Submit expense or revenue requests
- Track request history and status
- View project budget summaries

### Lab Manager

- View managed projects
- Review pending line items
- Approve or reject requests
- Monitor project budget activity

### Financial Admin

- View approved requests
- Mark requests as reimbursed or paid
- Record reimbursement details
- Review financial summaries across projects

---

## Tech Stack

- **Frontend:** React.js
- **Styling:** Tailwind CSS
- **Backend:** C++
- **Database:** SQL

---

## Core Entities

### Project

Represents a research lab project with a unique ID, name, dates, and status.

### User

Represents a system user with a role such as researcher, lab manager, or financial admin.

### Budget

Represents the financial summary for a project, including total allocated amount and remaining balance.

### Line Item

Represents an individual financial transaction or request, including amount, type, request status, and dates.

---

## Database Design

The system is structured around the following primary tables:

- **Project**
  - `project_id`
  - `project_name`
  - `start_date`
  - `end_date`
  - `status`

- **User**
  - `user_id`
  - `first_name`
  - `last_name`
  - `email`
  - `role_type`

- **Budget**
  - `budget_id`
  - `total_allocated_amount`
  - `remaining_balance`

- **Line_Item**
  - `line_item_id`
  - `amount`
  - `request_type`
  - `status`
  - `request_date`
  - `decision_date`
  - `payment_date`
  - `rejection_reason`

SQL is used to store and manage all project, user, budget, and financial request data.

---

## Example Workflow

1. A researcher logs in and submits an expense request for a project
2. The request is saved with a pending status
3. A lab manager reviews the request and approves or rejects it
4. A financial admin processes approved requests and marks them as reimbursed
5. The system updates the budget and financial summaries accordingly

---

## Use Case

This system is ideal for:

- University research labs
- Academic grant-funded projects
- Research teams needing structured financial tracking
- Departments that require transparent approval and reimbursement workflows

It improves accountability, budget visibility, and overall financial organization.

---

## Background

This project was developed as part of a database systems course. It models real-world research lab financial workflows, including project management, budget tracking, approval systems, and reimbursement handling.

---

## Team

- Geoffrey Agustin
- Camden Forbes
- Mehak Jammu
- Nick Mamaoag
- Christopher Velez
