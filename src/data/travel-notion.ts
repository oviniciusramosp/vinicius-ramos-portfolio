/**
 * Notion CMS bridge for /travel places.
 *
 * Source of truth for editorial place content: Notion DB "Lugares".
 * Snapshot: `travel-notion.generated.ts` (regenerate with `npm run travel:notion:pull`).
 *
 * Technical map data (OSM areas, itineraries, photo pipeline) stays local.
 *
 * Note: this module must NOT import from `./travel` (value or type that pulls
 * runtime deps) — `travel.ts` imports us for mergeNotionPlaces (cycle → SSR fail).
 */

import type { PlaceCategory } from './travel-categories';
import notionSnapshot from './travel-notion.generated';

/** Bilingual string (mirrors travel.ts LString without importing it). */
type LString = { en: string; 'pt-BR': string };

/** Cover/gallery photo (mirrors TravelPhoto without importing travel-photos). */
type NotionPhoto = {
  url: string;
  alt?: LString;
  credit?: string;
};

const VALID_CATEGORIES = new Set<string>([
  'airport',
  'transport',
  'parks',
  'cafes',
  'restaurants',
  'commons',
  'markets',
  'shopping',
  'photo',
  'tourist',
  'lodging',
]);

/** Normalize Notion select labels (with emoji) or legacy plain slugs → site category. */
function normalizeCategorySlug(raw: string): string {
  if (VALID_CATEGORIES.has(raw)) return raw;
  const stripped = raw
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\s]+/u, '')
    .trim()
    .toLowerCase();
  const map: Record<string, string> = {
    airport: 'airport',
    transport: 'transport',
    parks: 'parks',
    park: 'parks',
    cafés: 'cafes',
    cafes: 'cafes',
    café: 'cafes',
    cafe: 'cafes',
    restaurants: 'restaurants',
    restaurant: 'restaurants',
    chains: 'commons',
    commons: 'commons',
    markets: 'markets',
    market: 'markets',
    shopping: 'shopping',
    photo: 'photo',
    tourist: 'tourist',
    stay: 'lodging',
    lodging: 'lodging',
    // legacy Tag labels
    airbnb: 'lodging',
    restaurante: 'restaurants',
    aeroporto: 'airport',
    passeio: 'tourist',
    evento: 'tourist',
    compras: 'shopping',
    sobremesas: 'cafes',
  };
  return map[stripped] ?? 'tourist';
}

/** Normalize Notion City select (emoji label or slug) → site city slug. */
function normalizeCitySlug(raw: string): string {
  const direct = [
    'sao-paulo',
    'florianopolis',
    'new-york',
    'miami',
    'paris',
    'roma',
    'lisboa',
    'porto',
  ];
  if (direct.includes(raw)) return raw;
  const stripped = raw
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\s]+/u, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  const map: Record<string, string> = {
    'sao paulo': 'sao-paulo',
    'são paulo': 'sao-paulo',
    florianopolis: 'florianopolis',
    florianópolis: 'florianopolis',
    'new york': 'new-york',
    miami: 'miami',
    paris: 'paris',
    roma: 'roma',
    rome: 'roma',
    lisboa: 'lisboa',
    lisbon: 'lisboa',
    porto: 'porto',
  };
  return map[stripped] ?? stripped.replace(/\s+/g, '-');
}

export type NotionPlaceRecord = {
  notionPageId: string;
  id: string;
  city: string;
  name: LString;
  category: string;
  description: LString;
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
  mapsUrl?: string;
  mapsQuery?: string;
  rating?: number;
  googleRating?: number;
  favorite?: boolean;
  featured?: boolean;
  landmark?: string;
  subcategories?: string[];
  coverUrl?: string;
  photos?: NotionPhoto[];
  tags?: string[];
  conhecido?: boolean;
  date?: string | null;
  lastEdited?: string;
};

export type NotionTravelSnapshot = {
  generatedAt: string;
  databaseId: string;
  count: number;
  byCity: Record<string, number>;
  places: NotionPlaceRecord[];
};

/**
 * Editorial place shape produced for merge into TravelPlace.
 * Kept local so we never import ./travel (circular with mergeNotionPlaces).
 */
export type NotionTravelPlace = {
  id: string;
  name: LString;
  category: PlaceCategory;
  description: LString;
  lat: number;
  lng: number;
  address?: string;
  placeId?: string;
  mapsUrl?: string;
  mapsQuery?: string;
  rating?: number;
  googleRating?: number;
  favorite?: boolean;
  featured?: boolean;
  landmark?: string;
  subcategories?: string[];
  photos?: NotionPhoto[];
};

