import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ 
  children, 
  redirectTo = '/login', 
  requireAuth = true,
  fallbackMessage = 'Please log in to access this page',
  showFallback = false 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If route requires authentication and user is not logged in
  if (requireAuth && !user) {
    // Show fallback page instead of redirect (optional)
    if (showFallback) {
      return (
        <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-dark-900 via-dark-800 to-gray-900">
          <div className="max-w-md mx-auto text-center py-20">
            <div className="bg-gray-900/50 backdrop-blur-md border border-gray-700 rounded-xl p-8">
              <Lock className="h-16 w-16 text-primary-500 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-white mb-4">Authentication Required</h2>
              <p className="text-gray-400 mb-6">{fallbackMessage}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/login"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                >
                  Login
                </a>
                <a
                  href="/signup"
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                >
                  Sign Up
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Redirect to login with the current location
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          from: location.pathname,
          message: fallbackMessage
        }} 
        replace 
      />
    );
  }

  // Render the protected component
  return children;
};

export default ProtectedRoute;
