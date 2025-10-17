import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Watch History Service
export const watchHistoryService = {
  // Add movie to user's watch history
  async addToWatchHistory(userId, movieData) {
    try {
      const response = await api.post(`/user/${userId}/watch-history`, {
        movieData
      });
      return response.data;
    } catch (error) {
      console.error('Error adding to watch history:', error);
      throw new Error(error.response?.data?.message || 'Failed to add to watch history');
    }
  },

  // Get user's watch history
  async getWatchHistory(userId, limit = 20) {
    try {
      const response = await api.get(`/user/${userId}/watch-history`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching watch history:', error);
      // Return empty history if there's an error (user might not be logged in)
      return { success: true, data: [] };
    }
  },

  // Clear all watch history
  async clearWatchHistory(userId) {
    try {
      const response = await api.delete(`/user/${userId}/watch-history`);
      return response.data;
    } catch (error) {
      console.error('Error clearing watch history:', error);
      throw new Error(error.response?.data?.message || 'Failed to clear watch history');
    }
  }
};

export default watchHistoryService;