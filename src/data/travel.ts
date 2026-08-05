/**
 * Travel section data: cities, places, and bilingual UI copy (en / pt-BR).
 * Locale is resolved on the client from navigator.language.
 */

import {
  placeCategoryOrder,
  type PlaceCategory,
} from './travel-categories';

export type { PlaceCategory, PlaceCategoryIcon, PlaceCategoryMeta } from './travel-categories';
export {
  placeCategoryMeta,
  placeCategoryOrder,
  categoryColor,
  categoryIcon,
  categoryIconHtml,
  placePinIconHtml,
  placePinMaterialName,
} from './travel-categories';

import { areaForPlace } from './travel-areas-osm';
import {
  resolveVisit,
  type VisitInfo,
} from './travel-visit';
import {
  photosForPlaceId,
  type TravelPhoto,
} from './travel-photos';
import {
  resolvePlaceSubcategories,
  type PlaceSubcategory,
} from './travel-subcategories';
import { mergeNotionPlaces } from './travel-notion';

export type { TravelPhoto } from './travel-photos';
export type {
  PlaceSubcategory,
  PlaceSubcategoryMeta,
} from './travel-subcategories';
export {
  placeSubcategoryMeta,
  placeSubcategoryOrder,
  subcategoryLabel,
  normalizeSubcategories,
  resolvePlaceSubcategories,
} from './travel-subcategories';
export type {
  VisitInfo,
  MoneyInfo,
  CrowdProfile,
  PriceLevel,
  TicketPromo,
  TicketPromoKind,
  MonthIndex,
} from './travel-visit';
export {
  formatMoney,
  formatMoneyTypical,
  formatDuration,
  formatTicketPromo,
  priceLevelFromMoney,
  visitFieldsForDisplay,
  resolveVisit,
} from './travel-visit';
export type {
  TravelItinerary,
  ItineraryDay,
  ItineraryStop,
  ItinerarySlot,
} from './travel-itineraries';
export {
  itineraryForCity,
  dayRoutePlaceIds,
  dayPrimaryRoutePlaceIds,
  computeDayBudget,
  computeTripBudget,
  moneyTypicalEur,
  parisItinerary,
} from './travel-itineraries';
export type { DayBudget } from './travel-itineraries';

export type Locale = 'en' | 'pt-BR';

export type LString = Record<Locale, string>;

/**
 * Leaflet-order coordinate: [latitude, longitude].
 * Used for map areas (parks, neighborhoods, avenues).
 */
export type LatLngPoint = [number, number];

/**
 * Region drawn on the city map (hover highlights the whole shape).
 * - polygon: filled park / neighborhood / block
 * - polyline: avenue, bridge, waterfront walk
 */
export type TravelArea =
  | {
      kind: 'polygon';
      /** Outer ring in [lat, lng] order (need not be closed) */
      path: LatLngPoint[];
    }
  | {
      kind: 'polyline';
      path: LatLngPoint[];
    }
  | {
      kind: 'multipolygon';
      /** Multiple outer rings (e.g. Petit + Grand Palais) */
      paths: LatLngPoint[][];
    };

/** Station / waypoint along a route (e.g. metro line) — shown on hover with the line */
export type TravelRouteStop = {
  name: LString;
  lat: number;
  lng: number;
};

/**
 * Landmark map markers — always show a distinctive icon (not a category dot).
 * Mirrors how Google Maps treats major tourist monuments.
 */
export type TravelLandmark =
  | 'eiffel'
  | 'arc'
  | 'notre-dame'
  | 'sacre-coeur'
  | 'louvre'
  | 'opera'
  | 'pompidou'
  | 'montparnasse'
  | 'monument';

/**
 * Axis-aligned box around a center.
 * @deprecated Temporary scaffold only — tests fail if this ships without an
 * OSM override in travel-areas-osm.ts. Prefer `npm run travel:areas`.
 */
export function areaBox(
  lat: number,
  lng: number,
  dLat: number,
  dLng: number,
): TravelArea {
  return {
    kind: 'polygon',
    path: [
      [lat - dLat, lng - dLng],
      [lat - dLat, lng + dLng],
      [lat + dLat, lng + dLng],
      [lat + dLat, lng - dLng],
    ],
  };
}

export interface TravelPlace {
  id: string;
  name: LString;
  category: PlaceCategory;
  /**
   * Optional tags under the main category (multi).
   * e.g. restaurants → italian, meat; parks → church, museum.
   * When omitted, may resolve from curated parisSubcategoriesByPlaceId.
   */
  subcategories?: PlaceSubcategory[];
  description: LString;
  /**
   * Personal rating 1–5 (halves ok). Omit → empty outlined gray stars in UI.
   */
  rating?: number;
  /**
   * Google Maps rating 1–5 (halves ok). Omit → empty outlined gray stars.
   */
  googleRating?: number;
  /**
   * Personal pick — heart next to the name on the detail card.
   * Prefer these when an LLM / planner builds itineraries.
   */
  favorite?: boolean;
  /** Anchor point (pin). Prefer place centroid when `area` is set. */
  lat: number;
  lng: number;
  /**
   * Optional region. On hover (card or pin), the full shape is highlighted
   * instead of only the point — parks, neighborhoods, avenues, etc.
   */
  area?: TravelArea;
  /**
   * Stops along a route polyline (metro stations, etc.).
   * Rendered as small markers when the place is hovered — not as separate places.
   */
  routeStops?: TravelRouteStop[];
  /**
   * Famous landmark map icon (Google Maps style), always visible — not a plain dot.
   * e.g. eiffel, arc, notre-dame, sacre-coeur, louvre
   */
  landmark?: TravelLandmark;
  /** Emphasize on the map (larger pin / stronger glow) — e.g. ORY */
  featured?: boolean;
  /**
   * Human-readable street / area address (optional, shown + used in Maps search).
   * Example: "Rua da Cantareira, 306 - Centro Histórico, São Paulo"
   */
  address?: string;
  /**
   * Google Maps search query (place name + city). Prefer this when no placeId.
   * Example: "Mercado Municipal de São Paulo"
   */
  mapsQuery?: string;
  /**
   * Google Place ID when known (most precise deep link).
   * Find via Google Maps share URL or Places API.
   */
  placeId?: string;
  /** Full Google Maps URL override (wins over placeId / mapsQuery / coords) */
  mapsUrl?: string;
  /**
   * Gallery images (cover = first). Absolute https URLs.
   * Prefer curated list in travel-photos.ts; place-level overrides that list.
   * Note: official Google Place Photos need Places API key + billing.
   */
  photos?: TravelPhoto[];
  /**
   * Visit logistics: avg meal price, ticket, duration, best time/day, tips.
   * When omitted, may still resolve from curated `visitByPlaceId` data.
   */
  visit?: VisitInfo;
}

export interface TravelCity {
  slug: string;
  name: LString;
  /** State / region code when useful (SP, NY, FL) */
  region?: string;
  country: LString;
  /** Stable filter key (country), used by chips */
  countryKey: 'brasil' | 'usa' | 'franca' | 'portugal' | 'italia';
  lat: number;
  lng: number;
  /** Default map zoom for city page */
  zoom: number;
  places: TravelPlace[];
}

export const travelUi = {
  title: { en: 'Travel', 'pt-BR': 'Viagens' } satisfies LString,
  subtitle: {
    en: 'Cities I have been, and places worth knowing.',
    'pt-BR': 'Cidades que visitei e lugares que valem a pena.',
  } satisfies LString,
  searchPlaceholder: {
    en: 'Search cities…',
    'pt-BR': 'Buscar cidades…',
  } satisfies LString,
  filterAll: { en: 'All', 'pt-BR': 'Todas' } satisfies LString,
  empty: {
    en: 'No cities match your search.',
    'pt-BR': 'Nenhuma cidade encontrada.',
  } satisfies LString,
  emptyPlaces: {
    en: 'No places match your search.',
    'pt-BR': 'Nenhum lugar encontrado.',
  } satisfies LString,
  placesTitle: {
    en: 'Places to visit',
    'pt-BR': 'Lugares para conhecer',
  } satisfies LString,
  back: { en: 'Travel/', 'pt-BR': 'Travel/' } satisfies LString,
  ratingLabel: { en: 'Rating', 'pt-BR': 'Nota' } satisfies LString,
  ratingGoogle: { en: 'Google', 'pt-BR': 'Google' } satisfies LString,
  ratingMine: { en: 'Mine', 'pt-BR': 'Minha' } satisfies LString,
  favorite: { en: 'Favorite', 'pt-BR': 'Favorito' } satisfies LString,
  openInMaps: {
    en: 'Open in Google Maps',
    'pt-BR': 'Abrir no Google Maps',
  } satisfies LString,
  addToRoute: {
    en: 'Add to route',
    'pt-BR': 'Adicionar à rota',
  } satisfies LString,
  removeFromRoute: {
    en: 'Remove from route',
    'pt-BR': 'Remover da rota',
  } satisfies LString,
  routeTitle: {
    en: 'Route',
    'pt-BR': 'Rota',
  } satisfies LString,
  routeWalk: {
    en: 'Walk',
    'pt-BR': 'A pé',
  } satisfies LString,
  routeTransit: {
    en: 'Transit',
    'pt-BR': 'Transporte',
  } satisfies LString,
  routeOpenGoogle: {
    en: 'Open route in Google Maps',
    'pt-BR': 'Abrir rota no Google Maps',
  } satisfies LString,
  routeNeedStops: {
    en: 'Add at least 2 places',
    'pt-BR': 'Adicione pelo menos 2 lugares',
  } satisfies LString,
  routeLoading: {
    en: 'Calculating…',
    'pt-BR': 'Calculando…',
  } satisfies LString,
  routeError: {
    en: 'Could not preview walking route',
    'pt-BR': 'Não foi possível pré-visualizar a rota a pé',
  } satisfies LString,
  routeTransitHint: {
    en: 'Transit times open in Google Maps',
    'pt-BR': 'Horários de transporte abrem no Google Maps',
  } satisfies LString,
  routeClear: {
    en: 'Clear route',
    'pt-BR': 'Limpar rota',
  } satisfies LString,
  routePreviewLabel: {
    en: 'Walking preview',
    'pt-BR': 'Prévia a pé',
  } satisfies LString,
  myLocation: {
    en: 'My location',
    'pt-BR': 'Minha localização',
  } satisfies LString,
  locateMe: {
    en: 'Show my location',
    'pt-BR': 'Mostrar minha localização',
  } satisfies LString,
  startFromMyLocation: {
    en: 'Start from my location',
    'pt-BR': 'Começar da minha localização',
  } satisfies LString,
  locating: {
    en: 'Finding your location…',
    'pt-BR': 'Localizando…',
  } satisfies LString,
  locateDenied: {
    en: 'Location permission denied',
    'pt-BR': 'Permissão de localização negada',
  } satisfies LString,
  locateUnavailable: {
    en: 'Could not get your location',
    'pt-BR': 'Não foi possível obter sua localização',
  } satisfies LString,
  locateFar: {
    en: 'You seem far from this city. Walking routes may not make sense here.',
    'pt-BR':
      'Você parece estar longe desta cidade. Rotas a pé podem não fazer sentido aqui.',
  } satisfies LString,
  address: {
    en: 'Address',
    'pt-BR': 'Endereço',
  } satisfies LString,
  collapseAll: {
    en: 'Collapse all',
    'pt-BR': 'Recolher tudo',
  } satisfies LString,
  expandAll: {
    en: 'Expand all',
    'pt-BR': 'Expandir tudo',
  } satisfies LString,
  filterCategories: {
    en: 'Filter categories',
    'pt-BR': 'Filtrar categorias',
  } satisfies LString,
  viewModeGroup: {
    en: 'Place list layout',
    'pt-BR': 'Layout da lista de lugares',
  } satisfies LString,
  viewList: {
    en: 'List',
    'pt-BR': 'Lista',
  } satisfies LString,
  viewItinerary: {
    en: 'Itinerary',
    'pt-BR': 'Roteiro',
  } satisfies LString,
  itineraryEmpty: {
    en: 'Day-by-day itinerary for this city is coming soon.',
    'pt-BR': 'Roteiro dia a dia desta cidade em breve.',
  } satisfies LString,
  itineraryShowRoute: {
    en: 'Show day on map',
    'pt-BR': 'Ver dia no mapa',
  } satisfies LString,
  itineraryOnMap: {
    en: 'On map',
    'pt-BR': 'No mapa',
  } satisfies LString,
  itineraryOpenGoogleMaps: {
    en: 'Open full day in Google Maps',
    'pt-BR': 'Abrir o dia inteiro no Google Maps',
  } satisfies LString,
  itineraryOpenGoogleMapsPeriod: {
    en: 'Open this period in Google Maps',
    'pt-BR': 'Abrir este período no Google Maps',
  } satisfies LString,
  itinerarySlotOnMap: {
    en: 'Show this period on the map',
    'pt-BR': 'Mostrar este período no mapa',
  } satisfies LString,
  itinerarySlotOffMap: {
    en: 'Hide this period from the map',
    'pt-BR': 'Ocultar este período do mapa',
  } satisfies LString,
  itineraryStops: {
    en: 'stops',
    'pt-BR': 'paradas',
  } satisfies LString,
  itineraryDay: {
    en: 'Day',
    'pt-BR': 'Dia',
  } satisfies LString,
  itineraryMorning: {
    en: 'Morning',
    'pt-BR': 'Manhã',
  } satisfies LString,
  itineraryAfternoon: {
    en: 'Afternoon',
    'pt-BR': 'Tarde',
  } satisfies LString,
  itineraryEvening: {
    en: 'Evening',
    'pt-BR': 'Noite',
  } satisfies LString,
  itineraryOptional: {
    en: 'Optional',
    'pt-BR': 'Opcional',
  } satisfies LString,
  itineraryFood: {
    en: 'Food / person',
    'pt-BR': 'Comida / pessoa',
  } satisfies LString,
  itineraryParks: {
    en: 'Tickets / person',
    'pt-BR': 'Ingressos / pessoa',
  } satisfies LString,
  /** Suffix after budget amount on day cards (e.g. "€42 / person") */
  itineraryPerPerson: {
    en: '/ person',
    'pt-BR': '/ pessoa',
  } satisfies LString,
  itineraryBudgetGroup: {
    en: 'Estimated budget per person',
    'pt-BR': 'Orçamento estimado por pessoa',
  } satisfies LString,
  itineraryTripBudgetGroup: {
    en: 'Total estimated budget for the trip (per person)',
    'pt-BR': 'Orçamento total estimado da viagem (por pessoa)',
  } satisfies LString,
  itineraryArrivalAirport: {
    en: 'Arrival airport',
    'pt-BR': 'Aeroporto de chegada',
  } satisfies LString,
  mapAria: {
    en: 'Interactive map of visited cities',
    'pt-BR': 'Mapa interativo das cidades visitadas',
  } satisfies LString,
  cityMapAria: {
    en: 'Map of places in this city',
    'pt-BR': 'Mapa de lugares nesta cidade',
  } satisfies LString,
  themeLight: {
    en: 'Switch to light mode',
    'pt-BR': 'Mudar para modo claro',
  } satisfies LString,
  themeDark: {
    en: 'Switch to dark mode',
    'pt-BR': 'Mudar para modo escuro',
  } satisfies LString,
  langGroup: {
    en: 'Language',
    'pt-BR': 'Idioma',
  } satisfies LString,
  langEn: {
    en: 'English',
    'pt-BR': 'Inglês',
  } satisfies LString,
  langPt: {
    en: 'Portuguese',
    'pt-BR': 'Português',
  } satisfies LString,
  closePanel: {
    en: 'Close place details',
    'pt-BR': 'Fechar detalhes do lugar',
  } satisfies LString,
  collapseSidebar: {
    en: 'Collapse sidebar',
    'pt-BR': 'Recolher painel',
  } satisfies LString,
  expandSidebar: {
    en: 'Expand sidebar',
    'pt-BR': 'Expandir painel',
  } satisfies LString,
  fullscreenEnter: {
    en: 'View map fullscreen',
    'pt-BR': 'Ver mapa em tela cheia',
  } satisfies LString,
  fullscreenExit: {
    en: 'Exit fullscreen',
    'pt-BR': 'Sair da tela cheia',
  } satisfies LString,
  countries: {
    brasil: { en: 'Brazil', 'pt-BR': 'Brasil' },
    usa: { en: 'USA', 'pt-BR': 'EUA' },
    franca: { en: 'France', 'pt-BR': 'França' },
    portugal: { en: 'Portugal', 'pt-BR': 'Portugal' },
    italia: { en: 'Italy', 'pt-BR': 'Itália' },
  } satisfies Record<TravelCity['countryKey'], LString>,
  categories: {
    airport: { en: 'Airport', 'pt-BR': 'Aeroporto' },
    transport: { en: 'Transport', 'pt-BR': 'Transporte' },
    parks: { en: 'Parks & walks', 'pt-BR': 'Parques e Passeios' },
    cafes: { en: 'Cafés', 'pt-BR': 'Cafés' },
    restaurants: { en: 'Restaurants', 'pt-BR': 'Restaurantes' },
    commons: { en: 'Chains', 'pt-BR': 'Comuns' },
    markets: { en: 'Markets', 'pt-BR': 'Mercados' },
    shopping: { en: 'Shopping', 'pt-BR': 'Compras' },
    photo: { en: 'Photo spot', 'pt-BR': 'Ponto para Foto' },
    tourist: { en: 'Tourist spots', 'pt-BR': 'Pontos Turísticos' },
    lodging: { en: 'Stay', 'pt-BR': 'Hospedagem' },
  } satisfies Record<PlaceCategory, LString>,
  visit: {
    avgPrice: {
      en: 'Price / person',
      'pt-BR': 'Preço / pessoa',
    },
    pricePerNight: {
      en: 'Price / night',
      'pt-BR': 'Preço / noite',
    },
    ticket: {
      en: 'Ticket',
      'pt-BR': 'Ingresso',
    },
    duration: {
      en: 'Duration',
      'pt-BR': 'Duração',
    },
    bestTime: {
      en: 'Best time',
      'pt-BR': 'Melhor horário',
    },
    bestDay: {
      en: 'Best day',
      'pt-BR': 'Melhor dia',
    },
    tips: {
      en: 'Tips',
      'pt-BR': 'Dicas',
    },
    liveOpen: {
      en: 'Open now',
      'pt-BR': 'Aberto agora',
    },
    liveClosed: {
      en: 'Closed now',
      'pt-BR': 'Fechado agora',
    },
    ticketLink: {
      en: 'Check tickets',
      'pt-BR': 'Ver ingressos',
    },
    ticketPromos: {
      en: 'Free / deals',
      'pt-BR': 'Grátis / promoções',
    },
    priceNote: {
      en: 'Approx. adult price — confirm on official site',
      'pt-BR': 'Preço adulto aprox. — confirme no site oficial',
    },
  },
} as const;

