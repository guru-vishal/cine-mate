# � CineMate - Movie Recommendation Web Application

A modern, responsive movie recommendation platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

![CineMate Preview](https://via.placeholder.com/800x400/ef4444/ffffff?text=CineMate+Movie+App)

## ✨ Features

- � **Movie Discovery**: Browse and discover movies with beautiful, responsive design
- � **Smart Search**: Search movies by title, genre, director, or cast
- ❤️ **Favorites System**: Save and manage your favorite movies
- � **Personalized Recommendations**: Get movie suggestions based on your preferences
- � **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- ⚡ **Modern UI/UX**: Smooth animations and glass-morphism effects
- � **Dark Theme**: Beautiful dark theme with gradient backgrounds

## �️ Tech Stack

### Frontend
- **React.js** with Vite for fast development
- **TailwindCSS** for styling and animations
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons
- **Framer Motion** for animations

### Backend
- **Node.js** runtime environment
- **Express.js** web framework
- **MongoDB** with Mongoose ODM
- **CORS** for cross-origin requests
- **dotenv** for environment variables

## � Quick Start

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/) (local installation or MongoDB Atlas account)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Movie Recommendation System"
   ```

2. **Set up the Backend**
   ```bash
   cd backend
   npm install
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   ```

3. **Set up the Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Server will run on `http://localhost:5000`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Application will open at `http://localhost:5173`

## � Project Structure

```
Movie Recommendation System/
├── frontend/                 # React.js frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React Context for state management
│   │   ├── services/       # API service functions
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── backend/                 # Node.js/Express backend
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── config/             # Configuration files
│   └── package.json        # Backend dependencies
└── README.md               # Project documentation
```

## � API Endpoints

### Movies
- `GET /api/movies` - Get all movies
- `GET /api/movies/:id` - Get movie by ID
- `GET /api/movies/search?q=query` - Search movies
- `POST /api/movies` - Create new movie (Admin)

### Users
- `GET /api/user/:id` - Get user profile
- `POST /api/user` - Create new user
- `PUT /api/user/:id/favorites` - Update user favorites

### Recommendations
- `GET /api/recommendations/:userId` - Get user recommendations
- `GET /api/recommendations/genre/:genre` - Get recommendations by genre
- `GET /api/recommendations/trending` - Get trending movies

## � Design Features

- **Responsive Grid Layout**: Adapts from 1 column on mobile to 4 columns on desktop
- **Smooth Animations**: CSS transitions and keyframe animations
- **Glass Morphism**: Modern glass effect on cards and overlays
- **Gradient Backgrounds**: Beautiful gradient combinations
- **Interactive Elements**: Hover effects and micro-interactions
- **Loading States**: Skeleton loading for better UX

## � Deployment

### Backend Deployment
1. Set up MongoDB Atlas or use your preferred MongoDB hosting
2. Deploy to platforms like Heroku, Railway, or Vercel
3. Set environment variables in production

### Frontend Deployment
1. Build the production version:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy to Netlify, Vercel, or your preferred hosting platform

## � Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cinemate
```

## � Development Notes

- The app includes fallback to mock data when MongoDB is not available
- CORS is configured to allow frontend-backend communication
- Movie data includes poster images from TMDB
- Responsive design breakpoints: mobile (320px+), tablet (768px+), desktop (1024px+)

## � Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## � License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## � Acknowledgments

- Movie data and images from [The Movie Database (TMDB)](https://www.themoviedb.org/)
- Icons by [Lucide React](https://lucide.dev/)
- Styling with [TailwindCSS](https://tailwindcss.com/)

---

Made with ❤️ by [Your Name]
