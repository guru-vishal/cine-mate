import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import MovieCard from '../components/MovieCard';
import MovieFilters from '../components/MovieFilters';
import SearchHistory from '../components/SearchHistory';
import { useMovie } from '../context/MovieContext';
import { applyMovieFilters, getDefaultFilters } from '../utils/movieFilters';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchResults, loading, searchMovies, progressiveSearch } = useMovie();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState(getDefaultFilters());
  const [showFilters, setShowFilters] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const searchQuery = searchParams.get('q');
    if (searchQuery) {
      console.log('🔍 Search page - URL query:', searchQuery);
      setQuery(searchQuery);
      searchMovies(searchQuery);
    }
  }, [searchParams, searchMovies]); // Now safe to include searchMovies since it's memoized

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      console.log('🔍 Search page - Manual search:', query.trim());
      setSearchParams({ q: query.trim() });
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setSearchParams({});
    setShowSearchHistory(false);
  };

  const handleInputFocus = () => {
    setShowSearchHistory(true);
  };

  const handleInputBlur = () => {
    // Delay hiding to allow clicking on history items
    setTimeout(() => setShowSearchHistory(false), 200);
  };

  const handleSearchHistorySelect = (historyQuery) => {
    setQuery(historyQuery);
    setSearchParams({ q: historyQuery });
    setShowSearchHistory(false);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters(getDefaultFilters());
  };

  // Apply filters to search results
  const filteredResults = applyMovieFilters(searchResults, filters);

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Search Movies</h1>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Search for movies..."
                className={`w-full bg-gray-900 text-white placeholder-gray-400 border border-gray-700 rounded-lg py-4 pl-6 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg ${
                  query ? 'pr-20' : 'pr-12'
                }`}
              />
              
              {/* Search History Dropdown */}
              <SearchHistory
                isVisible={showSearchHistory && !query}
                currentQuery={query}
                onSearchSelect={handleSearchHistorySelect}
                onClose={() => setShowSearchHistory(false)}
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-300 p-1"
                  title="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-500 transition-colors duration-300"
                title="Search"
              >
                <SearchIcon className="h-6 w-6" />
              </button>
            </div>
            
            <MovieFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              searchResults={searchResults}
              showLanguageFilter={true}
              showYearFilter={true}
              ratingType="slider"
              yearType="slider"
            />
          </form>

          {/* Results Header */}
          {query && (
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Search Results for "{query}"
                </h1>
                <p className="text-gray-400">
                  Showing all {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} found
                  {progressiveSearch.isActive && (
                    <span className="ml-2 text-blue-400">
                      (Loading more... {progressiveSearch.totalSoFar}/{progressiveSearch.totalAvailable})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-800 rounded-xl aspect-[2/3] mb-4"></div>
                <div className="bg-gray-800 h-4 rounded mb-2"></div>
                <div className="bg-gray-800 h-3 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : filteredResults.length === 0 && query ? (
          <div className="text-center py-20">
            <SearchIcon className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-400 mb-4">No movies found</h2>
            <p className="text-gray-500 mb-8">
              Try adjusting your search query or filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResults.map((movie) => (
              <div key={movie.id} className="animate-fade-in">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
