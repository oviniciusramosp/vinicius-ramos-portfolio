/**
 * Place subcategories — free-form tags under a main category.
 * A place can have multiple; not all need to match the place.category parent
 * (e.g. a tourist church may also be tagged `church` used by walks).
 */

import type { PlaceCategory } from './travel-categories';

export type PlaceSubcategory =
  // Restaurants
  | 'italian'
  | 'french'
  | 'meat'
  | 'brasserie'
  | 'bistro'
  | 'creperie'
  | 'self-service'
  | 'seafood'
  | 'charcuterie'
  | 'bouillon'
  // Cafés
  | 'bakery'
  | 'pastry'
  | 'ice-cream'
  | 'coffee-shop'
  // Parks & walks
  | 'park'
  | 'garden'
  | 'neighborhood'
  | 'avenue'
  | 'square'
  | 'church'
  | 'castle'
  | 'museum'
  | 'library'
  | 'market-street'
  | 'architecture'
  // Tourist / landmarks
  | 'monument'
  | 'tower'
  | 'palace'
  | 'show'
  | 'boat'
  | 'viewpoint'
  // Photo
  | 'bridge'
  | 'metro'
  | 'shopping'
  // Lodging
  | 'hotel';

export type LString = { en: string; 'pt-BR': string };

export type PlaceSubcategoryMeta = {
  label: LString;
  /** Categories this tag is primarily for (UI grouping / future filters) */
  parents: PlaceCategory[];
};

export const placeSubcategoryMeta: Record<
  PlaceSubcategory,
  PlaceSubcategoryMeta
> = {
  italian: {
    label: { en: 'Italian', 'pt-BR': 'Italiano' },
    parents: ['restaurants'],
  },
  french: {
    label: { en: 'French', 'pt-BR': 'Francês' },
    parents: ['restaurants'],
  },
  meat: {
    label: { en: 'Meat', 'pt-BR': 'Carnes' },
    parents: ['restaurants'],
  },
  brasserie: {
    label: { en: 'Brasserie', 'pt-BR': 'Brasserie' },
    parents: ['restaurants'],
  },
  bistro: {
    label: { en: 'Bistro', 'pt-BR': 'Bistrô' },
    parents: ['restaurants'],
  },
  creperie: {
    label: { en: 'Crêperie', 'pt-BR': 'Creperia' },
    parents: ['restaurants'],
  },
  'self-service': {
    label: { en: 'Self-service', 'pt-BR': 'Self-service' },
    parents: ['restaurants'],
  },
  seafood: {
    label: { en: 'Seafood', 'pt-BR': 'Frutos do mar' },
    parents: ['restaurants'],
  },
  charcuterie: {
    label: { en: 'Charcuterie', 'pt-BR': 'Charcutaria' },
    parents: ['restaurants'],
  },
  bouillon: {
    label: { en: 'Bouillon', 'pt-BR': 'Bouillon' },
    parents: ['restaurants'],
  },
  bakery: {
    label: { en: 'Bakery', 'pt-BR': 'Padaria' },
    parents: ['cafes'],
  },
  pastry: {
    label: { en: 'Pastry', 'pt-BR': 'Confeitaria' },
    parents: ['cafes'],
  },
  'ice-cream': {
    label: { en: 'Ice cream', 'pt-BR': 'Sorveteria' },
    parents: ['cafes'],
  },
  'coffee-shop': {
    label: { en: 'Coffee shop', 'pt-BR': 'Cafeteria' },
    parents: ['cafes'],
  },
  park: {
    label: { en: 'Park', 'pt-BR': 'Parque' },
    parents: ['parks'],
  },
  garden: {
    label: { en: 'Garden', 'pt-BR': 'Jardim' },
    parents: ['parks'],
  },
  neighborhood: {
    label: { en: 'Neighborhood', 'pt-BR': 'Bairro' },
    parents: ['parks'],
  },
  avenue: {
    label: { en: 'Avenue', 'pt-BR': 'Avenida' },
    parents: ['parks'],
  },
  square: {
    label: { en: 'Square', 'pt-BR': 'Praça' },
    parents: ['parks', 'photo'],
  },
  church: {
    label: { en: 'Church', 'pt-BR': 'Igreja' },
    parents: ['parks', 'tourist'],
  },
  castle: {
    label: { en: 'Castle', 'pt-BR': 'Castelo' },
    parents: ['parks', 'tourist'],
  },
  museum: {
    label: { en: 'Museum', 'pt-BR': 'Museu' },
    parents: ['parks', 'tourist'],
  },
  library: {
    label: { en: 'Library', 'pt-BR': 'Biblioteca' },
    parents: ['parks'],
  },
  'market-street': {
    label: { en: 'Market street', 'pt-BR': 'Rua de comércio' },
    parents: ['parks'],
  },
  architecture: {
    label: { en: 'Architecture', 'pt-BR': 'Arquitetura' },
    parents: ['parks', 'photo', 'tourist'],
  },
  monument: {
    label: { en: 'Monument', 'pt-BR': 'Monumento' },
    parents: ['tourist'],
  },
  tower: {
    label: { en: 'Tower', 'pt-BR': 'Torre' },
    parents: ['tourist'],
  },
  palace: {
    label: { en: 'Palace', 'pt-BR': 'Palácio' },
    parents: ['tourist'],
  },
  show: {
    label: { en: 'Show', 'pt-BR': 'Espetáculo' },
    parents: ['tourist'],
  },
  boat: {
    label: { en: 'Boat', 'pt-BR': 'Barco' },
    parents: ['tourist'],
  },
  viewpoint: {
    label: { en: 'Viewpoint', 'pt-BR': 'Mirante' },
    parents: ['tourist', 'photo'],
  },
  bridge: {
    label: { en: 'Bridge', 'pt-BR': 'Ponte' },
    parents: ['photo', 'parks'],
  },
  metro: {
    label: { en: 'Metro', 'pt-BR': 'Metrô' },
    parents: ['photo'],
  },
  shopping: {
    label: { en: 'Shopping', 'pt-BR': 'Compras' },
    parents: ['photo'],
  },
  hotel: {
    label: { en: 'Hotel', 'pt-BR': 'Hotel' },
    parents: ['lodging'],
  },
};