/** Minimal city shape required by the merger. */
export type NotionMergeCity<P extends { id: string } = NotionTravelPlace> = {
  slug: string;
  places: P[];
};

export const travelNotionSnapshot =
  notionSnapshot as unknown as NotionTravelSnapshot;

function toCategory(raw: string): PlaceCategory {
  const slug = normalizeCategorySlug(raw);
  if (VALID_CATEGORIES.has(slug)) {
    return slug as PlaceCategory;
  }
  return 'tourist';
}

/** Convert a Notion snapshot row into editorial place fields. */
export function notionRecordToPlace(rec: NotionPlaceRecord): NotionTravelPlace {
  const place: NotionTravelPlace = {
    id: rec.id,
    name: rec.name,
    category: toCategory(rec.category),
    description: rec.description,
    lat: rec.lat,
    lng: rec.lng,
  };

  if (rec.address) place.address = rec.address;
  if (rec.placeId) place.placeId = rec.placeId;
  if (rec.mapsUrl) place.mapsUrl = rec.mapsUrl;
  if (rec.mapsQuery) place.mapsQuery = rec.mapsQuery;
  if (typeof rec.rating === 'number') place.rating = rec.rating;
  if (typeof rec.googleRating === 'number') place.googleRating = rec.googleRating;
  // Always apply — Notion is source of truth (false clears local featured/favorite)
  place.favorite = rec.favorite === true;
  place.featured = rec.featured === true;
  if (rec.landmark) place.landmark = rec.landmark;
  if (rec.subcategories?.length) place.subcategories = rec.subcategories;
  if (rec.photos && rec.photos.length > 0) place.photos = rec.photos;

  return place;
}

/**
 * Merge Notion places into local cities.
 *
 * - Same `id`: Notion wins (Carol’s edit overrides local scaffold).
 * - Notion-only ids: appended to that city’s place list.
 * - Local-only ids: kept (until migrated / removed later).
 * - Unknown city slug in Notion: skipped with a console warning at build.
 */
export function mergeNotionPlaces<
  P extends {
    id: string;
    area?: unknown;
    routeStops?: unknown;
    landmark?: unknown;
    photos?: NotionPhoto[];
    visit?: unknown;
    subcategories?: unknown;
  },
  C extends NotionMergeCity<P>,
>(cities: C[]): C[] {
  const byCity = new Map<string, NotionPlaceRecord[]>();
  for (const rec of travelNotionSnapshot.places) {
    const citySlug = normalizeCitySlug(rec.city);
    const list = byCity.get(citySlug) ?? [];
    list.push({ ...rec, city: citySlug, category: normalizeCategorySlug(rec.category) });
    byCity.set(citySlug, list);
  }

  const knownSlugs = new Set(cities.map((c) => c.slug));
  for (const slug of byCity.keys()) {
    if (!knownSlugs.has(slug)) {
      console.warn(
        `[travel-notion] City "${slug}" has Notion places but no local TravelCity — skipped.`,
      );
    }
  }

  return cities.map((city) => {
    const notionForCity = byCity.get(city.slug);
    if (!notionForCity?.length) return city;

    const notionById = new Map(
      notionForCity.map((r) => [r.id, notionRecordToPlace(r)]),
    );
    const used = new Set<string>();

    const merged = city.places.map((local) => {
      const fromNotion = notionById.get(local.id);
      if (!fromNotion) return local;
      used.add(local.id);
      // Notion editorial fields win; keep local-only technical extras
      // (area, routeStops, landmark) that Notion does not own.
      return {
        ...local,
        ...fromNotion,
        // Keep geometry/route tech local when Notion has no override
        area: local.area,
        routeStops: local.routeStops,
        // Landmark / subcategories: Notion wins when set, else local
        landmark: fromNotion.landmark ?? local.landmark,
        subcategories: fromNotion.subcategories?.length
          ? fromNotion.subcategories
          : local.subcategories,
        // Prefer Notion photos (cover URL); fall back to local gallery
        photos: fromNotion.photos?.length ? fromNotion.photos : local.photos,
        visit: local.visit,
      } as P;
    });

    for (const [id, place] of notionById) {
      if (used.has(id)) continue;
      merged.push(place as unknown as P);
    }

    return { ...city, places: merged };
  });
}