/** Country filter chip order on the index */
export const travelCountryKeys: TravelCity['countryKey'][] = [
  'brasil',
  'usa',
  'franca',
  'italia',
  'portugal',
];

/** Categories present in a city, sorted by placeCategoryOrder */
export function cityCategoryKeys(city: TravelCity): PlaceCategory[] {
  const present = new Set(city.places.map((p) => p.category));
  return placeCategoryOrder.filter((k) => present.has(k));
}

/**
 * Local city shells + places authored in-repo.
 * Editorial place content prefers Notion (see mergeNotionPlaces / travel-notion.generated.ts).
 */
const localTravelCities: TravelCity[] = [
  {
    slug: 'sao-paulo',
    name: { en: 'São Paulo', 'pt-BR': 'São Paulo' },
    region: 'SP',
    country: { en: 'Brazil', 'pt-BR': 'Brasil' },
    countryKey: 'brasil',
    lat: -23.5505,
    lng: -46.6333,
    zoom: 12,
    places: [
      {
        id: 'sp-gru',
        name: {
          en: 'Guarulhos Airport (GRU)',
          'pt-BR': 'Aeroporto de Guarulhos (GRU)',
        },
        category: 'airport',
        description: {
          en: 'Main international gateway to São Paulo.',
          'pt-BR': 'Principal porta de entrada internacional de São Paulo.',
        },
        googleRating: 4.3,
        lat: -23.4356,
        lng: -46.4731,
        address: 'Rod. Hélio Smidt, s/n - Cumbica, Guarulhos - SP',
        mapsQuery: 'Aeroporto Internacional de São Paulo Guarulhos GRU',
      },
      {
        id: 'sp-mercado-municipal',
        name: { en: 'Municipal Market', 'pt-BR': 'Mercado Municipal' },
        category: 'restaurants',
        description: {
          en: 'Iconic food hall. Try the mortadella sandwich and fresh juice upstairs.',
          'pt-BR': 'Templo da comida paulistana. Vale o sanduíche de mortadela e o suco no mezanino.',
        },
        googleRating: 4.5,
        lat: -23.5416,
        lng: -46.6295,
        address: 'Rua da Cantareira, 306 - Centro Histórico, São Paulo - SP',
        mapsQuery: 'Mercado Municipal de São Paulo',
      },
      {
        id: 'sp-pinacoteca',
        name: { en: 'Pinacoteca', 'pt-BR': 'Pinacoteca' },
        category: 'tourist',
        description: {
          en: 'One of the best Brazilian art museums, next to Luz station.',
          'pt-BR': 'Um dos melhores museus de arte do Brasil, ao lado da Estação da Luz.',
        },
        googleRating: 4.8,
        lat: -23.5346,
        lng: -46.6339,
        address: 'Praça da Luz, 2 - Luz, São Paulo - SP',
        mapsQuery: 'Pinacoteca do Estado de São Paulo',
      },
      {
        id: 'sp-ibirapuera',
        name: { en: 'Ibirapuera Park', 'pt-BR': 'Parque Ibirapuera' },
        category: 'parks',
        description: {
          en: 'The city lungs: museums, lakes, and long walks under the trees.',
          'pt-BR': 'O pulmão da cidade: museus, lagos e caminhadas longas sob as árvores.',
        },
        googleRating: 4.8,
        lat: -23.5874,
        lng: -46.6576,
        area: areaBox(-23.5874, -46.6576, 0.012, 0.014),
        address: 'Av. Pedro Álvares Cabral - Vila Mariana, São Paulo - SP',
        mapsQuery: 'Parque Ibirapuera São Paulo',
      },
      {
        id: 'sp-liberdade',
        name: { en: 'Liberdade', 'pt-BR': 'Liberdade' },
        category: 'tourist',
        description: {
          en: 'Asian neighborhood with street food, gates, and weekend markets.',
          'pt-BR': 'Bairro asiático com comida de rua, portões e feiras de fim de semana.',
        },
        lat: -23.5587,
        lng: -46.635,
        area: areaBox(-23.5587, -46.635, 0.006, 0.007),
        address: 'Praça da Liberdade - Liberdade, São Paulo - SP',
        mapsQuery: 'Bairro da Liberdade São Paulo',
      },
    ],
  },
  {
    slug: 'florianopolis',
    name: { en: 'Florianópolis', 'pt-BR': 'Florianópolis' },
    region: 'SC',
    country: { en: 'Brazil', 'pt-BR': 'Brasil' },
    countryKey: 'brasil',
    lat: -27.5954,
    lng: -48.548,
    zoom: 11,
    places: [
      {
        id: 'floripa-fln',
        name: {
          en: 'Hercílio Luz Airport (FLN)',
          'pt-BR': 'Aeroporto Hercílio Luz (FLN)',
        },
        category: 'airport',
        description: {
          en: 'Island arrival point, short hop to the lagoa and beaches.',
          'pt-BR': 'Chegada na ilha, a um pulo da lagoa e das praias.',
        },
        googleRating: 4.6,
        lat: -27.6703,
        lng: -48.5525,
        address: 'Av. Deputado Diomício Freitas, 3393 - Carianos, Florianópolis - SC',
        mapsQuery: 'Aeroporto Internacional de Florianópolis FLN',
      },
      {
        id: 'floripa-lagoa',
        name: {
          en: 'Lagoa da Conceição',
          'pt-BR': 'Lagoa da Conceição',
        },
        category: 'parks',
        description: {
          en: 'Lake life hub: bars, kitesurf, and sunset energy.',
          'pt-BR': 'Polo da vida na lagoa: bares, kitesurf e energia de fim de tarde.',
        },
        googleRating: 4.4,
        lat: -27.6035,
        lng: -48.463,
        area: areaBox(-27.6035, -48.463, 0.018, 0.022),
        address: 'Lagoa da Conceição, Florianópolis - SC',
        mapsQuery: 'Lagoa da Conceição Florianópolis',
      },
      {
        id: 'floripa-joaquina',
        name: { en: 'Joaquina Beach', 'pt-BR': 'Praia da Joaquina' },
        category: 'parks',
        description: {
          en: 'Surf beach with dunes and strong Atlantic waves.',
          'pt-BR': 'Praia de surf com dunas e ondas fortes do Atlântico.',
        },
        googleRating: 4.7,
        lat: -27.6286,
        lng: -48.4486,
        area: {
          kind: 'polyline',
          path: [
            [-27.622, -48.452],
            [-27.625, -48.45],
            [-27.6286, -48.4486],
            [-27.632, -48.447],
            [-27.636, -48.446],
          ],
        },
        address: 'Praia da Joaquina, Florianópolis - SC',
        mapsQuery: 'Praia da Joaquina Florianópolis',
      },
      {
        id: 'floripa-mercado-publico',
        name: { en: 'Public Market', 'pt-BR': 'Mercado Público' },
        category: 'restaurants',
        description: {
          en: 'Historic downtown market for oysters, craft, and local snacks.',
          'pt-BR': 'Mercado histórico do centro: ostras, artesanato e petiscos locais.',
        },
        googleRating: 4.5,
        lat: -27.5958,
        lng: -48.5534,
        address: 'Av. Paulo Fontes - Centro, Florianópolis - SC',
        mapsQuery: 'Mercado Público de Florianópolis',
      },
    ],
  },
  {
    slug: 'new-york',
    name: { en: 'New York', 'pt-BR': 'Nova York' },
    region: 'NY',
    country: { en: 'USA', 'pt-BR': 'EUA' },
    countryKey: 'usa',
    lat: 40.7128,
    lng: -74.006,
    zoom: 12,
    places: [
      {
        id: 'nyc-jfk',
        name: {
          en: 'JFK Airport',
          'pt-BR': 'Aeroporto JFK',
        },
        category: 'airport',
        description: {
          en: 'Primary long-haul airport for New York.',
          'pt-BR': 'Principal aeroporto de voos longos de Nova York.',
        },
        googleRating: 3.9,
        lat: 40.6413,
        lng: -73.7781,
        address: 'Queens, NY 11430, USA',
        mapsQuery: 'John F. Kennedy International Airport JFK',
      },
      {
        id: 'nyc-central-park',
        name: { en: 'Central Park', 'pt-BR': 'Central Park' },
        category: 'parks',
        description: {
          en: 'The classic green escape in the middle of Manhattan.',
          'pt-BR': 'O clássico refúgio verde no meio de Manhattan.',
        },
        googleRating: 4.8,
        lat: 40.7829,
        lng: -73.9654,
        // Rough rectangle of the park (N–S stretch)
        area: {
          kind: 'polygon',
          path: [
            [40.7681, -73.9819],
            [40.7681, -73.9491],
            [40.8006, -73.9491],
            [40.8006, -73.9582],
          ],
        },
        address: 'New York, NY 10024, USA',
        mapsQuery: 'Central Park New York',
      },
      {
        id: 'nyc-moma',
        name: { en: 'MoMA', 'pt-BR': 'MoMA' },
        category: 'tourist',
        description: {
          en: 'Modern art heavyweight. Go early and pick a floor.',
          'pt-BR': 'Peso-pesado da arte moderna. Chegue cedo e escolha um andar.',
        },
        googleRating: 4.6,
        lat: 40.7614,
        lng: -73.9776,
        address: '11 W 53rd St, New York, NY 10019, USA',
        mapsQuery: 'Museum of Modern Art MoMA New York',
      },
      {
        id: 'nyc-soho',
        name: { en: 'SoHo', 'pt-BR': 'SoHo' },
        category: 'tourist',
        description: {
          en: 'Cast-iron streets, boutiques, and gallery hopping.',
          'pt-BR': 'Ruas de ferro fundido, boutiques e galerias.',
        },
        googleRating: 4.6,
        lat: 40.7233,
        lng: -74.003,
        area: areaBox(40.7233, -74.003, 0.006, 0.008),
        address: 'SoHo, New York, NY, USA',
        mapsQuery: 'SoHo Manhattan New York',
      },
      {
        id: 'nyc-brooklyn-bridge',
        name: { en: 'Brooklyn Bridge', 'pt-BR': 'Ponte do Brooklyn' },
        category: 'tourist',
        description: {
          en: 'Walk the bridge at golden hour for the skyline payoff.',
          'pt-BR': 'Cruze a ponte no golden hour pela vista do skyline.',
        },
        googleRating: 4.8,
        lat: 40.7061,
        lng: -73.9969,
        area: {
          kind: 'polyline',
          path: [
            [40.7125, -74.005],
            [40.709, -74.001],
            [40.7061, -73.9969],
            [40.703, -73.993],
            [40.7005, -73.9895],
          ],
        },
        address: 'Brooklyn Bridge, New York, NY, USA',
        mapsQuery: 'Brooklyn Bridge New York',
      },
    ],
  },
  {
    slug: 'miami',
    name: { en: 'Miami', 'pt-BR': 'Miami' },
    region: 'FL',
    country: { en: 'USA', 'pt-BR': 'EUA' },
    countryKey: 'usa',
    lat: 25.7617,
    lng: -80.1918,
    zoom: 12,
    places: [
      {
        id: 'mia-mia',
        name: {
          en: 'Miami International Airport (MIA)',
          'pt-BR': 'Aeroporto Internacional de Miami (MIA)',
        },
        category: 'airport',
        description: {
          en: 'Hub for Latin America and the Caribbean.',
          'pt-BR': 'Hub para América Latina e Caribe.',
        },
        googleRating: 3.9,
        lat: 25.7959,
        lng: -80.287,
        address: '2100 NW 42nd Ave, Miami, FL 33126, USA',
        mapsQuery: 'Miami International Airport MIA',
      },
      {
        id: 'mia-south-beach',
        name: { en: 'South Beach', 'pt-BR': 'South Beach' },
        category: 'tourist',
        description: {
          en: 'Art Deco strip, beach days, and Ocean Drive energy.',
          'pt-BR': 'Faixa Art Déco, dias de praia e a energia da Ocean Drive.',
        },
        googleRating: 4.6,
        lat: 25.7826,
        lng: -80.1341,
        area: {
          kind: 'polyline',
          // Ocean Drive corridor (avenue-style highlight)
          path: [
            [25.7905, -80.1305],
            [25.7865, -80.1318],
            [25.7826, -80.1341],
            [25.778, -80.1365],
            [25.7735, -80.1388],
          ],
        },
        address: 'Ocean Drive, Miami Beach, FL, USA',
        mapsQuery: 'South Beach Miami Beach',
      },
      {
        id: 'mia-wynwood',
        name: { en: 'Wynwood Walls', 'pt-BR': 'Wynwood Walls' },
        category: 'tourist',
        description: {
          en: 'Open-air street art district with murals and coffee spots.',
          'pt-BR': 'Distrito a céu aberto de street art, murais e cafés.',
        },
        googleRating: 4.7,
        lat: 25.801,
        lng: -80.1994,
        area: areaBox(25.801, -80.1994, 0.004, 0.005),
        address: '2520 NW 2nd Ave, Miami, FL 33127, USA',
        mapsQuery: 'Wynwood Walls Miami',
      },
      {
        id: 'mia-little-havana',
        name: { en: 'Little Havana', 'pt-BR': 'Little Havana' },
        category: 'restaurants',
        description: {
          en: 'Cuban coffee, domino park, and Calle Ocho rhythm.',
          'pt-BR': 'Café cubano, parque de dominó e o ritmo da Calle Ocho.',
        },
        googleRating: 4.5,
        lat: 25.7655,
        lng: -80.2201,
        address: 'Calle Ocho, Little Havana, Miami, FL, USA',
        mapsQuery: 'Little Havana Miami Calle Ocho',
      },
    ],
  },
  {
    slug: 'paris',
    name: { en: 'Paris', 'pt-BR': 'Paris' },
    country: { en: 'France', 'pt-BR': 'França' },
    countryKey: 'franca',
    lat: 48.8566,
    lng: 2.3522,
    zoom: 14,
    places: [
      {
        id: 'par-ory',
        name: { en: 'Orly Airport (ORY)', 'pt-BR': 'Aeroporto de Orly (ORY)' },
        category: 'airport',
        featured: true,
        description: {
          en: 'Southern Paris gateway. Often smoother than CDG for shorter hops.',
          'pt-BR': 'Porta sul de Paris. Costuma ser mais tranquilo que o CDG em voos curtos.',
        },
        googleRating: 3.7,
        lat: 48.7233,
        lng: 2.3794,
        address: '94390 Orly, France',
        mapsQuery: 'Aéroport de Paris-Orly ORY',
      },
      {
        id: 'par-cdg',
        name: {
          en: 'Charles de Gaulle Airport (CDG)',
          'pt-BR': 'Aeroporto Charles de Gaulle (CDG)',
        },
        category: 'airport',
        featured: true,
        description: {
          en: 'Main long-haul hub north of Paris. RER B into the city (~45–60 min to the center).',
          'pt-BR':
            'Principal hub de longos voos ao norte de Paris. RER B até a cidade (~45–60 min ao centro).',
        },
        googleRating: 3.6,
        lat: 49.0097,
        lng: 2.5479,
        address: '95700 Roissy-en-France, France',
        mapsQuery: 'Aéroport de Paris-Charles de Gaulle CDG',
      },
      {
        id: 'par-cdg-paul',
        name: { en: 'PAUL CDG', 'pt-BR': 'PAUL CDG' },
        category: 'cafes',
        description: {
          en: 'Bakery-café in Terminal 2 — croissants and coffee on the way to the RER.',
          'pt-BR':
            'Padaria-café no Terminal 2 — croissants e café a caminho do RER.',
        },
        googleRating: 3.8,
        lat: 49.0046,
        lng: 2.5718,
        address: 'Aéroport Paris-Charles de Gaulle, Terminal 2, 95700 Roissy-en-France',
        mapsQuery: 'PAUL Aéroport Charles de Gaulle Terminal 2',
      },
      {
        id: 'par-cdg-rer',
        name: {
          en: 'CDG 2 TGV · Navigo',
          'pt-BR': 'CDG 2 TGV · Navigo',
        },
        category: 'transport',
        description: {
          en: 'RER B under Terminal 2 — buy Navigo Easy here, then ride into Paris (Magenta / Gare du Nord).',
          'pt-BR':
            'RER B sob o Terminal 2 — compre Navigo Easy aqui e siga para Paris (Magenta / Gare du Nord).',
        },
        googleRating: 3.6,
        lat: 49.0039,
        lng: 2.5708,
        address: 'Gare Aéroport Charles de Gaulle 2 TGV, 95700 Roissy-en-France',
        mapsQuery: 'Gare Aéroport Charles de Gaulle 2 TGV Navigo',
      },
      {
        id: 'par-orly-m14',
        name: {
          en: 'Orly Metro 14 · Navigo',
          'pt-BR': 'Metrô 14 Orly · Navigo',
        },
        category: 'transport',
        description: {
          en: 'Closest RATP point after landing — buy Navigo Easy cards for everyone, then ride M14 into Paris.',
          'pt-BR':
            'Ponto RATP mais perto após o desembarque — compre Navigo Easy para todos e pegue a M14 para Paris.',
        },
        googleRating: 4.0,
        lat: 48.7292,
        lng: 2.3698,
        address: 'Gare Orly 1-2-3 / Orly 4, Métro ligne 14',
        mapsQuery: 'Métro Orly ligne 14 Navigo',
      },
      {
        id: 'par-orly-paul',
        name: { en: 'PAUL Orly', 'pt-BR': 'PAUL Orly' },
        category: 'cafes',
        description: {
          en: 'Bakery-café at Orly — croissants and coffee right after Navigo setup.',
          'pt-BR':
            'Padaria-café em Orly — croissants e café logo após comprar o Navigo.',
        },
        googleRating: 3.9,
        lat: 48.7285,
        lng: 2.3685,
        address: 'Aéroport d’Orly, 94390 Orly',
        mapsQuery: 'PAUL Aéroport Orly',
      },
      {
        id: 'par-noisy-le-sec-rer',
        name: {
          en: 'Noisy-le-Sec station',
          'pt-BR': 'Gare de Noisy-le-Sec',
        },
        category: 'transport',
        description: {
          en: 'RER E stop for Casa do Gui — short walk to Rue des Bergeries.',
          'pt-BR':
            'Estação RER E da Casa do Gui — caminhada curta até a Rue des Bergeries.',
        },
        googleRating: 3.5,
        lat: 48.8907,
        lng: 2.4608,
        address: 'Place Jean-Jaurès, 93130 Noisy-le-Sec',
        mapsQuery: 'Gare de Noisy-le-Sec RER E',
      },
      {
        id: 'par-felicita',
        name: { en: 'La Felicità', 'pt-BR': 'La Felicità' },
        category: 'restaurants',
        description: {
          en: 'Huge food hall at Station F. Go hungry.',
          'pt-BR': 'Food hall enorme na Station F. Vá com fome.',
        },
        googleRating: 4.5,
        lat: 48.8339,
        lng: 2.371,
        address: '5 Parvis Alan Turing, 75013 Paris',
        mapsQuery: 'La Felicità Station F Paris',
        mapsUrl: 'https://maps.app.goo.gl/qhqK9AntK4mxKyWy7',
      },
      {
        id: 'par-bake-blend',
        name: {
          en: 'Le café by Maison Bergeron',
          'pt-BR': 'Le café by Maison Bergeron',
        },
        category: 'cafes',
        description: {
          en: 'Coffee and bakery stop near the Champ de Mars.',
          'pt-BR': 'Café e padaria perto do Champ de Mars.',
        },
        googleRating: 4.5,
        lat: 48.8584,
        lng: 2.3008,
        address: '1 Rue Amélie, 75007 Paris',
        mapsQuery: 'Le café by Maison Bergeron Paris',
        mapsUrl: 'https://maps.app.goo.gl/ezkYGpjLCM1ZrFuC8',
      },
      {
        id: 'par-champ-mars',
        name: { en: 'Champ de Mars', 'pt-BR': 'Champ de Mars' },
        category: 'parks',
        description: {
          en: 'The lawn under the Tower. Sunset picnic territory.',
          'pt-BR': 'O gramado sob a Torre. Território de piquenique no pôr do sol.',
        },
        rating: 5,
        googleRating: 4.6,
        favorite: true,
        lat: 48.8556,
        lng: 2.2986,
        // OSM park outline via travel-areas-osm.ts (par-champ-mars)
        address: 'Champ de Mars, 75007 Paris',
        mapsQuery: 'Champ de Mars Paris',
      },
      {
        id: 'par-eiffel',
        name: { en: 'Eiffel Tower', 'pt-BR': 'Torre Eiffel' },
        category: 'tourist',
        landmark: 'eiffel',
        description: {
          en: 'Still worth it. Go early or late for better light.',
          'pt-BR': 'Ainda vale. Vá cedo ou tarde pela luz.',
        },
        rating: 5,
        googleRating: 4.7,
        favorite: true,
        lat: 48.8584,
        lng: 2.2945,
        address: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris',
        mapsQuery: 'Tour Eiffel Paris',
      },
      {
        id: 'par-trocadero',
        name: { en: 'Trocadéro', 'pt-BR': 'Trocadéro' },
        category: 'photo',
        landmark: 'monument',
        description: {
          en: 'The classic postcard angle of the Tower.',
          'pt-BR': 'O ângulo clássico de cartão-postal da Torre.',
        },
        rating: 5,
        googleRating: 4.6,
        favorite: true,
        lat: 48.862,
        lng: 2.2877,
        // Place + esplanade facing the Tower
        area: {
          kind: 'polygon',
          path: [
            [48.8632, 2.2862],
            [48.8634, 2.2890],
            [48.8620, 2.2896],
            [48.8610, 2.2888],
            [48.8608, 2.2868],
            [48.8616, 2.2858],
          ],
        },
        address: 'Place du Trocadéro, 75016 Paris',
        mapsQuery: 'Trocadéro Paris',
      },
      {
        id: 'par-franklin-passy',
        name: { en: 'Le Franklin Passy', 'pt-BR': 'Le Franklin Passy' },
        category: 'restaurants',
        description: {
          en: 'Passy classic near Trocadéro.',
          'pt-BR': 'Clássico de Passy perto do Trocadéro.',
        },
        googleRating: 3.5,
        lat: 48.8596,
        lng: 2.2872,
        address: '1 Rue Benjamin Franklin, 75016 Paris',
        mapsQuery: 'LE FRANKLIN Passy Paris',
        mapsUrl: 'https://maps.app.goo.gl/nBDjajGsKQVvVZxq6',
      },
      {
        id: 'par-la-defense',
        name: { en: 'La Défense', 'pt-BR': 'La Défense' },
        category: 'parks',
        description: {
          en: 'Business skyline and the Grande Arche axis.',
          'pt-BR': 'Skyline corporativo e o eixo da Grande Arche.',
        },
        rating: 4.5,
        googleRating: 4.4,
        lat: 48.891,
        lng: 2.241,
        address: 'La Défense, 92800 Puteaux',
        mapsQuery: 'La Défense Paris',
      },
      {
        id: 'par-paul-defense',
        name: { en: 'PAUL La Défense', 'pt-BR': 'PAUL La Défense' },
        category: 'cafes',
        description: {
          en: 'Reliable bakery-café at La Défense — croissants, coffee, and a quick start before the Arche.',
          'pt-BR':
            'Padaria-café confiável em La Défense — croissants, café e largada rápida antes da Arche.',
        },
        googleRating: 4.2,
        lat: 48.8904,
        lng: 2.2378,
        address: 'Parvis de la Défense / Les Quatre Temps, 92800 Puteaux',
        mapsQuery: 'PAUL La Défense Parvis',
      },
      {
        id: 'par-grande-arche',
        name: {
          en: 'Grande Arche de la Défense',
          'pt-BR': 'Grande Arche de la Défense',
        },
        category: 'photo',
        landmark: 'monument',
        description: {
          en: 'The “Great Arch” — cube frame on the historic axis. Best photos from the parvis and steps.',
          'pt-BR':
            'O “Grande Arco” — cubo no eixo histórico. Melhores fotos no parvis e na escadaria.',
        },
        rating: 4.5,
        favorite: true,
        googleRating: 4.4,
        lat: 48.8927,
        lng: 2.2359,
        address: '1 Parvis de la Défense, 92040 Paris La Défense',
        mapsQuery: 'Grande Arche de la Défense',
      },
      {
        id: 'par-esplanade-de-gaulle',
        name: {
          en: 'Esplanade du Général de Gaulle',
          'pt-BR': 'Esplanade du Général de Gaulle',
        },
        category: 'photo',
        description: {
          en: 'Long open esplanade under the towers — skyline, fountains, and the axis toward Paris.',
          'pt-BR':
            'Esplanada longa sob as torres — skyline, fontes e o eixo em direção a Paris.',
        },
        rating: 4.5,
        googleRating: 4.3,
        lat: 48.8889,
        lng: 2.2468,
        address: 'Esplanade du Général de Gaulle, 92800 Puteaux',
        mapsQuery: 'Esplanade du Général de Gaulle La Défense',
      },
      {
        id: 'par-monoprix-rivoli',
        name: {
          en: 'Monoprix Opéra (picnic)',
          'pt-BR': 'Monoprix Opéra (piquenique)',
        },
        category: 'markets',
        description: {
          en: 'Monoprix on Av. de l’Opéra — sandwiches, fruit, drinks for a Tuileries picnic.',
          'pt-BR':
            'Monoprix na Av. de l’Opéra — sanduíches, fruta e bebidas pro piquenique nas Tuileries.',
        },
        googleRating: 4.0,
        lat: 48.8664526,
        lng: 2.333868,
        address: "23 Av. de l'Opéra, 75001 Paris",
        mapsQuery: "Monoprix 23 Avenue de l'Opéra Paris",
        mapsUrl:
          'https://www.google.com/maps/search/?api=1&query=Monoprix+23+Avenue+de+l%27Op%C3%A9ra+Paris',
      },
      {
        id: 'par-louvre',
        name: { en: 'Louvre', 'pt-BR': 'Louvre' },
        category: 'tourist',
        landmark: 'louvre',
        description: {
          en: 'Plan a route. The building is half the experience.',
          'pt-BR': 'Planeje um roteiro. O prédio é metade da experiência.',
        },
        rating: 5,
        googleRating: 4.7,
        favorite: true,
        lat: 48.8606,
        lng: 2.3376,
        // Cour carrée + Denon/Sully footprint (simplified)
        area: {
          kind: 'polygon',
          path: [
            [48.8618, 2.3338],
            [48.8622, 2.3390],
            [48.8608, 2.3402],
            [48.8594, 2.3395],
            [48.8590, 2.3355],
            [48.8598, 2.3335],
          ],
        },
        address: 'Rue de Rivoli, 75001 Paris',
        mapsQuery: 'Musée du Louvre Paris',
      },
      {
        id: 'par-tuileries',
        name: { en: 'Tuileries Garden', 'pt-BR': 'Jardim das Tulherias' },
        category: 'parks',
        description: {
          en: 'Between Louvre and Concorde. Perfect walking spine.',
          'pt-BR': 'Entre o Louvre e a Concorde. Eixo perfeito para caminhar.',
        },
        rating: 5,
        googleRating: 4.6,
        favorite: true,
        lat: 48.8634,
        lng: 2.3275,
        // Long east–west garden between Louvre and Concorde
        area: {
          kind: 'polygon',
          path: [
            [48.8646, 2.3215],
            [48.8650, 2.3298],
            [48.8642, 2.3335],
            [48.8626, 2.3332],
            [48.8620, 2.3290],
            [48.8622, 2.3218],
          ],
        },
        address: 'Place de la Concorde, 75001 Paris',
        mapsQuery: 'Jardin des Tuileries Paris',
      },
      {
        id: 'par-champs-elysees',
        name: { en: 'Champs-Élysées', 'pt-BR': 'Champs-Élysées' },
        category: 'parks',
        description: {
          en: 'The avenue. Walk from Concorde up to the Arc.',
          'pt-BR': 'A avenida. Suba da Concorde até o Arco.',
        },
        rating: 4.5,
        googleRating: 4.7,
        favorite: true,
        lat: 48.8698,
        lng: 2.3078,
        // Fallback; precise full-avenue polyline is in travel-areas-osm.ts
        area: {
          kind: 'polyline',
          path: [
            [48.86555, 2.32105],
            [48.86745, 2.31494],
            [48.86977, 2.30767],
            [48.87183, 2.30116],
            [48.87355, 2.2955],
          ],
        },
        address: 'Av. des Champs-Élysées, 75008 Paris',
        mapsQuery: 'Champs-Élysées Paris',
      },
      {
        id: 'par-arc-triomphe',
        name: { en: 'Arc de Triomphe', 'pt-BR': 'Arco do Triunfo' },
        category: 'tourist',
        landmark: 'arc',
        description: {
          en: 'Climb for the axis view over the city.',
          'pt-BR': 'Suba pela vista do eixo sobre a cidade.',
        },
        rating: 5,
        favorite: true,
        googleRating: 4.7,
        lat: 48.8738,
        lng: 2.295,
        address: 'Place Charles de Gaulle, 75008 Paris',
        mapsQuery: 'Arc de Triomphe Paris',
      },
      {
        id: 'par-pierre-herme',
        name: { en: 'Pierre Hermé', 'pt-BR': 'Pierre Hermé' },
        category: 'cafes',
        description: {
          en: 'Macaron pilgrimage. Pick a signature box.',
          'pt-BR': 'Peregrinação de macaron. Pegue uma caixa assinatura.',
        },
        rating: 4,
        googleRating: 4.4,
        lat: 48.871363,
        lng: 2.3037531,
        address: '86 Av. des Champs-Élysées, 75008 Paris',
        mapsQuery: 'Pierre Hermé Paris',
        mapsUrl: 'https://www.google.fr/maps/place/Pierre+Herm%C3%A9/@48.871363,2.3015,18z',
      },
      {
        id: 'par-maison-balzac',
        name: { en: 'Maison de Balzac', 'pt-BR': 'Maison de Balzac' },
        category: 'parks',
        description: {
          en: 'Quiet museum house in Passy with a garden pause.',
          'pt-BR': 'Casa-museu quieta em Passy com pausa no jardim.',
        },
        googleRating: 4.3,
        lat: 48.8554541,
        lng: 2.2809102,
        address: '47 Rue Raynouard, 75016 Paris',
        mapsQuery: 'Maison de Balzac Paris',
        mapsUrl: 'https://www.google.fr/maps/place/Maison+de+Balzac/@48.8520676,2.2646642,14z',
      },
      {
        id: 'par-invalides',
        name: { en: 'Invalides', 'pt-BR': 'Invalides' },
        category: 'tourist',
        landmark: 'monument',
        description: {
          en: 'Dome, museums, and a wide open esplanade.',
          'pt-BR': 'Cúpula, museus e esplanada aberta.',
        },
        googleRating: 4.7,
        lat: 48.8565,
        lng: 2.3125,
        // OSM complex outline via travel-areas-osm.ts (par-invalides)
        address: '129 Rue de Grenelle, 75007 Paris',
        mapsQuery: 'Invalides Paris',
      },
      {
        id: 'par-alexandre-iii',
        name: { en: 'Pont Alexandre III', 'pt-BR': 'Ponte Alexandre III' },
        category: 'photo',
        description: {
          en: 'Most ornate bridge in the city. Golden hour magic.',
          'pt-BR': 'A ponte mais ornamentada da cidade. Magia no golden hour.',
        },
        googleRating: 4.8,
        lat: 48.8638,
        lng: 2.3135,
        // Bridge span centerline via travel-areas-osm.ts (par-alexandre-iii)
        address: 'Pont Alexandre III, 75008 Paris',
        mapsQuery: 'Pont Alexandre III Paris',
      },
      {
        id: 'par-palais',
        name: { en: 'Petit & Grand Palais', 'pt-BR': 'Petit e Grand Palais' },
        category: 'tourist',
        description: {
          en: 'Exhibition palaces on the Seine. Check what is open.',
          'pt-BR': 'Palácios de exposição no Sena. Veja o que está aberto.',
        },
        rating: 4.5,
        favorite: true,
        googleRating: 4.7,
        lat: 48.8661,
        lng: 2.3126,
        // OSM multipolygon: both buildings via travel-areas-osm.ts (par-palais)
        address: 'Av. Winston Churchill, 75008 Paris',
        mapsQuery: 'Grand Palais Petit Palais Paris',
      },
      {
        id: 'par-vendome',
        name: { en: 'Place Vendôme', 'pt-BR': 'Place Vendôme' },
        category: 'photo',
        description: {
          en: 'Luxury square and column. Clean geometry for photos.',
          'pt-BR': 'Praça de luxo e a coluna. Geometria limpa para fotos.',
        },
        googleRating: 4.7,
        lat: 48.8674,
        lng: 2.3295,
        // OSM plaza polygon via travel-areas-osm.ts
        address: 'Place Vendôme, 75001 Paris',
        mapsQuery: 'Place Vendôme Paris',
      },
      {
        id: 'par-cedric-grolet',
        name: { en: 'Cédric Grolet', 'pt-BR': 'Cédric Grolet' },
        category: 'cafes',
        description: {
          en: 'Pastry spectacle. Expect a line; worth the wait if you care.',
          'pt-BR': 'Espetáculo de confeitaria. Espere fila; vale se você curte.',
        },
        rating: 5,
        googleRating: 4.6,
        favorite: true,
        lat: 48.8678522,
        lng: 2.3332982,
        address: "35 Avenue de l'Opéra, 75002 Paris",
        mapsQuery: 'Cédric Grolet Paris',
        mapsUrl: 'https://www.google.fr/maps/place/C%C3%A9dric+Grolet/@48.8678522,2.3307233,17z',
      },
      {
        id: 'par-opera',
        name: { en: 'Opéra Garnier', 'pt-BR': 'Ópera Garnier' },
        category: 'tourist',
        landmark: 'opera',
        description: {
          en: 'Beaux-Arts overload. Interior if you can.',
          'pt-BR': 'Excesso Beaux-Arts. Interior se puder.',
        },
        rating: 4.5,
        googleRating: 4.7,
        favorite: true,
        lat: 48.8719,
        lng: 2.3317,
        // OSM building outline via travel-areas-osm.ts (par-opera)
        address: 'Pl. de l\'Opéra, 75009 Paris',
        mapsQuery: 'Opéra Garnier Paris',
      },
      {
        id: 'par-galeries-lafayette',
        name: { en: 'Galeries Lafayette', 'pt-BR': 'Galeries Lafayette' },
        category: 'shopping',
        description: {
          en: 'Dome, rooftop view, and department-store theater.',
          'pt-BR': 'Cúpula, terraço e teatro de loja de departamento.',
        },
        rating: 4.5,
        googleRating: 4.5,
        favorite: true,
        lat: 48.8738,
        lng: 2.332,
        // OSM multipolygon: both Haussmann buildings via travel-areas-osm.ts
        address: '40 Bd Haussmann, 75009 Paris',
        mapsQuery: 'Galeries Lafayette Haussmann',
      },
      {
        id: 'par-printemps',
        name: { en: 'Printemps', 'pt-BR': 'Printemps' },
        category: 'shopping',
        description: {
          en: 'Haussmann landmark with a strong rooftop stop.',
          'pt-BR': 'Marco de Haussmann com terraço forte.',
        },
        googleRating: 4.7,
        lat: 48.8737,
        lng: 2.328,
        address: '64 Bd Haussmann, 75009 Paris',
        mapsQuery: 'Printemps Haussmann Paris',
      },
      {
        id: 'par-eclair-genie',
        name: { en: 'L\'Éclair de Génie', 'pt-BR': 'L\'Éclair de Génie' },
        category: 'cafes',
        description: {
          en: 'Éclair specialists. Grab one and walk.',
          'pt-BR': 'Especialistas em éclair. Pegue um e caminhe.',
        },
        googleRating: 4.8,
        lat: 48.8731537,
        lng: 2.3304052,
        address: '32 Rue Notre-Dame-des-Victoires, 75002 Paris',
        mapsQuery: 'L\'Éclair de Génie Paris',
        mapsUrl: 'https://www.google.fr/maps/place/L\'Eclair+De+Genie/@48.8731535,2.325899,17z',
      },
      {
        id: 'par-francette',
        name: { en: 'Francette', 'pt-BR': 'Francette' },
        category: 'restaurants',
        description: {
          en: 'Port de Suffren terrace energy by the river.',
          'pt-BR': 'Energia de terraço no Port de Suffren, beira-rio.',
        },
        googleRating: 4.5,
        lat: 48.8558,
        lng: 2.2905,
        address: '1 Port de Suffren, 75007 Paris',
        mapsQuery: 'Francette Paris',
        mapsUrl: 'https://maps.app.goo.gl/saWLoSvCKrQWzaw79',
      },
      {
        id: 'par-maison-isabelle',
        name: { en: 'La Maison d\'Isabelle', 'pt-BR': 'La Maison d\'Isabelle' },
        category: 'cafes',
        description: {
          en: 'One of the most awarded croissants in Paris.',
          'pt-BR': 'Um dos croissants mais premiados de Paris.',
        },
        rating: 5,
        googleRating: 4.5,
        favorite: true,
        lat: 48.8498436,
        lng: 2.3482751,
        address: '47 Boulevard Saint-Germain, 75005 Paris',
        mapsQuery: 'La Maison d\'Isabelle Paris',
        mapsUrl: 'https://www.google.fr/maps/place/La+Maison+d\'Isabelle/@48.8498436,2.3457002,17z',
      },
      {
        id: 'par-luxembourg',
        name: { en: 'Luxembourg Garden', 'pt-BR': 'Jardim de Luxemburgo' },
        category: 'parks',
        description: {
          en: 'Paris park perfection. Chairs, trees, and slow hours.',
          'pt-BR': 'Parque parisiense perfeito. Cadeiras, árvores e horas lentas.',
        },
        googleRating: 4.7,
        lat: 48.8462,
        lng: 2.3372,
        area: {
          kind: 'polygon',
          path: [
            [48.8488, 2.3340],
            [48.8490, 2.3405],
            [48.8472, 2.3412],
            [48.8448, 2.3400],
            [48.8438, 2.3365],
            [48.8445, 2.3335],
            [48.8465, 2.3328],
          ],
        },
        address: 'Rue de Médicis / Pl. Edmond Rostand, 75006 Paris',
        mapsQuery: 'Jardin du Luxembourg Paris',
      },
      {
        id: 'par-pantheon',
        name: { en: 'Panthéon', 'pt-BR': 'Panteão' },
        category: 'tourist',
        landmark: 'monument',
        description: {
          en: 'Latin Quarter landmark. Dome views when open.',
          'pt-BR': 'Marco do Quartier Latin. Vista da cúpula quando aberta.',
        },
        googleRating: 4.6,
        lat: 48.8462,
        lng: 2.346,
        address: 'Pl. du Panthéon, 75005 Paris',
        mapsQuery: 'Panthéon Paris',
      },
      {
        id: 'par-sorbonne',
        name: { en: 'Rue de la Sorbonne', 'pt-BR': 'Rue de la Sorbonne' },
        category: 'parks',
        description: {
          en: 'University street energy around the old colleges.',
          'pt-BR': 'Energia de rua universitária entre os colégios antigos.',
        },
        googleRating: 4.4,
        lat: 48.8493577,
        lng: 2.3432944,
        // Geometry: OSM LineString in travel-areas-osm.ts (par-sorbonne)
        address: 'Rue de la Sorbonne, 75005 Paris',
        mapsQuery: 'Rue de la Sorbonne Paris',
        mapsUrl: 'https://www.google.fr/maps/place/Rue+de+la+Sorbonne,+75005+Paris/@48.8492618,2.3395419,17z',
      },
      {
        id: 'par-creperie-arts',
        name: { en: 'Crêperie des Arts', 'pt-BR': 'Crêperie des Arts' },
        category: 'restaurants',
        description: {
          en: 'Crêpes on Rue Saint-André des Arts.',
          'pt-BR': 'Crêpes na Rue Saint-André des Arts.',
        },
        googleRating: 4.4,
        lat: 48.8532,
        lng: 2.3405,
        address: '27 Rue Saint-André des Arts, 75006 Paris',
        mapsQuery: 'Crêperie des Arts Paris',
        mapsUrl: 'https://www.google.com/maps?q=Cr%C3%AAperie+des+Arts,+27+Rue+Saint-Andr%C3%A9+des+Arts,+75006+Paris',
      },
      {
        id: 'par-auptitgrec',
        name: { en: 'Au P\'tit Grec', 'pt-BR': 'Au P\'tit Grec' },
        category: 'restaurants',
        description: {
          en: 'Late crêpes and Latin Quarter fuel.',
          'pt-BR': 'Crêpes até tarde e combustível do Quartier Latin.',
        },
        googleRating: 4.5,
        lat: 48.8476825,
        lng: 2.3424713,
        address: '126 Rue Mouffetard, 75005 Paris',
        mapsQuery: 'Au P\'tit Grec crêperie Paris',
        mapsUrl: 'https://maps.app.goo.gl/24XKWbRP9i2aLFjS6',
      },
      {
        id: 'par-cour-commerce',
        name: { en: 'Cour du Commerce Saint-André', 'pt-BR': 'Cour du Commerce Saint-André' },
        category: 'parks',
        description: {
          en: 'Covered passage with history and good wandering.',
          'pt-BR': 'Passagem coberta com história e boa para vaguear.',
        },
        rating: 5,
        googleRating: 5.0,
        favorite: true,
        // Mid-passage — full path from OSM (travel-areas-osm.ts / par-cour-commerce)
        lat: 48.8530736,
        lng: 2.3390876,
        address: 'Cr du Commerce Saint-André, 75006 Paris',
        mapsQuery: 'Cour du Commerce Saint-André Paris',
        mapsUrl: 'https://www.google.fr/maps/place/Cr+du+Commerce+Saint-Andr%C3%A9,+75006+Paris/@48.853095,2.3383737,18.5z',
      },
      {
        id: 'par-procope',
        name: { en: 'Le Procope', 'pt-BR': 'Le Procope' },
        category: 'restaurants',
        description: {
          en: 'Historic café-restaurant. Old Paris atmosphere.',
          'pt-BR': 'Café-restaurante histórico. Atmosfera de Paris antiga.',
        },
        googleRating: 4.5,
        lat: 48.8529913,
        lng: 2.3387975,
        address: '13 Rue de l\'Ancienne Comédie, 75006 Paris',
        mapsQuery: 'Le Procope Paris',
        mapsUrl: 'https://www.google.fr/maps/place/Le+Procope/@48.853095,2.3383737,18.5z',
      },
      {
        id: 'par-brasserie-pres',
        name: { en: 'Brasserie des Prés', 'pt-BR': 'Brasserie des Prés' },
        category: 'restaurants',
        description: {
          en: 'Saint-Germain brasserie energy near the passage.',
          'pt-BR': 'Energia de brasserie em Saint-Germain perto da passagem.',
        },
        googleRating: 4.7,
        lat: 48.8529451,
        lng: 2.3391987,
        address: '6 Cour du Commerce Saint-André, 75006 Paris',
        mapsQuery: 'Brasserie des Prés Paris',
        mapsUrl: 'https://www.google.fr/maps/place/Brasserie+des+Pr%C3%A9s/@48.853095,2.3383737,18.5z',
      },
      {
        id: 'par-saint-michel',
        name: { en: 'Place Saint-Michel', 'pt-BR': 'Place Saint-Michel' },
        category: 'photo',
        description: {
          en: 'Fountain, students, and the river steps nearby.',
          'pt-BR': 'Fonte, estudantes e as escadas do rio por perto.',
        },
        googleRating: 4.4,
        lat: 48.8534,
        lng: 2.344,
        address: 'Pl. Saint-Michel, 75005 Paris',
        mapsQuery: 'Place Saint-Michel Paris',
      },
      {
        id: 'par-notre-dame',
        name: { en: 'Notre-Dame', 'pt-BR': 'Notre-Dame' },
        category: 'tourist',
        landmark: 'notre-dame',
        description: {
          en: 'Île de la Cité centerpiece. Walk the square and the bridges.',
          'pt-BR': 'Centro da Île de la Cité. Caminhe a praça e as pontes.',
        },
        rating: 5,
        googleRating: 4.7,
        favorite: true,
        lat: 48.853,
        lng: 2.3499,
        address: '6 Parvis Notre-Dame, 75004 Paris',
        mapsQuery: 'Cathédrale Notre-Dame de Paris',
      },
      {
        id: 'par-hotel-ville',
        name: { en: 'Hôtel de Ville', 'pt-BR': 'Hôtel de Ville' },
        category: 'photo',
        description: {
          en: 'City hall square. Often hosts outdoor installations.',
          'pt-BR': 'Praça da prefeitura. Costuma ter instalações ao ar livre.',
        },
        googleRating: 4.5,
        lat: 48.8566,
        lng: 2.3522,
        address: 'Pl. de l\'Hôtel de Ville, 75004 Paris',
        mapsQuery: 'Hôtel de Ville Paris',
      },
      {
        id: 'par-horloge',
        name: { en: 'Conciergerie Clock', 'pt-BR': 'Relógio da Conciergerie' },
        category: 'photo',
        description: {
          en: 'One of the oldest public clocks in Paris. Look up on the tower.',
          'pt-BR': 'Um dos relógios públicos mais antigos de Paris. Olhe a torre.',
        },
        googleRating: 4.6,
        // Tour Carrée de l'Horloge (OSM amenity=clock N2183872370)
        lat: 48.856193,
        lng: 2.346233,
        address: '2 Bd du Palais, 75001 Paris',
        mapsQuery: 'Horloge Conciergerie Paris',
      },
      {
        id: 'par-sainte-chapelle',
        name: { en: 'Sainte-Chapelle', 'pt-BR': 'Sainte-Chapelle' },
        category: 'tourist',
        landmark: 'monument',
        description: {
          en: 'Stained glass overload. Book ahead when you can.',
          'pt-BR': 'Excesso de vitrais. Reserve com antecedência se puder.',
        },
        googleRating: 4.6,
        lat: 48.8554,
        lng: 2.345,
        address: '10 Bd du Palais, 75001 Paris',
        mapsQuery: 'Sainte-Chapelle Paris',
      },
      {
        id: 'par-fric-frac',
        name: { en: 'Fric-Frac', 'pt-BR': 'Fric-Frac' },
        category: 'restaurants',
        description: {
          en: 'Croque-monsieur specialists up by Canal Saint-Martin energy.',
          'pt-BR': 'Especialistas em croque perto da energia do Canal Saint-Martin.',
        },
        googleRating: 4.9,
        lat: 48.8838194,
        lng: 2.3416479,
        address: '99 Quai de Valmy, 75010 Paris',
        mapsQuery: 'Fric-Frac Paris',
        mapsUrl: 'https://www.google.fr/maps/place/Fric-Frac/@48.8838194,2.339073,17z',
      },
      {
        id: 'par-montmartre',
        name: { en: 'Montmartre', 'pt-BR': 'Montmartre' },
        category: 'parks',
        description: {
          en: 'Hill village vibe. Wander before the Sacré-Cœur crowds peak.',
          'pt-BR': 'Clima de vilarejo na colina. Vagueie antes do pico no Sacré-Cœur.',
        },
        rating: 5,
        googleRating: 4.7,
        favorite: true,
        lat: 48.8867,
        lng: 2.3431,
        address: 'Montmartre, 75018 Paris',
        mapsQuery: 'Montmartre Paris',
      },
      {
        id: 'par-sacre-coeur',
        name: { en: 'Sacré-Cœur', 'pt-BR': 'Sacré-Cœur' },
        category: 'tourist',
        landmark: 'sacre-coeur',
        description: {
          en: 'White dome over the city. Steps are half the point.',
          'pt-BR': 'Cúpula branca sobre a cidade. As escadas são metade da graça.',
        },
        rating: 5,
        googleRating: 4.7,
        favorite: true,
        lat: 48.8867,
        lng: 2.3431,
        address: '35 Rue du Chevalier de la Barre, 75018 Paris',
        mapsQuery: 'Basilique du Sacré-Cœur de Montmartre',
      },
      {
        id: 'par-moulin-rouge',
        name: { en: 'Moulin Rouge', 'pt-BR': 'Moulin Rouge' },
        category: 'tourist',
        description: {
          en: 'Pigalle icon. Worth the photo even if you skip the show.',
          'pt-BR': 'Ícone de Pigalle. Vale a foto mesmo sem o show.',
        },
        rating: 3.5,
        googleRating: 4.4,
        lat: 48.8841,
        lng: 2.3322,
        address: '82 Bd de Clichy, 75018 Paris',
        mapsQuery: 'Moulin Rouge Paris',
      },
      {
        id: 'par-arnaud-nicolas',
        name: { en: 'Charcuterie Arnaud Nicolas', 'pt-BR': 'Charcuterie Arnaud Nicolas' },
        category: 'restaurants',
        description: {
          en: 'Serious charcuterie near Lévis. Perfect for a picnic haul.',
          'pt-BR': 'Charcutaria séria perto de Lévis. Perfeita para montar piquenique.',
        },
        googleRating: 4.2,
        lat: 48.8818624,
        lng: 2.3161397,
        address: '46 Rue de Lévis, 75017 Paris',
        mapsQuery: 'Charcuterie Arnaud Nicolas Lévis Paris',
        mapsUrl: 'https://www.google.com/maps/place/Charcuterie+Arnaud+Nicolas+L%C3%A9vis/@48.8757052,2.3221345,13.75z',
      },
      {
        id: 'par-bateaux-mouches',
        name: { en: 'Bateaux-Mouches', 'pt-BR': 'Bateaux-Mouches' },
        category: 'tourist',
        description: {
          en: 'Seine cruise classic from the Alma side.',
          'pt-BR': 'Clássico de cruzeiro no Sena do lado de Alma.',
        },
        rating: 5,
        favorite: true,
        googleRating: 4.3,
        lat: 48.8640106,
        lng: 2.3059374,
        address: 'Port de la Conférence, 75008 Paris',
        mapsQuery: 'Bateaux-Mouches Paris',
        mapsUrl: 'https://www.google.fr/maps/place/Bateau-mouche/@48.8629662,2.306493,16.25z',
      },
      {
        id: 'par-michalak',
        name: { en: 'Pâtisserie Michalak', 'pt-BR': 'Pâtisserie Michalak' },
        category: 'cafes',
        description: {
          en: 'Christophe Michalak pastries in Neuilly.',
          'pt-BR': 'Doces do Christophe Michalak em Neuilly.',
        },
        googleRating: 4.1,
        lat: 48.8805647,
        lng: 2.268,
        address: '16 Avenue de la Motte-Picquet, 75007 Paris',
        mapsQuery: 'Pâtisserie Michalak Neuilly',
        mapsUrl: 'https://maps.app.goo.gl/xTaw91nG8tXmDimq8',
      },
      {
        id: 'par-bien-eleve',
        name: { en: 'Bien Élevé', 'pt-BR': 'Bien Élevé' },
        category: 'restaurants',
        description: {
          en: 'Butcher-table dining. Order meat-forward and share.',
          'pt-BR': 'Mesa de açougueiro. Peça carne e divida.',
        },
        googleRating: 4.6,
        lat: 48.8645,
        lng: 2.365,
        address: '47 Rue Richer, 75009 Paris',
        mapsQuery: 'Bien Élevé Paris',
      },
      {
        id: 'par-palais-royal',
        name: { en: 'Palais-Royal', 'pt-BR': 'Palais-Royal' },
        category: 'parks',
        description: {
          en: 'Colonades, garden, and the striped columns courtyard.',
          'pt-BR': 'Colunatas, jardim e o pátio das colunas listradas.',
        },
        rating: 5,
        favorite: true,
        googleRating: 4.6,
        lat: 48.8638,
        lng: 2.3371,
        address: '8 Rue de Montpensier, 75001 Paris',
        mapsQuery: 'Palais-Royal Paris',
      },
      {
        id: 'par-bohemia',
        name: {
          en: "Baguett's Café Molière",
          'pt-BR': "Baguett's Café Molière",
        },
        category: 'cafes',
        description: {
          en: 'Club sandwich and Club Loco de Blueberries.',
          'pt-BR': 'Club sandwich e Club Loco de Blueberries.',
        },
        rating: 5,
        googleRating: 4.7,
        favorite: true,
        lat: 48.8655,
        lng: 2.335,
        address: '30 Rue de Richelieu, 75001 Paris',
        mapsQuery: "Baguett's Café Molière Paris",
      },
      {
        id: 'par-bnf',
        name: { en: 'Bibliothèque nationale', 'pt-BR': 'Biblioteca Nacional' },
        category: 'parks',
        description: {
          en: 'Richelieu or François-Mitterrand depending on the day.',
          'pt-BR': 'Richelieu ou François-Mitterrand, conforme o dia.',
        },
        googleRating: 4.7,
        lat: 48.8338,
        lng: 2.376,
        address: 'Quai François Mauriac, 75013 Paris',
        mapsQuery: 'Bibliothèque nationale de France',
      },
      {
        id: 'par-chatelet',
        name: { en: 'Place du Châtelet', 'pt-BR': 'Place du Châtelet' },
        category: 'photo',
        description: {
          en: 'Central square and metro maze. Fountains, theaters, pure Paris chaos.',
          'pt-BR': 'Praça central e labirinto de metrô. Fontes, teatros, caos parisiense puro.',
        },
        rating: 4,
        googleRating: 4.2,
        lat: 48.8575,
        lng: 2.3472,
        address: 'Place du Châtelet, 75001 Paris',
        mapsQuery: 'Place du Châtelet Paris',
        mapsUrl: 'https://maps.app.goo.gl/5tQAPLnfS4xLxkYV6',
      },
      {
        id: 'par-saint-eustache',
        name: { en: 'Saint-Eustache', 'pt-BR': 'Saint-Eustache' },
        category: 'tourist',
        description: {
          en: 'Gothic giant by Les Halles. Free interior, huge organ, market-edge calm.',
          'pt-BR': 'Gigante gótico ao lado de Les Halles. Interior grátis, órgão enorme, calma na beira do mercado.',
        },
        googleRating: 4.7,
        lat: 48.8634,
        lng: 2.3451,
        address: '2 Imp. Saint-Eustache, 75001 Paris',
        mapsQuery: 'Église Saint-Eustache Paris',
      },
      {
        id: 'par-montorgueil',
        name: { en: 'Montorgueil', 'pt-BR': 'Montorgueil' },
        category: 'parks',
        description: {
          en: 'Pedestrian food street — bakeries, oysters, wine bars.',
          'pt-BR': 'Rua peatonizada de comida — padarias, ostras, wine bars.',
        },
        googleRating: 4.5,
        // Midpoint of full Rue Montorgueil polyline (OSM multi-way merge)
        lat: 48.864494,
        lng: 2.346697,
        address: 'Rue Montorgueil, 75001 Paris',
        mapsQuery: 'Rue Montorgueil Paris',
      },
      {
        id: 'par-michalak-etienne',
        name: {
          en: 'Pâtisserie Michalak | Etienne Marcel',
          'pt-BR': 'Pâtisserie Michalak | Etienne Marcel',
        },
        category: 'cafes',
        description: {
          en: 'Christophe Michalak counter on Rue Étienne Marcel — pastries near Les Halles / Montorgueil.',
          'pt-BR':
            'Balcão do Christophe Michalak na Rue Étienne Marcel — doces perto de Les Halles / Montorgueil.',
        },
        googleRating: 4.5,
        lat: 48.8644817,
        lng: 2.3460786,
        address: '37 Rue Étienne Marcel, 75002 Paris',
        mapsQuery: 'Pâtisserie Michalak Etienne Marcel Paris',
        mapsUrl: 'https://maps.app.goo.gl/hsYjfSBmJESa8o8S9',
      },
      {
        id: 'par-artizans',
        name: { en: 'Bistro les Artizans', 'pt-BR': 'Bistro les Artizans' },
        category: 'restaurants',
        description: {
          en: 'Bistro on Rue Montorgueil — solid French plates on the food street.',
          'pt-BR': 'Bistrô na Rue Montorgueil — pratos franceses sólidos na rua gastronômica.',
        },
        googleRating: 4.5,
        lat: 48.8637686,
        lng: 2.3465503,
        address: '30 Rue Montorgueil, 75001 Paris',
        mapsQuery: 'Bistro les Artizans Paris',
        mapsUrl: 'https://maps.app.goo.gl/dc8VjE69wviBaiJv6',
      },
      {
        id: 'par-pompidou',
        name: { en: 'Centre Pompidou', 'pt-BR': 'Centre Pompidou' },
        category: 'tourist',
        landmark: 'pompidou',
        description: {
          en: 'Inside-out museum. Plaza energy even from outside.',
          'pt-BR': 'Museu do avesso. Energia da praça mesmo por fora.',
        },
        rating: 4,
        googleRating: 4.4,
        lat: 48.8606,
        lng: 2.3522,
        address: 'Pl. Georges-Pompidou, 75004 Paris',
        mapsQuery: 'Centre Pompidou Paris',
      },
      {
        id: 'par-amorino',
        name: { en: 'Amorino', 'pt-BR': 'Amorino' },
        category: 'cafes',
        description: {
          en: 'Flower-shaped gelato. Easy win near the river islands.',
          'pt-BR': 'Gelato em forma de flor. Vitória fácil perto das ilhas.',
        },
        rating: 3.5,
        googleRating: 4.6,
        lat: 48.8607322,
        lng: 2.3510395,
        address: "47 Rue Saint-Louis en l'Île, 75004 Paris",
        mapsQuery: 'Amorino Paris Île',
        mapsUrl: 'https://maps.app.goo.gl/Lxk8rWHcsR3QveJW9',
      },
      {
        id: 'par-madeleine',
        name: { en: 'Église de la Madeleine', 'pt-BR': 'Église de la Madeleine' },
        category: 'tourist',
        description: {
          en: 'Temple-like church and the surrounding food streets.',
          'pt-BR': 'Igreja em forma de templo e as ruas de comida ao redor.',
        },
        googleRating: 4.7,
        lat: 48.87,
        lng: 2.3244,
        address: 'Pl. de la Madeleine, 75008 Paris',
        mapsQuery: 'Église de la Madeleine Paris',
        mapsUrl: 'https://www.foyerdelamadeleine.fr/restaurant',
      },
      {
        id: 'par-jeffrey-cagnes',
        name: { en: 'Jeffrey Cagnes', 'pt-BR': 'Jeffrey Cagnes' },
        category: 'cafes',
        description: {
          en: 'Pastry counter in the 1st. Sweet break between sights.',
          'pt-BR': 'Balcão de confeitaria no 1º. Pausa doce entre atrações.',
        },
        googleRating: 4.5,
        lat: 48.8697133,
        lng: 2.327773,
        address: '1 Boulevard de la Madeleine, 75009 Paris',
        mapsQuery: 'Jeffrey Cagnes Paris 1er',
        mapsUrl: 'https://maps.app.goo.gl/7ftDEDXvdHtxPYndA',
      },
      {
        id: 'par-metro-6',
        name: { en: 'Metro Line 6', 'pt-BR': 'Linha 6 do metrô' },
        category: 'photo',
        description: {
          en: 'Elevated stretches with Tower views. Ride it on purpose — hover to see the full line and stations.',
          'pt-BR': 'Trechos elevados com vista da Torre. Pegue de propósito — no hover você vê a linha inteira e as estações.',
        },
        // Anchor at Bir-Hakeim (best Tower view from the elevated viaduct)
        lat: 48.8539,
        lng: 2.2893,
        area: {
          kind: 'polyline',
          // Full line 6 path via station coordinates (Charles de Gaulle–Étoile → Nation)
          path: [
            [48.8738, 2.295], // Charles de Gaulle–Étoile
            [48.8712, 2.2928], // Kléber
            [48.8674, 2.29], // Boissière
            [48.863, 2.2875], // Trocadéro
            [48.8575, 2.2858], // Passy
            [48.8539, 2.2893], // Bir-Hakeim
            [48.8505, 2.2935], // Dupleix
            [48.8492, 2.2985], // La Motte-Picquet–Grenelle
            [48.8475, 2.3025], // Cambronne
            [48.8455, 2.31], // Sèvres–Lecourbe
            [48.8428, 2.3125], // Pasteur
            [48.8422, 2.3219], // Montparnasse–Bienvenüe
            [48.841, 2.325], // Edgar Quinet
            [48.8405, 2.3305], // Raspail
            [48.8339, 2.3325], // Denfert-Rochereau
            [48.833, 2.337], // Saint-Jacques
            [48.831, 2.3435], // Glacière
            [48.8298, 2.3505], // Corvisart
            [48.8312, 2.3558], // Place d'Italie
            [48.833, 2.3625], // Nationale
            [48.835, 2.369], // Chevaleret
            [48.837, 2.3735], // Quai de la Gare
            [48.84, 2.3795], // Bercy
            [48.839, 2.386], // Dugommier
            [48.8395, 2.3955], // Daumesnil
            [48.8415, 2.406], // Bel-Air
            [48.845, 2.401], // Picpus
            [48.8482, 2.3958], // Nation
          ],
        },
        routeStops: [
          { name: { en: 'Charles de Gaulle–Étoile', 'pt-BR': 'Charles de Gaulle–Étoile' }, lat: 48.8738, lng: 2.295 },
          { name: { en: 'Kléber', 'pt-BR': 'Kléber' }, lat: 48.8712, lng: 2.2928 },
          { name: { en: 'Boissière', 'pt-BR': 'Boissière' }, lat: 48.8674, lng: 2.29 },
          { name: { en: 'Trocadéro', 'pt-BR': 'Trocadéro' }, lat: 48.863, lng: 2.2875 },
          { name: { en: 'Passy', 'pt-BR': 'Passy' }, lat: 48.8575, lng: 2.2858 },
          { name: { en: 'Bir-Hakeim', 'pt-BR': 'Bir-Hakeim' }, lat: 48.8539, lng: 2.2893 },
          { name: { en: 'Dupleix', 'pt-BR': 'Dupleix' }, lat: 48.8505, lng: 2.2935 },
          { name: { en: 'La Motte-Picquet–Grenelle', 'pt-BR': 'La Motte-Picquet–Grenelle' }, lat: 48.8492, lng: 2.2985 },
          { name: { en: 'Cambronne', 'pt-BR': 'Cambronne' }, lat: 48.8475, lng: 2.3025 },
          { name: { en: 'Sèvres–Lecourbe', 'pt-BR': 'Sèvres–Lecourbe' }, lat: 48.8455, lng: 2.31 },
          { name: { en: 'Pasteur', 'pt-BR': 'Pasteur' }, lat: 48.8428, lng: 2.3125 },
          { name: { en: 'Montparnasse–Bienvenüe', 'pt-BR': 'Montparnasse–Bienvenüe' }, lat: 48.8422, lng: 2.3219 },
          { name: { en: 'Edgar Quinet', 'pt-BR': 'Edgar Quinet' }, lat: 48.841, lng: 2.325 },
          { name: { en: 'Raspail', 'pt-BR': 'Raspail' }, lat: 48.8405, lng: 2.3305 },
          { name: { en: 'Denfert-Rochereau', 'pt-BR': 'Denfert-Rochereau' }, lat: 48.8339, lng: 2.3325 },
          { name: { en: 'Saint-Jacques', 'pt-BR': 'Saint-Jacques' }, lat: 48.833, lng: 2.337 },
          { name: { en: 'Glacière', 'pt-BR': 'Glacière' }, lat: 48.831, lng: 2.3435 },
          { name: { en: 'Corvisart', 'pt-BR': 'Corvisart' }, lat: 48.8298, lng: 2.3505 },
          { name: { en: "Place d'Italie", 'pt-BR': "Place d'Italie" }, lat: 48.8312, lng: 2.3558 },
          { name: { en: 'Nationale', 'pt-BR': 'Nationale' }, lat: 48.833, lng: 2.3625 },
          { name: { en: 'Chevaleret', 'pt-BR': 'Chevaleret' }, lat: 48.835, lng: 2.369 },
          { name: { en: 'Quai de la Gare', 'pt-BR': 'Quai de la Gare' }, lat: 48.837, lng: 2.3735 },
          { name: { en: 'Bercy', 'pt-BR': 'Bercy' }, lat: 48.84, lng: 2.3795 },
          { name: { en: 'Dugommier', 'pt-BR': 'Dugommier' }, lat: 48.839, lng: 2.386 },
          { name: { en: 'Daumesnil', 'pt-BR': 'Daumesnil' }, lat: 48.8395, lng: 2.3955 },
          { name: { en: 'Bel-Air', 'pt-BR': 'Bel-Air' }, lat: 48.8415, lng: 2.406 },
          { name: { en: 'Picpus', 'pt-BR': 'Picpus' }, lat: 48.845, lng: 2.401 },
          { name: { en: 'Nation', 'pt-BR': 'Nation' }, lat: 48.8482, lng: 2.3958 },
        ],
        address: 'Métro ligne 6, Paris',
        mapsQuery: 'Métro ligne 6 Paris',
      },
      {
        id: 'par-bakery-gaite',
        name: { en: 'Paris Bakery & Co Gaîté', 'pt-BR': 'Paris Bakery & Co Gaîté' },
        category: 'cafes',
        description: {
          en: 'Bakery stop near Montparnasse / Gaîté.',
          'pt-BR': 'Parada de padaria perto de Montparnasse / Gaîté.',
        },
        googleRating: 3.6,
        lat: 48.8385671,
        lng: 2.3227985,
        address: '49 Rue de la Gaîté, 75014 Paris',
        mapsQuery: 'Paris Bakery and Co Gaite',
        mapsUrl: 'https://maps.app.goo.gl/D6J9toZBdG54v6bF8',
      },
      {
        id: 'par-montparnasse',
        name: { en: 'Tour Montparnasse', 'pt-BR': 'Tour Montparnasse' },
        category: 'tourist',
        landmark: 'montparnasse',
        description: {
          en: 'Best Tower view is from here. Timing matters.',
          'pt-BR': 'A melhor vista da Torre é daqui. Timing importa.',
        },
        googleRating: 4.5,
        lat: 48.8421,
        lng: 2.3219,
        address: '33 Av. du Maine, 75015 Paris',
        mapsQuery: 'Tour Montparnasse observation deck',
      },
      {
        id: 'par-entrecote',
        name: { en: 'Le Relais de l\'Entrecôte', 'pt-BR': 'Le Relais de l\'Entrecôte' },
        category: 'restaurants',
        description: {
          en: 'Steak-frites only — generous portions, great value. No menu stress.',
          'pt-BR': 'Opção de fritas com steak de carne — come-se bastante, ótimo custo/benefício.',
        },
        rating: 4.5,
        googleRating: 4.2,
        favorite: true,
        lat: 48.868142,
        lng: 2.3027971,
        address: '15 Rue Marbeuf, 75008 Paris',
        mapsQuery: 'Le Relais de l\'Entrecôte Paris',
        mapsUrl: 'https://maps.app.goo.gl/tU5yiW73wogbF68A9',
      },
      {
        id: 'par-monceau',
        name: { en: 'Parc Monceau', 'pt-BR': 'Parc Monceau' },
        category: 'parks',
        description: {
          en: 'Beautiful 8th-arrondissement park. Elegant green with follies and soft Paris atmosphere.',
          'pt-BR': 'Parque bonito no 8ème. Verde elegante, fabriques e clima parisiense suave.',
        },
        googleRating: 4.6,
        lat: 48.8797,
        lng: 2.309,
        address: '35 Bd de Courcelles, 75008 Paris',
        mapsQuery: 'Parc Monceau Paris',
      },
      {
        id: 'par-andre-citroen',
        name: { en: 'Parc André Citroën', 'pt-BR': 'Parc André Citroën' },
        category: 'parks',
        description: {
          en: 'Beautiful modern park in the 15th. Lawns, themed gardens, and open sky by the Seine.',
          'pt-BR': 'Parque moderno e bonito no 15ème. Gramados, jardins temáticos e céu aberto à beira do Sena.',
        },
        googleRating: 4.4,
        lat: 48.84119,
        lng: 2.27454,
        address: '2 Rue Cauchy, 75015 Paris',
        mapsQuery: 'Parc André Citroën Paris',
      },
      {
        id: 'par-buttes-chaumont',
        name: { en: 'Parc des Buttes-Chaumont', 'pt-BR': 'Parc des Buttes-Chaumont' },
        category: 'parks',
        description: {
          en: 'Beautiful dramatic park in the 19th. Cliffs, lake, temple belvedere — not the flat Paris green.',
          'pt-BR': 'Parque bonito e dramático no 19ème. Penhascos, lago, templo no mirante — nada de gramado plano.',
        },
        googleRating: 4.6,
        lat: 48.87956,
        lng: 2.3821,
        address: '1 Rue Botzaris, 75019 Paris',
        mapsQuery: 'Parc des Buttes-Chaumont Paris',
      },
      {
        id: 'par-boulogne',
        name: { en: 'Bois de Boulogne', 'pt-BR': 'Bois de Boulogne' },
        category: 'parks',
        description: {
          en: 'Huge beautiful “forest” of Paris in the 16th. Lakes, long walks, and excellent cafés and restaurants inside.',
          'pt-BR': 'Parque bonito e gigante — a “floresta” de Paris no 16ème. Lagos, caminhadas longas e ótimos restaurantes e cafés dentro.',
        },
        googleRating: 4.3,
        lat: 48.86409,
        lng: 2.24826,
        address: 'Bois de Boulogne, 75016 Paris',
        mapsQuery: 'Bois de Boulogne Paris',
      },
      {
        id: 'par-fondation-lv',
        name: { en: 'Fondation Louis Vuitton', 'pt-BR': 'Fondation Louis Vuitton' },
        category: 'photo',
        description: {
          en: 'Frank Gehry sails in the Bois de Boulogne — go for the building photos more than the blockbuster museum queue.',
          'pt-BR': 'Velas do Gehry no Bois de Boulogne — vale mais pela foto do prédio do que pela fila de museu.',
        },
        googleRating: 4.5,
        lat: 48.87665,
        lng: 2.26334,
        address: '8 Av. du Mahatma Gandhi, 75116 Paris',
        mapsQuery: 'Fondation Louis Vuitton Paris',
      },
      {
        id: 'par-serres-auteuil',
        name: {
          en: "Jardin des Serres d'Auteuil",
          'pt-BR': "Jardin des Serres d'Auteuil",
        },
        category: 'parks',
        description: {
          en: 'Large historic greenhouse garden on the edge of the Bois de Boulogne. Old glass, plants, and beauty.',
          'pt-BR': 'Estufa grande e antiga na beira do Bois de Boulogne. Vidro antigo, plantas e bem bonita.',
        },
        googleRating: 4.6,
        lat: 48.8467,
        lng: 2.2526,
        address: "3 Av. de la Porte d'Auteuil, 75016 Paris",
        mapsQuery: "Jardin des Serres d'Auteuil Paris",
      },
      {
        id: 'par-bastille',
        name: { en: 'Place de la Bastille', 'pt-BR': 'Place de la Bastille' },
        category: 'parks',
        description: {
          en: 'Column and crossroads. Night energy nearby.',
          'pt-BR': 'Coluna e cruzamento. Energia noturna por perto.',
        },
        googleRating: 4.3,
        lat: 48.8532,
        lng: 2.3691,
        address: 'Pl. de la Bastille, 75011 Paris',
        mapsQuery: 'Place de la Bastille Paris',
      },
      {
        id: 'par-vosges',
        name: { en: 'Place des Vosges', 'pt-BR': 'Place des Vosges' },
        category: 'parks',
        description: {
          en: 'Perfect arcades and the softest Marais square.',
          'pt-BR': 'Arcadas perfeitas e a praça mais suave do Marais.',
        },
        googleRating: 4.6,
        lat: 48.8556,
        lng: 2.3655,
        address: 'Place des Vosges, 75004 Paris',
        mapsQuery: 'Place des Vosges Paris',
      },
      {
        id: 'par-chez-janou',
        name: { en: 'Chez Janou', 'pt-BR': 'Chez Janou' },
        category: 'restaurants',
        description: {
          en: 'Provençal vibes and chocolate mousse legend.',
          'pt-BR': 'Clima provençal e a lenda da mousse de chocolate.',
        },
        googleRating: 4.3,
        lat: 48.856,
        lng: 2.3658,
        address: '2 Rue Roger Verlomme, 75003 Paris',
        mapsQuery: 'Chez Janou Paris',
        mapsUrl: 'https://maps.app.goo.gl/Zqpj2W2iLWngwcFC7',
      },
      {
        id: 'par-chez-elo',
        name: { en: 'Chez Elo', 'pt-BR': 'Chez Elo' },
        category: 'restaurants',
        description: {
          en: 'Neighborhood table. Keep it simple and local.',
          'pt-BR': 'Mesa de bairro. Simples e local.',
        },
        googleRating: 4.8,
        lat: 48.865,
        lng: 2.355,
        address: '61 Rue de Bretagne, 75003 Paris',
        mapsQuery: 'Chez Elo Paris',
      },
      {
        id: 'par-vincennes-town',
        name: { en: 'Vincennes', 'pt-BR': 'Vincennes' },
        category: 'parks',
        description: {
          en: 'Cozy calm town on the edge of Paris. Pedestrian feel, local shops, restaurants, and cafés — plus a great park and a medieval castle nearby.',
          'pt-BR': 'Cidadezinha nos arredores de Paris, acolhedora e calma. Calçadão, lojinhas, restaurantes, cafés e coisas locais — além de parque grande e castelo medieval.',
        },
        googleRating: 4.5,
        lat: 48.84745,
        lng: 2.43967,
        address: 'Place du Général-Leclerc, 94300 Vincennes',
        mapsQuery: 'Vincennes centre-ville',
      },
      {
        id: 'par-chateau-vincennes',
        name: { en: 'Château de Vincennes', 'pt-BR': 'Castelo de Vincennes' },
        category: 'tourist',
        landmark: 'monument',
        description: {
          en: 'Medieval castle next to the Bois. Keep, walls, and history on the east side of Paris.',
          'pt-BR': 'Castelo medieval ao lado do bosque. Torre, muralhas e história no leste de Paris.',
        },
        googleRating: 4.5,
        lat: 48.84291,
        lng: 2.43581,
        address: 'Avenue de Paris, 94300 Vincennes',
        mapsQuery: 'Château de Vincennes',
      },
      {
        id: 'par-vincennes',
        name: { en: 'Bois de Vincennes', 'pt-BR': 'Bois de Vincennes' },
        category: 'parks',
        description: {
          en: 'Huge beautiful park east of Paris. Lakes, long walks, and the green lung next to Vincennes town.',
          'pt-BR': 'Parque grande e bonito a leste de Paris. Lagos, caminhadas longas e o pulmão verde ao lado da cidade de Vincennes.',
        },
        googleRating: 4.5,
        lat: 48.828,
        lng: 2.433,
        address: 'Bois de Vincennes, Paris',
        mapsQuery: 'Bois de Vincennes Paris',
      },
      {
        id: 'par-canals',
        name: {
          en: 'Paris canals walk',
          'pt-BR': 'Canais de Paris',
        },
        category: 'parks',
        description: {
          en: 'Walk from Place de la République along the canals to Bassin de la Villette — a very Parisian outing. Stop by the water to eat (Jardin Villemin is a great spot). At the Bassin: bars and restaurants, including Paname Brewing Company. A bit further: Parc de la Villette. On the way back, Metro Line 2 has elevated panoramic views over the city.',
          'pt-BR': 'Andar da Place de la République pelos canais até o Bassin de la Villette — atividade bem gostosa e parisiense. Pare na beira para comer (em frente ao Jardin Villemin é um bom spot). No Bassin: vários bares e restaurantes; Paname Brewing Company tem cerveja própria. Um pouco mais: La Villette. Na volta, a linha 2 do metrô tem vista panorâmica — anda sobre a cidade.',
        },
        googleRating: 4.4,
        // Pin on canal waterline by Jardin Villemin (not garden centroid)
        lat: 48.87489,
        lng: 2.36335,
        area: {
          kind: 'polyline',
          /**
           * Walk spine: République → Canal Saint-Martin (OSM waterway) →
           * Bassin de la Villette → Parc de la Villette.
           * Canal segment decimated from Nominatim/OSM MultiLineString
           * (not a freehand chord through the garden).
           */
          path: [
            [48.86754, 2.36396], // Place de la République
            [48.868956, 2.367169], // Join Canal Saint-Martin (Quai de Valmy)
            [48.873018, 2.363995], // Locks / mid canal
            [48.873902, 2.363316],
            [48.874893, 2.363353], // Canal opposite Jardin Villemin
            [48.877483, 2.365585],
            [48.87834, 2.366324],
            [48.879692, 2.367485],
            [48.882273, 2.369705], // Toward Stalingrad / Jaurès
            [48.883074, 2.370404],
            [48.884489, 2.371615], // Bassin de la Villette (SW entry)
            [48.88644, 2.37553], // Bassin centerline
            [48.888392, 2.379452], // Bassin NE / Paname side
            [48.891441, 2.385573], // Toward Ourcq / Villette
            [48.89194, 2.386225],
            [48.89489, 2.38844], // Parc de la Villette
          ],
        },
        routeStops: [
          {
            name: {
              en: 'Place de la République',
              'pt-BR': 'Place de la République',
            },
            lat: 48.86754,
            lng: 2.36396,
          },
          {
            // Marker on the canal edge by the park (path passes here)
            name: { en: 'Jardin Villemin', 'pt-BR': 'Jardin Villemin' },
            lat: 48.87489,
            lng: 2.36335,
          },
          {
            name: {
              en: 'Bassin de la Villette',
              'pt-BR': 'Bassin de la Villette',
            },
            lat: 48.88644,
            lng: 2.37553,
          },
          {
            name: {
              en: 'Parc de la Villette',
              'pt-BR': 'Parc de la Villette',
            },
            lat: 48.89489,
            lng: 2.38844,
          },
        ],
        address: 'Canal Saint-Martin → Bassin de la Villette, Paris',
        mapsQuery: 'Canal Saint-Martin Paris',
      },
      {
        id: 'par-paname-brewing',
        name: { en: 'Paname Brewing Company', 'pt-BR': 'Paname Brewing Company' },
        category: 'restaurants',
        description: {
          en: 'Brewpub on the Bassin de la Villette. Their own beer, waterfront terrace — great stop on the canal walk.',
          'pt-BR': 'Bar com cerveja própria no Bassin de la Villette. Terraço na água — ótima parada no passeio pelos canais.',
        },
        googleRating: 4.3,
        lat: 48.88783,
        lng: 2.37876,
        address: '41 bis Quai de la Loire, 75019 Paris',
        mapsQuery: 'Paname Brewing Company Paris',
      },
      {
        id: 'par-la-villette',
        name: { en: 'Parc de la Villette', 'pt-BR': 'Parc de la Villette' },
        category: 'parks',
        description: {
          en: 'Large park at the end of the canal walk. Museums, theatre, Philharmonie, and open space to wander.',
          'pt-BR': 'Parque grande no fim do passeio dos canais. Museus, teatro, philharmonie e espaço aberto para explorar.',
        },
        googleRating: 4.4,
        lat: 48.89489,
        lng: 2.38844,
        address: '211 Av. Jean Jaurès, 75019 Paris',
        mapsQuery: 'Parc de la Villette Paris',
      },
      {
        id: 'par-metro-2',
        name: { en: 'Metro Line 2', 'pt-BR': 'Linha 2 do metrô' },
        category: 'photo',
        description: {
          en: 'Elevated stretches with panoramic city views — great return after the canals / La Villette. Ride it on purpose.',
          'pt-BR': 'Trechos elevados com vista panorâmica da cidade — ótimo na volta dos canais / La Villette. Pegue de propósito.',
        },
        // Anchor at elevated Pigalle (on the authored station spine)
        lat: 48.8828,
        lng: 2.3499,
        area: {
          kind: 'polyline',
          // Full line 2 via main stations (Porte Dauphine → Nation)
          path: [
            [48.8715, 2.276], // Porte Dauphine
            [48.8708, 2.2855], // Victor Hugo
            [48.8738, 2.295], // Charles de Gaulle–Étoile
            [48.8755, 2.305], // Ternes
            [48.878, 2.314], // Courcelles
            [48.8805, 2.322], // Monceau
            [48.882, 2.3275], // Villiers
            [48.8835, 2.333], // Rome
            [48.8838, 2.338], // Place de Clichy
            [48.8835, 2.3435], // Blanche
            [48.8828, 2.3499], // Pigalle
            [48.8825, 2.3545], // Anvers
            [48.8837, 2.3605], // Barbès–Rochechouart (elevated)
            [48.8842, 2.3655], // La Chapelle
            [48.8828, 2.3705], // Jaurès / Stalingrad
            [48.8785, 2.381], // Colonel Fabien
            [48.8755, 2.389], // Belleville
            [48.872, 2.397], // Couronnes
            [48.8695, 2.4015], // Ménilmontant
            [48.8655, 2.405], // Père Lachaise
            [48.8615, 2.401], // Philippe Auguste
            [48.8565, 2.398], // Alexandre Dumas
            [48.8525, 2.3985], // Avron
            [48.8482, 2.3958], // Nation
          ],
        },
        routeStops: [
          {
            name: { en: 'Porte Dauphine', 'pt-BR': 'Porte Dauphine' },
            lat: 48.8715,
            lng: 2.276,
          },
          {
            name: {
              en: 'Charles de Gaulle–Étoile',
              'pt-BR': 'Charles de Gaulle–Étoile',
            },
            lat: 48.8738,
            lng: 2.295,
          },
          {
            name: { en: 'Pigalle', 'pt-BR': 'Pigalle' },
            lat: 48.8828,
            lng: 2.3499,
          },
          {
            name: { en: 'Anvers', 'pt-BR': 'Anvers' },
            lat: 48.8825,
            lng: 2.3545,
          },
          {
            name: {
              en: 'Barbès–Rochechouart',
              'pt-BR': 'Barbès–Rochechouart',
            },
            lat: 48.8837,
            lng: 2.3605,
          },
          {
            name: { en: 'Jaurès', 'pt-BR': 'Jaurès' },
            lat: 48.8828,
            lng: 2.3705,
          },
          {
            name: { en: 'Belleville', 'pt-BR': 'Belleville' },
            lat: 48.8755,
            lng: 2.389,
          },
          {
            name: { en: 'Nation', 'pt-BR': 'Nation' },
            lat: 48.8482,
            lng: 2.3958,
          },
        ],
        address: 'Métro ligne 2, Paris',
        mapsQuery: 'Métro ligne 2 Paris',
      },
      {
        id: 'par-royal-cambronne',
        name: { en: 'Le Royal Cambronne', 'pt-BR': 'Le Royal Cambronne' },
        category: 'restaurants',
        description: {
          en: 'Very Parisian terrace vibe in the 15th: afternoon drink watching the street, open square, Metro Line 6 passing in front.',
          'pt-BR': 'Restaurante com vibe bem parisiense no 15ème: tomar algo à tarde olhando o movimento da rua, praça aberta, linha 6 passando na frente.',
        },
        googleRating: 3.9,
        lat: 48.84767,
        lng: 2.30097,
        address: '1 Place Cambronne, 75015 Paris',
        mapsQuery: 'Le Royal Cambronne Paris',
      },
      {
        id: 'par-bike',
        name: {
          en: 'Bike around Paris',
          'pt-BR': 'Alugar bike em Paris',
        },
        category: 'parks',
        description: {
          en: 'Rent a bike (Vélib’ or similar) and ride the city — parks, river quays, and long avenues. One of the best ways to feel Paris at street level.',
          'pt-BR': 'Alugar bike (Vélib’ ou similar) e dar uma volta por Paris — parques, margens do rio e avenidas. Uma das melhores formas de sentir a cidade na rua.',
        },
        googleRating: 4.9,
        // Station Vélib' Métropole 4017 — Place de l'Hôtel de Ville (open data)
        lat: 48.85733,
        lng: 2.35146,
        address: "Station Vélib' Place de l'Hôtel de Ville, 75004 Paris",
        mapsQuery: "Station Vélib Place de l'Hôtel de Ville Paris",
      },
      {
        id: 'par-orsay',
        name: { en: "Musée d'Orsay", 'pt-BR': "Musée d'Orsay" },
        category: 'tourist',
        description: {
          en: 'Major museum in a grand old station building — beautiful modern space inside. Across the river from the Louvre. Famous clock with views from the Louvre toward Sacré-Cœur; great photos. Paintings, sculpture, models — Monet, Van Gogh, and more. Restaurant inside.',
          'pt-BR': 'Museu grande num prédio antigo (como o Louvre), com espaço interno moderno e bonito. Do outro lado do rio, em frente ao Louvre. Famoso pelo relógio — dá para ver do Louvre até o Sacré-Cœur; ótimo para fotos. Quadros, esculturas e maquetes; Monet, Van Gogh e outros. Tem restaurante dentro.',
        },
        rating: 5,
        googleRating: 4.8,
        lat: 48.85992,
        lng: 2.32658,
        address: "1 Rue de la Légion d'Honneur, 75007 Paris",
        mapsQuery: "Musée d'Orsay Paris",
      },
      {
        id: 'par-orangerie',
        name: { en: "Musée de l'Orangerie", 'pt-BR': "Musée de l'Orangerie" },
        category: 'photo',
        description: {
          en: 'Smaller museum inside the Tuileries. Famous for Monet’s Water Lilies — intimate and beautiful.',
          'pt-BR': 'Museu menor, dentro do Jardin des Tuileries. Famoso pelas obras do Monet (Nenúfares) — íntimo e bonito.',
        },
        googleRating: 4.6,
        lat: 48.86377,
        lng: 2.32266,
        address: 'Jardin des Tuileries, 75001 Paris',
        mapsQuery: "Musée de l'Orangerie Paris",
      },
      {
        id: 'par-luxor-obelisk',
        name: {
          en: 'Luxor Obelisk',
          'pt-BR': 'Obelisco de Luxor',
        },
        category: 'tourist',
        description: {
          en: 'Ancient Egyptian obelisk at Place de la Concorde — centerpiece of the historic axis.',
          'pt-BR': 'Obelisco egípcio antigo na Place de la Concorde — marco do eixo histórico.',
        },
        rating: 4,
        googleRating: 4.7,
        lat: 48.86548,
        lng: 2.32113,
        // OSM base outline via travel-areas-osm.ts (par-luxor-obelisk)
        address: 'Place de la Concorde, 75008 Paris',
        mapsQuery: 'Obélisque de Louxor Place de la Concorde Paris',
      },
      {
        id: 'par-bouillon',
        name: { en: 'Bouillon', 'pt-BR': 'Bouillon' },
        category: 'restaurants',
        description: {
          en: 'Classic French dining, affordable, famous, and very good. Several locations (3rd, 6th, 9th, 18th…). Book for a table inside, or takeaway in ~5 minutes — great idea: grab food and eat at a park or by the canal.',
          'pt-BR': 'Restaurante bem francês, preço acessível, famoso e gostoso. Várias unidades (3º, 6º, 9º, 18ème…). Reserve para comer dentro, ou peça para levar (~5 min). Ideia: pegar para viagem e comer em parque ou no canal.',
        },
        googleRating: 4.9,
        lat: 48.87194,
        lng: 2.34301,
        address: '7 Rue du Faubourg Montmartre, 75009 Paris',
        mapsQuery: 'Bouillon Chartier Paris',
      },
      {
        id: 'par-train-bleu',
        name: { en: 'Le Train Bleu', 'pt-BR': 'Le Train Bleu' },
        category: 'restaurants',
        description: {
          en: 'Gilded dining hall inside Gare de Lyon. Theatrical.',
          'pt-BR': 'Salão dourado dentro da Gare de Lyon. Teatral.',
        },
        googleRating: 4.4,
        lat: 48.8447,
        lng: 2.3735,
        address: 'Place Louis-Armand, 75012 Paris',
        mapsQuery: 'Le Train Bleu Gare de Lyon',
        mapsUrl: 'https://maps.app.goo.gl/uwXCi4aTvP2i5QXW6',
      },
      {
        id: 'par-marais',
        name: { en: 'Le Marais', 'pt-BR': 'Le Marais' },
        category: 'parks',
        description: {
          en: 'Cafés, vintage shops, and golden-hour streets.',
          'pt-BR': 'Cafés, brechós e ruas de luz dourada.',
        },
        lat: 48.8575,
        lng: 2.359,
        address: 'Le Marais, 75004 Paris',
        mapsQuery: 'Le Marais Paris',
      },
      {
        id: 'par-casa-do-gui',
        name: { en: 'Casa do Gui', 'pt-BR': 'Casa do Gui' },
        category: 'lodging',
        description: {
          en: 'Home base in Noisy-le-Sec — east of Paris, easy RER access into the city.',
          'pt-BR': 'Base em Noisy-le-Sec — leste de Paris, com bom acesso de RER ao centro.',
        },
        lat: 48.893017,
        lng: 2.454059,
        address: '30 Rue des Bergeries, 93130 Noisy-le-Sec',
        mapsQuery: '30 Rue des Bergeries, 93130 Noisy-le-Sec',
      },
      {
        id: 'par-auchan-noisy',
        name: {
          en: 'Auchan Supermarché (Noisy-le-Sec)',
          'pt-BR': 'Auchan Supermarché (Noisy-le-Sec)',
        },
        category: 'markets',
        description: {
          en: 'Full supermarket ~5 min walk from Casa do Gui — basics, produce, drinks, and household stock for the stay.',
          'pt-BR':
            'Supermercado completo a ~5 min a pé da Casa do Gui — básicos, hortifruti, bebidas e estoque da casa.',
        },
        googleRating: 3.8,
        lat: 48.8942003,
        lng: 2.4582537,
        address: '90 Rue Jean Jaurès, 93130 Noisy-le-Sec',
        mapsQuery: 'Auchan Supermarché 90 Rue Jean Jaurès Noisy-le-Sec',
        mapsUrl:
          'https://www.google.com/maps/search/?api=1&query=Auchan+Supermarch%C3%A9+90+Rue+Jean+Jaur%C3%A8s+Noisy-le-Sec',
      },
      {
        id: 'par-disneyland',
        name: { en: 'Disneyland Paris', 'pt-BR': 'Disneyland Paris' },
        category: 'parks',
        description: {
          en: 'Two theme parks in Marne-la-Vallée (Disneyland Park + Adventure World). RER A to Chessy (~40 min) + short walk; full day of rides and parades.',
          'pt-BR': 'Dois parques temáticos em Marne-la-Vallée (Disneyland Park + Adventure World). RER A até Chessy (~40 min) + caminhada curta; dia inteiro de brinquedos e paradas.',
        },
        googleRating: 4.5,
        // Pin inside Parc Disneyland ring (multipolygon with Adventure World)
        lat: 48.871,
        lng: 2.7765,
        address: 'Boulevard de Parc, 77700 Chessy',
        mapsQuery: 'Disneyland Paris',
      },
      {
        id: 'par-bella-notte',
        name: {
          en: 'Pizzeria Bella Notte',
          'pt-BR': 'Pizzeria Bella Notte',
        },
        category: 'restaurants',
        description: {
          en: 'Counter-service pizzeria in Disneyland Park Fantasyland — known for the Mickey-shaped individual pizza (~€11).',
          'pt-BR':
            'Pizzaria self-service no Fantasyland do Disneyland Park — famosa pela pizza individual em formato do Mickey (~€11).',
        },
        googleRating: 3.9,
        // Fantasyland, Disneyland Park (Chessy)
        lat: 48.8738,
        lng: 2.7755,
        address: 'Disneyland Park, Fantasyland, 77700 Chessy',
        mapsQuery: 'Pizzeria Bella Notte Disneyland Paris',
      },
      {
        id: 'par-mcdonalds-disney',
        name: {
          en: "McDonald's Disney Village",
          'pt-BR': "McDonald's Disney Village",
        },
        category: 'commons',
        description: {
          en: 'McDonald’s in Disney Village (outside the park gates) — easy cheap bite after rope drop or when the parks close. Five Guys and Starbucks are nearby on the Village strip.',
          'pt-BR':
            'McDonald’s na Disney Village (fora dos portões) — refeição barata e fácil depois do rope drop ou quando os parques fecham. Five Guys e Starbucks ficam na mesma faixa do Village.',
        },
        googleRating: 3.6,
        // OSM way/1466595233 — Disney Village, Chessy
        lat: 48.86813,
        lng: 2.78564,
        address: 'Disney Village, 77700 Chessy',
        mapsQuery: "McDonald's Disney Village Chessy",
      },

      // ── Chains (commons) ──
      {
        id: 'par-mcdonalds-champs',
        name: {
          en: "McDonald's Champs-Élysées",
          'pt-BR': "McDonald's Champs-Élysées",
        },
        category: 'commons',
        description: {
          en: 'The famous Champs-Élysées McDonald’s — touristy, open late, known quantity when you need something easy.',
          'pt-BR': 'O McDonald’s famoso da Champs-Élysées — turístico, abre tarde, opção fácil quando você quer algo previsível.',
        },
        googleRating: 3.7,
        lat: 48.87185,
        lng: 2.30155,
        address: '140 Av. des Champs-Élysées, 75008 Paris',
        mapsQuery: "McDonald's Champs-Élysées Paris",
      },
      {
        id: 'par-burger-king-opera',
        name: { en: 'Burger King Opéra', 'pt-BR': 'Burger King Opéra' },
        category: 'commons',
        description: {
          en: 'Central BK near Opéra — reliable chain stop between department stores and métro.',
          'pt-BR': 'BK no centro perto da Opéra — parada de rede entre grands magasins e metrô.',
        },
        googleRating: 3.5,
        lat: 48.8714,
        lng: 2.3312,
        address: '4 Bd des Capucines, 75009 Paris',
        mapsQuery: 'Burger King Opéra Paris',
      },
      {
        id: 'par-starbucks-opera',
        name: { en: 'Starbucks Opéra', 'pt-BR': 'Starbucks Opéra' },
        category: 'commons',
        description: {
          en: 'Starbucks on the Opéra corner — Wi‑Fi, AC, and a familiar order between museums.',
          'pt-BR': 'Starbucks na esquina da Opéra — Wi‑Fi, ar-condicionado e pedido familiar entre museus.',
        },
        googleRating: 3.8,
        lat: 48.8709,
        lng: 2.3321,
        address: '3 Bd des Capucines, 75002 Paris',
        mapsQuery: 'Starbucks Opéra Capucines Paris',
      },
      {
        id: 'par-five-guys-rivoli',
        name: { en: 'Five Guys Rivoli', 'pt-BR': 'Five Guys Rivoli' },
        category: 'commons',
        description: {
          en: 'US chain burgers near the Louvre corridor — messy, filling, no reservation drama.',
          'pt-BR': 'Burgers da rede americana perto do eixo do Louvre — bagunçado, enche, sem drama de reserva.',
        },
        googleRating: 4.2,
        lat: 48.8608,
        lng: 2.3365,
        address: '105 Rue de Rivoli, 75001 Paris',
        mapsQuery: 'Five Guys Rue de Rivoli Paris',
      },
      {
        id: 'par-kfc-les-halles',
        name: { en: 'KFC Les Halles', 'pt-BR': 'KFC Les Halles' },
        category: 'commons',
        description: {
          en: 'KFC in the Forum des Halles cluster — quick fried chicken when the city is loud.',
          'pt-BR': 'KFC no cluster do Forum des Halles — frango rápido quando a cidade está barulhenta.',
        },
        googleRating: 3.4,
        lat: 48.8615,
        lng: 2.3472,
        address: 'Forum des Halles, 75001 Paris',
        mapsQuery: 'KFC Forum des Halles Paris',
      },

      // ── Markets ──
      {
        id: 'par-marche-enfants-rouges',
        name: {
          en: 'Marché des Enfants Rouges',
          'pt-BR': 'Marché des Enfants Rouges',
        },
        category: 'markets',
        description: {
          en: 'Paris’s oldest covered market — multicultural lunch stalls in the Marais.',
          'pt-BR': 'Mercado coberto mais antigo de Paris — barracas de almoço multiculturais no Marais.',
        },
        googleRating: 4.4,
        lat: 48.86305,
        lng: 2.36185,
        address: '39 Rue de Bretagne, 75003 Paris',
        mapsQuery: 'Marché des Enfants Rouges Paris',
      },
      {
        id: 'par-marche-aligre',
        name: { en: "Marché d'Aligre", 'pt-BR': "Marché d'Aligre" },
        category: 'markets',
        description: {
          en: 'Lively outdoor + covered market — cheap produce and a very local 12e energy.',
          'pt-BR': 'Mercado de rua + coberto bem vivo — hortifruti barato e clima bem local do 12e.',
        },
        googleRating: 4.5,
        lat: 48.8492,
        lng: 2.3779,
        address: "Place d'Aligre, 75012 Paris",
        mapsQuery: "Marché d'Aligre Paris",
      },
      {
        id: 'par-marche-bastille',
        name: { en: 'Marché Bastille', 'pt-BR': 'Marché Bastille' },
        category: 'markets',
        description: {
          en: 'Big open-air market on Bd Richard-Lenoir — Thursday & Sunday mornings.',
          'pt-BR': 'Grande feira ao ar livre no Bd Richard-Lenoir — manhãs de quinta e domingo.',
        },
        googleRating: 4.5,
        lat: 48.8555,
        lng: 2.3705,
        address: 'Bd Richard-Lenoir, 75011 Paris',
        mapsQuery: 'Marché Bastille Paris',
      },
      {
        id: 'par-rue-cler',
        name: { en: 'Rue Cler market street', 'pt-BR': 'Rua Cler (mercado)' },
        category: 'markets',
        description: {
          en: 'Pedestrian food street near the Eiffel Tower — fromageries, bakers, and produce.',
          'pt-BR': 'Rua pedonal de comida perto da Torre — queijarias, padarias e hortifruti.',
        },
        googleRating: 4.5,
        lat: 48.8566,
        lng: 2.3067,
        address: 'Rue Cler, 75007 Paris',
        mapsQuery: 'Rue Cler Paris',
      },

      // ── Shopping ──
      {
        id: 'par-bon-marche',
        name: { en: 'Le Bon Marché', 'pt-BR': 'Le Bon Marché' },
        category: 'shopping',
        description: {
          en: 'Left-bank grand magasin — elegant floors and the legendary Grande Épicerie.',
          'pt-BR': 'Grand magasin da margem esquerda — andares elegantes e a lendária Grande Épicerie.',
        },
        googleRating: 4.5,
        lat: 48.8511,
        lng: 2.3244,
        address: '24 Rue de Sèvres, 75007 Paris',
        mapsQuery: 'Le Bon Marché Paris',
      },
      {
        id: 'par-forum-halles',
        name: { en: 'Forum des Halles', 'pt-BR': 'Forum des Halles' },
        category: 'shopping',
        description: {
          en: 'Central mall under the Canopée — chains, cinemas, and métro hub.',
          'pt-BR': 'Shopping central sob a Canopée — redes, cinema e hub de metrô.',
        },
        rating: 4.5,
        favorite: true,
        googleRating: 3.9,
        lat: 48.862,
        lng: 2.3465,
        address: 'Forum des Halles, 75001 Paris',
        mapsQuery: 'Forum des Halles Paris',
      },
      {
        id: 'par-bhv-marais',
        name: { en: 'BHV Marais', 'pt-BR': 'BHV Marais' },
        category: 'shopping',
        description: {
          en: 'Department store by Hôtel de Ville — DIY floors, fashion, and a solid rooftop café.',
          'pt-BR': 'Grand magasin ao lado do Hôtel de Ville — DIY, moda e terraço com café.',
        },
        googleRating: 4.2,
        lat: 48.8573,
        lng: 2.3535,
        address: '52 Rue de Rivoli, 75004 Paris',
        mapsQuery: 'BHV Marais Paris',
      },
      {
        id: 'par-shakespeare',
        name: {
          en: 'Shakespeare and Company',
          'pt-BR': 'Shakespeare and Company',
        },
        category: 'cafes',
        description: {
          en: 'Café by the Seine with the iconic English bookshop next door — coffee, queues, history, and first-edition energy.',
          'pt-BR':
            'Café à beira do Sena com a icônica livraria em inglês ao lado — café, fila, história e clima de primeira edição.',
        },
        googleRating: 4.5,
        lat: 48.8526,
        lng: 2.3471,
        address: '37 Rue de la Bûcherie, 75005 Paris',
        mapsQuery: 'Shakespeare and Company Paris',
      },

      // ── From roteiro (≤ €40 / person) not already in the list ──
      {
        id: 'par-place-dauphine',
        name: { en: 'Place Dauphine', 'pt-BR': 'Place Dauphine' },
        category: 'parks',
        description: {
          en: 'Quiet triangular square on Île de la Cité — charming, less obvious, good for a drink.',
          'pt-BR': 'Praça triangular calma na Île de la Cité — charmosa, menos óbvia, boa para um drink.',
        },
        googleRating: 4.5,
        lat: 48.8565,
        lng: 2.3423,
        address: 'Place Dauphine, 75001 Paris',
        mapsQuery: 'Place Dauphine Paris',
      },
      {
        id: 'par-cafe-flore',
        name: { en: 'Café de Flore', 'pt-BR': 'Café de Flore' },
        category: 'cafes',
        description: {
          en: 'Saint-Germain classic still loved by locals and writers — pricey but iconic.',
          'pt-BR': 'Clássico de Saint-Germain ainda frequentado por locais e escritores — caro, mas icônico.',
        },
        googleRating: 4.1,
        lat: 48.8541,
        lng: 2.3326,
        address: '172 Boulevard Saint-Germain, 75006 Paris',
        mapsQuery: 'Café de Flore Paris',
      },
      {
        id: 'par-rosa-bonheur',
        name: {
          en: 'Rosa Bonheur (Buttes-Chaumont)',
          'pt-BR': 'Rosa Bonheur (Buttes-Chaumont)',
        },
        category: 'restaurants',
        description: {
          en: 'Guinguette inside Buttes-Chaumont — very Parisian, relaxed drinks and food.',
          'pt-BR': 'Guinguette dentro do Buttes-Chaumont — bem parisiense, drinks e comida descontraídos.',
        },
        googleRating: 4.3,
        lat: 48.8797,
        lng: 2.3825,
        address: '2 Allée de la Cascade, 75019 Paris',
        mapsQuery: 'Rosa Bonheur Buttes Chaumont Paris',
      },
      {
        id: 'par-belleville',
        name: { en: 'Parc de Belleville', 'pt-BR': 'Parc de Belleville' },
        category: 'parks',
        description: {
          en: 'Panoramic city view + street art — still feels like a real neighborhood park.',
          'pt-BR': 'Vista panorâmica da cidade + street art — ainda parece parque de bairro de verdade.',
        },
        googleRating: 4.5,
        lat: 48.8715,
        lng: 2.3848,
        address: '47 Rue des Couronnes, 75020 Paris',
        mapsQuery: 'Parc de Belleville Paris',
      },
      {
        id: 'par-versailles',
        name: {
          en: 'Château de Versailles',
          'pt-BR': 'Château de Versailles',
        },
        category: 'tourist',
        landmark: 'monument',
        description: {
          en: 'Louis XIV’s palace + gardens + Trianon — full day via RER C (Rive Gauche) + ~10 min walk. Passport ~€32–35; closed Mondays.',
          'pt-BR': 'Palácio de Luís XIV + jardins + Trianon — dia inteiro via RER C (Rive Gauche) + ~10 min a pé. Passport ~€32–35; fecha às segundas.',
        },
        rating: 5,
        favorite: true,
        googleRating: 4.6,
        lat: 48.8049,
        lng: 2.1204,
        address: "Place d'Armes, 78000 Versailles",
        mapsQuery: 'Château de Versailles',
      },
      {
        id: 'par-baron-rouge',
        name: { en: 'Le Baron Rouge', 'pt-BR': 'Le Baron Rouge' },
        category: 'restaurants',
        description: {
          en: 'Legendary wine bar by Marché d’Aligre — barrel wine + weekend oysters.',
          'pt-BR': 'Bar a vin lendário ao lado do Marché d’Aligre — vinho do barril + ostras no fim de semana.',
        },
        googleRating: 4.4,
        lat: 48.8494,
        lng: 2.3775,
        address: '1 Rue Théophile Roussel, 75012 Paris',
        mapsQuery: 'Le Baron Rouge Paris',
      },
      {
        id: 'par-promenade-plantee',
        name: {
          en: 'Promenade Plantée (Coulée Verte)',
          'pt-BR': 'Promenade Plantée (Coulée Verte)',
        },
        category: 'parks',
        description: {
          en: 'Elevated green walk from Bastille — local alternative to the central gardens.',
          'pt-BR': 'Caminhada elevada e verde a partir da Bastille — alternativa local aos jardins do centro.',
        },
        googleRating: 4.5,
        lat: 48.847,
        lng: 2.375,
        address: '1 Coulée verte René-Dumont, 75012 Paris',
        mapsQuery: 'Promenade Plantée Paris',
      },
    ],
  },
  {
    slug: 'roma',
    name: { en: 'Rome', 'pt-BR': 'Roma' },
    country: { en: 'Italy', 'pt-BR': 'Itália' },
    countryKey: 'italia',
    lat: 41.9028,
    lng: 12.4964,
    zoom: 13,
    places: [
      // —— Air / rail ——
      {
        id: 'rom-fco',
        name: {
          en: 'Fiumicino Airport (FCO)',
          'pt-BR': 'Aeroporto de Fiumicino (FCO)',
        },
        category: 'airport',
        featured: true,
        description: {
          en: 'Leonardo da Vinci — Rome’s main international hub. Leonardo Express train to Termini ~32 min.',
          'pt-BR':
            'Leonardo da Vinci — principal aeroporto internacional de Roma. Leonardo Express até a Termini ~32 min.',
        },
        googleRating: 3.9,
        lat: 41.8153911,
        lng: 12.2264848,
        address: 'Via Leonardo da Vinci, 00054 Fiumicino RM, Italy',
        mapsQuery: 'Aeroporto di Roma-Fiumicino FCO',
      },
      {
        id: 'rom-termini',
        name: {
          en: 'Roma Termini station',
          'pt-BR': 'Estação Roma Termini',
        },
        category: 'transport',
        featured: true,
        description: {
          en: 'Main train hub — high-speed, regional, and metro A/B/B1. Also the city end of the Leonardo Express from FCO.',
          'pt-BR':
            'Hub principal de trens — alta velocidade, regionais e metrô A/B/B1. Também o fim do Leonardo Express vindo de FCO.',
        },
        googleRating: 3.8,
        lat: 41.901195,
        lng: 12.5016713,
        address: 'Piazza dei Cinquecento, 00185 Roma',
        mapsQuery: 'Roma Termini stazione',
      },
      // —— Where to eat ——
      {
        id: 'rom-gallina-bianca',
        name: { en: 'La Gallina Bianca', 'pt-BR': 'La Gallina Bianca' },
        category: 'restaurants',
        description: {
          en: 'Best carbonara tip (Canal dos Caçadores). Typical plate ~€14; truffle carbonara was €18.',
          'pt-BR':
            'Melhor carbonara (Canal dos Caçadores). Média ~€14 o prato; pegaram a carbonara trufada a €18.',
        },
        googleRating: 4.3,
        lat: 41.8995729,
        lng: 12.4976136,
        address: 'Via Antonio Rosmini 8, 00185 Roma',
        mapsQuery: 'La Gallina Bianca Via Antonio Rosmini Roma',
      },
      {
        id: 'rom-alfredo-ada',
        name: { en: 'Alfredo e Ada', 'pt-BR': 'Alfredo e Ada' },
        category: 'restaurants',
        description: {
          en: 'Pastas, lasagna, classic Roman plates (Pedro & Juju). ~€10–13 per dish.',
          'pt-BR':
            'Massas, lasanha e pratos clássicos (Pedro e Juju). Média €10–13 o prato.',
        },
        googleRating: 4.5,
        lat: 41.8995579,
        lng: 12.4672366,
        address: 'Via dei Banchi Nuovi 14, 00186 Roma',
        mapsQuery: 'Alfredo e Ada Via dei Banchi Nuovi Roma',
      },
      {
        id: 'rom-antico-vinaio',
        name: {
          en: "All'Antico Vinaio",
          'pt-BR': "All'Antico Vinaio",
        },
        category: 'restaurants',
        description: {
          en: 'Famous stuffed schiacciata sandwiches — delivery too (Pedro & Juju). ~€12.',
          'pt-BR':
            'Sanduíche famoso e muito bom (tem até delivery) — indicação Pedro e Juju. Média ~€12.',
        },
        googleRating: 4.4,
        lat: 41.8999413,
        lng: 12.4763914,
        address: 'Piazza della Maddalena 3, 00186 Roma',
        mapsQuery: "All'Antico Vinaio Piazza della Maddalena Roma",
      },
      {
        id: 'rom-baffetto',
        name: {
          en: 'Pizzeria da Baffetto',
          'pt-BR': 'Pizzeria da Baffetto',
        },
        category: 'restaurants',
        description: {
          en: 'Classic individual Roman pizza (Pedro & Juju). ~€8–15.',
          'pt-BR':
            'Pizza individual clássica (Pedro e Juju). €8–15.',
        },
        googleRating: 4.2,
        lat: 41.8983047,
        lng: 12.4703507,
        address: 'Via del Governo Vecchio 114, 00186 Roma',
        mapsQuery: 'Pizzeria da Baffetto Via del Governo Vecchio Roma',
      },
      {
        id: 'rom-suppli',
        name: { en: 'I Supplì', 'pt-BR': 'I Supplì / Supplì Roma' },
        category: 'restaurants',
        description: {
          en: 'Rice balls ~€2 each — cacio e pepe, carbonara, cheese (Canal dos Caçadores).',
          'pt-BR':
            'Bolinhos ~€2 cada — cacio e pepe (pimenta e queijo), carbonara e queijo (Canal dos Caçadores).',
        },
        googleRating: 4.5,
        lat: 41.8882294,
        lng: 12.4709933,
        address: 'Via di San Francesco a Ripa 137, 00153 Roma',
        mapsQuery: 'I Supplì Via di San Francesco a Ripa Roma',
      },
      {
        id: 'rom-norcineria',
        name: {
          en: 'La Norcineria (Iacozzilli)',
          'pt-BR': 'La Norcineria (Iacozzilli)',
        },
        category: 'restaurants',
        description: {
          en: 'Porchetta sandwich stop in Trastevere (Canal dos Caçadores).',
          'pt-BR':
            'Sanduíche de porchetta em Trastevere (Canal dos Caçadores).',
        },
        googleRating: 4.6,
        lat: 41.8873725,
        lng: 12.4706429,
        address: 'Via Natale del Grande 15/16, 00153 Roma',
        mapsQuery: 'La Norcineria Iacozzilli Via Natale del Grande Roma',
      },
      {
        id: 'rom-said',
        name: { en: 'Said dal 1923', 'pt-BR': 'Said dal 1923' },
        category: 'cafes',
        description: {
          en: 'Historic chocolate shop & gelato (Canal dos Caçadores). Scoops ~€2.40–3.40.',
          'pt-BR':
            'Sorvete e chocolate histórico (Canal dos Caçadores). Média €2,40–3,40 a unidade.',
        },
        googleRating: 4.5,
        lat: 41.9046814,
        lng: 12.4778803,
        address: 'Via Tomacelli 13–14, 00186 Roma',
        mapsQuery: 'Said dal 1923 Via Tomacelli Roma',
      },
      {
        id: 'rom-forno-trevi',
        name: {
          en: "L'Antico Forno (Trevi)",
          'pt-BR': "L'Antico Forno (Trevi)",
        },
        category: 'cafes',
        description: {
          en: 'Croissants at the counter facing Trevi: plain €1.50, chocolate €2.30, pistachio €3. American coffee €1.60.',
          'pt-BR':
            'Croissant bem na frente da Fontana di Trevi, comer na bancada em pé: €1,50 sem recheio, €2,30 chocolate, €3,00 pistache. Café americano €1,60.',
        },
        googleRating: 4.1,
        lat: 41.9007946,
        lng: 12.4830539,
        address: 'Piazza di Trevi 100 / Via delle Muratte 11, 00187 Roma',
        mapsQuery: "L'Antico Forno Fontana di Trevi Roma",
      },
      // —— What to visit ——
      {
        id: 'rom-colosseum',
        name: { en: 'Colosseum', 'pt-BR': 'Coliseu' },
        category: 'tourist',
        landmark: 'monument',
        description: {
          en: 'Icon of Rome. Combo with Forum & Palatine ~€16–18; arena floor access ~€22–24.',
          'pt-BR':
            'Ícone de Roma. €16–18 com ingresso para Fórum e Palatino juntos; €22–24 para acessar a arena do Coliseu também.',
        },
        googleRating: 4.7,
        lat: 41.8909421,
        lng: 12.491903,
        address: 'Piazza del Colosseo, 1, 00184 Roma',
        mapsQuery: 'Colosseo Roma',
      },
      {
        id: 'rom-forum',
        name: { en: 'Roman Forum', 'pt-BR': 'Fórum Romano' },
        category: 'tourist',
        landmark: 'monument',
        description: {
          en: 'Heart of ancient Rome — usually on the same ticket as the Colosseum & Palatine.',
          'pt-BR':
            'Coração da Roma antiga — em geral no mesmo ingresso do Coliseu e do Palatino.',
        },
        googleRating: 4.7,
        lat: 41.8916414,
        lng: 12.4867296,
        address: 'Via della Salara Vecchia, 5/6, 00186 Roma',
        mapsQuery: 'Foro Romano Roma',
      },
      {
        id: 'rom-pantheon',
        name: { en: 'Pantheon', 'pt-BR': 'Panteão' },
        category: 'tourist',
        landmark: 'monument',
        description: {
          en: 'Perfect dome and oculus. Adult entry ~€5.',
          'pt-BR': 'Cúpula perfeita e óculo. Entrada ~€5.',
        },
        googleRating: 4.8,
        lat: 41.898616,
        lng: 12.4768334,
        address: 'Piazza della Rotonda, 00186 Roma',
        mapsQuery: 'Pantheon Roma',
      },
      {
        id: 'rom-piazza-venezia',
        name: { en: 'Piazza Venezia', 'pt-BR': 'Piazza Venezia' },
        category: 'photo',
        description: {
          en: 'Traffic hub at the foot of the Vittoriano — orientation point for the historic center.',
          'pt-BR':
            'Nó de trânsito aos pés do Vittoriano — ponto de orientação do centro histórico.',
        },
        googleRating: 4.5,
        lat: 41.8962446,
        lng: 12.4823704,
        address: 'Piazza Venezia, 00186 Roma',
        mapsQuery: 'Piazza Venezia Roma',
      },
      {
        id: 'rom-trevi',
        name: { en: 'Trevi Fountain', 'pt-BR': 'Fontana di Trevi' },
        category: 'tourist',
        landmark: 'monument',
        description: {
          en: 'Coin-toss classic. Viewing is free; ~€2 if you pay for a closer controlled access. Go early.',
          'pt-BR':
            'Clássico da moeda. Dá para ver sem pagar; ~€2 para chegar mais perto (acesso controlado). Chegue cedo.',
        },
        googleRating: 4.7,
        lat: 41.9009778,
        lng: 12.4832848,
        address: 'Piazza di Trevi, 00187 Roma',
        mapsQuery: 'Fontana di Trevi Roma',
      },
      {
        id: 'rom-vatican',
        name: {
          en: 'Vatican Museums',
          'pt-BR': 'Museus do Vaticano',
        },
        category: 'tourist',
        landmark: 'monument',
        description: {
          en: 'Paid museums (Sistine path). St. Peter’s Square / city exterior is free. Arrive early.',
          'pt-BR':
            'Museus pagos (caminho da Capela Sistina). A praça / exterior do Vaticano é gratuito. Chegue cedo.',
        },
        googleRating: 4.6,
        lat: 41.904961,
        lng: 12.4546617,
        address: 'Viale Vaticano, 00165 Roma / Città del Vaticano',
        mapsQuery: 'Musei Vaticani',
      },
      {
        id: 'rom-sistine',
        name: { en: 'Sistine Chapel', 'pt-BR': 'Capela Sistina' },
        category: 'tourist',
        landmark: 'monument',
        description: {
          en: 'Michelangelo’s ceiling — access is via the Vatican Museums ticket, not St. Peter’s alone.',
          'pt-BR':
            'Teto de Michelangelo — entrada pelo ingresso dos Museus do Vaticano, não só pela Basílica.',
        },
        googleRating: 4.8,
        lat: 41.9029338,
        lng: 12.4544043,
        address: 'Cappella Sistina, Città del Vaticano',
        mapsQuery: 'Cappella Sistina Vaticano',
      },
      {
        id: 'rom-st-peter',
        name: {
          en: "St. Peter's Basilica",
          'pt-BR': 'Basílica de São Pedro',
        },
        category: 'tourist',
        landmark: 'monument',
        description: {
          en: 'Entry free; dome climb is paid. Security lines — go early.',
          'pt-BR':
            'Entrar é gratuito; subir na cúpula precisa pagar. Fila de segurança — chegue cedo.',
        },
        googleRating: 4.8,
        lat: 41.9021569,
        lng: 12.4537105,
        address: 'Piazza San Pietro, 00120 Città del Vaticano',
        mapsQuery: 'Basilica di San Pietro Vaticano',
      },
      {
        id: 'rom-vittoriano',
        name: {
          en: 'Victor Emmanuel II Monument',
          'pt-BR': 'Monumento a Vítor Emanuel II',
        },
        category: 'tourist',
        landmark: 'monument',
        description: {
          en: 'Altare della Patria / Vittoriano — free exterior and terraces (check lift fees if any).',
          'pt-BR':
            'Altare della Patria / Vittoriano — gratuito. Terraços e vistas do centro.',
        },
        googleRating: 4.7,
        lat: 41.8946867,
        lng: 12.4830664,
        address: 'Piazza Venezia, 00186 Roma',
        mapsQuery: 'Altare della Patria Vittoriano Roma',
      },
      // —— Stay ——
      {
        id: 'rom-window-on-rome',
        name: { en: 'Window on Rome', 'pt-BR': 'Window on Rome' },
        category: 'lodging',
        description: {
          en: 'Hotel tip from Canal dos Caçadores. In Trastevere — a good base for going out at night.',
          'pt-BR':
            'Hotel do Canal dos Caçadores. Fica em Trastevere, um local bom pra sair a noitinha.',
        },
        googleRating: 4.6,
        lat: 41.8888833,
        lng: 12.4742889,
        address: 'Piazza Sidney Sonnino 25, 00153 Roma',
        mapsQuery: 'Window on Rome Piazza Sidney Sonnino 25 Roma',
      },
    ],
  },
  {
    slug: 'lisboa',
    name: { en: 'Lisbon', 'pt-BR': 'Lisboa' },
    country: { en: 'Portugal', 'pt-BR': 'Portugal' },
    countryKey: 'portugal',
    lat: 38.7223,
    lng: -9.1393,
    zoom: 13,
    places: [
      {
        id: 'lis-lis',
        name: {
          en: 'Humberto Delgado Airport (LIS)',
          'pt-BR': 'Aeroporto Humberto Delgado (LIS)',
        },
        category: 'airport',
        description: {
          en: 'Main Lisbon airport, metro-linked to the center.',
          'pt-BR': 'Principal aeroporto de Lisboa, ligado ao centro por metro.',
        },
        googleRating: 3.6,
        lat: 38.7756,
        lng: -9.1354,
        address: 'Alameda das Comunidades Portuguesas, 1700-111 Lisboa, Portugal',
        mapsQuery: 'Aeroporto Humberto Delgado Lisboa LIS',
      },
      {
        id: 'lis-alfama',
        name: { en: 'Alfama', 'pt-BR': 'Alfama' },
        category: 'tourist',
        description: {
          en: 'Miradouros, tile walls, and wandering without a plan.',
          'pt-BR': 'Miradouros, azulejos e caminhar sem plano.',
        },
        lat: 38.7129,
        lng: -9.1315,
        address: 'Alfama, 1100 Lisboa, Portugal',
        mapsQuery: 'Alfama Lisboa',
      },
      {
        id: 'lis-time-out',
        name: { en: 'Time Out Market', 'pt-BR': 'Time Out Market' },
        category: 'restaurants',
        description: {
          en: 'Food hall crash course in Portuguese flavors.',
          'pt-BR': 'Crash course de sabores portugueses num só lugar.',
        },
        googleRating: 4.4,
        lat: 38.7071,
        lng: -9.1458,
        address: 'Av. 24 de Julho 49, 1200-479 Lisboa, Portugal',
        mapsQuery: 'Time Out Market Lisboa',
      },
      {
        id: 'lis-belem',
        name: { en: 'Belém', 'pt-BR': 'Belém' },
        category: 'tourist',
        description: {
          en: 'Pastéis de nata, the tower, and river light.',
          'pt-BR': 'Pastéis de nata, a torre e a luz do rio.',
        },
        googleRating: 4.5,
        lat: 38.6979,
        lng: -9.2065,
        address: 'Belém, 1400 Lisboa, Portugal',
        mapsQuery: 'Torre de Belém Lisboa',
      },
    ],
  },
  {
    slug: 'porto',
    name: { en: 'Porto', 'pt-BR': 'Porto' },
    country: { en: 'Portugal', 'pt-BR': 'Portugal' },
    countryKey: 'portugal',
    lat: 41.1579,
    lng: -8.6291,
    zoom: 13,
    places: [
      {
        id: 'porto-opo',
        name: {
          en: 'Francisco Sá Carneiro Airport (OPO)',
          'pt-BR': 'Aeroporto Francisco Sá Carneiro (OPO)',
        },
        category: 'airport',
        description: {
          en: 'Porto’s airport, metro ride into the city.',
          'pt-BR': 'Aeroporto do Porto, com metro até o centro.',
        },
        googleRating: 4.4,
        lat: 41.2421,
        lng: -8.6785,
        address: 'Pedras Rubras, 4470-558 Maia, Portugal',
        mapsQuery: 'Aeroporto Francisco Sá Carneiro Porto OPO',
      },
      {
        id: 'porto-ribeira',
        name: { en: 'Ribeira', 'pt-BR': 'Ribeira' },
        category: 'tourist',
        description: {
          en: 'Riverfront postcard: colorful façades and wine caves across the Douro.',
          'pt-BR': 'Postal do rio: fachadas coloridas e caves de vinho do outro lado do Douro.',
        },
        googleRating: 4.8,
        lat: 41.1406,
        lng: -8.611,
        area: {
          kind: 'polyline',
          path: [
            [41.1435, -8.616],
            [41.142, -8.6135],
            [41.1406, -8.611],
            [41.1395, -8.609],
            [41.1385, -8.607],
          ],
        },
        address: 'Ribeira, 4050 Porto, Portugal',
        mapsQuery: 'Cais da Ribeira Porto',
      },
      {
        id: 'porto-livraria',
        name: {
          en: 'Livraria Lello',
          'pt-BR': 'Livraria Lello',
        },
        category: 'tourist',
        description: {
          en: 'Theatrical bookstore. Buy tickets ahead if you can.',
          'pt-BR': 'Livraria teatral. Compre ingresso com antecedência se puder.',
        },
        googleRating: 4.0,
        lat: 41.1469,
        lng: -8.6148,
        address: 'R. das Carmelitas 144, 4050-161 Porto, Portugal',
        mapsQuery: 'Livraria Lello Porto',
      },
      {
        id: 'porto-francesinha',
        name: {
          en: 'Francesinha stop',
          'pt-BR': 'Parada da francesinha',
        },
        category: 'restaurants',
        description: {
          en: 'The city’s heavyweight sandwich. Share it. Trust me.',
          'pt-BR': 'O sanduíche pesado da cidade. Divida. Confia.',
        },
        googleRating: 4.4,
        lat: 41.1496,
        lng: -8.6109,
        address: 'R. de Passos Manuel 226, 4000-382 Porto, Portugal',
        mapsQuery: 'Café Santiago Francesinha Porto',
      },
    ],
  },
];

