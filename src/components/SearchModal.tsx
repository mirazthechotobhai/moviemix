import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  Film,
  Tv,
  Sparkles,
  Star,
  Loader2,
  Compass,
  CheckCircle2,
  Globe,
  Languages,
  Calendar,
  Filter,
  RotateCcw,
  Sparkle,
  Flame,
  Infinity as InfinityIcon,
  TrendingUp,
  Award,
  Play,
  SlidersHorizontal,
} from 'lucide-react';
import { PosterData } from '../types';
import {
  fetchInfiniteCatalog,
  searchTmdbMoviesPaged,
  fetchInfiniteTVCatalog,
  searchTmdbTVPaged,
  fetchTop100TVShows,
  preloadPosterImages,
  MOVIE_GENRES,
  TV_GENRES,
  POPULAR_COUNTRIES,
  POPULAR_LANGUAGES,
  discoverTmdbMediaPaged,
} from '../services/tmdb';
import {
  fetchTop100AniListAnime,
  fetchInfiniteAniListCatalog,
  searchAniListAnimePaged,
} from '../services/anilist';
import { sound } from '../utils/audio';

export type SearchMode = 'movies' | 'tv' | 'anime';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movie: PosterData, mode?: SearchMode) => void;
  onPlayDirectly?: (movie: PosterData) => void;
  activeMode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  loadedMovies: PosterData[];
  currentMovieId?: string;
}

