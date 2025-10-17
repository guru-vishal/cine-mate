import React from 'react';
import { Filter, X } from 'lucide-react';
import { convertGenreIdsToNames } from '../utils/genreMapping';
import { getLanguagesWithNames } from '../utils/languageMapping';

const MovieFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  showFilters, 
  onToggleFilters,
  movies = [], 
  searchResults = [],
  showLanguageFilter = true,
  showYearFilter = true,
  ratingType = 'slider', // 'slider' or 'dropdown'
  yearType = 'dropdown' // 'slider' or 'dropdown' for year range vs single year
}) => {
  // Get data source based on context
  const dataSource = searchResults.length > 0 ? searchResults : movies;
  
  // Get unique languages from movies (only for Home page or when showLanguageFilter is true)
  const getUniqueLanguages = () => {
    if (!showLanguageFilter) return [];
    const moviesArray = Array.isArray(dataSource) ? dataSource : [];
    return getLanguagesWithNames(moviesArray);
  };

  // Get unique genres from movies
  const getUniqueGenres = () => {
    const moviesArray = Array.isArray(dataSource) ? dataSource : [];
    const genres = moviesArray
      .flatMap(movie => {
        if (Array.isArray(movie.genre)) {
          return movie.genre;
        } else if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
          return convertGenreIdsToNames(movie.genre_ids);
        }
        return [];
      })
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    return genres;
  };

  // Get unique years from movies
  const getUniqueYears = () => {
    if (!showYearFilter) return [];
    const moviesArray = Array.isArray(dataSource) ? dataSource : [];
    const years = moviesArray
      .map(movie => {
        if (movie.year) return movie.year;
        if (movie.release_date) return new Date(movie.release_date).getFullYear();
        return null;
      })
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => b - a); // Sort descending
    
    // If no years from data, provide default range
    if (years.length === 0) {
      return Array.from({ length: 30 }, (_, i) => 2024 - i);
    }
    return years;
  };

  // Get year range for slider
  const getYearRange = () => {
    const years = getUniqueYears();
    if (years.length === 0) {
      return { min: 1990, max: 2024 };
    }
    return {
      min: Math.min(...years),
      max: Math.max(...years)
    };
  };

  const languages = getUniqueLanguages();
  const genres = getUniqueGenres();
  const years = getUniqueYears();
  const yearRange = getYearRange();

  const handleFilterChange = (filterType, value) => {
    onFilterChange(filterType, value);
  };

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={onToggleFilters}
        className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-4 rounded-lg transition-colors h-full"
      >
        <Filter className="h-5 w-5" />
        <span>Filters</span>
      </button>

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute right-0 top-full mt-2 w-screen max-w-4xl bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl p-6 z-50 animate-slide-down">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Filter Movies</h3>
            <button
              onClick={onClearFilters}
              className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${
            showLanguageFilter && showYearFilter ? 
              (yearType === 'slider' ? '5' : '4') : 
              (showLanguageFilter || showYearFilter ? '3' : '2')
          } gap-6`}>
            {/* Language Filter */}
            {showLanguageFilter && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                <select
                  value={filters.language || ''}
                  onChange={(e) => handleFilterChange('language', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Languages</option>
                  {languages.map(language => (
                    <option key={language.code} value={language.code}>{language.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Genre Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Genre</label>
              <select
                value={filters.genre || ''}
                onChange={(e) => handleFilterChange('genre', e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Genres</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            {ratingType === 'slider' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min Rating: {filters.minRating || 0}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.minRating || 0}
                    onChange={(e) => handleFilterChange('minRating', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Rating: {filters.maxRating || 10}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={filters.maxRating || 10}
                    onChange={(e) => handleFilterChange('maxRating', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Min Rating</label>
                <select
                  value={filters.minRating || ''}
                  onChange={(e) => handleFilterChange('minRating', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Any Rating</option>
                  <option value="6">6.0+</option>
                  <option value="7">7.0+</option>
                  <option value="8">8.0+</option>
                  <option value="9">9.0+</option>
                </select>
              </div>
            )}

            {/* Year Filter */}
            {showYearFilter && (
              yearType === 'slider' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Min Year: {filters.minYear || yearRange.min}
                    </label>
                    <input
                      type="range"
                      min={yearRange.min}
                      max={yearRange.max}
                      step="1"
                      value={filters.minYear || yearRange.min}
                      onChange={(e) => handleFilterChange('minYear', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Year: {filters.maxYear || yearRange.max}
                    </label>
                    <input
                      type="range"
                      min={yearRange.min}
                      max={yearRange.max}
                      step="1"
                      value={filters.maxYear || yearRange.max}
                      onChange={(e) => handleFilterChange('maxYear', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                  <select
                    value={filters.year || ''}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Any Year</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieFilters;