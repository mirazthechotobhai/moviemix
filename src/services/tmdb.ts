import { PosterData } from '../types';
import { FALLBACK_POSTERS } from '../data/fallbackPosters';

export const TMDB_API_KEY = (typeof window !== 'undefined' && (window as any).TMDB_API_KEY) || '71fa515dc2625da7b3ea90b7501d0e8c';

// High-speed CDN base paths for fast rendering
const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w780';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';


const GENRE_MAP: Record<number, string> = {
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
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

const GENRE_PALETTES: Record<number, { primary: string; secondary: string; accent: string; glow: string; border: string; bgGradient: string }> = {
  28: { // Action
    primary: '#E61E26',
    secondary: '#1d4ed8',
    accent: '#38bdf8',
    glow: 'rgba(230, 30, 38, 0.65)',
    border: 'rgba(230, 30, 38, 0.8)',
    bgGradient: 'from-red-950 via-neutral-950 to-blue-950',
  },
  12: { // Adventure
    primary: '#f59e0b',
    secondary: '#0284c7',
    accent: '#38bdf8',
    glow: 'rgba(245, 158, 11, 0.65)',
    border: 'rgba(245, 158, 11, 0.75)',
    bgGradient: 'from-amber-950 via-neutral-950 to-cyan-950',
  },
  16: { // Animation
    primary: '#ec4899',
    secondary: '#6366f1',
    accent: '#22d3ee',
    glow: 'rgba(236, 72, 153, 0.65)',
    border: 'rgba(236, 72, 153, 0.8)',
    bgGradient: 'from-pink-950 via-neutral-950 to-indigo-950',
  },
  35: { // Comedy
    primary: '#eab308',
    secondary: '#ea580c',
    accent: '#fde047',
    glow: 'rgba(234, 179, 8, 0.6)',
    border: 'rgba(234, 179, 8, 0.75)',
    bgGradient: 'from-yellow-950 via-neutral-950 to-orange-950',
  },
  80: { // Crime / Joker / Noir
    primary: '#10b981',
    secondary: '#dc2626',
    accent: '#facc15',
    glow: 'rgba(16, 185, 129, 0.65)',
    border: 'rgba(220, 38, 38, 0.8)',
    bgGradient: 'from-emerald-950 via-neutral-950 to-red-950',
  },
  18: { // Drama
    primary: '#f59e0b',
    secondary: '#64748b',
    accent: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.6)',
    border: 'rgba(245, 158, 11, 0.75)',
    bgGradient: 'from-amber-950 via-neutral-950 to-slate-950',
  },
  14: { // Fantasy
    primary: '#a855f7',
    secondary: '#06b6d4',
    accent: '#f472b6',
    glow: 'rgba(168, 85, 247, 0.65)',
    border: 'rgba(168, 85, 247, 0.8)',
    bgGradient: 'from-purple-950 via-neutral-950 to-cyan-950',
  },
  27: { // Horror
    primary: '#dc2626',
    secondary: '#09090b',
    accent: '#ef4444',
    glow: 'rgba(220, 38, 38, 0.75)',
    border: 'rgba(220, 38, 38, 0.9)',
    bgGradient: 'from-red-950 via-neutral-950 to-black',
  },
  878: { // Sci-Fi
    primary: '#06b6d4',
    secondary: '#8b5cf6',
    accent: '#38bdf8',
    glow: 'rgba(6, 182, 212, 0.65)',
    border: 'rgba(6, 182, 212, 0.8)',
    bgGradient: 'from-cyan-950 via-neutral-950 to-violet-950',
  },
  53: { // Thriller
    primary: '#ef4444',
    secondary: '#84cc16',
    accent: '#fbbf24',
    glow: 'rgba(239, 68, 68, 0.65)',
    border: 'rgba(239, 68, 68, 0.8)',
    bgGradient: 'from-red-950 via-neutral-950 to-lime-950',
  },
};

const DEFAULT_PALETTE = {
  primary: '#E61E26',
  secondary: '#1d4ed8',
  accent: '#38bdf8',
  glow: 'rgba(230, 30, 38, 0.65)',
  border: 'rgba(230, 30, 38, 0.8)',
  bgGradient: 'from-red-950 via-neutral-950 to-blue-950',
};

