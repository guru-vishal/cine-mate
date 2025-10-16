import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { movieService } from '../services/movieService';
import { useAuth } from './AuthContext';

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
  const { user, updateUserFavorites } = useAuth();

  // Sync user data with authentication
  useEffect(() => {
    if (user) {
      // User is authenticated - sync with server data
      if (user.favorites) {
        dispatch({ type: 'SET_FAVORITES', payload: user.favorites });
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
        // Add to user's favorites on server
        try {
          const newFavorites = [...state.favorites, movie];
          await updateUserFavorites(newFavorites);
          dispatch({ type: 'ADD_TO_FAVORITES', payload: movie });
          
          // Refresh personalized recommendations after adding favorite
          setTimeout(() => getPersonalizedRecommendations(), 1000);
        } catch (error) {
          console.error('Error updating favorites:', error);
          // Show user feedback about the error
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
      // Remove from user's favorites on server
      try {
        const newFavorites = state.favorites.filter(movie => movie.id !== movieId);
        await updateUserFavorites(newFavorites);
        dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: movieId });
        
        // Refresh personalized recommendations after removing favorite
        setTimeout(() => getPersonalizedRecommendations(), 1000);
      } catch (error) {
        console.error('Error updating favorites:', error);
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
