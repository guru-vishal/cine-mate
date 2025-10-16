// Simple test for TMDB service
const tmdbService = require('./services/tmdbService');

console.log('Testing TMDB service...');

async function testTMDB() {
  try {
    console.log('Attempting to fetch popular movies...');
    const movies = await tmdbService.getPopularMovies(1);
    console.log('Success! Got', movies.length, 'movies');
    console.log('First movie:', movies[0]?.title);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testTMDB();