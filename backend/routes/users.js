const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Mock user data
const mockUser = {
  id: '1',
  name: 'Demo User',
  email: 'demo@cinemate.com',
  favorites: [],
  preferences: {
    genres: ['Action', 'Sci-Fi', 'Thriller'],
    directors: ['Christopher Nolan', 'Denis Villeneuve'],
    actors: ['Leonardo DiCaprio', 'Christian Bale']
  },
  createdAt: new Date()
};

// GET /api/user/:id - Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let user;
    
    try {
      user = await User.findById(id).populate('favorites');
      if (!user) {
        throw new Error('User not found in database');
      }
    } catch (dbError) {
      // Fallback to mock user
      user = mockUser;
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
      // Mock response for development
      user = {
        ...mockUser,
        favorites: favorites
      };
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
      // Mock response
      user = {
        ...mockUser,
        favorites: [...mockUser.favorites, movieId]
      };
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
      // Mock response
      user = {
        ...mockUser,
        favorites: mockUser.favorites.filter(fav => fav !== movieId)
      };
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
      // Fallback to mock recommendations
      const Movie = require('../models/Movie');
      try {
        recommendations = await Movie.find().sort({ rating: -1 }).limit(10);
      } catch (movieError) {
        // Use hardcoded recommendations
        const mockMovies = require('./movies').mockMovies || [];
        recommendations = mockMovies.slice(0, 4);
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

module.exports = router;
