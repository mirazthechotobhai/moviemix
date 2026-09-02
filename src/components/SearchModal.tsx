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
  Clapperboard,
  Flame,
  Infinity as InfinityIcon,
  TrendingUp,
  Award,
  Play,
} from 'lucide-react';
import { PosterData } from '../types';
import {
  fetchInfiniteCatalog,
  searchTmdbMoviesPaged,
  fetchInfiniteTVCatalog,
  searchTmdbTVPaged,
  fetchTop100TVShows,
  preloadPosterImages,
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
  onPlayDirectly,
  activeMode,
  onModeChange,
  loadedMovies,
  currentMovieId,
}) => {
  const [query, setQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<StreamCategory>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');

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

  // Sync loaded items into current catalog when opened
  useEffect(() => {
    if (isOpen) {
      if (activeMode === 'movies' && catalogMovies.length === 0 && loadedMovies.length > 0) {
        setCatalogMovies(loadedMovies);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
    }
  }, [isOpen, activeMode, loadedMovies, catalogMovies.length]);

  // Lazy load TV Shows when TV mode is active
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

  // Lazy load Anime when Anime mode is active
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

  // Mode change handler (Movies, TV, Anime)
  const handleCategoryModeSwitch = (mode: SearchMode) => {
    sound.playOkClick();
    onModeChange(mode);
    setQuery('');
    setSelectedGenre('ALL');
    setSearchResults([]);
    setSearchPage(1);
    setHasMoreSearch(false);
  };

  // Search input debouncer depending on activeMode
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearchPage(1);
      setHasMoreSearch(false);
      setIsSearchLoading(false);
      return;
    }

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
    }, 320);

    return () => clearTimeout(handler);
  }, [query, activeMode]);

  // Infinite Scroll page loaders for each mode
  const loadNextPage = useCallback(async () => {
    const trimmed = query.trim();

    // 1. Search pagination
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
            preloadPosterImages(res.movies.slice(0, 4));
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
            preloadPosterImages(res.movies.slice(0, 4));
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
            preloadPosterImages(res.anime.slice(0, 4));
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

    // 2. Movies Catalog pagination
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
          preloadPosterImages(res.movies.slice(0, 4));
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

    // 3. TV Shows Catalog pagination
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
          preloadPosterImages(res.movies.slice(0, 4));
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

    // 4. Anime Catalog pagination (AniList GraphQL API)
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
          preloadPosterImages(res.anime.slice(0, 4));
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

  // IntersectionObserver for Infinite Scrolling Trigger
  useEffect(() => {
    if (!isOpen) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          loadNextPage();
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '400px',
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isOpen, activeMode, loadNextPage]);

  // Available genres for the current mode
  const genres = useMemo(() => {
    let list: PosterData[] = [];
    if (query.trim()) {
      list = searchResults;
    } else if (activeMode === 'movies') {
      list = activeCategory === 'top100' ? loadedMovies : catalogMovies.length > 0 ? catalogMovies : loadedMovies;
    } else if (activeMode === 'tv') {
      list = tvShows.length > 0 ? tvShows : loadedMovies;
    } else if (activeMode === 'anime') {
      list = animeList.length > 0 ? animeList : loadedMovies;
    }

    const set = new Set<string>();
    list.forEach((m) => m.genres.forEach((g) => set.add(g)));
    return ['ALL', ...Array.from(set).slice(0, 10)];
  }, [activeMode, query, searchResults, activeCategory, loadedMovies, catalogMovies, tvShows, animeList]);

  // Filtered list of items for Movies / TV / Anime
  const displayItems = useMemo(() => {
    let list: PosterData[] = [];
    if (query.trim()) {
      list = searchResults;
    } else if (activeMode === 'movies') {
      list = activeCategory === 'top100' ? loadedMovies : catalogMovies.length > 0 ? catalogMovies : loadedMovies;
    } else if (activeMode === 'tv') {
      list = tvShows.length > 0 ? tvShows : loadedMovies;
    } else if (activeMode === 'anime') {
      list = animeList.length > 0 ? animeList : loadedMovies;
    }

    if (selectedGenre !== 'ALL') {
      list = list.filter((m) => m.genres.includes(selectedGenre));
    }
    return list;
  }, [activeMode, query, searchResults, activeCategory, loadedMovies, catalogMovies, tvShows, animeList, selectedGenre]);

  if (!isOpen) return null;

  // Item selection & Projection to Home Page
  const handleItemPick = (item: PosterData) => {
    sound.playOkClick();
    onSelectMovie(item, activeMode);
    onClose();
  };

  const isCurrentlyLoading =
    query.trim()
      ? isSearchLoading
      : activeMode === 'movies'
      ? isMovieLoading
      : activeMode === 'tv'
      ? isTvLoading
      : isAnimeLoading;

  return (
    <div
      id="movie-search-popup-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in"
      onClick={onClose}
    >
      <div
        id="movie-search-modal-container"
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0b0c10]/95 border border-white/15 rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-hidden text-white screenshot-exclude"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with 3 Category Mode Buttons and Search Input */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 flex flex-col gap-3 bg-white/[0.02]">
          {/* Top Title & Close Button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600/30 to-amber-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
                <Clapperboard className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black tracking-wider uppercase font-montserrat text-neutral-100">
                    ENTERTAINMENT HUB & CATEGORY SWITCHER
                  </h2>
                </div>
                <p className="text-[10px] sm:text-xs text-neutral-400 tracking-wider font-montserrat">
                  Select a category to switch the entire Home Page showcase & Top 100 catalog
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3 MAIN CATEGORY BUTTONS: Movies (default), TV Shows, Anime */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* 1. MOVIES BUTTON */}
            <button
              id="mode-tab-movies"
              onClick={() => handleCategoryModeSwitch('movies')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-montserrat text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                activeMode === 'movies'
                  ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-[0_0_16px_rgba(239,68,68,0.5)] border border-red-400/50'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Movies</span>
            </button>

            {/* 2. TV SHOWS BUTTON */}
            <button
              id="mode-tab-tv"
              onClick={() => handleCategoryModeSwitch('tv')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-montserrat text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                activeMode === 'tv'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_16px_rgba(6,182,212,0.5)] border border-cyan-400/50'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>TV Shows</span>
            </button>

            {/* 3. ANIME BUTTON */}
            <button
              id="mode-tab-anime"
              onClick={() => handleCategoryModeSwitch('anime')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-montserrat text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                activeMode === 'anime'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-[0_0_16px_rgba(236,72,153,0.5)] border border-pink-400/50'
                  : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Anime</span>
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative flex items-center mt-1">
            <Search className="absolute left-3.5 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedGenre('ALL');
              }}
              placeholder={
                activeMode === 'movies'
                  ? 'Search movies (e.g. Inception, Avatar, Dune, Titanic, Interstellar)...'
                  : activeMode === 'tv'
                  ? 'Search TV series (e.g. Breaking Bad, Stranger Things, Game of Thrones, Loki)...'
                  : 'Search anime (e.g. Attack on Titan, Demon Slayer, Jujutsu Kaisen, Naruto, One Piece)...'
              }
              className="w-full bg-black/70 border border-white/20 focus:border-cyan-400 rounded-xl pl-10 pr-24 py-2.5 sm:py-3 text-xs sm:text-sm font-medium placeholder-neutral-500 text-white outline-none transition-all shadow-inner focus:ring-1 focus:ring-cyan-400/50"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setSelectedGenre('ALL');
                }}
                className="absolute right-10 text-neutral-400 hover:text-white p-1"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {isCurrentlyLoading && (
              <div className="absolute right-3.5">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Secondary Sub-filters & Genre Chips */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            {activeMode === 'movies' && !query.trim() ? (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    sound.playOkClick();
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-montserrat flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === 'all'
                      ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  <InfinityIcon className="w-3.5 h-3.5" /> Infinite Discovery
                </button>
                <button
                  onClick={() => {
                    setActiveCategory('top100');
                    sound.playOkClick();
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-montserrat flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === 'top100'
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  <Sparkles className="w-3 h-3" /> Top 100 ({loadedMovies.length})
                </button>
                <button
                  onClick={() => {
                    setActiveCategory('trending');
                    sound.playOkClick();
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-montserrat flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === 'trending'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  <Flame className="w-3 h-3" /> Trending
                </button>
                <button
                  onClick={() => {
                    setActiveCategory('popular');
                    sound.playOkClick();
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-montserrat flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === 'popular'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" /> Popular
                </button>
                <button
                  onClick={() => {
                    setActiveCategory('top_rated');
                    sound.playOkClick();
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-montserrat flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === 'top_rated'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  <Award className="w-3 h-3" /> Top Rated
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-montserrat text-cyan-300 font-bold">
                {query.trim() ? (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Search results for "{query}"</span>
                  </>
                ) : (
                  <>
                    <InfinityIcon className="w-3.5 h-3.5" />
                    <span>
                      {activeMode === 'tv'
                        ? 'Top 100 TV Series Catalog'
                        : 'Top 100 Japanese Anime Catalog'}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Genre Pills for Movies/TV/Anime */}
            {genres.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-montserrat tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap ${
                      selectedGenre === genre
                        ? 'bg-white text-black font-black shadow-md'
                        : 'bg-white/5 hover:bg-white/15 text-neutral-400 hover:text-neutral-200 border border-white/5'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Results Area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-3.5 sm:p-5 custom-scrollbar min-h-[340px]"
        >
          {/* MOVIES / TV / ANIME POSTERS GRID */}
          <div>
            {displayItems.length === 0 && !isCurrentlyLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Compass className="w-12 h-12 text-neutral-600 mb-3" />
                <p className="text-sm font-bold text-neutral-300 uppercase tracking-wider font-montserrat">
                  {query.trim() ? `No results found for "${query}"` : 'No titles found in this category'}
                </p>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                  Try checking the spelling or selecting another category/genre filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {displayItems.map((item, idx) => {
                  const isCurrent =
                    item.id === currentMovieId ||
                    (item.tmdbId && item.tmdbId === Number(currentMovieId?.replace(/^(tmdb-|tv-|anime-)/, '')));

                  return (
                    <div
                      key={`${item.id}-${idx}`}
                      onClick={() => handleItemPick(item)}
                      className={`group relative flex flex-col rounded-xl overflow-hidden bg-neutral-900/70 border transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-95 ${
                        isCurrent
                          ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_24px_rgba(6,182,212,0.45)]'
                          : 'border-white/10 hover:border-white/40 hover:shadow-[0_10px_30px_rgba(0,0,0,0.85)]'
                      }`}
                    >
                      {/* Poster Image */}
                      <div className="relative aspect-[2/3] w-full bg-neutral-950 overflow-hidden">
                        <img
                          src={item.heroImageUrl || item.bgImageUrl}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Top Rating */}
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-yellow-400 border border-yellow-500/30">
                          <Star className="w-2.5 h-2.5 fill-yellow-400" />
                          <span>{item.voteAverage || '8.0'}</span>
                        </div>

                        {/* Release Year / Badge */}
                        <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-neutral-300 border border-white/10 flex items-center gap-1">
                          {item.mediaType === 'tv' && <Tv className="w-2.5 h-2.5 text-cyan-400" />}
                          {item.mediaType === 'anime' && <Sparkles className="w-2.5 h-2.5 text-pink-400" />}
                          <span>{item.year}</span>
                        </div>

                        {/* Play overlay on hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>
                        </div>

                        {/* Active Selection Overlay */}
                        {isCurrent && (
                          <div className="absolute inset-0 bg-cyan-950/40 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="flex items-center gap-1 bg-cyan-500 text-black px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase shadow-lg">
                              <CheckCircle2 className="w-3 h-3" /> ACTIVE
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Metadata */}
                      <div className="p-2 sm:p-2.5 flex flex-col flex-1 justify-between bg-black/60">
                        <h3 className="font-montserrat font-black text-xs text-neutral-100 group-hover:text-cyan-300 line-clamp-1 uppercase tracking-tight">
                          {item.title}
                        </h3>
                        <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                          {item.genres.slice(0, 2).join(' • ')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Infinite Scroll Sentinel & Infinity Loader */}
            <div ref={sentinelRef} className="w-full py-8 flex flex-col items-center justify-center">
              {isCurrentlyLoading ? (
                <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md">
                  <div className="relative flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin"></div>
                    <InfinityIcon className="w-4 h-4 text-cyan-300 absolute animate-pulse" />
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className="text-xs font-black tracking-widest uppercase font-montserrat text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> INFINITY LOADER
                    </span>
                    <span className="text-[11px] text-neutral-400 font-montserrat mt-0.5">
                      Loading more titles from worldwide catalog...
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-neutral-500 font-montserrat flex items-center gap-1.5">
                  <InfinityIcon className="w-4 h-4 text-neutral-600 animate-pulse" />
                  <span>Scroll down for more catalog entries</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-black/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400 font-montserrat">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-neutral-300 font-semibold">
              {activeMode.toUpperCase()} STREAM ({displayItems.length} titles loaded)
            </span>
          </div>
          <div className="flex items-center gap-3 text-neutral-400">
            <span>Click any title to project poster on Home Screen</span>
            <span className="hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Esc</kbd> to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
