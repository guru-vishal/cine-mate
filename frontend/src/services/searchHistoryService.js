import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Search History Service
export const searchHistoryService = {
  // Add search query to user's history
  async addSearchHistory(userId, query, resultCount = 0) {
    try {
      const response = await api.post(`/user/${userId}/search-history`, {
        query,
        resultCount
      });
      return response.data;
    } catch (error) {
      console.error('Error adding search history:', error);
      throw new Error(error.response?.data?.message || 'Failed to save search history');
    }
  },

  // Get user's search history
  async getSearchHistory(userId, limit = 10) {
    try {
      const response = await api.get(`/user/${userId}/search-history`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching search history:', error);
      // Return empty history if there's an error (user might not be logged in)
      return { success: true, data: [] };
    }
  },

  // Clear all search history
  async clearSearchHistory(userId) {
    try {
      const response = await api.delete(`/user/${userId}/search-history`);
      return response.data;
    } catch (error) {
      console.error('Error clearing search history:', error);
      throw new Error(error.response?.data?.message || 'Failed to clear search history');
    }
  },

  // Delete specific search entry
  async deleteSearchEntry(userId, searchId) {
    try {
      const response = await api.delete(`/user/${userId}/search-history/${searchId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting search entry:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete search entry');
    }
  },

  // Get search suggestions based on history (frontend utility)
  getSearchSuggestions(searchHistory, currentQuery) {
    if (!currentQuery || currentQuery.length < 2) return [];
    
    const query = currentQuery.toLowerCase();
    return searchHistory
      .filter(search => 
        search.query.toLowerCase().includes(query) && 
        search.query.toLowerCase() !== query
      )
      .sort((a, b) => new Date(b.searchedAt) - new Date(a.searchedAt))
      .slice(0, 5)
      .map(search => search.query);
  }
};

export default searchHistoryService;