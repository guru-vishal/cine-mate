const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const tmdbService = require('../services/tmdbService');

// GET /api/movies - Get all movies (primary endpoint with TMDB integration)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      genre, 
      year, 
      sort = 'popular',
      category = 'mixed' 
    } = req.query;
    
    let movies = [];
    
    try {
      // Get movies from TMDB based on category
      switch (category.toLowerCase()) {
        case 'popular':
          movies = await tmdbService.getPopularMovies(page);
          break;
        case 'top_rated':
        case 'toprated':
          movies = await tmdbService.getTopRatedMovies(page);
          break;
        case 'now_playing':
        case 'nowplaying':
          movies = await tmdbService.getNowPlayingMovies(page);
          break;
        case 'upcoming':
          movies = await tmdbService.getUpcomingMovies(page);
          break;
        case 'mixed':
        default:
          movies = await tmdbService.getMixedMovies(parseInt(limit));
          break;
      }

      // Apply filters if specified
      if (genre) {
        movies = movies.filter(movie => 
          movie.genre.some(g => g.toLowerCase().includes(genre.toLowerCase()))
        );
      }
      
      if (year) {
        movies = movies.filter(movie => movie.year === parseInt(year));
      }
      
      // Apply sorting
      if (sort === 'year') {
        movies.sort((a, b) => b.year - a.year);
      } else if (sort === 'title') {
        movies.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sort === 'rating') {
        movies.sort((a, b) => b.rating - a.rating);
      }
      
      // Paginate if not mixed category (mixed is already limited)
      if (category !== 'mixed') {
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        movies = movies.slice(startIndex, startIndex + parseInt(limit));
      }

    } catch (tmdbError) {
      console.error('TMDB API Error:', tmdbError.message);
      
      // Fallback to database if available
      try {
        let query = Movie.find();
        
        if (genre) {
          query = query.where('genre').in([genre]);
        }
        
        if (year) {
          query = query.where('year').equals(year);
        }
        
        const sortOptions = {
          'rating': { rating: -1 },
          'year': { year: -1 },
          'title': { title: 1 },
          'popular': { popularity: -1 }
        };
        
        query = query.sort(sortOptions[sort] || sortOptions.popular);
        
        movies = await query
          .limit(parseInt(limit))
          .skip((parseInt(page) - 1) * parseInt(limit))
          .exec();
          
      } catch (dbError) {
        // If both TMDB and database fail, return error
        return res.status(503).json({
          success: false,
          message: 'Movie service temporarily unavailable',
          error: 'Both TMDB API and database are unavailable'
        });
      }
    }
    
    res.json({
      success: true,
      data: movies,
      total: movies.length,
      page: parseInt(page),
      limit: parseInt(limit),
      category: category,
      source: movies.length > 0 ? 'TMDB' : 'Database'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching movies',
      error: error.message
    });
  }
});

// GET /api/movies/search - Search movies via TMDB
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    let movies = [];
    
    try {
      // Search using TMDB
      movies = await tmdbService.searchMovies(q, page);
      
      // Limit results
      movies = movies.slice(0, parseInt(limit));
      
    } catch (tmdbError) {
      console.error('TMDB Search Error:', tmdbError.message);
      
      // Fallback to database search
      try {
        movies = await Movie.find({
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { genre: { $regex: q, $options: 'i' } },
            { director: { $regex: q, $options: 'i' } },
            { cast: { $regex: q, $options: 'i' } }
          ]
        })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ rating: -1 });
        
      } catch (dbError) {
        return res.status(503).json({
          success: false,
          message: 'Search service temporarily unavailable',
          error: 'Both TMDB API and database search are unavailable'
        });
      }
    }
    
    res.json({
      success: true,
      data: movies,
      total: movies.length,
      query: q,
      page: parseInt(page),
      source: movies.length > 0 ? 'TMDB' : 'Database'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching movies',
      error: error.message
    });
  }
});

