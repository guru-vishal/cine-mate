const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const router = express.Router();

// JWT Secret (should be in environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    // Validate required fields
    if (!username || !name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmailOrUsername(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or username'
      });
    }

    // Create new user
    const user = new User({
      username,
      name,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        favorites: user.favorites,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Validate required fields
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password'
      });
    }

    // Find user by email or username
    const user = await User.findByEmailOrUsername(identifier);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        favorites: user.favorites,
        preferences: user.preferences,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }



    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        favorites: user.favorites,
        preferences: user.preferences,
        watchHistory: user.watchHistory,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    if (name) user.name = name;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        favorites: user.favorites,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// @route   POST /api/auth/favorites/:movieId
// @desc    Add movie to favorites
// @access  Private
router.post('/favorites/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const movieData = req.body;

    console.log('=== BACKEND DEBUG ===');
    console.log('movieId from params:', movieId);
    console.log('movieData from body:', JSON.stringify(movieData, null, 2));
    console.log('movieData.poster:', movieData.poster);
    console.log('movieData.genre:', movieData.genre);
    console.log('movieData.description:', movieData.description);
    console.log('=== END BACKEND DEBUG ===');

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already in favorites
    if (user.isFavorite(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Movie already in favorites'
      });
    }

    const favoriteData = {
      id: movieId,
      ...movieData
    };

    console.log('=== CALLING addToFavorites ===');
    console.log('favoriteData:', JSON.stringify(favoriteData, null, 2));

    await user.addToFavorites(favoriteData);

    res.json({
      success: true,
      message: 'Movie added to favorites',
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding to favorites'
    });
  }
});

// @route   DELETE /api/auth/favorites/:movieId
// @desc    Remove movie from favorites
// @access  Private
router.delete('/favorites/:movieId', auth, async (req, res) => {
  try {
    const { movieId } = req.params;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.removeFromFavorites(movieId);

    res.json({
      success: true,
      message: 'Movie removed from favorites',
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error removing from favorites'
    });
  }
});

// @route   GET /api/auth/favorites
// @desc    Get user's favorite movies
// @access  Private
router.get('/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Fetch favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching favorites'
    });
  }
});

// @route   DELETE /api/auth/favorites
// @desc    Clear all favorites
// @access  Private
router.delete('/favorites', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Clear all favorites
    user.favorites = [];
    await user.save();

    res.json({
      success: true,
      message: 'All favorites cleared successfully',
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Clear favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error clearing favorites'
    });
  }
});

// @route   PUT /api/auth/favorites
// @desc    Update user's entire favorites list
// @access  Private
router.put('/favorites', auth, async (req, res) => {
  try {
    const { favorites } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Replace entire favorites array
    user.favorites = favorites.map(fav => ({
      movieId: fav.movieId,
      title: fav.title,
      poster: fav.posterPath || fav.poster,
      rating: fav.rating,
      year: fav.releaseDate ? new Date(fav.releaseDate).getFullYear().toString() : fav.year,
      genre: fav.genre || []
    }));

    await user.save();

    res.json({
      success: true,
      message: 'Favorites updated successfully',
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Update favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating favorites'
    });
  }
});

// @route   GET /api/auth/recommendations
// @desc    Get personalized movie recommendations
// @access  Private
router.get('/recommendations', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const recommendations = await user.getRecommendations();

    res.json({
      success: true,
      recommendations,
      favoriteGenres: user.getFavoriteGenres()
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting recommendations'
    });
  }
});

// @route   POST /api/auth/verify-token
// @desc    Verify JWT token
// @access  Private
router.post('/verify-token', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    userId: req.user.userId
  });
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;