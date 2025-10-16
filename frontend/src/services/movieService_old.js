import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Mock data for development
const mockMovies = [
  {
    id: '1',
    title: 'Inception',
    genre: ['Sci-Fi', 'Thriller'],
    rating: 8.8,
    poster_url: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
    description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    year: 2010,
    duration: 148,
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Marion Cotillard', 'Tom Hardy']
  },
  {
    id: '2',
    title: 'Interstellar',
    genre: ['Sci-Fi', 'Drama'],
    rating: 8.6,
    poster_url: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.',
    year: 2014,
    duration: 169,
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain']
  },
  {
    id: '3',
    title: 'The Dark Knight',
    genre: ['Action', 'Crime', 'Drama'],
    rating: 9.0,
    poster_url: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/hqkIcbrOHL86UncnHIsHVcVmzue.jpg',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    year: 2008,
    duration: 152,
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart']
  },
  {
    id: '4',
    title: 'Pulp Fiction',
    genre: ['Crime', 'Drama'],
    rating: 8.9,
    poster_url: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/4cDFJr4HnXN5AdPw4AKrmLlMWdO.jpg',
    description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
    year: 1994,
    duration: 154,
    director: 'Quentin Tarantino',
    cast: ['John Travolta', 'Uma Thurman', 'Samuel L. Jackson']
  },
  {
    id: '5',
    title: 'The Godfather',
    genre: ['Crime', 'Drama'],
    rating: 9.2,
    poster_url: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/ejdD20cdHNFAYAN2DlqPToXKyzx.jpg',
    description: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
    year: 1972,
    duration: 175,
    director: 'Francis Ford Coppola',
    cast: ['Marlon Brando', 'Al Pacino', 'James Caan']
  },
  {
    id: '6',
    title: 'Avengers: Endgame',
    genre: ['Action', 'Adventure', 'Sci-Fi'],
    rating: 8.4,
    poster_url: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg',
    description: 'After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more.',
    year: 2019,
    duration: 181,
    director: 'Russo Brothers',
    cast: ['Robert Downey Jr.', 'Chris Evans', 'Mark Ruffalo']
  },
  {
    id: '7',
    title: 'Parasite',
    genre: ['Thriller', 'Drama', 'Comedy'],
    rating: 8.6,
    poster_url: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/TU9NIjwzjoKPwQHoHshkBcQZzr.jpg',
    description: 'A poor family schemes to become employed by a wealthy family by infiltrating their household and posing as unrelated, highly qualified individuals.',
    year: 2019,
    duration: 132,
    director: 'Bong Joon-ho',
    cast: ['Kang-ho Song', 'Sun-kyun Lee', 'Yeo-jeong Jo']
  },
  {
    id: '8',
    title: 'Joker',
    genre: ['Crime', 'Drama', 'Thriller'],
    rating: 8.4,
    poster_url: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/original/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg',
    description: 'In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society. He then embarks on a downward spiral of revolution and bloody crime.',
    year: 2019,
    duration: 122,
    director: 'Todd Phillips',
    cast: ['Joaquin Phoenix', 'Robert De Niro', 'Zazie Beetz']
  }
];

export const movieService = {
  getAllMovies: async () => {
    try {
      const response = await api.get('/movies');
      return response.data;
    } catch (error) {
      // Fallback to mock data if API is not available
      console.log('API not available, using mock data');
      return mockMovies;
    }
  },

  getMovieById: async (id) => {
    try {
      const response = await api.get(`/movies/${id}`);
      return response.data;
    } catch (error) {
      // Fallback to mock data
      return mockMovies.find(movie => movie.id === id);
    }
  },

  searchMovies: async (query) => {
    try {
      const response = await api.get(`/movies/search?q=${query}`);
      return response.data;
    } catch (error) {
      // Fallback to mock data search
      return mockMovies.filter(movie => 
        movie.title.toLowerCase().includes(query.toLowerCase()) ||
        movie.genre.some(g => g.toLowerCase().includes(query.toLowerCase()))
      );
    }
  },

  getRecommendations: async (userId) => {
    try {
      const response = await api.get(`/recommendations/${userId}`);
      return response.data;
    } catch (error) {
      // Fallback to mock recommendations
      return mockMovies.slice(0, 4);
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post('/user', userData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to create user');
    }
  },

  updateUserFavorites: async (userId, favorites) => {
    try {
      const response = await api.put(`/user/${userId}/favorites`, { favorites });
      return response.data;
    } catch (error) {
      throw new Error('Failed to update favorites');
    }
  }
};
