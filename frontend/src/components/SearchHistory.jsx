import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Search, X } from 'lucide-react';
import { useMovie } from '../context/MovieContext';
import ConfirmationModal from './ConfirmationModal';
import toast from 'react-hot-toast';

// Function to format relative time
const formatRelativeTime = (date) => {
  const now = new Date();
  const searchedDate = new Date(date);
  const diffInMs = now - searchedDate;
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) {
    return 'just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes === 1 ? '' : 's'} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hr${diffInHours === 1 ? '' : 's'} ago`;
  } else if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  } else {
    // For older dates, fall back to the formatted date
    return searchedDate.toLocaleDateString();
  }
};

const SearchHistory = ({ 
  onSearchSelect, 
  onClose, 
  isVisible = false,
  currentQuery = ''
}) => {
  const { searchHistory, deleteSearchEntry, clearSearchHistory } = useMovie();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Prevent closing the search history when modal is open
  const handleClose = () => {
    if (!showConfirmModal && onClose) {
      onClose();
    }
  };

  // Use effect to prevent blur when modal opens
  React.useEffect(() => {
    if (showConfirmModal) {
      // Set a flag on window to prevent blur handling
      window.searchModalOpen = true;
    } else {
      window.searchModalOpen = false;
    }
  }, [showConfirmModal]);

  if (!isVisible || searchHistory.length === 0) {
    return null;
  }

  // Filter out current query and get recent unique searches
  const filteredHistory = searchHistory
    .filter(search => search.query.toLowerCase() !== currentQuery.toLowerCase())
    .slice(0, 8);

  const handleSearchSelect = (query) => {
    if (onSearchSelect) {
      onSearchSelect(query);
    }
    handleClose();
  };

  const handleDeleteSearch = async (e, searchId) => {
    e.stopPropagation();
    await deleteSearchEntry(searchId);
  };

  const handleClearAll = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirmModal(true);
  };

  const confirmClearAll = async () => {
    await clearSearchHistory();
    toast.success('Search history cleared successfully', {
      icon: '🗑️',
    });
    setShowConfirmModal(false);
    handleClose();
  };

  return (
    <>
      <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto" data-search-area>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-white">Recent Searches</span>
          </div>
          <div className="flex items-center space-x-2">
            {filteredHistory.length > 0 && (
              <button
                onClick={handleClearAll}
                onMouseDown={(e) => e.preventDefault()}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors duration-200"
                title="Clear all search history"
              >
                Clear All
              </button>
            )}
            {onClose && (
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors duration-200"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search History Items */}
        <div className="py-2">
          {filteredHistory.length === 0 ? (
            <div className="px-4 py-3 text-center text-gray-500 text-sm">
              No recent searches
            </div>
          ) : (
            filteredHistory.map((search) => (
              <div
                key={search._id || search.query}
                className="flex items-center justify-between px-4 py-2 hover:bg-gray-800 cursor-pointer group transition-colors duration-200"
                onClick={() => handleSearchSelect(search.query)}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{search.query}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>
                        {search.resultCount !== undefined 
                          ? `${search.resultCount} results`
                          : 'Search'
                        }
                      </span>
                      <span>•</span>
                      <span>
                        {search.searchedAt ? formatRelativeTime(search.searchedAt) : 'recently'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteSearch(e, search._id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all duration-200 p-1"
                  title="Remove from history"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {filteredHistory.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-700 text-xs text-gray-500 text-center">
            Click on any search to search again
          </div>
        )}
      </div>

      {/* Confirmation Modal - Rendered using Portal to document.body */}
      {showConfirmModal && createPortal(
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={confirmClearAll}
          title="Clear Search History"
          message="Are you sure you want to clear all search history? This action cannot be undone."
          confirmText="Clear All"
          cancelText="Cancel"
          type="warning"
        />,
        document.body
      )}
    </>
  );
};

export default SearchHistory;