import React, { useEffect } from 'react';
import { Sparkles, Heart, TrendingUp, User } from 'lucide-react';
import { useMovie } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';
import MovieCard from './MovieCard';

const PersonalizedRecommendations = () => {
  const { 
    personalizedRecommendations, 
    getPersonalizedRecommendations, 
    getFavoriteGenres,
    favorites
  } = useMovie();
  const { user } = useAuth();

  useEffect(() => {
    if (user && favorites.length > 0) {
      getPersonalizedRecommendations();
    }
  }, [user, favorites.length, getPersonalizedRecommendations]);

  if (!user) {
    return (
      <div className="bg-gray-900/30 backdrop-blur-md border border-gray-700 rounded-xl p-8">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Get Personalized Recommendations</h3>
          <p className="text-gray-400 mb-6">
            Log in and add some favorites to see movies tailored just for you!
          </p>
          <div className="flex justify-center space-x-3">
            <a
              href="/login"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
            >
              Login
            </a>
            <a
              href="/signup"
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="bg-gray-900/30 backdrop-blur-md border border-gray-700 rounded-xl p-8">
        <div className="text-center">
          <Heart className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Build Your Taste Profile</h3>
          <p className="text-gray-400 mb-6">
            Add some movies to your favorites and we'll recommend similar content you'll love!
          </p>
          <a
            href="/"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
          >
            Browse Movies
          </a>
        </div>
      </div>
    );
  }

  const favoriteGenres = getFavoriteGenres();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Sparkles className="h-6 w-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-white">Just For You</h2>
          </div>
          <p className="text-gray-400">
            Based on your favorite genres: {favoriteGenres.slice(0, 3).join(', ')}
          </p>
        </div>
        <button
          onClick={getPersonalizedRecommendations}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
        >
          <TrendingUp className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Recommendations Grid */}
      {personalizedRecommendations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {personalizedRecommendations.map((movie) => (
            <div key={movie.id} className="animate-fade-in">
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900/30 backdrop-blur-md border border-gray-700 rounded-xl p-8">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Loading Recommendations...</h3>
            <p className="text-gray-400">We're finding movies you'll love!</p>
          </div>
        </div>
      )}

      {/* User Stats */}
      <div className="bg-gray-900/30 backdrop-blur-md border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Your Taste Profile</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-500">{favorites.length}</div>
            <div className="text-sm text-gray-400">Favorites</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-500">{favoriteGenres.length}</div>
            <div className="text-sm text-gray-400">Favorite Genres</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-500">
              {personalizedRecommendations.length}
            </div>
            <div className="text-sm text-gray-400">Recommendations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-500">
              {favoriteGenres[0] || 'None'}
            </div>
            <div className="text-sm text-gray-400">Top Genre</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedRecommendations;