import Home from '../pages/Home';
import MovieDetail from '../pages/MovieDetail';
import Favorites from '../pages/Favorites';
import Watchlist from '../pages/Watchlist';
import Search from '../pages/Search';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';

// Route configuration with protection levels
export const routeConfig = [
  // Public routes (accessible to everyone)
  {
    path: '/',
    element: Home,
    isProtected: false,
    isPublic: true
  },
  {
    path: '/movie/:id',
    element: MovieDetail,
    isProtected: false,
    isPublic: true
  },
  {
    path: '/search',
    element: Search,
    isProtected: false,
    isPublic: true
  },
  
  // Protected routes (require authentication)
  {
    path: '/favorites',
    element: Favorites,
    isProtected: true,
    title: 'Favorites',
    description: 'View and manage your favorite movies'
  },
  {
    path: '/watchlist',
    element: Watchlist,
    isProtected: true,
    title: 'Watchlist',
    description: 'View and manage movies you want to watch'
  },
  {
    path: '/profile',
    element: Profile,
    isProtected: true,
    title: 'Profile',
    description: 'Manage your account settings and preferences'
  },
  
  // Guest-only routes (redirect if authenticated)
  {
    path: '/login',
    element: Login,
    isGuestOnly: true,
    title: 'Login'
  },
  {
    path: '/signup',
    element: Signup,
    isGuestOnly: true,
    title: 'Sign Up'
  },
  
  // 404 route
  {
    path: '*',
    element: NotFound,
    isPublic: true
  }
];

// Get protected routes
export const getProtectedRoutes = () => 
  routeConfig.filter(route => route.isProtected);

// Get public routes  
export const getPublicRoutes = () => 
  routeConfig.filter(route => route.isPublic);

// Get guest-only routes
export const getGuestOnlyRoutes = () => 
  routeConfig.filter(route => route.isGuestOnly);