const mockDb = {
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn(),
  withTransaction: jest.fn(async (work) =>
    work({
      get: mockDb.get,
      all: mockDb.all,
      run: mockDb.run,
    }),
  ),
};

jest.mock("../db", () => mockDb);

function makeUser(overrides = {}) {
  return {
    id: 1,
    name: "Test User",
    email: "test@university.edu",
    role: "Financial Admin",
    avatar: "TU",
    created_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeProject(overrides = {}) {
  return {
    id: 1,
    project_code: "PRJ-001",
    name: "Test Project",
    manager_id: 1,
    start_date: "2024-01-01",
    end_date: "2025-01-01",
    budget: 100000,
    status: "active",
    manager_name: "Test User",
    spent: 0,
    line_item_count: 0,
    created_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeLineItem(overrides = {}) {
  return {
    id: 1,
    item_code: "LI-001",
    description: "Test Item",
    project_id: 1,
    requestor_id: 2,
    type: "expense",
    amount: 500,
    request_date: "2024-03-01",
    status: "pending",
    approver_id: null,
    decision_date: null,
    payment_date: null,
    rejection_reason: null,
    requestor_name: "Some User",
    project_name: "Test Project",
    project_code: "PRJ-001",
    created_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

module.exports = { mockDb, makeUser, makeProject, makeLineItem };