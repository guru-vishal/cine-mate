const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const logger = require('./utils/logger'); // ✅ custom logger for ELK

// Import routes
const movieRoutes = require('./routes/movies');
const userRoutes = require('./routes/users');
const recommendationRoutes = require('./routes/recommendations');
const authRoutes = require('./routes/auth');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Logging middleware (send to ELK + console)
app.use((req, res, next) => {
  logger.info('API Request', {
    method: req.method,
    path: req.path,
    body: req.body,
    timestamp: new Date().toISOString()
  });
  next();
});

// Routes
app.use('/api/movies', movieRoutes);
app.use('/api/user', userRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  logger.info('Health check called');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('Route not found', { path: req.path });
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Server error', {
    message: err.message,
    stack: err.stack,
    path: req.path
  });
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🎬 CineMate Backend Server running on port ${PORT}`);
  console.log(`\n🎬 CineMate Backend Server running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`❤️ Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
