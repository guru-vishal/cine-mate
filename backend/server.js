const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const logger = require('./utils/logger'); // ✅ custom logger for ELK
// require('./apm'); // ✅ APM monitoring

// Import routes
const movieRoutes = require('./routes/movies');
const userRoutes = require('./routes/users');
const recommendationRoutes = require('./routes/recommendations');
const authRoutes = require('./routes/auth');

// Import TMDB service for initialization testing
const tmdbService = require('./services/tmdbService');

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

// Health check endpoint with TMDB status
app.get('/api/health', async (req, res) => {
  logger.info('Health check called');
  
  // Test TMDB connectivity
  let tmdbStatus = 'unknown';
  let tmdbMessage = 'Not tested';
  
  try {
    const testResponse = await tmdbService.getPopularMovies(1);
    if (testResponse.results?.length > 0 || testResponse.length > 0) {
      tmdbStatus = 'operational';
      tmdbMessage = 'TMDB API responding normally';
    } else {
      tmdbStatus = 'degraded';
      tmdbMessage = 'TMDB API returned empty results';
    }
  } catch (error) {
    tmdbStatus = 'error';
    tmdbMessage = `TMDB API error: ${error.message}`;
  }
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      mongodb: 'connected', // Assuming connected if server is running
      tmdb: {
        status: tmdbStatus,
        message: tmdbMessage,
        apiKey: process.env.TMDB_API_KEY ? 'configured' : 'missing'
      }
    }
  });
});

// TMDB Test endpoint for development
app.get('/api/tmdb/test', async (req, res) => {
  try {
    console.log('\n🧪 Manual TMDB Test Requested...');
    
    const results = {
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Test 1: Popular Movies
    try {
      const popular = await tmdbService.getPopularMovies(1);
      results.tests.popularMovies = {
        status: 'success',
        count: popular.results?.length || popular.length || 0,
        sample: popular.results?.[0]?.title || popular[0]?.title || 'No title'
      };
    } catch (error) {
      results.tests.popularMovies = {
        status: 'error',
        error: error.message
      };
    }

    // Test 2: Search
    try {
      const search = await tmdbService.searchMovies('Avengers', 1);
      results.tests.search = {
        status: 'success',
        count: search.results?.length || search.length || 0,
        query: 'Avengers'
      };
    } catch (error) {
      results.tests.search = {
        status: 'error',
        error: error.message
      };
    }

    // Test 3: Movie Details
    try {
      const details = await tmdbService.getMovieDetails(550);
      results.tests.movieDetails = {
        status: 'success',
        title: details.title,
        year: details.release_date?.substring(0, 4)
      };
    } catch (error) {
      results.tests.movieDetails = {
        status: 'error',
        error: error.message
      };
    }

    console.log('✅ TMDB Test completed');
    res.json({
      success: true,
      message: 'TMDB integration test completed',
      data: results
    });

  } catch (error) {
    console.error('❌ TMDB Test failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'TMDB test failed',
      error: error.message
    });
  }
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

// TMDB Service Testing Function
async function testTMDBIntegration() {
  console.log('\n🎯 Testing TMDB Integration...');
  
  try {
    // Test popular movies
    const popular = await tmdbService.getPopularMovies(1);
    const popularCount = popular.results?.length || popular.length || 0;
    console.log(`✅ Popular Movies: ${popularCount} movies fetched`);
    if (popularCount > 0) {
      console.log(`   📽️  Sample: "${popular.results?.[0]?.title || popular[0]?.title}"`);
    }

    // Test genre-based movies (Action = 28)
    const actionMovies = await tmdbService.getMoviesByGenre(28, 1);
    const actionCount = actionMovies.results?.length || actionMovies.length || 0;
    console.log(`✅ Action Movies: ${actionCount} movies fetched`);
    if (actionCount > 0) {
      console.log(`   🎬 Sample: "${actionMovies.results?.[0]?.title || actionMovies[0]?.title}"`);
    }

    // Test search functionality
    const searchResults = await tmdbService.searchMovies('Marvel', 1);
    const searchCount = searchResults.results?.length || searchResults.length || 0;
    console.log(`✅ Search Results: ${searchCount} movies found for "Marvel"`);
    if (searchCount > 0) {
      console.log(`   🔍 Sample: "${searchResults.results?.[0]?.title || searchResults[0]?.title}"`);
    }

    // Test movie details
    const movieDetails = await tmdbService.getMovieDetails(550); // Fight Club
    console.log(`✅ Movie Details: "${movieDetails.title}" (${movieDetails.release_date?.substring(0, 4)})`);
    
    console.log('\n🎉 TMDB Integration: All systems operational!');
    console.log('📊 Ready to serve real movie data from The Movie Database\n');
    
  } catch (error) {
    console.error('\n❌ TMDB Integration Error:', error.message);
    console.log('⚠️  Falling back to mock data for movie endpoints\n');
  }
}

// Start server
app.listen(PORT, async () => {
  logger.info(`🎬 CineMate Backend Server running on port ${PORT}`);
  console.log(`\n🎬 CineMate Backend Server running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`❤️ Health check: http://localhost:${PORT}/api/health`);
  
  // Test TMDB integration after server starts
  // setTimeout(() => {
  //   testTMDBIntegration();
  // }, 2000);
});

module.exports = app;
