import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 45000, // Increased timeout for loading all movies (45 seconds)
  withCredentials: true, // Enable credentials for CORS
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle CORS errors
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.error('CORS or Network Error:', error.message);
      console.error('API URL:', API_URL);
    }
    
    return Promise.reject(error);
  }
);

// Request deduplication cache
const requestCache = new Map();
const CACHE_DURATION = 5000; // 5 seconds

// Movie service with TMDB integration
export const movieService = {
  // Get all movies with various filters and categories
  async getAllMovies(params = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        genre,
        year,
        sort = 'popular',
        category = 'mixed',
        all = false
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort,
        category
      });

      if (genre) queryParams.append('genre', genre);
      if (year) queryParams.append('year', year.toString());
      if (all) queryParams.append('all', 'true'); // Add the all parameter

      const cacheKey = `/movies?${queryParams}`;
      const now = Date.now();

      // Check if we have a recent request for this exact same query
      if (requestCache.has(cacheKey)) {
        const { timestamp, promise } = requestCache.get(cacheKey);
        if (now - timestamp < CACHE_DURATION) {
          console.log('Returning cached request for:', cacheKey);
          return promise;
        } else {
          requestCache.delete(cacheKey);
        }
      }

      // Create new request and cache it
      const requestPromise = api.get(`/movies?${queryParams}`).then(response => response.data);
      requestCache.set(cacheKey, { timestamp: now, promise: requestPromise });

      // Clean up cache after request completes
      requestPromise.finally(() => {
        setTimeout(() => requestCache.delete(cacheKey), CACHE_DURATION);
      });

      return requestPromise;
    } catch (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
  },

  // Progressive movies loading with real-time results
  async getMoviesProgressive(onProgress) {
    try {
      console.log(`🎬 Frontend: Starting progressive movie loading`);

      const url = `${API_URL}/movies/progressive`;
      
      return new Promise((resolve, reject) => {
        const eventSource = new EventSource(url);
        let allResults = [];
        let hasReceivedData = false;

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (!data.success) {
              console.error('Progressive movies error:', data.message);
              eventSource.close();
              reject(new Error(data.message));
              return;
            }

            // Add new results to the collection
            if (data.data && data.data.length > 0) {
              allResults.push(...data.data);
              hasReceivedData = true;
              
              console.log(`📥 Progressive: Received ${data.data.length} results from ${data.source} (page ${data.page}), total: ${allResults.length}`);
              
              // Call progress callback with current results
              if (onProgress) {
                onProgress({
                  results: [...allResults], // Send copy of all results so far
                  newResults: data.data, // This batch of new results
                  totalSoFar: allResults.length,
                  source: data.source,
                  page: data.page,
                  isComplete: data.is_complete
                });
              }
            }

            // If loading is complete, resolve
            if (data.is_complete) {
              console.log(`✅ Progressive movie loading complete: ${allResults.length} total movies`);
              eventSource.close();
              resolve({
                success: true,
                data: allResults,
                total: allResults.length
              });
            }
          } catch (parseError) {
            console.error('Error parsing progressive movies data:', parseError);
            eventSource.close();
            reject(parseError);
          }
        };

        eventSource.addEventListener('close', () => {
          console.log('Progressive movies connection closed');
          eventSource.close();
          if (!hasReceivedData) {
            reject(new Error('No data received from progressive movie loading'));
          }
        });

        eventSource.onerror = (error) => {
          console.error('Progressive movies connection error:', error);
          eventSource.close();
          reject(new Error('Connection error during progressive movie loading'));
        };

        // Timeout after 45 seconds (longer than search due to more data)
        setTimeout(() => {
          if (eventSource.readyState !== EventSource.CLOSED) {
            console.log('Progressive movies timeout, closing connection');
            eventSource.close();
            if (hasReceivedData) {
              resolve({
                success: true,
                data: allResults,
                total: allResults.length
              });
            } else {
              reject(new Error('Progressive movie loading timeout'));
            }
          }
        }, 45000);
      });

    } catch (error) {
      console.error('Error starting progressive movie loading:', error);
      throw error;
    }
  },

  // Progressive search movies with real-time results
  async searchMoviesProgressive(query, onProgress) {
    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query is required');
      }

      console.log(`🔍 Frontend: Starting progressive search for "${query}"`);

      const url = `${API_URL}/movies/search/progressive?q=${encodeURIComponent(query.trim())}`;
      
      return new Promise((resolve, reject) => {
        const eventSource = new EventSource(url);
        let allResults = [];
        let hasReceivedData = false;

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (!data.success) {
              console.error('Progressive search error:', data.message);
              eventSource.close();
              reject(new Error(data.message));
              return;
            }

            // Add new results to the collection
            if (data.data && data.data.length > 0) {
              allResults.push(...data.data);
              hasReceivedData = true;
              
              console.log(`📥 Progressive: Received ${data.data.length} results (page ${data.current_page}), total: ${allResults.length}`);
              
              // Call progress callback with current results
              if (onProgress) {
                onProgress({
                  results: [...allResults], // Send copy of all results so far
                  newResults: data.data, // This batch of new results
                  totalSoFar: allResults.length,
                  totalAvailable: data.total_available,
                  currentPage: data.current_page,
                  isComplete: data.is_complete
                });
              }
            }

            // If search is complete, resolve
            if (data.is_complete) {
              console.log(`✅ Progressive search complete: ${allResults.length} total results`);
              eventSource.close();
              resolve({
                success: true,
                data: allResults,
                total: allResults.length,
                query: query.trim()
              });
            }
          } catch (parseError) {
            console.error('Error parsing progressive search data:', parseError);
            eventSource.close();
            reject(parseError);
          }
        };

        eventSource.addEventListener('close', () => {
          console.log('Progressive search connection closed');
          eventSource.close();
          if (!hasReceivedData) {
            reject(new Error('No data received from progressive search'));
          }
        });

        eventSource.onerror = (error) => {
          console.error('Progressive search connection error:', error);
          eventSource.close();
          reject(new Error('Connection error during progressive search'));
        };

        // Timeout after 30 seconds
        setTimeout(() => {
          if (eventSource.readyState !== EventSource.CLOSED) {
            console.log('Progressive search timeout, closing connection');
            eventSource.close();
            if (hasReceivedData) {
              resolve({
                success: true,
                data: allResults,
                total: allResults.length,
                query: query.trim()
              });
            } else {
              reject(new Error('Progressive search timeout'));
            }
          }
        }, 30000);
      });

    } catch (error) {
      console.error('Error starting progressive search:', error);
      throw error;
    }
  },

  // Search movies
  async searchMovies(query, page = 1, limit = null) {
    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query is required');
      }

      const params = { q: query.trim() };
      
      // Only add pagination params if limit is specified (for backwards compatibility)
      if (limit !== null) {
        params.page = page;
        params.limit = limit;
        console.log(`🔍 Frontend: Searching with pagination - page: ${page}, limit: ${limit}`);
      } else {
        // Request all results for comprehensive search
        params.all = 'true';
        console.log(`🔍 Frontend: Requesting comprehensive search (all=true)`);
      }

      console.log(`📤 Frontend: Sending search request with params:`, params);
      
      // Disable caching for search to ensure fresh results
      const response = await api.get('/movies/search', { 
        params,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log(`📥 Frontend: Received response with ${response.data?.data?.length || 0} results`);
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  },

  // Get comprehensive movie list for enhanced search
  async getAllMoviesForSearch() {
    try {
      const cacheKey = '/movies?all=true';
      const now = Date.now();

      // Check if we have a recent request for comprehensive movie list
      if (requestCache.has(cacheKey)) {
        const { timestamp, promise } = requestCache.get(cacheKey);
        if (now - timestamp < CACHE_DURATION * 6) { // Cache longer for comprehensive list (30 seconds)
          console.log('Returning cached comprehensive movie list');
          return promise;
        } else {
          requestCache.delete(cacheKey);
        }
      }

      const promise = api.get('/movies', {
        params: { all: 'true' }
      }).then(response => response.data);

      requestCache.set(cacheKey, { timestamp: now, promise });
      return promise;
    } catch (error) {
      console.error('Error fetching comprehensive movie list:', error);
      throw error;
    }
  },

  // Enhanced local search within fetched movies
  searchMoviesLocally(movies, query) {
    if (!query || query.trim() === '') {
      return movies;
    }

    const searchTerm = query.toLowerCase().trim();
    return movies.filter(movie => {
      const title = (movie.title || movie.original_title || '').toLowerCase();
      const overview = (movie.overview || '').toLowerCase();
      
      return title.includes(searchTerm) || overview.includes(searchTerm);
    });
  },

  // Get movie by ID
  async getMovieById(id) {
    try {
      const response = await api.get(`/movies/${id}`);
      return response.data.data; // Extract the actual movie data
    } catch (error) {
      console.error('Error fetching movie by ID:', error);
      throw error;
    }
  },

  // Get popular movies
  async getPopularMovies(page = 1, limit = 20) {
    return this.getAllMovies({ page, limit, category: 'popular' });
  },

  // Get top rated movies
  async getTopRatedMovies(page = 1, limit = 20) {
    return this.getAllMovies({ page, limit, category: 'top_rated' });
  },

  // Get upcoming movies
  async getUpcomingMovies(page = 1, limit = 20) {
    return this.getAllMovies({ page, limit, category: 'upcoming' });
  },

  // Get mixed movies (default homepage content)
  async getMixedMovies(limit = 20) {
    return this.getAllMovies({ limit, category: 'mixed' });
  },

  // Get all available genres
  async getGenres() {
    try {
      const response = await api.get('/movies/genres');
      return response.data;
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  },

  // Get movies by genre
  async getMoviesByGenre(genreId, page = 1, limit = 20) {
    try {
      const response = await api.get(`/movies/genre/${genreId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching movies by genre:', error);
      throw error;
    }
  },

  // Get similar movies
  async getSimilarMovies(movieId, page = 1, limit = 10) {
    try {
      const response = await api.get(`/movies/${movieId}/similar`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching similar movies:', error);
      throw error;
    }
  },

  // Get movie recommendations
  async getRecommendations(movieId, page = 1, limit = 10) {
    try {
      const response = await api.get(`/movies/${movieId}/recommendations`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  },

  // Filter movies by multiple criteria
  async getFilteredMovies(filters = {}) {
    try {
      const {
        genres = [],
        yearRange = null,
        ratingMin = 0,
        ratingMax = 10,
        sortBy = 'popular',
        page = 1,
        limit = 20
      } = filters;

      let movies = await this.getAllMovies({
        page,
        limit,
        sort: sortBy,
        category: 'mixed'
      });

      // Apply client-side filters for more complex filtering
      if (movies.success && movies.data) {
        let filteredMovies = movies.data;

        // Filter by genres
        if (genres.length > 0) {
          filteredMovies = filteredMovies.filter(movie =>
            movie.genre && movie.genre.some(g =>
              genres.some(filterGenre =>
                g.toLowerCase().includes(filterGenre.toLowerCase())
              )
            )
          );
        }

        // Filter by year range
        if (yearRange && yearRange.min && yearRange.max) {
          filteredMovies = filteredMovies.filter(movie =>
            movie.year >= yearRange.min && movie.year <= yearRange.max
          );
        }

        // Filter by rating
        filteredMovies = filteredMovies.filter(movie =>
          movie.rating >= ratingMin && movie.rating <= ratingMax
        );

        return {
          ...movies,
          data: filteredMovies,
          total: filteredMovies.length
        };
      }

      return movies;
    } catch (error) {
      console.error('Error filtering movies:', error);
      throw error;
    }
  }
};

// Export individual functions for backward compatibility
export const getAllMovies = movieService.getAllMovies.bind(movieService);
export const searchMovies = movieService.searchMovies.bind(movieService);
export const getAllMoviesForSearch = movieService.getAllMoviesForSearch.bind(movieService);
export const searchMoviesLocally = movieService.searchMoviesLocally.bind(movieService);
export const getMovieById = movieService.getMovieById.bind(movieService);
export const getRecommendations = movieService.getRecommendations.bind(movieService);
export const getPopularMovies = movieService.getPopularMovies.bind(movieService);
export const getTopRatedMovies = movieService.getTopRatedMovies.bind(movieService);
export const getUpcomingMovies = movieService.getUpcomingMovies.bind(movieService);
export const getMixedMovies = movieService.getMixedMovies.bind(movieService);
export const getGenres = movieService.getGenres.bind(movieService);
export const getMoviesByGenre = movieService.getMoviesByGenre.bind(movieService);
export const getSimilarMovies = movieService.getSimilarMovies.bind(movieService);
export const getFilteredMovies = movieService.getFilteredMovies.bind(movieService);

export default movieService;