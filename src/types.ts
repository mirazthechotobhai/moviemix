export type PosterTheme = string;

export type AspectRatioMode = 'fullscreen' | 'poster' | 'imax' | 'ultrawide';

export interface PosterCredit {
  role: string;
  names: string[];
}

export interface PosterData {
  id: string;
  tmdbId: number;
  title: string;
  titleLine1: string;
  titleLine2?: string;
  subtitle?: string;
  tagline: string;
  releaseDate: string;
  releaseVenue: string;
  rating: string;
  year: string;
  studioPresenter: string;
  themeColor: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
    border: string;
    bgGradient: string;
  };
  synopsis: string;
  overview: string;
  genres: string[];
  voteAverage: number;
  voteCount: number;
  runtime?: number;
  popularity?: number;
  productionCompanies: string[];
  cast: { actor: string; character: string }[];
  director: string;
  musicBy: string;
  bgImageUrl: string;
  heroImageUrl: string;
  textlessPosterUrl?: string;
  atmosphereOverlay?: string;
  spiderLogoVariant?: 'classic' | 'modern' | 'verse' | 'symbiote' | 'retro' | 'joker' | 'bat' | string;
  soundtrackTitle?: string;
}

export interface WebShot {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  createdAt: number;
  color: string;
}

export interface ParallaxState {
  x: number;
  y: number;
  rotateX: number;
  rotateY: number;
}
