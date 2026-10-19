const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const shoppingListRoutes = require("./routes/shoppingLists");
const transactionRoutes = require("./routes/transactions");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = [
      "http://localhost:3000",
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (
      allowed.includes(origin) ||
      /\.vercel\.app$/.test(new URL(origin).hostname) ||
      process.env.NODE_ENV !== "production"
    ) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Logging (development only)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to HomeBasket API",
    healthCheck: "/api/health",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000"
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "HomeBasket API is running", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/shopping-lists", shoppingListRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal server error" });
});

module.exports = app;
