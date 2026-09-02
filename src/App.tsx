import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Film, Loader2, RefreshCw, Check, Camera, ChevronLeft, ChevronRight, Search, Play } from 'lucide-react';
import { PosterData, WebShot, ParallaxState } from './types';
import { PosterLayers } from './components/PosterLayers';
import { SpiderWebCanvas } from './components/SpiderWebCanvas';
import { SearchModal } from './components/SearchModal';
import { MoviePlayerModal } from './components/MoviePlayerModal';
import { sound } from './utils/audio';
import { fetchTop100Movies, fetchTrendingMoviesPage, preloadPosterImages, fetchMovieDetails } from './services/tmdb';
import { FALLBACK_POSTERS } from './data/fallbackPosters';
import { capturePosterScreenshot, triggerDownload } from './utils/screenshot';

export default function App() {
  const [movies, setMovies] = useState<PosterData[]>(FALLBACK_POSTERS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSpideySense, setShowSpideySense] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [showFlash, setShowFlash] = useState<boolean>(false);
  const [screenshotToast, setScreenshotToast] = useState<string | null>(null);
  const [isOkPressed, setIsOkPressed] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState<boolean>(false);

  // Fetch initial 100 TMDB latest release & trending movies on mount
  useEffect(() => {
    let isMounted = true;
    async function loadInitial100Movies() {
      try {
        const top100 = await fetchTop100Movies();
        if (isMounted && top100.length > 0) {
          setMovies(top100);
        }
      } catch (err) {
        console.warn('Using instant fallback movies:', err);
      }
    }

    loadInitial100Movies();
    return () => {
      isMounted = false;
    };
  }, []);

  // Enrich current poster with deep credits (director, cast, etc.) if needed
  useEffect(() => {
    const activeMovie = movies[currentIndex];
    if (activeMovie && activeMovie.tmdbId && activeMovie.director === 'ACCLAIMED FILMMAKER') {
      let isSubscribed = true;
      fetchMovieDetails(activeMovie.tmdbId).then((details) => {
        if (isSubscribed && details) {
          setMovies((prev) =>
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
  }, [currentIndex, movies]);

  // Proactive background fetch for next TMDB page for infinite scrolling
  const loadNextPage = useCallback(async (nextPageNumber: number) => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const nextBatch = await fetchTrendingMoviesPage(nextPageNumber);
      if (nextBatch.length > 0) {
        setMovies((prev) => {
          const existingIds = new Set(prev.map((m) => m.tmdbId || m.id));
          const filtered = nextBatch.filter((m) => !existingIds.has(m.tmdbId || m.id));
          return [...prev, ...filtered];
        });
        setCurrentPage(nextPageNumber);
      }
    } catch (err) {
      console.error('Failed to fetch next TMDB page:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore]);

  // Current active poster
  const currentPoster = movies[currentIndex] || null;

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
        color: currentPoster.themeColor.accent,
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

    // Trigger spidey sense ripple and web shot towards the poster center
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

  // Switch to Previous Movie
  const handlePreviousMovie = useCallback(() => {
    if (movies.length === 0) return;
    setIsShaking(true);
    sound.playOkClick();

    setCurrentIndex((prevIndex) => {
      const prev = prevIndex - 1;
      const targetIndex = prev >= 0 ? prev : movies.length - 1;
      const upcoming = [movies[targetIndex]].filter(Boolean);
      preloadPosterImages(upcoming);
      return targetIndex;
    });

    setTimeout(() => {
      setIsShaking(false);
    }, 450);
  }, [movies]);

  // Switch to Next Movie
  const handleNextMovie = useCallback(() => {
    if (movies.length === 0) return;
    setIsShaking(true);
    sound.playOkClick();

    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;

      // When approaching the end of current list, proactively fetch the next TMDB page
      if (nextIndex >= movies.length - 4) {
        loadNextPage(currentPage + 1);
      }

      // Preload next upcoming posters into browser memory for zero-lag display
      const targetIndex = nextIndex < movies.length ? nextIndex : 0;
      const upcoming = [movies[targetIndex], movies[(targetIndex + 1) % movies.length]].filter(Boolean);
      preloadPosterImages(upcoming);

      return targetIndex;
    });

    setTimeout(() => {
      setIsShaking(false);
    }, 450);
  }, [movies.length, currentPage, loadNextPage]);

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

  // Handle selecting a movie from search modal
  const handleSelectSearchedMovie = useCallback((selectedMovie: PosterData) => {
    sound.playOkClick();
    setIsShaking(true);

    setMovies((prev) => {
      const existingIdx = prev.findIndex(
        (m) => m.id === selectedMovie.id || (m.tmdbId && m.tmdbId === selectedMovie.tmdbId)
      );

      if (existingIdx !== -1) {
        setCurrentIndex(existingIdx);
        preloadPosterImages([prev[existingIdx]]);
        return prev;
      } else {
        const updated = [selectedMovie, ...prev];
        setCurrentIndex(0);
        preloadPosterImages([selectedMovie]);
        return updated;
      }
    });

    setTimeout(() => {
      setIsShaking(false);
    }, 450);
  }, []);

  // Multi-tap tracker for middle button (1 tap: Shake & Switch | 3 taps: Screenshot | 5 taps: Fullscreen)
  const tapCountRef = useRef<number>(0);
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Capture Fullscreen Poster Wallpaper Screenshot for local device
  const handleCaptureScreenshot = useCallback(async () => {
    if (!containerRef.current || !currentPoster || isCapturing) return;

    setIsCapturing(true);
    setIsOkPressed(true);
    setTimeout(() => setIsOkPressed(false), 200);

    // Wait a brief render frame so React settles the poster in the neutral center (middle position)
    await new Promise((resolve) => setTimeout(resolve, 60));

    try {
      const node = containerRef.current;
      const width = node.offsetWidth || window.innerWidth;
      const height = node.offsetHeight || window.innerHeight;

      // Construct clean local filename based on movie title
      const sanitizedTitle = (currentPoster.title || 'Movie_Poster')
        .replace(/[^a-zA-Z0-9_\-\s]/g, '')
        .trim()
        .replace(/\s+/g, '_');
      const filename = `${sanitizedTitle}_HD_Poster_${width}x${height}.png`;

      // Capture using resilient multi-tier engine
      const dataUrl = await capturePosterScreenshot(node, currentPoster);

      // Visual and Audio Camera feedback
      setShowFlash(true);
      sound.playCameraShutter();
      setTimeout(() => setShowFlash(false), 220);

      // Trigger download
      triggerDownload(dataUrl, filename);

      setScreenshotToast(`Poster Saved! (${width}x${height})`);
      setTimeout(() => {
        setScreenshotToast(null);
      }, 3500);
    } catch (err) {
      console.error('Screenshot capture error:', err);
      setScreenshotToast('Screenshot generation failed. Please retry.');
      setTimeout(() => setScreenshotToast(null), 3500);
    } finally {
      setIsCapturing(false);
    }
  }, [currentPoster, isCapturing]);

  // Single click instant screenshot controller
  const handleMiddleButtonPress = useCallback(() => {
    handleCaptureScreenshot();
  }, [handleCaptureScreenshot]);

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen, triggerWebShot, handleNextMovie, handlePreviousMovie, handleCaptureScreenshot, handleOkClick]);

  // Loading Screen if TMDB is initial fetching
  if (isLoadingInitial && !currentPoster) {
    return (
      <div className="w-screen h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-6 select-none">
        <div className="relative flex items-center justify-center mb-6">
          <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
          <Film className="w-6 h-6 text-white absolute" />
        </div>
        <h2 className="font-montserrat font-black text-2xl sm:text-3xl tracking-wider uppercase text-center">
          CONNECTING TMDB TRENDING
        </h2>
        <p className="font-montserrat text-xs text-neutral-400 mt-2 tracking-widest uppercase text-center max-w-md">
          Fetching official high-resolution movie key art, real cast, and live ratings...
        </p>
      </div>
    );
  }

  // Fallback if network was empty
  if (!currentPoster) {
    return (
      <div className="w-screen h-screen bg-[#050505] flex flex-col items-center justify-center text-white p-6">
        <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">
          No TMDB trending movies loaded
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-yellow-400 text-black font-black text-xs rounded-xl flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> RETRY TMDB FETCH
        </button>
      </div>
    );
  }

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

      {/* Floating Screenshot Toast Notification */}
      {screenshotToast && (
        <div className="fixed bottom-12 sm:bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900/95 text-white border border-cyan-400/50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md font-montserrat font-bold text-xs tracking-wider uppercase animate-fade-in screenshot-exclude">
          <div className="w-4 h-4 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-400">
            <Check className="w-3 h-3" />
          </div>
          <span>{screenshotToast}</span>
        </div>
      )}

      {/* Bottom Control Bar: Left (Previous Movie), Center (1-Click Instant Screenshot), Right (Next Movie), Search Popup Trigger */}
      <div 
        id="bottom-nav-controls"
        className="fixed bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-50 pointer-events-auto screenshot-exclude flex items-center gap-3 sm:gap-5 bg-black/40 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.8)]"
      >
        {/* Previous Movie Button */}
        <button
          id="prev-movie-btn"
          onClick={(e) => {
            e.stopPropagation();
            handlePreviousMovie();
          }}
          title="Previous Movie (Left Arrow / P)"
          aria-label="Previous Movie"
          className="group flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 transition-all duration-200 cursor-pointer active:scale-90"
        >
          <ChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        </button>

        {/* Center Circular 1-Click Screenshot Button */}
        <button
          id="center-bottom-ok-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleMiddleButtonPress();
          }}
          disabled={isCapturing}
          title="1-Click: Take Instant HD Screenshot & Download (S / C)"
          aria-label="Take Screenshot"
          className={`relative group rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-black/90 hover:bg-black text-white border-2 backdrop-blur-xl transition-all duration-300 cursor-pointer select-none active:scale-90 ${
            isOkPressed || isCapturing ? 'scale-90 ring-2 ring-white/50' : 'hover:scale-110'
          }`}
          style={{
            borderColor: currentPoster.themeColor.primary,
            boxShadow: `0 0 16px ${currentPoster.themeColor.glow}, 0 2px 10px rgba(0,0,0,0.9)`,
          }}
        >
          {/* Outer Neon Glow Halo */}
          <div
            className="absolute inset-0 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300 blur-[3px] pointer-events-none -z-10"
            style={{ backgroundColor: currentPoster.themeColor.glow }}
          />

          {/* Camera Icon or Glowing Center Core */}
          <Camera 
            className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110" 
            style={{ color: currentPoster.themeColor.accent }}
          />
        </button>

        {/* Next Movie Button */}
        <button
          id="next-movie-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleNextMovie();
          }}
          title="Next Movie (Right Arrow / N)"
          aria-label="Next Movie"
          className="group flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 hover:border-white/30 transition-all duration-200 cursor-pointer active:scale-90"
        >
          <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>

        {/* Play Movie Fullscreen Player Button (Placed before Search icon) */}
        <button
          id="bottom-play-movie-btn"
          onClick={(e) => {
            e.stopPropagation();
            sound.playOkClick();
            setIsPlayerOpen(true);
          }}
          title="Watch Fullscreen Movie (Play)"
          aria-label="Play Movie"
          className="group flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-neutral-300 hover:text-red-400 border border-white/10 hover:border-red-500/40 transition-all duration-200 cursor-pointer active:scale-90 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
        >
          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
        </button>

        {/* Search Popup Button */}
        <button
          id="bottom-search-trigger-btn"
          onClick={(e) => {
            e.stopPropagation();
            sound.playOkClick();
            setIsSearchOpen(true);
          }}
          title="Search Movies & Browse Top 100"
          aria-label="Search Movies"
          className="group flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-cyan-500/20 text-neutral-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-400/40 transition-all duration-200 cursor-pointer active:scale-90"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* CinemaOS Fullscreen Movie Player Modal */}
      <MoviePlayerModal
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
        poster={currentPoster}
      />

      {/* Worldwide TMDB Search & 100 Movies Explorer Popup Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMovie={handleSelectSearchedMovie}
        loadedMovies={movies}
        currentMovieId={currentPoster.id}
      />

      {/* Dynamic Web Shooter Canvas Layer */}
      <SpiderWebCanvas webs={webs} accentColor={currentPoster.themeColor.accent} />

      {/* Main Multi-layered 3D Parallax Poster */}
      <PosterLayers
        key={currentPoster.id}
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
