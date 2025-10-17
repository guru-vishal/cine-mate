import React from 'react';
import { BarChart3, TrendingUp, Heart, Clock, Star, Film, Image } from 'lucide-react';
import { useMovie } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';

const UserStats = () => {
  const { favorites, getFavoriteGenres, watchHistory } = useMovie();
  const { user } = useAuth();

  if (!user) return null;

  const favoriteGenres = getFavoriteGenres();
  const totalWatchTime = watchHistory.reduce((total, movie) => {
    return total + (movie.duration || 120); // Default 120 minutes if no duration
  }, 0);

  const averageRating = favorites.length > 0 
    ? (favorites.reduce((sum, movie) => sum + (movie.rating || movie.vote_average || 0), 0) / favorites.length).toFixed(1)
    : 0;

  const genreStats = favoriteGenres.slice(0, 5).map(genre => {
    const count = favorites.filter(movie => 
      (movie.genre && movie.genre.includes(genre)) ||
      (movie.genre_ids && movie.genre_ids.includes(genre)) ||
      (movie.genres && movie.genres.includes(genre))
    ).length;
    const percentage = favorites.length > 0 ? (count / favorites.length) * 100 : 0;
    
    return { genre, count, percentage };
  });

  const stats = [
    {
      label: 'Movies Favorited',
      value: favorites.length,
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      label: 'Movies Watched',
      value: watchHistory.length,
      icon: Film,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Hours Watched',
      value: Math.round(totalWatchTime / 60),
      icon: Clock,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Avg Rating',
      value: averageRating,
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3 className="h-6 w-6 text-primary-500" />
          <h3 className="text-xl font-semibold text-white">Your Movie Stats</h3>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 ${stat.bgColor} rounded-lg mb-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Genre Breakdown */}
      {genreStats.length > 0 && (
        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="h-6 w-6 text-primary-500" />
            <h3 className="text-xl font-semibold text-white">Favorite Genres</h3>
          </div>
          
          <div className="space-y-4">
            {genreStats.map((stat) => (
              <div key={stat.genre} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">{stat.genre}</span>
                  <span className="text-sm text-gray-400">
                    {stat.count} movies ({stat.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${stat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {watchHistory.length > 0 && (
        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Clock className="h-6 w-6 text-primary-500" />
            <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
          </div>
          
          <div className="space-y-4">
            {watchHistory.slice(0, 5).map((movie) => (
              <div key={`${movie.id}-${movie.watchedAt}`} className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors duration-200">
                {/* Movie Poster */}
                <div className="w-14 h-20 bg-gray-700 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                  {movie.poster_url ? (
                    <img 
                      src={movie.poster_url} 
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`${movie.poster_url ? 'hidden' : 'flex'} flex-col items-center justify-center text-gray-400 text-xs p-2`}>
                    <Image className="h-4 w-4 mb-1" />
                    <span className="text-center leading-tight">No Image</span>
                  </div>
                </div>
                
                {/* Movie Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-base leading-tight truncate mb-1">
                    {movie.title}
                  </h4>
                  <p className="text-sm text-gray-400 leading-tight">
                    Watched {movie.watchedAt ? new Date(movie.watchedAt).toLocaleDateString() : '10/17/2025'}
                  </p>
                </div>
                
                {/* Rating */}
                <div className="flex items-center gap-1 flex-shrink-0 bg-gray-700/50 rounded-lg px-2 py-1">
                  <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-white">
                    {movie.rating || movie.vote_average ? 
                      parseFloat(movie.rating || movie.vote_average).toFixed(1) : '6.4'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {watchHistory.length > 5 && (
            <div className="mt-4 text-center">
              <button className="text-primary-400 hover:text-primary-300 transition-colors duration-300">
                View All Activity
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserStats;