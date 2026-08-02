/**
 * Category visual language for /travel maps and UI tints.
 *
 * Icons: Google Material Symbols Rounded
 * https://fonts.google.com/icons?icon.style=Rounded
 * (loaded site-wide in BaseLayout).
 */

export type PlaceCategory =
  | 'airport'
  | 'parks'
  | 'cafes'
  | 'restaurants'
  | 'photo'
  | 'tourist'
  | 'lodging';

export type PlaceCategoryIcon =
  | 'dot'
  | 'plane'
  | 'walk'
  | 'coffee'
  | 'utensils'
  | 'camera'
  | 'star'
  | 'bed';

export type PlaceCategoryMeta = {
  color: string;
  icon: PlaceCategoryIcon;
};

export const placeCategoryMeta: Record<PlaceCategory, PlaceCategoryMeta> = {
  airport: { color: '#94a3b8', icon: 'plane' },
  parks: { color: '#34d399', icon: 'walk' },
  cafes: { color: '#a67c52', icon: 'coffee' },
  restaurants: { color: '#f97316', icon: 'utensils' },
  photo: { color: '#7dd3fc', icon: 'camera' },
  tourist: { color: '#f5c518', icon: 'star' },
  lodging: { color: '#a78bfa', icon: 'bed' },
};

export const placeCategoryOrder: PlaceCategory[] = [
  'airport',
  'parks',
  'cafes',
  'restaurants',
  'photo',
  'tourist',
  'lodging',
];

/**
 * Material Symbols Rounded ligature names
 * @see https://fonts.google.com/icons?icon.style=Rounded
 */
export const categoryMaterialIcon: Record<PlaceCategoryIcon, string> = {
  plane: 'flight',
  walk: 'directions_walk',
  coffee: 'local_cafe',
  utensils: 'restaurant',
  camera: 'photo_camera',
  star: 'star',
  bed: 'bed',
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
