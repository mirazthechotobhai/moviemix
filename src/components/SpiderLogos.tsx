import React from 'react';

interface SpiderLogoProps {
  variant: 'classic' | 'modern' | 'verse' | 'symbiote' | 'retro' | 'joker' | 'bat';
  className?: string;
  color?: string;
  glow?: boolean;
}

export const SpiderLogo: React.FC<SpiderLogoProps> = ({
  variant,
  className = 'w-16 h-16',
  color = 'currentColor',
  glow = true,
}) => {
  if (variant === 'joker') {
    // Haunting theatrical Joker smile / laugh insignia
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} ${glow ? 'filter drop-shadow-[0_0_15px_rgba(16,185,129,0.9)]' : ''}`}
      >
        <path
          d="M15 45 C 30 75, 70 75, 85 45 C 65 60, 35 60, 15 45 Z"
          fill={color}
        />
        <circle cx="32" cy="30" r="5" fill={color} />
        <circle cx="68" cy="30" r="5" fill={color} />
        <path
          d="M25 22 C 32 15, 42 20, 42 20 M75 22 C 68 15, 58 20, 58 20"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (variant === 'bat') {
    // The Batman sharp sleek bat insignia
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} ${glow ? 'filter drop-shadow-[0_0_15px_rgba(220,38,38,0.9)]' : ''}`}
      >
        <path
          d="M50 35 L44 26 L40 32 C30 25 15 32 6 52 C20 48 34 56 38 68 C42 58 48 54 50 56 C52 54 58 58 62 68 C66 56 80 48 94 52 C85 32 70 25 60 32 L56 26 Z"
          fill={color}
        />
      </svg>
    );
  }
  if (variant === 'verse') {
    // Stylized spray-paint graffiti Spider-Verse insignia
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} ${glow ? 'filter drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]' : ''}`}
      >
        <path
          d="M50 18C44 24 38 28 35 42C32 54 36 68 50 82C64 68 68 54 65 42C62 28 56 24 50 18Z"
          fill={color}
        />
        <path
          d="M50 12L42 28M50 12L58 28"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Upper Legs */}
        <path
          d="M40 32C28 20 18 22 10 30M60 32C72 20 82 22 90 30"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M37 40C20 34 12 40 6 52M63 40C80 34 88 40 94 52"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Lower Legs */}
        <path
          d="M38 52C22 58 14 70 12 88M62 52C78 58 86 70 88 88"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M42 62C30 74 25 85 24 94M58 62C70 74 75 85 76 94"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (variant === 'symbiote') {
    // Sharp, aggressive Symbiote Alien white spider logo
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} ${glow ? 'filter drop-shadow-[0_0_15px_rgba(168,85,247,0.9)]' : ''}`}
      >
        <path
          d="M50 20L44 38L38 48L50 86L62 48L56 38L50 20Z"
          fill={color}
        />
        {/* Extended razor legs */}
        <path
          d="M47 32L24 16L12 24M53 32L76 16L88 24"
          stroke={color}
          strokeWidth="4.5"
          strokeLinejoin="bevel"
          strokeLinecap="square"
        />
        <path
          d="M44 42L18 36L6 54M56 42L82 36L94 54"
          stroke={color}
          strokeWidth="4"
          strokeLinejoin="bevel"
          strokeLinecap="square"
        />
        <path
          d="M42 54L22 66L14 90M58 54L78 66L86 90"
          stroke={color}
          strokeWidth="4"
          strokeLinejoin="bevel"
          strokeLinecap="square"
        />
        <path
          d="M46 68L30 82L26 96M54 68L70 82L74 96"
          stroke={color}
          strokeWidth="3.5"
          strokeLinejoin="bevel"
          strokeLinecap="square"
        />
      </svg>
    );
  }

  if (variant === 'retro') {
    // Classic Ditko / Romita round body spider emblem
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} ${glow ? 'filter drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]' : ''}`}
      >
        <ellipse cx="50" cy="46" rx="9" ry="14" fill={color} />
        <circle cx="50" cy="30" r="6" fill={color} />
        {/* Curved retro legs */}
        <path
          d="M44 36C30 26 22 28 16 38M56 36C70 26 78 28 84 38"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M42 44C26 38 18 48 12 60M58 44C74 38 82 48 88 60"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M43 52C28 62 20 74 18 88M57 52C72 62 80 74 82 88"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M46 58C36 72 30 82 28 92M54 58C64 72 70 82 72 92"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Modern MCU / Blockbuster geometric emblem
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? 'filter drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : ''}`}
    >
      <polygon points="50,24 45,36 41,52 50,78 59,52 55,36" fill={color} />
      <polygon points="50,15 46,22 54,22" fill={color} />
      {/* Upper angled legs */}
      <path
        d="M45 28L30 16L18 24M55 28L70 16L82 24"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M43 38L22 32L10 46M57 38L78 32L90 46"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lower angled legs */}
      <path
        d="M42 52L24 64L16 84M58 52L76 64L84 84"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M46 64L32 78L26 92M54 64L68 78L74 92"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
