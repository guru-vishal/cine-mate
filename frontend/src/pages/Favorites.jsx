import React, { useState } from 'react';
import { Heart, Trash2, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import ConfirmationModal from '../components/ConfirmationModal';
import { useMovie } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';

const Favorites = () => {
  const { favorites, removeFromFavorites, clearAllFavorites } = useMovie();
  const { user } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleClearAllClick = () => {
    setShowConfirmModal(true);
  };

  const confirmClearAll = () => {
    clearAllFavorites();
  };

  return (
    <div className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-3">
            <Heart className="h-8 w-8 text-primary-500 fill-current" />
            <h1 className="text-4xl font-bold text-white">My Favorites</h1>
            <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm">
              {favorites.length}
            </span>
          </div>
          
          {favorites.length > 0 && (
            <button
              onClick={handleClearAllClick}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Favorites Grid */}
        {!user ? (
          <div className="text-center py-24">
            <LogIn className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-400 mb-4">Login Required</h2>
            <p className="text-gray-500 mb-8">
              Please log in to view and manage your favorite movies
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
              >
                <span>Sign Up</span>
              </Link>
            </div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-24">
            <Heart className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-400 mb-4">No favorites yet</h2>
            <p className="text-gray-500 mb-8">
              Start adding movies to your favorites to see them here
            </p>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
            >
              <span>Browse Movies</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[...favorites].reverse().map((movie) => (
              <div key={movie.id} className="animate-fade-in">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmClearAll}
        title="Clear All Favorites"
        message={`Are you sure you want to remove all ${favorites.length} favorite movies? This action cannot be undone.`}
        confirmText="Clear All"
        cancelText="Keep Favorites"
        type="danger"
      />
    </div>
  );
};

export default Favorites;
