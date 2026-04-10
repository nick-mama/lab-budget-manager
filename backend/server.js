const express = require("express");
const cors = require("cors");
const { initDb } = require("./db");

const usersRouter = require("./routes/users");
const projectsRouter = require("./routes/projects");
const lineItemsRouter = require("./routes/lineItems");
const dashboardRouter = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

app.use("/api/users", usersRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/line-items", lineItemsRouter);
app.use("/api/dashboard", dashboardRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("failed to initialize database:", err);
  process.exit(1);
});