function formatMovieTitle(title: string) {
  const cleanTitle = (title || 'UNTITLED').trim();

  if (cleanTitle.includes(':')) {
    const parts = cleanTitle.split(':');
    return {
      titleLine1: parts[0].trim().toUpperCase(),
      titleLine2: parts.slice(1).join(':').trim().toUpperCase(),
    };
  }

  if (cleanTitle.includes(' - ')) {
    const parts = cleanTitle.split(' - ');
    return {
      titleLine1: parts[0].trim().toUpperCase(),
      titleLine2: parts.slice(1).join(' - ').trim().toUpperCase(),
    };
  }

  const words = cleanTitle.split(' ');
  if (words.length >= 3) {
    const mid = Math.ceil(words.length / 2);
    return {
      titleLine1: words.slice(0, mid).join(' ').toUpperCase(),
      titleLine2: words.slice(mid).join(' ').toUpperCase(),
    };
  } else if (words.length === 2 && words[0].length > 2 && words[1].length > 2) {
    return {
      titleLine1: words[0].toUpperCase(),
      titleLine2: words[1].toUpperCase(),
    };
  }

  return {
    titleLine1: cleanTitle.toUpperCase(),
    titleLine2: undefined,
  };
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'IN THEATRES NOW';
  try {
    const d = new Date(dateStr);
    const months = [
      'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
    ];
    if (!isNaN(d.getTime())) {
      return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}, ${d.getFullYear()}`;
    }
  } catch {
    // Fallback
  }
  return dateStr;
}

// Fetch additional credits, details & textless poster images for a specific movie from TMDB
export async function fetchMovieDetails(movieId: number): Promise<{
  director: string;
  musicBy: string;
  cast: { actor: string; character: string }[];
  runtime?: number;
  productionCompanies: string[];
  tagline?: string;
  textlessPosterUrl?: string;
} | null> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,images`
    );
    if (!res.ok) return null;
    const data = await res.json();

    const crew = data.credits?.crew || [];
    const rawCast = data.credits?.cast || [];

    const directorObj = crew.find((c: any) => c.job === 'Director');
    const composerObj = crew.find((c: any) => c.job === 'Original Music Composer' || c.job === 'Music');

    const topCast = rawCast.slice(0, 6).map((c: any) => ({
      actor: c.name || 'Cast Member',
      character: c.character || 'Leading Role',
    }));

    const prodCompanies = (data.production_companies || []).slice(0, 4).map((p: any) => p.name);

    // Look for genuine textless posters (iso_639_1 is null or empty) or best available poster artwork
    const posters = data.images?.posters || [];
    const textless = posters.find((img: any) => img.iso_639_1 === null || img.iso_639_1 === '' || img.iso_639_1 === 'xx');
    const bestPoster = textless || posters[0];
    const textlessUrl = bestPoster?.file_path ? `${TMDB_POSTER_BASE}${bestPoster.file_path}` : undefined;

    return {
      director: directorObj ? directorObj.name.toUpperCase() : 'THEATRICAL DIRECTOR',
      musicBy: composerObj ? composerObj.name.toUpperCase() : 'ORIGINAL SOUNDTRACK',
      cast: topCast.length > 0 ? topCast : [{ actor: 'ENSEMBLE CAST', character: 'Key Characters' }],
      runtime: data.runtime || undefined,
      productionCompanies: prodCompanies.length > 0 ? prodCompanies : ['THEATRICAL RELEASE'],
      tagline: data.tagline ? data.tagline.trim() : undefined,
      textlessPosterUrl: textlessUrl,
    };
  } catch {
    return null;
  }
}