/** Stable display order for chips */
export const placeSubcategoryOrder: PlaceSubcategory[] = [
  'italian',
  'french',
  'meat',
  'brasserie',
  'bistro',
  'creperie',
  'self-service',
  'seafood',
  'charcuterie',
  'bouillon',
  'bakery',
  'pastry',
  'ice-cream',
  'coffee-shop',
  'park',
  'garden',
  'neighborhood',
  'avenue',
  'square',
  'church',
  'castle',
  'museum',
  'library',
  'market-street',
  'architecture',
  'monument',
  'tower',
  'palace',
  'show',
  'boat',
  'viewpoint',
  'bridge',
  'metro',
  'shopping',
  'hotel',
];

/**
 * Paris place → subcategories (multi).
 * Place-level `subcategories` on TravelPlace override this map.
 * Do not mirror the main category (e.g. no `airport` sub for category Airport).
 */
export const parisSubcategoriesByPlaceId: Record<string, PlaceSubcategory[]> = {
  // Restaurants
  'par-felicita': ['self-service', 'italian'],
  'par-franklin-passy': ['french', 'brasserie'],
  'par-francette': ['french', 'bistro'],
  'par-creperie-arts': ['creperie', 'french'],
  'par-auptitgrec': ['french', 'bistro'],
  'par-procope': ['french', 'brasserie'],
  'par-brasserie-pres': ['brasserie', 'french'],
  'par-fric-frac': ['french', 'bistro'],
  'par-arnaud-nicolas': ['charcuterie', 'meat', 'french'],
  'par-bien-eleve': ['meat', 'french'],
  'par-entrecote': ['meat', 'french'],
  'par-chez-janou': ['french', 'bistro'],
  'par-chez-elo': ['french', 'bistro'],
  'par-canals': ['french', 'bistro'],
  'par-royal-cambronne': ['brasserie', 'french'],
  'par-bike': ['bouillon', 'french', 'self-service'],
  'par-train-bleu': ['french', 'brasserie'],

  // Cafés
  'par-bake-blend': ['bakery', 'coffee-shop'],
  'par-pierre-herme': ['pastry'],
  'par-cedric-grolet': ['pastry'],
  'par-eclair-genie': ['pastry'],
  'par-maison-isabelle': ['pastry', 'bakery'],
  'par-michalak': ['pastry'],
  'par-bohemia': ['coffee-shop'],
  'par-amorino': ['ice-cream'],
  'par-jeffrey-cagnes': ['pastry'],
  'par-bakery-gaite': ['bakery'],
  'par-maison-doucet': ['pastry', 'bakery'],

  // Parks & walks
  'par-champ-mars': ['park', 'garden'],
  'par-la-defense': ['architecture', 'neighborhood'],
  'par-tuileries': ['garden', 'park'],
  'par-champs-elysees': ['avenue'],
  'par-maison-balzac': ['museum'],
  'par-luxembourg': ['garden', 'park'],
  'par-sorbonne': ['neighborhood', 'architecture'],
  'par-cour-commerce': ['market-street', 'architecture'],
  'par-montmartre': ['neighborhood', 'viewpoint'],
  'par-palais-royal': ['garden', 'architecture'],
  'par-bnf': ['library', 'architecture'],
  'par-chatelet': ['square', 'neighborhood'],
  'par-saint-eustache': ['church', 'monument'],
  'par-montorgueil': ['market-street', 'neighborhood'],
  'par-monceau': ['park', 'garden'],
  'par-andre-citroen': ['park'],
  'par-buttes-chaumont': ['park'],
  'par-boulogne': ['park'],
  'par-serres-auteuil': ['square', 'garden'],
  'par-vosges': ['square', 'architecture'],
  'par-vincennes-town': ['neighborhood'],
  'par-vincennes': ['park'],
  'par-la-villette': ['park'],
  'par-marais': ['neighborhood', 'architecture', 'market-street'],

  // Tourist
  'par-eiffel': ['monument', 'tower', 'viewpoint'],
  'par-louvre': ['museum', 'palace'],
  'par-arc-triomphe': ['monument', 'viewpoint'],
  'par-invalides': ['monument', 'museum', 'palace'],
  'par-palais': ['museum', 'palace', 'architecture'],
  'par-opera': ['monument', 'architecture', 'show'],
  'par-pantheon': ['monument', 'architecture'],
  'par-notre-dame': ['church', 'monument'],
  'par-sainte-chapelle': ['church', 'monument'],
  'par-sacre-coeur': ['church', 'monument', 'viewpoint'],
  'par-moulin-rouge': ['show'],
  'par-bateaux-mouches': ['boat'],
  'par-pompidou': ['museum', 'architecture'],
  'par-madeleine': ['church', 'monument'],
  'par-montparnasse': ['tower', 'viewpoint'],
  'par-fondation-lv': ['museum', 'architecture'],
  'par-chateau-vincennes': ['castle', 'monument'],

  // Photo
  'par-trocadero': ['viewpoint', 'architecture'],
  'par-alexandre-iii': ['bridge', 'architecture'],
  'par-vendome': ['square', 'architecture'],
  'par-galeries-lafayette': ['shopping', 'architecture', 'viewpoint'],
  'par-printemps': ['shopping', 'architecture', 'viewpoint'],
  'par-saint-michel': ['square', 'architecture'],
  'par-hotel-ville': ['square', 'architecture'],
  'par-horloge': ['architecture', 'monument'],
  'par-metro-6': ['metro', 'viewpoint'],
  'par-metro-2': ['metro', 'viewpoint'],
};

export function isPlaceSubcategory(id: string): id is PlaceSubcategory {
  return id in placeSubcategoryMeta;
}

export function subcategoryLabel(
  id: PlaceSubcategory,
  locale: 'en' | 'pt-BR' = 'en',
): string {
  return placeSubcategoryMeta[id].label[locale] ?? placeSubcategoryMeta[id].label.en;
}

/** Sort + dedupe subcategories by placeSubcategoryOrder */
export function normalizeSubcategories(
  list: PlaceSubcategory[] | undefined,
): PlaceSubcategory[] {
  if (!list?.length) return [];
  const set = new Set(list.filter(isPlaceSubcategory));
  return placeSubcategoryOrder.filter((id) => set.has(id));
}

export function resolvePlaceSubcategories(
  placeId: string,
  authored?: PlaceSubcategory[],
): PlaceSubcategory[] {
  if (authored && authored.length > 0) {
    return normalizeSubcategories(authored);
  }
  return normalizeSubcategories(parisSubcategoriesByPlaceId[placeId]);
}
