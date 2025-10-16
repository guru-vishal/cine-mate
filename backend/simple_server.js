const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Server is working!' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple movie route with TMDB
app.get('/api/movies/simple', async (req, res) => {
  try {
    const tmdbService = require('./services/tmdbService');
    const movies = await tmdbService.getPopularMovies(1);
    res.json({
      success: true,
      data: movies.slice(0, 5), // Just first 5 movies
      total: movies.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching movies',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Simple test server running on port ${PORT}`);
  console.log(`📍 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Movies test: http://localhost:${PORT}/api/movies/simple`);
});