const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/database");
const logger = require("./utils/logger"); // ✅ custom logger for ELK
// require('./apm'); // ✅ APM monitoring

// Import routes
const movieRoutes = require("./routes/movies");
const userRoutes = require("./routes/users");
const recommendationRoutes = require("./routes/recommendations");
const authRoutes = require("./routes/auth");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5000",
  "http://localhost:5173",
  "https://cine-mate-ashy.vercel.app", // your frontend URL
  "https://cine-mate-plum.vercel.app", // backend domain if needed
];

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow server-to-server or curl
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS policy: Origin ${origin} not allowed`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // allow cookies/auth headers
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Only add HSTS in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
});

// ✅ Logging middleware (send to ELK + console)
app.use((req, res, next) => {
  logger.info("API Request", {
    method: req.method,
    path: req.path,
    body: req.body,
    timestamp: new Date().toISOString(),
  });
  next();
});

// Routes
app.use("/api/movies", movieRoutes);
app.use("/api/user", userRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  logger.info("Health check called");

  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    services: {
      mongodb: "connected",
    },
  });
});

// Preflight OPTIONS handler for all routes
app.options('*', (req, res) => {
  res.status(200).end();
});

// 404 handler
app.use((req, res) => {
  logger.warn("Route not found", { path: req.path });
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Server error", {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    logger.info(`CineMate Backend Server running on port ${PORT}`);
  });
}

module.exports = app;