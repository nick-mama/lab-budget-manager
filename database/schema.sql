CREATE DATABASE IF NOT EXISTS lab_budget_manager;
USE lab_budget_manager;

/*Project:
project_id (key attribute)
project_name 
start_date
end_date
status (active, completed, closed)*/
CREATE TABLE Project(
    project_id INT PRIMARY KEY AUTO_INCREMENT,
    project_name VARCHAR(250) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status ENUM('active', 'completed', 'closed') NOT NULL DEFAULT 'active'
);

/*User:
user_id (key attribute)
first_name
last_name
email
role_type (lab manager, researcher, financial admin)*/
CREATE TABLE User(
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    role_type ENUM('lab manager', 'researcher', 'financial admin') NOT NULL
);

/*Project_User:
project_id
user_id
User can work on multiple project. Project can have multiple users.
Each project must have only one lab_manager*/
CREATE TABLE Project_User(
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES Project(project_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

/*Budget:
budget_id (key attribute)
project_id (FK)
total_allocated_amount
remaining_balance
Belongs to ONE project*/
CREATE TABLE Budget(
    budget_id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL UNIQUE,
    total_allocated_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    remaining_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (project_id) REFERENCES Project(project_id) ON DELETE CASCADE
);

/*Line Item:
line_item_id (key attribute)
budget_id (FK)
requestor_id (FK from User(user_id))
approver_id (FK from User(user_id))
amount
request_type (expense, revenue)
status (pending, approved, rejected, reimbursed)
request_date
decision_date
payment_date
rejection_reason*/
CREATE TABLE Line_Item(
    line_item_id INT PRIMARY Key AUTO_INCREMENT,
    budget_id INT NOT NULL,
    requestor_id INT NOT NULL,
    approver_id INT,
    amount DECIMAL(15,2) NOT NULL,
    request_type ENUM('expense', 'revenue'),
    status ENUM('pending', 'approved','rejected', 'reimbursed') NOT NULL DEFAULT 'pending',
    request_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    decision_date DATE,
    payment_date DATE,
    rejection_reason TEXT,
    FOREIGN KEY (budget_id) REFERENCES Budget(budget_id) ON DELETE CASCADE,
    FOREIGN KEY (requestor_id) REFERENCES User(user_id),
    FOREIGN KEY (approver_id) REFERENCES User(user_id)
);
