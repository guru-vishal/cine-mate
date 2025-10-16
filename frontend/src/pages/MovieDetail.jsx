import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Star, Play, Clock, Calendar, User, Film } from 'lucide-react';
import { movieService } from '../services/movieService';
import { useMovie } from '../context/MovieContext';
import MovieCard from '../components/MovieCard';

const MovieDetail = () => {
  const { id } = useParams();
  const { favorites, addToFavorites, removeFromFavorites, movies } = useMovie();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [showProviderModal, setShowProviderModal] = useState(false);

  const isFavorite = movie && favorites.some(fav => fav.id === movie.id);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        const movieData = await movieService.getMovieById(id);
        setMovie(movieData);
        
        // Get similar movies (same genre)
        if (movieData && movies.length > 0) {
          const similar = movies
            .filter(m => 
              m.id !== movieData.id && 
              Array.isArray(m.genre) && 
              Array.isArray(movieData.genre) &&
              m.genre.some(g => movieData.genre.includes(g))
            )
            .slice(0, 4);
          setSimilarMovies(similar);
        }
      } catch (error) {
        console.error('Error fetching movie:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id, movies]);

  const handleFavoriteToggle = () => {
    if (isFavorite) {
      removeFromFavorites(movie.id);
    } else {
      addToFavorites(movie);
    }
  };

    const handleWatchNow = () => {
    // Always redirect to JustWatch for movie search
    const justWatchUrl = `https://www.justwatch.com/us/search?q=${encodeURIComponent(movie.title || '')}`;
    window.open(justWatchUrl, '_blank');
  };

    const openSearchFallback = () => {
    const searchUrl = `https://www.justwatch.com/us/search?q=${encodeURIComponent(movie.title || '')}`;
    window.open(searchUrl, '_blank');
  };

  const handleProviderSelect = (provider) => {
    setShowProviderModal(false);
    if (provider.url && provider.url !== '#') {
      window.open(provider.url, '_blank');
    } else {
      openSearchFallback();
    }
  };

  const getProviderFallbackLogo = (providerName) => {
    const logoMap = {
      'Netflix': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/netflix.svg',
      'Prime Video': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/amazonprime.svg',
      'Amazon Prime Video': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/amazonprime.svg',
      'Disney Plus': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/disney.svg',
      'Disney+': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/disney.svg',
      'Hulu': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/hulu.svg',
      'HBO Max': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/hbo.svg',
      'Apple TV Plus': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/appletv.svg',
      'Apple TV+': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/appletv.svg',
      'Paramount Plus': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/paramount.svg',
      'Paramount+': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/paramount.svg',
      'Peacock': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/peacock.svg',
      'YouTube': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/youtube.svg',
      'Crunchyroll': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/crunchyroll.svg',
      'Funimation': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/funimation.svg',
      'Tubi': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/tubi.svg',
      'Pluto TV': 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/pluto.svg',
      'JioHotstar': 'https://logoeps.com/wp-content/uploads/2022/12/disney-hotstar-vector-logo-small.png',
      'Disney+ Hotstar': 'https://logoeps.com/wp-content/uploads/2022/12/disney-hotstar-vector-logo-small.png'
    };
    
    return logoMap[providerName] || `https://ui-avatars.com/api/?name=${encodeURIComponent(providerName)}&background=ef4444&color=fff&size=64&format=svg`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Movie not found</h1>
          <Link to="/" className="text-primary-400 hover:text-primary-300">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={movie.backdrop_url || movie.poster_url || 'https://via.placeholder.com/1920x1080/374151/ffffff?text=No+Image'}
            alt={movie.title || 'Movie'}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/30"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        </div>

        {/* Back Button */}
        <Link
          to="/"
          className="absolute top-24 left-4 z-20 flex items-center space-x-2 bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-sm hover:bg-black/70 transition-all duration-300"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </Link>

        {/* Content */}
        <div className="relative z-10 flex items-center h-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            {/* Poster */}
            <div className="lg:col-span-1">
              <div className="relative group">
                <img
                  src={movie.poster_url || 'https://via.placeholder.com/500x750/374151/ffffff?text=No+Image'}
                  alt={movie.title || 'Movie'}
                  className="w-full max-w-md mx-auto rounded-2xl shadow-2xl transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                    <button className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full transition-all duration-300 transform hover:scale-110">
                      <Play className="h-8 w-8 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Movie Info */}
            <div className="lg:col-span-2">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
                {movie.title || 'Untitled Movie'}
              </h1>

              <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-300 animate-slide-up">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>{movie.year || 'Unknown'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>{movie.duration || 'N/A'} min</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-white font-semibold">{movie.rating || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>{movie.director || 'Unknown'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6 animate-slide-up">
                {Array.isArray(movie.genre) && movie.genre.length > 0 ? (
                  movie.genre.map((genre, index) => (
                    <span
                      key={index}
                      className="bg-primary-600/20 text-primary-300 px-4 py-2 rounded-full border border-primary-500/30"
                    >
                      {genre}
                    </span>
                  ))
                ) : (
                  <span className="bg-gray-600/20 text-gray-400 px-4 py-2 rounded-full border border-gray-500/30">
                    Genre not specified
                  </span>
                )}
              </div>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed animate-slide-up">
                {movie.description || 'No description available.'}
              </p>

              <div className="flex flex-wrap gap-4 mb-8 animate-scale-in">
                <button 
                  onClick={handleWatchNow}
                  className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105"
                  title={movie.watch_providers && movie.watch_providers.length > 0 
                    ? movie.watch_providers.length === 1
                      ? `Watch on ${movie.watch_providers[0]?.name || 'Available Platform'}`
                      : `Choose from ${movie.watch_providers.length} available platforms`
                    : 'Search for this movie online'
                  }
                >
                  <Play className="h-6 w-6 fill-current" />
                  <span>
                    {movie.watch_providers && movie.watch_providers.length > 0 
                      ? movie.watch_providers.length === 1
                        ? (() => {
                            const providerName = movie.watch_providers[0]?.name || '';
                            return providerName.length > 12 ? 'Watch Now' : `Watch on ${providerName}`;
                          })()
                        : `Watch Now (${movie.watch_providers.length} options)`
                      : 'Watch Now'
                    }
                  </span>
                </button>
                
                <button
                  onClick={handleFavoriteToggle}
                  className={`flex items-center space-x-2 px-8 py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${
                    isFavorite
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-white border border-white/30 hover:bg-white/20'
                  }`}
                >
                  <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
                  <span>{isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
                </button>
              </div>

              {/* Watch Providers */}
              {movie.watch_providers && movie.watch_providers.length > 0 ? (
                <div className="mb-8 animate-fade-in">
                  <h3 className="text-xl font-semibold text-white mb-4">Available On</h3>
                  <div className="flex flex-wrap gap-4">
                    {movie.watch_providers.slice(0, 8).map((provider, index) => (
                      <button
                        key={index}
                        onClick={() => handleProviderSelect(provider)}
                        className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 border border-white/20"
                        title={`Watch on ${provider.name} (${provider.type})`}
                      >
                        <img
                          src={provider.logo || getProviderFallbackLogo(provider.name)}
                          alt={provider.name}
                          className="w-6 h-6 rounded"
                          onError={(e) => {
                            const fallbackLogo = getProviderFallbackLogo(provider.name);
                            if (fallbackLogo && e.target.src !== fallbackLogo) {
                              e.target.src = fallbackLogo;
                            } else {
                              e.target.style.display = 'none';
                            }
                          }}
                        />
                        <span className="text-sm font-medium">{provider.name}</span>
                        <span className="text-xs text-gray-400 capitalize">({provider.type})</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-8 animate-fade-in">
                  <h3 className="text-xl font-semibold text-white mb-4">Where to Watch</h3>
                  <p className="text-gray-400 mb-4 text-sm">
                    Provider information is currently unavailable. Try searching on these platforms:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { 
                        name: 'JioHotstar', 
                        url: `https://www.hotstar.com/in/search?q=${encodeURIComponent(movie.title || '')}`, 
                        color: 'bg-blue-700',
                        logo: 'https://logoeps.com/wp-content/uploads/2022/12/disney-hotstar-vector-logo-small.png'
                      },
                      { 
                        name: 'Netflix', 
                        url: `https://www.netflix.com/search?q=${encodeURIComponent(movie.title || '')}`, 
                        color: 'bg-red-600',
                        logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/netflix.svg'
                      },
                      { 
                        name: 'Prime Video', 
                        url: `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(movie.title || '')}`, 
                        color: 'bg-blue-600',
                        logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/amazonprime.svg'
                      },
                      { 
                        name: 'Apple TV+', 
                        url: `https://tv.apple.com/search?term=${encodeURIComponent(movie.title || '')}`, 
                        color: 'bg-gray-600',
                        logo: 'https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@v9/icons/appletv.svg'
                      }
                    ].map((platform, index) => (
                      <button
                        key={index}
                        onClick={() => window.open(platform.url, '_blank')}
                        className={`flex items-center space-x-2 ${platform.color} hover:opacity-80 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 text-sm`}
                      >
                        {platform.logo && (
                          <img
                            src={platform.logo}
                            alt={platform.name}
                            className="w-4 h-4 filter invert"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <span>Search on {platform.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cast */}
              <div className="animate-fade-in">
                <h3 className="text-xl font-semibold text-white mb-4">Cast</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(movie.cast) && movie.cast.length > 0 ? (
                    movie.cast.map((actor, index) => (
                      <span
                        key={index}
                        className="bg-gray-800/50 text-gray-300 px-3 py-1 rounded-full text-sm"
                      >
                        {actor}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">Cast information not available</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Similar Movies */}
      {similarMovies.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-3 mb-8">
              <Film className="h-8 w-8 text-primary-500" />
              <h2 className="text-3xl font-bold text-white">Similar Movies</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {similarMovies.map((similarMovie) => (
                <div key={similarMovie.id} className="animate-fade-in">
                  <MovieCard movie={similarMovie} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Provider Selection Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 animate-scale-in">
            <h3 className="text-xl font-semibold text-white mb-4">Choose a Platform</h3>
            <p className="text-gray-400 mb-6 text-sm">Select where you'd like to watch this movie:</p>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {movie.watch_providers?.map((provider, index) => (
                <button
                  key={index}
                  onClick={() => handleProviderSelect(provider)}
                  className="w-full flex items-center space-x-3 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <img
                    src={provider.logo}
                    alt={provider.name}
                    className="w-8 h-8 rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">{provider.name}</div>
                    <div className="text-gray-400 text-xs capitalize">{provider.type}</div>
                  </div>
                </button>
              ))}
              

            </div>
            
            <button
              onClick={() => setShowProviderModal(false)}
              className="w-full mt-4 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetail;
