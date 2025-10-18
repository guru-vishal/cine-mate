import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Heart, Star, Film, Image, Clock, PieChart } from 'lucide-react';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, Tooltip, Legend, Pie } from 'recharts';
import { useMovie } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';

// Function to format relative time
const formatRelativeTime = (date) => {
  const now = new Date();
  const watchedDate = new Date(date);
  const diffInMs = now - watchedDate;
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) {
    return 'viewed just now';
  } else if (diffInMinutes < 60) {
    return `viewed ${diffInMinutes} min${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInHours < 24) {
    return `viewed ${diffInHours} hr${diffInHours === 1 ? '' : 's'} ago`;
  } else if (diffInDays < 30) {
    return `viewed ${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  } else {
    // For older dates, fall back to the formatted date
    return `viewed ${watchedDate.toLocaleDateString()}`;
  }
};

const UserStats = () => {
  const { favorites, getFavoriteGenres, getFavoriteGenreStats, watchHistory } = useMovie();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [showChart, setShowChart] = useState(false);

  // Delay chart rendering to avoid dimension issues
  React.useEffect(() => {
    const timer = setTimeout(() => setShowChart(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!user) return null;

  const handleMovieClick = (movieId) => {
    if (movieId) {
      navigate(`/movie/${movieId}`);
    }
  };

  const favoriteGenres = getFavoriteGenres();
  const genreStats = getFavoriteGenreStats();

  // Deduplicate watch history - keep only the most recent watch of each movie
  const uniqueWatchHistory = watchHistory.reduce((acc, movie) => {
    const movieId = movie.id || movie.movieId;
    const movieTitle = movie.title;
    
    const existingIndex = acc.findIndex(item => {
      const itemId = item.id || item.movieId;
      const itemTitle = item.title;
      // Match by both ID and title for more precise deduplication
      return itemId === movieId && itemTitle === movieTitle;
    });
    
    if (existingIndex !== -1) {
      // Keep the one with more recent watchedAt time
      const existingWatchTime = new Date(acc[existingIndex].watchedAt || 0);
      const currentWatchTime = new Date(movie.watchedAt || 0);
      
      if (currentWatchTime > existingWatchTime) {
        acc[existingIndex] = movie;
      }
    } else {
      acc.push(movie);
    }
    
    return acc;
  }, []).sort((a, b) => new Date(b.watchedAt || 0) - new Date(a.watchedAt || 0)); // Sort by most recent first

  const averageRating = favorites.length > 0 
    ? (() => {
        const validRatings = favorites.filter(movie => (movie.rating || movie.vote_average) > 0);
        return validRatings.length > 0 
          ? (validRatings.reduce((sum, movie) => sum + (movie.rating || movie.vote_average), 0) / validRatings.length).toFixed(1)
          : 'N/A';
      })()
    : 'N/A';

  // Updated genre statistics calculation using the improved genre detection
  const barChartGenreStats = genreStats.slice(0, 5).map(stat => ({
    genre: stat.name,
    count: stat.value,
    percentage: parseFloat(stat.percentage)
  }));

  // Pie chart data with colors
  const COLORS = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#F97316', // Orange
    '#6366F1'  // Indigo
  ];

  const pieChartData = genreStats.slice(0, 6).map((stat, index) => ({
    ...stat,
    fill: COLORS[index % COLORS.length]
  }));

  const stats = [
    {
      label: 'Favorites',
      value: favorites.length,
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      label: 'Top Genre',
      value: favoriteGenres.length > 0 ? favoriteGenres[0] : 'None',
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Avg Rating',
      value: averageRating,
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      label: 'Viewed',
      value: uniqueWatchHistory.length,
      icon: Film,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
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
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
      {barChartGenreStats.length > 0 && (
        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="h-6 w-6 text-primary-500" />
            <h3 className="text-xl font-semibold text-white">Favorite Genres</h3>
          </div>
          
          <div className="space-y-4">
            {barChartGenreStats.map((stat) => (
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

      {/* Genre Distribution Pie Chart */}
      {pieChartData.length > 0 && showChart && (
        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <PieChart className="h-6 w-6 text-primary-500" />
            <h3 className="text-xl font-semibold text-white">Genre Distribution</h3>
          </div>
          
          <div className="flex justify-center overflow-visible px-8 py-6">
            <RechartsPieChart width={700} height={600}>
              <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.3)"/>
                </filter>
              </defs>
              <Pie
                data={pieChartData}
                cx={350}
                cy={250}
                outerRadius={140}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                labelLine={false}
                stroke="#1F2937"
                strokeWidth={2}
                style={{ filter: 'url(#shadow)' }}
              >
                {pieChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    style={{ 
                      filter: 'brightness(1.1) saturate(1.2)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} movies`, 'Count']}
                labelFormatter={(label) => `Genre: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: '2px solid #374151',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                  backdropFilter: 'blur(10px)'
                }}
                labelStyle={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '14px' }}
                itemStyle={{ color: '#E5E7EB', fontSize: '13px' }}
              />
              <Legend 
                wrapperStyle={{ 
                  color: '#F9FAFB',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                formatter={(value) => <span style={{ color: '#F9FAFB' }}>{value}</span>}
                verticalAlign="bottom"
                height={50}
                iconType="circle"
              />
            </RechartsPieChart>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {uniqueWatchHistory.length > 0 && (
        <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Clock className="h-6 w-6 text-primary-500" />
            <h3 className="text-xl font-semibold text-white">Recent Activity</h3>
          </div>
          
          <div className="space-y-4">
            {(showAllActivity ? uniqueWatchHistory : uniqueWatchHistory.slice(0, 5)).map((movie) => (
              <div 
                key={`${movie.id}-${movie.watchedAt}`} 
                className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer"
                onClick={() => handleMovieClick(movie.id || movie.movieId)}
                title={`View details for ${movie.title}`}
              >
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
                  <div className={`${movie.poster_url ? 'hidden' : 'flex'} flex-col items-center justify-center text-gray-400 text-xs p-2 text-center`}>
                    <Image className="h-5 w-5 mb-1" />
                    <span className="leading-tight font-medium">No Image Available</span>
                  </div>
                </div>
                
                {/* Movie Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-base leading-tight truncate mb-1">
                    {movie.title}
                  </h4>
                  <p className="text-sm text-gray-400 leading-tight">
                    {movie.watchedAt ? formatRelativeTime(movie.watchedAt) : 'viewed recently'}
                  </p>
                </div>
                
                {/* Rating */}
                <div className="flex items-center gap-1 flex-shrink-0 bg-gray-700/50 rounded-lg px-2 py-1">
                  <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-white">
                    {(movie.rating || movie.vote_average) && (movie.rating || movie.vote_average) > 0 ? 
                      parseFloat(movie.rating || movie.vote_average).toFixed(1) : 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {uniqueWatchHistory.length > 5 && (
            <div className="mt-4 text-center">
              <button 
                onClick={() => setShowAllActivity(!showAllActivity)}
                className="text-primary-400 hover:text-primary-300 transition-colors duration-300 font-medium"
              >
                {showAllActivity ? 'Show Less' : 'View All Activity'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Export default component
export default UserStats;