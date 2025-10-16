import ErrorPage from '../components/ErrorPage';

// Utility function to get error page component based on error status
export const getErrorPage = (error) => {
  // Handle different error types
  if (!error) return null;
  
  // If it's an HTTP error with status
  if (error.status || error.response?.status) {
    const statusCode = error.status || error.response?.status;
    return <ErrorPage errorCode={statusCode} />;
  }
  
  // If it's a network error
  if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
    return <ErrorPage errorCode="network" />;
  }
  
  // Default to 500 for unknown errors
  return <ErrorPage errorCode={500} />;
};

// Function to create custom error pages with overrides
export const createErrorPage = (errorCode, customOptions = {}) => {
  return <ErrorPage errorCode={errorCode} {...customOptions} />;
};

// Error boundary helper
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // You can add logging service here
  // logErrorToService(error);
  
  return getErrorPage(error);
};

// Common error scenarios for the movie app
export const MovieAppErrors = {
  MovieNotFound: () => createErrorPage(404, {
    title: 'Movie Not Found',
    message: 'The movie you\'re looking for doesn\'t exist in our database.',
    suggestion: 'Try searching for a different movie or browse our collection! 🍿'
  }),
  
  SearchFailed: () => createErrorPage(500, {
    title: 'Search Unavailable',
    message: 'We\'re having trouble searching our movie database right now.',
    suggestion: 'Please try again in a few moments or browse our featured movies.'
  }),
  
  FavoritesFailed: () => createErrorPage(500, {
    title: 'Favorites Unavailable',
    message: 'We can\'t access your favorites list right now.',
    suggestion: 'Your favorites are safe! Please try refreshing the page.'
  }),
  
  DatabaseError: () => createErrorPage(503, {
    title: 'Database Maintenance',
    message: 'Our movie database is currently undergoing maintenance.',
    suggestion: 'We\'ll be back with more movies soon! Please check back later.'
  }),
  
  RateLimited: () => createErrorPage(429, {
    title: 'Too Many Requests',
    message: 'You\'re browsing too fast! Please slow down a bit.',
    suggestion: 'Take a moment to enjoy the movies you\'ve found, then continue browsing.'
  })
};

export default {
  getErrorPage,
  createErrorPage,
  handleApiError,
  MovieAppErrors
};