type StreamCategory = 'all' | 'top100' | 'trending' | 'popular' | 'now_playing' | 'top_rated';

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectMovie,
  activeMode,
  onModeChange,
  loadedMovies,
  currentMovieId,
}) => {
  const [query, setQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<StreamCategory>('trending');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Discover & Filter States
  const [selectedGenreId, setSelectedGenreId] = useState<string | number>('ALL');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [isDiscoverActive, setIsDiscoverActive] = useState<boolean>(false);
  const [discoverResults, setDiscoverResults] = useState<PosterData[]>([]);
  const [discoverPage, setDiscoverPage] = useState<number>(1);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState<boolean>(false);
  const [hasMoreDiscover, setHasMoreDiscover] = useState<boolean>(false);

  // Movies State
  const [catalogMovies, setCatalogMovies] = useState<PosterData[]>([]);
  const [moviePage, setMoviePage] = useState<number>(1);
  const [isMovieLoading, setIsMovieLoading] = useState<boolean>(false);
  const [hasMoreMovie, setHasMoreMovie] = useState<boolean>(true);

  // TV Shows State
  const [tvShows, setTvShows] = useState<PosterData[]>([]);
  const [tvPage, setTvPage] = useState<number>(1);
  const [isTvLoading, setIsTvLoading] = useState<boolean>(false);
  const [hasMoreTv, setHasMoreTv] = useState<boolean>(true);

  // Anime State
  const [animeList, setAnimeList] = useState<PosterData[]>([]);
  const [animePage, setAnimePage] = useState<number>(1);
  const [isAnimeLoading, setIsAnimeLoading] = useState<boolean>(false);
  const [hasMoreAnime, setHasMoreAnime] = useState<boolean>(true);

  // Search Results State
  const [searchResults, setSearchResults] = useState<PosterData[]>([]);
  const [searchPage, setSearchPage] = useState<number>(1);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const [hasMoreSearch, setHasMoreSearch] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Focus & initial load
  useEffect(() => {
    if (isOpen) {
      if (activeMode === 'movies' && catalogMovies.length === 0 && loadedMovies.length > 0) {
        setCatalogMovies(loadedMovies);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, activeMode, loadedMovies, catalogMovies.length]);

  // Lazy load TV Shows
  useEffect(() => {
    if (isOpen && activeMode === 'tv' && tvShows.length === 0 && !isTvLoading) {
      setIsTvLoading(true);
      fetchTop100TVShows()
        .then((shows) => {
          setTvShows(shows);
          setHasMoreTv(true);
          preloadPosterImages(shows.slice(0, 4));
        })
        .finally(() => setIsTvLoading(false));
    }
  }, [isOpen, activeMode, tvShows.length, isTvLoading]);

  // Lazy load Anime
  useEffect(() => {
    if (isOpen && activeMode === 'anime' && animeList.length === 0 && !isAnimeLoading) {
      setIsAnimeLoading(true);
      fetchTop100AniListAnime()
        .then((animes) => {
          setAnimeList(animes);
          setHasMoreAnime(true);
          preloadPosterImages(animes.slice(0, 4));
        })
        .finally(() => setIsAnimeLoading(false));
    }
  }, [isOpen, activeMode, animeList.length, isAnimeLoading]);

  // Available genre options
  const availableGenres = useMemo(() => {
    if (activeMode === 'movies') return MOVIE_GENRES;
    if (activeMode === 'tv') return TV_GENRES;
    return [
      { id: 16, name: 'Animation' },
      { id: 28, name: 'Action' },
      { id: 12, name: 'Adventure' },
      { id: 35, name: 'Comedy' },
      { id: 14, name: 'Fantasy' },
      { id: 878, name: 'Sci-Fi' },
      { id: 18, name: 'Drama' },
      { id: 10749, name: 'Romance' },
      { id: 27, name: 'Horror' },
      { id: 9648, name: 'Mystery' },
    ];
  }, [activeMode]);

  // Handle Mode Change (Movies, TV Shows, Anime)
  const handleCategoryModeSwitch = (mode: SearchMode) => {
    sound.playOkClick();
    onModeChange(mode);
    setQuery('');
    setSelectedGenreId('ALL');
    setIsDiscoverActive(false);
    setDiscoverResults([]);
    setSearchResults([]);
    setSearchPage(1);
    setHasMoreSearch(false);
  };

  // Perform Discover Query
  const handleDiscover = useCallback(
    async (override?: {
      genreId?: string | number;
      country?: string;
      language?: string;
      year?: string;
    }) => {
      sound.playOkClick();
      const gId = override?.genreId !== undefined ? override.genreId : selectedGenreId;
      const ctry = override?.country !== undefined ? override.country : selectedCountry;
      const lang = override?.language !== undefined ? override.language : selectedLanguage;
      const yr = override?.year !== undefined ? override.year : selectedYear;

      if ((gId === 'ALL' || !gId) && !ctry && !lang && !yr?.trim()) {
        setIsDiscoverActive(false);
        setDiscoverResults([]);
        setDiscoverPage(1);
        setHasMoreDiscover(false);
        return;
      }

      setQuery('');
      setIsDiscoverLoading(true);
      setIsDiscoverActive(true);
      setDiscoverPage(1);

      try {
        const res = await discoverTmdbMediaPaged({
          mediaType: activeMode,
          genreId: gId,
          country: ctry,
          language: lang,
          year: yr,
          page: 1,
        });
        setDiscoverResults(res.movies);
        setHasMoreDiscover(res.hasMore);
        preloadPosterImages(res.movies.slice(0, 4));
      } catch (err) {
        console.error('Discover error:', err);
        setDiscoverResults([]);
      } finally {
        setIsDiscoverLoading(false);
      }
    },
    [activeMode, selectedGenreId, selectedCountry, selectedLanguage, selectedYear]
  );

  // Reset Filters
  const handleResetFilters = () => {
    sound.playOkClick();
    setSelectedGenreId('ALL');
    setSelectedCountry('');
    setSelectedLanguage('');
    setSelectedYear('');
    setIsDiscoverActive(false);
    setDiscoverResults([]);
    setDiscoverPage(1);
    setHasMoreDiscover(false);
  };

  // Quick Genre selection
  const handleQuickGenreClick = (genreId: number | string) => {
    sound.playOkClick();
    setSelectedGenreId(genreId);
    handleDiscover({ genreId });
  };

  // Search input debouncer
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchPage(1);
      setHasMoreSearch(false);
      setIsSearchLoading(false);
      return;
    }

    setIsDiscoverActive(false);
    setIsSearchLoading(true);

    const handler = setTimeout(async () => {
      try {
        if (activeMode === 'movies') {
          const res = await searchTmdbMoviesPaged(trimmed, 1);
          setSearchResults(res.movies);
          setSearchPage(1);
          setHasMoreSearch(res.hasMore);
          preloadPosterImages(res.movies.slice(0, 4));
        } else if (activeMode === 'tv') {
          const res = await searchTmdbTVPaged(trimmed, 1);
          setSearchResults(res.movies);
          setSearchPage(1);
          setHasMoreSearch(res.hasMore);
          preloadPosterImages(res.movies.slice(0, 4));
        } else if (activeMode === 'anime') {
          const res = await searchAniListAnimePaged(trimmed, 1);
          setSearchResults(res.anime);
          setSearchPage(1);
          setHasMoreSearch(res.hasMore);
          preloadPosterImages(res.anime.slice(0, 4));
        }
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, activeMode]);

  // Infinite Scroll loader
  const loadNextPage = useCallback(async () => {
    const trimmed = query.trim();

    if (trimmed) {
      if (isSearchLoading || !hasMoreSearch) return;
      setIsSearchLoading(true);
      const nextPage = searchPage + 1;

      try {
        if (activeMode === 'movies') {
          const res = await searchTmdbMoviesPaged(trimmed, nextPage);
          if (res.movies.length > 0) {
            setSearchResults((prev) => {
              const seenIds = new Set(prev.map((m) => m.id));
              const fresh = res.movies.filter((m) => !seenIds.has(m.id));
              return [...prev, ...fresh];
            });
            setSearchPage(nextPage);
            setHasMoreSearch(res.hasMore);
          } else {
            setHasMoreSearch(false);
          }
        } else if (activeMode === 'tv') {
          const res = await searchTmdbTVPaged(trimmed, nextPage);
          if (res.movies.length > 0) {
            setSearchResults((prev) => {
              const seenIds = new Set(prev.map((m) => m.id));
              const fresh = res.movies.filter((m) => !seenIds.has(m.id));
              return [...prev, ...fresh];
            });
            setSearchPage(nextPage);
            setHasMoreSearch(res.hasMore);
          } else {
            setHasMoreSearch(false);
          }
        } else if (activeMode === 'anime') {
          const res = await searchAniListAnimePaged(trimmed, nextPage);
          if (res.anime.length > 0) {
            setSearchResults((prev) => {
              const seenIds = new Set(prev.map((m) => m.id));
              const fresh = res.anime.filter((m) => !seenIds.has(m.id));
              return [...prev, ...fresh];
            });
            setSearchPage(nextPage);
            setHasMoreSearch(res.hasMore);
          } else {
            setHasMoreSearch(false);
          }
        }
      } catch (err) {
        console.error('Failed to load next search page:', err);
      } finally {
        setIsSearchLoading(false);
      }
      return;
    }

    if (isDiscoverActive && !trimmed) {
      if (isDiscoverLoading || !hasMoreDiscover) return;
      setIsDiscoverLoading(true);
      const nextPage = discoverPage + 1;

      try {
        const res = await discoverTmdbMediaPaged({
          mediaType: activeMode,
          genreId: selectedGenreId,
          country: selectedCountry,
          language: selectedLanguage,
          year: selectedYear,
          page: nextPage,
        });

        if (res.movies.length > 0) {
          setDiscoverResults((prev) => {
            const seenIds = new Set(prev.map((m) => m.id));
            const fresh = res.movies.filter((m) => !seenIds.has(m.id));
            return [...prev, ...fresh];
          });
          setDiscoverPage(nextPage);
          setHasMoreDiscover(res.hasMore);
        } else {
          setHasMoreDiscover(false);
        }
      } catch (err) {
        console.error('Failed to load next discover page:', err);
      } finally {
        setIsDiscoverLoading(false);
      }
      return;
    }

    if (activeMode === 'movies' && !trimmed) {
      if (isMovieLoading || !hasMoreMovie) return;
      setIsMovieLoading(true);
      const nextPage = moviePage + 1;

      try {
        const catParam =
          activeCategory === 'popular'
            ? 'popular'
            : activeCategory === 'now_playing'
            ? 'now_playing'
            : activeCategory === 'top_rated'
            ? 'top_rated'
            : activeCategory === 'trending'
            ? 'trending'
            : 'all';

        const res = await fetchInfiniteCatalog(nextPage, catParam);
        if (res.movies.length > 0) {
          setCatalogMovies((prev) => {
            const seenIds = new Set(prev.map((m) => m.id));
            const fresh = res.movies.filter((m) => !seenIds.has(m.id));
            return [...prev, ...fresh];
          });
          setMoviePage(nextPage);
          setHasMoreMovie(res.hasMore);
        } else {
          setHasMoreMovie(false);
        }
      } catch (err) {
        console.error('Failed to load next movie page:', err);
      } finally {
        setIsMovieLoading(false);
      }
      return;
    }

    if (activeMode === 'tv' && !trimmed) {
      if (isTvLoading || !hasMoreTv) return;
      setIsTvLoading(true);
      const nextPage = tvPage + 1;

      try {
        const res = await fetchInfiniteTVCatalog(nextPage, 'all');
        if (res.movies.length > 0) {
          setTvShows((prev) => {
            const seenIds = new Set(prev.map((m) => m.id));
            const fresh = res.movies.filter((m) => !seenIds.has(m.id));
            return [...prev, ...fresh];
          });
          setTvPage(nextPage);
          setHasMoreTv(res.hasMore);
        } else {
          setHasMoreTv(false);
        }
      } catch (err) {
        console.error('Failed to load next tv page:', err);
      } finally {
        setIsTvLoading(false);
      }
      return;
    }

    if (activeMode === 'anime' && !trimmed) {
      if (isAnimeLoading || !hasMoreAnime) return;
      setIsAnimeLoading(true);
      const nextPage = animePage + 1;

      try {
        const res = await fetchInfiniteAniListCatalog(nextPage);
        if (res.anime.length > 0) {
          setAnimeList((prev) => {
            const seenIds = new Set(prev.map((m) => m.id));
            const fresh = res.anime.filter((m) => !seenIds.has(m.id));
            return [...prev, ...fresh];
          });
          setAnimePage(nextPage);
          setHasMoreAnime(res.hasMore);
        } else {
          setHasMoreAnime(false);
        }
      } catch (err) {
        console.error('Failed to load next anime page:', err);
      } finally {
        setIsAnimeLoading(false);
      }
      return;
    }
  }, [
    query,
    activeMode,
    isSearchLoading,
    hasMoreSearch,
    searchPage,
    isDiscoverActive,
    isDiscoverLoading,
    hasMoreDiscover,
    discoverPage,
    selectedGenreId,
    selectedCountry,
    selectedLanguage,
    selectedYear,
    isMovieLoading,
    hasMoreMovie,
    moviePage,
    activeCategory,
    isTvLoading,
    hasMoreTv,
    tvPage,
    isAnimeLoading,
    hasMoreAnime,
    animePage,
  ]);

  // Observer for Sentinel
  useEffect(() => {
    if (!isOpen) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextPage();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '350px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, activeMode, loadNextPage]);

  // Display items
  const displayItems = useMemo(() => {
    if (query.trim()) return searchResults;
    if (isDiscoverActive) return discoverResults;
    if (activeMode === 'movies') {
      return activeCategory === 'top100' ? loadedMovies : catalogMovies.length > 0 ? catalogMovies : loadedMovies;
    }
    if (activeMode === 'tv') {
      return tvShows.length > 0 ? tvShows : loadedMovies;
    }
    if (activeMode === 'anime') {
      return animeList.length > 0 ? animeList : loadedMovies;
    }
    return loadedMovies;
  }, [
    query,
    searchResults,
    isDiscoverActive,
    discoverResults,
    activeMode,
    activeCategory,
    loadedMovies,
    catalogMovies,
    tvShows,
    animeList,
  ]);

  if (!isOpen) return null;

  const handleItemPick = (item: PosterData) => {
    sound.playOkClick();
    onSelectMovie(item, activeMode);
    onClose();
  };

  const isCurrentlyLoading =
    query.trim()
      ? isSearchLoading
      : isDiscoverActive
      ? isDiscoverLoading
      : activeMode === 'movies'
      ? isMovieLoading
      : activeMode === 'tv'
      ? isTvLoading
      : isAnimeLoading;

  const hasAnyFilterActive =
    selectedGenreId !== 'ALL' ||
    Boolean(selectedCountry) ||
    Boolean(selectedLanguage) ||
    Boolean(selectedYear.trim());

  return (
    <div
      id="movie-search-popup-overlay"
      className="fixed inset-0 z-[100] w-full h-full h-[100dvh] flex flex-col bg-[#0e1118] text-slate-100 overflow-hidden transition-all duration-300 animate-fade-in"
    >
      <div
        id="movie-search-modal-container"
        className="relative w-full h-full flex flex-col overflow-hidden"
      >
        {/* Modern Clean Fullscreen Header */}
        <div className="w-full px-3 py-2.5 sm:px-6 sm:py-3.5 border-b border-white/5 flex flex-col gap-2.5 sm:gap-3 bg-slate-900/60 backdrop-blur-xl shrink-0">
          {/* Top Bar: Title & Controls */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Title & Brand */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h2 className="text-sm sm:text-base font-semibold tracking-wide text-white flex items-center gap-2 font-montserrat truncate">
                  <span>Discover & Search</span>
                </h2>
              </div>
            </div>

            {/* Segmented Mode Selector (Movies / TV / Anime) */}
            <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-white/10 shrink-0">
              <button
                id="mode-tab-movies"
                onClick={() => handleCategoryModeSwitch('movies')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeMode === 'movies'
                    ? 'bg-slate-800 text-white shadow-sm border border-white/15'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-red-400" />
                <span>Movies</span>
              </button>

              <button
                id="mode-tab-tv"
                onClick={() => handleCategoryModeSwitch('tv')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeMode === 'tv'
                    ? 'bg-slate-800 text-white shadow-sm border border-white/15'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tv className="w-3.5 h-3.5 text-cyan-400" />
                <span>TV Shows</span>
              </button>

              <button
                id="mode-tab-anime"
                onClick={() => handleCategoryModeSwitch('anime')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeMode === 'anime'
                    ? 'bg-slate-800 text-white shadow-sm border border-white/15'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Anime</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeMode === 'movies'
                  ? 'Search movies (e.g. Spider-Man, Inception, Dune, Moana, Avatar)...'
                  : activeMode === 'tv'
                  ? 'Search TV series (e.g. Breaking Bad, Arcane, Stranger Things)...'
                  : 'Search anime (e.g. Attack on Titan, Demon Slayer, Jujutsu Kaisen)...'
              }
              className="w-full bg-slate-950/70 border border-white/10 focus:border-cyan-400/50 rounded-xl pl-10 pr-24 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:ring-2 focus:ring-cyan-500/20"
            />
            <div className="absolute right-2.5 flex items-center gap-1.5">
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-slate-400 hover:text-white p-1 rounded-md"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {isCurrentlyLoading && (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              )}
              <button
                type="button"
                id="toggle-filters-btn"
                onClick={() => setShowFilters((prev) => !prev)}
                title={showFilters ? 'Hide Filters' : 'Show Filters'}
                className={`p-1.5 sm:px-2.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  showFilters
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : hasAnyFilterActive
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px] font-medium">
                  {showFilters ? 'Hide Filters' : 'Filters'}
                </span>
                {hasAnyFilterActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                )}
              </button>
            </div>
          </div>

          {/* Modern Discover & Filter Bar */}
          {showFilters && (
            <div className="p-2.5 sm:p-3.5 rounded-xl bg-slate-950/70 border border-white/10 flex flex-col gap-3 shadow-xl backdrop-blur-md">
              {/* Category Feed Tabs (Trending, All Catalog, Top 100, Popular, Top Rated) */}
              {activeMode === 'movies' ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Browse Feeds
                    </span>
                    {hasAnyFilterActive && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Filters</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDiscoverActive(false);
                        setActiveCategory('trending');
                        sound.playOkClick();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        activeCategory === 'trending' && !isDiscoverActive
                          ? 'bg-orange-500/25 text-orange-300 border border-orange-500/50 shadow-[0_0_12px_rgba(249,115,22,0.3)]'
                          : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-orange-400" /> Trending
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDiscoverActive(false);
                        setActiveCategory('all');
                        sound.playOkClick();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        activeCategory === 'all' && !isDiscoverActive
                          ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <InfinityIcon className="w-3.5 h-3.5 text-cyan-400" /> All Catalog
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDiscoverActive(false);
                        setActiveCategory('top100');
                        sound.playOkClick();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        activeCategory === 'top100' && !isDiscoverActive
                          ? 'bg-yellow-500/25 text-yellow-300 border border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.3)]'
                          : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Top 100
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDiscoverActive(false);
                        setActiveCategory('popular');
                        sound.playOkClick();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        activeCategory === 'popular' && !isDiscoverActive
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Popular
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDiscoverActive(false);
                        setActiveCategory('top_rated');
                        sound.playOkClick();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        activeCategory === 'top_rated' && !isDiscoverActive
                          ? 'bg-purple-500/25 text-purple-300 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                          : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-white/5 hover:bg-white/5'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5 text-amber-400" /> Top Rated
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium py-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {activeMode === 'tv'
                      ? 'Worldwide Popular Series'
                      : 'Top Japanese Anime Series & Movies'}
                  </span>
                </div>
              )}

              {/* Divider */}
              <div className="h-px w-full bg-white/5" />

              {/* Filter Selectors Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {/* 1. Category / Genre */}
                <div className="relative flex items-center col-span-1">
                  <Filter className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    id="discover-genre-select"
                    value={String(selectedGenreId)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedGenreId(val === 'ALL' ? 'ALL' : Number(val));
                    }}
                    className="w-full bg-slate-900 border border-white/10 focus:border-cyan-400/50 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-200 outline-none cursor-pointer appearance-none"
                  >
                    <option value="ALL">All Genres</option>
                    {availableGenres.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name === 'Animation' ? '✨ Animation' : g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Country */}
                <div className="relative flex items-center col-span-1">
                  <Globe className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    id="discover-country-select"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 focus:border-cyan-400/50 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-200 outline-none cursor-pointer appearance-none"
                  >
                    {POPULAR_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Language */}
                <div className="relative flex items-center col-span-1">
                  <Languages className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <select
                    id="discover-language-select"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 focus:border-cyan-400/50 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-200 outline-none cursor-pointer appearance-none"
                  >
                    {POPULAR_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Release Year */}
                <div className="relative flex items-center col-span-1">
                  <Calendar className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    id="discover-year-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value.replace(/[^0-9]/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleDiscover();
                    }}
                    placeholder="Year (e.g. 2024)"
                    className="w-full bg-slate-900 border border-white/10 focus:border-cyan-400/50 rounded-lg pl-7 pr-2 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none"
                  />
                </div>

                {/* 5. Action Buttons (Discover & Reset) */}
                <div className="flex items-center gap-1.5 col-span-2 sm:col-span-4 md:col-span-1">
                  <button
                    id="discover-submit-btn"
                    type="button"
                    onClick={() => handleDiscover()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>Discover</span>
                  </button>

                  {hasAnyFilterActive && (
                    <button
                      id="discover-reset-btn"
                      type="button"
                      onClick={handleResetFilters}
                      title="Reset filters"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Category Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                <span className="text-[11px] text-slate-400 font-medium shrink-0 mr-1 flex items-center gap-1">
                  <Sparkle className="w-3 h-3 text-cyan-400" /> Quick Genres:
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickGenreClick('ALL')}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                    selectedGenreId === 'ALL' && !isDiscoverActive
                      ? 'bg-slate-200 text-slate-950 font-semibold'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  All
                </button>
                {availableGenres.map((genre) => {
                  const isSelected = selectedGenreId === genre.id;
                  const isAnimation = genre.name === 'Animation';
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => handleQuickGenreClick(genre.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm'
                          : isAnimation
                          ? 'bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 border border-pink-500/20'
                          : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-white/5'
                      }`}
                    >
                      {isAnimation && <Sparkles className="w-2.5 h-2.5 text-pink-300" />}
                      <span>{genre.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search / Filter Status Bar (Only shown if active filter or search query is present) */}
          {(isDiscoverActive || query.trim()) && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
              {isDiscoverActive ? (
                <div className="flex items-center gap-2 text-cyan-300 font-medium">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Filtered Results ({displayItems.length} found)</span>
                  {selectedYear && (
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[10px]">
                      Year: {selectedYear}
                    </span>
                  )}
                  {selectedCountry && (
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[10px]">
                      {selectedCountry}
                    </span>
                  )}
                </div>
              ) : query.trim() ? (
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Search className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Results for "{query}"</span>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Scrollable Results Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-5 custom-scrollbar"
        >
          {displayItems.length === 0 && !isCurrentlyLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Compass className="w-10 h-10 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300">
                {query.trim()
                  ? `No titles found for "${query}"`
                  : isDiscoverActive
                  ? 'No titles found matching this filter'
                  : 'No titles available in this category'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Try selecting different genres, year, or language parameters.
              </p>
              {hasAnyFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-2.5 sm:gap-3.5 lg:gap-4">
              {displayItems.map((item, idx) => {
                const isCurrent =
                  item.id === currentMovieId ||
                  (item.tmdbId && item.tmdbId === Number(currentMovieId?.replace(/^(tmdb-|tv-|anime-)/, '')));

                return (
                  <div
                    key={`${item.id}-${idx}`}
                    onClick={() => handleItemPick(item)}
                    className={`group relative flex flex-col rounded-xl overflow-hidden bg-slate-900/60 border transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-xl ${
                      isCurrent
                        ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                        : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    {/* Poster Image */}
                    <div className="relative aspect-[2/3] w-full bg-slate-950 overflow-hidden">
                      <img
                        src={item.heroImageUrl || item.bgImageUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Top Right Rating Badge */}
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-slate-950/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-medium text-amber-300 border border-white/10">
                        <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                        <span>{item.voteAverage || '8.0'}</span>
                      </div>

                      {/* Top Left Format / Year Badge */}
                      <div className="absolute top-1.5 left-1.5 bg-slate-950/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-300 border border-white/10 flex items-center gap-1">
                        {item.mediaType === 'tv' && <Tv className="w-2.5 h-2.5 text-cyan-400" />}
                        {item.mediaType === 'anime' && <Sparkles className="w-2.5 h-2.5 text-pink-400" />}
                        <span>{item.year}</span>
                      </div>

                      {/* Play Hover Overlay */}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg transform scale-80 group-hover:scale-100 transition-transform">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>

                      {/* Active Indicator */}
                      {isCurrent && (
                        <div className="absolute inset-0 bg-cyan-950/30 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="flex items-center gap-1 bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase shadow-md">
                            <CheckCircle2 className="w-3 h-3" /> Selected
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Title & Subtitle */}
                    <div className="p-2 sm:p-2.5 flex flex-col flex-1 justify-between bg-slate-900/90">
                      <h3 className="font-semibold text-xs text-slate-100 group-hover:text-cyan-300 line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.genres.slice(0, 2).join(' • ')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sentinel for Infinite Scroll */}
          <div ref={sentinelRef} className="w-full py-6 flex items-center justify-center">
            {isCurrentlyLoading && (
              <div className="flex items-center gap-2 text-xs text-cyan-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading more titles...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
