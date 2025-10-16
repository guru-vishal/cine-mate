const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const tmdbService = require('../services/tmdbService');

// Mock data for development
const mockMovies = [
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
    id: '2',
    title: 'Interstellar',
    genre: ['Sci-Fi', 'Drama'],
    rating: 8.6,
    poster_url: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.',
    year: 2014,
    duration: 169,
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain']
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
    id: '4',
    title: 'Pulp Fiction',
    genre: ['Crime', 'Drama'],
    rating: 8.9,
    poster_url: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/4cDFJr4HnXN5AdPw4AKrmLlMWdO.jpg',
    description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
    year: 1994,
    duration: 154,
    director: 'Quentin Tarantino',
    cast: ['John Travolta', 'Uma Thurman', 'Samuel L. Jackson']
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
    id: '6',
    title: 'Avengers: Endgame',
    genre: ['Action', 'Adventure', 'Sci-Fi'],
    rating: 8.4,
    poster_url: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    description: 'After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more.',
    year: 2019,
    duration: 181,
    director: 'Russo Brothers',
    cast: ['Robert Downey Jr.', 'Chris Evans', 'Mark Ruffalo']
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
  },
  {
    id: '8',
    title: 'Joker',
    genre: ['Crime', 'Drama', 'Thriller'],
    rating: 8.4,
    poster_url: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg',
    description: 'In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society. He then embarks on a downward spiral of revolution and bloody crime.',
    year: 2019,
    duration: 122,
    director: 'Todd Phillips',
    cast: ['Joaquin Phoenix', 'Robert De Niro', 'Zazie Beetz']
  }
];

// GET /api/movies - Get all movies
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, genre, year, sort = 'rating' } = req.query;
    
    let movies;
    
    try {
      // Try to get from database
      let query = Movie.find();
      
      if (genre) {
        query = query.where('genre').in([genre]);
      }
      
      if (year) {
        query = query.where('year').equals(year);
      }
      
      // Sort options
      const sortOptions = {
        'rating': { rating: -1 },
        'year': { year: -1 },
        'title': { title: 1 }
      };
      
      query = query.sort(sortOptions[sort] || sortOptions.rating);
      
      movies = await query
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
        
      if (movies.length === 0) {
        throw new Error('No movies in database');
      }
    } catch (dbError) {
      // Fallback to mock data
      movies = mockMovies;
      
      // Apply filters to mock data
      if (genre) {
        movies = movies.filter(movie => movie.genre.includes(genre));
      }
      
      if (year) {
        movies = movies.filter(movie => movie.year === parseInt(year));
      }
      
      // Apply sorting
      if (sort === 'year') {
        movies.sort((a, b) => b.year - a.year);
      } else if (sort === 'title') {
        movies.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        movies.sort((a, b) => b.rating - a.rating);
      }
    }
    
    res.json({
      success: true,
      data: movies,
      total: movies.length,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching movies',
      error: error.message
    });
  }
});

// GET /api/movies/search - Search movies
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    let movies;
    
    try {
      // Try database search
      movies = await Movie.find({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { genre: { $regex: q, $options: 'i' } },
          { director: { $regex: q, $options: 'i' } },
          { cast: { $regex: q, $options: 'i' } }
        ]
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1 });
      
      if (movies.length === 0) {
        throw new Error('No search results');
      }
    } catch (dbError) {
      // Fallback to mock data search
      const searchTerm = q.toLowerCase();
      movies = mockMovies.filter(movie => 
        movie.title.toLowerCase().includes(searchTerm) ||
        movie.description.toLowerCase().includes(searchTerm) ||
        movie.genre.some(g => g.toLowerCase().includes(searchTerm)) ||
        movie.director.toLowerCase().includes(searchTerm) ||
        movie.cast.some(actor => actor.toLowerCase().includes(searchTerm))
      );
    }
    
    res.json({
      success: true,
      data: movies,
      total: movies.length,
      query: q
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching movies',
      error: error.message
    });
  }
});

// GET /api/movies/:id - Get movie by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let movie;
    
    try {
      // Try to get from database
      movie = await Movie.findById(id);
      if (!movie) {
        throw new Error('Movie not found in database');
      }
    } catch (dbError) {
      // Fallback to mock data
      movie = mockMovies.find(m => m.id === id);
      if (!movie) {
        return res.status(404).json({
          success: false,
          message: 'Movie not found'
        });
      }
    }
    
    res.json({
      success: true,
      data: movie
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching movie',
      error: error.message
    });
  }
});

// POST /api/movies - Create a new movie (Admin only)
router.post('/', async (req, res) => {
  try {
    const movieData = req.body;
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'genre', 'rating', 'year', 'duration', 'director', 'poster_url'];
    const missingFields = requiredFields.filter(field => !movieData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }
    
    const movie = new Movie(movieData);
    await movie.save();
    
    res.status(201).json({
      success: true,
      data: movie,
      message: 'Movie created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Movie already exists'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error creating movie',
        error: error.message
      });
    }
  }
});

// PUT /api/movies/:id - Update movie
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const movie = await Movie.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    res.json({
      success: true,
      data: movie,
      message: 'Movie updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating movie',
      error: error.message
    });
  }
});

// DELETE /api/movies/:id - Delete movie
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const movie = await Movie.findByIdAndDelete(id);
    
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Movie deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting movie',
      error: error.message
    });
  }
});

module.exports = router;
