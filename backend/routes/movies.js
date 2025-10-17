const express = require('express');
const router = express.Router();
const tmdbService = require('../services/tmdbService');

// Rate limiting disabled for development (can be re-enabled for production)
// let lastRequestTime = 0;
// const MIN_REQUEST_INTERVAL = 100; // 100ms between requests

// GET /api/movies - Get all movies (primary endpoint with TMDB integration)
router.get('/', async (req, res) => {
  try {
    // Rate limiting disabled for development
    // const now = Date.now();
    // if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    //   return res.status(429).json({
    //     success: false,
    //     message: 'Too many requests. Please wait before making another request.',
    //     retryAfter: MIN_REQUEST_INTERVAL - (now - lastRequestTime)
    //   });
    // }
    // lastRequestTime = now;
    const { 
      page = 1, 
      limit = 20, 
      genre, 
      year, 
      sort = 'popular',
      category = 'mixed',
      all = false 
    } = req.query;
    
    let movies = [];
    
    try {
      // Get movies from TMDB based on category
      let tmdbResponse;
      switch (category.toLowerCase()) {
        case 'popular':
          // Get top 100 popular movies instead of just one page
          tmdbResponse = await tmdbService.getPopularMovies();
          movies = tmdbResponse.results || tmdbResponse;
          break;
        case 'top_rated':
        case 'toprated':
          // Get top 100 movies instead of just one page
          tmdbResponse = await tmdbService.getTopRatedMovies();
          movies = tmdbResponse.results || tmdbResponse;
          break;
        case 'upcoming':
          tmdbResponse = await tmdbService.getUpcomingMovies(page);
          movies = tmdbResponse.results || tmdbResponse;
          break;
        case 'mixed':
        default:
          if (all === 'true') {
            // Fetch extensive collection for home page (up to 2000 movies)
            movies = await tmdbService.getExtensiveMovieCollection();
          } else {
            movies = await tmdbService.getMixedMovies(parseInt(limit));
          }
          break;
      }

      // Apply filters if specified
      if (genre) {
        movies = movies.filter(movie => {
          // Handle both TMDB format (genre_ids) and database format (genre)
          if (movie.genre_ids) {
            // TMDB format - would need genre ID mapping for proper filtering
            return true; // Skip genre filtering for TMDB format for now
          } else if (movie.genre) {
            // Database format
            return movie.genre.some(g => g.toLowerCase().includes(genre.toLowerCase()));
          }
          return false;
        });
      }
      
      if (year) {
        movies = movies.filter(movie => {
          // Handle both TMDB format (release_date) and database format (year)
          if (movie.release_date) {
            // TMDB format
            return new Date(movie.release_date).getFullYear() === parseInt(year);
          } else if (movie.year) {
            // Database format  
            return movie.year === parseInt(year);
          }
          return false;
        });
      }
      
      // Apply sorting with dual format support
      if (sort === 'year') {
        movies.sort((a, b) => {
          const yearA = a.release_date ? new Date(a.release_date).getFullYear() : (a.year || 0);
          const yearB = b.release_date ? new Date(b.release_date).getFullYear() : (b.year || 0);
          return yearB - yearA;
        });
      } else if (sort === 'title') {
        movies.sort((a, b) => {
          const titleA = a.title || a.original_title || '';
          const titleB = b.title || b.original_title || '';
          return titleA.localeCompare(titleB);
        });
      } else if (sort === 'rating') {
        movies.sort((a, b) => {
          const ratingA = a.vote_average || a.rating || 0;
          const ratingB = b.vote_average || b.rating || 0;
          return ratingB - ratingA;
        });
      }
      
      // Paginate if not mixed category, not top_rated, and not popular (these return all 100 movies)
      if (category !== 'mixed' && category !== 'top_rated' && category !== 'toprated' && category !== 'popular') {
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        movies = movies.slice(startIndex, startIndex + parseInt(limit));
      }

      // Transform TMDB image paths to full URLs
      movies = movies.map(movie => {
        if (movie.poster_path || movie.backdrop_path) {
          return {
            ...movie,
            poster_url: movie.poster_path 
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : 'https://via.placeholder.com/500x750/374151/ffffff?text=No+Image',
            backdrop_url: movie.backdrop_path
              ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
              : 'https://via.placeholder.com/1920x1080/374151/ffffff?text=No+Image'
          };
        }
        return movie;
      });

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

// GET /api/movies/progressive - Progressive movie loading with streaming results
router.get('/progressive', async (req, res) => {
  try {
    console.log(`🎬 Progressive movies endpoint called`);
    
    // Set headers for Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    let allResults = [];
    const seenIds = new Set();
    
    try {
      // Use progressive movie collection generator
      for await (const chunk of tmdbService.getMoviesProgressive()) {
        // Filter out duplicates
        const newMovies = chunk.results.filter(movie => {
          if (seenIds.has(movie.id)) {
            return false;
          }
          seenIds.add(movie.id);
          return true;
        });
        
        if (newMovies.length > 0) {
          allResults.push(...newMovies);
          
          const data = {
            success: true,
            data: newMovies,
            total_movies_so_far: allResults.length,
            source: chunk.source,
            page: chunk.page,
            is_complete: chunk.is_complete
          };
          
          // Send this chunk as Server-Sent Event
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        }
        
        // If complete, break
        if (chunk.is_complete) {
          break;
        }
      }
      
      console.log(`✅ Progressive movies complete: ${allResults.length} total movies sent`);
      
    } catch (error) {
      console.error('Progressive movies error:', error.message);
      const errorData = {
        success: false,
        message: 'Error in progressive movie loading',
        error: error.message
      };
      res.write(`data: ${JSON.stringify(errorData)}\n\n`);
    }
    
    // Close the connection
    res.write('event: close\ndata: {}\n\n');
    res.end();
    
  } catch (error) {
    console.error('Progressive movies endpoint error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error in progressive movie loading',
      error: error.message
    });
  }
});

// GET /api/movies/search/progressive - Progressive search with streaming results
router.get('/search/progressive', async (req, res) => {
  try {
    const { q } = req.query;
    
    console.log(`🔍 Progressive search endpoint called for: "${q}"`);
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Set headers for Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    let allResults = [];
    
    try {
      // Use progressive search generator
      for await (const chunk of tmdbService.searchMoviesProgressive(q)) {
        allResults.push(...chunk.results);
        
        const data = {
          success: true,
          data: chunk.results,
          total_results_so_far: allResults.length,
          total_available: chunk.total_results,
          current_page: chunk.current_page,
          is_complete: chunk.is_complete,
          query: q
        };
        
        // Send this chunk as Server-Sent Event
        res.write(`data: ${JSON.stringify(data)}\n\n`);
        
        // If complete, break
        if (chunk.is_complete) {
          break;
        }
      }
      
      console.log(`✅ Progressive search complete: ${allResults.length} total results sent`);
      
    } catch (error) {
      console.error('Progressive search error:', error.message);
      const errorData = {
        success: false,
        message: 'Error in progressive search',
        error: error.message
      };
      res.write(`data: ${JSON.stringify(errorData)}\n\n`);
    }
    
    // Close the connection
    res.write('event: close\ndata: {}\n\n');
    res.end();
    
  } catch (error) {
    console.error('Progressive search endpoint error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error in progressive search',
      error: error.message
    });
  }
});

// GET /api/movies/search - Search movies via TMDB
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit, all = false } = req.query;
    
    console.log(`🔍 Search endpoint called with params:`, { q, page, limit, all });
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    let movies = [];
    let searchSource = 'Database';
    
    try {
      // Search using TMDB - use comprehensive search if 'all' is requested or no limit specified
      if (all === 'true' || !limit) {
        console.log(`🔍 Using comprehensive TMDB search for: "${q}"`);
        const tmdbResponse = await tmdbService.searchAllMovies(q);
        console.log(`📡 TMDB Comprehensive Response: ${tmdbResponse.results?.length || 0} results`);
        movies = tmdbResponse.results || [];
      } else {
        console.log(`🔍 Using paginated TMDB search for: "${q}" (page ${page}, limit ${limit})`);
        const tmdbResponse = await tmdbService.searchMovies(q, page);
        console.log(`📡 TMDB Paginated Response: ${tmdbResponse.results?.length || 0} results`);
        movies = tmdbResponse.results || [];
        
        // Apply limit only if specified
        if (limit) {
          movies = movies.slice(0, parseInt(limit));
          console.log(`✂️ Applied limit: ${movies.length} results after limiting to ${limit}`);
        }
      }
      
      searchSource = 'TMDB';
      
      console.log(`✅ Final TMDB results: ${movies.length} movies`);
      
    } catch (tmdbError) {
      console.error('TMDB Search Error:', tmdbError.message);
      
      // Fallback to database search
      console.log('🔄 Falling back to database search...');
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
        
        searchSource = 'Database';
        console.log(`📂 Using database results: ${movies.length} movies`);
        
      } catch (dbError) {
        console.error('Database Search Error:', dbError.message);
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
      source: searchSource
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
      const tmdbMovie = await tmdbService.getMovieDetails(id);
      
      if (tmdbMovie) {
        // Get credits for director and cast
        const credits = await tmdbService.getMovieCredits(id);
        const director = credits.crew?.find(person => person.job === 'Director')?.name || 'Unknown';
        const cast = credits.cast?.slice(0, 5).map(person => person.name) || [];
        
        // Transform TMDB data to match frontend expectations
        movie = {
          id: tmdbMovie.id,
          tmdb_id: tmdbMovie.id,
          title: tmdbMovie.title,
          description: tmdbMovie.overview || 'No description available',
          genre: tmdbMovie.genres ? tmdbMovie.genres.map(g => g.name) : ['Unknown'],
          rating: tmdbMovie.vote_average || 0,
          year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null,
          duration: tmdbMovie.runtime || null,
          director: director,
          cast: cast,
          poster_url: tmdbMovie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
            : 'https://via.placeholder.com/500x750/374151/ffffff?text=No+Image',
          backdrop_url: tmdbMovie.backdrop_path
            ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}`
            : 'https://via.placeholder.com/1920x1080/374151/ffffff?text=No+Image',
          release_date: tmdbMovie.release_date,
          popularity: tmdbMovie.popularity || 0,
          vote_count: tmdbMovie.vote_count || 0,
          language: tmdbMovie.original_language || 'en',
          original_language: tmdbMovie.original_language || 'en',
          tagline: tmdbMovie.tagline || '',
          budget: tmdbMovie.budget || 0,
          revenue: tmdbMovie.revenue || 0,
          watch_providers: [] // Will need separate API call for watch providers
        };
      } else {
        throw new Error('Movie not found in TMDB');
      }
      
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

// GET /api/movies/log-top-100 - Log top 100 rated movies to console
router.get('/log-top-100', async (req, res) => {
  try {
    console.log('📝 Top 100 movies logging endpoint called...');
    const top100Movies = await tmdbService.logTop100RatedMovies();
    
    res.json({
      success: true,
      message: 'Top 100 movies logged to console',
      count: top100Movies.length,
      data: top100Movies.map(movie => ({ 
        title: movie.title, 
        rating: movie.vote_average, 
        year: movie.release_date?.substring(0, 4) 
      }))
    });
    
  } catch (error) {
    console.error('❌ Error in log-top-100 endpoint:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error logging top 100 movies',
      error: error.message
    });
  }
});

// GET /api/movies/log-popular-100 - Log top 100 popular movies to console
router.get('/log-popular-100', async (req, res) => {
  try {
    console.log('📝 Top 100 popular movies logging endpoint called...');
    const top100PopularMovies = await tmdbService.logTop100PopularMovies();
    
    res.json({
      success: true,
      message: 'Top 100 popular movies logged to console',
      count: top100PopularMovies.length,
      data: top100PopularMovies.map(movie => ({ 
        title: movie.title, 
        rating: movie.vote_average, 
        year: movie.release_date?.substring(0, 4) 
      }))
    });
    
  } catch (error) {
    console.error('❌ Error in log-popular-100 endpoint:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error logging top 100 popular movies',
      error: error.message
    });
  }
});

module.exports = router;