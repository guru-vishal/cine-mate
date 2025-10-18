/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Heart, HeartOff, Trash2 } from 'lucide-react';
import { movieService } from '../services/movieService';
import { searchHistoryService } from '../services/searchHistoryService';
import { watchHistoryService } from '../services/watchHistoryService';
import { useAuth } from './AuthContext';
import { convertGenreIdsToNames, convertGenreNamesToIds } from '../utils/genreMapping';

const MovieContext = createContext();

const initialState = {
  movies: [],
  upcomingMovies: [],
  topRatedMovies: [],
  popularMovies: [],
  favorites: JSON.parse(localStorage.getItem('favorites')) || [],
  loading: false,
  upcomingLoading: false,
  topRatedLoading: false,
  popularLoading: false,
  error: null,
  searchResults: [],
  searchHistory: [],
  recommendations: [],
  personalizedRecommendations: [],
  watchHistory: [],
  genres: [],
  userPreferences: {},
  progressiveSearch: {
    isActive: false,
    totalSoFar: 0,
    totalAvailable: 0,
    currentPage: 0
  },
  progressiveMovies: {
    isActive: false,
    totalSoFar: 0,
    currentSource: '',
    currentPage: 0
  }
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
    case 'CLEAR_ALL_FAVORITES': {
      localStorage.setItem('favorites', JSON.stringify([]));
      return { ...state, favorites: [] };
    }
    case 'SET_FAVORITES':
      return { ...state, favorites: action.payload };
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload, loading: false };
    case 'SET_SEARCH_HISTORY':
      return { ...state, searchHistory: action.payload };
    case 'ADD_TO_SEARCH_HISTORY': {
      const newHistory = [action.payload, ...state.searchHistory.filter(search => search.query !== action.payload.query)].slice(0, 50);
      return { ...state, searchHistory: newHistory };
    }
    case 'CLEAR_SEARCH_HISTORY':
      return { ...state, searchHistory: [] };
    case 'SET_PROGRESSIVE_SEARCH':
      return { ...state, progressiveSearch: action.payload };
    case 'SET_PROGRESSIVE_MOVIES':
      return { ...state, progressiveMovies: action.payload };
    case 'SET_UPCOMING_MOVIES':
      return { ...state, upcomingMovies: action.payload, upcomingLoading: false };
    case 'SET_UPCOMING_LOADING':
      return { ...state, upcomingLoading: action.payload };
    case 'SET_TOP_RATED_MOVIES':
      return { ...state, topRatedMovies: action.payload, topRatedLoading: false };
    case 'SET_TOP_RATED_LOADING':
      return { ...state, topRatedLoading: action.payload };
    case 'SET_POPULAR_MOVIES':
      return { ...state, popularMovies: action.payload, popularLoading: false };
    case 'SET_POPULAR_LOADING':
      return { ...state, popularLoading: action.payload };
    case 'SET_RECOMMENDATIONS':
      return { ...state, recommendations: action.payload };
    case 'SET_PERSONALIZED_RECOMMENDATIONS':
      return { ...state, personalizedRecommendations: action.payload };
    case 'ADD_TO_WATCH_HISTORY': {
      // Create a unique identifier for the movie to avoid conflicts
      const newMovieId = action.payload.id || action.payload.movieId;
      const newMovieTitle = action.payload.title;
      
      // Remove any existing entry for this specific movie (match by both ID AND title for safety)
      const filteredHistory = state.watchHistory.filter(item => {
        const existingMovieId = item.id || item.movieId;
        const existingMovieTitle = item.title;
        
        // Only remove if both ID and title match (more precise matching)
        return !(existingMovieId === newMovieId && existingMovieTitle === newMovieTitle);
      });
      
      // Add the new entry at the beginning (most recent)
      const newHistory = [action.payload, ...filteredHistory].slice(0, 50);
      
      // Sort by watchedAt time to ensure proper chronological order
      newHistory.sort((a, b) => new Date(b.watchedAt || 0) - new Date(a.watchedAt || 0));
      
      localStorage.setItem('watchHistory', JSON.stringify(newHistory));
      return { ...state, watchHistory: newHistory };
    }
    case 'SET_WATCH_HISTORY': {
      // Sort the watch history by watchedAt time (most recent first)
      const sortedHistory = [...action.payload].sort((a, b) => 
        new Date(b.watchedAt || 0) - new Date(a.watchedAt || 0)
      );
      return { ...state, watchHistory: sortedHistory };
    }
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
    dispatch({ type: 'SET_PROGRESSIVE_MOVIES', payload: { isActive: false, totalSoFar: 0, currentSource: '', currentPage: 0 } });
    
    try {
      console.log('🎬 Fetching movies...');
      
      // Try to get ALL available movies with simple category approach
      try {
        console.log('🔄 Attempting to load ALL movies...');
        const response = await movieService.getAllMovies({ 
          category: 'mixed',
          page: 1,
          limit: 1000, // Get all available movies for complete browsing experience
          all: true // Enable loading of extensive movie collection
        });
        
        if (response && response.data) {
          const movies = response.data || [];
          console.log(`✅ Successfully loaded ${movies.length} movies`);
          dispatch({ type: 'SET_MOVIES', payload: movies });
          dispatch({ type: 'SET_LOADING', payload: false });
          dispatch({ type: 'SET_PROGRESSIVE_MOVIES', payload: { isActive: false, totalSoFar: movies.length, currentSource: 'mixed', currentPage: 1 } });
          return;
        }
      } catch (fullLoadError) {
        console.log('⚠️ Full movie load failed, trying smaller batch:', fullLoadError.message);
      }
      
      // Fallback 1: Try loading 500 movies
      try {
        console.log('🔄 Trying 500 movies...');
        const response = await movieService.getAllMovies({ 
          category: 'mixed',
          page: 1,
          limit: 500
        });
        
        if (response && response.data) {
          const movies = response.data || [];
          console.log(`✅ Successfully loaded ${movies.length} movies (500 limit)`);
          dispatch({ type: 'SET_MOVIES', payload: movies });
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }
      } catch (mediumLoadError) {
        console.log('⚠️ 500 movie load failed, trying smaller batch:', mediumLoadError.message);
      }
      
      // Fallback 2: Try loading 200 movies
      try {
        console.log('🔄 Trying 200 movies...');
        const response = await movieService.getAllMovies({ 
          category: 'mixed',
          page: 1,
          limit: 200
        });
        
        if (response && response.data) {
          const movies = response.data || [];
          console.log(`✅ Successfully loaded ${movies.length} movies (200 limit)`);
          dispatch({ type: 'SET_MOVIES', payload: movies });
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }
      } catch (smallLoadError) {
        console.log('⚠️ 200 movie load failed, trying popular movies:', smallLoadError.message);
      }
      
      // Fallback 3: Try popular movies
      console.log('🔄 Falling back to popular movies...');
      const fallbackResponse = await movieService.getAllMovies({ 
        category: 'popular',
        page: 1,
        limit: 200 // Get popular movies as final fallback
      });
      
      if (fallbackResponse && fallbackResponse.data) {
        const movies = fallbackResponse.data || [];
        console.log(`✅ Fallback successful: loaded ${movies.length} popular movies`);
        dispatch({ type: 'SET_MOVIES', payload: movies });
      } else {
        console.log('⚠️ No movies found, setting empty array');
        dispatch({ type: 'SET_MOVIES', payload: [] });
      }
      
    } catch (error) {
      console.error('❌ Movie loading failed:', error.message);
      
      // Final fallback - set empty array
      console.log('🔄 Setting empty movies array');
      dispatch({ type: 'SET_MOVIES', payload: [] });
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
    
    dispatch({ type: 'SET_LOADING', payload: false });
    dispatch({ type: 'SET_PROGRESSIVE_MOVIES', payload: { isActive: false, totalSoFar: 0, currentSource: '', currentPage: 0 } });
  }, []);

  const fetchUpcomingMovies = useCallback(async () => {
    dispatch({ type: 'SET_UPCOMING_LOADING', payload: true });
    
    try {
      console.log('🎬 Fetching upcoming movies...');
      const response = await movieService.getUpcomingMovies(1, 20);
      
      if (response && response.data) {
        const upcomingMovies = Array.isArray(response.data) ? response.data : response.data.results || [];
        console.log(`✅ Fetched ${upcomingMovies.length} upcoming movies`);
        dispatch({ type: 'SET_UPCOMING_MOVIES', payload: upcomingMovies });
      }
    } catch (error) {
      console.error('❌ Error fetching upcoming movies:', error.message);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
    
    dispatch({ type: 'SET_UPCOMING_LOADING', payload: false });
  }, []);

  const fetchTopRatedMovies = useCallback(async () => {
    const callId = Date.now();
    
    // Prevent multiple simultaneous calls
    if (state.topRatedLoading) {
      console.log('🚫 [FRONTEND] fetchTopRatedMovies already in progress, skipping...');
      return;
    }
    
    dispatch({ type: 'SET_TOP_RATED_LOADING', payload: true });
    
    try {
      console.log(`🏆 [FRONTEND] Starting fetchTopRatedMovies... Call ID: ${callId}`);
      
      // Use the new backend endpoint that returns 100 movies directly
      console.log(`🔄 [FRONTEND] Requesting top 100 rated movies from backend...`);
      const response = await movieService.getAllMovies({ category: 'top_rated' });
      
      console.log(`📋 [FRONTEND] Raw response:`, {
        hasResponse: !!response,
        hasSuccess: !!(response && response.success),
        hasData: !!(response && response.data),
        dataType: response && response.data ? typeof response.data : 'undefined',
        dataLength: response && response.data ? (Array.isArray(response.data) ? response.data.length : 'not array') : 'no data',
        fullResponse: response
      });
      
      if (response && response.success && response.data) {
        const movies = Array.isArray(response.data) ? response.data : [];
        
        console.log(`✅ [FRONTEND] Received ${movies.length} top-rated movies`);
        
        // Log top 100 movie titles in frontend console
        console.log('🎬 TOP 100 RATED MOVIES (Frontend):');
        console.log('================================================================================');
        movies.slice(0, 100).forEach((movie, index) => {
          const year = movie.release_date ? movie.release_date.substring(0, 4) : 'Unknown';
          console.log(`${(index + 1).toString().padStart(3)}. ${movie.title} (${movie.vote_average}⭐) - ${year}`);
        });
        console.log('================================================================================');
        console.log(`✅ Logged ${Math.min(movies.length, 100)} top-rated movies`);
        
        // Trigger backend logging endpoint
        try {
          await fetch(`${movieService.API_BASE_URL}/movies/log-top-100`);
          console.log('🔄 [FRONTEND] Triggered backend top 100 logging');
        } catch (error) {
          console.warn('⚠️ [FRONTEND] Failed to trigger backend logging:', error.message);
        }
        
        dispatch({ type: 'SET_TOP_RATED_MOVIES', payload: movies });
        console.log(`✅ [FRONTEND] Top-rated movies updated: ${movies.length} total`);
      } else {
        console.error('❌ [FRONTEND] Invalid response format for top-rated movies:', response);
        dispatch({ type: 'SET_TOP_RATED_MOVIES', payload: [] });
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error fetching top-rated movies:', error);
      dispatch({ type: 'SET_TOP_RATED_MOVIES', payload: [] });
    }
    
    dispatch({ type: 'SET_TOP_RATED_LOADING', payload: false });
  }, [state.topRatedLoading]);

  // Fetch popular movies from backend
  const fetchPopularMovies = useCallback(async () => {
    const callId = Date.now();
    
    // Prevent multiple simultaneous calls
    if (state.popularLoading) {
      console.log('🚫 [FRONTEND] fetchPopularMovies already in progress, skipping...');
      return;
    }
    
    dispatch({ type: 'SET_POPULAR_LOADING', payload: true });
    
    try {
      console.log(`🔥 [FRONTEND] Starting fetchPopularMovies... Call ID: ${callId}`);
      
      // Use the new backend endpoint that returns 100 movies directly
      console.log(`🔄 [FRONTEND] Requesting top 100 popular movies from backend...`);
      const response = await movieService.getAllMovies({ category: 'popular' });
      
      console.log(`📋 [FRONTEND] Raw response:`, {
        hasResponse: !!response,
        hasSuccess: !!(response && response.success),
        hasData: !!(response && response.data),
        dataType: response && response.data ? typeof response.data : 'undefined',
        dataLength: response && response.data ? (Array.isArray(response.data) ? response.data.length : 'not array') : 'no data',
        fullResponse: response
      });
      
      if (response && response.success && response.data) {
        const movies = Array.isArray(response.data) ? response.data : [];
        
        console.log(`✅ [FRONTEND] Received ${movies.length} popular movies`);
        
        // Log top 100 movie titles in frontend console
        console.log('🔥 TOP 100 POPULAR MOVIES (Frontend):');
        console.log('================================================================================');
        movies.slice(0, 100).forEach((movie, index) => {
          const year = movie.release_date ? movie.release_date.substring(0, 4) : 'Unknown';
          console.log(`${(index + 1).toString().padStart(3)}. ${movie.title} (${movie.vote_average}⭐) - ${year}`);
        });
        console.log('================================================================================');
        console.log(`✅ Logged ${Math.min(movies.length, 100)} popular movies`);
        
        // Trigger backend logging endpoint
        try {
          await fetch(`${movieService.API_BASE_URL}/movies/log-popular-100`);
          console.log('🔄 [FRONTEND] Triggered backend popular 100 logging');
        } catch (error) {
          console.warn('⚠️ [FRONTEND] Failed to trigger backend logging:', error.message);
        }
        
        dispatch({ type: 'SET_POPULAR_MOVIES', payload: movies });
        console.log(`✅ [FRONTEND] Popular movies updated: ${movies.length} total`);
      } else {
        console.error('❌ [FRONTEND] Invalid response format for popular movies:', response);
        dispatch({ type: 'SET_POPULAR_MOVIES', payload: [] });
      }
    } catch (error) {
      console.error('❌ [FRONTEND] Error fetching popular movies:', error);
      dispatch({ type: 'SET_POPULAR_MOVIES', payload: [] });
    }
    
    dispatch({ type: 'SET_POPULAR_LOADING', payload: false });
  }, [state.popularLoading]);

  // Search History Functions
  const loadSearchHistory = useCallback(async () => {
    if (!user) {
      dispatch({ type: 'SET_SEARCH_HISTORY', payload: [] });
      return;
    }

    try {
      const response = await searchHistoryService.getSearchHistory(user.id, 20);
      if (response.success) {
        dispatch({ type: 'SET_SEARCH_HISTORY', payload: response.data });
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  }, [user]);

  const saveSearchHistory = useCallback(async (query, resultCount = 0) => {
    if (!user || !query.trim()) return;

    try {
      const response = await searchHistoryService.addSearchHistory(user.id, query.trim(), resultCount);
      if (response.success) {
        dispatch({ type: 'ADD_TO_SEARCH_HISTORY', payload: {
          query: query.trim(),
          resultCount,
          searchedAt: new Date()
        }});
      }
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }, [user]);

  const clearSearchHistory = useCallback(async () => {
    if (!user) return;

    try {
      const response = await searchHistoryService.clearSearchHistory(user.id);
      if (response.success) {
        dispatch({ type: 'CLEAR_SEARCH_HISTORY' });
      }
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }, [user]);

  const deleteSearchEntry = useCallback(async (searchId) => {
    if (!user) return;

    try {
      await searchHistoryService.deleteSearchEntry(user.id, searchId);
      // Reload search history after deletion
      loadSearchHistory();
    } catch (error) {
      console.error('Error deleting search entry:', error);
    }
  }, [user, loadSearchHistory]);

  // Watch History Functions
  const loadWatchHistory = useCallback(async () => {
    if (!user) {
      // Load from localStorage for guest users
      const localHistory = JSON.parse(localStorage.getItem('watchHistory')) || [];
      dispatch({ type: 'SET_WATCH_HISTORY', payload: localHistory });
      return;
    }

    try {
      const response = await watchHistoryService.getWatchHistory(user.id, 50);
      if (response.success) {
        dispatch({ type: 'SET_WATCH_HISTORY', payload: response.data });
        // Also sync to localStorage
        localStorage.setItem('watchHistory', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Error loading watch history:', error);
      // Fallback to localStorage
      const localHistory = JSON.parse(localStorage.getItem('watchHistory')) || [];
      dispatch({ type: 'SET_WATCH_HISTORY', payload: localHistory });
    }
  }, [user]);

  const clearWatchHistory = useCallback(async () => {
    // Always clear local state
    dispatch({ type: 'SET_WATCH_HISTORY', payload: [] });
    localStorage.removeItem('watchHistory');

    // If user is logged in, also clear from backend
    if (user && user.id) {
      try {
        await watchHistoryService.clearWatchHistory(user.id);
      } catch (error) {
        console.error('Error clearing watch history from backend:', error);
      }
    }
  }, [user]);

  // Load search history when user changes
  useEffect(() => {
    loadSearchHistory();
  }, [loadSearchHistory]);

  // Load watch history when user changes
  useEffect(() => {
    loadWatchHistory();
  }, [loadWatchHistory]);

  const searchMovies = useCallback(async (query) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      if (!query || query.trim() === '') {
        dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      console.log('🔍 Starting progressive search for:', query);
      
      // Use progressive search for better UX
      await movieService.searchMoviesProgressive(query, (progressData) => {
        // Update results as they come in
        console.log(`� Progressive update: ${progressData.newResults.length} new results, total: ${progressData.totalSoFar}`);
        
        // Show results immediately and stop loading on first batch
        if (progressData.currentPage === 1) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
        
        // Update search results with all results so far
        dispatch({ type: 'SET_SEARCH_RESULTS', payload: progressData.results });
        
        // Update progressive search status
        dispatch({ type: 'SET_PROGRESSIVE_SEARCH', payload: {
          isActive: !progressData.isComplete,
          totalSoFar: progressData.totalSoFar,
          totalAvailable: progressData.totalAvailable,
          currentPage: progressData.currentPage
        } });
        
        if (progressData.isComplete) {
          console.log(`✅ Progressive search complete: ${progressData.totalSoFar} total results`);
          // Save to search history when search is complete
          if (user && query.trim()) {
            saveSearchHistory(query.trim(), progressData.totalSoFar);
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Progressive search failed:', error.message);
      
      // Fallback to regular search
      console.log('🔄 Falling back to regular search...');
      try {
        const response = await movieService.searchMovies(query);
        const results = response.data || [];
        dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
      } catch (fallbackError) {
        console.error('❌ Fallback search also failed:', fallbackError.message);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
      dispatch({ type: 'SET_PROGRESSIVE_SEARCH', payload: { isActive: false, totalSoFar: 0, totalAvailable: 0, currentPage: 0 } });
    }
  }, [user, saveSearchHistory]); // Memoized to prevent infinite re-renders

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
            // Show success toast
            toast.success(`"${movie.title}" added to favorites!`, {
              duration: 3000,
              icon: <Heart className="h-5 w-5 text-red-500" />,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #ef4444',
              },
            });
            // Refresh personalized recommendations after adding favorite
            setTimeout(() => getPersonalizedRecommendations(), 1000);
          } else {
            throw new Error(data.message);
          }
        } catch (error) {
          console.error('Error adding to favorites:', error);
          toast.error('Failed to add to favorites. Please try again.');
          dispatch({ type: 'SET_ERROR', payload: 'Failed to add to favorites. Please try again.' });
        }
      } else {
        // Add to localStorage for guest users
        dispatch({ type: 'ADD_TO_FAVORITES', payload: movie });
        // Show success toast for guest users
        toast.success(`"${movie.title}" added to favorites!`, {
          duration: 3000,
          icon: <Heart className="h-5 w-5 text-red-500" />,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #ef4444',
          },
        });
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
          // Find the movie title before removing it
          const removedMovie = state.favorites.find(fav => fav.id === movieId);
          const movieTitle = removedMovie?.title || 'Movie';
          
          dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: movieId });
          // Show success toast
          toast.success(`"${movieTitle}" removed from favorites!`, {
            duration: 3000,
            icon: <HeartOff className="h-5 w-5 text-gray-500" />,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #6b7280',
            },
          });
          // Refresh personalized recommendations after removing favorite
          setTimeout(() => getPersonalizedRecommendations(), 1000);
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error('Error removing from favorites:', error);
        toast.error('Failed to remove from favorites. Please try again.');
        dispatch({ type: 'SET_ERROR', payload: 'Failed to remove from favorites. Please try again.' });
      }
    } else {
      // Find the movie title before removing it for guest users
      const removedMovie = state.favorites.find(fav => fav.id === movieId);
      const movieTitle = removedMovie?.title || 'Movie';
      
      // Remove from localStorage for guest users
      dispatch({ type: 'REMOVE_FROM_FAVORITES', payload: movieId });
      // Show success toast for guest users
      toast.success(`"${movieTitle}" removed from favorites!`, {
        duration: 3000,
        icon: <HeartOff className="h-5 w-5 text-gray-500" />,
        style: {
          background: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid #6b7280',
        },
      });
    }
  };

  const clearAllFavorites = async () => {
    if (user) {
      // Clear all favorites on server
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/favorites`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const data = await response.json();
        
        if (data.success) {
          const favoritesCount = state.favorites.length;
          dispatch({ type: 'CLEAR_ALL_FAVORITES' });
          // Show success toast
          toast.success(`All ${favoritesCount} favorite${favoritesCount !== 1 ? 's' : ''} cleared!`, {
            duration: 3000,
            icon: <Trash2 className="h-5 w-5 text-red-600" />,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #dc2626',
            },
          });
          // Refresh personalized recommendations after clearing favorites
          setTimeout(() => getPersonalizedRecommendations(), 1000);
        } else {
          throw new Error(data.message);
        }
      } catch (error) {
        console.error('Error clearing all favorites:', error);
        toast.error('Failed to clear favorites. Please try again.');
        dispatch({ type: 'SET_ERROR', payload: 'Failed to clear favorites. Please try again.' });
      }
    } else {
      // Clear all favorites from localStorage for guest users
      const favoritesCount = state.favorites.length;
      dispatch({ type: 'CLEAR_ALL_FAVORITES' });
      // Show success toast for guest users
      toast.success(`All ${favoritesCount} favorite${favoritesCount !== 1 ? 's' : ''} cleared!`, {
        duration: 3000,
        icon: <Trash2 className="h-5 w-5 text-red-600" />,
        style: {
          background: '#1e293b',
          color: '#f1f5f9',
          border: '1px solid #dc2626',
        },
      });
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
  const addToWatchHistory = useCallback(async (movie) => {
    const historyItem = {
      ...movie,
      watchedAt: new Date().toISOString()
    };
    
    // Always add to local state for immediate UI update
    dispatch({ type: 'ADD_TO_WATCH_HISTORY', payload: historyItem });
    
    // If user is logged in, also save to backend
    if (user && user.id) {
      try {
        await watchHistoryService.addToWatchHistory(user.id, movie);
      } catch (error) {
        console.error('Error saving watch history to backend:', error);
        // Continue with local storage fallback
      }
    }
  }, [user]);

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
    fetchUpcomingMovies,
    fetchTopRatedMovies,
    fetchPopularMovies,
    searchMovies,
    
    // Search History functions
    loadSearchHistory,
    saveSearchHistory,
    clearSearchHistory,
    deleteSearchEntry,
    
    // Favorites functions
    addToFavorites,
    removeFromFavorites,
    clearAllFavorites,
    isFavoriteMovie,
    
    // Recommendations functions
    getRecommendations,
    getPersonalizedRecommendations,
    getMovieRecommendations,
    getSimilarMovies,
    
    // Watch history functions
    addToWatchHistory,
    loadWatchHistory,
    clearWatchHistory,
    
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
