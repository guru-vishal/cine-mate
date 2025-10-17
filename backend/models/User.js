const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  favorites: [{
    movieId: {
      type: String,
      required: true
    },
    title: String,
    poster: String, // Full image URL (e.g., https://image.tmdb.org/t/p/w500/abc123.jpg)
    description: String,
    rating: Number,
    year: String,
    genre: [String],
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    genres: [{
      type: String
    }],
    directors: [{
      type: String
    }],
    actors: [{
      type: String
    }]
  },
  watchHistory: [{
    movieId: {
      type: String,
      required: true
    },
    title: String,
    poster_url: String,
    rating: Number,
    watchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  searchHistory: [{
    query: {
      type: String,
      required: true,
      trim: true
    },
    searchedAt: {
      type: Date,
      default: Date.now
    },
    resultCount: {
      type: Number,
      default: 0
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
// userSchema.index({ email: 1 });
// userSchema.index({ username: 1 });
// userSchema.index({ 'favorites.movieId': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Add movie to favorites
userSchema.methods.addToFavorites = async function(movieData) {
  console.log('=== USER MODEL DEBUG ===');
  console.log('addToFavorites received:', JSON.stringify(movieData, null, 2));
  
  const existingIndex = this.favorites.findIndex(
    fav => fav.movieId === movieData.id.toString()
  );
  
  if (existingIndex === -1) {
    const favoriteItem = {
      movieId: movieData.id.toString(),
      title: movieData.title,
      poster: movieData.poster,
      description: movieData.description,
      rating: movieData.rating,
      year: movieData.year,
      genre: movieData.genre || []
    };
    
    console.log('Creating favorite item:', JSON.stringify(favoriteItem, null, 2));
    this.favorites.push(favoriteItem);
    
    console.log('Favorites array before save:', JSON.stringify(this.favorites, null, 2));
  }
  
  const result = await this.save();
  console.log('Favorites array after save:', JSON.stringify(this.favorites, null, 2));
  console.log('=== END USER MODEL DEBUG ===');
  
  return result;
};

// Remove movie from favorites
userSchema.methods.removeFromFavorites = async function(movieId) {
  this.favorites = this.favorites.filter(
    fav => fav.movieId !== movieId.toString()
  );
  return await this.save();
};

// Check if movie is in favorites
userSchema.methods.isFavorite = function(movieId) {
  return this.favorites.some(fav => fav.movieId === movieId.toString());
};

// Get user's favorite genres based on their favorites
userSchema.methods.getFavoriteGenres = function() {
  const genreCounts = {};
  
  // Count genres from favorited movies
  this.favorites.forEach(movie => {
    if (movie.genre && Array.isArray(movie.genre)) {
      movie.genre.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    }
  });
  
  // Return top 5 genres
  return Object.entries(genreCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre);
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpire;
  return user;
};

// Static method to find user by email or username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  });
};

// Instance method to get recommendations based on user preferences
userSchema.methods.getRecommendations = async function() {
  const Movie = mongoose.model('Movie');
  
  // Get favorite genres from user's favorites
  const favoriteGenres = this.getFavoriteGenres();
  
  if (favoriteGenres.length === 0) {
    // Return popular movies if no preferences
    return await Movie.find().sort({ rating: -1 }).limit(10);
  }
  
  // Find movies in favorite genres that are not in favorites
  const favoriteMovieIds = this.favorites.map(fav => fav.movieId);
  
  return await Movie.find({
    genre: { $in: favoriteGenres },
    _id: { $nin: favoriteMovieIds }
  }).sort({ rating: -1 }).limit(10);
};

module.exports = mongoose.model('User', userSchema);
