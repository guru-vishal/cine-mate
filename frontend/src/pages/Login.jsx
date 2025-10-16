import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuth();

  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Get the redirect path from location state or default to home
  const from = location.state?.from || '/';

  // Set message from navigation state if exists
  React.useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general message
    if (message) {
      setMessage('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email or username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setMessage('');

    try {
      const result = await login(formData.identifier, formData.password);
      
      if (result.success) {
        setMessage('Login successful! Redirecting...');
        // Redirect to the page user came from or home
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1000);
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to your CineMate account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="glass-morphism p-8 rounded-2xl space-y-6">
          {/* Email/Username Field */}
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-300 mb-2">
              Email or Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                className={`w-full pl-12 pr-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.identifier
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-gray-600 focus:ring-red-500/50 focus:border-red-500'
                }`}
                placeholder="Enter your email or username"
                disabled={isLoading}
              />
            </div>
            {errors.identifier && (
              <p className="mt-2 text-sm text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.identifier}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-12 pr-12 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.password
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-gray-600 focus:ring-red-500/50 focus:border-red-500'
                }`}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-lg flex items-center ${
              message.includes('successful') 
                ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
                : 'bg-red-500/20 border border-red-500/50 text-red-400'
            }`}>
              {message.includes('successful') ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {message}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Links */}
          <div className="space-y-4 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                state={{ from: location.state?.from }}
                className="text-red-400 hover:text-red-300 font-medium transition-colors"
              >
                Sign up here
              </Link>
            </p>
            
            <Link 
              to="/forgot-password" 
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors block"
            >
              Forgot your password?
            </Link>
          </div>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 glass-morphism p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Demo Credentials:</h3>
          <div className="text-xs text-gray-400 space-y-1">
            <p><span className="font-medium">Email:</span> demo@cinemate.com</p>
            <p><span className="font-medium">Password:</span> demo123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;