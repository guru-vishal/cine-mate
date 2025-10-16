const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';

// Authentication middleware
const auth = async (req, res, next) => {
  try {
    // Get token from header
    let token = req.header('Authorization');
    
    // Check if no token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    // Remove 'Bearer ' from token
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Check if user still exists
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is not valid - user not found'
        });
      }

      // Add user to request
      req.user = decoded;
      req.userInfo = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Optional authentication middleware - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.header('Authorization');
    
    if (!token) {
      return next();
    }

    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user) {
        req.user = decoded;
        req.userInfo = user;
      }
    } catch (error) {
      // Continue without authentication if token is invalid
      console.log('Optional auth token invalid:', error.message);
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

module.exports = { auth, optionalAuth };