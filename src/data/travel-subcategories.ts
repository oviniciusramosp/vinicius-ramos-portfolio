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
  | 'hotel'
  // Commons food types (main category already says “Chains”)
  | 'burgers'
  | 'chicken'
  // Markets / shopping extras
  | 'market'
  | 'department'
  | 'mall';

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
    parents: ['parks', 'markets'],
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
    parents: ['transport', 'photo'],
  },
  shopping: {
    label: { en: 'Shopping', 'pt-BR': 'Compras' },
    parents: ['shopping', 'photo'],
  },
  hotel: {
    label: { en: 'Hotel', 'pt-BR': 'Hotel' },
    parents: ['lodging'],
  },
  burgers: {
    label: { en: 'Burgers', 'pt-BR': 'Burgers' },
    parents: ['commons', 'restaurants'],
  },
  chicken: {
    label: { en: 'Chicken', 'pt-BR': 'Frango' },
    parents: ['commons', 'restaurants'],
  },
  /** Covered market hall / marché */
  market: {
    label: { en: 'Market hall', 'pt-BR': 'Mercado coberto' },
    parents: ['markets'],
  },
  department: {
    label: { en: 'Department store', 'pt-BR': 'Grand magasin' },
    parents: ['shopping'],
  },
  mall: {
    label: { en: 'Mall', 'pt-BR': 'Shopping center' },
    parents: ['shopping'],
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
  'burgers',
  'chicken',
  'market',
  'department',
  'mall',
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
  'par-canals': ['avenue', 'park'],
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
  'par-michalak-etienne': ['pastry'],
  'par-bohemia': ['coffee-shop'],
  'par-amorino': ['ice-cream'],
  'par-jeffrey-cagnes': ['pastry'],
  'par-bakery-gaite': ['bakery'],
  'par-artizans': ['french', 'bistro'],

  // Parks & walks
  'par-champ-mars': ['park', 'garden'],
  'par-la-defense': ['architecture', 'neighborhood'],
  'par-paul-defense': ['bakery', 'coffee-shop'],
  'par-orly-m14': ['metro'],
  'par-orly-paul': ['bakery', 'coffee-shop'],
  'par-cdg-paul': ['bakery', 'coffee-shop'],
  'par-cdg-rer': ['metro'],
  'par-noisy-le-sec-rer': ['metro'],
  'par-grande-arche': ['architecture', 'viewpoint'],
  'par-esplanade-de-gaulle': ['architecture', 'viewpoint'],
  'par-monoprix-rivoli': ['market'],
  'par-tuileries': ['garden', 'park'],
  'par-orangerie': ['museum', 'architecture'],
  'par-luxor-obelisk': ['monument'],
  'par-champs-elysees': ['avenue'],
  'par-maison-balzac': ['museum'],
  'par-luxembourg': ['garden', 'park'],
  'par-sorbonne': ['neighborhood', 'architecture'],
  'par-cour-commerce': ['market-street', 'architecture'],
  'par-montmartre': ['neighborhood', 'viewpoint'],
  // Garden first (nature icon); palace buildings are the frame, not the pin
  'par-palais-royal': ['park', 'garden'],
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
  'par-fondation-lv': ['architecture', 'viewpoint'],
  'par-chateau-vincennes': ['castle', 'monument'],

  // Photo
  'par-trocadero': ['viewpoint', 'architecture'],
  'par-alexandre-iii': ['bridge', 'architecture'],
  'par-vendome': ['square', 'architecture'],
  'par-galeries-lafayette': ['department', 'architecture', 'viewpoint'],
  'par-printemps': ['department', 'architecture', 'viewpoint'],
  'par-bon-marche': ['department', 'architecture'],
  'par-forum-halles': ['mall'],
  'par-bhv-marais': ['department'],
  'par-shakespeare': ['coffee-shop', 'shopping'],
  'par-mcdonalds-champs': ['burgers'],
  'par-mcdonalds-disney': ['burgers'],
  'par-burger-king-opera': ['burgers'],
  'par-starbucks-opera': ['coffee-shop'],
  'par-five-guys-rivoli': ['burgers'],
  'par-kfc-les-halles': ['chicken'],
  'par-marche-enfants-rouges': ['market'],
  'par-marche-aligre': ['market'],
  'par-marche-bastille': ['market'],
  'par-rue-cler': ['market', 'market-street'],
  'par-place-dauphine': ['square'],
  'par-belleville': ['park', 'viewpoint'],
  'par-promenade-plantee': ['park', 'avenue'],
  'par-disneyland': ['park', 'show'],
  'par-bella-notte': ['italian'],
  'par-versailles': ['palace', 'monument', 'garden'],
  'par-saint-michel': ['square', 'architecture'],
  'par-hotel-ville': ['square', 'architecture'],
  'par-horloge': ['architecture', 'monument'],
  'par-metro-6': ['metro', 'viewpoint'],
  'par-metro-2': ['metro', 'viewpoint'],
};

