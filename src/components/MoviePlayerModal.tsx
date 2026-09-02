import React, { useState, useEffect } from 'react';
import { X, Loader2, Play } from 'lucide-react';
import { PosterData } from '../types';
import { sound } from '../utils/audio';

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

  // Determine the movie ID for CinemaOS player
  const movieId = poster.tmdbId || poster.id;
  const playerUrl = `https://cinemaos.in/movie/watch/${movieId}`;

  // Keyboard shortcut: Escape to close
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
      {/* Top Bar with Title and Circular Close Button */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none">
        {/* Movie Title */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-8 h-8 rounded-full bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)]">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
          <div>
            <h2 className="text-white font-montserrat font-bold text-sm sm:text-base tracking-wide drop-shadow-md line-clamp-1">
              {poster.titleLine1 || poster.title}
              {poster.titleLine2 ? ` ${poster.titleLine2}` : ''}
            </h2>
          </div>
        </div>

        {/* Top-Right Circular Close Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            id="close-player-btn"
            onClick={() => {
              sound.playOkClick();
              onClose();
            }}
            title="Close Player (Esc)"
            aria-label="Close Movie Player"
            className="group relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-neutral-900/80 hover:bg-red-600 text-neutral-200 hover:text-white border border-white/20 hover:border-red-500/80 shadow-[0_4px_20px_rgba(0,0,0,0.8)] hover:shadow-[0_0_20px_rgba(239,68,68,0.7)] backdrop-blur-xl transition-all duration-300 cursor-pointer active:scale-90"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 group-hover:rotate-90" />
            <span className="sr-only">Close Player</span>
          </button>
        </div>
      </div>

      {/* Loading Spinner Indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 pointer-events-none">
          <div className="relative flex items-center justify-center">
            <div
              className="w-16 h-16 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderColor: `${poster.themeColor?.primary || '#ef4444'} transparent ${poster.themeColor?.secondary || '#dc2626'} transparent`,
              }}
            />
            <Loader2 className="w-8 h-8 text-neutral-400 animate-spin absolute" />
          </div>
          <p className="mt-4 text-neutral-300 font-montserrat font-medium text-xs tracking-wider uppercase">
            Loading Cinema Stream...
          </p>
        </div>
      )}

      {/* Fullscreen Video Player Iframe */}
      <iframe
        id="cinemaos-iframe"
        src={playerUrl}
        title={poster.title}
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
        onLoad={() => setIsLoading(false)}
        className="w-full h-full border-0 bg-black"
      />
    </div>
  );
};
