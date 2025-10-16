import React, { useEffect, useState } from 'react';
import { Play, TrendingUp, Sparkles, Filter, X } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import { useMovie } from '../context/MovieContext';

const Home = () => {
  const { movies, recommendations, loading, fetchMovies, getRecommendations } = useMovie();
  const [heroMovie, setHeroMovie] = useState(null);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    language: '',
    minRating: 0,
    maxRating: 10,
    genre: ''
  });

  useEffect(() => {
    fetchMovies();
    getRecommendations();
  }, [fetchMovies, getRecommendations]);

  useEffect(() => {
    const moviesArray = Array.isArray(movies) ? movies : [];
    if (moviesArray.length > 0) {
      // Set a random movie as hero or the highest rated one
      const hero = moviesArray.find(movie => movie.rating >= 9.0) || moviesArray[0];
      setHeroMovie(hero);
    }
  }, [movies]);

  // Filter movies based on current filters
  useEffect(() => {
    const moviesArray = Array.isArray(movies) ? movies : [];
    let filtered = moviesArray.filter(movie => {
      const matchesLanguage = !filters.language || 
        (movie.language && movie.language.toLowerCase().includes(filters.language.toLowerCase()));
      
      const matchesRating = movie.rating >= filters.minRating && movie.rating <= filters.maxRating;
      
      const matchesGenre = !filters.genre || 
        (Array.isArray(movie.genre) && movie.genre.some(g => 
          g.toLowerCase().includes(filters.genre.toLowerCase())
        ));

      return matchesLanguage && matchesRating && matchesGenre;
    });
    setFilteredMovies(filtered);
  }, [movies, filters]);

  // Get unique languages from movies
  const getUniqueLanguages = () => {
    const moviesArray = Array.isArray(movies) ? movies : [];
    const languages = moviesArray
      .map(movie => movie.language)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return languages;
  };

  // Get unique genres from movies
  const getUniqueGenres = () => {
    const moviesArray = Array.isArray(movies) ? movies : [];
    const genres = moviesArray
      .flatMap(movie => Array.isArray(movie.genre) ? movie.genre : [])
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return genres;
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      language: '',
      minRating: 0,
      maxRating: 10,
      genre: ''
    });
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="bg-gray-800 rounded-xl aspect-[2/3] mb-4"></div>
          <div className="bg-gray-800 h-4 rounded mb-2"></div>
          <div className="bg-gray-800 h-3 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {heroMovie && (
        <section className="relative h-screen overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              src={heroMovie.backdrop_url}
              alt={heroMovie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex items-center h-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in">
                  {heroMovie.title}
                </h1>
                
                <div className="flex items-center space-x-6 mb-6 animate-slide-up">
                  <span className="text-lg text-gray-300">{heroMovie.year}</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-400">★</span>
                    <span className="text-white font-semibold">{heroMovie.rating}</span>
                  </div>
                  <span className="text-gray-300">{heroMovie.duration} min</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-6 animate-slide-up">
                  {heroMovie.genre.map((genre, index) => (
                    <span
                      key={index}
                      className="bg-primary-600/20 text-primary-300 px-3 py-1 rounded-full text-sm border border-primary-500/30"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                <p className="text-xl text-gray-300 mb-8 leading-relaxed animate-slide-up">
                  {heroMovie.description}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 animate-scale-in">
                  <button className="flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl">
                    <Play className="h-6 w-6 fill-current" />
                    <span>Watch Now</span>
                  </button>
                  
                  <button className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-semibold border border-white/30 backdrop-blur-sm transition-all duration-300 transform hover:scale-105">
                    <span>More Info</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Movies Grid Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Popular Movies */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-primary-500" />
                <h2 className="text-3xl font-bold text-white">Popular Movies</h2>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl p-6 mb-8 animate-slide-down">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Filter Movies</h3>
                  <button
                    onClick={clearFilters}
                    className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Language Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                    <select
                      value={filters.language}
                      onChange={(e) => handleFilterChange('language', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">All Languages</option>
                      {getUniqueLanguages().map(language => (
                        <option key={language} value={language}>{language}</option>
                      ))}
                    </select>
                  </div>

                  {/* Genre Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Genre</label>
                    <select
                      value={filters.genre}
                      onChange={(e) => handleFilterChange('genre', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">All Genres</option>
                      {getUniqueGenres().map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Rating Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Min Rating: {filters.minRating}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={filters.minRating}
                      onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Rating: {filters.maxRating}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={filters.maxRating}
                      onChange={(e) => handleFilterChange('maxRating', parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>

                {/* Active Filters Display */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {filters.language && (
                    <span className="bg-primary-600/20 text-primary-300 px-3 py-1 rounded-full text-sm border border-primary-500/30 flex items-center space-x-2">
                      <span>Language: {filters.language}</span>
                      <button onClick={() => handleFilterChange('language', '')} className="hover:text-primary-200">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filters.genre && (
                    <span className="bg-primary-600/20 text-primary-300 px-3 py-1 rounded-full text-sm border border-primary-500/30 flex items-center space-x-2">
                      <span>Genre: {filters.genre}</span>
                      <button onClick={() => handleFilterChange('genre', '')} className="hover:text-primary-200">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {(filters.minRating > 0 || filters.maxRating < 10) && (
                    <span className="bg-primary-600/20 text-primary-300 px-3 py-1 rounded-full text-sm border border-primary-500/30 flex items-center space-x-2">
                      <span>Rating: {filters.minRating} - {filters.maxRating}</span>
                      <button onClick={() => {
                        handleFilterChange('minRating', 0);
                        handleFilterChange('maxRating', 10);
                      }} className="hover:text-primary-200">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {loading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <div className="mb-4 text-gray-300 text-sm">
                  Showing {filteredMovies.length} of {Array.isArray(movies) ? movies.length : 0} movies
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredMovies.slice(0, 12).map((movie) => (
                    <div key={movie.id} className="animate-fade-in">
                      <MovieCard movie={movie} />
                    </div>
                  ))}
                </div>
                {filteredMovies.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-lg mb-2">No movies found</div>
                    <div className="text-gray-500 text-sm">Try adjusting your filters</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Recommendations */}
          {Array.isArray(recommendations) && recommendations.length > 0 && (
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <Sparkles className="h-8 w-8 text-primary-500" />
                <h2 className="text-3xl font-bold text-white">Recommended for You</h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recommendations.map((movie) => (
                  <div key={movie.id} className="animate-fade-in">
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
