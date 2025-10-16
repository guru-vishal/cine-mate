const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  genre: [{
    type: String,
    required: true
  }],
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  year: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  director: {
    type: String,
    required: true
  },
  cast: [{
    type: String
  }],
  poster_url: {
    type: String,
    required: true
  },
  backdrop_url: {
    type: String
  },
  imdb_id: {
    type: String,
    unique: true,
    sparse: true
  },
  tmdb_id: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Indexes for better search performance
movieSchema.index({ title: 'text', description: 'text' });
movieSchema.index({ genre: 1 });
movieSchema.index({ rating: -1 });
movieSchema.index({ year: -1 });

// Virtual for URL-friendly title
movieSchema.virtual('slug').get(function() {
  return this.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
});

// Instance method to get similar movies
movieSchema.methods.getSimilarMovies = async function() {
  return await this.constructor.find({
    _id: { $ne: this._id },
    genre: { $in: this.genre }
  }).limit(4).sort({ rating: -1 });
};

module.exports = mongoose.model('Movie', movieSchema);