/** Cities with Notion editorial places merged in (Notion wins on same `id`). */
export const travelCities: TravelCity[] = mergeNotionPlaces(localTravelCities);

export function getTravelCity(slug: string): TravelCity | undefined {
  return travelCities.find((c) => c.slug === slug);
}

/**
 * Resolve map geometry for a place.
 *
 * Priority:
 * 1. OpenStreetMap outlines in `travel-areas-osm.ts` (always win)
 * 2. Authored `place.area` in this file (fallback / metro waypoint spines)
 *
 * Policy (enforced by `travel-areas.test.ts` + `npm run travel:areas`):
 * - Do NOT invent 2–3 point street polylines — fetch OSM LineStrings instead.
 * - Do NOT ship `areaBox()` scaffolds without an OSM override.
 * - Metro / multi-stop walks may keep dense authored polylines
 *   (see ROUTE_WAYPOINT_AREA_IDS in travel-areas-policy.ts).
 *
 * Regenerate OSM registry: `npm run travel:areas`
 */
export function resolvePlaceArea(place: TravelPlace): TravelArea | undefined {
  const osm = areaForPlace(place.id);
  if (!osm) return place.area;
  // Normalize OSM multipolygon/polygon/polyline into TravelArea
  if (osm.kind === 'multipolygon') {
    return { kind: 'multipolygon', paths: osm.paths as LatLngPoint[][] };
  }
  return {
    kind: osm.kind,
    path: osm.path as LatLngPoint[],
  };
}

