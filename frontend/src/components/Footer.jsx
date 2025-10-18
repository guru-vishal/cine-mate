import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Heart, Github, Mail, ExternalLink } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <Film className="h-8 w-8 text-primary-500" />
              <span className="text-2xl font-bold text-white">CineMate</span>
            </Link>
            <p className="text-gray-400 text-sm mb-4 leading-relaxed">
              Your personal movie recommendation system. Discover, explore, and enjoy the best movies tailored to your taste.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/guru-vishal/cine-mate"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-500 transition-colors duration-300"
                title="GitHub Repository"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://mail.google.com/mail/?view=cm&fs=1&to=vishal3012006@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-500 transition-colors duration-300"
                title="Contact Me"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col">
            <h3 className="text-white font-semibold mb-4 text-base">Quick Links</h3>
            <ul className="space-y-3 flex-1">
              <li>
                <Link
                  to="/"
                  className="text-gray-400 hover:text-primary-400 transition-colors duration-300 text-sm block"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/search"
                  className="text-gray-400 hover:text-primary-400 transition-colors duration-300 text-sm block"
                >
                  Search Movies
                </Link>
              </li>
              <li>
                <Link
                  to="/favorites"
                  className="text-gray-400 hover:text-primary-400 transition-colors duration-300 text-sm block"
                >
                  My Favorites
                </Link>
              </li>
              <li>
                <Link
                  to="/profile"
                  className="text-gray-400 hover:text-primary-400 transition-colors duration-300 text-sm block"
                >
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div className="flex flex-col">
            <h3 className="text-white font-semibold mb-4 text-base">Features</h3>
            <ul className="space-y-3 flex-1">
              <li className="flex items-start space-x-2 text-gray-400 text-sm">
                <Heart className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <span>Personalized Recommendations</span>
              </li>
              <li className="flex items-start space-x-2 text-gray-400 text-sm">
                <Film className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <span>Advanced Movie Search</span>
              </li>
              <li className="flex items-start space-x-2 text-gray-400 text-sm">
                <Heart className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <span>Favorites Management</span>
              </li>
              <li className="flex items-start space-x-2 text-gray-400 text-sm">
                <ExternalLink className="h-4 w-4 text-primary-500 mt-0.5 flex-shrink-0" />
                <span>Detailed Movie Information</span>
              </li>
            </ul>
          </div>

          {/* Data Source */}
          <div className="flex flex-col">
            <h3 className="text-white font-semibold mb-4 text-base">Powered By</h3>
            <div className="space-y-4 flex-1">
              <div>
                <a
                  href="https://www.themoviedb.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary-400 transition-colors duration-300 text-sm flex items-start space-x-1"
                >
                  <span>The Movie Database (TMDB)</span>
                  <ExternalLink className="h-3 w-3 mt-0.5 flex-shrink-0" />
                </a>
                <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                  Movie data and images
                </p>
              </div>
              <div className="text-gray-500 text-xs">
                <p className="leading-relaxed">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © {currentYear} CineMate. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <button className="text-gray-400 hover:text-primary-400 transition-colors duration-300">
                Privacy Policy
              </button>
              <button className="text-gray-400 hover:text-primary-400 transition-colors duration-300">
                Terms of Service
              </button>
              <button className="text-gray-400 hover:text-primary-400 transition-colors duration-300">
                About
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;