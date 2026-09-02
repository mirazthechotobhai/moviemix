import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  Film,
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
} from 'lucide-react';
import { PosterData } from '../types';
import { fetchInfiniteCatalog, searchTmdbMoviesPaged, preloadPosterImages } from '../services/tmdb';
import { sound } from '../utils/audio';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovie: (movie: PosterData) => void;
  loadedMovies: PosterData[];
  currentMovieId?: string;
}

type StreamCategory = 'all' | 'top100' | 'trending' | 'popular' | 'now_playing' | 'top_rated';

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectMovie,
  loadedMovies,
  currentMovieId,
}) => {
  const [query, setQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<StreamCategory>('all');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');

  // Infinite Scroll State for Catalog Exploration
  const [catalogMovies, setCatalogMovies] = useState<PosterData[]>([]);
  const [catalogPage, setCatalogPage] = useState<number>(1);
  const [isCatalogLoading, setIsCatalogLoading] = useState<boolean>(false);
  const [hasMoreCatalog, setHasMoreCatalog] = useState<boolean>(true);

  // Infinite Scroll State for Search Query Results
  const [searchResults, setSearchResults] = useState<PosterData[]>([]);
  const [searchPage, setSearchPage] = useState<number>(1);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const [hasMoreSearch, setHasMoreSearch] = useState<boolean>(false);
  const [totalSearchResults, setTotalSearchResults] = useState<number>(0);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Initialize catalog with loaded movies on initial open
  useEffect(() => {
    if (isOpen) {
      if (catalogMovies.length === 0 && loadedMovies.length > 0) {
        setCatalogMovies(loadedMovies);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
    }
  }, [isOpen, loadedMovies]);

  // Load next catalog page function
  const loadNextCatalogPage = useCallback(
    async (pageToLoad: number, category: StreamCategory) => {
      if (isCatalogLoading || !hasMoreCatalog) return;
      setIsCatalogLoading(true);

      try {
        const catParam =
          category === 'popular'
            ? 'popular'
            : category === 'now_playing'
            ? 'now_playing'
            : category === 'top_rated'
            ? 'top_rated'
            : category === 'trending'
            ? 'trending'
            : 'all';

        const res = await fetchInfiniteCatalog(pageToLoad, catParam);
        if (res.movies.length > 0) {
          setCatalogMovies((prev) => {
            const seenIds = new Set(prev.map((m) => m.tmdbId || m.id));
            const fresh = res.movies.filter((m) => !seenIds.has(m.tmdbId || m.id));
            return [...prev, ...fresh];
          });
          preloadPosterImages(res.movies.slice(0, 4));
          setCatalogPage(pageToLoad);
          setHasMoreCatalog(res.hasMore);
        } else {
          setHasMoreCatalog(false);
        }
      } catch (err) {
        console.error('Failed to load next catalog page:', err);
      } finally {
        setIsCatalogLoading(false);
      }
    },
    [isCatalogLoading, hasMoreCatalog]
  );

  // Reset catalog when changing category
  const handleCategoryChange = (cat: StreamCategory) => {
    setActiveCategory(cat);
    sound.playOkClick();

    if (cat === 'top100') {
      return;
    }

    setCatalogMovies([]);
    setCatalogPage(1);
    setHasMoreCatalog(true);
    setIsCatalogLoading(true);

    const catParam =
      cat === 'popular'
        ? 'popular'
        : cat === 'now_playing'
        ? 'now_playing'
        : cat === 'top_rated'
        ? 'top_rated'
        : cat === 'trending'
        ? 'trending'
        : 'all';

    fetchInfiniteCatalog(1, catParam)
      .then((res) => {
        setCatalogMovies(res.movies);
        setHasMoreCatalog(res.hasMore);
        preloadPosterImages(res.movies.slice(0, 4));
      })
      .catch((err) => {
        console.error('Error fetching initial category page:', err);
      })
      .finally(() => {
        setIsCatalogLoading(false);
      });
  };

  // Live TMDB debounced search with page 1 reset
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
        const res = await searchTmdbMoviesPaged(trimmed, 1);
        setSearchResults(res.movies);
        setSearchPage(1);
        setHasMoreSearch(res.hasMore);
        setTotalSearchResults(res.totalPages * 20);
        preloadPosterImages(res.movies.slice(0, 4));
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearchLoading(false);
      }
    }, 320);

    return () => clearTimeout(handler);
  }, [query]);

  // Load next search page function
  const loadNextSearchPage = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || isSearchLoading || !hasMoreSearch) return;

    setIsSearchLoading(true);
    const nextPage = searchPage + 1;

    try {
      const res = await searchTmdbMoviesPaged(trimmed, nextPage);
      if (res.movies.length > 0) {
        setSearchResults((prev) => {
          const seenIds = new Set(prev.map((m) => m.tmdbId || m.id));
          const fresh = res.movies.filter((m) => !seenIds.has(m.tmdbId || m.id));
          return [...prev, ...fresh];
        });
        setSearchPage(nextPage);
        setHasMoreSearch(res.hasMore);
        preloadPosterImages(res.movies.slice(0, 4));
      } else {
        setHasMoreSearch(false);
      }
    } catch (err) {
      console.error('Failed to load next search page:', err);
    } finally {
      setIsSearchLoading(false);
    }
  }, [query, isSearchLoading, hasMoreSearch, searchPage]);

  // IntersectionObserver for Infinite Scrolling Trigger
  useEffect(() => {
    if (!isOpen) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          if (query.trim()) {
            if (hasMoreSearch && !isSearchLoading) {
              loadNextSearchPage();
            }
          } else if (activeCategory !== 'top100') {
            if (hasMoreCatalog && !isCatalogLoading) {
              loadNextCatalogPage(catalogPage + 1, activeCategory);
            }
          }
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '400px', // Pre-fetch before user hits the bottom
        threshold: 0.1,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    isOpen,
    query,
    activeCategory,
    hasMoreCatalog,
    isCatalogLoading,
    catalogPage,
    hasMoreSearch,
    isSearchLoading,
    loadNextCatalogPage,
    loadNextSearchPage,
  ]);

  // Extract distinct genres from displayed items
  const genres = useMemo(() => {
    const list = query.trim() ? searchResults : activeCategory === 'top100' ? loadedMovies : catalogMovies;
    const set = new Set<string>();
    list.forEach((m) => m.genres.forEach((g) => set.add(g)));
    return ['ALL', ...Array.from(set).slice(0, 10)];
  }, [query, searchResults, activeCategory, loadedMovies, catalogMovies]);

  // Filter items based on active tab and genre
  const displayMovies = useMemo(() => {
    let list: PosterData[] = [];
    if (query.trim()) {
      list = searchResults;
    } else if (activeCategory === 'top100') {
      list = loadedMovies;
    } else {
      list = catalogMovies.length > 0 ? catalogMovies : loadedMovies;
    }

    if (selectedGenre !== 'ALL') {
      list = list.filter((m) => m.genres.includes(selectedGenre));
    }
    return list;
  }, [query, searchResults, activeCategory, loadedMovies, catalogMovies, selectedGenre]);

  if (!isOpen) return null;

  const handleMoviePick = (movie: PosterData) => {
    sound.playOkClick();
    onSelectMovie(movie);
    onClose();
  };

  const isCurrentlyLoading = query.trim() ? isSearchLoading : isCatalogLoading;
  const canLoadMore = query.trim() ? hasMoreSearch : activeCategory !== 'top100' && hasMoreCatalog;

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
        {/* Header with Search Bar */}
        <div className="p-3.5 sm:p-5 border-b border-white/10 flex flex-col gap-3 bg-white/[0.02]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600/30 to-amber-600/30 border border-red-500/40 flex items-center justify-center text-red-400">
                <Clapperboard className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black tracking-wider uppercase font-montserrat text-neutral-100">
                    CINEMA EXPLORER & GLOBAL SEARCH
                  </h2>
                  <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-black tracking-wider uppercase">
                    <InfinityIcon className="w-3 h-3" /> INFINITE FEED
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-neutral-400 tracking-wider font-montserrat">
                  Scroll endlessly through worldwide catalog or search any movie across the globe
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

          {/* Search Input Box */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedGenre('ALL');
              }}
              placeholder="Search any movie worldwide (e.g. Inception, Avatar, Dune, Titanic, Interstellar, Spider-Man)..."
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
            {isSearchLoading && (
              <div className="absolute right-3.5">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Navigation Category Tabs & Genre Filter Chips */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            {!query.trim() ? (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-montserrat flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === 'all'
                      ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.5)]'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  <InfinityIcon className="w-3.5 h-3.5" />
                  Infinite Discovery
                </button>

                <button
                  onClick={() => handleCategoryChange('top100')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-montserrat flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === 'top100'
                      ? 'bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  Top 100 Carousel ({loadedMovies.length})
                </button>

                <button
                  onClick={() => handleCategoryChange('trending')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-montserrat flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === 'trending'
                      ? 'bg-orange-600 text-white shadow-[0_0_12px_rgba(234,88,12,0.5)]'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  <Flame className="w-3 h-3" />
                  Trending
                </button>

                <button
                  onClick={() => handleCategoryChange('popular')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-montserrat flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === 'popular'
                      ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.5)]'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  Popular
                </button>

                <button
                  onClick={() => handleCategoryChange('top_rated')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold font-montserrat flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === 'top_rated'
                      ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  <Award className="w-3 h-3" />
                  Top Rated
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-montserrat text-cyan-300 font-bold">
                <Search className="w-3.5 h-3.5" />
                Worldwide TMDB Results for "{query}" ({searchResults.length} loaded)
              </div>
            )}

            {/* Genre Filter Pills */}
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
          </div>
        </div>

        {/* Scrollable Results Area with Infinite Scrolling */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-3.5 sm:p-5 custom-scrollbar min-h-[340px]"
        >
          {displayMovies.length === 0 && !isCurrentlyLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Compass className="w-12 h-12 text-neutral-600 mb-3" />
              <p className="text-sm font-bold text-neutral-300 uppercase tracking-wider font-montserrat">
                {query.trim() ? 'No movies found on TMDB' : 'No cinema posters found'}
              </p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                {query.trim()
                  ? 'Try checking the spelling or searching for another title.'
                  : 'Try selecting another category or resetting filters.'}
              </p>
              {selectedGenre !== 'ALL' && (
                <button
                  onClick={() => setSelectedGenre('ALL')}
                  className="mt-3 text-xs text-cyan-400 hover:underline cursor-pointer"
                >
                  Reset Genre Filter
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Movies Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {displayMovies.map((movie, idx) => {
                  const isCurrent =
                    movie.id === currentMovieId ||
                    (movie.tmdbId && movie.tmdbId === Number(currentMovieId?.replace('tmdb-', '')));

                  return (
                    <div
                      key={`${movie.id}-${idx}`}
                      onClick={() => handleMoviePick(movie)}
                      className={`group relative flex flex-col rounded-xl overflow-hidden bg-neutral-900/70 border transition-all duration-200 cursor-pointer hover:scale-[1.03] active:scale-95 ${
                        isCurrent
                          ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_24px_rgba(6,182,212,0.45)]'
                          : 'border-white/10 hover:border-white/40 hover:shadow-[0_10px_30px_rgba(0,0,0,0.85)]'
                      }`}
                    >
                      {/* Poster Image */}
                      <div className="relative aspect-[2/3] w-full bg-neutral-950 overflow-hidden">
                        <img
                          src={movie.heroImageUrl || movie.bgImageUrl}
                          alt={movie.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Top Rating */}
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-yellow-400 border border-yellow-500/30">
                          <Star className="w-2.5 h-2.5 fill-yellow-400" />
                          <span>{movie.voteAverage || '8.0'}</span>
                        </div>

                        {/* Release Year */}
                        <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-neutral-300 border border-white/10">
                          {movie.year}
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
                          {movie.title}
                        </h3>
                        <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                          {movie.genres.slice(0, 2).join(' • ')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

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
                        Fetching more movies from TMDB worldwide catalog...
                      </span>
                    </div>
                  </div>
                ) : canLoadMore ? (
                  <div className="flex items-center gap-2 text-xs font-montserrat text-neutral-500 font-bold uppercase tracking-wider">
                    <InfinityIcon className="w-4 h-4 text-neutral-600 animate-pulse" />
                    <span>Scroll down for more cinema posters</span>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-500 font-montserrat">
                    {displayMovies.length > 0 ? '✓ End of loaded catalog' : ''}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-black/90 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400 font-montserrat">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-neutral-300 font-semibold">
              Live Stream ({displayMovies.length} movies loaded)
            </span>
          </div>
          <div className="flex items-center gap-3 text-neutral-400">
            <span>Click any movie to project IMAX poster</span>
            <span className="hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Esc</kbd> to close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