/**
 * Gallery for a place card / slider.
 *
 * Prefer the curated registry in `travel-photos.ts` when it has at least as
 * many images as Notion/authored photos — Notion often stores only the cover,
 * which used to clobber multi-photo sliders (e.g. Galeries Lafayette).
 * Notion still wins when its gallery is longer.
 */
export function resolvePlacePhotos(
  placeId: string,
  authored?: TravelPhoto[] | null,
): TravelPhoto[] | undefined {
  const registry = photosForPlaceId(placeId);
  const fromAuthored =
    authored && authored.length > 0 ? authored : undefined;
  const fromRegistry =
    registry && registry.length > 0 ? registry : undefined;
  if (fromRegistry && fromAuthored) {
    return fromRegistry.length >= fromAuthored.length
      ? fromRegistry
      : fromAuthored;
  }
  return fromRegistry ?? fromAuthored;
}

/** Place with OSM area + visit meta + gallery photos + subcategories merged in. */
export function withResolvedArea(place: TravelPlace): TravelPlace {
  const area = resolvePlaceArea(place);
  const visit = resolveVisit(place.id, place.visit);
  const photos = resolvePlacePhotos(place.id, place.photos);
  const subcategories = resolvePlaceSubcategories(
    place.id,
    place.subcategories,
  );
  return {
    ...place,
    ...(area ? { area } : {}),
    ...(visit ? { visit } : {}),
    ...(photos ? { photos } : {}),
    ...(subcategories.length > 0 ? { subcategories } : {}),
  };
}

