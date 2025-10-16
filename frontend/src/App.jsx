import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import Favorites from './pages/Favorites';
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
          <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-gray-900">
            <Navbar />
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
          </div>
        </Router>
      </MovieProvider>
    </AuthProvider>
  );
}

export default App;
