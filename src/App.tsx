import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Film,
  Tv,
  Sparkles,
  Loader2,
  RefreshCw,
  Check,
  Camera,
  ChevronLeft,
  ChevronRight,
  Search,
  Play,
  Flame,
} from 'lucide-react';
import { PosterData, WebShot, ParallaxState } from './types';
import { PosterLayers } from './components/PosterLayers';
import { SpiderWebCanvas } from './components/SpiderWebCanvas';
import { SearchModal, SearchMode } from './components/SearchModal';
import { MoviePlayerModal } from './components/MoviePlayerModal';
import { sound } from './utils/audio';
import {
  fetchTop100Movies,
  fetchTop100TVShows,
  fetchTrendingMoviesPage,
  fetchOlderMoviesPage,
  fetchOlderTVShowsPage,
  fetchInfiniteTVCatalog,
  preloadPosterImages,
  fetchMovieDetails,
} from './services/tmdb';
import {
  fetchTop100AniListAnime,
  fetchInfiniteAniListCatalog,
  fetchOlderAniListAnimePage,
} from './services/anilist';
import { FALLBACK_POSTERS } from './data/fallbackPosters';
import { capturePosterScreenshot, triggerDownload } from './utils/screenshot';

export default function App() {
  // Active Media Category: 'movies' | 'tv' | 'anime'
  const [activeMediaType, setActiveMediaType] = useState<SearchMode>('movies');

  // Separate catalogs for Movies, TV Shows, and Anime
  const [moviesCatalog, setMoviesCatalog] = useState<PosterData[]>(FALLBACK_POSTERS);
  const [tvCatalog, setTvCatalog] = useState<PosterData[]>([]);
  const [animeCatalog, setAnimeCatalog] = useState<PosterData[]>([]);

  // Current selected index for each category
  const [movieIndex, setMovieIndex] = useState<number>(0);
  const [tvIndex, setTvIndex] = useState<number>(0);
  const [animeIndex, setAnimeIndex] = useState<number>(0);

  // Pagination pages
  const [moviePage, setMoviePage] = useState<number>(1);
  const [tvPage, setTvPage] = useState<number>(1);
  const [animePage, setAnimePage] = useState<number>(1);

  // Separate pages for Next (forward) and Prev (older classic titles)
  const [oldMoviePage, setOldMoviePage] = useState<number>(1);
  const [oldTvPage, setOldTvPage] = useState<number>(1);
  const [oldAnimePage, setOldAnimePage] = useState<number>(1);

  // Loading states
  const [isLoadingCategory, setIsLoadingCategory] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState<boolean>(false);

  // FX & UI states
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSpideySense, setShowSpideySense] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [showFlash, setShowFlash] = useState<boolean>(false);
  const [screenshotToast, setScreenshotToast] = useState<string | null>(null);
  const [isOkPressed, setIsOkPressed] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);

  // Current active catalog based on activeMediaType
  const activeCatalog = useMemo(() => {
    if (activeMediaType === 'tv') {
      return tvCatalog.length > 0 ? tvCatalog : moviesCatalog;
    }
    if (activeMediaType === 'anime') {
      return animeCatalog.length > 0 ? animeCatalog : moviesCatalog;
    }
    return moviesCatalog;
  }, [activeMediaType, tvCatalog, animeCatalog, moviesCatalog]);

  // Current index in active catalog
  const currentIndex =
    activeMediaType === 'tv' ? tvIndex : activeMediaType === 'anime' ? animeIndex : movieIndex;

  const setCurrentIndex = useCallback(
    (indexOrUpdater: number | ((prev: number) => number)) => {
      if (activeMediaType === 'tv') {
        setTvIndex(indexOrUpdater);
      } else if (activeMediaType === 'anime') {
        setAnimeIndex(indexOrUpdater);
      } else {
        setMovieIndex(indexOrUpdater);
      }
    },
    [activeMediaType]
  );

  // 1. Initial Load: Fetch Top 100 Movies on mount
  useEffect(() => {
    let isMounted = true;
    async function loadInitial100Movies() {
      try {
        const top100 = await fetchTop100Movies();
        if (isMounted && top100.length > 0) {
          setMoviesCatalog(top100);
        }
      } catch (err) {
        console.warn('Using fallback movies:', err);
      }
    }
    loadInitial100Movies();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load Top 100 TV Shows whenever switched to 'tv' if not yet loaded
  useEffect(() => {
    if (activeMediaType === 'tv' && tvCatalog.length === 0 && !isLoadingCategory) {
      setIsLoadingCategory(true);
      fetchTop100TVShows()
        .then((top100TV) => {
          if (top100TV.length > 0) {
            setTvCatalog(top100TV);
            preloadPosterImages(top100TV.slice(0, 5));
          }
        })
        .catch((err) => console.error('Error loading top 100 TV:', err))
        .finally(() => setIsLoadingCategory(false));
    }
  }, [activeMediaType, tvCatalog.length, isLoadingCategory]);

  // 3. Load Top 100 Anime from AniList API whenever switched to 'anime' if not yet loaded
  useEffect(() => {
    if (activeMediaType === 'anime' && animeCatalog.length === 0 && !isLoadingCategory) {
      setIsLoadingCategory(true);
      fetchTop100AniListAnime()
        .then((top100Anime) => {
          if (top100Anime.length > 0) {
            setAnimeCatalog(top100Anime);
            preloadPosterImages(top100Anime.slice(0, 5));
          }
        })
        .catch((err) => console.error('Error loading top 100 Anime from AniList:', err))
        .finally(() => setIsLoadingCategory(false));
    }
  }, [activeMediaType, animeCatalog.length, isLoadingCategory]);

  // Handle Switch Category Mode (Movies, TV Shows, Anime)
  const handleCategorySwitch = useCallback(
    (mode: SearchMode) => {
      if (mode === activeMediaType) return;
      sound.playOkClick();
      setIsShaking(true);
      setActiveMediaType(mode);

      // Preload current target poster in new category
      const targetList =
        mode === 'tv' ? tvCatalog : mode === 'anime' ? animeCatalog : moviesCatalog;
      if (targetList.length > 0) {
        preloadPosterImages([targetList[0]]);
      }

      setTimeout(() => {
        setIsShaking(false);
      }, 450);
    },
    [activeMediaType, tvCatalog, animeCatalog, moviesCatalog]
  );

  // Enrich current poster with deep credits if movie details are generic
  useEffect(() => {
    const activeMovie = activeCatalog[currentIndex];
    if (
      activeMovie &&
      activeMovie.tmdbId &&
      activeMovie.director === 'ACCLAIMED FILMMAKER' &&
      activeMovie.mediaType !== 'tv' &&
      activeMovie.mediaType !== 'anime'
    ) {
      let isSubscribed = true;
      fetchMovieDetails(activeMovie.tmdbId).then((details) => {
        if (isSubscribed && details) {
          setMoviesCatalog((prev) =>
            prev.map((m) => {
              if (m.id === activeMovie.id) {
                return {
                  ...m,
                  director: details.director,
                  musicBy: details.musicBy,
                  cast: details.cast,
                  productionCompanies: details.productionCompanies,
                  tagline: details.tagline || m.tagline,
                  runtime: details.runtime || m.runtime,
                  textlessPosterUrl: details.textlessPosterUrl || m.textlessPosterUrl,
                };
              }
              return m;
            })
          );
        }
      });
      return () => {
        isSubscribed = false;
      };
    }
  }, [currentIndex, activeCatalog]);

  // Infinite next page loader for active category
  const loadNextPage = useCallback(
    async (nextPageNumber: number) => {
      if (isLoadingMore) return;
      setIsLoadingMore(true);

      try {
        if (activeMediaType === 'movies') {
          const nextBatch = await fetchTrendingMoviesPage(nextPageNumber);
          if (nextBatch.length > 0) {
            setMoviesCatalog((prev) => {
              const existingIds = new Set(prev.map((m) => m.tmdbId || m.id));
              const filtered = nextBatch.filter((m) => !existingIds.has(m.tmdbId || m.id));
              return [...prev, ...filtered];
            });
            setMoviePage(nextPageNumber);
          }
        } else if (activeMediaType === 'tv') {
          const res = await fetchInfiniteTVCatalog(nextPageNumber, 'all');
          if (res.movies.length > 0) {
            setTvCatalog((prev) => {
              const existingIds = new Set(prev.map((m) => m.tmdbId || m.id));
              const filtered = res.movies.filter((m) => !existingIds.has(m.tmdbId || m.id));
              return [...prev, ...filtered];
            });
            setTvPage(nextPageNumber);
          }
        } else if (activeMediaType === 'anime') {
          const res = await fetchInfiniteAniListCatalog(nextPageNumber);
          if (res.anime.length > 0) {
            setAnimeCatalog((prev) => {
              const existingIds = new Set(prev.map((m) => m.anilistId || m.tmdbId || m.id));
              const filtered = res.anime.filter((m) => !existingIds.has(m.anilistId || m.tmdbId || m.id));
              return [...prev, ...filtered];
            });
            setAnimePage(nextPageNumber);
          }
        }
      } catch (err) {
        console.error('Failed to fetch next page:', err);
      } finally {
        setIsLoadingMore(false);
      }
    },
    [activeMediaType, isLoadingMore]
  );

  // Current active poster
  const currentPoster = activeCatalog[currentIndex] || activeCatalog[0] || FALLBACK_POSTERS[0];

  // Parallax and Mouse tracking
  const [parallax, setParallax] = useState<ParallaxState>({
    x: 0,
    y: 0,
    rotateX: 0,
    rotateY: 0,
  });
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  // Dynamic Web lines list
  const [webs, setWebs] = useState<WebShot[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Web Shooter trigger function
  const triggerWebShot = useCallback(
    (targetX?: number, targetY?: number) => {
      if (!currentPoster) return;
      const w = window.innerWidth;
      const h = window.innerHeight;

      const startX = w * (0.45 + Math.random() * 0.1);
      const startY = h * (0.55 + Math.random() * 0.1);

      const endX = targetX !== undefined ? targetX : w * (0.2 + Math.random() * 0.6);
      const endY = targetY !== undefined ? targetY : h * (0.15 + Math.random() * 0.5);

      const newWeb: WebShot = {
        id: `web-${Date.now()}-${Math.random()}`,
        startX,
        startY,
        endX,
        endY,
        createdAt: Date.now(),
        color: currentPoster.themeColor?.accent || '#38bdf8',
      };

      setWebs((prev) => [...prev.slice(-12), newWeb]);
      sound.playThwip();
    },
    [currentPoster]
  );

  // Handle Bottom Center Circular OK Button Click
  const handleOkClick = useCallback(() => {
    setIsOkPressed(true);
    sound.playOkClick();

    setShowSpideySense(true);
    const w = window.innerWidth;
    const h = window.innerHeight;
    triggerWebShot(w * 0.5, h * 0.35);

    setTimeout(() => {
      setIsOkPressed(false);
    }, 450);

    setTimeout(() => {
      setShowSpideySense(false);
    }, 2000);
  }, [triggerWebShot]);

  // Loader for older vintage classic titles on previous navigation
  const loadOlderPage = useCallback(
    async (nextOlderPageNumber: number) => {
      if (isLoadingOlder) return;
      setIsLoadingOlder(true);

      try {
        if (activeMediaType === 'movies') {
          const olderBatch = await fetchOlderMoviesPage(nextOlderPageNumber);
          if (olderBatch.length > 0) {
            setMoviesCatalog((prev) => {
              const existingIds = new Set(prev.map((m) => m.tmdbId || m.id));
              const filtered = olderBatch.filter((m) => !existingIds.has(m.tmdbId || m.id));
              // Prepend older titles to the front of catalog so going backwards discovers classic cinema
              return [...filtered, ...prev];
            });
            // Adjust current index so user stays looking at their current item or shifts smoothly into the newly prepended list
            setMovieIndex((prev) => prev + olderBatch.length);
            setOldMoviePage(nextOlderPageNumber);
          }
        } else if (activeMediaType === 'tv') {
          const olderBatch = await fetchOlderTVShowsPage(nextOlderPageNumber);
          if (olderBatch.length > 0) {
            setTvCatalog((prev) => {
              const existingIds = new Set(prev.map((m) => m.tmdbId || m.id));
              const filtered = olderBatch.filter((m) => !existingIds.has(m.tmdbId || m.id));
              return [...filtered, ...prev];
            });
            setTvIndex((prev) => prev + olderBatch.length);
            setOldTvPage(nextOlderPageNumber);
          }
        } else if (activeMediaType === 'anime') {
          const res = await fetchOlderAniListAnimePage(nextOlderPageNumber);
          if (res.anime.length > 0) {
            setAnimeCatalog((prev) => {
              const existingIds = new Set(prev.map((m) => m.anilistId || m.tmdbId || m.id));
              const filtered = res.anime.filter((m) => !existingIds.has(m.anilistId || m.tmdbId || m.id));
              return [...filtered, ...prev];
            });
            setAnimeIndex((prev) => prev + res.anime.length);
            setOldAnimePage(nextOlderPageNumber);
          }
        }
      } catch (err) {
        console.error('Failed to fetch older page:', err);
      } finally {
        setIsLoadingOlder(false);
      }
    },
    [activeMediaType, isLoadingOlder]
  );

  // Switch to Previous Poster in active catalog (discovers older classic titles chronologically)
  const handlePreviousMovie = useCallback(() => {
    if (activeCatalog.length === 0) return;
    setIsShaking(true);
    sound.playOkClick();

    const currentOldPageNum =
      activeMediaType === 'tv' ? oldTvPage : activeMediaType === 'anime' ? oldAnimePage : oldMoviePage;

    setCurrentIndex((prevIndex) => {
      const prev = prevIndex - 1;

      // When reaching or nearing the front of the catalog, fetch older classics and insert them
      if (prev <= 2) {
        loadOlderPage(currentOldPageNum + 1);
      }

      const targetIndex = prev >= 0 ? prev : 0;
      const upcoming = [activeCatalog[targetIndex], activeCatalog[targetIndex - 1]].filter(Boolean);
      preloadPosterImages(upcoming);
      return targetIndex;
    });

    setTimeout(() => {
      setIsShaking(false);
    }, 450);
  }, [activeCatalog, activeMediaType, oldTvPage, oldAnimePage, oldMoviePage, setCurrentIndex, loadOlderPage]);

  // Switch to Next Poster in active catalog (progresses through newer and diverse lower-ranking titles)
  const handleNextMovie = useCallback(() => {
    if (activeCatalog.length === 0) return;
    setIsShaking(true);
    sound.playOkClick();

    const currentPageNum =
      activeMediaType === 'tv' ? tvPage : activeMediaType === 'anime' ? animePage : moviePage;

    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;

      // When approaching the end of current list, proactively fetch the next TMDB page for endless stream
      if (nextIndex >= activeCatalog.length - 4) {
        loadNextPage(currentPageNum + 1);
      }

      // Preload next upcoming posters into browser memory for zero-lag display
      const targetIndex = nextIndex < activeCatalog.length ? nextIndex : activeCatalog.length - 1;
      const upcoming = [
        activeCatalog[targetIndex],
        activeCatalog[targetIndex + 1],
      ].filter(Boolean);
      preloadPosterImages(upcoming);

      return targetIndex;
    });

    setTimeout(() => {
      setIsShaking(false);
    }, 450);
  }, [activeCatalog, activeMediaType, tvPage, animePage, moviePage, setCurrentIndex, loadNextPage]);

  // Native Fullscreen API handler
  const toggleFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {
            setIsFullscreen(false);
          });
        }
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  }, []);

  // Handle selecting a movie/show/anime from search modal
  const handleSelectSearchedMovie = useCallback(
    (selectedItem: PosterData, mode?: SearchMode) => {
      sound.playOkClick();
      setIsShaking(true);

      const targetMode = mode || (selectedItem.mediaType === 'tv' ? 'tv' : selectedItem.mediaType === 'anime' ? 'anime' : 'movies');

      if (targetMode !== activeMediaType) {
        setActiveMediaType(targetMode);
      }

      if (targetMode === 'tv') {
        setTvCatalog((prev) => {
          const existingIdx = prev.findIndex(
            (m) => m.id === selectedItem.id || (m.tmdbId && m.tmdbId === selectedItem.tmdbId)
          );
          if (existingIdx !== -1) {
            setTvIndex(existingIdx);
            preloadPosterImages([prev[existingIdx]]);
            return prev;
          } else {
            const updated = [selectedItem, ...prev];
            setTvIndex(0);
            preloadPosterImages([selectedItem]);
            return updated;
          }
        });
      } else if (targetMode === 'anime') {
        setAnimeCatalog((prev) => {
          const existingIdx = prev.findIndex(
            (m) => m.id === selectedItem.id || (m.tmdbId && m.tmdbId === selectedItem.tmdbId)
          );
          if (existingIdx !== -1) {
            setAnimeIndex(existingIdx);
            preloadPosterImages([prev[existingIdx]]);
            return prev;
          } else {
            const updated = [selectedItem, ...prev];
            setAnimeIndex(0);
            preloadPosterImages([selectedItem]);
            return updated;
          }
        });
      } else {
        setMoviesCatalog((prev) => {
          const existingIdx = prev.findIndex(
            (m) => m.id === selectedItem.id || (m.tmdbId && m.tmdbId === selectedItem.tmdbId)
          );
          if (existingIdx !== -1) {
            setMovieIndex(existingIdx);
            preloadPosterImages([prev[existingIdx]]);
            return prev;
          } else {
            const updated = [selectedItem, ...prev];
            setMovieIndex(0);
            preloadPosterImages([selectedItem]);
            return updated;
          }
        });
      }

      setTimeout(() => {
        setIsShaking(false);
      }, 450);
    },
    [activeMediaType]
  );

  // Capture Fullscreen Poster Wallpaper Screenshot for local device
  const handleCaptureScreenshot = useCallback(async () => {
    if (!containerRef.current || !currentPoster || isCapturing) return;

    setIsCapturing(true);
    setIsOkPressed(true);
    setTimeout(() => setIsOkPressed(false), 200);

    // Give browser rendering a brief moment to stabilize
    await new Promise((resolve) => setTimeout(resolve, 80));

    try {
      const node = containerRef.current;
      const targetElement =
        (node.querySelector('#poster-full-container') as HTMLElement) ||
        document.getElementById('poster-full-container') ||
        node;
      const width = targetElement.offsetWidth || window.innerWidth;
      const height = targetElement.offsetHeight || window.innerHeight;

      const sanitizedTitle = (currentPoster.title || 'Poster')
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      const filename = `${sanitizedTitle}_HD_Poster_${width}x${height}.png`;

      const dataUrl = await capturePosterScreenshot(node, currentPoster);

      setShowFlash(true);
      sound.playCameraShutter();
      setTimeout(() => setShowFlash(false), 220);

      triggerDownload(dataUrl, filename);

      setScreenshotToast(`Ultra HD Poster Saved to Downloads!`);
      setTimeout(() => {
        setScreenshotToast(null);
      }, 2200);
    } catch (err) {
      console.error('Screenshot capture error:', err);
      setScreenshotToast('Screenshot generation failed. Please retry.');
      setTimeout(() => setScreenshotToast(null), 3000);
    } finally {
      setIsCapturing(false);
    }
  }, [currentPoster, isCapturing]);

  // Listen to native fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Mouse Move Parallax calculation
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const clientX = e.clientX;
    const clientY = e.clientY;

    const normalizedX = (clientX / width - 0.5) * 2;
    const normalizedY = (clientY / height - 0.5) * 2;

    setParallax({
      x: -normalizedX * 0.6,
      y: -normalizedY * 0.6,
      rotateX: normalizedY * 8,
      rotateY: -normalizedX * 8,
    });

    setMousePos({
      x: (clientX / width) * 100,
      y: (clientY / height) * 100,
    });
  }, []);

  // Mobile Device Orientation
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        const x = Math.min(Math.max(e.gamma / 30, -1), 1);
        const y = Math.min(Math.max((e.beta - 45) / 30, -1), 1);
        setParallax({
          x: -x * 0.6,
          y: -y * 0.6,
          rotateX: y * 8,
          rotateY: -x * 8,
        });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Screen Click -> Web Shoot
  const handleScreenClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('.pointer-events-auto')) {
      return;
    }
    triggerWebShot(e.clientX, e.clientY);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === '/' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
        handleNextMovie();
      } else if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') {
        handlePreviousMovie();
      } else if (e.key === 's' || e.key === 'S' || e.key === 'c' || e.key === 'C') {
        handleCaptureScreenshot();
      } else if (e.key === 'Enter') {
        handleOkClick();
      } else if (e.code === 'Space') {
        e.preventDefault();
        triggerWebShot();
      } else if (e.key === '1') {
        handleCategorySwitch('movies');
      } else if (e.key === '2') {
        handleCategorySwitch('tv');
      } else if (e.key === '3') {
        handleCategorySwitch('anime');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    toggleFullscreen,
    triggerWebShot,
    handleNextMovie,
    handlePreviousMovie,
    handleCaptureScreenshot,
    handleOkClick,
    handleCategorySwitch,
  ]);

  return (
    <div
      ref={containerRef}
      id="movie-poster-showcase-app"
      className={`relative w-screen h-screen overflow-hidden bg-black select-none ${
        isShaking ? 'shake-active' : ''
      }`}
      onMouseMove={handleMouseMove}
      onClick={handleScreenClick}
    >
      {/* Camera Shutter Flash Effect Overlay */}
      {showFlash && (
        <div className="fixed inset-0 bg-white z-[999] pointer-events-none transition-opacity duration-300 opacity-90 screenshot-exclude" />
      )}

      {/* Subtle Floating Screenshot Confirmation (File automatically downloads with no popup needed) */}
      {screenshotToast && (
        <div
          id="screenshot-toast"
          className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 text-white border border-cyan-400/40 shadow-[0_8px_25px_rgba(0,0,0,0.8)] backdrop-blur-md font-montserrat text-xs font-semibold pointer-events-none animate-fade-in screenshot-exclude"
        >
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{screenshotToast}</span>
        </div>
      )}

      {/* Category Loading Banner Overlay */}
      {isLoadingCategory && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1 rounded-full bg-black/80 border border-cyan-400/40 text-cyan-300 text-[11px] font-montserrat font-bold animate-pulse pointer-events-none">
          <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
          <span>
            Loading Top 100 {activeMediaType === 'tv' ? 'TV Series' : 'Japanese Anime'}...
          </span>
        </div>
      )}

      {/* Bottom Control Bar: Left (Previous), Center (Play), Right (Next), Screenshot, Search Modal Trigger */}
      <nav
        id="bottom-nav-controls"
        aria-label="Poster Controls"
        className="fixed bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-50 pointer-events-auto screenshot-exclude flex items-center gap-3 sm:gap-4 bg-black/40 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
      >
        {/* Previous Button */}
        <button
          id="prev-movie-btn"
          onClick={(e) => {
            e.stopPropagation();
            handlePreviousMovie();
          }}
          title="Previous Title (Left Arrow / P)"
          aria-label="Previous Title"
          className="group flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 transition-all duration-200 cursor-pointer active:scale-90"
        >
          <ChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        </button>

        {/* Center Play Button (Between Previous and Next) */}
        <button
          id="bottom-play-movie-btn"
          onClick={(e) => {
            e.stopPropagation();
            sound.playOkClick();
            setIsPlayerOpen(true);
          }}
          title="Watch / Play Title (Play)"
          aria-label="Play Title"
          className="relative group rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-black/90 hover:bg-black text-white border-2 backdrop-blur-xl transition-all duration-300 cursor-pointer select-none active:scale-90 hover:scale-105"
          style={{
            borderColor: currentPoster.themeColor?.primary || '#ef4444',
            boxShadow: `0 0 16px ${currentPoster.themeColor?.glow || 'rgba(239,68,68,0.5)'}, 0 2px 10px rgba(0,0,0,0.9)`,
          }}
        >
          <div
            className="absolute inset-0 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300 blur-[3px] pointer-events-none -z-10"
            style={{ backgroundColor: currentPoster.themeColor?.glow || 'rgba(239,68,68,0.5)' }}
          />
          <Play
            className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current ml-0.5 transition-transform duration-300 group-hover:scale-110"
            style={{ color: currentPoster.themeColor?.accent || '#ffffff' }}
          />
        </button>

        {/* Next Button */}
        <button
          id="next-movie-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleNextMovie();
          }}
          title="Next Title (Right Arrow / N)"
          aria-label="Next Title"
          className="group flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 transition-all duration-200 cursor-pointer active:scale-90"
        >
          <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>

        {/* Screenshot Button (Before Search Icon) */}
        <button
          id="center-bottom-ok-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleCaptureScreenshot();
          }}
          disabled={isCapturing}
          title="1-Click: Take Instant HD Screenshot (S / C)"
          aria-label="Take Screenshot"
          className={`group flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 transition-all duration-200 cursor-pointer active:scale-90 ${
            isOkPressed || isCapturing ? 'scale-90 ring-2 ring-white/50 text-cyan-300' : ''
          }`}
        >
          <Camera className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" />
        </button>

        {/* Search Popup Button */}
        <button
          id="bottom-search-trigger-btn"
          onClick={(e) => {
            e.stopPropagation();
            sound.playOkClick();
            setIsSearchOpen(true);
          }}
          title="Search & Browse Catalog ( / or K )"
          aria-label="Search"
          className="group flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-cyan-500/20 text-neutral-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-400/40 transition-all duration-200 cursor-pointer active:scale-90"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </nav>

      {/* CinemaOS Fullscreen Player Modal */}
      <MoviePlayerModal
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        poster={currentPoster}
      />

      {/* Worldwide TMDB Search & Explorer Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMovie={handleSelectSearchedMovie}
        onPlayDirectly={(poster) => {
          handleSelectSearchedMovie(poster, activeMediaType);
          setIsPlayerOpen(true);
        }}
        activeMode={activeMediaType}
        onModeChange={(newMode) => handleCategorySwitch(newMode)}
        loadedMovies={activeCatalog}
        currentMovieId={currentPoster.id}
      />

      {/* Dynamic Web Shooter Canvas Layer */}
      <SpiderWebCanvas webs={webs} accentColor={currentPoster.themeColor?.accent || '#38bdf8'} />

      {/* Main Multi-layered 3D Parallax Poster */}
      <PosterLayers
        key={`${activeMediaType}-${currentPoster.id}`}
        poster={currentPoster}
        parallax={isCapturing ? { x: 0, y: -0.58, rotateX: 7.68, rotateY: 0 } : parallax}
        showSpideySense={showSpideySense}
        mousePos={isCapturing ? { x: 50, y: 98 } : mousePos}
        cleanMode={false}
        filmGrain={true}
        lightGlow={true}
        onHeroClick={() => {
          setShowSpideySense(true);
          sound.playSpideySense();
          setTimeout(() => setShowSpideySense(false), 2400);
        }}
      />
    </div>
  );
}
