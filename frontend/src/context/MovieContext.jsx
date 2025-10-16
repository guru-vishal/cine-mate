import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { movieService } from '../services/movieService';
import { useAuth } from './AuthContext';
import { convertGenreIdsToNames, convertGenreNamesToIds } from '../utils/genreMapping';

const MovieContext = createContext();

const initialState = {
  movies: [],
  favorites: JSON.parse(localStorage.getItem('favorites')) || [],
  loading: false,
  error: null,
  searchResults: [],
  recommendations: [],
  personalizedRecommendations: [],
  watchHistory: [],
  genres: [],
  userPreferences: {},
};

const movieReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_MOVIES':
      return { ...state, movies: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'ADD_TO_FAVORITES': {
      const newFavorites = [...state.favorites, action.payload];
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      return { ...state, favorites: newFavorites };
    }
    case 'REMOVE_FROM_FAVORITES': {
      const filteredFavorites = state.favorites.filter(movie => movie.id !== action.payload);
      localStorage.setItem('favorites', JSON.stringify(filteredFavorites));
      return { ...state, favorites: filteredFavorites };
    }
    case 'SET_FAVORITES':
      return { ...state, favorites: action.payload };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload, loading: false };
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload };
    case 'SET_PERSONALIZED_RECOMMENDATIONS':
      return { ...state, personalizedRecommendations: action.payload };
    case 'ADD_TO_WATCH_HISTORY': {
      const newHistory = [action.payload, ...state.watchHistory.filter(item => item.id !== action.payload.id)].slice(0, 50);
      localStorage.setItem('watchHistory', JSON.stringify(newHistory));
      return { ...state, watchHistory: newHistory };
    }
    case 'SET_WATCH_HISTORY':
      return { ...state, watchHistory: action.payload };
    case 'SET_GENRES':
      return { ...state, genres: action.payload };
    case 'SET_USER_PREFERENCES':
      return { ...state, userPreferences: action.payload };
    case 'CLEAR_USER_DATA':
      return { 
        ...state, 
        favorites: [], 
        personalizedRecommendations: [], 
        watchHistory: [], 
        userPreferences: {} 
      };
    default:
      return state;
  }
};

