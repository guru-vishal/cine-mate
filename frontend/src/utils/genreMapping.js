// TMDB Genre ID to Name mapping
export const GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

// Convert genre IDs to genre names
export const convertGenreIdsToNames = (genreIds = []) => {
  if (!Array.isArray(genreIds)) return [];
  
  return genreIds
    .map(id => GENRE_MAP[id])
    .filter(Boolean); // Remove undefined values
};

// Convert genre names to IDs (for reverse lookup)
export const convertGenreNamesToIds = (genreNames = []) => {
  const reverseMap = Object.entries(GENRE_MAP).reduce((acc, [id, name]) => {
    acc[name] = parseInt(id);
    return acc;
  }, {});

  return genreNames
    .map(name => reverseMap[name])
    .filter(id => id !== undefined);
};