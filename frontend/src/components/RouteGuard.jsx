import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield, UserCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RouteGuard = ({ 
  children, 
  type = 'public', // 'public', 'protected', 'guest-only', 'admin'
  fallback = null,
  redirectTo = '/login'
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-900 via-dark-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle different route types
  switch (type) {
    case 'public':
      // Public routes - accessible to everyone
      return children;

    case 'protected':
      // Protected routes - require authentication
      if (!user) {
        if (fallback) {
          return fallback;
        }
        return (
          <Navigate 
            to={redirectTo} 
            state={{ 
              from: location.pathname,
              message: 'Please log in to access this page'
            }} 
            replace 
          />
        );
      }
      return children;

    case 'guest-only':
      // Guest-only routes - redirect if authenticated
      if (user) {
        return <Navigate to="/" replace />;
      }
      return children;

    case 'admin':
      // Admin-only routes - require admin role
      if (!user) {
        return (
          <Navigate 
            to={redirectTo} 
            state={{ 
              from: location.pathname,
              message: 'Please log in to access this page'
            }} 
            replace 
          />
        );
      }
      if (!user.isAdmin) {
        return (
          <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto text-center py-20">
              <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-8">
                <Shield className="h-16 w-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-semibold text-white mb-4">Access Denied</h2>
                <p className="text-red-400 mb-6">You don't have permission to access this page.</p>
                <button
                  onClick={() => window.history.back()}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-300"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        );
      }
      return children;

    default:
      return children;
  }
};

// Higher-order component for easy route protection
export const withRouteGuard = (Component, guardType = 'public', options = {}) => {
  return (props) => (
    <RouteGuard type={guardType} {...options}>
      <Component {...props} />
    </RouteGuard>
  );
};

export default RouteGuard;