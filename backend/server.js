const express = require("express");
const cors = require("cors");
const { initDb } = require("./db");
const { attachUser } = require("./middleware/auth");
const authRouter = require("./routes/auth");
const usersRouter = require("./routes/users");
const projectsRouter = require("./routes/projects");
const lineItemsRouter = require("./routes/lineItems");
const dashboardRouter = require("./routes/dashboard");
const budgetsRouter = require("./routes/budgets");
const logger = require("./logger");

const app = express();
const PORT = process.env.PORT || 4000;

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-requested-with"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    logger.info("HTTP request", {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - start,
      ip: req.ip,
    });
  });

  next();
});

app.use(attachUser);

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/line-items", lineItemsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/budgets", budgetsRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use((err, req, res, next) => {
  logger.error("Unhandled server error", {
    method: req.method,
    url: req.originalUrl,
    error: err.message,
  });

  res.status(500).json({ error: "Internal server error" });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("Failed to initialize database", {
      error: err.message,
    });
    process.exit(1);
  });