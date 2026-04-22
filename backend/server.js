const express = require("express");
const cors = require("cors");
const { initDb } = require("./db");
const { attachUser } = require("./middleware/auth");

const usersRouter = require("./routes/users");
const projectsRouter = require("./routes/projects");
const lineItemsRouter = require("./routes/lineItems");
const dashboardRouter = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 4000;

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(attachUser);

app.use("/api/users", usersRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/line-items", lineItemsRouter);
app.use("/api/dashboard", dashboardRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});