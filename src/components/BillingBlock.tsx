import React from 'react';
import { PosterData } from '../types';
import { Star, Clock } from 'lucide-react';

interface BillingBlockProps {
  poster: PosterData;
}

export const BillingBlock: React.FC<BillingBlockProps> = ({ poster }) => {
  const topStars = poster.cast.slice(0, 3).map((c) => c.actor).join(' • ');

  return (
    <div className="w-full max-w-5xl mx-auto text-center px-4 select-none pointer-events-auto">
      {/* 3-Column Bold Typography Layout for Director, Date Badge, and Cast */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-center mb-2.5">
        {/* Left Column: Directed by & Score */}
        <div className="hidden md:flex flex-col text-left border-l-2 pl-3" style={{ borderColor: poster.themeColor.primary }}>
          <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-black font-montserrat" style={{ color: poster.themeColor.primary }}>
            <span>DIRECTED BY</span>
          </div>
          <p className="text-xs font-black text-white tracking-wider uppercase font-montserrat mt-0.5 truncate">
            {poster.director}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {poster.voteAverage} / 10
            </span>
            {poster.runtime && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-300">
                <Clock className="w-3 h-3 text-neutral-400" />
                {Math.floor(poster.runtime / 60)}h {poster.runtime % 60}m
              </span>
            )}
          </div>
        </div>

        {/* Center Column: Angled Bold Release Date Badge */}
        <div className="flex flex-col items-center justify-center">
          <div className="bg-white text-black px-6 sm:px-8 py-1.5 sm:py-2 transform -rotate-1 shadow-2xl rounded-xs">
            <p className="text-[8px] sm:text-[9px] font-black tracking-widest uppercase text-neutral-800 font-montserrat">
              THEATRICAL RELEASE
            </p>
            <p className="text-lg sm:text-xl md:text-2xl font-black text-black font-montserrat tracking-tight leading-tight">
              {poster.releaseDate}
            </p>
          </div>
        </div>

        {/* Right Column: Leading Stars */}
        <div className="hidden md:flex flex-col text-right border-r-2 pr-3" style={{ borderColor: poster.themeColor.primary }}>
          <p className="text-[9px] uppercase tracking-widest font-black font-montserrat" style={{ color: poster.themeColor.primary }}>
            STARRING
          </p>
          <p className="text-xs font-black text-white tracking-wider uppercase font-montserrat mt-0.5 truncate">
            {topStars || 'ENSEMBLE CAST'}
          </p>
          <div className="flex justify-end gap-1.5 mt-1">
            {poster.genres.map((g) => (
              <span
                key={g}
                className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-neutral-200 uppercase font-mono"
              >
                {g}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Theatrical Billing Credits Fine Text */}
      <div className="max-w-3xl mx-auto py-1 px-3 bg-black/75 backdrop-blur-md border-y border-white/10 rounded-sm">
        <p className="font-montserrat text-[7px] sm:text-[8px] leading-tight text-neutral-300 tracking-[0.16em] uppercase font-medium">
          <span className="text-white font-bold">{poster.studioPresenter}</span> PRESENTS A FILM BY{' '}
          <span className="text-white font-bold">{poster.director}</span> • MUSIC BY{' '}
          <span className="text-neutral-200 font-semibold">{poster.musicBy}</span>
        </p>
        <p className="font-montserrat text-[6px] sm:text-[7px] text-neutral-400 tracking-[0.12em] uppercase mt-0.5">
          {poster.releaseVenue} • OFFICIAL CINEMATIC RELEASE • ALL RIGHTS RESERVED.
        </p>
      </div>

      {/* Studio & Format Badges Footer */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-2 text-neutral-300">
        {/* Production Studio Badges (Before IMAX) with Pure Glass Effect (No Dark Shadow) */}
        {poster.productionCompanies.slice(0, 2).map((comp) => (
          <span
            key={comp}
            className="font-montserrat text-[8px] sm:text-[9px] tracking-widest font-black text-white bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-0.5 uppercase rounded-[2px]"
          >
            {comp}
          </span>
        ))}

        {/* IMAX Badge with Pure Glass Effect (No Dark Shadow) */}
        <span className="font-outfit text-[9px] sm:text-[10px] font-black tracking-widest text-white bg-white/10 backdrop-blur-md border border-white/25 px-2.5 py-0.5 rounded-[2px]">
          IMAX
        </span>

        {/* Dolby Cinema Badge with Pure Glass Effect (No Dark Shadow) */}
        <span className="font-montserrat text-[8px] sm:text-[9px] font-black tracking-wider text-white bg-white/10 backdrop-blur-md border border-white/25 px-2.5 py-0.5 rounded-[2px]">
          DOLBY CINEMA
        </span>
      </div>
    </div>
  );
};
