const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Movie = require('../models/Movie');

// Mock recommendations data
const mockRecommendations = [
  {
    id: '1',
    title: 'Inception',
    genre: ['Sci-Fi', 'Thriller'],
    rating: 8.8,
    poster_url: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    year: 2010,
    duration: 148,
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Marion Cotillard', 'Tom Hardy']
  },
  {
    id: '3',
    title: 'The Dark Knight',
    genre: ['Action', 'Crime', 'Drama'],
    rating: 9.0,
    poster_url: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/hqkIcbrOHL86UncnHIsHVcVmzue.jpg',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    year: 2008,
    duration: 152,
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart']
  },
  {
    id: '5',
    title: 'The Godfather',
    genre: ['Crime', 'Drama'],
    rating: 9.2,
    poster_url: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/ejdD20cdHNFAYAN2DlqPToXKyzx.jpg',
    description: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
    year: 1972,
    duration: 175,
    director: 'Francis Ford Coppola',
    cast: ['Marlon Brando', 'Al Pacino', 'James Caan']
  },
  {
    id: '7',
    title: 'Parasite',
    genre: ['Thriller', 'Drama', 'Comedy'],
    rating: 8.6,
    poster_url: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/TU9NIjwzjoKPwQHoHshkBcQZzr.jpg',
    description: 'A poor family schemes to become employed by a wealthy family by infiltrating their household and posing as unrelated, highly qualified individuals.',
    year: 2019,
    duration: 132,
    director: 'Bong Joon-ho',
    cast: ['Kang-ho Song', 'Sun-kyun Lee', 'Yeo-jeong Jo']
  }
];

// GET /api/recommendations/:userId - Get recommendations for a specific user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, genre, minRating } = req.query;
    
    let recommendations = [];
    
    try {
      // Try to get user and their recommendations from database
      const user = await User.findById(userId).populate('favorites');
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Get user's favorite genres from their preferences and favorites
      const favoriteGenres = new Set();
      
      // Add genres from preferences
      if (user.preferences && user.preferences.genres) {
        user.preferences.genres.forEach(g => favoriteGenres.add(g));
      }
      
      // Add genres from favorite movies
      if (user.favorites && user.favorites.length > 0) {
        user.favorites.forEach(movie => {
          if (movie.genre) {
            movie.genre.forEach(g => favoriteGenres.add(g));
          }
        });
      }
      
      // Build recommendation query
      let query = Movie.find({
        _id: { $nin: user.favorites.map(fav => fav._id) } // Exclude favorites
      });
      
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
      console.log('Database error, using mock recommendations:', dbError.message);
      
      // Fallback to mock recommendations
      recommendations = [...mockRecommendations];
      
      // Apply filters to mock data
      if (genre) {
        recommendations = recommendations.filter(movie => 
          movie.genre.includes(genre)
        );
      }
      
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
      // Try database first
      let query = Movie.find({ genre: { $in: [genre] } });
      
      if (minRating) {
        query = query.where('rating').gte(parseFloat(minRating));
      }
      
      recommendations = await query
        .sort({ rating: -1 })
        .limit(parseInt(limit))
        .exec();
        
      if (recommendations.length === 0) {
        throw new Error('No recommendations found');
      }
      
    } catch (dbError) {
      // Fallback to mock data
      recommendations = mockRecommendations.filter(movie => 
        movie.genre.includes(genre)
      );
      
      if (minRating) {
        recommendations = recommendations.filter(movie => 
          movie.rating >= parseFloat(minRating)
        );
      }
      
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
      // Try database first
      const movie = await Movie.findById(movieId);
      
      if (!movie) {
        throw new Error('Movie not found');
      }
      
      // Find movies with similar genres
      similarMovies = await Movie.find({
        _id: { $ne: movieId },
        genre: { $in: movie.genre }
      })
      .sort({ rating: -1 })
      .limit(parseInt(limit))
      .exec();
      
      if (similarMovies.length === 0) {
        throw new Error('No similar movies found');
      }
      
    } catch (dbError) {
      // Fallback to mock data
      const movie = mockRecommendations.find(m => m.id === movieId);
      
      if (!movie) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found'
        });
      }
      
      // Find movies with similar genres
      similarMovies = mockRecommendations
        .filter(m => 
          m.id !== movieId && 
          m.genre.some(g => movie.genre.includes(g))
        )
        .sort((a, b) => b.rating - a.rating)
        .slice(0, parseInt(limit));
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
      // Try database first - get highly rated recent movies
      const cutoffYear = timeframe === 'month' ? 2020 : 2015;
      
      trendingMovies = await Movie.find({
        year: { $gte: cutoffYear },
        rating: { $gte: 8.0 }
      })
      .sort({ rating: -1, year: -1 })
      .limit(parseInt(limit))
      .exec();
      
      if (trendingMovies.length === 0) {
        throw new Error('No trending movies found');
      }
      
    } catch (dbError) {
      // Fallback to mock trending data
      trendingMovies = mockRecommendations
        .filter(movie => movie.rating >= 8.5 && movie.year >= 2008)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, parseInt(limit));
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
