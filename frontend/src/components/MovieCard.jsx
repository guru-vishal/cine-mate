import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Star, Play } from 'lucide-react';
import { useMovie } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';

// Helper function to normalize movie data from different sources
const normalizeMovieData = (movie) => {
  if (!movie) return {};
  
  // Handle different poster URL formats
  let posterUrl = '/placeholder-movie.jpg';
  
  if (movie.poster_url) {
    // Already a full URL (from MongoDB favorites)
    posterUrl = movie.poster_url;
  } else if (movie.poster_path) {
    // TMDB path format (from API results)
    posterUrl = movie.poster_path.startsWith('http') 
      ? movie.poster_path 
      : `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  }
    
  return {
    id: movie.id,
    title: movie.title || 'Untitled Movie',
    poster_url: posterUrl,
    rating: movie.rating || movie.vote_average || 0,
    year: movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear() : ''),
    description: movie.description || movie.overview || 'No description available.',
    genres: movie.genre || movie.genre_ids || movie.genres || []
  };
};

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { favorites, addToFavorites, removeFromFavorites } = useMovie();
  const { user } = useAuth();
  const normalizedMovie = normalizeMovieData(movie);
  const isFavorite = favorites.some(fav => fav.id === movie.id);

  const handleFavoriteToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if user is authenticated
    if (!user) {
      // Redirect to login page with return URL
      navigate('/login', { 
        state: { 
          from: location.pathname,
          message: 'Please log in to add movies to your favorites'
        }
      });
      return;
    }

    // User is authenticated, proceed with favorite toggle
    if (isFavorite) {
      removeFromFavorites(movie.id);
    } else {
      addToFavorites(movie);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-gray-900 shadow-2xl movie-card-hover">
      <Link to={`/movie/${movie.id}`}>
        {/* Poster Image */}
        <div className="aspect-[2/3] overflow-hidden">
          <img
            src={normalizedMovie.poster_url}
            alt={normalizedMovie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-white text-sm font-medium">{normalizedMovie.rating || 'N/A'}</span>
                </div>
                <button
                  onClick={handleFavoriteToggle}
                  className={`p-2 rounded-full transition-all duration-300 ${
                    isFavorite
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/20 text-white hover:bg-primary-500'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
              
              {/* Play button */}
              <div className="flex justify-center">
                <div className="bg-primary-500 hover:bg-primary-600 rounded-full p-3 transition-all duration-300 transform hover:scale-110">
                  <Play className="h-6 w-6 text-white fill-current" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Movie Info */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary-400 transition-colors duration-300">
            {normalizedMovie.title}
          </h3>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">{normalizedMovie.year || 'N/A'}</span>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-gray-300 text-sm">{normalizedMovie.rating || 'N/A'}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {normalizedMovie.genres.slice(0, 2).map((genre, index) => (
              <span
                key={index}
                className="bg-gray-800 text-gray-300 px-2 py-1 rounded-full text-xs"
              >
                {typeof genre === 'string' ? genre : `Genre ${genre}`}
              </span>
            ))}
          </div>
          
          <p className="text-gray-400 text-sm line-clamp-2">
            {normalizedMovie.description}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default MovieCard;
