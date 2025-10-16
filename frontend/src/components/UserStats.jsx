import React from 'react';
import { BarChart3, TrendingUp, Heart, Clock, Star, Film } from 'lucide-react';
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
    ? (favorites.reduce((sum, movie) => sum + (movie.rating || 0), 0) / favorites.length).toFixed(1)
    : 0;

  const genreStats = favoriteGenres.slice(0, 5).map(genre => {
    const count = favorites.filter(movie => 
      movie.genre && movie.genre.includes(genre)
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
          
          <div className="space-y-3">
            {watchHistory.slice(0, 5).map((movie) => (
              <div key={`${movie.id}-${movie.watchedAt}`} className="flex items-center space-x-4 p-3 bg-gray-800/30 rounded-lg">
                <img 
                  src={movie.poster_url} 
                  alt={movie.title}
                  className="w-12 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h4 className="text-white font-medium">{movie.title}</h4>
                  <p className="text-sm text-gray-400">
                    Watched {movie.watchedAt ? new Date(movie.watchedAt).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-300">{movie.rating}</span>
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