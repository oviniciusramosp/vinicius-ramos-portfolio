/**
 * Category visual language for /travel maps and UI tints.
 *
 * Icons: Google Material Symbols Rounded
 * https://fonts.google.com/icons?icon.style=Rounded
 * (loaded site-wide in BaseLayout).
 */

import { pinMaterialFromSubcategories } from './travel-subcategories';

export type PlaceCategory =
  | 'airport'
  /** Stations, metro stops, pure transit waypoints (not scenic rides) */
  | 'transport'
  | 'parks'
  | 'cafes'
  | 'restaurants'
  | 'photo'
  | 'tourist'
  | 'lodging'
  /** Global chains (McDonald’s, Burger King, Starbucks, …) */
  | 'commons'
  /** Covered / street markets */
  | 'markets'
  /** Department stores, malls, famous shops */
  | 'shopping';

export type PlaceCategoryIcon =
  | 'dot'
  | 'plane'
  | 'train'
  | 'walk'
  | 'nature'
  | 'coffee'
  | 'utensils'
  | 'camera'
  | 'star'
  | 'bed'
  | 'fastfood'
  | 'market'
  | 'bag';

export type PlaceCategoryMeta = {
  color: string;
  icon: PlaceCategoryIcon;
};

export const placeCategoryMeta: Record<PlaceCategory, PlaceCategoryMeta> = {
  airport: { color: '#94a3b8', icon: 'plane' },
  /** Steel blue — transit only (vs scenic metro under photo) */
  transport: { color: '#64748b', icon: 'train' },
  parks: { color: '#34d399', icon: 'nature' },
  /** Deep cocoa — distinct from tourist gold and market teal */
  cafes: { color: '#8b5e3c', icon: 'coffee' },
  restaurants: { color: '#f97316', icon: 'utensils' },
  /** Same orange as restaurants (chains are still restaurants) */
  commons: { color: '#f97316', icon: 'fastfood' },
  /** Teal — reads clear vs cafés brown and tourist gold */
  markets: { color: '#14b8a6', icon: 'market' },
  shopping: { color: '#e879f9', icon: 'bag' },
  photo: { color: '#7dd3fc', icon: 'camera' },
  /** Bright gold, reserved for landmarks */
  tourist: { color: '#facc15', icon: 'star' },
  lodging: { color: '#a78bfa', icon: 'bed' },
};

/** Categories off by default on city filters (user opts in). */
export const placeCategoriesOffByDefault: ReadonlySet<PlaceCategory> = new Set([
  'commons',
  'markets',
]);

export const placeCategoryOrder: PlaceCategory[] = [
  'parks',
  'cafes',
  'restaurants',
  'commons',
  'markets',
  'shopping',
  'photo',
  'tourist',
  'lodging',
  // Transit last — practical, not the main browse focus
  'airport',
  'transport',
];

/**
 * Material Symbols Rounded ligature names
 * @see https://fonts.google.com/icons?icon.style=Rounded
 */
export const categoryMaterialIcon: Record<PlaceCategoryIcon, string> = {
  plane: 'flight',
  train: 'train',
  walk: 'directions_walk',
  nature: 'nature',
  coffee: 'local_cafe',
  utensils: 'restaurant',
  camera: 'photo_camera',
  star: 'star',
  bed: 'bed',
  fastfood: 'lunch_dining',
  market: 'storefront',
  bag: 'shopping_bag',
  dot: '',
};

/** Open in Google Maps — Material Symbols Rounded (location_on, FILL) */
export const MAPS_MATERIAL_ICON = 'location_on';

export function categoryColor(
  category: PlaceCategory | string | undefined,
): string {
  if (category && category in placeCategoryMeta) {
    return placeCategoryMeta[category as PlaceCategory].color;
  }
  return '#008fff';
}

export function categoryIcon(
  category: PlaceCategory | string | undefined,
): PlaceCategoryIcon {
  if (category && category in placeCategoryMeta) {
    return placeCategoryMeta[category as PlaceCategory].icon;
  }
  return 'dot';
}

/** Material Symbols ligature for a category (empty if none). */
export function categoryMaterialName(
  category: PlaceCategory | string | undefined,
): string {
  const icon = categoryIcon(category);
  return categoryMaterialIcon[icon] || '';
}

/**
 * Markup for map pins / tags:
 * `<span class="material-symbols-rounded">flight</span>`
 */
export function categoryIconHtml(
  category: PlaceCategory | string | undefined,
): string {
  const name = categoryMaterialName(category);
  if (!name) return '';
  return materialIconHtml(name);
}

/**
 * Categories whose map dots use subcategory glyphs (not the parent category icon).
 * Parks & walks, Cafés, and Chains/Commons (burgers / chicken / coffee).
 */
export const CATEGORIES_WITH_SUBCATEGORY_PIN_ICONS: ReadonlySet<string> =
  new Set(['parks', 'cafes', 'commons']);

/**
 * Material ligature for a place pin: subcategory when enabled, else category.
 */
export function placePinMaterialName(
  category: PlaceCategory | string | undefined,
  subcategories?: readonly string[] | null,
): string {
  if (
    category &&
    CATEGORIES_WITH_SUBCATEGORY_PIN_ICONS.has(category) &&
    subcategories?.length
  ) {
    const fromSub = pinMaterialFromSubcategories(subcategories);
    if (fromSub) return fromSub;
  }
  return categoryMaterialName(category);
}

/**
 * Markup for place map/itinerary dots (subcategory-aware for parks, cafés, commons).
 */
export function placePinIconHtml(
  category: PlaceCategory | string | undefined,
  subcategories?: readonly string[] | null,
): string {
  const name = placePinMaterialName(category, subcategories);
  if (!name) return '';
  return materialIconHtml(name);
}

export function materialIconHtml(name: string): string {
  return (
    `<span class="material-symbols-rounded" aria-hidden="true">${name}</span>`
  );
}

export function mapsIconHtml(): string {
  return materialIconHtml(MAPS_MATERIAL_ICON);
}

/** @deprecated */
export const categoryIconSvg = categoryIconHtml;
export const categoryIonName = categoryMaterialName;
export const categoryIonIconName = categoryMaterialIcon;
