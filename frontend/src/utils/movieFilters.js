import { convertGenreIdsToNames } from './genreMapping';

/**
 * Apply filters to an array of movies
 * @param {Array} movies - Array of movies to filter
 * @param {Object} filters - Filter object with genre, language, minRating, maxRating, year
 * @returns {Array} - Filtered movies array
 */
export const applyMovieFilters = (movies, filters) => {
  if (!Array.isArray(movies)) return [];
  
  return movies.filter(movie => {
    // Genre filter
    if (filters.genre) {
      const movieGenres = movie.genre || (movie.genre_ids ? convertGenreIdsToNames(movie.genre_ids) : []);
      if (!Array.isArray(movieGenres) || !movieGenres.some(g => 
        g.toLowerCase().includes(filters.genre.toLowerCase())
      )) {
        return false;
      }
    }

    // Language filter
    if (filters.language) {
      const movieLanguage = movie.language || movie.original_language || '';
      if (movieLanguage !== filters.language) {
        return false;
      }
    }

    // Rating filters
    const movieRating = movie.rating || movie.vote_average || 0;
    
    if (filters.minRating !== undefined && filters.minRating !== null && filters.minRating !== '') {
      const minRating = typeof filters.minRating === 'string' ? parseFloat(filters.minRating) : filters.minRating;
      if (movieRating < minRating) return false;
    }
    
    if (filters.maxRating !== undefined && filters.maxRating !== null && filters.maxRating !== '') {
      const maxRating = typeof filters.maxRating === 'string' ? parseFloat(filters.maxRating) : filters.maxRating;
      if (movieRating > maxRating) return false;
    }

    // Year filters - handle both single year and year range
    const movieYear = movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear() : 0);
    
    // Single year filter (for dropdown)
    if (filters.year) {
      const filterYear = typeof filters.year === 'string' ? parseInt(filters.year) : filters.year;
      if (movieYear !== filterYear) return false;
    }
    
    // Year range filters (for sliders)
    if (filters.minYear !== undefined && filters.minYear !== null && filters.minYear !== '') {
      const minYear = typeof filters.minYear === 'string' ? parseInt(filters.minYear) : filters.minYear;
      if (movieYear < minYear) return false;
    }
    
    if (filters.maxYear !== undefined && filters.maxYear !== null && filters.maxYear !== '') {
      const maxYear = typeof filters.maxYear === 'string' ? parseInt(filters.maxYear) : filters.maxYear;
      if (movieYear > maxYear) return false;
    }

    return true;
  });
};

/**
 * Get default filter state
 * @param {Object} customDefaults - Custom default values to override
 * @returns {Object} - Default filter object
 */
export const getDefaultFilters = (customDefaults = {}) => {
  return {
    language: '',
    genre: '',
    minRating: 0,
    maxRating: 10,
    year: '',
    minYear: '',
    maxYear: '',
    ...customDefaults
  };
};