export function transformTmdbMovie(m: any, detailedInfo?: any): PosterData {
  const { titleLine1, titleLine2 } = formatMovieTitle(m.title || m.original_title || 'UNTITLED');
  const genreIds: number[] = m.genre_ids || [];
  const primaryGenreId = genreIds.length > 0 ? genreIds[0] : 28;
  const themeColor = GENRE_PALETTES[primaryGenreId] || DEFAULT_PALETTE;
  const year = m.release_date ? m.release_date.split('-')[0] : '2025';
  const formattedRelease = formatDate(m.release_date);

  const genresList = genreIds.map((id) => GENRE_MAP[id] || 'Film').slice(0, 3);
  if (genresList.length === 0) genresList.push('Cinema');

  // Reliable, guaranteed high-speed CDN paths
  const posterPath = typeof m.poster_path === 'string' && m.poster_path.startsWith('/')
    ? `${TMDB_POSTER_BASE}${m.poster_path}`
    : (typeof m.backdrop_path === 'string' && m.backdrop_path.startsWith('/')
        ? `${TMDB_POSTER_BASE}${m.backdrop_path}`
        : FALLBACK_POSTERS[0].heroImageUrl);

  const backdropPath = typeof m.backdrop_path === 'string' && m.backdrop_path.startsWith('/')
    ? `${TMDB_BACKDROP_BASE}${m.backdrop_path}`
    : posterPath;

  const bgImageUrl = backdropPath;
  const heroImageUrl = posterPath;
  // If textless clean poster is not available, default directly to the main poster everywhere
  const textlessPosterUrl = detailedInfo?.textlessPosterUrl || posterPath;

  const titleLower = (m.title || '').toLowerCase();
  let logoVariant: PosterData['spiderLogoVariant'] = 'modern';
  if (titleLower.includes('batman')) logoVariant = 'bat';
  else if (titleLower.includes('joker')) logoVariant = 'joker';
  else if (titleLower.includes('spider')) logoVariant = 'verse';
  else if (titleLower.includes('venom')) logoVariant = 'symbiote';

  const defaultTagline = detailedInfo?.tagline || (m.overview ? m.overview.slice(0, 95).toUpperCase() : 'ONLY IN THEATERS & IMAX');
  const defaultCompanies = detailedInfo?.productionCompanies || ['WARNER BROS. • UNIVERSAL • MARVEL • SONY PICTURES'];

  return {
    id: `tmdb-${m.id}`,
    tmdbId: m.id,
    title: (m.title || m.original_title || 'UNTITLED').toUpperCase(),
    titleLine1,
    titleLine2,
    subtitle: genresList.join(' • ').toUpperCase(),
    tagline: defaultTagline,
    releaseDate: formattedRelease,
    releaseVenue: 'EXPERIENCE IT IN IMAX 70MM & DOLBY CINEMA',
    rating: m.adult ? 'R' : 'PG-13',
    year,
    studioPresenter: defaultCompanies.slice(0, 2).join(' • ').toUpperCase(),
    themeColor,
    synopsis: m.overview || 'Experience this groundbreaking cinematic journey exclusively on the biggest screens worldwide.',
    overview: m.overview || 'No overview available.',
    genres: genresList,
    voteAverage: m.vote_average ? Number(m.vote_average.toFixed(1)) : 8.0,
    voteCount: m.vote_count || 150,
    runtime: detailedInfo?.runtime,
    popularity: m.popularity ? Math.round(m.popularity) : 100,
    productionCompanies: defaultCompanies,
    cast: detailedInfo?.cast || [
      { actor: 'STARRING ENSEMBLE', character: 'Featured Cast' },
      { actor: 'TMDB SCORE', character: `${m.vote_average?.toFixed(1) || '8.0'}/10` },
    ],
    director: detailedInfo?.director || 'ACCLAIMED FILMMAKER',
    musicBy: detailedInfo?.musicBy || 'ORIGINAL CINEMATIC SOUNDTRACK',
    bgImageUrl,
    heroImageUrl,
    textlessPosterUrl,
    spiderLogoVariant: logoVariant,
    soundtrackTitle: 'Original Motion Picture Soundtrack Available Worldwide',
  };
}

export async function fetchTrendingMoviesPage(page: number): Promise<PosterData[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&page=${page}&language=en-US`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn('TMDB Trending HTTP status:', res.status);
      return page === 1 ? FALLBACK_POSTERS : [];
    }

    const data = await res.json();
    const rawMovies = (data.results || []).filter(
      (m: any) =>
        m &&
        ((typeof m.poster_path === 'string' && m.poster_path.startsWith('/')) ||
          (typeof m.backdrop_path === 'string' && m.backdrop_path.startsWith('/')))
    );

    if (rawMovies.length === 0) {
      return page === 1 ? FALLBACK_POSTERS : [];
    }

    const movies = rawMovies.map((m: any) => transformTmdbMovie(m));
    preloadPosterImages(movies.slice(0, 4));
    return movies;
  } catch (err) {
    console.error('Error fetching trending movies from TMDB, using fallback:', err);
    return page === 1 ? FALLBACK_POSTERS : [];
  }
}

// Fetch top 100 cinema movies combining latest releases (Now Playing) and trending
export async function fetchTop100Movies(): Promise<PosterData[]> {
  try {
    const endpoints = [
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&page=1&language=en-US`,
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&page=2&language=en-US`,
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&page=1&language=en-US`,
      `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&page=2&language=en-US`,
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&page=3&language=en-US`,
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=1&language=en-US`,
      `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=2&language=en-US`,
    ];

    const responses = await Promise.allSettled(
      endpoints.map(async (url) => {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 7000);
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(tid);
        if (!res.ok) return [];
        const json = await res.json();
        return json.results || [];
      })
    );

    const rawList: any[] = [];
    const seenIds = new Set<number>();

    for (const r of responses) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        for (const item of r.value) {
          if (
            item &&
            item.id &&
            !seenIds.has(item.id) &&
            ((typeof item.poster_path === 'string' && item.poster_path.startsWith('/')) ||
              (typeof item.backdrop_path === 'string' && item.backdrop_path.startsWith('/')))
          ) {
            seenIds.add(item.id);
            rawList.push(item);
          }
        }
      }
    }

    if (rawList.length === 0) {
      return FALLBACK_POSTERS;
    }

    const transformed = rawList.map((m) => transformTmdbMovie(m));
    const target100 = transformed.slice(0, 100);

    // Merge with fallback posters if fewer than 100 to ensure robust experience
    const existingIds = new Set(target100.map((m) => m.tmdbId || m.id));
    const uniqueFallbacks = FALLBACK_POSTERS.filter((m) => !existingIds.has(m.tmdbId || m.id));
    const combined = [...target100, ...uniqueFallbacks].slice(0, 100);

    preloadPosterImages(combined.slice(0, 6));
    return combined;
  } catch (err) {
    console.error('Error fetching top 100 movies:', err);
    return FALLBACK_POSTERS;
  }
}