/**
 * Rome place → subcategories (multi).
 * Merged by resolvePlaceSubcategories via the shared map lookup.
 */
export const romeSubcategoriesByPlaceId: Record<string, PlaceSubcategory[]> = {
  'rom-termini': ['metro'],
  'rom-gallina-bianca': ['italian'],
  'rom-alfredo-ada': ['italian'],
  'rom-antico-vinaio': ['italian', 'charcuterie'],
  'rom-baffetto': ['italian'],
  'rom-suppli': ['italian'],
  'rom-norcineria': ['italian', 'charcuterie', 'meat'],
  'rom-said': ['ice-cream'],
  'rom-forno-trevi': ['bakery', 'pastry', 'coffee-shop'],
  'rom-colosseum': ['monument'],
  'rom-forum': ['monument', 'architecture'],
  'rom-pantheon': ['monument', 'church', 'architecture'],
  'rom-piazza-venezia': ['square'],
  'rom-trevi': ['monument', 'viewpoint'],
  'rom-vatican': ['museum', 'palace'],
  'rom-sistine': ['church', 'museum'],
  'rom-st-peter': ['church', 'monument'],
  'rom-vittoriano': ['monument', 'viewpoint', 'architecture'],
  'rom-window-on-rome': ['hotel'],
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
  return normalizeSubcategories(
    parisSubcategoriesByPlaceId[placeId] ??
      romeSubcategoriesByPlaceId[placeId],
  );
}

/**
 * Material Symbols Rounded ligatures for map pin glyphs.
 * Used when the pin should reflect subcategory (parks / cafés), not just category.
 * @see https://fonts.google.com/icons?icon.style=Rounded
 */
export const subcategoryMaterialIcon: Partial<
  Record<PlaceSubcategory, string>
> = {
  // Cafés
  'coffee-shop': 'local_cafe',
  pastry: 'cookie',
  bakery: 'bakery_dining',
  'ice-cream': 'icecream',
  // Chains / commons food types (KFC uses burger glyph too — no chicken MS icon)
  burgers: 'lunch_dining',
  chicken: 'lunch_dining',
  // Parks & walks
  park: 'nature',
  garden: 'yard',
  neighborhood: 'holiday_village',
  avenue: 'directions_walk',
  square: 'nature',
  church: 'church',
  castle: 'castle',
  museum: 'museum',
  library: 'import_contacts',
  'market-street': 'nature',
  architecture: 'nature',
  bridge: 'bridge',
  viewpoint: 'visibility',
  show: 'theater_comedy',
  monument: 'account_balance',
  tower: 'apartment',
  palace: 'fort',
  boat: 'sailing',
  metro: 'subway',
  shopping: 'shopping_bag',
  market: 'storefront',
};

/**
 * When a place has several subcategories, pick the most distinctive pin glyph.
 * First match in this list wins (more specific → more generic).
 */
export const pinSubcategoryPriority: readonly PlaceSubcategory[] = [
  // Cafés / commons — shop types before generic coffee; bakery before pastry
  // so dual-tagged places (e.g. La Maison d'Isabelle) read as bakery
  'ice-cream',
  'burgers',
  'chicken',
  'bakery',
  'pastry',
  'coffee-shop',
  // Parks & walks — landmark-ish before generic park
  'library',
  'museum',
  'church',
  'castle',
  'palace',
  'monument',
  'tower',
  'boat',
  'show',
  'bridge',
  'viewpoint',
  'architecture',
  'market-street',
  'market',
  'metro',
  'shopping',
  'neighborhood',
  'avenue',
  'square',
  // park before garden so dual-tagged places (Monceau, Tuileries, …)
  // use nature, not yard
  'park',
  'garden',
] as const;

/**
 * Material ligature for the best pin subcategory among `subs`, or undefined.
 */
export function pinMaterialFromSubcategories(
  subs: readonly string[] | undefined | null,
): string | undefined {
  if (!subs?.length) return undefined;
  const set = new Set(subs.filter(isPlaceSubcategory));
  if (!set.size) return undefined;
  for (const id of pinSubcategoryPriority) {
    if (set.has(id)) {
      const name = subcategoryMaterialIcon[id];
      if (name) return name;
    }
  }
  for (const id of set) {
    const name = subcategoryMaterialIcon[id];
    if (name) return name;
  }
  return undefined;
}
