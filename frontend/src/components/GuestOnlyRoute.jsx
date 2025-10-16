import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Component for routes that should only be accessible to unauthenticated users
const GuestOnlyRoute = ({ children, redirectTo = '/' }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If user is already authenticated, redirect to home
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render the component for unauthenticated users
  return children;
};

export default GuestOnlyRoute;