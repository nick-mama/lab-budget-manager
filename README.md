# Research Lab Grant & Budget Management System

---

## Overview

This application is designed to provide a transparent and organized platform for managing research project finances. It supports multiple user roles and enables efficient tracking of budgets, expense requests, approvals, and reimbursements.

The system helps research labs stay within budget while improving visibility into project spending and simplifying communication between researchers, lab managers, and financial administrators.

---

## Quick Start

```bash
git clone https://github.com/nick-mama/lab-budget-manager.git
cd lab-budget-manager
cp .env.example .env
```

> On Windows PowerShell, use `Copy-Item .env.example .env`

Update `.env` with your MySQL credentials.

Make sure MySQL is running, then create the database:

```sql
CREATE DATABASE IF NOT EXISTS lab_budget_manager;
```

```bash
npm run reinstall
npm run dev
```

Open http://localhost:3000

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

- **Frontend:** Next.js (App Router) + React + TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MySQL (mysql2)

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

---

## Frontend Info (UI)

The frontend lives in `frontend/` and is built with **Next.js (App Router)**. It communicates with the backend API running on port `4000`.

### Prerequisites

- Node.js + npm

---

## Backend Info (Database + API)

The backend lives in `backend/` and uses **Node/Express + MySQL** (`mysql2`). On startup, it will:

- Create any missing tables (DDL is in `backend/db.js`)
- Seed sample data **only if** the `users` table is empty

### Prerequisites

- **Node.js + npm**
- **MySQL** (running locally)

---

## Startup Guide

### 1) Create the MySQL database

Create the database (tables will be created by the app on first start):

```sql
CREATE DATABASE IF NOT EXISTS lab_budget_manager;
```

If you prefer, you can also run the SQL scripts in `database/` manually:

- `database/schema.sql` (design-doc style tables)
- `database/app_schema_mysql.sql` (tables used by the Express API)

### 2) Create your `.env` file (repo root)

Create `.env` in the repo root by copying `.env.example`.

Examples:

- macOS/Linux: `cp .env.example .env`
- Windows PowerShell: `Copy-Item .env.example .env`

Minimum required environment variables:

- `MYSQL_USER`
- `MYSQL_DATABASE`
- `MYSQL_PASSWORD` (blank is OK for local dev)
- `MYSQL_HOST` (defaults to `127.0.0.1`)
- `MYSQL_PORT` (defaults to `3306`)

### 3) Install dependencies

From the repo root:

```bash
npm run install:all
```

Note: After initial installation, `npm run reinstall` can be used to refresh packages.

### 4) Start the server

From the repo root:

```bash
npm run dev
```

The frontend will start on `http://localhost:3000`
The API will start on `http://localhost:4000`.

### Notes

- The frontend runs on **port 3000** by default (Next.js).
- The backend runs on **port 4000**.
- Make sure both are running at the same time.
- If you visit `http://localhost:4000` directly, you may see `Cannot GET /` — this is expected (API only).
- Hot reload is enabled — changes update automatically in the browser
- If port `3000` is in use, Next.js will prompt to use another port.
- **Auto-create tables**: `backend/db.js` runs `ensureSchema()` on startup, so you only need to create the database itself.
- **Auto-seed data**: the backend seeds sample users/projects/line items when `users` is empty (first run on a fresh DB).