/**
 * Personal favorites in a city — prefer these when building itineraries
 * (LLM prompts, curated routes, etc.).
 */
export function favoritePlaces(city: TravelCity): TravelPlace[] {
  return city.places.filter((p) => p.favorite);
}

/** Place ids marked favorite in a city (stable order as in `city.places`). */
export function favoritePlaceIds(city: TravelCity): string[] {
  return favoritePlaces(city).map((p) => p.id);
}

/** Display line: "São Paulo, SP · Brasil" */
export function formatCityMeta(city: TravelCity, locale: Locale = 'en'): string {
  const title = city.region
    ? `${city.name[locale]}, ${city.region}`
    : city.name[locale];
  return `${title} · ${city.country[locale]}`;
}

/** Search input placeholder with place total for the city page. */
export function searchPlacesPlaceholder(count: number): LString {
  return {
    en: `Search among ${count} places…`,
    'pt-BR': `Buscar entre ${count} lugares…`,
  };
}

/** Clamp to 0–5 with one decimal (Google Maps style). Halves still work for personal notes. */
export function clampRating(rating: number): number {
  return Math.min(5, Math.max(0, Math.round(rating * 10) / 10));
}

export function pickLocale(locale: Locale, value: LString): string {
  return value[locale] ?? value.en;
}

/**
 * Resolve a Google Maps deep link for a place.
 * Priority: mapsUrl → placeId → mapsQuery / address → name+city → lat,lng pin.
 */
export function googleMapsUrl(place: TravelPlace, city?: TravelCity): string {
  if (place.mapsUrl) return place.mapsUrl;

  if (place.placeId) {
    const q = place.mapsQuery || place.address || place.name.en;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}&query_place_id=${encodeURIComponent(place.placeId)}`;
  }

  const cityBit = city
    ? [city.name.en, city.region, city.country.en].filter(Boolean).join(', ')
    : '';

  const query =
    place.mapsQuery ||
    place.address ||
    (cityBit ? `${place.name.en}, ${cityBit}` : place.name.en);

  if (query) {
    // Search query keeps the place entity when Google knows it;
    // coords as secondary anchor via the @ form when useful.
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
}
