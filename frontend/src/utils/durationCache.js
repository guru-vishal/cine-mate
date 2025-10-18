import { getMovieDuration } from './durationEstimator';

// Shared cache for movie durations to prevent recalculation across the app
const durationCache = new Map();
const MAX_CACHE_SIZE = 1000; // Limit cache size to prevent memory issues

/**
 * Get cached duration or calculate new one for a movie
 * @param {Object} movie - Movie object
 * @returns {string} - Duration string (e.g., "2h 30min")
 */
export const getCachedMovieDuration = (movie) => {
  if (!movie) return 'Unknown';
  
  // If movie already has a duration set, use it directly
  if (movie.duration) {
    return movie.duration;
  }
  
  // Create a cache key based on movie id and relevant properties
  const cacheKey = `${movie.id}-${movie.runtime || 'no-runtime'}-${
    movie.genre_ids?.join(',') || 
    movie.genres?.map(g => g.name || g).join(',') || 
    movie.genre?.join(',') || 
    'no-genre'
  }`;
  
  // Check if we already have this duration cached
  if (durationCache.has(cacheKey)) {
    return durationCache.get(cacheKey);
  }
  
  // Clear cache if it gets too large
  if (durationCache.size >= MAX_CACHE_SIZE) {
    durationCache.clear();
  }
  
  // Calculate new duration and cache it
  const duration = movie.runtime || getMovieDuration(movie);
  durationCache.set(cacheKey, duration);
  
  return duration;
};

/**
 * Clear the duration cache (useful for testing or memory management)
 */
export const clearDurationCache = () => {
  durationCache.clear();
};

/**
 * Get cache statistics (useful for debugging)
 */
export const getDurationCacheStats = () => {
  return {
    size: durationCache.size,
    maxSize: MAX_CACHE_SIZE,
    keys: Array.from(durationCache.keys()).slice(0, 10) // Show first 10 keys for debugging
  };
};