import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import Favorites from './pages/Favorites';
import Watchlist from './pages/Watchlist';
import Search from './pages/Search';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import GuestOnlyRoute from './components/GuestOnlyRoute';
import RouteGuard from './components/RouteGuard';
import { MovieProvider } from './context/MovieContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <MovieProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-gray-900 flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
              {/* Public routes */}
              <Route 
                path="/" 
                element={
                  <RouteGuard type="public">
                    <Home />
                  </RouteGuard>
                } 
              />
              <Route 
                path="/movie/:id" 
                element={
                  <RouteGuard type="public">
                    <MovieDetail />
                  </RouteGuard>
                } 
              />
              <Route 
                path="/search" 
                element={
                  <RouteGuard type="public">
                    <Search />
                  </RouteGuard>
                } 
              />
              
              {/* Protected routes - require authentication */}
              <Route 
                path="/favorites" 
                element={
                  <RouteGuard type="protected">
                    <Favorites />
                  </RouteGuard>
                } 
              />
              <Route 
                path="/watchlist" 
                element={
                  <RouteGuard type="protected">
                    <Watchlist />
                  </RouteGuard>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <RouteGuard type="protected">
                    <Profile />
                  </RouteGuard>
                } 
              />
              
              {/* Guest-only routes - redirect if already logged in */}
              <Route 
                path="/login" 
                element={
                  <RouteGuard type="guest-only">
                    <Login />
                  </RouteGuard>
                } 
              />
              <Route 
                path="/signup" 
                element={
                  <RouteGuard type="guest-only">
                    <Signup />
                  </RouteGuard>
                } 
              />
              
              {/* 404 route */}
              <Route 
                path="*" 
                element={
                  <RouteGuard type="public">
                    <NotFound />
                  </RouteGuard>
                } 
              />
              </Routes>
            </main>
            <Footer />
          </div>
          {/* Toast notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1f2937',
                color: '#f3f4f6',
                border: '1px solid #374151',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f3f4f6',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f3f4f6',
                },
              },
            }}
          />
        </Router>
      </MovieProvider>
    </AuthProvider>
  );
}

export default App;
