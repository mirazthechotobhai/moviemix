import { PosterData } from '../types';

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

export interface AniListMedia {
  id: number;
  idMal?: number;
  title: {
    romaji?: string;
    english?: string;
    native?: string;
    userPreferred?: string;
  };
  description?: string;
  seasonYear?: number;
  startDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  episodes?: number;
  duration?: number;
  genres: string[];
  averageScore?: number;
  popularity?: number;
  studios?: {
    nodes?: { name: string }[];
  };
  coverImage: {
    extraLarge?: string;
    large?: string;
    medium?: string;
    color?: string;
  };
  bannerImage?: string;
}

const ANILIST_QUERY = `
query ($page: Int, $perPage: Int, $search: String, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      hasNextPage
      perPage
    }
    media(search: $search, type: ANIME, sort: $sort, isAdult: false) {
      id
      idMal
      title {
        romaji
        english
        native
        userPreferred
      }
      description
      seasonYear
      startDate {
        year
        month
        day
      }
      episodes
      duration
      genres
      averageScore
      popularity
      studios(isMain: true) {
        nodes {
          name
        }
      }
      coverImage {
        extraLarge
        large
        medium
        color
      }
      bannerImage
    }
  }
}
`;

const SINGLE_ANIME_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    idMal
    title {
      romaji
      english
      native
      userPreferred
    }
    description
    seasonYear
    startDate {
      year
      month
      day
    }
    episodes
    duration
    genres
    averageScore
    popularity
    studios(isMain: true) {
      nodes {
        name
      }
    }
    coverImage {
      extraLarge
      large
      medium
      color
    }
    bannerImage
  }
}
`;

function cleanHtmlDescription(html?: string): string {
  if (!html) return 'Experience this legendary anime series with stunning animation and storytelling.';
  return html.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
}

function mapAniListMediaToPoster(item: AniListMedia): PosterData {
  const fullTitle =
    item.title?.english ||
    item.title?.userPreferred ||
    item.title?.romaji ||
    item.title?.native ||
    'Anime Series';

  // Title splitting for poster layout
  const words = fullTitle.split(' ');
  let titleLine1 = fullTitle;
  let titleLine2: string | undefined = undefined;
  if (words.length > 2) {
    const mid = Math.ceil(words.length / 2);
    titleLine1 = words.slice(0, mid).join(' ');
    titleLine2 = words.slice(mid).join(' ');
  }

  const rawYear = item.seasonYear || item.startDate?.year || 2023;
  const ratingScore = item.averageScore ? (item.averageScore / 10).toFixed(1) : '8.6';
  const cleanDesc = cleanHtmlDescription(item.description);

  const posterImg =
    item.coverImage?.extraLarge ||
    item.coverImage?.large ||
    item.coverImage?.medium ||
    item.bannerImage ||
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1080&q=80';

  const backdropImg =
    item.bannerImage ||
    item.coverImage?.extraLarge ||
    item.coverImage?.large ||
    posterImg;

  const studioName = item.studios?.nodes?.[0]?.name || 'JAPANESE ANIMATION STUDIO';
  const customColor = item.coverImage?.color || '#ec4899';

  return {
    id: `anilist-${item.id}`,
    tmdbId: item.id,
    anilistId: item.id,
    title: fullTitle,
    titleLine1,
    titleLine2,
    subtitle: item.title?.romaji || item.title?.native || undefined,
    tagline: item.genres && item.genres.length > 0 ? item.genres.join(' • ') : 'ANIME SERIES',
    releaseDate: `${rawYear}`,
    releaseVenue: 'STREAMING ON CINEMAOS LIVE',
    rating: `★ ${ratingScore}`,
    year: `${rawYear}`,
    studioPresenter: studioName.toUpperCase(),
    themeColor: {
      primary: customColor,
      secondary: '#a855f7',
      accent: '#38bdf8',
      glow: `${customColor}80`,
      border: `${customColor}99`,
      bgGradient: 'from-purple-950/90 via-black to-pink-950/90',
    },
    synopsis: cleanDesc,
    overview: cleanDesc,
    genres: item.genres && item.genres.length > 0 ? item.genres : ['Animation', 'Action', 'Anime'],
    voteAverage: Number(ratingScore) || 8.6,
    voteCount: item.popularity || 12000,
    runtime: item.duration || 24,
    popularity: item.popularity || 1000,
    productionCompanies: [studioName],
    cast: [{ actor: studioName, character: 'Animation Studio' }],
    director: studioName,
    musicBy: 'ORIGINAL ANIME SOUNDTRACK',
    bgImageUrl: backdropImg,
    heroImageUrl: posterImg,
    textlessPosterUrl: posterImg,
    atmosphereOverlay: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&q=80',
    spiderLogoVariant: 'verse',
    soundtrackTitle: 'Original Anime Soundtrack',
    mediaType: 'anime',
    totalEpisodes: item.episodes || 24,
  };
}

// Fetch Top 100 Anime from AniList API (2 pages of 50 items)
export async function fetchTop100AniListAnime(): Promise<PosterData[]> {
  try {
    const fetchPage = async (page: number) => {
      const response = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query: ANILIST_QUERY,
          variables: {
            page,
            perPage: 50,
            sort: ['POPULARITY_DESC', 'SCORE_DESC'],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`AniList API failed with status ${response.status}`);
      }

      const data = await response.json();
      const mediaList: AniListMedia[] = data?.data?.Page?.media || [];
      return mediaList.map(mapAniListMediaToPoster);
    };

    const [page1, page2] = await Promise.all([fetchPage(1), fetchPage(2)]);
    const combined = [...page1, ...page2];

    return combined.length > 0 ? combined : [];
  } catch (error) {
    console.error('Failed to fetch Top 100 Anime from AniList:', error);
    return [];
  }
}

// Infinite Catalog loader from AniList
export async function fetchInfiniteAniListCatalog(
  page: number = 1,
  sort: string[] = ['POPULARITY_DESC']
): Promise<{ anime: PosterData[]; hasMore: boolean }> {
  try {
    const response = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: ANILIST_QUERY,
        variables: {
          page,
          perPage: 30,
          sort,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`AniList API failed with status ${response.status}`);
    }

    const data = await response.json();
    const pageInfo = data?.data?.Page?.pageInfo;
    const mediaList: AniListMedia[] = data?.data?.Page?.media || [];

    return {
      anime: mediaList.map(mapAniListMediaToPoster),
      hasMore: pageInfo ? pageInfo.hasNextPage : false,
    };
  } catch (error) {
    console.error('Failed to load AniList infinite catalog:', error);
    return { anime: [], hasMore: false };
  }
}

// Search Anime via AniList GraphQL API
export async function searchAniListAnimePaged(
  query: string,
  page: number = 1
): Promise<{ anime: PosterData[]; hasMore: boolean }> {
  if (!query.trim()) return { anime: [], hasMore: false };

  try {
    const response = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: ANILIST_QUERY,
        variables: {
          search: query.trim(),
          page,
          perPage: 24,
          sort: ['SEARCH_MATCH', 'POPULARITY_DESC'],
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`AniList Search failed with status ${response.status}`);
    }

    const data = await response.json();
    const pageInfo = data?.data?.Page?.pageInfo;
    const mediaList: AniListMedia[] = data?.data?.Page?.media || [];

    return {
      anime: mediaList.map(mapAniListMediaToPoster),
      hasMore: pageInfo ? pageInfo.hasNextPage : false,
    };
  } catch (error) {
    console.error('Failed to search AniList Anime:', error);
    return { anime: [], hasMore: false };
  }
}

// Fetch single Anime by AniList ID (e.g. 42013 or any numeric ID)
export async function fetchAniListAnimeById(id: number): Promise<PosterData | null> {
  try {
    const response = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: SINGLE_ANIME_QUERY,
        variables: { id },
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const media: AniListMedia = data?.data?.Media;
    if (!media) return null;
    return mapAniListMediaToPoster(media);
  } catch (error) {
    console.error(`Failed to fetch AniList Anime with id ${id}:`, error);
    return null;
  }
}
