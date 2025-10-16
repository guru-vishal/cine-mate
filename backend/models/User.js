const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
    trim: true
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie'
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
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie'
    },
    watchedAt: {
      type: Date,
      default: Date.now
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for email lookup
userSchema.index({ email: 1 });

// Instance method to add movie to favorites
userSchema.methods.addToFavorites = function(movieId) {
  if (!this.favorites.includes(movieId)) {
    this.favorites.push(movieId);
  }
  return this.save();
};

// Instance method to remove movie from favorites
userSchema.methods.removeFromFavorites = function(movieId) {
  this.favorites = this.favorites.filter(fav => !fav.equals(movieId));
  return this.save();
};

// Instance method to get recommendations based on user preferences
userSchema.methods.getRecommendations = async function() {
  const Movie = mongoose.model('Movie');
  
  // Simple recommendation logic based on favorite genres
  const favoriteGenres = this.preferences.genres || [];
  
  if (favoriteGenres.length === 0) {
    // Return popular movies if no preferences
    return await Movie.find().sort({ rating: -1 }).limit(10);
  }
  
  // Find movies in favorite genres that are not in favorites
  return await Movie.find({
    genre: { $in: favoriteGenres },
    _id: { $nin: this.favorites }
  }).sort({ rating: -1 }).limit(10);
};

module.exports = mongoose.model('User', userSchema);
