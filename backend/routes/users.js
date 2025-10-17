const express = require('express');
const router = express.Router();
const User = require('../models/User');

// No mock user data - use real database only

// GET /api/user/:id - Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let user;
    
    user = await User.findById(id).populate('favorites');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// POST /api/user - Create new user
router.post('/', async (req, res) => {
  try {
    const { name, email, preferences } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    const user = new User({
      name,
      email,
      preferences: preferences || {
        genres: [],
        directors: [],
        actors: []
      }
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// PUT /api/user/:id - Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('favorites');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// PUT /api/user/:id/favorites - Update user favorites
router.put('/:id/favorites', async (req, res) => {
  try {
    const { id } = req.params;
    const { favorites } = req.body;
    
    if (!Array.isArray(favorites)) {
      return res.status(400).json({
        success: false,
        message: 'Favorites must be an array'
      });
    }
    
    let user;
    
    try {
      user = await User.findByIdAndUpdate(
        id, 
        { favorites }, 
        { new: true, runValidators: true }
      ).populate('favorites');
      
      if (!user) {
        throw new Error('User not found');
      }
    } catch (dbError) {
      return res.status(500).json({
        success: false,
        message: 'Database error updating user favorites',
        error: dbError.message
      });
    }
    
    res.json({
      success: true,
      data: user,
      message: 'Favorites updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating favorites',
      error: error.message
    });
  }
});

// POST /api/user/:id/favorites/:movieId - Add movie to favorites
router.post('/:id/favorites/:movieId', async (req, res) => {
  try {
    const { id, movieId } = req.params;
    
    let user;
    
    try {
      user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      
      await user.addToFavorites(movieId);
      user = await User.findById(id).populate('favorites');
    } catch (dbError) {
      return res.status(500).json({
        success: false,
        message: 'Database error adding movie to favorites',
        error: dbError.message
      });
    }
    
    res.json({
      success: true,
      data: user,
      message: 'Movie added to favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding to favorites',
      error: error.message
    });
  }
});

// DELETE /api/user/:id/favorites/:movieId - Remove movie from favorites
router.delete('/:id/favorites/:movieId', async (req, res) => {
  try {
    const { id, movieId } = req.params;
    
    let user;
    
    try {
      user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      
      await user.removeFromFavorites(movieId);
      user = await User.findById(id).populate('favorites');
    } catch (dbError) {
      return res.status(500).json({
        success: false,
        message: 'Database error removing movie from favorites',
        error: dbError.message
      });
    }
    
    res.json({
      success: true,
      data: user,
      message: 'Movie removed from favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing from favorites',
      error: error.message
    });
  }
});

// GET /api/user/:id/recommendations - Get user recommendations
router.get('/:id/recommendations', async (req, res) => {
  try {
    const { id } = req.params;
    
    let recommendations = [];
    
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      
      recommendations = await user.getRecommendations();
    } catch (dbError) {
      // Fallback to database movies
      const Movie = require('../models/Movie');
      try {
        recommendations = await Movie.find().sort({ rating: -1 }).limit(10);
      } catch (movieError) {
        // No fallback movies - return empty recommendations
        recommendations = [];
      }
    }
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message
    });
  }
});

// POST /api/user/:id/search-history - Add search query to history
router.post('/:id/search-history', async (req, res) => {
  try {
    const { id } = req.params;
    const { query, resultCount = 0 } = req.body;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if this exact query already exists in recent history
    const recentDuplicate = user.searchHistory.find(
      search => search.query.toLowerCase() === query.trim().toLowerCase() &&
      new Date() - search.searchedAt < 60000 // Within last minute
    );
    
    if (!recentDuplicate) {
      // Add new search to history
      user.searchHistory.unshift({
        query: query.trim(),
        resultCount: resultCount,
        searchedAt: new Date()
      });
      
      // Keep only last 50 searches
      if (user.searchHistory.length > 50) {
        user.searchHistory = user.searchHistory.slice(0, 50);
      }
      
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Search history updated',
      data: user.searchHistory.slice(0, 10) // Return recent 10 searches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating search history',
      error: error.message
    });
  }
});

// GET /api/user/:id/search-history - Get user's search history
router.get('/:id/search-history', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;
    
    const user = await User.findById(id).select('searchHistory');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const recentSearches = user.searchHistory
      .sort((a, b) => new Date(b.searchedAt) - new Date(a.searchedAt))
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: recentSearches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching search history',
      error: error.message
    });
  }
});

// DELETE /api/user/:id/search-history - Clear search history
router.delete('/:id/search-history', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.searchHistory = [];
    await user.save();
    
    res.json({
      success: true,
      message: 'Search history cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing search history',
      error: error.message
    });
  }
});

// DELETE /api/user/:id/search-history/:searchId - Delete specific search
router.delete('/:id/search-history/:searchId', async (req, res) => {
  try {
    const { id, searchId } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.searchHistory = user.searchHistory.filter(
      search => search._id.toString() !== searchId
    );
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Search entry deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting search entry',
      error: error.message
    });
  }
});

// POST /api/user/:id/watch-history - Add movie to watch history
router.post('/:id/watch-history', async (req, res) => {
  try {
    const { id } = req.params;
    const { movieData } = req.body;
    
    if (!movieData || !movieData.id) {
      return res.status(400).json({
        success: false,
        message: 'Movie data with ID is required'
      });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if movie already exists in watch history
    const existingIndex = user.watchHistory.findIndex(
      item => item.movieId === movieData.id
    );
    
    const watchItem = {
      movieId: movieData.id,
      title: movieData.title,
      poster_url: movieData.poster_url || movieData.poster,
      rating: movieData.rating || movieData.vote_average,
      watchedAt: new Date()
    };
    
    if (existingIndex !== -1) {
      // Update existing entry with new watch time
      user.watchHistory[existingIndex] = watchItem;
    } else {
      // Add new entry at the beginning
      user.watchHistory.unshift(watchItem);
      
      // Keep only last 50 entries
      if (user.watchHistory.length > 50) {
        user.watchHistory = user.watchHistory.slice(0, 50);
      }
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Movie added to watch history',
      data: user.watchHistory.slice(0, 10) // Return recent 10 entries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding to watch history',
      error: error.message
    });
  }
});

// GET /api/user/:id/watch-history - Get user's watch history
router.get('/:id/watch-history', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20 } = req.query;
    
    const user = await User.findById(id).select('watchHistory');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const recentHistory = user.watchHistory
      .sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt))
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: recentHistory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching watch history',
      error: error.message
    });
  }
});

// DELETE /api/user/:id/watch-history - Clear watch history
router.delete('/:id/watch-history', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.watchHistory = [];
    await user.save();
    
    res.json({
      success: true,
      message: 'Watch history cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing watch history',
      error: error.message
    });
  }
});

module.exports = router;
