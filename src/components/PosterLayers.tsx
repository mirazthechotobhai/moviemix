import React, { useMemo, useState, useEffect } from 'react';
import { PosterData, ParallaxState } from '../types';
import { BillingBlock } from './BillingBlock';
import { FALLBACK_POSTERS } from '../data/fallbackPosters';
import { Star } from 'lucide-react';

interface PosterLayersProps {
  poster: PosterData;
  parallax: ParallaxState;
  showSpideySense: boolean;
  mousePos: { x: number; y: number };
  cleanMode: boolean;
  filmGrain: boolean;
  lightGlow: boolean;
  onHeroClick?: (e: React.MouseEvent) => void;
}

export const PosterLayers: React.FC<PosterLayersProps> = ({
  poster,
  parallax,
  showSpideySense,
  mousePos,
  cleanMode,
  filmGrain,
  lightGlow,
  onHeroClick,
}) => {
  // Ordered resilient image candidates list
  const candidateImages = useMemo(() => {
    const list: string[] = [];
    if (poster.textlessPosterUrl && typeof poster.textlessPosterUrl === 'string') {
      list.push(poster.textlessPosterUrl);
    }
    if (poster.heroImageUrl && typeof poster.heroImageUrl === 'string' && !list.includes(poster.heroImageUrl)) {
      list.push(poster.heroImageUrl);
    }
    if (poster.bgImageUrl && typeof poster.bgImageUrl === 'string' && !list.includes(poster.bgImageUrl)) {
      list.push(poster.bgImageUrl);
    }
    // Alternative CDN resolution tiers for TMDB
    if (poster.heroImageUrl && poster.heroImageUrl.includes('/w780/')) {
      const w500 = poster.heroImageUrl.replace('/w780/', '/w500/');
      if (!list.includes(w500)) list.push(w500);
      const w1280 = poster.heroImageUrl.replace('/w780/', '/w1280/');
      if (!list.includes(w1280)) list.push(w1280);
      const orig = poster.heroImageUrl.replace('/w780/', '/original/');
      if (!list.includes(orig)) list.push(orig);
    }
    if (poster.bgImageUrl && poster.bgImageUrl.includes('/w1280/')) {
      const w780 = poster.bgImageUrl.replace('/w1280/', '/w780/');
      if (!list.includes(w780)) list.push(w780);
      const orig = poster.bgImageUrl.replace('/w1280/', '/original/');
      if (!list.includes(orig)) list.push(orig);
    }
    // Universal ultimate fallback
    if (FALLBACK_POSTERS[0]?.heroImageUrl && !list.includes(FALLBACK_POSTERS[0].heroImageUrl)) {
      list.push(FALLBACK_POSTERS[0].heroImageUrl);
    }
    return list.length > 0 ? list : [FALLBACK_POSTERS[0].heroImageUrl];
  }, [poster.id, poster.textlessPosterUrl, poster.heroImageUrl, poster.bgImageUrl]);

  const [imgIndex, setImgIndex] = useState<number>(0);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Reset when poster changes
  useEffect(() => {
    setImgIndex(0);
    setImageLoaded(false);
  }, [poster.id, candidateImages]);

  const activePosterUrl = candidateImages[imgIndex] || candidateImages[0] || poster.heroImageUrl || poster.bgImageUrl;
  const activeBgUrl = poster.bgImageUrl || activePosterUrl;

  // Ambient floating cinematic particles
  const particles = useMemo(() => {
    return Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      left: `${(i * 17) % 96}%`,
      top: `${(i * 23) % 92}%`,
      size: `${2 + (i % 3)}px`,
      duration: `${3.5 + (i % 4)}s`,
      delay: `${(i % 3) * 0.7}s`,
    }));
  }, []);

  return (
    <div
      id="poster-full-container"
      className="relative w-full h-full overflow-hidden flex flex-col justify-between select-none bg-[#050505]"
      onClick={onHeroClick}
    >
      {/* 1. Deep Atmospheric Movie Backdrop (Layer 0 - Parallax Low) */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-100 ease-out will-change-transform scale-105"
        style={{
          backgroundImage: `url(${activeBgUrl})`,
          transform: `translate3d(${parallax.x * 12}px, ${parallax.y * 12}px, 0) scale(1.08)`,
        }}
      >
        {/* Dynamic genre color atmosphere wash */}
        <div
          className={`absolute inset-0 bg-gradient-to-b ${poster.themeColor.bgGradient} opacity-85 mix-blend-multiply`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-[#050505]/85" />
      </div>

      {/* Dot-Matrix Background Overlay */}
      <div className="absolute inset-0 dot-matrix opacity-15 pointer-events-none z-5" />

      {/* 2. Hero Centerpiece: Original Movie Poster Key Art (Layer 2 - Parallax Medium) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-100 ease-out z-10"
        style={{
          transform: `translate3d(${parallax.x * 35}px, ${parallax.y * 35}px, 0) rotateX(${parallax.rotateX * 0.35}deg) rotateY(${parallax.rotateY * 0.35}deg)`,
        }}
      >
        <div className="relative w-full max-w-[360px] sm:max-w-lg md:max-w-xl lg:max-w-2xl h-[65vh] sm:h-[74vh] md:h-[78vh] flex items-center justify-center">
          {/* Spidey Sense Radiant Pulse Waves on Click */}
          {showSpideySense && (
            <div className="absolute top-[22%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-center screenshot-exclude">
              <div
                className="absolute w-48 h-48 sm:w-64 sm:h-64 rounded-full border-2 spidey-sense-ring"
                style={{ borderColor: poster.themeColor.accent }}
              />
              <div
                className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border spidey-sense-ring"
                style={{ animationDelay: '0.4s', borderColor: poster.themeColor.primary }}
              />
            </div>
          )}

          {/* Authentic TMDB Movie Poster Artwork */}
          <div className="relative h-full flex items-center justify-center pointer-events-auto">
            <div
              className="relative rounded-2xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.98)] border border-white/20 transition-all duration-300 bg-neutral-900/50"
              style={{
                boxShadow: `0 0 65px ${poster.themeColor.glow}, 0 25px 80px rgba(0,0,0,0.95)`,
              }}
            >
              <img
                key={poster.id + activePosterUrl + imgIndex}
                src={activePosterUrl}
                alt={poster.title}
                crossOrigin="anonymous"
                loading="eager"
                decoding="async"
                onLoad={() => {
                  setImageLoaded(true);
                }}
                onError={() => {
                  if (imgIndex < candidateImages.length - 1) {
                    setImgIndex((prev) => prev + 1);
                  }
                }}
                className={`max-h-[62vh] sm:max-h-[72vh] md:max-h-[76vh] w-auto object-contain rounded-2xl transition-all duration-300 block ${
                  imageLoaded ? 'opacity-100 scale-100' : 'opacity-95 scale-100'
                }`}
                style={{
                  filter: lightGlow
                    ? `drop-shadow(0 0 45px ${poster.themeColor.glow}) contrast(1.1) brightness(1.03)`
                    : 'drop-shadow(0 0 25px rgba(0,0,0,0.9))',
                }}
              />
            </div>

            {/* Glowing Accent Rim Light Highlight */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none mix-blend-screen opacity-30 transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, ${poster.themeColor.primary} 0%, transparent 60%)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Interactive Cursor Spotlight / Atmospheric Flare (Layer 3) */}
      {lightGlow && (
        <div
          className="absolute inset-0 pointer-events-none z-15 transition-opacity duration-300"
          style={{
            background: `radial-gradient(650px circle at ${mousePos.x}% ${mousePos.y}%, ${poster.themeColor.glow}, transparent 75%)`,
          }}
        />
      )}

      {/* 4. Floating Dust & Embers Particles */}
      <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              backgroundColor: p.id % 2 === 0 ? poster.themeColor.primary : '#ffffff',
              boxShadow: `0 0 8px ${poster.themeColor.primary}`,
              animation: `floatParticle ${p.duration} ease-in-out infinite`,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      {/* 5. Foreground Movie Poster Typography & Branding (Layer 4) */}
      <div className="relative z-25 w-full flex flex-col justify-between h-full p-4 sm:p-8 md:p-10 pointer-events-none">
        {/* TOP HEADER: Studio & Tagline Header - Locked in top position so it never cuts off or shifts up */}
        <header
          className="w-full flex flex-col items-center text-center space-y-1 pt-1 sm:pt-3 transition-transform duration-100 ease-out"
          style={{
            transform: `translate3d(${parallax.x * 12}px, 0px, 0)`,
          }}
        >
          <p
            className="text-[10px] sm:text-xs tracking-[0.45em] sm:tracking-[0.6em] font-black uppercase font-montserrat drop-shadow-md"
            style={{ color: poster.themeColor.primary }}
          >
            {poster.studioPresenter}
          </p>
          <div className="h-[2px] w-16 bg-white mx-auto opacity-30"></div>

          {/* Tagline / Subtitle */}
          <p className="font-montserrat text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.2em] uppercase text-neutral-300 mt-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] max-w-3xl truncate">
            "{poster.tagline}"
          </p>
        </header>

        {/* BOTTOM SECTION: Blockbuster Movie Title & Credits */}
        <main
          className="w-full flex flex-col items-center text-center pb-1 sm:pb-3 transition-transform duration-100 ease-out"
          style={{
            transform: `translate3d(${parallax.x * 30}px, ${parallax.y * 18}px, 0)`,
          }}
        >
          {/* Main Movie Title */}
          <div className="relative flex flex-col items-center select-none">
            <h1
              className="text-[42px] sm:text-[75px] md:text-[95px] lg:text-[115px] leading-[0.85] font-black italic tracking-tighter text-white uppercase skew-title font-montserrat"
              style={{
                textShadow: `
                  0 0 35px rgba(0,0,0,0.95),
                  0 4px 20px rgba(0,0,0,0.95),
                  0 0 50px ${poster.themeColor.glow}
                `,
              }}
            >
              {poster.titleLine1 || poster.title}
            </h1>
            {poster.titleLine2 && (
              <h1
                className="text-[42px] sm:text-[75px] md:text-[95px] lg:text-[115px] leading-[0.85] font-black italic tracking-tighter uppercase mt-[-6px] sm:mt-[-18px] md:mt-[-25px] skew-title font-montserrat"
                style={{
                  color: poster.themeColor.primary,
                  textShadow: `
                    0 0 30px ${poster.themeColor.primary},
                    0 0 60px ${poster.themeColor.secondary},
                    0 4px 15px rgba(0,0,0,0.95)
                  `,
                }}
              >
                {poster.titleLine2}
              </h1>
            )}
          </div>

          {/* Genre Subtitle */}
          {poster.subtitle && (
            <div className="mt-2 sm:mt-4 flex flex-col items-center">
              <p className="text-xs sm:text-lg md:text-xl font-bold tracking-[0.3em] uppercase text-white/95 font-montserrat">
                {poster.subtitle}
              </p>
            </div>
          )}

          {/* Full Theatrical Billing Credits Block */}
          {!cleanMode && (
            <div className="w-full mt-3 sm:mt-4">
              <BillingBlock poster={poster} />
            </div>
          )}
        </main>
      </div>

      {/* 6. Premium Glass Prism Bottom Accent Bar with Dynamic Movie Theme Glass Tint */}
      <div className="absolute bottom-0 left-0 w-full z-35 pointer-events-none transition-all duration-700 ease-out">
        {/* Ambient colored underglow */}
        <div
          className="absolute -top-3 left-0 right-0 h-6 blur-md opacity-70 transition-all duration-700 pointer-events-none"
          style={{
            background: `radial-gradient(50% 100% at 50% 100%, ${poster.themeColor.glow || poster.themeColor.primary} 0%, transparent 100%)`,
          }}
        />

        {/* The Glass Bar Layer */}
        <div
          className="relative w-full h-2 sm:h-2.5 backdrop-blur-xl border-t transition-all duration-700"
          style={{
            background: `linear-gradient(90deg, rgba(255,255,255,0.06) 0%, ${poster.themeColor.primary}25 25%, ${poster.themeColor.secondary || poster.themeColor.primary}40 50%, ${poster.themeColor.primary}25 75%, rgba(255,255,255,0.06) 100%)`,
            borderTopColor: 'rgba(255, 255, 255, 0.4)',
            boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.45), inset 0 -1px 2px rgba(0, 0, 0, 0.3), 0 -2px 14px ${poster.themeColor.glow || poster.themeColor.primary}66`,
          }}
        >
          {/* Specular Light Reflection Streak across Glass Edge */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px] opacity-85 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 15%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0.2) 85%, transparent 100%)',
            }}
          />
        </div>
      </div>

      {/* 7. Film Grain Overlay */}
      {filmGrain && (
        <div className="absolute inset-0 pointer-events-none z-30 film-grain" />
      )}
    </div>
  );
};
