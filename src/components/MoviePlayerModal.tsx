import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Loader2,
  Play,
  Tv,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { PosterData } from '../types';
import { sound } from '../utils/audio';
import { fetchTVDetails } from '../services/tmdb';

interface MoviePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  poster: PosterData;
}

export const MoviePlayerModal: React.FC<MoviePlayerModalProps> = ({
  isOpen,
  onClose,
  poster,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active playing Season & Episode
  const [season, setSeason] = useState<number>(1);
  const [episode, setEpisode] = useState<number>(1);

  // Input Box draft states (allows user to type custom numbers)
  const [seasonInput, setSeasonInput] = useState<string>('1');
  const [episodeInput, setEpisodeInput] = useState<string>('1');

  // TV Seasons & Episodes meta info from TMDB
  const [totalSeasons, setTotalSeasons] = useState<number>(poster.totalSeasons || 1);
  const [seasonEpisodesMap, setSeasonEpisodesMap] = useState<Record<number, number>>({});
  const [episodesInCurrentSeason, setEpisodesInCurrentSeason] = useState<number>(
    poster.totalEpisodes || (poster.mediaType === 'anime' ? (poster.totalEpisodes || 24) : 10)
  );

  // Reset states when poster changes
  useEffect(() => {
    setSeason(1);
    setEpisode(1);
    setSeasonInput('1');
    setEpisodeInput('1');
    setIsLoading(true);

    if (poster.mediaType === 'tv' && poster.tmdbId) {
      fetchTVDetails(poster.tmdbId).then((details) => {
        if (details) {
          setTotalSeasons(details.numberOfSeasons || 1);
          const map: Record<number, number> = {};
          details.seasons.forEach((s) => {
            map[s.season_number] = s.episode_count;
          });
          setSeasonEpisodesMap(map);

          const s1Count = map[1] || 10;
          setEpisodesInCurrentSeason(s1Count);
        }
      });
    } else if (poster.mediaType === 'anime') {
      const epCount = poster.totalEpisodes || 24;
      setTotalSeasons(1);
      setEpisodesInCurrentSeason(epCount);
    }
  }, [poster.id, poster.tmdbId, poster.anilistId, poster.mediaType, poster.totalEpisodes, poster.totalSeasons]);

  // Update episode max when season changes for TV shows
  useEffect(() => {
    if (poster.mediaType === 'tv') {
      const count = seasonEpisodesMap[season] || 10;
      setEpisodesInCurrentSeason(count);
    }
  }, [season, seasonEpisodesMap, poster.mediaType]);

  const rawId =
    poster.anilistId ||
    poster.tmdbId ||
    Number(poster.id.replace(/^(tmdb-|tv-|anime-|anilist-)/, '')) ||
    42013;

  // Determine exact CinemaOS player URL
  const playerUrl = useMemo(() => {
    if (poster.mediaType === 'anime') {
      // If anilistId is present, use animeplayer: https://cinemaos.live/animeplayer/watch/{id}/{e}
      if (poster.anilistId) {
        return `https://cinemaos.live/animeplayer/watch/${poster.anilistId}/${episode}`;
      }
      // If from TMDB, use CinemaOS TV endpoint with season & episode
      const tvId = poster.tmdbId || rawId;
      return `https://cinemaos.in/tv/watch/${tvId}?s=${season}&e=${episode}`;
    }

    if (poster.mediaType === 'tv') {
      // TV Show player: https://cinemaos.tech/player/{id}/{s}/{e}
      const tvId = poster.tmdbId || rawId;
      return `https://cinemaos.tech/player/${tvId}/${season}/${episode}`;
    }

    // Movie player: https://cinemaos.in/movie/watch/{id}
    const movieId = poster.tmdbId || rawId;
    return `https://cinemaos.in/movie/watch/${movieId}`;
  }, [poster, rawId, season, episode]);

  // Handle Play Button click from input boxes (applies season & episode to player)
  const handleApplySeasonEpisode = (customSeason?: number, customEpisode?: number) => {
    sound.playOkClick();
    setIsLoading(true);

    const sNum = customSeason !== undefined ? customSeason : (parseInt(seasonInput, 10) || 1);
    const eNum = customEpisode !== undefined ? customEpisode : (parseInt(episodeInput, 10) || 1);

    const validS = Math.max(1, sNum);
    const validE = Math.max(1, eNum);

    setSeason(validS);
    setEpisode(validE);
    setSeasonInput(String(validS));
    setEpisodeInput(String(validE));
  };

  // Up/Down Arrow step handlers for Season (updates input draft only, does NOT auto play)
  const handleSeasonIncrement = () => {
    const current = parseInt(seasonInput, 10) || 1;
    const next = current + 1;
    setSeasonInput(String(next));
    if (poster.mediaType === 'tv') {
      const epCount = seasonEpisodesMap[next] || 10;
      setEpisodesInCurrentSeason(epCount);
    }
  };

  const handleSeasonDecrement = () => {
    const current = parseInt(seasonInput, 10) || 1;
    if (current > 1) {
      const prev = current - 1;
      setSeasonInput(String(prev));
      if (poster.mediaType === 'tv') {
        const epCount = seasonEpisodesMap[prev] || 10;
        setEpisodesInCurrentSeason(epCount);
      }
    }
  };

  // Up/Down Arrow step handlers for Episode (updates input draft only, does NOT auto play)
  const handleEpisodeIncrement = () => {
    const current = parseInt(episodeInput, 10) || 1;
    const next = current + 1;
    setEpisodeInput(String(next));
  };

  const handleEpisodeDecrement = () => {
    const current = parseInt(episodeInput, 10) || 1;
    if (current > 1) {
      const prev = current - 1;
      setEpisodeInput(String(prev));
    }
  };

  // Keyboard shortcuts: Escape to close
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(true);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        sound.playOkClick();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="cinemaos-player-modal"
      className="fixed inset-0 z-[100] w-screen h-screen bg-black flex flex-col items-center justify-center select-none animate-fade-in screenshot-exclude"
    >
      {/* Top Header Bar */}
      <header
        id="player-top-header"
        className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-5 py-2.5 bg-gradient-to-b from-black/95 via-black/80 to-transparent pointer-events-none border-b border-white/5 backdrop-blur-md"
      >
        {/* Left: Title & Media Badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto min-w-0 max-w-[28%] sm:max-w-[32%] shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)] shrink-0">
            {poster.mediaType === 'anime' ? (
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400" />
            ) : poster.mediaType === 'tv' ? (
              <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            ) : (
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <h2 className="text-white font-montserrat font-bold text-[11px] sm:text-xs md:text-sm tracking-wide drop-shadow-md truncate">
              {poster.titleLine1 || poster.title}
              {poster.titleLine2 ? ` ${poster.titleLine2}` : ''}
            </h2>
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-neutral-400 font-montserrat font-semibold truncate">
              <span className="uppercase text-amber-400">
                {poster.mediaType === 'anime' ? 'Anime' : poster.mediaType === 'tv' ? 'TV' : 'Movie'}
              </span>
              {(poster.mediaType === 'tv' || poster.mediaType === 'anime') && (
                <span className="text-neutral-300 font-mono">
                  {poster.mediaType === 'tv' ? `S${season}:E${episode}` : `E${episode}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Exact Middle Season & Episode Controls (Clean & Modern, No Heavy Glass Box) */}
        {poster.mediaType === 'tv' && (
          <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-2 sm:gap-3">
            {/* Season Box */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-baseline gap-1 text-neutral-300 font-montserrat font-bold text-[10px] sm:text-xs">
                <span className="sm:hidden text-cyan-400">S {totalSeasons}</span>
                <span className="hidden sm:inline text-neutral-300">
                  Season <span className="text-cyan-400 font-mono">{totalSeasons}</span>
                </span>
              </div>

              {/* Season Number Input Box + Up/Down Arrows */}
              <div className="relative flex items-center bg-black/70 rounded-lg border border-cyan-500/40 hover:border-cyan-400/80 focus-within:border-cyan-400 transition-colors shadow-inner">
                <input
                  id="season-number-input"
                  type="number"
                  min={1}
                  max={totalSeasons}
                  value={seasonInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSeasonInput(val);
                    const sNum = parseInt(val, 10);
                    if (!isNaN(sNum) && sNum >= 1 && poster.mediaType === 'tv') {
                      const count = seasonEpisodesMap[sNum] || 10;
                      setEpisodesInCurrentSeason(count);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApplySeasonEpisode();
                    }
                  }}
                  title="Enter Season Number"
                  aria-label="Season Number"
                  className="w-7 sm:w-9 h-6 sm:h-7 bg-transparent text-center font-mono font-bold text-xs sm:text-sm text-cyan-300 outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="flex flex-col border-l border-white/10 pr-0.5">
                  <button
                    type="button"
                    onClick={handleSeasonIncrement}
                    disabled={parseInt(seasonInput, 10) >= totalSeasons}
                    title="Next Season"
                    aria-label="Next Season"
                    className="p-0.5 text-neutral-400 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                  >
                    <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSeasonDecrement}
                    disabled={parseInt(seasonInput, 10) <= 1}
                    title="Previous Season"
                    aria-label="Previous Season"
                    className="p-0.5 text-neutral-400 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="w-[1px] h-4 bg-white/20" />

            {/* Episode Box */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-baseline gap-1 text-neutral-300 font-montserrat font-bold text-[10px] sm:text-xs">
                <span className="sm:hidden text-cyan-400">E {episodesInCurrentSeason}</span>
                <span className="hidden sm:inline text-neutral-300">
                  Episode <span className="text-cyan-400 font-mono">{episodesInCurrentSeason}</span>
                </span>
              </div>

              {/* Episode Number Input Box + Up/Down Arrows */}
              <div className="relative flex items-center bg-black/70 rounded-lg border border-cyan-500/40 hover:border-cyan-400/80 focus-within:border-cyan-400 transition-colors shadow-inner">
                <input
                  id="episode-number-input"
                  type="number"
                  min={1}
                  value={episodeInput}
                  onChange={(e) => setEpisodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApplySeasonEpisode();
                    }
                  }}
                  title="Enter Episode Number"
                  aria-label="Episode Number"
                  className="w-7 sm:w-9 h-6 sm:h-7 bg-transparent text-center font-mono font-bold text-xs sm:text-sm text-cyan-300 outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="flex flex-col border-l border-white/10 pr-0.5">
                  <button
                    type="button"
                    onClick={handleEpisodeIncrement}
                    title="Next Episode"
                    aria-label="Next Episode"
                    className="p-0.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleEpisodeDecrement}
                    disabled={parseInt(episodeInput, 10) <= 1}
                    title="Previous Episode"
                    aria-label="Previous Episode"
                    className="p-0.5 text-neutral-400 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mini Play Action Button */}
            <button
              id="apply-season-episode-btn"
              type="button"
              onClick={() => handleApplySeasonEpisode()}
              title="Play Selected Episode"
              aria-label="Play Selected Episode"
              className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.6)] transition-all duration-200 cursor-pointer active:scale-90"
            >
              <Play className="w-3 h-3 fill-current ml-0.5" />
            </button>
          </div>
        )}

        {/* Center: Anime Episode Controls (Clean & Modern, No Heavy Glass Box) */}
        {poster.mediaType === 'anime' && (
          <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-2 sm:gap-3">
            {/* Episode Box */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-baseline gap-1 text-neutral-300 font-montserrat font-bold text-[10px] sm:text-xs">
                <span className="sm:hidden text-pink-400">E {episodesInCurrentSeason}</span>
                <span className="hidden sm:inline text-neutral-300">
                  Episode <span className="text-pink-400 font-mono">{episodesInCurrentSeason}</span>
                </span>
              </div>

              {/* Episode Input Box + Up/Down Arrows */}
              <div className="relative flex items-center bg-black/70 rounded-lg border border-pink-500/40 hover:border-pink-400/80 focus-within:border-pink-400 transition-colors shadow-inner">
                <input
                  id="anime-episode-number-input"
                  type="number"
                  min={1}
                  value={episodeInput}
                  onChange={(e) => setEpisodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApplySeasonEpisode(1, parseInt(episodeInput, 10) || 1);
                    }
                  }}
                  title="Enter Anime Episode Number"
                  aria-label="Anime Episode Number"
                  className="w-8 sm:w-10 h-6 sm:h-7 bg-transparent text-center font-mono font-bold text-xs sm:text-sm text-pink-300 outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="flex flex-col border-l border-white/10 pr-0.5">
                  <button
                    type="button"
                    onClick={handleEpisodeIncrement}
                    title="Next Episode"
                    aria-label="Next Episode"
                    className="p-0.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={handleEpisodeDecrement}
                    disabled={parseInt(episodeInput, 10) <= 1}
                    title="Previous Episode"
                    aria-label="Previous Episode"
                    className="p-0.5 text-neutral-400 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mini Play Action Button */}
            <button
              id="apply-anime-episode-btn"
              type="button"
              onClick={() => handleApplySeasonEpisode(1, parseInt(episodeInput, 10) || 1)}
              title="Play Selected Anime Episode"
              aria-label="Play Selected Anime Episode"
              className="flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-pink-600 hover:bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.6)] transition-all duration-200 cursor-pointer active:scale-90"
            >
              <Play className="w-3 h-3 fill-current ml-0.5" />
            </button>
          </div>
        )}

        {/* Right: External Link & Close Player Modal Buttons */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          <a
            id="open-external-player-btn"
            href={playerUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Stream in New Tab (Bypasses Preview Sandbox)"
            aria-label="Open Stream in New Tab"
            className="group relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-900/80 hover:bg-cyan-600 text-neutral-300 hover:text-white border border-white/20 hover:border-cyan-400 shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:shadow-[0_0_16px_rgba(6,182,212,0.7)] backdrop-blur-xl transition-all duration-200 cursor-pointer active:scale-90"
          >
            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:scale-110" />
            <span className="sr-only">Open in New Tab</span>
          </a>

          <button
            id="close-player-btn"
            onClick={() => {
              sound.playOkClick();
              onClose();
            }}
            title="Close Player (Esc)"
            aria-label="Close Movie Player"
            className="group relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-900/80 hover:bg-red-600 text-neutral-200 hover:text-white border border-white/20 hover:border-red-500/80 shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:shadow-[0_0_16px_rgba(239,68,68,0.7)] backdrop-blur-xl transition-all duration-200 cursor-pointer active:scale-90"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover:rotate-90" />
            <span className="sr-only">Close Player</span>
          </button>
        </div>
      </header>

      {/* Loading Spinner Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/95 pointer-events-none">
          <div className="relative flex items-center justify-center">
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderColor: `${poster.themeColor?.primary || '#ef4444'} transparent ${poster.themeColor?.secondary || '#dc2626'} transparent`,
              }}
            />
            <Loader2 className="w-7 h-7 text-neutral-400 animate-spin absolute" />
          </div>
          <p className="mt-4 text-neutral-300 font-montserrat font-medium text-xs tracking-wider uppercase">
            Loading {poster.mediaType === 'anime' ? `Anime Episode ${episode}` : poster.mediaType === 'tv' ? `TV Stream (S${season} : E${episode})` : 'Cinema Stream'}...
          </p>
          <span className="text-[10px] text-neutral-500 font-mono mt-1 max-w-[90vw] truncate">
            {playerUrl}
          </span>
        </div>
      )}

      {/* CinemaOS Stream Iframe */}
      <iframe
        key={`${playerUrl}-${season}-${episode}`}
        id="cinemaos-iframe"
        src={playerUrl}
        title={poster.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
        className="w-full h-full border-0 bg-black pt-11 sm:pt-13"
      />
    </div>
  );
};
