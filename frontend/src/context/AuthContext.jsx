import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Axios instance for API calls
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set up axios interceptor for token
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          setToken(storedToken);
          const response = await api.get('/auth/profile');
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            // Token is invalid
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (identifier, password) => {
    try {
      const response = await api.post('/auth/login', {
        identifier,
        password
      });

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        
        // Store token
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);

        return {
          success: true,
          message: response.data.message,
          user: userData
        };
      } else {
        return {
          success: false,
          message: response.data.message
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);

      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data;
        
        // Store token
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);

        return {
          success: true,
          message: response.data.message,
          user: newUser
        };
      } else {
        return {
          success: false,
          message: response.data.message
        };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Signup failed. Please try again.'
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call result
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    }
  };

  // Add movie to favorites
  const addToFavorites = async (movieData) => {
    if (!user) {
      return { success: false, message: 'Please login to add favorites' };
    }

    try {
      const response = await api.post(`/auth/favorites/${movieData.id}`, movieData);
      
      if (response.data.success) {
        // Update user state with new favorites
        setUser(prev => ({
          ...prev,
          favorites: response.data.favorites
        }));

        return {
          success: true,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          message: response.data.message
        };
      }
    } catch (error) {
      console.error('Add favorite error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to add to favorites'
      };
    }
  };

  // Remove movie from favorites
  const removeFromFavorites = async (movieId) => {
    if (!user) {
      return { success: false, message: 'Please login to manage favorites' };
    }

    try {
      const response = await api.delete(`/auth/favorites/${movieId}`);
      
      if (response.data.success) {
        // Update user state with new favorites
        setUser(prev => ({
          ...prev,
          favorites: response.data.favorites
        }));

        return {
          success: true,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          message: response.data.message
        };
      }
    } catch (error) {
      console.error('Remove favorite error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to remove from favorites'
      };
    }
  };

  // Check if movie is in favorites
  const isFavorite = (movieId) => {
    if (!user || !user.favorites) return false;
    return user.favorites.some(fav => fav.movieId === movieId.toString());
  };

  // Get user's favorites
  const getFavorites = () => {
    return user?.favorites || [];
  };

  // Update user's favorites array (for MovieContext integration)
  const updateUserFavorites = async (favoritesList) => {
    if (!user) {
      return { success: false, message: 'Please login to manage favorites' };
    }

    try {
      // Convert movie objects to the format expected by backend
      const favoritesToUpdate = favoritesList.map(movie => ({
        movieId: movie.id.toString(),
        title: movie.title,
        poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : movie.poster_url,
        description: movie.overview,
        rating: movie.vote_average,
        year: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : '',
        genre: movie.genres || []
      }));

      const response = await api.put('/auth/favorites', { favorites: favoritesToUpdate });
      
      if (response.data.success) {
        setUser(prev => ({
          ...prev,
          favorites: response.data.favorites
        }));

        return {
          success: true,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          message: response.data.message
        };
      }
    } catch (error) {
      console.error('Update favorites error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update favorites'
      };
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    if (!user) {
      return { success: false, message: 'Please login to update profile' };
    }

    try {
      const response = await api.put('/auth/profile', profileData);
      
      if (response.data.success) {
        setUser(response.data.user);
        return {
          success: true,
          message: response.data.message,
          user: response.data.user
        };
      } else {
        return {
          success: false,
          message: response.data.message
        };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  };

  // Get personalized recommendations
  const getRecommendations = async () => {
    if (!user) {
      return { success: false, message: 'Please login to get recommendations' };
    }

    try {
      const response = await api.get('/auth/recommendations');
      
      if (response.data.success) {
        return {
          success: true,
          recommendations: response.data.recommendations,
          favoriteGenres: response.data.favoriteGenres
        };
      } else {
        return {
          success: false,
          message: response.data.message
        };
      }
    } catch (error) {
      console.error('Recommendations error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get recommendations'
      };
    }
  };

  const value = {
    // State
    user,
    loading,
    isAuthenticated: !!user,
    
    // Auth functions
    login,
    signup,
    logout,
    
    // Favorites functions
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getFavorites,
    updateUserFavorites,
    
    // Profile functions
    updateProfile,
    
    // Recommendations
    getRecommendations,
    
    // API instance for other components
    api
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;