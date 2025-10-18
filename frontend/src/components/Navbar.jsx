import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, Menu, X, Clapperboard, User, LogOut, UserCog, Bookmark, Home, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useRoutePermissions from '../hooks/useRoutePermissions';
import ConfirmationModal from './ConfirmationModal';
import SearchHistory from './SearchHistory';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { canViewFavorites, canViewWatchlist, canViewProfile } = useRoutePermissions();
  const userMenuRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Hide search bar on search page
  const isSearchPage = location.pathname === '/search';

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearchHistory(false);
    }
  };

  const handleClearNavbarSearch = () => {
    setSearchQuery('');
  };

  const handleSearchInputFocus = () => {
    setShowSearchHistory(true);
  };

  const handleSearchInputBlur = (e) => {
    // Don't close if a search modal is open
    if (window.searchModalOpen) {
      return;
    }
    
    // Check if the blur is caused by clicking on something within the search area
    const isClickingWithinSearch = e.relatedTarget && 
      (e.relatedTarget.closest('[data-search-area]') || 
       e.relatedTarget.closest('[role="dialog"]')); // Don't close if clicking on modal
    
    if (!isClickingWithinSearch) {
      // Delay hiding to allow clicks on search history items
      setTimeout(() => {
        // Double-check the modal flag before closing
        if (!window.searchModalOpen) {
          setShowSearchHistory(false);
        }
      }, 200);
    }
  };

  const handleSearchHistorySelect = (historyQuery) => {
    setSearchQuery(historyQuery);
    navigate(`/search?q=${encodeURIComponent(historyQuery)}`);
    setShowSearchHistory(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <Clapperboard className="h-8 w-8 text-red-500 group-hover:text-red-400 transition-colors duration-300" />
            <span className="text-2xl font-bold text-white group-hover:text-red-400 transition-colors duration-300">
              CineMate
            </span>
          </Link>

          {/* Search Bar - Desktop (hidden on search page) */}
          {!isSearchPage && (
            <div className="hidden md:flex items-center flex-1 max-w-lg mx-8" data-search-area>
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={handleSearchInputFocus}
                  onBlur={handleSearchInputBlur}
                  placeholder="Search movies..."
                  className={`w-full bg-gray-900/50 text-white placeholder-gray-400 border border-gray-700 rounded-full py-2 pl-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 ${
                    searchQuery ? 'pr-20' : 'pr-12'
                  }`}
                />
                
                {/* Search History Dropdown */}
                <SearchHistory
                  isVisible={showSearchHistory && !searchQuery}
                  currentQuery={searchQuery}
                  onSearchSelect={handleSearchHistorySelect}
                  onClose={() => setShowSearchHistory(false)}
                />
                
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearNavbarSearch}
                    className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-300 p-1"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors duration-300"
                  title="Search"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>
            </div>
          )}

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="flex items-center space-x-2 text-white hover:text-primary-400 transition-colors duration-300 font-medium"
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            {canViewFavorites && (
              <Link
                to="/favorites"
                className="flex items-center space-x-2 text-white hover:text-primary-400 transition-colors duration-300 font-medium"
              >
                <Heart className="h-5 w-5" />
                <span>Favorites</span>
              </Link>
            )}
            {canViewWatchlist && (
              <Link
                to="/watchlist"
                className="flex items-center space-x-2 text-white hover:text-primary-400 transition-colors duration-300 font-medium"
              >
                <Bookmark className="h-5 w-5" />
                <span>Watchlist</span>
              </Link>
            )}
            
            {/* Authentication Menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-white hover:text-primary-400 transition-colors duration-300 font-medium"
                >
                  <UserCircle className="h-5 w-5" />
                  <span>{user.username}</span>
                </button>
                
                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-md shadow-lg py-1 z-50 border border-gray-700">
                    {canViewProfile && (
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors duration-300"
                      >
                        <UserCog className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    )}
                    <button
                      onClick={handleLogoutClick}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors duration-300"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-white hover:text-primary-400 transition-colors duration-300 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white hover:text-primary-400 transition-colors duration-300"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden animate-slide-up">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-900/95 rounded-lg mt-2">
              {/* Mobile Search (hidden on search page) */}
              {!isSearchPage && (
                <div data-search-area>
                  <form onSubmit={handleSearch} className="relative mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={handleSearchInputFocus}
                    onBlur={handleSearchInputBlur}
                    placeholder="Search movies..."
                    className={`w-full bg-gray-800 text-white placeholder-gray-400 border border-gray-700 rounded-full py-2 pl-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      searchQuery ? 'pr-20' : 'pr-12'
                    }`}
                  />
                  
                  {/* Search History Dropdown for Mobile */}
                  <SearchHistory
                    isVisible={showSearchHistory && !searchQuery}
                    currentQuery={searchQuery}
                    onSearchSelect={handleSearchHistorySelect}
                    onClose={() => setShowSearchHistory(false)}
                  />
                  
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearNavbarSearch}
                      className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-300 p-1"
                      title="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors duration-300"
                    title="Search"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                  </form>
                </div>
              )}
              
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center space-x-2 px-3 py-2 text-white hover:text-primary-400 hover:bg-gray-800 rounded-md transition-all duration-300"
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
              
              {canViewFavorites && (
                <Link
                  to="/favorites"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 text-white hover:text-primary-400 hover:bg-gray-800 rounded-md transition-all duration-300"
                >
                  <Heart className="h-5 w-5" />
                  <span>Favorites</span>
                </Link>
              )}
              
              {canViewWatchlist && (
                <Link
                  to="/watchlist"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 text-white hover:text-primary-400 hover:bg-gray-800 rounded-md transition-all duration-300"
                >
                  <Bookmark className="h-5 w-5" />
                  <span>Watchlist</span>
                </Link>
              )}
              
              {user ? (
                <>
                  <div className="px-3 py-2 text-gray-400 text-sm border-t border-gray-700 mt-2">
                    Welcome, {user.username}
                  </div>
                  {canViewProfile && (
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 text-white hover:text-primary-400 hover:bg-gray-800 rounded-md transition-all duration-300"
                    >
                      <UserCog className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center space-x-2 w-full text-left px-3 py-2 text-white hover:text-primary-400 hover:bg-gray-800 rounded-md transition-all duration-300"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-white hover:text-primary-400 hover:bg-gray-800 rounded-md transition-all duration-300"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-all duration-300 text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        type="danger"
      />
    </nav>
  );
};

export default Navbar;
