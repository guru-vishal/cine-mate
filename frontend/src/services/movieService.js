import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Increased timeout for TMDB calls
});

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
        category = 'mixed'
      } = params;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort,
        category
      });

      if (genre) queryParams.append('genre', genre);
      if (year) queryParams.append('year', year.toString());

      const response = await api.get(`/movies?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
  },

  // Search movies
  async searchMovies(query, page = 1, limit = 20) {
    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query is required');
      }

      const response = await api.get('/movies/search', {
        params: { q: query.trim(), page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
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

  // Get now playing movies
  async getNowPlayingMovies(page = 1, limit = 20) {
    return this.getAllMovies({ page, limit, category: 'now_playing' });
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
export const getMovieById = movieService.getMovieById.bind(movieService);
export const getRecommendations = movieService.getRecommendations.bind(movieService);
export const getPopularMovies = movieService.getPopularMovies.bind(movieService);
export const getTopRatedMovies = movieService.getTopRatedMovies.bind(movieService);
export const getNowPlayingMovies = movieService.getNowPlayingMovies.bind(movieService);
export const getUpcomingMovies = movieService.getUpcomingMovies.bind(movieService);
export const getMixedMovies = movieService.getMixedMovies.bind(movieService);
export const getGenres = movieService.getGenres.bind(movieService);
export const getMoviesByGenre = movieService.getMoviesByGenre.bind(movieService);
export const getSimilarMovies = movieService.getSimilarMovies.bind(movieService);
export const getFilteredMovies = movieService.getFilteredMovies.bind(movieService);

export default movieService;