import React from 'react';
import { PosterData } from '../types';
import {
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Zap,
  Radio,
  Sliders,
  Info,
  Sparkles,
} from 'lucide-react';

interface PosterControlsProps {
  currentPoster?: PosterData;
  onSelectPoster?: (poster: PosterData) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  cleanMode: boolean;
  onToggleCleanMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onShootWeb: () => void;
  onTriggerSpideySense: () => void;
  filmGrain: boolean;
  onToggleFilmGrain: () => void;
  lightGlow: boolean;
  onToggleLightGlow: () => void;
  onOpenDetails: () => void;
  isUIHidden: boolean;
  onToggleHideUI: () => void;
}

export const PosterControls: React.FC<PosterControlsProps> = ({
  isFullscreen,
  onToggleFullscreen,
  cleanMode,
  onToggleCleanMode,
  isMuted,
  onToggleMute,
  onShootWeb,
  onTriggerSpideySense,
  filmGrain,
  onToggleFilmGrain,
  onOpenDetails,
  isUIHidden,
  onToggleHideUI,
}) => {
  return (
    <>
      {/* Floating Mini Toggle when UI is hidden */}
      {isUIHidden && (
        <button
          onClick={onToggleHideUI}
          id="reveal-ui-btn"
          aria-label="Show controls"
          className="fixed bottom-4 right-4 z-45 p-3 rounded-full bg-[#050505]/90 hover:bg-[#111] text-white backdrop-blur-md border border-red-600/40 shadow-2xl transition-all hover:scale-105 cursor-pointer"
        >
          <Sliders className="w-5 h-5 text-[#E61E26]" />
        </button>
      )}

      {/* Main Bottom HUD Controls */}
      <div
        id="poster-controls-hud"
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-auto max-w-full px-4 transition-all duration-300 ${
          isUIHidden
            ? 'opacity-0 translate-y-12 pointer-events-none'
            : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="bg-[#050505]/95 backdrop-blur-xl border border-white/10 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-[0_15px_40px_rgba(0,0,0,0.95)] flex items-center gap-2 sm:gap-3">
          {/* Web Shooter Button */}
          <button
            onClick={onShootWeb}
            id="shoot-web-btn"
            title="Shoot Web Strand (Space)"
            className="font-montserrat font-bold bg-white/10 hover:bg-white/20 text-white px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer active:scale-95 text-xs uppercase"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">THWIP!</span> WEB
          </button>

          {/* Spidey Sense Trigger */}
          <button
            onClick={onTriggerSpideySense}
            id="spidey-sense-btn"
            title="Trigger Spidey Sense (S)"
            className="font-montserrat font-bold bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 text-xs uppercase"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>SPIDEY SENSE</span>
          </button>

          <div className="h-4 w-[1px] bg-white/10 mx-0.5" />

          {/* Clean Wallpaper Mode Toggle */}
          <button
            onClick={onToggleCleanMode}
            id="clean-mode-btn"
            title={cleanMode ? 'Show Billing Credits' : 'Hide Credits for Clean Wallpaper'}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold cursor-pointer ${
              cleanMode
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
          >
            {cleanMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{cleanMode ? 'Clean Art' : 'Credits'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            id="toggle-audio-btn"
            title={isMuted ? 'Unmute SFX (M)' : 'Mute SFX (M)'}
            className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          {/* Film Grain Toggle */}
          <button
            onClick={onToggleFilmGrain}
            id="toggle-grain-btn"
            title="Toggle 35mm Film Grain Texture"
            className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer ${
              filmGrain ? 'bg-red-600/25 text-red-300 border border-red-500/30' : 'bg-white/5 text-neutral-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {/* Poster Info / Movie Details Modal */}
          <button
            onClick={onOpenDetails}
            id="open-details-btn"
            title="Movie Synopsis & Cast"
            className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={onToggleFullscreen}
            id="toggle-fullscreen-btn"
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
            className="font-montserrat font-black bg-[#E61E26] hover:bg-red-700 text-white px-2.5 sm:px-3.5 py-1.5 rounded-lg shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 text-xs uppercase"
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">EXIT</span>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5" />
                <span>FULLSCREEN</span>
              </>
            )}
          </button>

          {/* Hide UI HUD Button */}
          <button
            onClick={onToggleHideUI}
            id="hide-ui-hud-btn"
            title="Hide Controls (H)"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
};