export const MovieProvider = ({ children }) => {
  const [state, dispatch] = useReducer(movieReducer, initialState);
  const { user } = useAuth();

  // Sync user data with authentication
  useEffect(() => {
    if (user) {
      // User is authenticated - sync with server data
      if (user.favorites && Array.isArray(user.favorites)) {
        // Convert MongoDB favorites format to MovieContext format
        const convertedFavorites = user.favorites.map(fav => {
          return {
            id: parseInt(fav.movieId) || fav.movieId,
            title: fav.title || 'Untitled Movie',
            poster_path: fav.poster, // This is now the full URL from MongoDB
            poster_url: fav.poster, // Same as poster_path since we store full URLs
            overview: fav.description || 'No description available.',
            vote_average: fav.rating || 0,
            release_date: fav.year ? `${fav.year}-01-01` : '',
            genre_ids: convertGenreNamesToIds(fav.genre || []),
            genres: fav.genre || [] // Keep both for compatibility
          };
        });
        dispatch({ type: 'SET_FAVORITES', payload: convertedFavorites });
      }
      
      // Load user preferences and watch history
      if (user.preferences) {
        dispatch({ type: 'SET_USER_PREFERENCES', payload: user.preferences });
      }
      
      // Get personalized recommendations after a delay
      // Note: getPersonalizedRecommendations will be called after it's defined
    } else {
      // User logged out - load guest data from localStorage
      const localFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
      const localWatchHistory = JSON.parse(localStorage.getItem('watchHistory')) || [];
      
      dispatch({ type: 'SET_FAVORITES', payload: localFavorites });
      dispatch({ type: 'SET_WATCH_HISTORY', payload: localWatchHistory });
      dispatch({ type: 'CLEAR_USER_DATA' });
    }
  }, [user]);

  // Load watch history on component mount
  useEffect(() => {
    if (!user) {
      const localWatchHistory = JSON.parse(localStorage.getItem('watchHistory')) || [];
      dispatch({ type: 'SET_WATCH_HISTORY', payload: localWatchHistory });
    }
  }, [user]);

  // Get personalized recommendations based on user's favorites and preferences
  const getPersonalizedRecommendations = useCallback(async () => {
    if (!user) return;

    try {
      // Get recommendations based on user's favorite genres and movies
      let recommendations = [];

      if (state.favorites.length > 0) {
        // Get genres from user's favorites
        const favoriteGenres = [...new Set(
          state.favorites.flatMap(movie => movie.genre || [])
        )];

        // Get movies from favorite genres
        const genreRecommendations = state.movies.filter(movie => 
          movie.genre && movie.genre.some(g => favoriteGenres.includes(g)) &&
          !state.favorites.some(fav => fav.id === movie.id)
        ).slice(0, 8);

        recommendations = genreRecommendations;
      }

      // If not enough recommendations, fill with popular movies
      if (recommendations.length < 8) {
        const popularMovies = await movieService.getPopularMovies(1, 12);
        const additional = (popularMovies.data || [])
          .filter(movie => !state.favorites.some(fav => fav.id === movie.id))
          .slice(0, 8 - recommendations.length);
        
        recommendations = [...recommendations, ...additional];
      }

      dispatch({ type: 'SET_PERSONALIZED_RECOMMENDATIONS', payload: recommendations });
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
    }
  }, [user, state.favorites, state.movies]);

  // Get personalized recommendations when user logs in and has favorites
  useEffect(() => {
    if (user && state.favorites.length > 0) {
      const timer = setTimeout(() => {
        getPersonalizedRecommendations();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, state.favorites.length, getPersonalizedRecommendations]);

  const fetchMovies = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await movieService.getAllMovies();
      const movies = response.data || [];
      dispatch({ type: 'SET_MOVIES', payload: movies });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, []);

  const searchMovies = async (query) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await movieService.searchMovies(query);
      const results = response.data || [];
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const addToFavorites = async (movie) => {
    if (!state.favorites.find(fav => fav.id === movie.id)) {
      if (user) {
        // Add to user's favorites on server using individual endpoint
        try {
          const movieData = {
            id: movie.id,
            title: movie.title,
            // Handle both TMDB and database formats for poster
            poster: movie.poster_url || 
                    (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null),
            // Handle both TMDB and database formats for description  
            description: movie.overview || movie.description,
            // Handle both TMDB and database formats for rating
            rating: movie.vote_average || movie.rating,
            // Handle both TMDB and database formats for year
            year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : 
                  movie.year ? movie.year.toString() : '',
            // Handle both TMDB and database formats for genre
            genre: movie.genre || convertGenreIdsToNames(movie.genre_ids || [])
          };

          // Debug logging - check all movie properties
          console.log('=== FRONTEND DEBUG ===');
          console.log('Original movie object (all properties):', Object.keys(movie));
          console.log('Full movie object:', movie);
          console.log('poster_path:', movie.poster_path);
          console.log('poster_url:', movie.poster_url);
          console.log('genre_ids:', movie.genre_ids);
          console.log('genres:', movie.genres);
          console.log('overview:', movie.overview);
          console.log('description:', movie.description);
          console.log('vote_average:', movie.vote_average);
          console.log('rating:', movie.rating);
          console.log('release_date:', movie.release_date);
          console.log('convertGenreIdsToNames(movie.genre_ids):', convertGenreIdsToNames(movie.genre_ids || []));
          console.log('Final movieData being sent:', movieData);
          console.log('=== END FRONTEND DEBUG ===');

          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/favorites/${movie.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(movieData)
          });

          const data = await response.json();
          
          if (data.success) {
            dispatch({ type: 'ADD_TO_FAVORITES', payload: movie });
            // Refresh personalized recommendations after adding favorite
            setTimeout(() => getPersonalizedRecommendations(), 1000);
          } else {
            throw new Error(data.message);
          }
        } catch (error) {
          console.error('Error adding to favorites:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to add to favorites. Please try again.' });
        }
      } else {
        // Add to localStorage for guest users
        dispatch({ type: 'ADD_TO_FAVORITES', payload: movie });
      }
    }
  };

  const removeFromFavorites = async (movieId) => {
    if (user) {
      // Remove from user's favorites on server using individual endpoint
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/favorites/${movieId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await response.json();
        
        if (data.success) {
          dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: movieId });
          // Refresh personalized recommendations after removing favorite
          setTimeout(() => getPersonalizedRecommendations(), 1000);
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error('Error removing from favorites:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to remove from favorites. Please try again.' });
      }
    } else {
      // Remove from localStorage for guest users
      dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: movieId });
    }
  };

  const getRecommendations = useCallback(async (movieId = null) => {
    try {
      let recommendations;
      
      if (movieId) {
        // Get recommendations for a specific movie
        const response = await movieService.getRecommendations(movieId);
        recommendations = response.data || [];
      } else {
        // Get mixed popular movies as general recommendations
        const response = await movieService.getMixedMovies(12);
        recommendations = response.data || [];
      }
      
      dispatch({ type: 'SET_RECOMMENDATIONS', payload: recommendations });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // Fallback to getting popular movies if recommendations fail
      try {
        const response = await movieService.getPopularMovies(1, 12);
        dispatch({ type: 'SET_RECOMMENDATIONS', payload: response.data || [] });
      } catch (fallbackError) {
        console.error('Error fetching fallback recommendations:', fallbackError);
      }
    }
  }, []);

  const getSimilarMovies = async (movieId) => {
    try {
      if (!movieId) return [];
      const response = await movieService.getSimilarMovies(movieId);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching similar movies:', error);
      return [];
    }
  };

  // Add movie to watch history
  const addToWatchHistory = useCallback((movie) => {
    const historyItem = {
      ...movie,
      watchedAt: new Date().toISOString()
    };
    dispatch({ type: 'ADD_TO_WATCH_HISTORY', payload: historyItem });
  }, []);

  // Get user's favorite genres
  const getFavoriteGenres = useCallback(() => {
    if (state.favorites.length === 0) return [];
    
    const genreCount = {};
    state.favorites.forEach(movie => {
      if (movie.genre && Array.isArray(movie.genre)) {
        movie.genre.forEach(genre => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });
      }
    });

    return Object.entries(genreCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);
  }, [state.favorites]);

  // Check if movie is favorite
  const isFavoriteMovie = useCallback((movieId) => {
    return state.favorites.some(fav => fav.id === movieId);
  }, [state.favorites]);

  // Get recommendations for a specific movie based on genre/similarity
  const getMovieRecommendations = useCallback(async (movieId) => {
    try {
      // First try to get similar movies
      const similar = await getSimilarMovies(movieId);
      if (similar.length > 0) {
        return similar;
      }

      // Fallback: get movies with similar genres
      const movie = state.movies.find(m => m.id === movieId);
      if (movie && movie.genre) {
        const genreMovies = state.movies.filter(m => 
          m.id !== movieId && 
          m.genre && 
          m.genre.some(g => movie.genre.includes(g))
        ).slice(0, 8);
        
        return genreMovies;
      }

      return [];
    } catch (error) {
      console.error('Error getting movie recommendations:', error);
      return [];
    }
  }, [state.movies]);

  // Clear all user data (for logout)
  const clearUserData = useCallback(() => {
    dispatch({ type: 'CLEAR_USER_DATA' });
    localStorage.removeItem('favorites');
    localStorage.removeItem('watchHistory');
  }, []);

  const value = {
    ...state,
    // Movie data functions
    fetchMovies,
    searchMovies,
    
    // Favorites functions
    addToFavorites,
    removeFromFavorites,
    isFavoriteMovie,
    
    // Recommendations functions
    getRecommendations,
    getPersonalizedRecommendations,
    getMovieRecommendations,
    getSimilarMovies,
    
    // Watch history functions
    addToWatchHistory,
    
    // User preferences functions
    getFavoriteGenres,
    
    // Utility functions
    clearUserData,
  };

  return (
    <MovieContext.Provider value={value}>
      {children}
    </MovieContext.Provider>
  );
};

export const useMovie = () => {
  const context = useContext(MovieContext);
  if (!context) {
    throw new Error('useMovie must be used within a MovieProvider');
  }
  return context;
};
