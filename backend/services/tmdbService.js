// Real TMDB Service with API integration
// Fetches data from The Movie Database API
const axios = require('axios');
require('dotenv').config();

class TMDBService {
  constructor() {
    this.initialize();
  }

  initialize() {
    // Re-read environment variables (in case .env was added after startup)
    require('dotenv').config();
    
    this.apiKey = process.env.TMDB_API_KEY;
    this.baseURL = process.env.TMDB_BASE_URL;
    
    // Check if it's a Bearer token (JWT) or API key
    const isBearerToken = this.apiKey && this.apiKey.startsWith('eyJ');
    
    if (isBearerToken) {
      // Use Bearer token authentication (v4 API)
      this.api = axios.create({
        baseURL: this.baseURL,
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('TMDB Service initialized with Bearer Token:', this.apiKey ? 'Present' : 'Missing');
    } else {
      // Use API key authentication (v3 API)
      this.api = axios.create({
        baseURL: this.baseURL,
        timeout: 30000,
        params: {
          api_key: this.apiKey
        }
      });
      console.log('TMDB Service initialized with API Key:', this.apiKey ? 'Present' : 'Missing');
    }
  }

  // Get single page of popular movies (internal helper function)
  async getPopularMoviesByPage(page = 1) {
    try {
      const response = await this.api.get('/movie/popular', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      console.error('TMDB Popular Movies Error:', error.message);
      return this.getFallbackData(page);
    }
  }

  // Get top 100 popular movies with runtime data
  async getPopularMovies() {
    try {
      console.log('🔥 Fetching top 100 popular movies...');
      const allMovies = [];
      
      // Fetch first 5 pages to get 100 movies (20 per page)
      for (let page = 1; page <= 5; page++) {
        const response = await this.getPopularMoviesByPage(page);
        if (response && response.results) {
          allMovies.push(...response.results);
        }
      }
      
      console.log(`✅ Fetched ${allMovies.length} popular movies`);
      
      // Enrich with runtime data (process first 20 movies to avoid too many API calls)
      const moviesToEnrich = allMovies.slice(0, 20);
      const remainingMovies = allMovies.slice(20);
      
      const enrichedMovies = await this.enrichMoviesWithRuntime(moviesToEnrich, {
        maxConcurrent: 3, // Conservative to avoid rate limits
        delayMs: 200      // 200ms delay between batches
      });
      
      // Combine enriched movies with remaining movies
      const finalMovies = [...enrichedMovies, ...remainingMovies];
      
      return {
        results: finalMovies,
        total_results: finalMovies.length,
        total_pages: 5,
        page: 1
      };
    } catch (error) {
      console.error('Error fetching top 100 popular movies:', error.message);
      return {
        results: [],
        total_results: 0,
        total_pages: 0,
        page: 1
      };
    }
  }

  // Get single page of top-rated movies (internal helper function)
  async getTopRatedMoviesByPage(page = 1) {
    try {
      console.log(`🔍 TMDB: Fetching top-rated movies page ${page}...`);
      const response = await this.api.get('/movie/top_rated', {
        params: { page }
      });
      
      const data = response.data;
      console.log(`📊 TMDB Response for top-rated page ${page}:`, {
        total_results: data.total_results,
        total_pages: data.total_pages,
        current_page: data.page,
        results_count: data.results?.length || 0
      });
      
      return data;
    } catch (error) {
      console.error('TMDB Top Rated Movies Error:', error.message);
      return this.getFallbackData(page);
    }
  }

  // Get top 100 rated movies (main function - returns all 100 movies)
  async getTopRatedMovies() {
    try {
      console.log('🏆 Fetching top 100 rated movies...');
      const allMovies = [];
      
      // Fetch first 5 pages to get 100 movies (20 per page)
      for (let page = 1; page <= 5; page++) {
        const response = await this.getTopRatedMoviesByPage(page);
        if (response && response.results) {
          allMovies.push(...response.results);
        }
      }
      
      console.log(`✅ Fetched ${allMovies.length} top-rated movies`);
      
      // Enrich with runtime data (process first 20 movies to avoid too many API calls)
      const moviesToEnrich = allMovies.slice(0, 20);
      const remainingMovies = allMovies.slice(20);
      
      const enrichedMovies = await this.enrichMoviesWithRuntime(moviesToEnrich, {
        maxConcurrent: 3, // Conservative to avoid rate limits
        delayMs: 200      // 200ms delay between batches
      });
      
      // Combine enriched movies with remaining movies
      const finalMovies = [...enrichedMovies, ...remainingMovies];
      
      return {
        results: finalMovies,
        total_results: finalMovies.length,
        total_pages: 5,
        page: 1
      };
    } catch (error) {
      console.error('Error fetching top 100 rated movies:', error.message);
      return {
        results: [],
        total_results: 0,
        total_pages: 0,
        page: 1
      };
    }
  }

  // Log top 100 rated movies titles
  async logTop100RatedMovies() {
    try {
      console.log('🏆 Fetching top 100 rated movies...');
      const allMovies = [];
      
      // Fetch first 5 pages to get 100 movies (20 per page)
      for (let page = 1; page <= 5; page++) {
        const response = await this.getTopRatedMoviesByPage(page);
        if (response && response.results) {
          allMovies.push(...response.results);
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log('\n🎬 TOP 100 RATED MOVIES:');
      console.log('=' .repeat(80));
      
      allMovies.slice(0, 100).forEach((movie, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. ${movie.title} (${movie.vote_average}⭐) - ${movie.release_date?.substring(0, 4) || 'Unknown'}`);
      });
      
      console.log('=' .repeat(80));
      console.log(`✅ Logged ${Math.min(allMovies.length, 100)} top-rated movies\n`);
      
      return allMovies.slice(0, 100);
    } catch (error) {
      console.error('❌ Error logging top 100 movies:', error.message);
      return [];
    }
  }

  // Log top 100 popular movies titles
  async logTop100PopularMovies() {
    try {
      console.log('🔥 Fetching top 100 popular movies...');
      const allMovies = [];
      
      // Fetch first 5 pages to get 100 movies (20 per page)
      for (let page = 1; page <= 5; page++) {
        const response = await this.getPopularMoviesByPage(page);
        if (response && response.results) {
          allMovies.push(...response.results);
        }
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log('\n🔥 TOP 100 POPULAR MOVIES:');
      console.log('=' .repeat(80));
      
      allMovies.slice(0, 100).forEach((movie, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. ${movie.title} (${movie.vote_average}⭐) - ${movie.release_date?.substring(0, 4) || 'Unknown'}`);
      });
      
      console.log('=' .repeat(80));
      console.log(`✅ Logged ${Math.min(allMovies.length, 100)} popular movies\n`);
      
      return allMovies.slice(0, 100);
    } catch (error) {
      console.error('❌ Error logging top 100 popular movies:', error.message);
      return [];
    }
  }

  async getUpcomingMovies(page = 1) {
    try {
      const response = await this.api.get('/movie/upcoming', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      console.error('TMDB Upcoming Movies Error:', error.message);
      return this.getFallbackData(page);
    }
  }

  async getMixedMovies(limit = 20) {
    try {
      console.log(`🎭 Fetching mixed movies with runtime data (limit: ${limit})...`);
      
      // Get a mix of popular and top rated movies
      const [popular, topRated] = await Promise.all([
        this.getPopularMoviesByPage(1),
        this.getTopRatedMoviesByPage(1)
      ]);
      
      const mixed = [];
      const popularMovies = popular.results || [];
      const topRatedMovies = topRated.results || [];
      
      // Alternate between popular and top rated
      for (let i = 0; i < Math.min(limit, 20); i++) {
        if (i % 2 === 0 && popularMovies[Math.floor(i/2)]) {
          mixed.push(popularMovies[Math.floor(i/2)]);
        } else if (topRatedMovies[Math.floor(i/2)]) {
          mixed.push(topRatedMovies[Math.floor(i/2)]);
        }
      }
      
      const finalMovies = mixed.slice(0, limit);
      
      // Enrich with runtime data for better duration display
      console.log(`🕐 Enriching ${finalMovies.length} mixed movies with runtime data...`);
      const enrichedMovies = await this.enrichMoviesWithRuntime(finalMovies, {
        maxConcurrent: 5, // Can be more aggressive for smaller batches
        delayMs: 100      // Shorter delay for small batches
      });
      
      return enrichedMovies;
    } catch (error) {
      console.error('TMDB Mixed Movies Error:', error.message);
      // Return empty results if TMDB fails
      return [];
    }
  }

  async searchMovies(query, page = 1) {
    try {
      // Reinitialize if API key is missing (handles case where .env was added after startup)
      if (!this.apiKey) {
        console.log('🔄 API key missing, reinitializing TMDB service...');
        this.initialize();
      }
      
      const response = await this.api.get('/search/movie', {
        params: { 
          query: query,
          page: page
        }
      });
      return response.data;
    } catch (error) {
      console.error('TMDB Search Error:', error.message);
      
      // If it's a 401 error, try reinitializing once
      if (error.response && error.response.status === 401 && !this.hasTriedReinit) {
        console.log('🔄 401 error, trying to reinitialize TMDB service...');
        this.hasTriedReinit = true;
        this.initialize();
        
        try {
          const retryResponse = await this.api.get('/search/movie', {
            params: { 
              query: query,
              page: page
            }
          });
          this.hasTriedReinit = false; // Reset flag on success
          return retryResponse.data;
        } catch (retryError) {
          console.error('TMDB Search Retry Error:', retryError.message);
        }
      }
      
      // Return empty results if TMDB fails
      return {
        results: [],
        page: page,
        total_pages: 0,
        total_results: 0
      };
    }
  }

  // Progressive search that yields results as they're found
  async* searchMoviesProgressive(query, callback = null) {
    try {
      console.log(`🔍 Progressive search for: "${query}"`);
      
      // First, get the first page to see total pages available and yield immediately
      const firstResponse = await this.searchMovies(query, 1);
      console.log(`📊 First page response:`, {
        results: firstResponse.results?.length || 0,
        total_pages: firstResponse.total_pages,
        total_results: firstResponse.total_results
      });
      
      if (!firstResponse.results || firstResponse.results.length === 0) {
        console.log(`❌ No results found for "${query}"`);
        yield firstResponse;
        return;
      }
      
      // Yield first page immediately
      yield {
        results: firstResponse.results,
        total_results: firstResponse.total_results,
        total_pages: firstResponse.total_pages,
        current_page: 1,
        is_complete: firstResponse.total_pages <= 1
      };
      
      // If there's only one page, we're done
      if (firstResponse.total_pages <= 1) {
        return;
      }
      
      const totalPages = Math.min(firstResponse.total_pages, 30); // Limit to 30 pages max
      console.log(`📄 Will fetch ${totalPages - 1} additional pages`);
      
      // Fetch remaining pages and yield results progressively
      for (let page = 2; page <= totalPages; page++) {
        try {
          console.log(`📥 Fetching page ${page}/${totalPages}...`);
          const pageResponse = await this.searchMovies(query, page);
          
          if (pageResponse.results && pageResponse.results.length > 0) {
            console.log(`✅ Page ${page}: ${pageResponse.results.length} results`);
            
            // Yield this page's results
            yield {
              results: pageResponse.results,
              total_results: firstResponse.total_results,
              total_pages: firstResponse.total_pages,
              current_page: page,
              is_complete: page === totalPages
            };
            
            // Call callback if provided (for real-time updates)
            if (callback) {
              callback(pageResponse.results, page, totalPages);
            }
          } else {
            console.log(`⚠️ Page ${page}: No results`);
          }
          
          // Add delay between requests to avoid rate limiting
          if (page < totalPages) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
        } catch (pageError) {
          console.error(`❌ Error fetching page ${page}:`, pageError.message);
          // Continue with next page instead of failing completely
        }
      }
      
      console.log(`✅ Progressive search complete for "${query}"`);
      
    } catch (error) {
      console.error('Progressive search error:', error.message);
      // Fallback to single page search
      console.log('🔄 Falling back to single page search...');
      const fallback = await this.searchMovies(query, 1);
      yield {
        results: fallback.results || [],
        total_results: fallback.total_results || 0,
        total_pages: 1,
        current_page: 1,
        is_complete: true
      };
    }
  }

  // Progressive movie collection that yields results as they're found
  async* getMoviesProgressive(callback = null) {
    try {
      console.log(`🎬 Progressive movie collection starting...`);
      
      // Start with popular movies for immediate results
      console.log(`📥 Fetching popular movies (page 1)...`);
      const firstResponse = await this.getPopularMoviesByPage(1);
      
      if (firstResponse.results && firstResponse.results.length > 0) {
        console.log(`✅ First batch: ${firstResponse.results.length} popular movies`);
        
        // Yield first batch immediately
        yield {
          results: firstResponse.results,
          source: 'popular',
          page: 1,
          is_complete: false
        };
      }
      
      // Continue with more popular movies (increased from 25 to 50 pages)
      for (let page = 2; page <= 50; page++) {
        try {
          console.log(`📥 Fetching popular movies (page ${page})...`);
          const pageResponse = await this.getPopularMoviesByPage(page);
          
          if (pageResponse.results && pageResponse.results.length > 0) {
            console.log(`✅ Popular page ${page}: ${pageResponse.results.length} movies`);
            
            yield {
              results: pageResponse.results,
              source: 'popular',
              page: page,
              is_complete: false
            };
            
            if (callback) callback(pageResponse.results, 'popular', page);
          }
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (pageError) {
          console.error(`❌ Error fetching popular page ${page}:`, pageError.message);
        }
      }
      
      // Then add top-rated movies (increased from 25 to 50 pages)
      for (let page = 1; page <= 50; page++) {
        try {
          console.log(`📥 Fetching top-rated movies (page ${page})...`);
          const pageResponse = await this.getTopRatedMoviesByPage(page);
          
          if (pageResponse.results && pageResponse.results.length > 0) {
            console.log(`✅ Top-rated page ${page}: ${pageResponse.results.length} movies`);
            
            yield {
              results: pageResponse.results,
              source: 'top_rated',
              page: page,
              is_complete: false
            };
            
            if (callback) callback(pageResponse.results, 'top_rated', page);
          }
          
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (pageError) {
          console.error(`❌ Error fetching top-rated page ${page}:`, pageError.message);
        }
      }
      
      // Finally add upcoming movies
      const additionalSources = [
        { method: this.getUpcomingMovies.bind(this), name: 'upcoming' }
      ];
      
      for (const source of additionalSources) {
        for (let page = 1; page <= 50; page++) {
          try {
            console.log(`📥 Fetching ${source.name} movies (page ${page})...`);
            const pageResponse = await source.method(page);
            
            if (pageResponse.results && pageResponse.results.length > 0) {
              console.log(`✅ ${source.name} page ${page}: ${pageResponse.results.length} movies`);
              
              yield {
                results: pageResponse.results,
                source: source.name,
                page: page,
                is_complete: false
              };
              
              if (callback) callback(pageResponse.results, source.name, page);
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
          } catch (pageError) {
            console.error(`❌ Error fetching ${source.name} page ${page}:`, pageError.message);
          }
        }
      }
      
      // Mark as complete
      console.log(`✅ Progressive movie collection complete`);
      yield {
        results: [],
        source: 'complete',
        page: 0,
        is_complete: true
      };
      
    } catch (error) {
      console.error('Progressive movie collection error:', error.message);
      // Fallback to basic popular movies
      console.log('🔄 Falling back to basic popular movies...');
      const fallback = await this.getPopularMoviesByPage(1);
      yield {
        results: fallback.results || [],
        source: 'fallback',
        page: 1,
        is_complete: true
      };
    }
  }

  // Search all movies across multiple pages for comprehensive results
  async searchAllMovies(query) {
    try {
      console.log(`🔍 Comprehensive search for: "${query}"`);
      
      // First, get the first page to see total pages available
      const firstResponse = await this.searchMovies(query, 1);
      console.log(`📊 First page response:`, {
        results: firstResponse.results?.length || 0,
        total_pages: firstResponse.total_pages,
        total_results: firstResponse.total_results
      });
      
      if (!firstResponse.results || firstResponse.results.length === 0) {
        console.log(`❌ No results found for "${query}"`);
        return firstResponse;
      }
      
      const totalPages = Math.min(firstResponse.total_pages || 1, 30); // Increase to 30 pages max (600 results)
      const allResults = [...firstResponse.results];
      
      console.log(`📄 Will fetch ${totalPages} pages total (${firstResponse.total_results} results available)`);
      
      // If there's only one page, return immediately
      if (totalPages <= 1) {
        console.log(`✅ Single page result: ${allResults.length} movies`);
        return {
          results: allResults,
          total_results: allResults.length,
          total_pages: 1,
          page: 1
        };
      }
      
      // Fetch remaining pages sequentially to avoid rate limiting issues
      console.log(`� Fetching pages 2 to ${totalPages}...`);
      
      for (let page = 2; page <= totalPages; page++) {
        try {
          console.log(`� Fetching page ${page}/${totalPages}...`);
          const pageResponse = await this.searchMovies(query, page);
          
          if (pageResponse.results && pageResponse.results.length > 0) {
            allResults.push(...pageResponse.results);
            console.log(`✅ Page ${page}: ${pageResponse.results.length} results (total: ${allResults.length})`);
          } else {
            console.log(`⚠️ Page ${page}: No results`);
          }
          
          // Add delay between requests to avoid rate limiting
          if (page < totalPages) {
            await new Promise(resolve => setTimeout(resolve, 250));
          }
          
        } catch (pageError) {
          console.error(`❌ Error fetching page ${page}:`, pageError.message);
          // Continue with next page instead of failing completely
        }
      }
      
      console.log(`✅ Comprehensive search complete: ${allResults.length} total results from ${totalPages} pages`);
      
      return {
        results: allResults,
        total_results: allResults.length,
        total_pages: 1, // Return as single page since we're combining all results
        page: 1
      };
      
    } catch (error) {
      console.error('Comprehensive search error:', error.message);
      // Fallback to single page search
      console.log('🔄 Falling back to single page search...');
      return await this.searchMovies(query, 1);
    }
  }

  async getGenres() {
    try {
      const response = await this.api.get('/genre/movie/list');
      return response.data.genres;
    } catch (error) {
      console.error('TMDB Genres Error:', error.message);
      console.log('⚠️  TMDB Genres API unavailable - returning empty genres list');
      return [];
    }
  }

  async getMoviesByGenre(genreId, page = 1) {
    try {
      const response = await this.api.get('/discover/movie', {
        params: { 
          with_genres: genreId,
          page: page
        }
      });
      return response.data;
    } catch (error) {
      console.error('TMDB Movies by Genre Error:', error.message);
      return this.getFallbackData(page);
    }
  }

  async getSimilarMovies(movieId, page = 1) {
    try {
      const response = await this.api.get(`/movie/${movieId}/similar`, {
        params: { page }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('TMDB Similar Movies Error:', error.message);
      return (await this.getPopularMoviesByPage(page)).results || [];
    }
  }

  async getMovieRecommendations(movieId, page = 1) {
    try {
      const response = await this.api.get(`/movie/${movieId}/recommendations`, {
        params: { page }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('TMDB Movie Recommendations Error:', error.message);
      return (await this.getPopularMoviesByPage(page)).results || [];
    }
  }

  async getMovieDetails(movieId) {
    try {
      const response = await this.api.get(`/movie/${movieId}`);
      return response.data;
    } catch (error) {
      console.error('TMDB Movie Details Error:', error.message);
      // Return null if movie not found
      return null;
    }
  }

  // Enrich movies with runtime data (batch processing with rate limiting)
  async enrichMoviesWithRuntime(movies, options = {}) {
    const { maxConcurrent = 5, delayMs = 100 } = options;
    
    console.log(`🕐 Enriching ${movies.length} movies with runtime data...`);
    
    const enrichedMovies = [];
    
    // Process movies in batches to avoid rate limiting
    for (let i = 0; i < movies.length; i += maxConcurrent) {
      const batch = movies.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (movie) => {
        try {
          const details = await this.getMovieDetails(movie.id);
          if (details && details.runtime) {
            return {
              ...movie,
              runtime: details.runtime, // Add runtime in minutes
              status: details.status,
              tagline: details.tagline
            };
          }
          return movie; // Return original if no runtime found
        } catch (error) {
          console.warn(`Failed to get runtime for movie ${movie.id}:`, error.message);
          return movie; // Return original on error
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      enrichedMovies.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + maxConcurrent < movies.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      console.log(`📊 Processed ${Math.min(i + maxConcurrent, movies.length)}/${movies.length} movies`);
    }
    
    const moviesWithRuntime = enrichedMovies.filter(m => m.runtime);
    console.log(`✅ Successfully enriched ${moviesWithRuntime.length}/${movies.length} movies with runtime data`);
    
    return enrichedMovies;
  }

  async getMovieCredits(movieId) {
    try {
      const response = await this.api.get(`/movie/${movieId}/credits`);
      return response.data;
    } catch (error) {
      console.error('TMDB Movie Credits Error:', error.message);
      return { cast: [], crew: [] };
    }
  }

  // Get comprehensive movie list for search functionality
  async getAllMoviesForSearch() {
    try {
      console.log('Fetching comprehensive movie list for search...');
      
      // Fetch multiple categories and pages for a comprehensive movie list
      const [
        popularPage1, popularPage2, popularPage3,
        topRatedPage1, topRatedPage2,
        nowPlayingPage1, nowPlayingPage2,
        upcomingPage1
      ] = await Promise.allSettled([
        this.getPopularMoviesByPage(1),
        this.getPopularMoviesByPage(2), 
        this.getPopularMoviesByPage(3),
        this.getTopRatedMoviesByPage(1),
        this.getTopRatedMoviesByPage(2),
        this.getUpcomingMovies(1)
      ]);

      // Collect all successful results
      const allResults = [];
      const responses = [
        popularPage1, popularPage2, popularPage3,
        topRatedPage1, topRatedPage2,
        upcomingPage1
      ];

      responses.forEach(response => {
        if (response.status === 'fulfilled' && response.value && response.value.results) {
          allResults.push(...response.value.results);
        }
      });

      // Remove duplicates based on movie ID
      const uniqueMovies = [];
      const seenIds = new Set();
      
      allResults.forEach(movie => {
        if (!seenIds.has(movie.id)) {
          seenIds.add(movie.id);
          uniqueMovies.push(movie);
        }
      });

      console.log(`Fetched ${uniqueMovies.length} unique movies for search`);
      return uniqueMovies;
      
    } catch (error) {
      console.error('Error fetching comprehensive movie list:', error.message);
      // Enhanced fallback strategy
      try {
        // First try popular movies
        const fallback = await this.getPopularMoviesByPage(1);
        if (fallback.results && fallback.results.length > 0) {
          return fallback.results;
        }
      } catch (fallbackError) {
        console.log('TMDB fallback also failed, using database fallback');
      }
      
      // If TMDB completely fails, return database movies
      return this.getFallbackData(1);
    }
  }

  // Get extensive movie collection for home page (2000 movies target)
  async getExtensiveMovieCollection() {
    try {
      console.log('🎬 Starting extensive movie collection fetch (targeting 3000 movies)...');
      
      const allMovies = [];
      const seenIds = new Set();
      const targetMovies = 3000; // Increased from 2000 to get even more movies
      const concurrent = 10; // Increase concurrent requests for faster loading
      
      // Strategy 1: Use discover endpoint with different configurations
      const discoverConfigs = [
        { sort_by: 'popularity.desc' },
        { sort_by: 'vote_average.desc', 'vote_count.gte': 100 },
        { sort_by: 'release_date.desc' },
        { sort_by: 'revenue.desc', 'revenue.gte': 1000000 },
        { sort_by: 'primary_release_date.desc' },
        { sort_by: 'vote_count.desc' }
      ];
      
      // Fetch 50 pages from each configuration
      const pagesPerConfig = 50;
      
      for (const [configIndex, config] of discoverConfigs.entries()) {
        console.log(`📡 Config ${configIndex + 1}/${discoverConfigs.length}: ${config.sort_by}`);
        
        for (let i = 0; i < pagesPerConfig; i += concurrent) {
          const pagePromises = [];
          
          for (let j = 0; j < concurrent && (i + j) < pagesPerConfig; j++) {
            const page = i + j + 1;
            pagePromises.push(this.discoverMovies(page, config));
          }
          
          const results = await Promise.allSettled(pagePromises);
          
          results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value && result.value.results) {
              const currentPage = i + index + 1;
              const newMovies = result.value.results.filter(movie => !seenIds.has(movie.id));
              
              newMovies.forEach(movie => {
                seenIds.add(movie.id);
                allMovies.push(movie);
              });
              
              console.log(`📄 Config ${configIndex + 1} Page ${currentPage}: +${newMovies.length} new movies (total: ${allMovies.length})`);
            }
          });
          
          // Add delay to avoid rate limiting
          if (i + concurrent < pagesPerConfig) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // Stop if we've reached our target
          if (allMovies.length >= targetMovies) {
            console.log(`🎯 Target reached! ${allMovies.length} movies collected`);
            return allMovies;
          }
        }
        
        console.log(`✅ Config ${configIndex + 1} complete: ${allMovies.length} total movies`);
        
        // Brief pause between configurations
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      console.log(`🎬 Final result: ${allMovies.length} unique movies collected`);
      
      // If still not enough, try additional endpoints
      if (allMovies.length < targetMovies) {
        console.log(`🔄 Still need ${targetMovies - allMovies.length} more movies, trying additional endpoints...`);
        
        const additionalEndpoints = [
          { name: 'Popular', method: this.getPopularMovies.bind(this) },
          { name: 'Top Rated', method: this.getTopRatedMovies.bind(this) },
          { name: 'Upcoming', method: this.getUpcomingMovies.bind(this) }
        ];
        
        for (const endpoint of additionalEndpoints) {
          if (allMovies.length >= targetMovies) break;
          
          for (let page = 1; page <= 20 && allMovies.length < targetMovies; page++) {
            try {
              const response = await endpoint.method(page);
              if (response && response.results) {
                const newMovies = response.results.filter(movie => !seenIds.has(movie.id));
                newMovies.forEach(movie => {
                  seenIds.add(movie.id);
                  allMovies.push(movie);
                });
                console.log(`📄 ${endpoint.name} Page ${page}: +${newMovies.length} new (total: ${allMovies.length})`);
              }
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              console.error(`Error fetching ${endpoint.name} page ${page}:`, error.message);
            }
          }
        }
      }
      
      console.log(`🏆 FINAL COLLECTION: ${allMovies.length} unique movies`);
      
      // Enrich first 50 movies with runtime data to provide accurate durations
      console.log('🕐 [EXTENSIVE] Enriching first 50 movies with runtime data...');
      const moviesToEnrich = allMovies.slice(0, 50);
      const remainingMovies = allMovies.slice(50);
      
      console.log(`📊 [EXTENSIVE] Processing batch: ${moviesToEnrich.length} movies to enrich, ${remainingMovies.length} remaining`);
      
      const enrichedMovies = await this.enrichMoviesWithRuntime(moviesToEnrich, {
        maxConcurrent: 5, // Conservative to avoid rate limits
        delayMs: 150      // 150ms delay between batches
      });
      
      // Combine enriched movies with remaining movies
      const finalMovies = [...enrichedMovies, ...remainingMovies];
      
      // Log enrichment results
      const enrichedWithRuntime = enrichedMovies.filter(m => m.runtime && m.runtime > 0);
      console.log(`✅ [EXTENSIVE] Enrichment complete: ${enrichedWithRuntime.length}/${moviesToEnrich.length} movies now have runtime data`);
      console.log(`📈 [EXTENSIVE] Final collection: ${finalMovies.length} total movies, ${enrichedWithRuntime.length} with runtime data`);
      
      return finalMovies;
      
    } catch (error) {
      console.error('Error fetching extensive movie collection:', error.message);
      // Fallback to basic collection
      return await this.getAllMoviesForSearch();
    }
  }

  // Enhanced discover method with configurable parameters
  async discoverMovies(page = 1, config = {}) {
    try {
      const params = {
        page,
        include_adult: false,
        ...config
      };
      
      const response = await this.api.get('/discover/movie', { params });
      return response.data;
    } catch (error) {
      console.error(`TMDB Discover Error (page ${page}, config: ${JSON.stringify(config)}):`, error.message);
      // Fallback to popular movies for this page
      return await this.getPopularMoviesByPage(page);
    }
  }

  // Fallback method when API fails
  getFallbackData(page = 1) {
    // Return empty result when TMDB API is not available
    console.log('⚠️  TMDB API unavailable - returning empty results');
    return {
      results: [],
      page: page,
      total_pages: 0,
      total_results: 0
    };
  }
}

module.exports = new TMDBService();