// GET /api/movies/genres - Get all available genres
router.get('/genres', async (req, res) => {
  try {
    let genres = [];
    
    try {
      // Get genres from TMDB
      genres = await tmdbService.getGenres();
    } catch (tmdbError) {
      console.error('TMDB Genres Error:', tmdbError.message);
      
      // Fallback to default genres
      genres = [
        { id: 28, name: 'Action' },
        { id: 12, name: 'Adventure' },
        { id: 16, name: 'Animation' },
        { id: 35, name: 'Comedy' },
        { id: 80, name: 'Crime' },
        { id: 99, name: 'Documentary' },
        { id: 18, name: 'Drama' },
        { id: 10751, name: 'Family' },
        { id: 14, name: 'Fantasy' },
        { id: 36, name: 'History' },
        { id: 27, name: 'Horror' },
        { id: 10402, name: 'Music' },
        { id: 9648, name: 'Mystery' },
        { id: 10749, name: 'Romance' },
        { id: 878, name: 'Science Fiction' },
        { id: 10770, name: 'TV Movie' },
        { id: 53, name: 'Thriller' },
        { id: 10752, name: 'War' },
        { id: 37, name: 'Western' }
      ];
    }
    
    res.json({
      success: true,
      data: genres
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching genres',
      error: error.message
    });
  }
});

// GET /api/movies/genre/:genreId - Get movies by genre
router.get('/genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    let movies = [];
    
    try {
      // Get movies by genre from TMDB
      movies = await tmdbService.getMoviesByGenre(genreId, page);
      
      // Limit results
      movies = movies.slice(0, parseInt(limit));
      
    } catch (tmdbError) {
      console.error('TMDB Genre Movies Error:', tmdbError.message);
      
      return res.status(503).json({
        success: false,
        message: 'Genre movie service temporarily unavailable',
        error: tmdbError.message
      });
    }
    
    res.json({
      success: true,
      data: movies,
      total: movies.length,
      genreId: genreId,
      page: parseInt(page)
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching movies by genre',
      error: error.message
    });
  }
});

// GET /api/movies/:id/similar - Get similar movies
router.get('/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    let movies = [];
    
    try {
      // Get similar movies from TMDB
      movies = await tmdbService.getSimilarMovies(id, page);
      
      // Limit results
      movies = movies.slice(0, parseInt(limit));
      
    } catch (tmdbError) {
      console.error('TMDB Similar Movies Error:', tmdbError.message);
      
      return res.status(503).json({
        success: false,
        message: 'Similar movies service temporarily unavailable',
        error: tmdbError.message
      });
    }
    
    res.json({
      success: true,
      data: movies,
      total: movies.length,
      movieId: id
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching similar movies',
      error: error.message
    });
  }
});

// GET /api/movies/:id/recommendations - Get movie recommendations
router.get('/:id/recommendations', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    let movies = [];
    
    try {
      // Get recommendations from TMDB
      movies = await tmdbService.getMovieRecommendations(id, page);
      
      // Limit results
      movies = movies.slice(0, parseInt(limit));
      
    } catch (tmdbError) {
      console.error('TMDB Recommendations Error:', tmdbError.message);
      
      return res.status(503).json({
        success: false,
        message: 'Recommendations service temporarily unavailable',
        error: tmdbError.message
      });
    }
    
    res.json({
      success: true,
      data: movies,
      total: movies.length,
      movieId: id
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message
    });
  }
});

// GET /api/movies/:id - Get movie details by TMDB ID (moved to end to avoid route conflicts)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let movie;
    
    try {
      // Get detailed movie info from TMDB
      movie = await tmdbService.getMovieDetails(id);
      
    } catch (tmdbError) {
      console.error('TMDB Movie Details Error:', tmdbError.message);
      
      // Fallback to database
      try {
        // Try to find by tmdb_id first, then by _id
        movie = await Movie.findOne({ tmdb_id: id }) || await Movie.findById(id);
        
        if (!movie) {
          return res.status(404).json({
            success: false,
            message: 'Movie not found'
          });
        }
      } catch (dbError) {
        // Create a fallback movie object with basic information
        movie = {
          id: id.toString(),
          tmdb_id: id.toString(),
          title: 'Unknown Movie',
          description: 'Movie details are currently unavailable. Please try again later.',
          genre: ['Unknown'],
          rating: 0,
          year: null,
          duration: null,
          director: 'Unknown',
          cast: [],
          poster_url: 'https://via.placeholder.com/500x750/374151/ffffff?text=No+Image',
          backdrop_url: 'https://via.placeholder.com/1920x1080/374151/ffffff?text=No+Image',
          release_date: null,
          popularity: 0,
          vote_count: 0,
          language: 'English',
          original_language: 'en',
          watch_providers: [] // Empty array when no real data is available
        };
      }
    }
    
    res.json({
      success: true,
      data: movie
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching movie details',
      error: error.message
    });
  }
});

module.exports = router;