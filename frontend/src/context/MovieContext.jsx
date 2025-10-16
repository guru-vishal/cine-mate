import React, { createContext, useContext, useReducer } from 'react';
import { movieService } from '../services/movieService';

const MovieContext = createContext();

const initialState = {
  movies: [],
  favorites: JSON.parse(localStorage.getItem('favorites')) || [],
  loading: false,
  error: null,
  searchResults: [],
  recommendations: [],
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
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload, loading: false };
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload };
    default:
      return state;
  }
};

export const MovieProvider = ({ children }) => {
  const [state, dispatch] = useReducer(movieReducer, initialState);

  const fetchMovies = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await movieService.getAllMovies();
      const movies = response.data || [];
      dispatch({ type: 'SET_MOVIES', payload: movies });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

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

  const addToFavorites = (movie) => {
    if (!state.favorites.find(fav => fav.id === movie.id)) {
      dispatch({ type: 'ADD_TO_FAVORITES', payload: movie });
    }
  };

  const removeFromFavorites = (movieId) => {
    dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: movieId });
  };

  const getRecommendations = async (movieId = null) => {
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
  };

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

  const value = {
    ...state,
    fetchMovies,
    searchMovies,
    addToFavorites,
    removeFromFavorites,
    getRecommendations,
    getSimilarMovies,
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
