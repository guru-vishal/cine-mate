import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, Film, ArrowLeft, AlertTriangle, Lock, Server, Wifi } from 'lucide-react';

const ErrorPage = ({ 
  errorCode = 404, 
  title, 
  message, 
  suggestion,
  showBackButton = true,
  showSearchButton = true 
}) => {
  // Define error configurations
  const errorConfigs = {
    400: {
      title: 'Bad Request',
      message: 'The request could not be understood by the server. Please check your input and try again.',
      suggestion: 'Check the URL format or form data you submitted.',
      icon: AlertTriangle,
      iconColor: 'text-orange-500',
      gradientColors: 'from-orange-500 via-yellow-500 to-red-500'
    },
    401: {
      title: 'Unauthorized',
      message: 'You need to be logged in to access this content. Please sign in to continue.',
      suggestion: 'Please log in with your credentials to access this page.',
      icon: Lock,
      iconColor: 'text-yellow-500',
      gradientColors: 'from-yellow-500 via-orange-500 to-red-500'
    },
    403: {
      title: 'Access Forbidden',
      message: 'You don\'t have permission to access this resource. Contact an administrator if you believe this is an error.',
      suggestion: 'This content is restricted. Check your permissions or contact support.',
      icon: Lock,
      iconColor: 'text-red-500',
      gradientColors: 'from-red-500 via-pink-500 to-purple-500'
    },
    404: {
      title: 'Page Not Found',
      message: 'The page you\'re looking for seems to have disappeared into the void. It might have been moved, deleted, or you entered the wrong URL.',
      suggestion: 'Don\'t worry, even the best directors have scenes that end up on the cutting room floor! 🎬',
      icon: Film,
      iconColor: 'text-red-500',
      gradientColors: 'from-red-500 via-pink-500 to-purple-500'
    },
    500: {
      title: 'Server Error',
      message: 'Something went wrong on our end. Our team has been notified and is working to fix the issue.',
      suggestion: 'Please try refreshing the page or come back later.',
      icon: Server,
      iconColor: 'text-purple-500',
      gradientColors: 'from-purple-500 via-blue-500 to-indigo-500'
    },
    502: {
      title: 'Bad Gateway',
      message: 'The server received an invalid response. This is usually a temporary issue.',
      suggestion: 'Please try again in a few moments.',
      icon: Server,
      iconColor: 'text-blue-500',
      gradientColors: 'from-blue-500 via-indigo-500 to-purple-500'
    },
    503: {
      title: 'Service Unavailable',
      message: 'The service is temporarily unavailable due to maintenance or high traffic.',
      suggestion: 'We\'ll be back online shortly. Please try again later.',
      icon: Server,
      iconColor: 'text-indigo-500',
      gradientColors: 'from-indigo-500 via-purple-500 to-pink-500'
    },
    'network': {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
      suggestion: 'Make sure you\'re connected to the internet and try again.',
      icon: Wifi,
      iconColor: 'text-gray-500',
      gradientColors: 'from-gray-500 via-slate-500 to-gray-600'
    }
  };

  // Get configuration for the error code
  const config = errorConfigs[errorCode] || errorConfigs[404];
  const IconComponent = config.icon;
  
  // Use props if provided, otherwise use config defaults
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;
  const displaySuggestion = suggestion || config.suggestion;

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 overflow-y-auto">
      <div className="text-center max-w-lg mx-auto flex flex-col justify-center min-h-[calc(100vh-6rem)]">
        {/* Error Code Animation */}
        <div className="mb-8 relative">
          <div className={`text-8xl md:text-9xl font-bold text-transparent bg-gradient-to-r ${config.gradientColors} bg-clip-text animate-pulse`}>
            {errorCode}
          </div>
          <div className={`absolute inset-0 text-8xl md:text-9xl font-bold ${config.iconColor}/20 blur-sm`}>
            {errorCode}
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8 glass-morphism p-6 rounded-2xl">
          <div className="flex justify-center mb-4">
            <IconComponent className={`w-16 h-16 ${config.iconColor} animate-bounce`} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Oops! {displayTitle}
          </h1>
          <p className="text-gray-400 mb-6 leading-relaxed">
            {displayMessage}
          </p>
          <p className="text-sm text-gray-500">
            {displaySuggestion}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center relative z-10">
          <Link
            to="/"
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </Link>
          
          {showSearchButton && (
            <Link
              to="/search"
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              <Search className="w-5 h-5" />
              <span>Search Movies</span>
            </Link>
          )}
          
          {showBackButton && (
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Go Back</span>
            </button>
          )}
        </div>

        {/* Suggestions - Only show for certain error types */}
        {[404, 400, 'network'].includes(errorCode) && (
          <div className="mt-12 glass-morphism p-6 rounded-2xl relative z-10">
            <h3 className="text-lg font-semibold text-white mb-4">What you can do:</h3>
            <ul className="text-gray-400 space-y-2 text-left">
              {errorCode === 404 && (
                <>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Check the URL for typos</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Browse our movie collection from the homepage</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Use the search feature to find specific movies</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Check your favorites collection</span>
                  </li>
                </>
              )}
              {errorCode === 400 && (
                <>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>Double-check the information you entered</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>Make sure all required fields are filled</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span>Try refreshing the page and starting over</span>
                  </li>
                </>
              )}
              {errorCode === 'network' && (
                <>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                    <span>Check your internet connection</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                    <span>Try refreshing the page</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                    <span>Wait a moment and try again</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* Floating Elements */}
        <div className="fixed top-10 left-10 opacity-20 pointer-events-none z-0">
          <IconComponent className={`w-8 h-8 ${config.iconColor} animate-spin`} style={{ animationDuration: '8s' }} />
        </div>
        <div className="fixed top-20 right-10 opacity-20 pointer-events-none z-0">
          <Search className="w-6 h-6 text-purple-500 animate-pulse" />
        </div>
        <div className="fixed bottom-20 left-20 opacity-20 pointer-events-none z-0">
          <Home className="w-10 h-10 text-blue-500 animate-bounce" style={{ animationDelay: '1s' }} />
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;