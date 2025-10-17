import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Film, Sparkles, Heart, Popcorn, Star, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import MovieFilters from '../components/MovieFilters';
import PersonalizedRecommendations from '../components/PersonalizedRecommendations';
import { useMovie } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';
import { convertGenreIdsToNames } from '../utils/genreMapping';
import { formatDuration } from '../utils/durationHelper';
import { applyMovieFilters, getDefaultFilters } from '../utils/movieFilters';

// Helper function to shuffle an array using Fisher-Yates algorithm
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Home = () => {
  const navigate = useNavigate();
  const { movies, topRatedMovies, topRatedLoading, popularMovies, popularLoading, recommendations, loading, fetchMovies, fetchTopRatedMovies, fetchPopularMovies, getRecommendations, favorites, addToFavorites, removeFromFavorites, progressiveMovies } = useMovie();
  const { user } = useAuth();
  const [heroMovie, setHeroMovie] = useState(null);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [shuffledMovies, setShuffledMovies] = useState([]); // New state for randomized movies
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(getDefaultFilters());
  const [currentPage, setCurrentPage] = useState(1);
  const [topRatedCurrentPage, setTopRatedCurrentPage] = useState(1);
  const [popularCurrentPage, setPopularCurrentPage] = useState(1);
  const [moviesPerPage] = useState(20); // Show 20 movies per page for optimal performance
  const [topRatedMoviesPerPage] = useState(4); // Show 4 top-rated movies at a time
  const [popularMoviesPerPage] = useState(4); // Show 4 popular movies at a time
  const [isAnimating, setIsAnimating] = useState(false);
  const [popularIsAnimating, setPopularIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState(''); // 'next' or 'prev'
  const [popularSlideDirection, setPopularSlideDirection] = useState(''); // 'next' or 'prev'

  useEffect(() => {
    fetchMovies();
    fetchTopRatedMovies();
    fetchPopularMovies();
    getRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const moviesArray = Array.isArray(movies) ? movies : [];
    if (moviesArray.length > 0) {
      // Debug: Check runtime data before shuffling
      console.log('🔍 [DEBUG] Movies before shuffle - first 3 movies runtime data:');
      moviesArray.slice(0, 3).forEach((movie, index) => {
        console.log(`${index + 1}. "${movie.title}" - runtime: ${movie.runtime || 'NO RUNTIME'}, duration: ${movie.duration || 'NO DURATION'}`);
      });
      
      // Shuffle movies for random display order every time the page loads
      const randomizedMovies = shuffleArray(moviesArray);
      
      // Debug: Check runtime data after shuffling
      console.log('🔍 [DEBUG] Movies after shuffle - first 3 movies runtime data:');
      randomizedMovies.slice(0, 3).forEach((movie, index) => {
        console.log(`${index + 1}. "${movie.title}" - runtime: ${movie.runtime || 'NO RUNTIME'}, duration: ${movie.duration || 'NO DURATION'}`);
      });
      
      setShuffledMovies(randomizedMovies);
      
      // Set a random movie as hero or the highest rated one
      const hero = moviesArray.find(movie => (movie.rating || movie.vote_average) >= 9.0) || moviesArray[0];
      
      // Normalize hero movie data to handle both TMDB and database formats
      if (hero) {
        const normalizedHero = {
          ...hero,
          // Handle genre (TMDB has genre_ids, database has genre array)
          genre: hero.genre || (hero.genre_ids ? convertGenreIdsToNames(hero.genre_ids) : []),
          // Handle rating
          rating: hero.rating || hero.vote_average || 0,
          // Handle description
          description: hero.description || hero.overview || 'No description available.',
          // Handle year
          year: hero.year || (hero.release_date ? new Date(hero.release_date).getFullYear() : ''),
          // Handle duration (TMDB doesn't provide runtime in basic calls)
          duration: hero.duration || hero.runtime || 120
        };
        setHeroMovie(normalizedHero);
      }
    }
  }, [movies]);

  // Filter movies based on current filters using shuffled movies
  useEffect(() => {
    const moviesArray = Array.isArray(shuffledMovies) ? shuffledMovies : [];
    const filtered = applyMovieFilters(moviesArray, filters);
    setFilteredMovies(filtered);
  }, [shuffledMovies, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters(getDefaultFilters());
    setCurrentPage(1); // Reset to first page when filters are cleared
  };

  // Animated navigation for Top Rated movies with smooth sliding
  const handleTopRatedNavigation = (direction) => {
    if (isAnimating) return; // Prevent multiple clicks during animation
    
    console.log('🎬 Starting animation:', { direction, currentPage: topRatedCurrentPage, isAnimating });
    
    setIsAnimating(true);
    setSlideDirection(direction);
    
    // Start slide out animation first
    setTimeout(() => {
      console.log('🔄 Updating page after slide out');
      // Update page after slide out begins
      if (direction === 'next') {
        setTopRatedCurrentPage(prev => {
          const newPage = Math.min(Math.ceil(topRatedMovies.length / topRatedMoviesPerPage), prev + 1);
          console.log('📄 Next page:', prev, '->', newPage);
          return newPage;
        });
      } else {
        setTopRatedCurrentPage(prev => {
          const newPage = Math.max(1, prev - 1);
          console.log('📄 Previous page:', prev, '->', newPage);
          return newPage;
        });
      }
      
      // Reset animation state after slide in completes
      setTimeout(() => {
        console.log('✅ Animation complete, resetting state');
        setIsAnimating(false);
        setSlideDirection('');
      }, 250); // Half the animation duration for slide in
    }, 250); // Half the animation duration for slide out
  };

  // Animated navigation for Popular movies with smooth sliding
  const handlePopularNavigation = (direction) => {
    if (popularIsAnimating) return; // Prevent multiple clicks during animation
    
    console.log('🔥 Starting popular animation:', { direction, currentPage: popularCurrentPage, isAnimating: popularIsAnimating });
    
    setPopularIsAnimating(true);
    setPopularSlideDirection(direction);
    
    // Start slide out animation first
    setTimeout(() => {
      console.log('🔄 Updating popular page after slide out');
      // Update page after slide out begins
      if (direction === 'next') {
        setPopularCurrentPage(prev => {
          const newPage = Math.min(Math.ceil(popularMovies.length / popularMoviesPerPage), prev + 1);
          console.log('📄 Next popular page:', prev, '->', newPage);
          return newPage;
        });
      } else {
        setPopularCurrentPage(prev => {
          const newPage = Math.max(1, prev - 1);
          console.log('📄 Previous popular page:', prev, '->', newPage);
          return newPage;
        });
      }
      
      // Reset animation state after slide in completes
      setTimeout(() => {
        console.log('✅ Popular animation complete, resetting state');
        setPopularIsAnimating(false);
        setPopularSlideDirection('');
      }, 250); // Half the animation duration for slide in
    }, 250); // Half the animation duration for slide out
  };

  const handleMoreInfo = () => {
    if (heroMovie && heroMovie.id) {
      navigate(`/movie/${heroMovie.id}`);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!heroMovie || !user) {
      console.log('Cannot toggle favorite: missing heroMovie or user');
      return;
    }
    
    console.log('Toggling favorite for movie:', heroMovie.title);
    const isCurrentlyFavorited = favorites.some(fav => fav.id === heroMovie.id);
    
    try {
      if (isCurrentlyFavorited) {
        console.log('Removing from favorites');
        await removeFromFavorites(heroMovie.id);
      } else {
        console.log('Adding to favorites');
        await addToFavorites(heroMovie);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const isHeroMovieFavorited = heroMovie && favorites.some(fav => fav.id === heroMovie.id);

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
              src={heroMovie.backdrop_url || heroMovie.backdrop_path || heroMovie.poster_url || heroMovie.poster_path || '/placeholder-movie.jpg'}
              alt={heroMovie.title || 'Movie'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/placeholder-movie.jpg';
              }}
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
                    <span className="text-white font-semibold">
                      {heroMovie.rating ? parseFloat(heroMovie.rating).toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <span className="text-gray-300">{formatDuration(heroMovie.duration)}</span>
                </div>

                <div className="flex flex-wrap gap-2 mb-6 animate-slide-up">
                  {(heroMovie.genre && Array.isArray(heroMovie.genre) ? heroMovie.genre : []).map((genre, index) => (
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
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={handleMoreInfo}
                      className="flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 sm:px-8 py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                    >
                      <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />
                      <span>Watch Now</span>
                    </button>
                    
                  <button 
                    onClick={handleMoreInfo}
                    className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-6 sm:px-8 py-4 rounded-full font-semibold border border-white/30 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
                  >
                    <span>More Info</span>
                  </button>
                  </div>                  <button 
                    onClick={user ? handleFavoriteToggle : () => navigate('/login')}
                    className={`flex items-center justify-center space-x-2 px-4 sm:px-6 py-4 rounded-full font-semibold border backdrop-blur-sm transition-all duration-300 transform hover:scale-105 ${
                      user && isHeroMovieFavorited
                        ? 'bg-red-600/80 hover:bg-red-700/80 text-white border-red-500/50'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/30'
                    }`}
                    title={!user ? 'Login to add to favorites' : (isHeroMovieFavorited ? 'Remove from favorites' : 'Add to favorites')}
                  >
                    <Heart className={`h-5 w-5 sm:h-6 sm:w-6 ${user && isHeroMovieFavorited ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">
                      {!user ? 'Login to Add Favorites' : (isHeroMovieFavorited ? 'Remove from Favorites' : 'Add to Favorites')}
                    </span>
                    <span className="sm:hidden">
                      {!user ? 'Login' : (isHeroMovieFavorited ? 'Favorited' : 'Favorite')}
                    </span>
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
          {/* Movies */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <Popcorn className="h-8 w-8 text-primary-500" />
                <h2 className="text-3xl font-bold text-white">Movies</h2>
              </div>
              <MovieFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(!showFilters)}
                movies={shuffledMovies}
                showLanguageFilter={true}
                showYearFilter={true}
                ratingType="slider"
                yearType="slider"
              />
            </div>
            
            {loading ? (
              <LoadingSkeleton />
            ) : (
              <>
                <div className="mb-4 text-gray-300 text-sm flex justify-between items-center">
                  <div>
                    <span>Showing {Math.min((currentPage - 1) * moviesPerPage + 1, filteredMovies.length)} - {Math.min(currentPage * moviesPerPage, filteredMovies.length)} of {filteredMovies.length} movies</span>
                    {progressiveMovies.isActive && (
                      <span className="ml-2 text-blue-400">
                        (Loading more from {progressiveMovies.currentSource}... {progressiveMovies.totalSoFar} loaded)
                      </span>
                    )}
                  </div>
                  <span>Page {currentPage} of {Math.ceil(filteredMovies.length / moviesPerPage)}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-6">
                  {filteredMovies
                    .slice((currentPage - 1) * moviesPerPage, currentPage * moviesPerPage)
                    .map((movie) => (
                    <div key={movie.id} className="animate-fade-in">
                      <MovieCard movie={movie} />
                    </div>
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {filteredMovies.length > moviesPerPage && (
                  <div className="flex justify-center items-center space-x-4 mt-8">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded-lg transition-colors"
                    >
                      Previous
                    </button>
                    
                    <div className="flex space-x-2">
                      {Array.from({ length: Math.min(5, Math.ceil(filteredMovies.length / moviesPerPage)) }, (_, i) => {
                        const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);
                        let pageNum;
                        
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              currentPage === pageNum
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-800 hover:bg-gray-700 text-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(Math.ceil(filteredMovies.length / moviesPerPage), currentPage + 1))}
                      disabled={currentPage === Math.ceil(filteredMovies.length / moviesPerPage)}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded-lg transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
                
                {filteredMovies.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-lg mb-2">No movies found</div>
                    <div className="text-gray-500 text-sm">Try adjusting your filters</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Top Rated Movies Section */}
          {Array.isArray(topRatedMovies) && topRatedMovies.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <Star className="h-8 w-8 text-primary-500" />
                  <h2 className="text-3xl font-bold text-white">Top Rated</h2>
                </div>
                <div className="text-sm text-gray-400">
                  {topRatedMovies.length} movies loaded | Showing {Math.min((topRatedCurrentPage - 1) * topRatedMoviesPerPage + 1, topRatedMovies.length)} - {Math.min(topRatedCurrentPage * topRatedMoviesPerPage, topRatedMovies.length)} of {topRatedMovies.length}
                </div>
              </div>
              
              {topRatedLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="bg-gray-800 aspect-[2/3] rounded-lg mb-3"></div>
                      <div className="bg-gray-800 h-4 rounded mb-2"></div>
                      <div className="bg-gray-800 h-3 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="relative flex items-center">
                    {/* Left Arrow - Always visible, disabled when on first page */}
                    <button
                      onClick={() => handleTopRatedNavigation('prev')}
                      disabled={isAnimating || topRatedCurrentPage === 1}
                      className="hidden sm:flex flex-shrink-0 mr-2 lg:mr-4 bg-black/60 hover:bg-black/80 text-white p-2 lg:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-black/60 z-10 items-center justify-center"
                    >
                      <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
                    </button>
                    
                    {/* Movies Grid Container */}
                    <div className="flex-1 overflow-hidden">
                      {/* Movies Grid with Sliding Animation */}
                      <div 
                        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 slide-transition ${
                          isAnimating 
                            ? slideDirection === 'next' 
                              ? 'slide-left' 
                              : 'slide-right'
                            : 'slide-center'
                        }`}
                        data-animation-state={`${isAnimating ? 'animating' : 'idle'}-${slideDirection || 'none'}`}
                      >
                        {topRatedMovies.slice((topRatedCurrentPage - 1) * topRatedMoviesPerPage, topRatedCurrentPage * topRatedMoviesPerPage).map((movie, index) => {
                          // Normalize movie data
                          const normalizedMovie = {
                            ...movie,
                            genre: movie.genre || (movie.genre_ids ? convertGenreIdsToNames(movie.genre_ids) : []),
                            rating: movie.rating || movie.vote_average || 0,
                            description: movie.description || movie.overview || 'No description available.',
                            year: movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear() : ''),
                            duration: movie.duration || movie.runtime || 120
                          };
                          
                          const isFavorite = favorites.some(fav => fav.id === movie.id);
                          
                          return (
                            <div
                              key={`${movie.id}-${topRatedCurrentPage}`}
                              className={`movie-card-hover ${!isAnimating ? 'movie-card-enter' : ''}`}
                              style={{ 
                                animationDelay: !isAnimating ? `${index * 100}ms` : '0ms',
                                opacity: !isAnimating ? 1 : 0
                              }}
                            >
                              <MovieCard
                                movie={normalizedMovie}
                                onFavorite={isFavorite ? removeFromFavorites : addToFavorites}
                                isFavorite={isFavorite}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Right Arrow - Always visible, disabled when on last page */}
                    <button
                      onClick={() => handleTopRatedNavigation('next')}
                      disabled={isAnimating || topRatedCurrentPage === Math.ceil(topRatedMovies.length / topRatedMoviesPerPage)}
                      className="hidden sm:flex flex-shrink-0 ml-2 lg:ml-4 bg-black/60 hover:bg-black/80 text-white p-2 lg:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-black/60 z-10 items-center justify-center"
                    >
                      <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
                    </button>
                  </div>

                  {/* Top Rated Debug and Page Indicators */}
                  <div className="mt-8 space-y-4">
                    {/* Mobile Navigation (visible only on small screens) */}
                    <div className="flex sm:hidden justify-center items-center space-x-4">
                      <button
                        onClick={() => handleTopRatedNavigation('prev')}
                        disabled={isAnimating || topRatedCurrentPage === 1}
                        className="bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      
                      <span className="text-gray-400 font-medium">
                        {topRatedCurrentPage} / {Math.ceil(topRatedMovies.length / topRatedMoviesPerPage)}
                      </span>
                      
                      <button
                        onClick={() => handleTopRatedNavigation('next')}
                        disabled={isAnimating || topRatedCurrentPage === Math.ceil(topRatedMovies.length / topRatedMoviesPerPage)}
                        className="bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                    </div>
                    
                    {/* Debug Info */}
                    {topRatedMovies.length <= 20 && (
                      <div className="text-center p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                        <div className="text-yellow-400 text-sm mb-2">
                          ⚠️ Only {topRatedMovies.length} movies loaded (expected 100)
                        </div>
                        <button
                          onClick={fetchTopRatedMovies}
                          disabled={topRatedLoading}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-800 text-white rounded-lg transition-colors text-sm"
                        >
                          {topRatedLoading ? 'Retrying...' : 'Retry Loading 100 Movies'}
                        </button>
                      </div>
                    )}
                    
                    {/* Page Indicators */}
                    {Math.ceil(topRatedMovies.length / topRatedMoviesPerPage) > 1 && (
                      <div className="flex justify-center items-center space-x-2">
                        {Array.from({ length: Math.ceil(topRatedMovies.length / topRatedMoviesPerPage) }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => {
                              if (!isAnimating && pageNum !== topRatedCurrentPage) {
                                const direction = pageNum > topRatedCurrentPage ? 'next' : 'prev';
                                setIsAnimating(true);
                                setSlideDirection(direction);
                                setTopRatedCurrentPage(pageNum);
                                setTimeout(() => {
                                  setIsAnimating(false);
                                  setSlideDirection('');
                                }, 500); // Match slide animation duration
                              }
                            }}
                            disabled={isAnimating}
                            className={`w-3 h-3 rounded-full transition-all duration-300 disabled:cursor-not-allowed ${
                              pageNum === topRatedCurrentPage
                                ? 'bg-primary-500 scale-125 shadow-lg'
                                : 'bg-gray-600 hover:bg-gray-500 hover:scale-110'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Popular Movies Section */}
          {Array.isArray(popularMovies) && popularMovies.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-8 w-8 text-primary-500" />
                  <h2 className="text-3xl font-bold text-white">Popular</h2>
                </div>
                <div className="text-sm text-gray-400">
                  {popularMovies.length} movies loaded | Showing {Math.min((popularCurrentPage - 1) * popularMoviesPerPage + 1, popularMovies.length)} - {Math.min(popularCurrentPage * popularMoviesPerPage, popularMovies.length)} of {popularMovies.length}
                </div>
              </div>
              
              {popularLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="bg-gray-800 aspect-[2/3] rounded-lg mb-3"></div>
                      <div className="bg-gray-800 h-4 rounded mb-2"></div>
                      <div className="bg-gray-800 h-3 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="relative flex items-center">
                    {/* Left Arrow - Always visible, disabled when on first page */}
                    <button
                      onClick={() => handlePopularNavigation('prev')}
                      disabled={popularIsAnimating || popularCurrentPage === 1}
                      className="hidden sm:flex flex-shrink-0 mr-2 lg:mr-4 bg-black/60 hover:bg-black/80 text-white p-2 lg:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-black/60 z-10 items-center justify-center"
                    >
                      <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
                    </button>
                    
                    {/* Movies Grid Container */}
                    <div className="flex-1 overflow-hidden">
                      {/* Movies Grid with Sliding Animation */}
                      <div 
                        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 slide-transition ${
                          popularIsAnimating 
                            ? popularSlideDirection === 'next' 
                              ? 'slide-left' 
                              : 'slide-right'
                            : 'slide-center'
                        }`}
                        data-animation-state={`${popularIsAnimating ? 'animating' : 'idle'}-${popularSlideDirection || 'none'}`}
                      >
                        {popularMovies.slice((popularCurrentPage - 1) * popularMoviesPerPage, popularCurrentPage * popularMoviesPerPage).map((movie, index) => {
                          // Normalize movie data
                          const normalizedMovie = {
                            ...movie,
                            genre: movie.genre || (movie.genre_ids ? convertGenreIdsToNames(movie.genre_ids) : []),
                            rating: movie.rating || movie.vote_average || 0,
                            description: movie.description || movie.overview || 'No description available.',
                            year: movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear() : ''),
                            duration: movie.duration || movie.runtime || 120
                          };
                          
                          const isFavorite = favorites.some(fav => fav.id === movie.id);
                          
                          return (
                            <div
                              key={`${movie.id}-${popularCurrentPage}`}
                              className={`movie-card-hover ${!popularIsAnimating ? 'movie-card-enter' : ''}`}
                              style={{ 
                                animationDelay: !popularIsAnimating ? `${index * 100}ms` : '0ms',
                                opacity: !popularIsAnimating ? 1 : 0
                              }}
                            >
                              <MovieCard
                                movie={normalizedMovie}
                                onFavorite={isFavorite ? removeFromFavorites : addToFavorites}
                                isFavorite={isFavorite}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Right Arrow - Always visible, disabled when on last page */}
                    <button
                      onClick={() => handlePopularNavigation('next')}
                      disabled={popularIsAnimating || popularCurrentPage === Math.ceil(popularMovies.length / popularMoviesPerPage)}
                      className="hidden sm:flex flex-shrink-0 ml-2 lg:ml-4 bg-black/60 hover:bg-black/80 text-white p-2 lg:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg backdrop-blur-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-black/60 z-10 items-center justify-center"
                    >
                      <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
                    </button>
                  </div>

                  {/* Popular Debug and Page Indicators */}
                  <div className="mt-8 space-y-4">
                    {/* Mobile Navigation (visible only on small screens) */}
                    <div className="flex sm:hidden justify-center items-center space-x-4">
                      <button
                        onClick={() => handlePopularNavigation('prev')}
                        disabled={popularIsAnimating || popularCurrentPage === 1}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded-lg transition-colors"
                      >
                        Previous
                      </button>
                      <span className="text-gray-400 text-sm">
                        Page {popularCurrentPage} of {Math.ceil(popularMovies.length / popularMoviesPerPage)}
                      </span>
                      <button
                        onClick={() => handlePopularNavigation('next')}
                        disabled={popularIsAnimating || popularCurrentPage === Math.ceil(popularMovies.length / popularMoviesPerPage)}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 text-white rounded-lg transition-colors"
                      >
                        Next
                      </button>
                    </div>

                    {/* Page Indicators (Desktop) */}
                    {Math.ceil(popularMovies.length / popularMoviesPerPage) > 1 && (
                      <div className="hidden sm:flex justify-center items-center space-x-2">
                        {Array.from({ length: Math.ceil(popularMovies.length / popularMoviesPerPage) }, (_, index) => {
                          const pageNum = index + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => {
                                if (!popularIsAnimating && pageNum !== popularCurrentPage) {
                                  const direction = pageNum > popularCurrentPage ? 'next' : 'prev';
                                  setPopularIsAnimating(true);
                                  setPopularSlideDirection(direction);
                                  setPopularCurrentPage(pageNum);
                                  setTimeout(() => {
                                    setPopularIsAnimating(false);
                                    setPopularSlideDirection('');
                                  }, 500); // Match slide animation duration
                                }
                              }}
                              disabled={popularIsAnimating}
                              className={`w-3 h-3 rounded-full transition-all duration-300 disabled:cursor-not-allowed ${
                                pageNum === popularCurrentPage
                                  ? 'bg-primary-500 scale-125 shadow-lg'
                                  : 'bg-gray-600 hover:bg-gray-500 hover:scale-110'
                              }`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Personalized Recommendations */}
          {user && (
            <div className="mb-16">
              <PersonalizedRecommendations />
            </div>
          )}

          {/* General Recommendations */}
          {user && Array.isArray(favorites) && favorites.length > 0 && Array.isArray(recommendations) && recommendations.length > 0 && (
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <Sparkles className="h-8 w-8 text-primary-500" />
                <h2 className="text-3xl font-bold text-white">
                  Recommended for You
                </h2>
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
