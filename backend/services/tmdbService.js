// Mock TMDB Service for testing favorites functionality
// Returns data in TMDB API format

const mockMovies = [
  {
    id: 550,
    title: "Fight Club",
    overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
    poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    backdrop_path: "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg", 
    release_date: "1999-10-15",
    vote_average: 8.433,
    genre_ids: [18, 53],
    adult: false,
    video: false,
    vote_count: 26280
  },
  {
    id: 13,
    title: "Forrest Gump", 
    overview: "A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined he could do.",
    poster_path: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    backdrop_path: "/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg",
    release_date: "1994-06-23", 
    vote_average: 8.471,
    genre_ids: [35, 18, 10749],
    adult: false,
    video: false,
    vote_count: 24870
  },
  {
    id: 680,
    title: "Pulp Fiction",
    overview: "A burger-loving hit man, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer converge in this sprawling, comedic crime caper.",
    poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    backdrop_path: "/4cDFJr4HnXN5AdPw4AKrmLlMWdO.jpg",
    release_date: "1994-09-10",
    vote_average: 8.488,
    genre_ids: [53, 80],
    adult: false,
    video: false,
    vote_count: 25622
  },
  {
    id: 238,
    title: "The Shawshank Redemption",
    overview: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison, where he puts his accounting skills to work for an amoral warden.",
    poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    backdrop_path: "/iNh3BivHyg5sQRPP1KOkzguEX0H.jpg",
    release_date: "1994-09-23",
    vote_average: 8.707,
    genre_ids: [18, 80],
    adult: false,
    video: false,
    vote_count: 24871
  },
  {
    id: 424,
    title: "Schindler's List",
    overview: "The true story of how businessman Oskar Schindler saved over a thousand Jewish lives from the Nazis while they worked as slaves in his factory during World War II.",
    poster_path: "/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
    backdrop_path: "/loRmRzQXZeqG78TqZuyvSlEQfZb.jpg",
    release_date: "1993-12-15",
    vote_average: 8.565,
    genre_ids: [18, 36, 10752],
    adult: false,
    video: false,
    vote_count: 13701
  }
];

class TMDBService {
  async getPopularMovies(page = 1) {
    // Return paginated mock data in TMDB format
    const startIndex = (page - 1) * 20;
    return {
      results: mockMovies.slice(startIndex, startIndex + 20),
      page: page,
      total_pages: Math.ceil(mockMovies.length / 20),
      total_results: mockMovies.length
    };
  }

  async getTopRatedMovies(page = 1) {
    const sorted = [...mockMovies].sort((a, b) => b.vote_average - a.vote_average);
    const startIndex = (page - 1) * 20;
    return {
      results: sorted.slice(startIndex, startIndex + 20),
      page: page,
      total_pages: Math.ceil(sorted.length / 20),
      total_results: sorted.length
    };
  }

  async getNowPlayingMovies(page = 1) {
    return this.getPopularMovies(page);
  }

  async getUpcomingMovies(page = 1) {
    return this.getPopularMovies(page);
  }

  async getMixedMovies(limit = 20) {
    return mockMovies.slice(0, limit);
  }

  async searchMovies(query, page = 1) {
    const filtered = mockMovies.filter(movie => 
      movie.title.toLowerCase().includes(query.toLowerCase()) ||
      movie.overview.toLowerCase().includes(query.toLowerCase())
    );
    
    const startIndex = (page - 1) * 20;
    return {
      results: filtered.slice(startIndex, startIndex + 20),
      page: page,
      total_pages: Math.ceil(filtered.length / 20),
      total_results: filtered.length
    };
  }

  async getGenres() {
    return [
      { id: 28, name: "Action" },
      { id: 12, name: "Adventure" },
      { id: 16, name: "Animation" },
      { id: 35, name: "Comedy" },
      { id: 80, name: "Crime" },
      { id: 99, name: "Documentary" },
      { id: 18, name: "Drama" },
      { id: 10751, name: "Family" },
      { id: 14, name: "Fantasy" },
      { id: 36, name: "History" },
      { id: 27, name: "Horror" },
      { id: 10402, name: "Music" },
      { id: 9648, name: "Mystery" },
      { id: 10749, name: "Romance" },
      { id: 878, name: "Science Fiction" },
      { id: 10770, name: "TV Movie" },
      { id: 53, name: "Thriller" },
      { id: 10752, name: "War" },
      { id: 37, name: "Western" }
    ];
  }

  async getMoviesByGenre(genreId, page = 1) {
    const filtered = mockMovies.filter(movie => 
      movie.genre_ids.includes(parseInt(genreId))
    );
    
    const startIndex = (page - 1) * 20;
    return {
      results: filtered.slice(startIndex, startIndex + 20),
      page: page,
      total_pages: Math.ceil(filtered.length / 20),
      total_results: filtered.length
    };
  }

  async getSimilarMovies(movieId, page = 1) {
    return this.getPopularMovies(page);
  }

  async getMovieRecommendations(movieId, page = 1) {
    return this.getPopularMovies(page);
  }

  async getMovieDetails(movieId) {
    return mockMovies.find(movie => movie.id === parseInt(movieId)) || mockMovies[0];
  }
}

module.exports = new TMDBService();