// Search TMDB live for ANY movie with infinite pagination support
export async function searchTmdbMoviesPaged(
  query: string,
  page: number = 1
): Promise<{ movies: PosterData[]; hasMore: boolean; totalPages: number }> {
  const trimmed = query.trim();
  if (!trimmed) return { movies: [], hasMore: false, totalPages: 0 };

  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 7000);
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      trimmed
    )}&include_adult=false&language=en-US&page=${page}`;
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);

    if (!res.ok) return { movies: [], hasMore: false, totalPages: 0 };
    const data = await res.json();
    const totalPages = data.total_pages || 1;
    const rawMovies = (data.results || []).filter(
      (m: any) =>
        m &&
        ((typeof m.poster_path === 'string' && m.poster_path.startsWith('/')) ||
          (typeof m.backdrop_path === 'string' && m.backdrop_path.startsWith('/')))
    );

    const movies = rawMovies.map((m: any) => transformTmdbMovie(m));
    return {
      movies,
      hasMore: page < totalPages,
      totalPages,
    };
  } catch (err) {
    console.error('Error searching TMDB movies:', err);
    return { movies: [], hasMore: false, totalPages: 0 };
  }
}

// Fetch infinite catalog pages with no limit (trending, discover, now_playing, popular)
export async function fetchInfiniteCatalog(
  page: number = 1,
  category: 'trending' | 'popular' | 'top_rated' | 'now_playing' | 'all' = 'all'
): Promise<{ movies: PosterData[]; hasMore: boolean }> {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 7000);

    let url = `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&page=${page}&language=en-US`;
    if (category === 'popular') {
      url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=${page}&language=en-US`;
    } else if (category === 'now_playing') {
      url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${TMDB_API_KEY}&page=${page}&language=en-US`;
    } else if (category === 'top_rated') {
      url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&page=${page}&language=en-US`;
    } else if (category === 'all') {
      // Dynamic cycling for endless varied discovery
      const endpoints = [
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&page=${page}&language=en-US`,
        `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&page=${page}&sort_by=popularity.desc&vote_count.gte=100&language=en-US`,
      ];
      url = endpoints[(page - 1) % endpoints.length];
    }

    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(tid);

    if (!res.ok) return { movies: [], hasMore: false };
    const data = await res.json();
    const totalPages = data.total_pages || 500;
    const rawMovies = (data.results || []).filter(
      (m: any) =>
        m &&
        ((typeof m.poster_path === 'string' && m.poster_path.startsWith('/')) ||
          (typeof m.backdrop_path === 'string' && m.backdrop_path.startsWith('/')))
    );

    const movies = rawMovies.map((m: any) => transformTmdbMovie(m));
    return {
      movies,
      hasMore: page < totalPages,
    };
  } catch (err) {
    console.error('Error fetching infinite catalog:', err);
    return { movies: [], hasMore: false };
  }
}

// Backward compatibility alias
export async function searchTmdbMovies(query: string): Promise<PosterData[]> {
  const res = await searchTmdbMoviesPaged(query, 1);
  return res.movies;
}

// Utility to preload poster images into browser cache
export function preloadPosterImages(posters: PosterData[]) {
  if (typeof window === 'undefined') return;
  posters.forEach((p) => {
    if (p.heroImageUrl) {
      const img = new Image();
      img.src = p.heroImageUrl;
    }
    if (p.bgImageUrl) {
      const bg = new Image();
      bg.src = p.bgImageUrl;
    }
  });
}
