import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Play } from 'lucide-react';
import { useMovie } from '../context/MovieContext';

const MovieCard = ({ movie }) => {
  const { favorites, addToFavorites, removeFromFavorites } = useMovie();
  const isFavorite = favorites.some(fav => fav.id === movie.id);

  const handleFavoriteToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
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
            src={movie.poster_url}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-white text-sm font-medium">{movie.rating}</span>
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
            {movie.title}
          </h3>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">{movie.year}</span>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-gray-300 text-sm">{movie.rating}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {movie.genre.slice(0, 2).map((genre, index) => (
              <span
                key={index}
                className="bg-gray-800 text-gray-300 px-2 py-1 rounded-full text-xs"
              >
                {genre}
              </span>
            ))}
          </div>
          
          <p className="text-gray-400 text-sm line-clamp-2">
            {movie.description}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default MovieCard;
