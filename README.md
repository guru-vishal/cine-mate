# 🎬 CineMate - Movie Recommendation Web Application

A modern, responsive movie recommendation platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js) integrated with TMDB API for real-time movie data.

![CineMate Preview](https://via.placeholder.com/800x400/ef4444/ffffff?text=CineMate+Movie+App)

## ✨ Features

### 🎯 Core Functionality
- 🎭 **Movie Discovery**: Browse and discover movies with beautiful, responsive design
- 🔍 **Smart Search**: Advanced search with real-time suggestions and history tracking
- ❤️ **Advanced Favorites System**: Save, manage, and clear all favorite movies with confirmation modals
- 📊 **Personalized Recommendations**: AI-powered suggestions based on viewing history and preferences
- 📱 **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- ⚡ **Modern UI/UX**: Smooth animations with glass-morphism effects and custom modals

### 🔐 User Management
- 🔒 **Secure Authentication**: JWT-based login/logout with session management
- 👤 **User Profiles**: Comprehensive profile management with preferences
- 📝 **Activity Tracking**: Search history and watch history with database persistence
- 🎨 **Personalized Experience**: Custom recommendations based on user behavior

### 📊 Data & Analytics
- 📈 **Watch History**: Track and display viewing patterns with statistics
- 🕐 **Search History**: Store and manage search queries with timestamps
- 📋 **User Statistics**: Display activity overview with visual components
- 💾 **Data Persistence**: Reliable MongoDB storage with backup localStorage

### 🎨 Design & UX
- 🌙 **Modern Dark Theme**: Beautiful dark theme with gradient backgrounds
- ✨ **Custom Modals**: React-based confirmation dialogs with type-based styling
- 🎭 **Interactive Elements**: Hover effects, transitions, and micro-interactions
- 🧹 **Clear Actions**: Clear buttons for search inputs and bulk operations
- 📱 **Mobile-First**: Touch-friendly interface with responsive grid layouts

## 🛠️ Tech Stack

### Frontend
- **React.js 19.1.1** with Vite for lightning-fast development
- **TailwindCSS 3.4.18** for modern styling and animations
- **React Router DOM 7.9.4** for client-side navigation
- **Axios 1.12.2** for API communication
- **Lucide React** for beautiful icons
- **Framer Motion 12.23.24** for smooth animations
- **Custom Context API** for state management

### Backend
- **Node.js** runtime environment
- **Express.js 4.18.2** web framework
- **MongoDB** with Mongoose 8.0.0 ODM
- **JWT Authentication** with bcryptjs for security
- **TMDB API Integration** for real-time movie data
- **Winston Logging** with Elasticsearch integration
- **PM2** for production process management
- **CORS** for cross-origin requests

### Database & External APIs
- **MongoDB Atlas** cloud database
- **TMDB API** for movie data and images
- **Elasticsearch** for advanced search capabilities
- **JWT** for secure authentication

## 🆕 Recent Updates & Features

### Latest Features (v2.0)
- ✅ **Complete TMDB Integration**: Real-time movie data with high-quality images
- ✅ **Advanced Search History**: Database-persistent search tracking with timestamps
- ✅ **Watch History System**: Track and display user viewing patterns
- ✅ **Custom Confirmation Modals**: React-based modals with danger/warning/info styling
- ✅ **Bulk Operations**: Clear all favorites with proper confirmation
- ✅ **Professional Footer**: 4-column responsive footer with social links
- ✅ **Enhanced UI/UX**: Clear buttons, aligned components, and improved animations
- ✅ **Activity Statistics**: Visual display of user engagement metrics
- ✅ **Mobile Optimization**: Touch-friendly interface with responsive design

### Bug Fixes & Improvements
- 🐛 Fixed movie duration display issues in listings
- 🐛 Resolved clear all favorites functionality (was only clearing last item)
- 🐛 Fixed genre handling and display inconsistencies  
- 🔧 Enhanced error handling with user-friendly messages
- 🔧 Improved state management with proper async operations
- 🔧 Added comprehensive input validation and sanitization

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB Atlas Account](https://www.mongodb.com/atlas) or local MongoDB installation
- [TMDB API Key](https://www.themoviedb.org/settings/api) for movie data
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/guru-vishal/cine-mate.git
   cd "Movie Recommendation System"
   ```

2. **Set up the Backend**
   ```bash
   cd backend
   npm install
   
   # Create and configure environment file
   cp .env.example .env
   # Add your MongoDB URI and TMDB API key to .env
   ```

3. **Set up the Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure Environment Variables**
   - Get your TMDB API key from [TMDB API](https://www.themoviedb.org/settings/api)
   - Set up MongoDB Atlas or local MongoDB instance
   - Update `.env` file in backend directory with your credentials

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

## ��� Project Structure

```
Movie Recommendation System/
├── frontend/                          # React.js frontend application
│   ├── src/
│   │   ├── components/               # Reusable UI components
│   │   │   ├── ConfirmationModal.jsx # Custom modal component
│   │   │   ├── Footer.jsx           # Site footer with links
│   │   │   ├── MovieCard.jsx        # Movie display card
│   │   │   ├── MovieFilters.jsx     # Search and filter controls
│   │   │   ├── Navbar.jsx           # Navigation header
│   │   │   ├── SearchHistory.jsx    # Search history dropdown
│   │   │   └── UserStats.jsx        # User activity statistics
│   │   ├── pages/                   # Main page components
│   │   │   ├── Home.jsx            # Landing page
│   │   │   ├── Search.jsx          # Search results page
│   │   │   ├── Favorites.jsx       # User favorites page
│   │   │   ├── Profile.jsx         # User profile page
│   │   │   └── MovieDetail.jsx     # Detailed movie view
│   │   ├── context/                # React Context for state
│   │   │   ├── AuthContext.jsx     # Authentication state
│   │   │   └── MovieContext.jsx    # Movies and user data state
│   │   ├── services/               # API service functions
│   │   │   ├── movieService.js     # TMDB API integration
│   │   │   ├── searchHistoryService.js # Search history API
│   │   │   └── watchHistoryService.js  # Watch history API
│   │   ├── hooks/                  # Custom React hooks
│   │   └── utils/                  # Utility functions
│   ├── public/                     # Static assets and favicon
│   ├── index.html                  # Main HTML template
│   └── package.json               # Frontend dependencies
├── backend/                        # Node.js/Express backend
│   ├── models/
│   │   └── User.js                # User schema with favorites/history
│   ├── routes/
│   │   ├── auth.js                # Authentication & user management
│   │   ├── movies.js              # Movie search and data
│   │   ├── recommendations.js     # Personalized recommendations
│   │   └── users.js               # User profile management
│   ├── middleware/
│   │   └── auth.js                # JWT authentication middleware
│   ├── services/
│   │   └── tmdbService.js         # TMDB API service layer
│   ├── config/
│   │   └── database.js            # MongoDB connection config
│   ├── utils/
│   │   └── logger.js              # Winston logging configuration
│   ├── server.js                  # Express server entry point
│   ├── .env                       # Environment variables
│   └── package.json               # Backend dependencies
├── infra/                          # Infrastructure as Code
│   ├── main.tf                    # Terraform main configuration
│   ├── variables.tf               # Terraform variables
│   └── outputs.tf                 # Terraform outputs
├── Jenkinsfile                     # CI/CD pipeline configuration
└── README.md                       # Project documentation
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/verify-token` - Verify JWT token

### Favorites Management
- `GET /api/auth/favorites` - Get user's favorite movies
- `POST /api/auth/favorites/:movieId` - Add movie to favorites
- `DELETE /api/auth/favorites/:movieId` - Remove movie from favorites
- `DELETE /api/auth/favorites` - Clear all favorites
- `PUT /api/auth/favorites` - Update entire favorites list

### Movies & Search
- `GET /api/movies/search` - Search movies with TMDB integration
- `GET /api/movies/popular` - Get popular movies
- `GET /api/movies/trending` - Get trending movies
- `GET /api/movies/:id` - Get movie details

### User History
- `POST /api/users/search-history` - Add search to history
- `GET /api/users/search-history` - Get user's search history
- `DELETE /api/users/search-history` - Clear search history
- `POST /api/users/watch-history` - Add to watch history
- `GET /api/users/watch-history` - Get watch history
- `DELETE /api/users/watch-history/:movieId` - Remove from watch history

### Recommendations
- `GET /api/auth/recommendations` - Get personalized recommendations
- `GET /api/recommendations/trending` - Get trending recommendations
- `GET /api/recommendations/genre/:genre` - Get genre-based recommendations

## 🎨 Design Features

### Layout & Responsiveness
- **Responsive Grid Layout**: Adapts from 1 column on mobile to 6 columns on desktop
- **Mobile-First Design**: Touch-friendly interface with optimized spacing
- **Flexible Components**: Modular components that work across all screen sizes
- **Professional Footer**: 4-column footer with proper alignment and links

### Visual Effects
- **Smooth Animations**: CSS transitions and Framer Motion animations
- **Glass Morphism**: Modern glass effect on cards and overlays
- **Gradient Backgrounds**: Beautiful gradient combinations with dark themes
- **Interactive Elements**: Hover effects, focus states, and micro-interactions
- **Loading States**: Skeleton loading and shimmer effects for better UX

### User Experience
- **Custom Modals**: React-based confirmation dialogs with type-based styling (danger, warning, info)
- **Clear Actions**: X buttons for search inputs and bulk clear operations
- **Visual Feedback**: Toast notifications and status indicators
- **Activity Tracking**: Visual display of user statistics and activity history
- **Intuitive Navigation**: Breadcrumbs and clear navigation patterns

## 🚀 Deployment

### Production Deployment Options

#### Backend Deployment
**Recommended Platforms:**
- **Railway**: Easy deployment with database integration
- **Heroku**: Classic PaaS with good documentation  
- **Vercel**: Serverless functions (for API routes)
- **DigitalOcean App Platform**: Container-based deployment

**Steps:**
1. Set up MongoDB Atlas cloud database
2. Configure environment variables on your platform
3. Deploy backend with PM2 for process management
4. Set up SSL certificates for HTTPS

#### Frontend Deployment  
**Recommended Platforms:**
- **Vercel**: Optimized for React apps with automatic deployments
- **Netlify**: Great for static sites with form handling
- **GitHub Pages**: Free hosting for public repositories
- **AWS S3 + CloudFront**: Scalable static hosting

**Build Process:**
```bash
cd frontend
npm run build
# Deploy the 'dist' folder to your hosting platform
```

### CI/CD Pipeline
The project includes Jenkins configuration (`Jenkinsfile`) for automated deployments:
- Automated testing on push
- Build verification  
- Deployment to staging/production environments

### Infrastructure as Code
Terraform configurations (`infra/` directory) for:
- AWS/Azure cloud deployments
- Database provisioning
- Load balancer configuration
- SSL certificate management

## 🌐 Environment Variables

### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# Elasticsearch Configuration (Optional)
ELASTIC_URL=http://localhost:9200
ELASTIC_USERNAME=elastic
ELASTIC_PASSWORD=changeme

# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# TMDB API Configuration (Required)
TMDB_API_KEY=your_tmdb_api_key
TMDB_BASE_URL=https://api.themoviedb.org/3
```

### Required API Keys
1. **TMDB API Key**: Get from [The Movie Database](https://www.themoviedb.org/settings/api)
2. **MongoDB Atlas**: Set up at [MongoDB Atlas](https://www.mongodb.com/atlas/database)

### Optional Services
- **Elasticsearch**: For advanced search features (can work without it)
- **PM2**: For production deployment and process management

## 💻 Development Notes

### Architecture
- **Context API State Management**: Custom MovieContext for global state
- **JWT Authentication**: Secure token-based authentication with refresh handling
- **Real-time TMDB Integration**: Live movie data with image optimization
- **Database Persistence**: MongoDB for user data, favorites, and history tracking

### Performance Features
- **Lazy Loading**: Components and images loaded on demand
- **Caching Strategy**: localStorage fallback for offline functionality
- **Optimized Queries**: Efficient MongoDB queries with proper indexing
- **Image Optimization**: Responsive images with TMDB's multi-resolution support

### Code Quality
- **ESLint Configuration**: Modern ESLint setup with React hooks rules
- **Modular Architecture**: Reusable components and service layers
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Type Safety**: PropTypes and consistent data structures

### Responsive Breakpoints
- **Mobile**: 320px+ (1 column grid)
- **Tablet**: 768px+ (2-3 column grid)
- **Desktop**: 1024px+ (4-6 column grid)
- **Large Desktop**: 1440px+ (optimized spacing)

## ��� Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## ��� License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow ESLint configurations for code quality
- Write descriptive commit messages
- Test your changes thoroughly
- Update documentation as needed
- Ensure responsive design across devices

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Movie Data**: [The Movie Database (TMDB)](https://www.themoviedb.org/) for comprehensive movie information
- **Icons**: [Lucide React](https://lucide.dev/) for beautiful, consistent icons
- **Styling**: [TailwindCSS](https://tailwindcss.com/) for utility-first CSS framework
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth animations
- **State Management**: React Context API for efficient state handling
- **Authentication**: JWT for secure user authentication

## 📞 Support & Contact

- **Repository**: [GitHub - CineMate](https://github.com/guru-vishal/cine-mate)
- **Issues**: Report bugs and request features via GitHub Issues
- **Documentation**: Comprehensive guides in the `/docs` directory
- **Community**: Join discussions in GitHub Discussions

---

**CineMate** - Discover movies like never before! 🎬✨

Made with ❤️ using the MERN Stack | **v2.0** | © 2024
