import { useAuth } from '../context/AuthContext';

export const useRoutePermissions = () => {
  const { user, loading } = useAuth();

  const permissions = {
    // Basic authentication checks
    isAuthenticated: !!user,
    isGuest: !user,
    isLoading: loading,
    
    // Route access checks
    canAccessProtectedRoutes: !!user,
    canAccessGuestOnlyRoutes: !user,
    canAccessAdminRoutes: user?.isAdmin || false,
    
    // Feature access checks
    canAddToFavorites: !!user,
    canViewFavorites: !!user,
    canEditProfile: !!user,
    canViewProfile: !!user,
    
    // User information
    user,
    userId: user?.id || user?._id,
    username: user?.username,
    email: user?.email,
    isAdmin: user?.isAdmin || false,
  };

  // Helper methods
  const checkPermission = (permission) => {
    return permissions[permission] || false;
  };

  const requireAuth = (callback, fallback = null) => {
    if (permissions.isAuthenticated) {
      return callback();
    }
    return fallback;
  };

  const requireGuest = (callback, fallback = null) => {
    if (permissions.isGuest) {
      return callback();
    }
    return fallback;
  };

  const requireAdmin = (callback, fallback = null) => {
    if (permissions.canAccessAdminRoutes) {
      return callback();
    }
    return fallback;
  };

  return {
    ...permissions,
    checkPermission,
    requireAuth,
    requireGuest,
    requireAdmin,
  };
};

export default useRoutePermissions;