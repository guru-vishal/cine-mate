const axios = require('axios');

const TMDB_API_KEY = '4bb16f9b03be7c2a0c824f535199e2ef';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

class TMDBService {
  constructor() {
    this.api = axios.create({
      baseURL: TMDB_BASE_URL,
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US'
      },
      timeout: 10000
    });
    
    // Request throttling
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
    this.MIN_REQUEST_INTERVAL = 100; // 100ms between requests
  }

  async throttledRequest(requestFn) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const { requestFn, resolve, reject } = this.requestQueue.shift();
      
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest));
      }

      try {
        const result = await requestFn();
        resolve(result);
      } catch (error) {
        reject(error);
      }

      this.lastRequestTime = Date.now();
    }

    this.isProcessing = false;
  }

  // Get popular movies
  async getPopularMovies(page = 1) {
    try {
      const response = await this.throttledRequest(() => 
        this.api.get('/movie/popular', { params: { page } })
      );
      return this.transformMovieList(response.data.results);
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      throw error;
    }
  }

  // Get top rated movies
  async getTopRatedMovies(page = 1) {
    try {
      const response = await this.api.get('/movie/top_rated', {
        params: { page }
      });
      return this.transformMovieList(response.data.results);
    } catch (error) {
      console.error('Error fetching top rated movies:', error);
      throw error;
    }
  }

  // Get now playing movies
  async getNowPlayingMovies(page = 1) {
    try {
      const response = await this.api.get('/movie/now_playing', {
        params: { page }
      });
      return this.transformMovieList(response.data.results);
    } catch (error) {
      console.error('Error fetching now playing movies:', error);
      throw error;
    }
  }

  // Get upcoming movies
  async getUpcomingMovies(page = 1) {
    try {
      const response = await this.api.get('/movie/upcoming', {
        params: { page }
      });
      return this.transformMovieList(response.data.results);
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
      throw error;
    }
  }

  // Get movie details by ID
  async getMovieDetails(tmdbId) {
    try {
      const [movieResponse, creditsResponse, watchProvidersResponse] = await Promise.all([
        this.api.get(`/movie/${tmdbId}`),
        this.api.get(`/movie/${tmdbId}/credits`),
        this.api.get(`/movie/${tmdbId}/watch/providers`).catch(() => ({ data: { results: {} } }))
      ]);

      return this.transformMovieDetails(
        movieResponse.data, 
        creditsResponse.data, 
        watchProvidersResponse.data.results
      );
    } catch (error) {
      console.error('Error fetching movie details:', error);
      throw error;
    }
  }

  // Search movies
  async searchMovies(query, page = 1) {
    try {
      const response = await this.api.get('/search/movie', {
        params: { query, page }
      });
      return this.transformMovieList(response.data.results);
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  }

  // Get movies by genre
  async getMoviesByGenre(genreId, page = 1) {
    try {
      const response = await this.api.get('/discover/movie', {
        params: { 
          with_genres: genreId,
          page,
          sort_by: 'popularity.desc'
        }
      });
      return this.transformMovieList(response.data.results);
    } catch (error) {
      console.error('Error fetching movies by genre:', error);
      throw error;
    }
  }

  // Get all genres
  async getGenres() {
    try {
      const response = await this.api.get('/genre/movie/list');
      return response.data.genres;
    } catch (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }
  }

  // Get similar movies
  async getSimilarMovies(tmdbId, page = 1) {
    try {
      const response = await this.api.get(`/movie/${tmdbId}/similar`, {
        params: { page }
      });
      return this.transformMovieList(response.data.results);
    } catch (error) {
      console.error('Error fetching similar movies:', error);
      throw error;
    }
  }

  // Get movie recommendations
  async getMovieRecommendations(tmdbId, page = 1) {
    try {
      const response = await this.api.get(`/movie/${tmdbId}/recommendations`, {
        params: { page }
      });
      return this.transformMovieList(response.data.results);
    } catch (error) {
      console.error('Error fetching movie recommendations:', error);
      throw error;
    }
  }

  // Transform TMDB movie list to our format
  transformMovieList(tmdbMovies) {
    return tmdbMovies.map(movie => this.transformMovie(movie));
  }

  // Transform single TMDB movie to our format
  transformMovie(tmdbMovie) {
    return {
      id: tmdbMovie.id.toString(),
      tmdb_id: tmdbMovie.id.toString(),
      title: tmdbMovie.title,
      description: tmdbMovie.overview || 'No description available',
      genre: this.getGenreNames(tmdbMovie.genre_ids || []),
      rating: parseFloat((tmdbMovie.vote_average || 0).toFixed(1)),
      year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null,
      poster_url: tmdbMovie.poster_path 
        ? `${TMDB_IMAGE_BASE_URL}/w500${tmdbMovie.poster_path}`
        : 'https://via.placeholder.com/500x750/374151/ffffff?text=No+Image',
      backdrop_url: tmdbMovie.backdrop_path
        ? `${TMDB_IMAGE_BASE_URL}/original${tmdbMovie.backdrop_path}`
        : 'https://via.placeholder.com/1920x1080/374151/ffffff?text=No+Image',
      release_date: tmdbMovie.release_date,
      popularity: tmdbMovie.popularity,
      vote_count: tmdbMovie.vote_count
    };
  }

  // Transform detailed movie data
  transformMovieDetails(tmdbMovie, credits, watchProviders = {}) {
    const director = credits.crew.find(person => person.job === 'Director')?.name || 'Unknown';
    const cast = credits.cast.slice(0, 10).map(actor => actor.name);
    
    // Process watch providers (focus on US for now, can be expanded)
    const usProviders = watchProviders.US || {};
    const streamingPlatforms = this.extractWatchProviders(usProviders, tmdbMovie.title);

    return {
      id: tmdbMovie.id.toString(),
      tmdb_id: tmdbMovie.id.toString(),
      title: tmdbMovie.title,
      description: tmdbMovie.overview || 'No description available',
      genre: tmdbMovie.genres.map(g => g.name),
      rating: parseFloat((tmdbMovie.vote_average || 0).toFixed(1)),
      year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null,
      duration: tmdbMovie.runtime || 0,
      director: director,
      cast: cast,
      poster_url: tmdbMovie.poster_path 
        ? `${TMDB_IMAGE_BASE_URL}/w500${tmdbMovie.poster_path}`
        : 'https://via.placeholder.com/500x750/374151/ffffff?text=No+Image',
      backdrop_url: tmdbMovie.backdrop_path
        ? `${TMDB_IMAGE_BASE_URL}/original${tmdbMovie.backdrop_path}`
        : 'https://via.placeholder.com/1920x1080/374151/ffffff?text=No+Image',
      release_date: tmdbMovie.release_date,
      popularity: tmdbMovie.popularity,
      vote_count: tmdbMovie.vote_count,
      budget: tmdbMovie.budget,
      revenue: tmdbMovie.revenue,
      tagline: tmdbMovie.tagline,
      status: tmdbMovie.status,
      original_language: tmdbMovie.original_language,
      language: this.getLanguageName(tmdbMovie.original_language),
      production_companies: tmdbMovie.production_companies?.map(company => company.name) || [],
      watch_providers: streamingPlatforms
    };
  }

  // Helper method to get language names from codes
  getLanguageName(languageCode) {
    const languageMap = {
      'en': 'English',
      'es': 'Spanish', 
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'hi': 'Hindi',
      'ru': 'Russian',
      'pt': 'Portuguese',
      'ar': 'Arabic',
      'th': 'Thai',
      'tr': 'Turkish',
      'pl': 'Polish',
      'nl': 'Dutch',
      'sv': 'Swedish',
      'da': 'Danish',
      'no': 'Norwegian',
      'fi': 'Finnish'
    };
    return languageMap[languageCode] || languageCode?.toUpperCase() || 'Unknown';
  }

  // Helper method to get genre names from IDs
  getGenreNames(genreIds) {
    const genreMap = {
      28: 'Action',
      12: 'Adventure',
      16: 'Animation',
      35: 'Comedy',
      80: 'Crime',
      99: 'Documentary',
      18: 'Drama',
      10751: 'Family',
      14: 'Fantasy',
      36: 'History',
      27: 'Horror',
      10402: 'Music',
      9648: 'Mystery',
      10749: 'Romance',
      878: 'Science Fiction',
      10770: 'TV Movie',
      53: 'Thriller',
      10752: 'War',
      37: 'Western'
    };

    return genreIds.map(id => genreMap[id] || 'Unknown').filter(genre => genre !== 'Unknown');
  }

  // Get mixed content (popular movies for now to avoid rate limiting)
  async getMixedMovies(limit = 20) {
    try {
      // Just get popular movies to avoid connection issues
      const popular = await this.getPopularMovies(1);
      
      // Shuffle and limit the results
      return this.shuffleArray(popular).slice(0, limit);
    } catch (error) {
      console.error('Error fetching mixed movies:', error);
      throw error;
    }
  }

  // Extract and format watch providers
  extractWatchProviders(usProviders, movieTitle = '') {
    const providers = [];
    
    // Streaming platforms (flatrate)
    if (usProviders.flatrate) {
      usProviders.flatrate.forEach(provider => {
        providers.push({
          name: provider.provider_name,
          logo: `${TMDB_IMAGE_BASE_URL}/original${provider.logo_path}`,
          type: 'stream',
          url: this.getProviderUrl(provider.provider_name, movieTitle)
        });
      });
    }
    
    // Rent platforms
    if (usProviders.rent) {
      usProviders.rent.forEach(provider => {
        providers.push({
          name: provider.provider_name,
          logo: `${TMDB_IMAGE_BASE_URL}/original${provider.logo_path}`,
          type: 'rent',
          url: this.getProviderUrl(provider.provider_name, movieTitle)
        });
      });
    }
    
    // Buy platforms
    if (usProviders.buy) {
      usProviders.buy.forEach(provider => {
        providers.push({
          name: provider.provider_name,
          logo: `${TMDB_IMAGE_BASE_URL}/original${provider.logo_path}`,
          type: 'buy',
          url: this.getProviderUrl(provider.provider_name, movieTitle)
        });
      });
    }
    
    return providers;
  }

  // Get provider URLs
  getProviderUrl(providerName, movieTitle = '') {
    const encodedTitle = encodeURIComponent(movieTitle);
    
    const providerUrls = {
      // Major US/International Platforms
      'Netflix': movieTitle ? `https://www.netflix.com/search?q=${encodedTitle}` : 'https://www.netflix.com',
      'Amazon Prime Video': movieTitle ? `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodedTitle}` : 'https://www.primevideo.com',
      'Apple TV': movieTitle ? `https://tv.apple.com/search?term=${encodedTitle}` : 'https://tv.apple.com',
      'Apple TV+': movieTitle ? `https://tv.apple.com/search?term=${encodedTitle}` : 'https://tv.apple.com',
      'Disney Plus': movieTitle ? `https://www.disneyplus.com/search/${encodedTitle}` : 'https://www.disneyplus.com',
      'Disney+': movieTitle ? `https://www.disneyplus.com/search/${encodedTitle}` : 'https://www.disneyplus.com',
      'Hulu': movieTitle ? `https://www.hulu.com/search?q=${encodedTitle}` : 'https://www.hulu.com',
      'HBO Max': movieTitle ? `https://www.hbomax.com/search?q=${encodedTitle}` : 'https://www.hbomax.com',
      'Max': movieTitle ? `https://www.max.com/search/${encodedTitle}` : 'https://www.max.com',
      'Paramount Plus': movieTitle ? `https://www.paramountplus.com/search/${encodedTitle}` : 'https://www.paramountplus.com',
      'Paramount+': movieTitle ? `https://www.paramountplus.com/search/${encodedTitle}` : 'https://www.paramountplus.com',
      'Peacock': movieTitle ? `https://www.peacocktv.com/search/${encodedTitle}` : 'https://www.peacocktv.com',
      'Peacock Premium': movieTitle ? `https://www.peacocktv.com/search/${encodedTitle}` : 'https://www.peacocktv.com',
      
      // Digital/Rental Platforms
      'YouTube': movieTitle ? `https://www.youtube.com/results?search_query=${encodedTitle}+full+movie` : 'https://www.youtube.com/movies',
      'YouTube Movies': movieTitle ? `https://www.youtube.com/results?search_query=${encodedTitle}+full+movie` : 'https://www.youtube.com/movies',
      'Google Play Movies': movieTitle ? `https://play.google.com/store/search?q=${encodedTitle}&c=movies` : 'https://play.google.com/store/movies',
      'Google Play Movies & TV': movieTitle ? `https://play.google.com/store/search?q=${encodedTitle}&c=movies` : 'https://play.google.com/store/movies',
      'Vudu': movieTitle ? `https://www.vudu.com/content/movies/search/${encodedTitle}` : 'https://www.vudu.com',
      'Microsoft Store': movieTitle ? `https://www.microsoft.com/store/search?q=${encodedTitle}` : 'https://www.microsoft.com/store/movies-and-tv',
      'Amazon Video': movieTitle ? `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodedTitle}` : 'https://www.primevideo.com',
      'Apple iTunes': movieTitle ? `https://tv.apple.com/search?term=${encodedTitle}` : 'https://tv.apple.com',
      
      // International/Regional Platforms
      'JioHotstar': movieTitle ? `https://www.hotstar.com/in/search?q=${encodedTitle}` : 'https://www.hotstar.com/in',
      'Disney+ Hotstar': movieTitle ? `https://www.hotstar.com/in/search?q=${encodedTitle}` : 'https://www.hotstar.com/in',
      'Hotstar': movieTitle ? `https://www.hotstar.com/in/search?q=${encodedTitle}` : 'https://www.hotstar.com/in',
      'JioCinema': movieTitle ? `https://www.jiocinema.com/search/${encodedTitle}` : 'https://www.jiocinema.com',
      'Zee5': movieTitle ? `https://www.zee5.com/search?q=${encodedTitle}` : 'https://www.zee5.com',
      'SonyLIV': movieTitle ? `https://www.sonyliv.com/searchresults?searchfor=${encodedTitle}` : 'https://www.sonyliv.com',
      'Voot': movieTitle ? `https://www.voot.com/search?q=${encodedTitle}` : 'https://www.voot.com',
      'MX Player': movieTitle ? `https://www.mxplayer.in/search?q=${encodedTitle}` : 'https://www.mxplayer.in',
      'Aha': movieTitle ? `https://www.aha.video/search?q=${encodedTitle}` : 'https://www.aha.video',
      
      // Free Streaming Platforms
      'Tubi': movieTitle ? `https://tubitv.com/search/${encodedTitle}` : 'https://tubitv.com',
      'Pluto TV': movieTitle ? `https://pluto.tv/search/details/${encodedTitle}` : 'https://pluto.tv',
      'Crackle': movieTitle ? `https://www.crackle.com/search?q=${encodedTitle}` : 'https://www.crackle.com',
      'IMDb TV': movieTitle ? `https://www.imdb.com/find?q=${encodedTitle}&s=tt&ttype=ft` : 'https://www.imdb.com',
      'Roku Channel': movieTitle ? `https://therokuchannel.roku.com/search/${encodedTitle}` : 'https://therokuchannel.roku.com',
      
      // Anime/Specialty Platforms  
      'Crunchyroll': movieTitle ? `https://www.crunchyroll.com/search?q=${encodedTitle}` : 'https://www.crunchyroll.com',
      'Funimation': movieTitle ? `https://www.funimation.com/search/?q=${encodedTitle}` : 'https://www.funimation.com',
      'AnimeLab': movieTitle ? `https://www.animelab.com/search?q=${encodedTitle}` : 'https://www.animelab.com',
      
      // Other International
      'BBC iPlayer': movieTitle ? `https://www.bbc.co.uk/iplayer/search?q=${encodedTitle}` : 'https://www.bbc.co.uk/iplayer',
      'ITV Hub': movieTitle ? `https://www.itv.com/hub/search?q=${encodedTitle}` : 'https://www.itv.com/hub',
      'All 4': movieTitle ? `https://www.channel4.com/search?q=${encodedTitle}` : 'https://www.channel4.com',
      'ITVX': movieTitle ? `https://www.itv.com/watch/search?q=${encodedTitle}` : 'https://www.itv.com/watch',
      
      // Aggregators
      'JustWatch': movieTitle ? `https://www.justwatch.com/us/search?q=${encodedTitle}` : 'https://www.justwatch.com',
      'Reelgood': movieTitle ? `https://reelgood.com/search?q=${encodedTitle}` : 'https://reelgood.com'
    };
    
    return providerUrls[providerName] || '#';
  }

  // Remove duplicate movies
  removeDuplicates(movies) {
    const seen = new Set();
    return movies.filter(movie => {
      if (seen.has(movie.id)) {
        return false;
      }
      seen.add(movie.id);
      return true;
    });
  }

  // Shuffle array
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

module.exports = new TMDBService();