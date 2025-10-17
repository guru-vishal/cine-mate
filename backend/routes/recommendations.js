const express = require('express');
const router = express.Router();
const User = require('../models/User');
const tmdbService = require('../services/tmdbService');

// GET /api/recommendations/:userId - Get recommendations for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, genre, minRating } = req.query;
    
    let recommendations = [];
    
    try {
      // Get user preferences first
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get user's favorite genres from their stored favorites
      const favoriteGenres = new Set();
      
      if (user.favorites && user.favorites.length > 0) {
        user.favorites.forEach(movie => {
          if (movie.genre && Array.isArray(movie.genre)) {
            movie.genre.forEach(g => favoriteGenres.add(g));
          }
        });
      }
      
      // Get TMDB recommendations based on user preferences
      if (favoriteGenres.size > 0) {
        // Use TMDB to get movies from user's favorite genres
        const genreArray = Array.from(favoriteGenres);
        const randomGenre = genreArray[Math.floor(Math.random() * genreArray.length)];
        
        // Get genre ID from genre name for TMDB API
        const genreMap = {
          'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
          'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
          'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
          'Mystery': 9648, 'Romance': 10749, 'Science Fiction': 878,
          'Sci-Fi': 878, 'TV Movie': 10770, 'Thriller': 53, 'War': 10752,
          'Western': 37
        };
        
        const genreId = genreMap[randomGenre] || 18; // Default to Drama
        const tmdbResponse = await tmdbService.getMoviesByGenre(genreId, 1);
        recommendations = tmdbResponse.results || tmdbResponse;
      } else {
        // If no favorite genres, get popular movies
        const tmdbResponse = await tmdbService.getPopularMovies(1);
        recommendations = tmdbResponse.results || tmdbResponse;
      }
      
      // Filter out movies already in user's favorites
      const userFavoriteIds = user.favorites.map(fav => parseInt(fav.movieId));
      recommendations = recommendations.filter(movie => 
        !userFavoriteIds.includes(movie.id)
      );
      
      // Apply additional filters
      if (minRating) {
        recommendations = recommendations.filter(movie => 
          (movie.vote_average || 0) >= parseFloat(minRating)
        );
      }
      
      // Limit results
      recommendations = recommendations.slice(0, parseInt(limit));
      
      // Filter by user's favorite genres if any
      if (favoriteGenres.size > 0) {
        query = query.where('genre').in(Array.from(favoriteGenres));
      }
      
      // Apply additional filters
      if (genre) {
        query = query.where('genre').in([genre]);
      }
      
      if (minRating) {
        query = query.where('rating').gte(parseFloat(minRating));
      }
      
      // Get recommendations sorted by rating
      recommendations = await query
        .sort({ rating: -1 })
        .limit(parseInt(limit))
        .exec();
      
      if (recommendations.length === 0) {
        throw new Error('No recommendations found');
      }
      
    } catch (dbError) {
      console.log('Database error, no fallback data available:', dbError.message);
      
      // Return empty recommendations instead of mock data
      recommendations = [];
      
      if (minRating) {
        recommendations = recommendations.filter(movie => 
          movie.rating >= parseFloat(minRating)
        );
      }
      
      // Limit results
      recommendations = recommendations.slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      data: recommendations,
      userId,
      total: recommendations.length,
      message: `Found ${recommendations.length} recommendations`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message
    });
  }
});

// GET /api/recommendations/genre/:genre - Get recommendations by genre
router.get('/genre/:genre', async (req, res) => {
  try {
    const { genre } = req.params;
    const { limit = 10, minRating } = req.query;
    
    let recommendations = [];
    
    try {
      // Use TMDB to get movies by genre
      const genreMap = {
        'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
        'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Family': 10751,
        'Fantasy': 14, 'History': 36, 'Horror': 27, 'Music': 10402,
        'Mystery': 9648, 'Romance': 10749, 'Science Fiction': 878,
        'Sci-Fi': 878, 'TV Movie': 10770, 'Thriller': 53, 'War': 10752,
        'Western': 37
      };
      
      const genreId = genreMap[genre] || 18; // Default to Drama
      const tmdbResponse = await tmdbService.getMoviesByGenre(genreId, 1);
      recommendations = tmdbResponse.results || tmdbResponse;
      
      // Apply filters
      if (minRating) {
        recommendations = recommendations.filter(movie => 
          (movie.vote_average || 0) >= parseFloat(minRating)
        );
      }
      
      // Limit results
      recommendations = recommendations.slice(0, parseInt(limit));
      
      recommendations = await query
        .sort({ rating: -1 })
        .limit(parseInt(limit))
        .exec();
        
      if (recommendations.length === 0) {
        throw new Error('No recommendations found');
      }
      
    } catch (dbError) {
      // Return empty recommendations instead of mock data
      recommendations = [];
      
      recommendations = recommendations
        .sort((a, b) => b.rating - a.rating)
        .slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      data: recommendations,
      genre,
      total: recommendations.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching genre recommendations',
      error: error.message
    });
  }
});

// GET /api/recommendations/similar/:movieId - Get movies similar to a specific movie
router.get('/similar/:movieId', async (req, res) => {
  try {
    const { movieId } = req.params;
    const { limit = 6 } = req.query;
    
    let similarMovies = [];
    
    try {
      // Use TMDB to get similar movies
      similarMovies = await tmdbService.getSimilarMovies(movieId, 1);
      
      // Handle both array and object responses
      if (Array.isArray(similarMovies)) {
        similarMovies = similarMovies.slice(0, parseInt(limit));
      } else if (similarMovies.results) {
        similarMovies = similarMovies.results.slice(0, parseInt(limit));
      } else {
        throw new Error('Invalid TMDB response format');
      }
      
    } catch (tmdbError) {
      console.error('TMDB Similar Movies Error:', tmdbError.message);
      
      // Return empty similar movies instead of mock data
      similarMovies = [];
    }
    
    res.json({
      success: true,
      data: similarMovies,
      movieId,
      total: similarMovies.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching similar movies',
      error: error.message
    });
  }
});

// GET /api/recommendations/trending - Get trending/popular recommendations
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10, timeframe = 'week' } = req.query;
    
    let trendingMovies = [];
    
    try {
      // Use TMDB to get trending movies
      if (timeframe === 'day') {
        // Get popular movies as daily trending (replacing now playing)
        const tmdbResponse = await tmdbService.getPopularMovies(1);
        trendingMovies = tmdbResponse.results || tmdbResponse;
      } else {
        // Get popular movies as weekly trending
        const tmdbResponse = await tmdbService.getPopularMovies(1);
        trendingMovies = tmdbResponse.results || tmdbResponse;
      }
      
      // Filter for high-rated movies only
      trendingMovies = trendingMovies
        .filter(movie => (movie.vote_average || 0) >= 7.0)
        .slice(0, parseInt(limit));
      
    } catch (tmdbError) {
      console.error('TMDB Trending Movies Error:', tmdbError.message);
      
      // Return empty trending movies instead of mock data
      trendingMovies = [];
    }
    
    res.json({
      success: true,
      data: trendingMovies,
      timeframe,
      total: trendingMovies.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching trending movies',
      error: error.message
    });
  }
});

module.exports = router;
