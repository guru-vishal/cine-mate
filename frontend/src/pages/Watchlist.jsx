import React, { useState } from 'react';
import { Bookmark, Trash2, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import ConfirmationModal from '../components/ConfirmationModal';
import { useMovie } from '../context/MovieContext';
import { useAuth } from '../context/AuthContext';

const Watchlist = () => {
  const { watchlist, removeFromWatchlist, clearAllWatchlist } = useMovie();
  const { user } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleClearAllClick = () => {
    setShowConfirmModal(true);
  };

  const confirmClearAll = () => {
    clearAllWatchlist();
  };

  return (
    <div className="min-h-screen pt-32 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-3">
            <Bookmark className="h-8 w-8 text-blue-500 fill-current" />
            <h1 className="text-4xl font-bold text-white">My Watchlist</h1>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
              {watchlist.length}
            </span>
          </div>
          
          {watchlist.length > 0 && (
            <button
              onClick={handleClearAllClick}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Watchlist Grid */}
        {!user ? (
          <div className="text-center py-24">
            <LogIn className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-400 mb-4">Login Required</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Please log in to view and manage your watchlist. Your watchlist will be saved and synced across all your devices.
            </p>
            <Link 
              to="/login" 
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
            >
              <LogIn className="h-5 w-5" />
              <span>Login</span>
            </Link>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="text-center py-24">
            <Bookmark className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-400 mb-4">No Movies in Watchlist</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Start building your watchlist by adding movies you want to watch later. Browse movies and click the bookmark icon to add them.
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors duration-300"
            >
              <span>Discover Movies</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {watchlist.map((movie) => (
              <div key={movie.id} className="animate-fade-in">
                <MovieCard
                  movie={movie}
                  showRemoveFromWatchlist={true}
                  onRemoveFromWatchlist={removeFromWatchlist}
                />
              </div>
            ))}
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmClearAll}
          title="Clear Watchlist"
          message={`Are you sure you want to remove all ${watchlist.length} movies from your watchlist? This action cannot be undone.`}
          confirmText="Clear All"
          cancelText="Cancel"
          type="danger"
        />
      </div>
    </div>
  );
};

export default Watchlist;