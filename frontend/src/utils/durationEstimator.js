/**
 * Estimate movie duration based on genre and type
 * This is a fallback when actual runtime data is not available
 */

// Import genre conversion utility
import { convertGenreIdsToNames } from './genreMapping';

// Average durations by genre (in minutes)
const genreDurations = {
  // Long genres
  'Drama': 140,
  'Epic': 160,
  'Biography': 135,
  'History': 145,
  'War': 150,
  
  // Medium-long genres
  'Action': 120,
  'Adventure': 125,
  'Crime': 130,
  'Thriller': 115,
  'Mystery': 110,
  'Sci-Fi': 125,
  'Science Fiction': 125,
  'Fantasy': 130,
  'Romance': 105,
  
  // Medium genres
  'Comedy': 100,
  'Horror': 95,
  'Western': 115,
  'Musical': 110,
  'Family': 95,
  'Animation': 90,
  
  // Shorter genres
  'Documentary': 85,
  'Short': 30,
  'TV Movie': 90
};

/**
 * Estimate duration based on movie genres
 * @param {Array} genres - Array of genre names
 * @returns {number} - Estimated duration in minutes
 */
export const estimateDuration = (genres) => {
  if (!genres || genres.length === 0) {
    return 110; // Default movie length
  }

  // Find the longest estimated duration from the movie's genres
  let maxDuration = 90; // Minimum default
  
  genres.forEach(genre => {
    const genreName = typeof genre === 'string' ? genre : genre.name;
    if (genreDurations[genreName]) {
      maxDuration = Math.max(maxDuration, genreDurations[genreName]);
    }
  });

  // Add some randomness to make it more realistic (-10 to +15 minutes)
  const randomOffset = Math.floor(Math.random() * 26) - 10;
  return Math.max(80, maxDuration + randomOffset); // Ensure minimum 80 minutes
};

/**
 * Get duration with fallback to estimation
 * @param {Object} movie - Movie object
 * @returns {number} - Duration in minutes (actual or estimated)
 */
export const getMovieDuration = (movie) => {
  // Priority 1: If we have actual runtime data from TMDB, use it
  if (movie.runtime && movie.runtime > 0) {
    return movie.runtime;
  }

  // Priority 2: If we have stored duration data, use it
  if (movie.duration && movie.duration > 0) {
    return movie.duration;
  }

  // Priority 3: Estimate based on genres
  const genres = movie.genre || 
                (movie.genre_ids ? convertGenreIdsToNames(movie.genre_ids) : []) || // Fixed: now properly converts genre IDs
                (movie.genres ? movie.genres : []) ||
                [];
                
  const estimated = estimateDuration(genres);
  return estimated;
};