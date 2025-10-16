import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Shield, UserX } from 'lucide-react';
import useRoutePermissions from '../hooks/useRoutePermissions';

// Component to conditionally render content based on permissions
const PermissionGate = ({ 
  children, 
  permission = null,
  requireAuth = false,
  requireGuest = false, 
  requireAdmin = false,
  fallback = null,
  showFallback = false,
  fallbackMessage = 'Access denied'
}) => {
  const permissions = useRoutePermissions();

  // Check specific permission
  if (permission && !permissions.checkPermission(permission)) {
    return showFallback ? (fallback || <DefaultFallback message={fallbackMessage} />) : null;
  }

  // Check authentication requirements
  if (requireAuth && !permissions.isAuthenticated) {
    return showFallback ? (fallback || <AuthRequiredFallback />) : null;
  }

  if (requireGuest && !permissions.isGuest) {
    return showFallback ? (fallback || <GuestOnlyFallback />) : null;
  }

  if (requireAdmin && !permissions.isAdmin) {
    return showFallback ? (fallback || <AdminRequiredFallback />) : null;
  }

  return children;
};

// Default fallback components
const DefaultFallback = ({ message }) => (
  <div className="text-center py-4">
    <UserX className="h-12 w-12 text-gray-500 mx-auto mb-2" />
    <p className="text-gray-500">{message}</p>
  </div>
);

const AuthRequiredFallback = () => (
  <div className="text-center py-6">
    <Lock className="h-12 w-12 text-primary-500 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-white mb-2">Login Required</h3>
    <p className="text-gray-400 mb-4">Please log in to access this feature</p>
    <div className="flex justify-center space-x-3">
      <Link
        to="/login"
        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
      >
        Login
      </Link>
      <Link
        to="/signup"
        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
      >
        Sign Up
      </Link>
    </div>
  </div>
);

const GuestOnlyFallback = () => (
  <div className="text-center py-4">
    <Shield className="h-12 w-12 text-blue-500 mx-auto mb-2" />
    <p className="text-gray-400">You're already logged in</p>
  </div>
);

const AdminRequiredFallback = () => (
  <div className="text-center py-6">
    <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-white mb-2">Admin Access Required</h3>
    <p className="text-red-400">You don't have permission to access this feature</p>
  </div>
);

// Higher-order component for permission-based rendering
export const withPermission = (Component, permissionConfig = {}) => {
  return (props) => (
    <PermissionGate {...permissionConfig}>
      <Component {...props} />
    </PermissionGate>
  );
};

// Hook for conditional rendering in components
export const usePermissionGate = () => {
  const permissions = useRoutePermissions();
  
  const renderWithPermission = (content, permissionCheck) => {
    if (typeof permissionCheck === 'function') {
      return permissionCheck(permissions) ? content : null;
    }
    if (typeof permissionCheck === 'string') {
      return permissions.checkPermission(permissionCheck) ? content : null;
    }
    return content;
  };

  return { renderWithPermission, permissions };
};

export default PermissionGate;