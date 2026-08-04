/**
 * Leaflet maps for /travel index (world + city pins) and city pages (places).
 * Place pins: category color + optional glyph (airport plane, camera, …).
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Side-effect: extends L with maplibreGL / MaplibreGL
import '@maplibre/maplibre-gl-leaflet';
import {
  categoryColor,
  categoryIconHtml,
  materialIconHtml,
} from '../data/travel-categories';
import { ROUTE_WAYPOINT_AREA_IDS } from '../data/travel-areas-policy';

/**
 * Transit line id → place id of the “full line” map entity
 * (so itinerary can show only the used slice on hover, not the whole line).
 */
const TRANSIT_LINE_PLACE_ID: Record<string, string> = {
  m6: 'par-metro-6',
  m2: 'par-metro-2',
};

// Bridge UMD path + some bundlers expect a global
if (typeof globalThis !== 'undefined') {
  (globalThis as unknown as { maplibregl: typeof maplibregl }).maplibregl =
    maplibregl;
}

/** Area shape from TravelPlace.area (Leaflet [lat, lng] paths) */
export type MapArea =
  | { kind: 'polygon'; path: [number, number][] }
  | { kind: 'polyline'; path: [number, number][] }
  | { kind: 'multipolygon'; paths: [number, number][][] };

export type MapRouteStop = {
  name: string;
  namePt?: string;
  lat: number;
  lng: number;
};

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  labelPt?: string;
  href?: string;
  mapsUrl?: string;
  category?: string;
  featured?: boolean;
  /** @deprecated ignored — tourist pins use a 6-point star, not building icons */
  landmark?: string | null;
  /** Optional region: park / neighborhood / avenue highlighted on hover */
  area?: MapArea | null;
  /** Stations along a route — shown as dots when this place is hovered */
  routeStops?: MapRouteStop[] | null;
};

type MapMode = 'cities' | 'places';

type TravelMapOptions = {
  container: HTMLElement;
  pins: MapPin[];
  mode: MapMode;
  center?: [number, number];
  zoom?: number;
  ariaLabel?: string;
};

/** Hover preview over category chips (map pin opacity) */
export type FilterPreviewState = {
  /** Full opacity (current selection, or hover target when none selected) */
  solid: Set<string>;
  /** Lower opacity — category being previewed for multi-add */
  dim: Set<string>;
  /**
   * When true (no hard filter yet), non-solid pins stay visible but faded.
   * When false (filter active), non-solid/non-dim pins stay hidden.
   */
  fadeOthers: boolean;
} | null;

export type RoutePreviewStop = {
  id: string;
  lat: number;
  lng: number;
  /** User GPS origin — distinct badge style */
  kind?: 'place' | 'user';
};

export type RoutePreviewState = {
  /** Walking geometry in Leaflet [lat, lng] order; null clears the line */
  latlngs: [number, number][] | null;
  /**
   * Ordered stops for numbered badges (any lat/lng).
   * Prefer this over stopIds when the route includes non-place origins.
   */
  stops?: RoutePreviewStop[];
  /** @deprecated use `stops` — place ids resolved via getPin */
  stopIds?: string[];
  /** Fit camera to the route (default true when latlngs present) */
  fit?: boolean;
};

/** Multi-modal day itinerary overlay (walk dashed / transit solid) */
export type ItineraryRouteSegment = {
  mode: 'walk' | 'transit';
  latlngs: [number, number][];
  color?: string;
  lineId?: string;
  label?: string;
  /** Logical place→place leg (timeline transfer hover) */
  fromId?: string;
  toId?: string;
  /** Multi-hop index (RER E = 0, M13 = 1) for individual highlight */
  hopIndex?: number;
};

/** Multi-line transfer (e.g. RER E → M13) — dual-color station dot */
export type ItineraryTransferMarker = {
  lat: number;
  lng: number;
  fromColor: string;
  toColor: string;
  fromLabel?: string;
  toLabel?: string;
  fromId?: string;
  toId?: string;
  hopIndex?: number;
};

export type ItineraryRouteState = {
  /** Ordered primary stop place ids (1-based badges on existing pins) */
  stopIds: string[];
  segments: ItineraryRouteSegment[];
  /** Station-change dots for multi-line rides */
  transfers?: ItineraryTransferMarker[];
  /** Fit camera to all geometry (default true) */
  fit?: boolean;
};

export type UserLocationState = {
  lat: number;
  lng: number;
  accuracyM?: number;
};

export type MapChromePadding = {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
};

export type TravelMapHandle = {
  destroy: () => void;
  highlight: (id: string | null) => void;
  flyTo: (id: string) => void;
  /**
   * Filter which pins are shown. `fit` (default true) refits the camera to
   * visible pins — pass false when only UI mode changes (grid/list/itinerary).
   */
  setVisibleIds: (
    ids: Set<string> | null,
    opts?: { fit?: boolean },
  ) => void;
  /** Temporary opacity preview (chip hover) — does not change base filter */
  setFilterPreview: (preview: FilterPreviewState) => void;
  /** Places mode: open side panel for place id (or clear) */
  select: (id: string | null) => void;
  /** Draw / clear multi-stop route preview polyline + stop numbers */
  setRoutePreview: (state: RoutePreviewState | null) => void;
  /**
   * Day itinerary: multi-modal segments + focus fade + numbered badges
   * on existing category pins (does not replace pin icons).
   */
  setItineraryRoute: (state: ItineraryRouteState | null) => void;
  /**
   * Emphasize one place→place leg on the day route (timeline transfer hover).
   * Pass null to clear. No-op when no itinerary is drawn.
   */
  highlightItineraryLeg: (
    fromId: string | null,
    toId?: string | null,
    source?: 'map' | 'timeline',
    hopIndex?: number | null,
  ) => void;
  /**
   * Emphasize all day-route segments that touch a place (timeline stop hover).
   * Pass null to clear.
   */
  highlightItineraryPlace: (placeId: string | null) => void;
  /** Resolve pin by id (for route UI without re-parsing dataset) */
  getPin: (id: string) => MapPin | undefined;
  /**
   * Overlay obstruction padding (form-sheet bottom / right place panel).
   * Merged with base UI chrome (desktop left sidebar). Pass null to clear overlay only.
   */
  setChromePadding: (padding: MapChromePadding | null) => void;
  /**
   * Re-measure sidebar overlay + optionally refit the camera so content is
   * centered in the free map region (ignores the sidebar margin).
   */
  syncUiChrome: (opts?: { refit?: boolean; animate?: boolean }) => void;
  /** Pan/zoom so pin is centered in the unobstructed map region */
  ensureVisible: (id: string, animate?: boolean) => void;
  /** Blue pulse marker for browser geolocation (independent of route stops) */
  setUserLocation: (loc: UserLocationState | null) => void;
  getUserLocation: () => UserLocationState | null;
  /** Pan/zoom to the current user marker if present */
  flyToUserLocation: (maxZoom?: number) => void;
  /** Switch OpenFreeMap basemap (dark ↔ Google-like bright) + water/park tints */
  setBasemapTheme: (theme: TravelMapBasemapTheme) => void;
};

/** Map basemap theme — mirrors travel UI light/dark toggle. */
export type TravelMapBasemapTheme = 'dark' | 'light';

/**
 * Free vector basemaps (OpenFreeMap) — water/park layers are styleable.
 * Dark = portfolio night map; light = OSM Bright (Google Maps–like).
 * @see https://openfreemap.org/quick_start/
 */
const VECTOR_STYLES: Record<TravelMapBasemapTheme, string> = {
  dark: 'https://tiles.openfreemap.org/styles/dark',
  light: 'https://tiles.openfreemap.org/styles/bright',
};
const VECTOR_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://openmaptiles.org">OpenMapTiles</a>';

type BasemapTint = {
  waterFill: string;
  waterwayLine: string;
  waterName?: string;
  waterNameHalo?: string;
  parkFill: string;
  parkOpacity: number;
  woodFill: string;
  woodOpacity: number;
  grassFill?: string;
  /**
   * Light basemap only: mute Bright’s loud highway yellows / pink landuse
   * into beige–gray so water & parks stay the only soft accents.
   */
  roadFill?: string;
  roadCasing?: string;
  motorwayFill?: string;
  landuseMuted?: string;
  landuseCommercial?: string;
  landuseHospital?: string;
  landuseSchool?: string;
  landuseIndustrial?: string;
};

/**
 * Dark: soft blue water + low-opacity green parks over near-black land.
 * Light: muted Google-adjacent palette (beige roads, soft blue/green).
 */
const BASEMAP_TINTS: Record<TravelMapBasemapTheme, BasemapTint> = {
  dark: {
    waterFill: '#071824',
    waterwayLine: '#0a2233',
    waterName: 'rgba(110, 140, 165, 0.55)',
    waterNameHalo: 'rgba(7, 24, 36, 0.8)',
    parkFill: '#1f4a32',
    parkOpacity: 0.16,
    woodFill: '#1a3d2a',
    woodOpacity: 0.14,
  },
  light: {
    // Softer water / park (less saturated than default Bright + prior tints)
    waterFill: '#c5d9e8',
    waterwayLine: '#a8c4d8',
    waterName: '#6a8499',
    waterNameHalo: 'rgba(255, 255, 255, 0.9)',
    parkFill: '#d5e4d0',
    parkOpacity: 0.75,
    woodFill: '#c5d6bc',
    woodOpacity: 0.45,
    grassFill: '#dce8d6',
    // Roads: beige / warm gray instead of #fea yellow & #fc8 orange
    roadFill: '#f0ebe3',
    roadCasing: '#d4cfc6',
    motorwayFill: '#e8e2d8',
    // Landuse: drop pink/magenta commercial & school washes
    landuseMuted: 'hsla(40, 8%, 92%, 0.35)',
    landuseCommercial: 'hsla(35, 10%, 90%, 0.28)',
    landuseHospital: 'hsla(0, 8%, 94%, 0.35)',
    landuseSchool: 'hsla(40, 8%, 93%, 0.3)',
    landuseIndustrial: 'hsla(40, 12%, 92%, 0.3)',
  },
};

function readDocumentBasemapTheme(): TravelMapBasemapTheme {
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 'light'
    : 'dark';
}

/** Safe paint set — layer IDs differ between dark and bright styles. */
function setPaint(
  glMap: maplibregl.Map,
  layerId: string,
  prop: string,
  value: unknown,
) {
  if (!glMap.getLayer(layerId)) return;
  try {
    glMap.setPaintProperty(layerId, prop, value as never);
  } catch {
    /* prop unsupported on this layer type */
  }
}

/** Safe layout set (e.g. visibility). */
function setLayout(
  glMap: maplibregl.Map,
  layerId: string,
  prop: string,
  value: unknown,
) {
  if (!glMap.getLayer(layerId)) return;
  try {
    glMap.setLayoutProperty(layerId, prop, value as never);
  } catch {
    /* prop unsupported on this layer type */
  }
}

/**
 * Highway route shields / ref badges (A6, N1, I-95, …) — OpenFreeMap Bright + Dark.
 * Roads stay; only the number badges/labels go away.
 */
const HIDDEN_HIGHWAY_INDICATOR_LAYERS = [
  // Bright (OSM Bright / OpenMapTiles)
  'highway-shield-non-us',
  'highway-shield-us-interstate',
  'road_shield_us',
  // Dark style motorway ref labels (text “A6”, “E15”, …)
  'highway_name_motorway',
] as const;

/**
 * POI symbol layers that may draw bus stops (class/subclass “bus”).
 * Transit line geometry is kept; only bus stop markers/labels are filtered out.
 */
const POI_LAYERS_EXCLUDE_BUS = [
  'poi_transit',
  'poi_r1',
  'poi_r7',
  'poi_r20',
] as const;

/** Hide highway shields and bus-stop POIs on the vector basemap. */
function hideBasemapClutter(glMap: maplibregl.Map) {
  for (const id of HIDDEN_HIGHWAY_INDICATOR_LAYERS) {
    setLayout(glMap, id, 'visibility', 'none');
  }

  // poi_transit stock filter: airport | bus | rail — drop bus only
  if (glMap.getLayer('poi_transit')) {
    try {
      glMap.setFilter('poi_transit', [
        'match',
        ['get', 'class'],
        ['airport', 'rail'],
        true,
        false,
      ]);
    } catch {
      setLayout(glMap, 'poi_transit', 'visibility', 'none');
    }
  }

  // General POI ranks — AND out class=bus without dropping other POIs
  for (const id of POI_LAYERS_EXCLUDE_BUS) {
    if (id === 'poi_transit') continue;
    if (!glMap.getLayer(id)) continue;
    try {
      const existing = glMap.getFilter(id);
      const noBus: maplibregl.FilterSpecification = [
        '!=',
        ['get', 'class'],
        'bus',
      ];
      glMap.setFilter(
        id,
        existing
          ? (['all', existing, noBus] as maplibregl.FilterSpecification)
          : noBus,
      );
    } catch {
      /* keep layer if filter shape is unsupported */
    }
  }
}

/** Bright-style highway / tunnel / bridge layer IDs that use yellow fills. */
const BRIGHT_ROAD_FILL_LAYERS = [
  'highway-motorway-link',
  'highway-link',
  'highway-secondary-tertiary',
  'highway-primary',
  'highway-trunk',
  'highway-motorway',
  'tunnel-motorway-link',
  'tunnel-link',
  'tunnel-secondary-tertiary',
  'tunnel-trunk-primary',
  'tunnel-motorway',
  'bridge-motorway-link',
  'bridge-link',
  'bridge-secondary-tertiary',
  'bridge-trunk-primary',
  'bridge-motorway',
] as const;

/** Matching casings (orange-brown in stock Bright). */
const BRIGHT_ROAD_CASING_LAYERS = [
  'highway-motorway-link-casing',
  'highway-link-casing',
  'highway-secondary-tertiary-casing',
  'highway-primary-casing',
  'highway-trunk-casing',
  'highway-motorway-casing',
  'tunnel-motorway-link-casing',
  'tunnel-link-casing',
  'tunnel-secondary-tertiary-casing',
  'tunnel-trunk-primary-casing',
  'tunnel-motorway-casing',
  'bridge-motorway-link-casing',
  'bridge-link-casing',
  'bridge-secondary-tertiary-casing',
  'bridge-trunk-primary-casing',
  'bridge-motorway-casing',
] as const;

/** Apply water + park tints (and light-mode road/landuse mute). Idempotent. */
function paintBasemapTints(
  glMap: maplibregl.Map,
  theme: TravelMapBasemapTheme,
) {
  // Always re-hide clutter after setStyle / style.load
  hideBasemapClutter(glMap);

  const t = BASEMAP_TINTS[theme];

  // —— Water (dark + bright share `water`; bright adds intermittent) ——
  setPaint(glMap, 'water', 'fill-color', t.waterFill);
  setPaint(glMap, 'water', 'fill-antialias', true);
  setPaint(glMap, 'water-intermittent', 'fill-color', t.waterFill);

  // Dark style uses single `waterway`; bright uses several waterway-* ids
  setPaint(glMap, 'waterway', 'line-color', t.waterwayLine);
  for (const id of [
    'waterway-other',
    'waterway-other-intermittent',
    'waterway-stream-canal',
    'waterway-stream-canal-intermittent',
    'waterway-river',
    'waterway-river-intermittent',
    'waterway_tunnel',
  ]) {
    setPaint(glMap, id, 'line-color', t.waterwayLine);
  }

  if (t.waterName) {
    setPaint(glMap, 'water_name', 'text-color', t.waterName);
    setPaint(glMap, 'waterway_line_label', 'text-color', t.waterName);
    setPaint(glMap, 'water_name_point_label', 'text-color', t.waterName);
    setPaint(glMap, 'water_name_line_label', 'text-color', t.waterName);
  }
  if (t.waterNameHalo) {
    setPaint(glMap, 'water_name', 'text-halo-color', t.waterNameHalo);
    setPaint(glMap, 'waterway_line_label', 'text-halo-color', t.waterNameHalo);
    setPaint(glMap, 'water_name_point_label', 'text-halo-color', t.waterNameHalo);
    setPaint(glMap, 'water_name_line_label', 'text-halo-color', t.waterNameHalo);
  }

  // —— Parks / woods ——
  // Dark: landuse_park + landcover_wood
  setPaint(glMap, 'landuse_park', 'fill-color', t.parkFill);
  setPaint(glMap, 'landuse_park', 'fill-opacity', t.parkOpacity);
  if (glMap.getLayer('landcover_wood')) {
    try {
      glMap.setPaintProperty(
        'landcover_wood',
        'fill-pattern',
        null as unknown as string,
      );
    } catch {
      /* pattern may be required */
    }
  }
  setPaint(glMap, 'landcover_wood', 'fill-color', t.woodFill);
  setPaint(glMap, 'landcover_wood', 'fill-opacity', t.woodOpacity);

  // Bright: park, landcover-wood, landcover-grass, landcover-grass-park
  setPaint(glMap, 'park', 'fill-color', t.parkFill);
  setPaint(glMap, 'park', 'fill-opacity', t.parkOpacity);
  setPaint(glMap, 'landcover-wood', 'fill-color', t.woodFill);
  setPaint(glMap, 'landcover-wood', 'fill-opacity', t.woodOpacity);
  if (t.grassFill) {
    setPaint(glMap, 'landcover-grass', 'fill-color', t.grassFill);
    setPaint(glMap, 'landcover-grass-park', 'fill-color', t.grassFill);
  }

  // —— Light only: mute Bright yellow roads + pink/magenta landuse ——
  if (theme !== 'light') return;

  const roadFill = t.roadFill ?? '#f0ebe3';
  const roadCasing = t.roadCasing ?? '#d4cfc6';
  const motorwayFill = t.motorwayFill ?? roadFill;

  for (const id of BRIGHT_ROAD_FILL_LAYERS) {
    const isMotorway = id.includes('motorway');
    setPaint(glMap, id, 'line-color', isMotorway ? motorwayFill : roadFill);
  }
  for (const id of BRIGHT_ROAD_CASING_LAYERS) {
    setPaint(glMap, id, 'line-color', roadCasing);
  }
  // Path / pier already neutral enough; keep minor roads white-ish via style

  if (t.landuseCommercial) {
    setPaint(glMap, 'landuse-commercial', 'fill-color', t.landuseCommercial);
  }
  if (t.landuseHospital) {
    setPaint(glMap, 'landuse-hospital', 'fill-color', t.landuseHospital);
  }
  if (t.landuseSchool) {
    setPaint(glMap, 'landuse-school', 'fill-color', t.landuseSchool);
  }
  if (t.landuseIndustrial) {
    setPaint(glMap, 'landuse-industrial', 'fill-color', t.landuseIndustrial);
  }
  if (t.landuseMuted) {
    setPaint(glMap, 'landuse-residential', 'fill-color', t.landuseMuted);
    setPaint(glMap, 'landuse-suburb', 'fill-color', t.landuseMuted);
    setPaint(glMap, 'landuse-railway', 'fill-color', t.landuseMuted);
  }

  // Place / POI / road names — softer than stock Bright black (#000)
  const placeLabel = '#7a7e88';
  const placeHalo = 'rgba(255, 255, 255, 0.92)';
  for (const id of [
    'label_city',
    'label_city_capital',
    'label_town',
    'label_village',
    'label_state',
    'label_other',
    'label_country_1',
    'label_country_2',
    'label_country_3',
    'poi_r1',
    'poi_r7',
    'poi_r20',
    'poi_transit',
    'airport',
    'highway-name-path',
    'highway-name-minor',
    'highway-name-major',
  ]) {
    setPaint(glMap, id, 'text-color', placeLabel);
    setPaint(glMap, id, 'text-halo-color', placeHalo);
    setPaint(glMap, id, 'text-halo-width', 1.25);
    setPaint(glMap, id, 'text-opacity', 0.82);
  }
}

/**
 * Register style listeners once; `getTheme` is re-read on each style.load
 * so theme switches only need setStyle + one paint pass.
 */
function bindBasemapTints(
  glMap: maplibregl.Map,
  getTheme: () => TravelMapBasemapTheme,
) {
  const paint = () => paintBasemapTints(glMap, getTheme());
  if (glMap.isStyleLoaded()) paint();
  glMap.once('load', paint);
  // style.load fires after setStyle — avoid `styledata` (setPaintProperty loops)
  glMap.on('style.load', paint);
  return () => {
    glMap.off('load', paint);
    glMap.off('style.load', paint);
  };
}

/**
 * Place-specific Material Symbols Rounded (best-effort match per landmark).
 * @see https://fonts.google.com/icons?icon.style=Rounded
 */
const PLACE_MATERIAL_ICONS: Record<string, string> = {
  eiffel: 'apartment',
  arc: 'fort',
  'notre-dame': 'church',
  'sacre-coeur': 'church',
  louvre: 'palette',
  opera: 'music_note',
  pompidou: 'museum',
  montparnasse: 'location_city',
  monument: 'account_balance',
};

function placeIconHtml(landmark: string | null | undefined): string {
  const name =
    (landmark && PLACE_MATERIAL_ICONS[landmark]) ||
    PLACE_MATERIAL_ICONS.monument;
  return materialIconHtml(name);
}

/** 8-point star, short rounded tips (shared by border + fill layers). */
const STAR_8_PATH =
  'M10.91 3.86 Q12 2 13.09 3.86 L13.82 5.1 Q14.43 6.13 15.59 5.83 L16.98 5.47 ' +
  'Q19.07 4.93 18.53 7.02 L18.17 8.41 Q17.87 9.57 18.9 10.18 L20.14 10.91 ' +
  'Q22 12 20.14 13.09 L18.9 13.82 Q17.87 14.43 18.17 15.59 L18.53 16.98 ' +
  'Q19.07 19.07 16.98 18.53 L15.59 18.17 Q14.43 17.87 13.82 18.9 L13.09 20.14 ' +
  'Q12 22 10.91 20.14 L10.18 18.9 Q9.57 17.87 8.41 18.17 L7.02 18.53 ' +
  'Q4.93 19.07 5.47 16.98 L5.83 15.59 Q6.13 14.43 5.1 13.82 L3.86 13.09 ' +
  'Q2 12 3.86 10.91 L5.1 10.18 Q6.13 9.57 5.83 8.41 L5.47 7.02 ' +
  'Q4.93 4.93 7.02 5.47 L8.41 5.83 Q9.57 6.13 10.18 5.1 Z';

/**
 * Single star path: gold fill + white stroke.
 * Rest stroke/opacity set in CSS (0.5px @ 10%); hover → 2px solid white.
 * paint-order: stroke under fill → only outer half of stroke is visible.
 */
function starSvgHtml(): string {
  return (
    `<svg class="travel-pin__star-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">` +
    `<path class="travel-pin__star-shape" fill="currentColor" ` +
    `stroke-linejoin="round" paint-order="stroke fill" ` +
    `vector-effect="non-scaling-stroke" d="${STAR_8_PATH}"/>` +
    `</svg>`
  );
}

type PinVisual = {
  category?: string;
  featured?: boolean;
  active?: boolean;
  /** Place-specific icon key for tourist stars (eiffel, arc, …) */
  landmark?: string | null;
};

/**
 * Default = colored circular dot; solid category glyph on hover.
 * Tourist = 8-point star + place-specific solid glyph on hover (same UX as dots).
 */
function pinHtml(visual: PinVisual = {}): string {
  const { category, featured = false, active = false, landmark } = visual;
  const color = categoryColor(category);
  const isStar = category === 'tourist';

  if (isStar) {
    const placeKey =
      landmark && landmark in PLACE_MATERIAL_ICONS ? landmark : 'monument';
    const glyph = placeIconHtml(placeKey);
    const classes = [
      'travel-pin',
      'travel-pin--star',
      'travel-pin--has-glyph',
      `travel-pin--lm-${placeKey}`,
      featured ? 'is-featured' : '',
      active ? 'is-active' : '',
      category ? `travel-pin--cat-${category}` : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      `<span class="${classes}" data-magnetic-visual style="--pin-color:${color}">` +
      `<span class="travel-pin__core travel-pin__core--star">` +
      starSvgHtml() +
      `<span class="travel-pin__glyph" aria-hidden="true">${glyph}</span>` +
      `</span>` +
      `<span class="travel-pin__pulse" aria-hidden="true"></span>` +
      `</span>`
    );
  }

  const glyph = categoryIconHtml(category);

  const classes = [
    'travel-pin',
    glyph ? 'travel-pin--has-glyph' : 'travel-pin--dot-only',
    featured ? 'is-featured' : '',
    active ? 'is-active' : '',
    category ? `travel-pin--cat-${category}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    `<span class="${classes}" data-magnetic-visual style="--pin-color:${color}">` +
    `<span class="travel-pin__core">` +
    (glyph
      ? `<span class="travel-pin__glyph" aria-hidden="true">${glyph}</span>`
      : '') +
    `</span>` +
    `<span class="travel-pin__pulse" aria-hidden="true"></span>` +
    `</span>`
  );
}

function makeIcon(visual: PinVisual = {}): L.DivIcon {
  // Featured needs a larger hit-box so rest glow/pulse isn’t clipped by Leaflet.
  const size = visual.featured ? 56 : 44;
  return L.divIcon({
    className: 'travel-pin-icon',
    html: pinHtml(visual),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/**
 * Zoom density classes on the map container:
 * - far  (< 11): 6px rest
 * - mid  (11–13): 10px rest
 * - near (≥ 13): 12px rest (former default)
 */
function applyZoomPinMode(map: L.Map, container: HTMLElement) {
  const z = map.getZoom();
  container.classList.toggle('travel-map--zoom-far', z < 11);
  container.classList.toggle('travel-map--zoom-mid', z >= 11 && z < 13);
  container.classList.toggle('travel-map--zoom-near', z >= 13);
}

function visualFor(pin: MapPin | undefined, active = false): PinVisual {
  return {
    category: pin?.category,
    featured: pin?.featured,
    landmark: pin?.landmark,
    active,
  };
}

/**
 * Per-pin motion: magnetic follow (hovered) + overlap spread.
 *
 * Leaflet owns shell `transform` for map position — we never touch it.
 * Spread uses marginLeft/Top so the hit target moves with the icon.
 * Magnetic is layered on the inner visual as translate3d.
 *
 * Spread rules:
 * - Only when a pin is hovered OR selected (focus)
 * - Only for pins whose visible dots actually overlap the focus
 * - Focus pin never leaves its real map position
 */
type PinMotionEntry = {
  id: string;
  lat: number;
  lng: number;
  shell: HTMLElement;
  visual: HTMLElement;
  marker: L.Marker;
  /** Base Leaflet tooltip offset (before spread) */
  tipBase: L.PointExpression;
  /**
   * Leaflet iconAnchor margins (e.g. -22px for a 44px icon).
   * Spread is ADDED to these — never replace or clear them.
   */
  baseML: number;
  baseMT: number;
  /** Magnetic spring (hovered pin only) */
  magTx: number;
  magTy: number;
  magCx: number;
  magCy: number;
  magVx: number;
  magVy: number;
  /** Cluster-spread spring */
  sprTx: number;
  sprTy: number;
  sprCx: number;
  sprCy: number;
  sprVx: number;
  sprVy: number;
  hovering: boolean;
};

type PinMotionController = {
  register: (entry: {
    id: string;
    lat: number;
    lng: number;
    shell: HTMLElement;
    visual: HTMLElement;
    marker: L.Marker;
    tipBase?: L.PointExpression;
  }) => void;
  /** Keep spread while a place panel is open */
  setSelected: (id: string | null) => void;
  destroy: () => void;
};

function createPinMotionController(map: L.Map): PinMotionController {
  const enabled =
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    window.matchMedia('(pointer: fine)').matches;

  const pins = new Map<string, PinMotionEntry>();
  let hoverId: string | null = null;
  let selectedId: string | null = null;
  let raf = 0;
  let last = performance.now();
  let dragLocked = false;

  const STIFF = 300;
  const DAMP = 30;
  const MAG_RANGE = 14;
  /** How far to separate overlapping cores (from focus center) */
  const MIN_SEP = 18;
  /** Cap so neighbors stay close to their true coordinate */
  const MAX_PUSH = 12;

  /** Active focus: hover wins over selection */
  const focusId = () => hoverId ?? selectedId;

  const spring = (cur: number, target: number, vel: number, dt: number) => {
    const a = -STIFF * (cur - target) - DAMP * vel;
    const v = vel + a * dt;
    return { value: cur + v * dt, velocity: v };
  };

  const tipBaseXY = (tip: L.PointExpression): { x: number; y: number } => {
    if (Array.isArray(tip)) return { x: tip[0], y: tip[1] };
    const pt = tip as L.Point;
    return { x: pt.x, y: pt.y };
  };

  /**
   * Rest-size core diameter (px). Use rest, not hover-expanded size, so a
   * large hover ring doesn't count nearby-but-separate dots as overlapping.
   */
  const restCoreDiameter = (): number => {
    const root = map.getContainer();
    // Matches travel-map.css zoom pin sizes (approx. rest core)
    if (root.classList.contains('travel-map--zoom-near')) return 14; // ~12px core
    if (root.classList.contains('travel-map--zoom-mid')) return 12; // ~10px
    return 8; // far ~6px
  };

  const applyEntry = (p: PinMotionEntry) => {
    // Focus pin is always pinned to its real position (no spread).
    const isFocus = p.id === focusId();
    const sx = isFocus ? 0 : p.sprCx;
    const sy = isFocus ? 0 : p.sprCy;

    // Leaflet uses marginLeft/Top for iconAnchor (e.g. -22px). Spread must be
    // ADDED to that base — never cleared (''), or every pin jumps on first hover.
    p.shell.style.marginLeft = `${(p.baseML + sx).toFixed(2)}px`;
    p.shell.style.marginTop = `${(p.baseMT + sy).toFixed(2)}px`;
    p.visual.style.transform =
      p.magCx || p.magCy
        ? `translate3d(${p.magCx.toFixed(2)}px, ${p.magCy.toFixed(2)}px, 0)`
        : '';

    // Tooltip is lat/lng-anchored — offset it by the same spread so it tracks the pin
    const tip = p.marker.getTooltip();
    if (tip) {
      const base = tipBaseXY(p.tipBase);
      tip.options.offset = [base.x + sx, base.y + sy];
      if (tip.isOpen()) {
        const anyTip = tip as L.Tooltip & { _updatePosition?: () => void };
        anyTip._updatePosition?.();
      }
    }
  };

  const startLoop = () => {
    if (raf || !enabled) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  const tick = (now: number) => {
    const dt = Math.min(0.032, (now - last) / 1000 || 1 / 60);
    last = now;
    let any = false;
    const focus = focusId();

    for (const p of pins.values()) {
      // Focus never carries spread (even residual spring)
      if (p.id === focus) {
        p.sprTx = p.sprTy = 0;
        p.sprCx = p.sprCy = p.sprVx = p.sprVy = 0;
      }

      const mx = spring(p.magCx, p.magTx, p.magVx, dt);
      const my = spring(p.magCy, p.magTy, p.magVy, dt);
      p.magCx = mx.value;
      p.magVx = mx.velocity;
      p.magCy = my.value;
      p.magVy = my.velocity;

      const sx = spring(p.sprCx, p.sprTx, p.sprVx, dt);
      const sy = spring(p.sprCy, p.sprTy, p.sprVy, dt);
      p.sprCx = sx.value;
      p.sprVx = sx.velocity;
      p.sprCy = sy.value;
      p.sprVy = sy.velocity;

      applyEntry(p);

      const moving =
        p.hovering ||
        Math.abs(p.magCx) > 0.05 ||
        Math.abs(p.magCy) > 0.05 ||
        Math.abs(p.magVx) > 0.05 ||
        Math.abs(p.magVy) > 0.05 ||
        Math.abs(p.sprCx) > 0.05 ||
        Math.abs(p.sprCy) > 0.05 ||
        Math.abs(p.sprVx) > 0.05 ||
        Math.abs(p.sprVy) > 0.05 ||
        p.magTx !== 0 ||
        p.magTy !== 0 ||
        p.sprTx !== 0 ||
        p.sprTy !== 0;

      if (moving) any = true;
      else {
        p.magCx = p.magCy = p.magVx = p.magVy = 0;
        p.sprCx = p.sprCy = p.sprVx = p.sprVy = 0;
        applyEntry(p);
      }
    }

    if (any) raf = requestAnimationFrame(tick);
    else raf = 0;
  };

  const clearSpreadTargets = () => {
    for (const p of pins.values()) {
      p.sprTx = 0;
      p.sprTy = 0;
      p.shell.classList.remove('is-spread');
    }
  };

  /**
   * Push only pins whose rest cores visually overlap the focus.
   * Focus itself is never displaced.
   */
  const computeSpread = (id: string) => {
    clearSpreadTargets();
    const focus = pins.get(id);
    if (!focus) return;

    const origin = map.latLngToContainerPoint([focus.lat, focus.lng]);
    /** Centers closer than one rest diameter ⇒ cores draw on top of each other */
    const overlapMax = restCoreDiameter();
    type Near = { p: PinMotionEntry; x: number; y: number; dist: number };
    const near: Near[] = [];

    for (const p of pins.values()) {
      if (p.id === id) continue;
      if (!p.shell.isConnected) continue;
      if (p.shell.style.visibility === 'hidden') continue;
      const pt = map.latLngToContainerPoint([p.lat, p.lng]);
      const dist = Math.hypot(pt.x - origin.x, pt.y - origin.y);
      if (dist < overlapMax) {
        near.push({ p, x: pt.x, y: pt.y, dist });
      }
    }

    if (near.length === 0) return;

    near.sort((a, b) => a.p.id.localeCompare(b.p.id));

    near.forEach((n, i) => {
      let nx: number;
      let ny: number;
      if (n.dist < 0.5) {
        const angle = (Math.PI * 2 * i) / near.length - Math.PI / 2;
        nx = Math.cos(angle);
        ny = Math.sin(angle);
      } else {
        nx = (n.x - origin.x) / n.dist;
        ny = (n.y - origin.y) / n.dist;
      }
      // Separate just past non-overlap, capped
      const need = Math.max(0, MIN_SEP - n.dist);
      const amt = Math.min(MAX_PUSH, need);
      if (amt < 0.5) return;
      n.p.sprTx = nx * amt;
      n.p.sprTy = ny * amt;
      n.p.shell.classList.add('is-spread');
    });
  };

  const refreshSpread = () => {
    const id = focusId();
    if (!id) {
      clearSpreadTargets();
    } else {
      computeSpread(id);
    }
    startLoop();
  };

  const aimMagnetic = (p: PinMotionEntry, clientX: number, clientY: number) => {
    const rect = p.shell.getBoundingClientRect();
    const halfW = Math.max(rect.width / 2, 1);
    const halfH = Math.max(rect.height / 2, 1);
    const ox = clientX - rect.left - halfW;
    const oy = clientY - rect.top - halfH;
    p.magTx = Math.max(-1, Math.min(1, ox / halfW)) * MAG_RANGE;
    p.magTy = Math.max(-1, Math.min(1, oy / halfH)) * MAG_RANGE;
  };

  const onWinMove = (e: PointerEvent) => {
    if (!hoverId || e.pointerType === 'touch') return;
    const p = pins.get(hoverId);
    if (!p?.hovering) return;
    aimMagnetic(p, e.clientX, e.clientY);
    startLoop();
  };

  const setHover = (id: string | null, clientX?: number, clientY?: number) => {
    if (hoverId && hoverId !== id) {
      const prev = pins.get(hoverId);
      if (prev) {
        prev.hovering = false;
        prev.magTx = 0;
        prev.magTy = 0;
        prev.shell.classList.remove('is-magnetic');
      }
    }

    hoverId = id;

    if (!id) {
      if (dragLocked) {
        map.dragging.enable();
        dragLocked = false;
      }
      window.removeEventListener('pointermove', onWinMove);
      // Keep spread if a pin is still selected
      refreshSpread();
      return;
    }

    const p = pins.get(id);
    if (!p) return;
    p.hovering = true;
    p.shell.classList.add('is-magnetic');
    if (!dragLocked) {
      map.dragging.disable();
      dragLocked = true;
    }
    if (clientX != null && clientY != null) aimMagnetic(p, clientX, clientY);
    window.addEventListener('pointermove', onWinMove, { passive: true });
    refreshSpread();
  };

  const setSelected = (id: string | null) => {
    selectedId = id;
    refreshSpread();
  };

  // Recompute when camera moves (overlap depends on screen px)
  const onMapView = () => {
    if (focusId()) refreshSpread();
  };
  map.on('zoom move', onMapView);

  const register: PinMotionController['register'] = ({
    id,
    lat,
    lng,
    shell,
    visual,
    marker,
    tipBase = [0, -10],
  }) => {
    if (shell.dataset.pinMotion === '1') return;
    shell.dataset.pinMotion = '1';

    // Drag/scroll guards (never disableClickPropagation — breaks pin click)
    L.DomEvent.disableScrollPropagation(shell);
    L.DomEvent.on(shell, 'mousedown', L.DomEvent.stopPropagation);
    L.DomEvent.on(shell, 'pointerdown', L.DomEvent.stopPropagation);
    L.DomEvent.on(shell, 'dblclick', L.DomEvent.stopPropagation);
    L.DomEvent.on(shell, 'touchstart', L.DomEvent.stopPropagation);

    if (!enabled) return;

    // Capture Leaflet iconAnchor margins before we ever write spread.
    const baseML = parseFloat(shell.style.marginLeft) || 0;
    const baseMT = parseFloat(shell.style.marginTop) || 0;

    const entry: PinMotionEntry = {
      id,
      lat,
      lng,
      shell,
      visual,
      marker,
      tipBase,
      baseML,
      baseMT,
      magTx: 0,
      magTy: 0,
      magCx: 0,
      magCy: 0,
      magVx: 0,
      magVy: 0,
      sprTx: 0,
      sprTy: 0,
      sprCx: 0,
      sprCy: 0,
      sprVx: 0,
      sprVy: 0,
      hovering: false,
    };
    pins.set(id, entry);

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      setHover(id, e.clientX, e.clientY);
    };
    const onLeave = () => {
      if (hoverId === id) setHover(null);
    };

    shell.addEventListener('pointerenter', onEnter);
    shell.addEventListener('pointerleave', onLeave);
    (shell as HTMLElement & { _pinMotionOff?: () => void })._pinMotionOff = () => {
      shell.removeEventListener('pointerenter', onEnter);
      shell.removeEventListener('pointerleave', onLeave);
    };
  };

  const destroy = () => {
    map.off('zoom move', onMapView);
    window.removeEventListener('pointermove', onWinMove);
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (dragLocked) {
      map.dragging.enable();
      dragLocked = false;
    }
    for (const p of pins.values()) {
      (
        p.shell as HTMLElement & { _pinMotionOff?: () => void }
      )._pinMotionOff?.();
      // Restore Leaflet iconAnchor margins (not empty)
      p.shell.style.marginLeft = `${p.baseML}px`;
      p.shell.style.marginTop = `${p.baseMT}px`;
      p.visual.style.transform = '';
      p.shell.classList.remove('is-magnetic', 'is-spread');
      delete p.shell.dataset.pinMotion;
      const tip = p.marker.getTooltip();
      if (tip) tip.options.offset = p.tipBase;
    }
    pins.clear();
    hoverId = null;
    selectedId = null;
  };

  return { register, setSelected, destroy };
}

/**
 * Leaflet internals used for continuous pinch (same path as TouchZoom).
 * Public setZoomAround(animate:false) calls _resetView → viewprereset →
 * GridLayer._invalidateAll, which wipes every tile each frame (map blink).
 */
type LeafletMapPinch = L.Map & {
  _move: (
    center: L.LatLng,
    zoom?: number,
    data?: { pinch?: boolean; round?: boolean },
    suppressEvent?: boolean,
  ) => L.Map;
  _moveStart: (zoomChanged: boolean, noMoveStart?: boolean) => L.Map;
  _moveEnd: (zoomChanged: boolean) => L.Map;
};

/**
 * Mac trackpad + touch gestures for Leaflet:
 * - Two-finger scroll → pan (both axes)
 * - Pinch (browsers emit as ctrl+wheel) → smooth fractional zoom around cursor
 * - Touch: native touchZoom (pinch) + drag
 *
 * Pinch uses the TouchZoom continuous path (`_move` + `{pinch:true}`) so
 * tiles scale in place instead of being destroyed/reloaded every frame.
 *
 * Note: plain mouse-wheel (no ctrl) also pans — use +/- control or pinch to zoom.
 * That matches Apple Maps / Google Maps trackpad behavior on macOS.
 */
function attachTrackpadGestures(map: L.Map): () => void {
  const el = map.getContainer();
  const m = map as LeafletMapPinch;
  el.style.touchAction = 'none';

  map.options.zoomSnap = 0;
  map.options.zoomDelta = 0.25;
  map.options.wheelDebounceTime = 0;
  map.options.wheelPxPerZoomLevel = 60;

  map.scrollWheelZoom.disable();

  let zoomRaf = 0;
  let pendingZoom: number | null = null;
  /** Container pixel kept stationary during pinch (cursor / gesture focus). */
  let zoomFocusPx: L.Point | null = null;
  let pinchActive = false;
  let settleTimer = 0;

  const clampZoom = (z: number) =>
    Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), z));

  /** Same math as L.Map.setZoomAround, without the tile-wiping setView path. */
  const centerKeepingFocus = (focusPx: L.Point, targetZoom: number): L.LatLng => {
    const scale = map.getZoomScale(targetZoom);
    const viewHalf = map.getSize().divideBy(2);
    const centerOffset = focusPx.subtract(viewHalf).multiplyBy(1 - 1 / scale);
    return map.containerPointToLatLng(viewHalf.add(centerOffset));
  };

  const endPinch = () => {
    if (!pinchActive) return;
    pinchActive = false;
    pendingZoom = null;
    zoomFocusPx = null;

    // Already at the final center/zoom via continuous `_move`.
    // Fire a plain `zoom` (no pinch flag) so GridLayer swaps in the correct
    // integer tile set without viewprereset wiping the layer first.
    map.fire('zoom');
    map.fire('move');
    m._moveEnd(true);
  };

  const scheduleSettle = () => {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(endPinch, 150);
  };

  const flushZoom = () => {
    zoomRaf = 0;
    if (pendingZoom == null || !zoomFocusPx) return;

    const z = pendingZoom;
    const focusPx = zoomFocusPx;
    // Clear so the next wheel burst accumulates from map.getZoom() after _move
    pendingZoom = null;

    if (Math.abs(z - map.getZoom()) < 1e-9) {
      if (pinchActive) scheduleSettle();
      return;
    }

    if (!pinchActive) {
      // Stop any in-flight pan/fly; start a continuous zoom gesture.
      map.stop();
      m._moveStart(true, false);
      pinchActive = true;
    }

    const newCenter = centerKeepingFocus(focusPx, z);
    // pinch:true → GridLayer only transforms tiles (no _invalidateAll)
    m._move(newCenter, z, { pinch: true, round: false });

    scheduleSettle();
  };

  const normalizeDelta = (e: WheelEvent) => {
    let dx = e.deltaX;
    let dy = e.deltaY;
    // deltaMode: 0 = pixels (trackpad), 1 = lines, 2 = pages
    if (e.deltaMode === 1) {
      dx *= 16;
      dy *= 16;
    } else if (e.deltaMode === 2) {
      dx *= el.clientWidth;
      dy *= el.clientHeight;
    }
    return { dx, dy };
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Mac pinch-to-zoom → wheel + ctrlKey (Chrome / Safari / Firefox)
    const isPinchZoom = e.ctrlKey || e.metaKey;

    if (isPinchZoom) {
      const containerPoint = map.mouseEventToContainerPoint(e);
      const { dy } = normalizeDelta(e);

      // ~60px of trackpad delta ≈ 1 zoom level (smooth fractional)
      const zoomFactor = -dy / 60;
      // Accumulate against pending zoom so high-frequency events aren't dropped
      const base = pendingZoom ?? map.getZoom();
      pendingZoom = clampZoom(base + zoomFactor);
      zoomFocusPx = containerPoint;

      if (!zoomRaf) {
        zoomRaf = requestAnimationFrame(flushZoom);
      }
      return;
    }

    // Two-finger pan (X + Y) — if a pinch was in flight, settle it first
    if (pinchActive) {
      window.clearTimeout(settleTimer);
      endPinch();
    }

    const { dx, dy } = normalizeDelta(e);
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

    map.panBy([dx, dy], { animate: false });
  };

  el.addEventListener('wheel', onWheel, { passive: false, capture: true });

  return () => {
    el.removeEventListener('wheel', onWheel, true);
    if (zoomRaf) cancelAnimationFrame(zoomRaf);
    window.clearTimeout(settleTimer);
    if (pinchActive) {
      pinchActive = false;
      m._moveEnd(true);
    }
    pendingZoom = null;
    zoomFocusPx = null;
  };
}

/**
 * ClientRouter / double-boot can leave a half-initialized Leaflet node
 * (`_leaflet_id` set, no live handle). The old code bailed with `return null`,
 * which produced an empty map shell (no pins, no zoom/locate controls).
 */
function forceCleanMapContainer(container: HTMLElement): void {
  const c = container as HTMLElement & { _leaflet_id?: number };
  if (c._leaflet_id == null && !container.classList.contains('leaflet-container')) {
    return;
  }
  container.replaceChildren();
  delete c._leaflet_id;
  for (const cls of [...container.classList]) {
    if (cls.startsWith('leaflet') || cls.startsWith('travel-map--')) {
      container.classList.remove(cls);
    }
  }
}

export function createTravelMap(options: TravelMapOptions): TravelMapHandle | null {
  const { container, pins, mode, center, zoom = 3, ariaLabel } = options;
  if (!container || (pins.length === 0 && !center)) return null;

  // Always remount cleanly — never soft-fail on residual Leaflet state
  forceCleanMapContainer(container);

  if (ariaLabel) container.setAttribute('aria-label', ariaLabel);
  container.setAttribute('role', 'region');

  let map: L.Map;
  try {
    // Gesture-friendly: drag, touch pinch, trackpad pan+pinch (custom wheel)
    // MapLibre latitude limits are stricter than Leaflet — clamp + minZoom help sync.
    map = L.map(container, {
      zoomControl: false,
      attributionControl: true,
      dragging: true,
      touchZoom: true,
      // Custom trackpad handler below (two-axis pan + pinch)
      scrollWheelZoom: false,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      tapTolerance: 15,
      bounceAtZoomLimits: true,
      // Smooth continuous zoom levels for pinch
      zoomSnap: 0,
      zoomDelta: 0.25,
      minZoom: 1,
      maxBounds: L.latLngBounds(L.latLng(-85, -180), L.latLng(85, 180)),
      maxBoundsViscosity: 1,
    });
  } catch (err) {
    console.error('[travel-map] L.map failed', err);
    forceCleanMapContainer(container);
    return null;
  }

  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const detachFullscreen = attachFullscreenControl(map, container);
  // GPS origin only on city place maps (route planner lives there)
  const detachLocate =
    mode === 'places' ? attachLocateControl(map, container) : () => {};

  const mapEl = map.getContainer();
  mapEl.style.cursor = 'grab';
  map.on('dragstart', () => {
    mapEl.style.cursor = 'grabbing';
  });
  map.on('dragend', () => {
    mapEl.style.cursor = 'grab';
  });

  const detachTrackpad = attachTrackpadGestures(map);

  // Landmark icon ↔ dot + density sizing from zoom
  const onZoomPinMode = () => applyZoomPinMode(map, container);
  map.on('zoom zoomend', onZoomPinMode);
  applyZoomPinMode(map, container);

  // MapLibre GL layer calls map.getCenter() on add — throws if no view yet.
  // Provisional center; real fitBounds/setView runs after pins are added.
  const provisionalCenter: L.LatLngExpression = center ??
    (pins[0] ? [pins[0].lat, pins[0].lng] : [20, 0]);
  const provisionalZoom = zoom ?? (mode === 'places' ? 12 : 2);
  map.setView(provisionalCenter, provisionalZoom, { animate: false });

  // Vector basemap (OpenFreeMap) via MapLibre-in-Leaflet; pins stay Leaflet.
  let basemapTheme: TravelMapBasemapTheme = readDocumentBasemapTheme();
  // maplibre-gl-leaflet layer (plugin has incomplete typings)
  let glLayer: { getMaplibreMap?: () => maplibregl.Map | null } | null = null;
  let glMap: maplibregl.Map | null = null;
  let unbindBasemapTints: (() => void) | null = null;

  try {
    glLayer = L.maplibreGL({
      style: VECTOR_STYLES[basemapTheme],
      attribution: VECTOR_ATTR,
      interactive: false,
      pane: 'tilePane',
    }).addTo(map);

    glMap = glLayer.getMaplibreMap?.() ?? null;
    if (glMap) {
      unbindBasemapTints = bindBasemapTints(glMap, () => basemapTheme);
    }
  } catch (err) {
    console.error('[travel-map] MapLibre basemap failed', err);
  }

  const setBasemapTheme = (theme: TravelMapBasemapTheme) => {
    if (theme === basemapTheme) return;
    basemapTheme = theme;
    // Re-tint any area currently on the map (poly opacity differs light vs dark)
    areas.forEach((layer, id) => {
      if (!map.hasLayer(layer)) return;
      setLayerStyle(layer, pinById.get(id), true);
    });
    if (!glMap) return;
    try {
      glMap.setStyle(VECTOR_STYLES[theme]);
      // style.load (bound above) re-applies water/park tints for basemapTheme
    } catch (err) {
      console.error('[travel-map] basemap theme switch failed', err);
    }
  };

  const markers = new Map<string, L.Marker>();
  /** Magnetic + cluster-spread for overlapping pins */
  const pinMotion = createPinMotionController(map);
  /** Polygon / polyline / multipolygon layers for places with `area` */
  const areas = new Map<string, L.Polygon | L.Polyline | L.LayerGroup>();
  const pinById = new Map(pins.map((p) => [p.id, p]));
  /** All pin anchors (incl. airports) */
  const latLngs: L.LatLngExpression[] = [];
  /** Initial / filter fit — airports excluded so city zoom stays on the center */
  const boundsLatLngs: L.LatLngExpression[] = [];
  const locale =
    document.documentElement.dataset.travelLocale === 'pt-BR' ? 'pt-BR' : 'en';

  const pinLabel = (pin: MapPin) =>
    locale === 'pt-BR' && pin.labelPt ? pin.labelPt : pin.label;

  /**
   * Polygon fill only — no stroke (hard rims read poorly on the dark basemap).
   * Optional light CSS blur softens the edge when the SVG pane allows overflow.
   */
  const polyBase = {
    interactive: false,
    bubblingMouseEvents: false,
    stroke: false as const,
    weight: 0,
    opacity: 0,
    lineJoin: 'round' as const,
  };

  /** Fill strength: light basemap needs higher opacity so category hues read. */
  const polyFillOpacityVisible = () =>
    basemapTheme === 'light' ? 0.52 : 0.32;

  const polyStyleHidden = (category: string | undefined): L.PathOptions => {
    const color = categoryColor(category);
    return {
      ...polyBase,
      color,
      fillColor: color,
      fillOpacity: 0,
      className: 'travel-area travel-area--poly',
    };
  };

  const polyStyleVisible = (category: string | undefined): L.PathOptions => {
    const color = categoryColor(category);
    return {
      ...polyBase,
      color,
      fillColor: color,
      fillOpacity: polyFillOpacityVisible(),
      className: 'travel-area travel-area--poly is-visible',
    };
  };

  /** One ring (or first of a multipolygon group). */
  const makePolygon = (
    latlngs: L.LatLngExpression[],
    category: string | undefined,
  ): L.Polygon => L.polygon(latlngs, polyStyleHidden(category));

  const lineStyleHidden = (category: string | undefined) => {
    const color = categoryColor(category);
    return {
      color,
      weight: 6,
      opacity: 0,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
      className: 'travel-area travel-area--line',
      interactive: false,
      bubblingMouseEvents: false,
    } as L.PolylineOptions;
  };

  const lineStyleVisible = (category: string | undefined) => {
    const color = categoryColor(category);
    return {
      color,
      weight: 6,
      opacity: 0.92,
      lineCap: 'round' as const,
      lineJoin: 'round' as const,
      className: 'travel-area travel-area--line is-visible',
      interactive: false,
      bubblingMouseEvents: false,
    } as L.PolylineOptions;
  };

  const AREA_FADE_MS = 320;
  const areaHideTimers = new Map<string, number>();
  /** Station dots for the currently highlighted route (e.g. metro line 6) */
  let routeStopLayer: L.LayerGroup | null = null;
  /**
   * While a day itinerary is active: placeId → used polyline slices only
   * (never the full metro line). Built from transit segments of that day.
   */
  let itineraryAreaSlices = new Map<string, [number, number][][]>();
  /** Temporary layer replacing full-line area on hover during itinerary */
  let itinerarySliceLayer: L.LayerGroup | null = null;

  const clearRouteStops = () => {
    if (routeStopLayer) {
      map.removeLayer(routeStopLayer);
      routeStopLayer = null;
    }
  };

  const clearItinerarySliceLayer = () => {
    if (itinerarySliceLayer) {
      map.removeLayer(itinerarySliceLayer);
      itinerarySliceLayer = null;
    }
  };

  /** Min distance (m) from station to a path polyline to count as “on this ride”. */
  const STATION_ON_PATH_M = 180;

  const distPointToSegM = (
    p: { lat: number; lng: number },
    a: [number, number],
    b: [number, number],
  ): number => {
    // Equirectangular local projection (Paris scale is fine for short segs)
    const toXY = (lat: number, lng: number) => {
      const x = ((lng * Math.PI) / 180) * 6371000 * Math.cos((48.85 * Math.PI) / 180);
      const y = ((lat * Math.PI) / 180) * 6371000;
      return { x, y };
    };
    const P = toXY(p.lat, p.lng);
    const A = toXY(a[0], a[1]);
    const B = toXY(b[0], b[1]);
    const abx = B.x - A.x;
    const aby = B.y - A.y;
    const apx = P.x - A.x;
    const apy = P.y - A.y;
    const ab2 = abx * abx + aby * aby;
    const t =
      ab2 < 1e-6 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
    const cx = A.x + t * abx;
    const cy = A.y + t * aby;
    return Math.hypot(P.x - cx, P.y - cy);
  };

  const stationNearPaths = (
    stop: MapRouteStop,
    paths: [number, number][][],
  ): boolean => {
    for (const path of paths) {
      for (let i = 0; i < path.length - 1; i++) {
        if (
          distPointToSegM(stop, path[i]!, path[i + 1]!) <= STATION_ON_PATH_M
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const showRouteStops = (
    pin: MapPin,
    /** When set, only stations near these itinerary slices */
    pathFilter?: [number, number][][],
  ) => {
    clearRouteStops();
    const stops = pin.routeStops;
    if (!stops?.length) return;

    const color = categoryColor(pin.category);
    const group = L.layerGroup();
    const isPt = locale === 'pt-BR';
    const filtered = pathFilter?.length
      ? stops.filter((s) => stationNearPaths(s, pathFilter))
      : stops;

    for (const stop of filtered) {
      const label =
        isPt && stop.namePt ? stop.namePt : stop.name;
      const m = L.circleMarker([stop.lat, stop.lng], {
        radius: 5,
        color: '#fff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.95,
        opacity: 0.95,
        className: 'travel-route-stop',
        interactive: true,
      });
      m.bindTooltip(label, {
        direction: 'top',
        offset: [0, -6],
        opacity: 1,
        className: 'travel-map-tooltip',
        interactive: false,
      });
      group.addLayer(m);
    }

    group.addTo(map);
    routeStopLayer = group;
  };

  /**
   * Areas/lines: mount on hover, fade in; fade out then unmount.
   * Route stops (metro stations) appear with the line.
   * Pins use CSS class toggle (not setIcon) so grow/icon animates smoothly.
   */
  const setLayerStyle = (
    layer: L.Polygon | L.Polyline | L.LayerGroup,
    pin: MapPin | undefined,
    visible: boolean,
  ) => {
    const isLine = pin?.area?.kind === 'polyline';
    const cat = pin?.category;

    const styleForPath = (path: L.Path): L.PathOptions => {
      if (isLine) {
        return visible ? lineStyleVisible(cat) : lineStyleHidden(cat);
      }
      return visible ? polyStyleVisible(cat) : polyStyleHidden(cat);
    };

    if (layer instanceof L.LayerGroup) {
      layer.eachLayer((child) => {
        if (child instanceof L.Path) child.setStyle(styleForPath(child));
      });
    } else {
      layer.setStyle(styleForPath(layer));
    }
  };

  const hideAllAreas = () => {
    areas.forEach((layer, aid) => {
      const pin = pinById.get(aid);
      const prevTimer = areaHideTimers.get(aid);
      if (prevTimer != null) {
        window.clearTimeout(prevTimer);
        areaHideTimers.delete(aid);
      }
      if (map.hasLayer(layer)) {
        setLayerStyle(layer, pin, false);
        const t = window.setTimeout(() => {
          if (map.hasLayer(layer)) map.removeLayer(layer);
          areaHideTimers.delete(aid);
        }, AREA_FADE_MS);
        areaHideTimers.set(aid, t);
      }
    });
  };

  /**
   * Show only the itinerary-used slice of a metro/route place (not full line).
   */
  const showItineraryAreaSlice = (
    placeId: string,
    paths: [number, number][][],
  ) => {
    clearItinerarySliceLayer();
    hideAllAreas();

    const pin = pinById.get(placeId);
    const color = categoryColor(pin?.category);
    const group = L.layerGroup();

    for (const path of paths) {
      if (path.length < 2) continue;
      const poly = L.polyline(path as L.LatLngExpression[], {
        color,
        weight: 6,
        opacity: 0.92,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'travel-area travel-area--line is-visible travel-area--itinerary-slice',
        interactive: false,
      });
      group.addLayer(poly);
    }

    group.addTo(map);
    itinerarySliceLayer = group;

    if (pin) showRouteStops(pin, paths);
  };

  const setAreaActive = (id: string | null) => {
    clearRouteStops();
    clearItinerarySliceLayer();

    // Day itinerary active: never paint full metro/route lines — only used slices
    if (id && itineraryFocusIds) {
      const pin = pinById.get(id);
      const isRoutePlace =
        ROUTE_WAYPOINT_AREA_IDS.has(id) ||
        (pin?.area?.kind === 'polyline' && (pin.routeStops?.length ?? 0) > 0);

      if (isRoutePlace) {
        const slices = itineraryAreaSlices.get(id);
        if (slices?.length) {
          showItineraryAreaSlice(id, slices);
          return;
        }
        // On the day route but no slice data — pin only, no full line
        hideAllAreas();
        return;
      }
    }

    areas.forEach((layer, aid) => {
      const pin = pinById.get(aid);
      const prevTimer = areaHideTimers.get(aid);
      if (prevTimer != null) {
        window.clearTimeout(prevTimer);
        areaHideTimers.delete(aid);
      }

      if (aid === id) {
        if (!map.hasLayer(layer)) {
          setLayerStyle(layer, pin, false);
          layer.addTo(map);
          if ('bringToBack' in layer && typeof layer.bringToBack === 'function') {
            layer.bringToBack();
          }
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setLayerStyle(layer, pin, true);
            });
          });
        } else {
          setLayerStyle(layer, pin, true);
          if ('bringToBack' in layer && typeof layer.bringToBack === 'function') {
            layer.bringToBack();
          }
        }
        if (pin) showRouteStops(pin);
      } else if (map.hasLayer(layer)) {
        setLayerStyle(layer, pin, false);
        const t = window.setTimeout(() => {
          if (map.hasLayer(layer)) map.removeLayer(layer);
          areaHideTimers.delete(aid);
        }, AREA_FADE_MS);
        areaHideTimers.set(aid, t);
      }
    });

    // Place with routeStops but no area layer still gets station dots
    if (id && !areas.has(id)) {
      const pin = pinById.get(id);
      if (pin?.routeStops?.length) showRouteStops(pin);
    }
  };

  /** Toggle pin is-active without recreating DOM (keeps CSS transitions) */
  const setPinActive = (id: string | null) => {
    markers.forEach((marker, mid) => {
      const root = marker.getElement()?.querySelector('.travel-pin');
      if (!root) return;
      const on = mid === id;
      root.classList.toggle('is-active', on);
      const pin = pinById.get(mid);
      marker.setZIndexOffset(on ? (pin?.featured ? 1200 : 1000) : pin?.featured ? 200 : 0);
    });
  };

  for (const pin of pins) {
    const label = pinLabel(pin);

    const excludeFromFit = pin.category === 'airport';

    // Region layer created hidden — only added on hover with fade-in
    if (pin.area) {
      let layer: L.Polygon | L.Polyline | L.LayerGroup | null = null;
      if (pin.area.kind === 'polyline' && pin.area.path.length >= 2) {
        layer = L.polyline(
          pin.area.path as L.LatLngExpression[],
          lineStyleHidden(pin.category),
        );
      } else if (pin.area.kind === 'polygon' && pin.area.path.length >= 3) {
        layer = makePolygon(
          pin.area.path as L.LatLngExpression[],
          pin.category,
        );
      } else if (pin.area.kind === 'multipolygon' && pin.area.paths.length > 0) {
        const group = L.layerGroup();
        for (const ring of pin.area.paths) {
          if (ring.length < 3) continue;
          group.addLayer(
            makePolygon(ring as L.LatLngExpression[], pin.category),
          );
        }
        layer = group;
      }

      if (layer) {
        areas.set(pin.id, layer);
        // Bounds from path data (multipolygon LayerGroups have no single getBounds)
        if (pin.area.kind === 'multipolygon') {
          for (const ring of pin.area.paths) {
            for (const pt of ring) {
              latLngs.push(pt as L.LatLngTuple);
              if (!excludeFromFit) boundsLatLngs.push(pt as L.LatLngTuple);
            }
          }
        } else {
          for (const pt of pin.area.path) {
            latLngs.push(pt as L.LatLngTuple);
            if (!excludeFromFit) boundsLatLngs.push(pt as L.LatLngTuple);
          }
        }
      }
    }

    const marker = L.marker([pin.lat, pin.lng], {
      icon: makeIcon(visualFor(pin, false)),
      title: label,
      keyboard: true,
      riseOnHover: true,
      zIndexOffset: pin.featured ? 200 : 0,
    });

    marker.bindTooltip(label, {
      direction: 'top',
      offset: [0, pin.featured ? -16 : -10],
      opacity: 1,
      className: 'travel-map-tooltip',
      // Must not steal hover or magnetic pointerleave fires immediately
      interactive: false,
      sticky: false,
    });

    /** Place card panel or city navigation — also bound on the DOM node below */
    let onActivate: (() => void) | null = null;

    if (pin.href) {
      // City pins on /travel index → navigate to city page
      onActivate = () => {
        window.location.href = pin.href!;
      };
      marker.on('click', onActivate);
      marker.on('keypress', (e: L.LeafletKeyboardEvent) => {
        if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
          onActivate?.();
        }
      });
    } else if (mode === 'places') {
      // City map: open side panel (handled by travel-panel via travel:select)
      onActivate = () => {
        select(pin.id);
      };
      marker.on('click', onActivate);
      marker.on('keypress', (e: L.LeafletKeyboardEvent) => {
        if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
          L.DomEvent.preventDefault(e);
          onActivate?.();
        }
      });
    }

    // Pin hover uses the same highlight path as cards (after highlight is defined)
    marker.on('mouseover', () => {
      if (selectedId !== pin.id) highlight(pin.id);
    });
    marker.on('mouseout', () => {
      if (selectedId !== pin.id) highlight(null);
    });

    marker.addTo(map);

    // Magnetic + cluster spread (no soft site cursor on map pins)
    const hit = marker.getElement();
    const visual = hit?.querySelector<HTMLElement>('[data-magnetic-visual]');
    if (hit && visual) {
      hit.classList.add('travel-pin-hit');
      const tipBase: L.PointExpression = [0, pin.featured ? -16 : -10];
      pinMotion.register({
        id: pin.id,
        lat: pin.lat,
        lng: pin.lng,
        shell: hit,
        visual,
        marker,
        tipBase,
      });
    }

    // Direct DOM click: reliable with magnetic (mousedown stopPropagation) and
    // MapLibre basemap; Leaflet map-delegated click can miss the pin.
    if (hit && onActivate) {
      L.DomEvent.on(hit, 'click', (e: Event) => {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        onActivate?.();
      });
    }

    markers.set(pin.id, marker);
    latLngs.push([pin.lat, pin.lng]);
    if (!excludeFromFit) {
      boundsLatLngs.push([pin.lat, pin.lng]);
    }
  }

  const fitSource =
    mode === 'places' && boundsLatLngs.length > 0 ? boundsLatLngs : latLngs;

  /** Pixels covered by UI chrome (sidebar, form sheet, etc.) on each edge */
  let chromePad: Required<MapChromePadding> = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
  /** Overlay only (mobile sheet / place panel) — merged with base sidebar chrome */
  let overlayChrome: MapChromePadding | null = null;

  /**
   * Desktop chrome overlays the map:
   * - left list (sidebar)
   * - right place card (when open)
   * fitBounds / pin focus center in the free rectangle between them.
   */
  const measureBaseChrome = (): Required<MapChromePadding> => {
    const base: Required<MapChromePadding> = {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
    if (mode !== 'places' || typeof window === 'undefined') return base;
    const mapRect = container.getBoundingClientRect();
    if (mapRect.width < 8) return base;
    const gap = 8;
    const maxEdge = Math.round(mapRect.width * 0.72);
    const maxTop = Math.round(mapRect.height * 0.55);
    const isFs = Boolean(document.fullscreenElement);

    // Site header overlays the full-bleed map — free region starts below it
    if (!isFs && window.matchMedia('(min-width: 901px)').matches) {
      const header = document.querySelector<HTMLElement>('.site-header');
      if (header) {
        const headerRect = header.getBoundingClientRect();
        const covered = Math.round(headerRect.bottom - mapRect.top);
        if (covered > 0) {
          base.top = Math.max(0, Math.min(covered + gap, maxTop));
        }
      }
    }

    // Left list (desktop floating sidebar)
    if (window.matchMedia('(min-width: 901px)').matches) {
      const city = document.querySelector('.travel-city');
      if (city && !city.classList.contains('is-sidebar-collapsed')) {
        const sidebar = document.querySelector<HTMLElement>('.travel-city__body');
        if (sidebar) {
          const sideRect = sidebar.getBoundingClientRect();
          if (sideRect.width > 8) {
            const covered = Math.round(sideRect.right - mapRect.left);
            base.left = Math.max(0, Math.min(covered + gap, maxEdge));
          }
        }
      }
    }

    // Right place card (desktop; mobile uses bottom sheet via overlayChrome)
    if (!window.matchMedia('(max-width: 640px)').matches) {
      const placePanel = document.querySelector<HTMLElement>(
        '[data-travel-map-panel]',
      );
      if (
        placePanel &&
        !placePanel.hidden &&
        placePanel.classList.contains('is-open')
      ) {
        const panelRect = placePanel.getBoundingClientRect();
        if (panelRect.width > 8) {
          const covered = Math.round(mapRect.right - panelRect.left);
          base.right = Math.max(0, Math.min(covered + gap, maxEdge));
        }
      }
    }

    return base;
  };

  const recomputeChromePad = () => {
    const base = measureBaseChrome();
    chromePad = {
      top: Math.max(base.top, overlayChrome?.top ?? 0),
      right: Math.max(base.right, overlayChrome?.right ?? 0),
      bottom: Math.max(base.bottom, overlayChrome?.bottom ?? 0),
      left: Math.max(base.left, overlayChrome?.left ?? 0),
    };
  };

  const chromeFitPadding = (gutter = 16) => {
    recomputeChromePad();
    return {
      paddingTopLeft: [
        chromePad.left + gutter,
        chromePad.top + gutter,
      ] as L.PointExpression,
      paddingBottomRight: [
        chromePad.right + gutter,
        chromePad.bottom + gutter,
      ] as L.PointExpression,
    };
  };

  const fitLatLngsWithChrome = (
    pts: L.LatLngExpression[],
    opts: { animate?: boolean; maxZoom?: number; duration?: number; pad?: number } = {},
  ) => {
    if (pts.length === 0) return;
    const maxZoom = opts.maxZoom ?? (mode === 'places' ? (zoom ?? 13) : 5);
    const pad = opts.pad ?? 0.12;
    if (pts.length === 1) {
      const z = maxZoom;
      recomputeChromePad();
      const target = chromeAwareCenter(pts[0], z);
      if (opts.animate) {
        map.flyTo(target, z, { duration: opts.duration ?? 0.4 });
      } else {
        map.setView(target, z, { animate: false });
      }
      return;
    }
    const bounds = L.latLngBounds(pts as L.LatLngTuple[]).pad(pad);
    const fitOpts = {
      ...chromeFitPadding(),
      maxZoom,
    };
    if (opts.animate) {
      map.flyToBounds(bounds, {
        ...fitOpts,
        duration: opts.duration ?? 0.45,
        easeLinearity: 0.25,
      });
    } else {
      map.fitBounds(bounds, { ...fitOpts, animate: false });
    }
  };

  // Declared early so fit helpers can use chrome-aware centering (hoisted via const later for chromeAwareCenter — define minimal version here after chromePad)
  const chromeAwareCenter = (
    latlng: L.LatLngExpression,
    z: number,
  ): L.LatLng => {
    const { top, right, bottom, left } = chromePad;
    const size = map.getSize();
    if (bottom + top >= size.y - 48 && left + right >= size.x - 48) {
      return L.latLng(latlng);
    }
    const freeCenter = L.point(
      (size.x + left - right) / 2,
      (size.y + top - bottom) / 2,
    );
    const mapCenterPx = size.divideBy(2);
    const offset = mapCenterPx.subtract(freeCenter);
    const pin = L.latLng(latlng);
    return map.unproject(map.project(pin, z).add(offset), z);
  };

  // Initial camera — free region ignores desktop sidebar overlay
  recomputeChromePad();
  if (mode === 'cities' && latLngs.length > 0) {
    fitLatLngsWithChrome(latLngs, { animate: false, maxZoom: 5, pad: 0.35 });
  } else if (mode === 'places' && fitSource.length > 0) {
    // City zoom: ignore airports so ORY/CDG don't pull the viewport out
    fitLatLngsWithChrome(fitSource, {
      animate: false,
      maxZoom: zoom ?? 13,
      pad: 0.12,
    });
  } else if (center) {
    map.setView(chromeAwareCenter(center, zoom), zoom, { animate: false });
  } else if (latLngs.length > 0) {
    map.setView(
      chromeAwareCenter(latLngs[0] as L.LatLngTuple, zoom),
      zoom,
      { animate: false },
    );
  }

  requestAnimationFrame(() => {
    map.invalidateSize();
    recomputeChromePad();
    applyZoomPinMode(map, container);
    // Second fit after layout/CSS (sidebar width) settles
    if (mode === 'places' && fitSource.length > 0) {
      fitLatLngsWithChrome(fitSource, {
        animate: false,
        maxZoom: zoom ?? 13,
        pad: 0.12,
      });
    }
  });

  let activeId: string | null = null;
  /** Pin kept active while side panel is open */
  let selectedId: string | null = null;
  let visibleIds: Set<string> | null = null;
  let filterPreview: FilterPreviewState = null;
  /** Day itinerary focus: these ids stay solid; others fade (not hidden) */
  let itineraryFocusIds: Set<string> | null = null;
  /** placeId → 1-based order on the day route */
  let itineraryStopNumbers: Map<string, number> | null = null;
  let itineraryLegLayer: L.LayerGroup | null = null;
  /** Polylines tagged by logical place→place leg for hover highlight */
  let itineraryLegLines: Array<{
    fromId?: string;
    toId?: string;
    hopIndex?: number;
    mode: 'walk' | 'transit';
    color: string;
    /** Base stroke (solid transit / dotted walk) */
    line: L.Polyline;
    /**
     * Optional direction-flow overlay (transit only).
     * Soft dashed layer on top of the solid metro stroke.
     */
    flow?: L.Polyline;
    /** Last applied emphasis — skip setStyle when unchanged (avoids mouseout loops) */
    lastEmphasis?: 'normal' | 'hot' | 'dim';
  }> = [];
  /** Transfer markers for multi-line hops (opacity follows leg highlight) */
  let itineraryTransferMarkers: Array<{
    fromId?: string;
    toId?: string;
    hopIndex?: number;
    marker: L.Marker;
  }> = [];
  /**
   * Day-route emphasis: quiet by default; hot on map/timeline hover.
   * - leg: single hop or place→place (key includes optional #hopIndex)
   * - place: all segments that touch a stop
   */
  let itineraryHighlight:
    | null
    | { kind: 'leg'; key: string }
    | { kind: 'place'; id: string } = null;
  /** Who last set the highlight — map leave must not clear timeline hover */
  let itineraryHighlightSource: 'map' | 'timeline' | null = null;
  /** Last pointer client coords (for leave detection after setStyle redraws) */
  let itineraryPointerClient = { x: 0, y: 0 };
  let itineraryMapPointerClearTimer = 0;
  let itineraryPointerTrackBound = false;

  const setMarkerVisual = (
    marker: L.Marker,
    mode: 'solid' | 'dim' | 'fade' | 'hide',
  ) => {
    const el = marker.getElement();
    if (mode === 'hide') {
      if (map.hasLayer(marker)) map.removeLayer(marker);
      if (el) {
        el.style.opacity = '';
        el.classList.remove('is-filter-preview-dim', 'is-filter-preview-fade');
      }
      return;
    }
    if (!map.hasLayer(marker)) marker.addTo(map);
    if (el) {
      el.style.opacity =
        mode === 'solid' ? '1' : mode === 'dim' ? '0.38' : '0.22';
      el.classList.toggle('is-filter-preview-dim', mode === 'dim');
      el.classList.toggle('is-filter-preview-fade', mode === 'fade');
      // Never set `transition` inline — it overrides Leaflet's zoom-anim
      // transform transition and makes pins jump after the map finishes zooming.
    }
  };

  const syncItineraryBadges = () => {
    markers.forEach((marker, id) => {
      const root = marker.getElement()?.querySelector('.travel-pin');
      if (!root) return;
      const n = itineraryStopNumbers?.get(id);
      let badge = root.querySelector<HTMLElement>('.travel-pin__itinerary-n');
      if (n != null) {
        root.classList.add('is-itinerary-stop');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'travel-pin__itinerary-n';
          badge.setAttribute('aria-hidden', 'true');
          root.appendChild(badge);
        }
        badge.textContent = String(n);
      } else {
        root.classList.remove('is-itinerary-stop');
        badge?.remove();
      }
    });
  };

  /** Apply base filter + itinerary focus + optional chip-hover preview. */
  const applyPinFilterState = () => {
    markers.forEach((marker, id) => {
      const baseShow = !visibleIds || visibleIds.has(id);
      let mode: 'solid' | 'dim' | 'fade' | 'hide';

      if (itineraryFocusIds) {
        // Day route: keep all pins; focus solid, others soft
        if (!baseShow && !itineraryFocusIds.has(id)) {
          mode = 'hide';
        } else {
          mode = itineraryFocusIds.has(id) ? 'solid' : 'fade';
        }
      } else if (!filterPreview) {
        mode = baseShow ? 'solid' : 'hide';
      } else if (filterPreview.solid.has(id)) {
        mode = 'solid';
      } else if (filterPreview.dim.has(id)) {
        mode = 'dim';
      } else if (filterPreview.fadeOthers) {
        mode = 'fade';
      } else {
        mode = 'hide';
      }

      setMarkerVisual(marker, mode);

      // Areas stay hover-only; remove if pin is fully hidden
      const areaLayer = areas.get(id);
      if (areaLayer && mode === 'hide' && map.hasLayer(areaLayer)) {
        map.removeLayer(areaLayer);
      }
    });
    syncItineraryBadges();
  };

  const highlight = (id: string | null) => {
    if (id && visibleIds && !visibleIds.has(id)) {
      id = null;
    }
    activeId = id;
    setPinActive(id ?? selectedId);
    setAreaActive(id ?? selectedId);
  };

  /** Overlay padding only (sheet/panel). Base sidebar is re-measured each time. */
  const setChromePadding = (padding: MapChromePadding | null) => {
    overlayChrome = padding;
    recomputeChromePad();
  };

  const collectFitPts = (): L.LatLngExpression[] => {
    const pts: L.LatLngExpression[] = [];
    markers.forEach((_marker, id) => {
      const show = !visibleIds || visibleIds.has(id);
      if (!show) return;
      const pin = pinById.get(id);
      if (!pin || pin.category === 'airport') return;
      pts.push([pin.lat, pin.lng]);
    });
    if (pts.length === 0 && fitSource.length > 0) return fitSource;
    return pts;
  };

  const syncUiChrome = (opts?: { refit?: boolean; animate?: boolean }) => {
    recomputeChromePad();
    if (!opts?.refit) return;
    const pts = collectFitPts();
    if (pts.length === 0) return;
    fitLatLngsWithChrome(pts, {
      animate: opts.animate ?? false,
      maxZoom: mode === 'places' ? (zoom ?? 14) : 5,
      pad: 0.12,
    });
  };

  /**
   * Animate the camera so the pin sits in the free (unobstructed) map region.
   * Always one continuous animation — never jump-then-pan (that flashes tiles).
   */
  const viewWithChrome = (
    latlng: L.LatLngExpression,
    z: number,
    animate: boolean,
    duration = 0.55,
  ) => {
    recomputeChromePad();
    const target = chromeAwareCenter(latlng, z);
    if (!animate) {
      map.setView(target, z, { animate: false });
      return;
    }
    // flyTo always runs a smooth pan+zoom curve. setView often falls back to
    // an instant _resetView (e.g. large pan, zoom path failing) → map flash.
    map.flyTo(target, z, {
      duration,
      easeLinearity: 0.25,
    });
  };

  const ensureVisible = (id: string, animate = true) => {
    const pin = pinById.get(id);
    if (!pin) return;
    if (visibleIds && !visibleIds.has(id)) return;

    const z = Math.max(map.getZoom(), 14);
    const areaLayer = areas.get(id);
    if (areaLayer) {
      const bounds = areaLayer.getBounds().pad(0.2);
      recomputeChromePad();
      const fitOpts = {
        maxZoom: z,
        ...chromeFitPadding(24),
      };
      if (animate) {
        map.flyToBounds(bounds, {
          ...fitOpts,
          duration: 0.55,
          easeLinearity: 0.25,
        });
      } else {
        map.fitBounds(bounds, { ...fitOpts, animate: false });
      }
    } else {
      viewWithChrome([pin.lat, pin.lng], z, animate);
    }
    highlight(id);
  };

  const select = (id: string | null) => {
    if (id && visibleIds && !visibleIds.has(id)) {
      id = null;
    }
    selectedId = id;
    // Overlap-spread only while a pin is hovered or selected
    pinMotion.setSelected(id);
    highlight(id);
    container.dispatchEvent(
      new CustomEvent('travel:select', {
        bubbles: true,
        detail: { id },
      }),
    );
    if (id) {
      // Camera respects chrome padding (form sheet bottom, etc.)
      ensureVisible(id, true);
    }
  };

  const flyTo = (id: string) => {
    ensureVisible(id, true);
  };

  const setVisibleIds = (
    ids: Set<string> | null,
    opts?: { fit?: boolean },
  ) => {
    visibleIds = ids && ids.size > 0 ? ids : null;
    filterPreview = null;

    // Never leave a filtered-out area on the map
    if (activeId && visibleIds && !visibleIds.has(activeId)) {
      activeId = null;
      setPinActive(null);
      setAreaActive(null);
    }
    if (selectedId && visibleIds && !visibleIds.has(selectedId)) {
      selectedId = null;
      pinMotion.setSelected(null);
    }

    applyPinFilterState();

    // Default fit for search/category changes; skip for view-mode toggles
    if (opts?.fit === false) return;

    const visibleLatLngs = collectFitPts();
    if (visibleLatLngs.length > 0) {
      fitLatLngsWithChrome(visibleLatLngs, {
        animate: true,
        maxZoom: mode === 'places' ? (zoom ?? 14) : 5,
        pad: 0.14,
        duration: 0.4,
      });
    }
  };

  const setFilterPreview = (preview: FilterPreviewState) => {
    filterPreview = preview;
    applyPinFilterState();
  };

  /** Multi-stop walking preview (OSRM geometry) + optional stop index badges */
  let routeLine: L.Polyline | null = null;
  let routeStopMarkers: L.Marker[] = [];
  let userLocation: UserLocationState | null = null;
  let userMarker: L.Marker | null = null;
  let userAccuracyCircle: L.Circle | null = null;

  const clearRoutePreview = () => {
    if (routeLine) {
      map.removeLayer(routeLine);
      routeLine = null;
    }
    for (const m of routeStopMarkers) {
      map.removeLayer(m);
    }
    routeStopMarkers = [];
  };

  const clearItineraryRoute = () => {
    if (itineraryLegLayer) {
      map.removeLayer(itineraryLegLayer);
      itineraryLegLayer = null;
    }
    itineraryLegLines = [];
    itineraryTransferMarkers = [];
    itineraryHighlight = null;
    itineraryHighlightSource = null;
    window.clearTimeout(itineraryMapPointerClearTimer);
    itineraryMapPointerClearTimer = 0;
    clearItinerarySliceLayer();
    itineraryAreaSlices = new Map();
    itineraryFocusIds = null;
    itineraryStopNumbers = null;
    markers.forEach((marker) => {
      marker.setZIndexOffset(0);
    });
    applyPinFilterState();
  };

  const transferIcon = (fromColor: string, toColor: string, title: string) =>
    L.divIcon({
      className: 'travel-transfer-icon',
      html:
        `<span class="travel-transfer-dot" title="${title.replace(/"/g, '&quot;')}" aria-hidden="true">` +
        `<span class="travel-transfer-dot__half travel-transfer-dot__half--from" style="background:${fromColor}"></span>` +
        `<span class="travel-transfer-dot__half travel-transfer-dot__half--to" style="background:${toColor}"></span>` +
        `</span>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

  /** Mini station marker along a metro/RER spine (path vertices). */
  const stationIcon = (color: string, isEnd: boolean) =>
    L.divIcon({
      className: isEnd
        ? 'travel-itinerary-station travel-itinerary-station--end'
        : 'travel-itinerary-station',
      html: `<span class="travel-itinerary-station__dot" style="--station-color:${color}" aria-hidden="true"></span>`,
      iconSize: isEnd ? [10, 10] : [8, 8],
      iconAnchor: isEnd ? [5, 5] : [4, 4],
    });

  /**
   * Quiet default so the map stays readable; hot on hover.
   * Transit base stays solid; walk stays dotted.
   */
  const legStyle = (
    mode: 'walk' | 'transit',
    color: string,
    emphasis: 'normal' | 'hot' | 'dim',
  ) => {
    const isWalk = mode === 'walk';
    if (emphasis === 'hot') {
      return {
        color,
        weight: isWalk ? 6 : 7,
        opacity: 1,
        // Walk only: dots. Transit is always solid (flow rides a second layer).
        dashArray: isWalk ? '2 10' : undefined,
      };
    }
    if (emphasis === 'dim') {
      return {
        color,
        weight: isWalk ? 3 : 3.5,
        opacity: 0.12,
        dashArray: isWalk ? '2 10' : undefined,
      };
    }
    return {
      color,
      weight: isWalk ? 4 : 4.5,
      opacity: isWalk ? 0.32 : 0.38,
      dashArray: isWalk ? '2 10' : undefined,
    };
  };

  /**
   * Soft dashed overlay on transit spines — motion only, not the main stroke.
   * Longer gap + lower opacity = gentle direction cue.
   */
  const flowStyle = (color: string, emphasis: 'normal' | 'hot' | 'dim') => {
    if (emphasis === 'hot') {
      return {
        color,
        weight: 3,
        opacity: 0.55,
        dashArray: '6 22',
      };
    }
    if (emphasis === 'dim') {
      return {
        color,
        weight: 2,
        opacity: 0.06,
        dashArray: '6 22',
      };
    }
    return {
      color,
      weight: 2.5,
      opacity: 0.28,
      dashArray: '6 22',
    };
  };

  const legKey = (
    fromId?: string,
    toId?: string,
    hopIndex?: number,
  ): string => {
    const base = `${fromId ?? ''}→${toId ?? ''}`;
    return hopIndex != null && Number.isFinite(hopIndex)
      ? `${base}#${hopIndex}`
      : base;
  };

  const legMatchesHighlight = (
    fromId?: string,
    toId?: string,
    hopIndex?: number,
  ): boolean => {
    if (!itineraryHighlight) return false;
    if (!fromId || !toId) return false;
    if (itineraryHighlight.kind === 'leg') {
      const key = itineraryHighlight.key;
      // Exact hop match (RER E vs M13)
      if (legKey(fromId, toId, hopIndex) === key) return true;
      // Highlight without hop index still matches whole place→place leg
      if (key === `${fromId}→${toId}` && hopIndex == null) return true;
      // Map segment without hopIndex matches any hop of that pair if key has no #
      if (!key.includes('#') && `${fromId}→${toId}` === key) return true;
      // Timeline hop key matches only that hopIndex
      if (hopIndex != null && key === legKey(fromId, toId, hopIndex)) return true;
      return false;
    }
    return (
      fromId === itineraryHighlight.id || toId === itineraryHighlight.id
    );
  };

  const applyItineraryLegHighlight = () => {
    const hasFocus = itineraryHighlight != null;
    const hotItems: typeof itineraryLegLines = [];

    for (const item of itineraryLegLines) {
      const match = legMatchesHighlight(
        item.fromId,
        item.toId,
        item.hopIndex,
      );
      const emphasis: 'normal' | 'hot' | 'dim' = !hasFocus
        ? 'normal'
        : match
          ? 'hot'
          : 'dim';
      const styleChanged = item.lastEmphasis !== emphasis;
      item.lastEmphasis = emphasis;

      // Only restyle when emphasis changes — setStyle/bringToFront on every
      // mouseover fires synthetic mouseout and can stick hover state.
      if (styleChanged) {
        item.line.setStyle(legStyle(item.mode, item.color, emphasis));
        if (item.flow) item.flow.setStyle(flowStyle(item.color, emphasis));
      }

      const el = item.line.getElement();
      if (el) {
        el.classList.toggle('is-hot', emphasis === 'hot');
        el.classList.toggle('is-dim', emphasis === 'dim');
        el.classList.toggle('is-normal', emphasis === 'normal');
      }
      if (item.flow) {
        const flowEl = item.flow.getElement();
        if (flowEl) {
          flowEl.classList.toggle('is-hot', emphasis === 'hot');
          flowEl.classList.toggle('is-dim', emphasis === 'dim');
          flowEl.classList.toggle('is-normal', emphasis === 'normal');
        }
      }
      if (match) hotItems.push(item);
    }

    // Hovered segment(s) on top — solid first, flow last (animated dashes visible)
    for (const item of hotItems) {
      item.line.bringToFront?.();
      item.flow?.bringToFront?.();
    }

    for (const tr of itineraryTransferMarkers) {
      const match = legMatchesHighlight(tr.fromId, tr.toId, tr.hopIndex);
      const el = tr.marker.getElement();
      if (!el) continue;
      el.classList.toggle('is-hot', hasFocus && match);
      el.classList.toggle('is-dim', hasFocus && !match);
      el.classList.toggle('is-normal', !hasFocus);
      if (hasFocus && match) tr.marker.setZIndexOffset(800);
      else tr.marker.setZIndexOffset(550);
    }
  };

  const highlightItineraryLeg = (
    fromId: string | null,
    toId?: string | null,
    source: 'map' | 'timeline' = 'timeline',
    hopIndex?: number | null,
  ) => {
    if (!itineraryLegLayer || itineraryLegLines.length === 0) {
      itineraryHighlight = null;
      itineraryHighlightSource = null;
      return;
    }
    if (!fromId || !toId) {
      itineraryHighlight = null;
      itineraryHighlightSource = null;
      applyItineraryLegHighlight();
      return;
    }
    const hop =
      hopIndex != null && Number.isFinite(hopIndex) ? hopIndex : undefined;
    itineraryHighlight = {
      kind: 'leg',
      key: legKey(fromId, toId, hop),
    };
    itineraryHighlightSource = source;
    applyItineraryLegHighlight();
  };

  const highlightItineraryPlace = (placeId: string | null) => {
    if (!itineraryLegLayer || itineraryLegLines.length === 0) {
      itineraryHighlight = null;
      itineraryHighlightSource = null;
      return;
    }
    if (!placeId) {
      itineraryHighlight = null;
      itineraryHighlightSource = null;
      applyItineraryLegHighlight();
      return;
    }
    itineraryHighlight = { kind: 'place', id: placeId };
    itineraryHighlightSource = 'timeline';
    applyItineraryLegHighlight();
  };

  /**
   * True if client point is still over a hoverable itinerary stroke
   * (walk/transit base path — not the non-interactive flow overlay).
   */
  const isPointerOverItineraryStroke = (x: number, y: number): boolean => {
    const el = document.elementFromPoint(x, y);
    if (!el) return false;
    if (el instanceof Element) {
      if (
        el.classList.contains('travel-itinerary-leg--walk') ||
        el.classList.contains('travel-itinerary-leg--transit')
      ) {
        return true;
      }
      // Half/half transfer markers also count as on-route hover targets
      if (
        el.closest?.(
          '.travel-transfer-icon, .travel-transfer-dot, .travel-itinerary-station',
        )
      ) {
        return true;
      }
    }
    return false;
  };

  /** Clear map-driven leg hover only when pointer truly left the stroke. */
  const scheduleClearMapLegHover = () => {
    window.clearTimeout(itineraryMapPointerClearTimer);
    itineraryMapPointerClearTimer = window.setTimeout(() => {
      if (itineraryHighlightSource !== 'map') return;
      if (
        isPointerOverItineraryStroke(
          itineraryPointerClient.x,
          itineraryPointerClient.y,
        )
      ) {
        return;
      }
      highlightItineraryLeg(null);
    }, 40);
  };

  const trackItineraryPointer = (e: PointerEvent) => {
    itineraryPointerClient = { x: e.clientX, y: e.clientY };
    // If we think we're map-hovering but left the stroke (e.g. setStyle
    // swallowed mouseout), clear on next move off-line.
    if (
      itineraryHighlightSource === 'map' &&
      itineraryHighlight?.kind === 'leg' &&
      !isPointerOverItineraryStroke(e.clientX, e.clientY)
    ) {
      scheduleClearMapLegHover();
    }
  };

  const ensureItineraryPointerTracking = () => {
    if (itineraryPointerTrackBound) return;
    itineraryPointerTrackBound = true;
    map.getContainer().addEventListener('pointermove', trackItineraryPointer, {
      passive: true,
    });
  };

  /**
   * Collect used transit spines per metro-line place (par-metro-6, …)
   * so hover/select never paints the full line during a day route.
   */
  const buildItineraryAreaSlices = (
    segments: ItineraryRouteSegment[],
  ): Map<string, [number, number][][]> => {
    const byLine = new Map<string, [number, number][][]>();
    for (const seg of segments) {
      if (seg.mode !== 'transit' || !seg.lineId) continue;
      if (!seg.latlngs || seg.latlngs.length < 2) continue;
      const list = byLine.get(seg.lineId) ?? [];
      list.push(seg.latlngs);
      byLine.set(seg.lineId, list);
    }

    const out = new Map<string, [number, number][][]>();
    for (const [lineId, paths] of byLine) {
      const placeId = TRANSIT_LINE_PLACE_ID[lineId];
      if (!placeId) continue;
      out.set(placeId, paths);
    }
    return out;
  };

  const setItineraryRoute = (state: ItineraryRouteState | null) => {
    // Tear down previous itinerary without double-apply
    if (itineraryLegLayer) {
      map.removeLayer(itineraryLegLayer);
      itineraryLegLayer = null;
    }
    itineraryLegLines = [];
    itineraryTransferMarkers = [];
    itineraryHighlight = null;
    itineraryHighlightSource = null;
    window.clearTimeout(itineraryMapPointerClearTimer);
    itineraryMapPointerClearTimer = 0;
    clearItinerarySliceLayer();
    markers.forEach((marker) => {
      marker.setZIndexOffset(0);
    });
    // Don't stack planner circle-badges on top of itinerary focus
    clearRoutePreview();
    if (!state || state.stopIds.length === 0) {
      itineraryFocusIds = null;
      itineraryStopNumbers = null;
      itineraryAreaSlices = new Map();
      applyPinFilterState();
      return;
    }

    ensureItineraryPointerTracking();

    const fit = state.fit !== false;
    itineraryFocusIds = new Set(state.stopIds);
    itineraryStopNumbers = new Map(
      state.stopIds.map((id, i) => [id, i + 1] as const),
    );
    itineraryAreaSlices = buildItineraryAreaSlices(state.segments);

    // Ensure focused pins are not category-hidden
    if (visibleIds) {
      const next = new Set(visibleIds);
      for (const id of state.stopIds) next.add(id);
      visibleIds = next;
    }

    applyPinFilterState();

    const group = L.layerGroup();
    const allPts: L.LatLngExpression[] = [];

    /** Default brand blue — only metro/RER segments override with line color */
    const ROUTE_BLUE = '#008fff';

    for (const seg of state.segments) {
      if (!seg.latlngs || seg.latlngs.length < 2) continue;
      const isWalk = seg.mode === 'walk';
      // Line color when this is a real metro/RER spine; else brand blue
      const color =
        !isWalk && seg.color ? seg.color : ROUTE_BLUE;
      const base = legStyle(isWalk ? 'walk' : 'transit', color, 'normal');
      const line = L.polyline(seg.latlngs as L.LatLngExpression[], {
        ...base,
        lineCap: 'round',
        lineJoin: 'round',
        className: isWalk
          ? 'travel-itinerary-leg travel-itinerary-leg--walk is-normal'
          : 'travel-itinerary-leg travel-itinerary-leg--transit is-normal',
        // Hoverable so map line can drive the same highlight as timeline
        interactive: true,
        bubblingMouseEvents: false,
      });
      const onOver = (e: L.LeafletMouseEvent) => {
        if (!seg.fromId || !seg.toId) return;
        const oe = e.originalEvent as MouseEvent | PointerEvent | undefined;
        if (oe && 'clientX' in oe) {
          itineraryPointerClient = { x: oe.clientX, y: oe.clientY };
        }
        window.clearTimeout(itineraryMapPointerClearTimer);
        highlightItineraryLeg(
          seg.fromId,
          seg.toId,
          'map',
          seg.hopIndex,
        );
      };
      const onOut = () => {
        // setStyle can synthesize mouseout while still over the path —
        // scheduleClear verifies with elementFromPoint before clearing.
        scheduleClearMapLegHover();
      };
      line.on('mouseover', onOver);
      line.on('mouseout', onOut);
      group.addLayer(line);

      // Transit: solid base + soft flowing dashes on top (direction cue only)
      let flow: L.Polyline | undefined;
      if (!isWalk) {
        flow = L.polyline(seg.latlngs as L.LatLngExpression[], {
          ...flowStyle(color, 'normal'),
          lineCap: 'round',
          lineJoin: 'round',
          className:
            'travel-itinerary-leg travel-itinerary-leg--flow is-normal',
          interactive: false,
          bubblingMouseEvents: false,
        });
        group.addLayer(flow);
      }

      itineraryLegLines.push({
        fromId: seg.fromId,
        toId: seg.toId,
        hopIndex: seg.hopIndex,
        mode: isWalk ? 'walk' : 'transit',
        color,
        line,
        flow,
      });
      for (const ll of seg.latlngs) allPts.push(ll as L.LatLngExpression);

      // Transit spine: mini dots at each station (path vertices)
      if (!isWalk && seg.latlngs.length >= 2) {
        const n = seg.latlngs.length;
        for (let si = 0; si < n; si++) {
          const ll = seg.latlngs[si]!;
          const isEnd = si === 0 || si === n - 1;
          const sm = L.marker(ll as L.LatLngExpression, {
            icon: stationIcon(color, isEnd),
            interactive: false,
            keyboard: false,
            zIndexOffset: isEnd ? 520 : 500,
          });
          group.addLayer(sm);
        }
      }
    }

    // Multi-line transfer dots (half/half line colors) — sit above station dots
    for (const tr of state.transfers ?? []) {
      if (!Number.isFinite(tr.lat) || !Number.isFinite(tr.lng)) continue;
      const title = [tr.fromLabel, tr.toLabel].filter(Boolean).join(' → ') || 'Transfer';
      const marker = L.marker([tr.lat, tr.lng], {
        icon: transferIcon(tr.fromColor, tr.toColor, title),
        interactive: true,
        keyboard: false,
        zIndexOffset: 550,
      });
      if (tr.fromId && tr.toId) {
        marker.on('mouseover', (e: L.LeafletMouseEvent) => {
          const oe = e.originalEvent as MouseEvent | PointerEvent | undefined;
          if (oe && 'clientX' in oe) {
            itineraryPointerClient = { x: oe.clientX, y: oe.clientY };
          }
          window.clearTimeout(itineraryMapPointerClearTimer);
          highlightItineraryLeg(
            tr.fromId!,
            tr.toId!,
            'map',
            tr.hopIndex,
          );
        });
        marker.on('mouseout', () => {
          scheduleClearMapLegHover();
        });
      }
      group.addLayer(marker);
      itineraryTransferMarkers.push({
        fromId: tr.fromId,
        toId: tr.toId,
        hopIndex: tr.hopIndex,
        marker,
      });
      allPts.push([tr.lat, tr.lng]);
    }

    // Also include stop pins for fit when geometry is sparse
    for (const id of state.stopIds) {
      const pin = pinById.get(id);
      if (pin) allPts.push([pin.lat, pin.lng]);
    }

    group.addTo(map);
    itineraryLegLayer = group;

    // Raise z-order of focused pins
    markers.forEach((marker, id) => {
      if (itineraryFocusIds?.has(id)) {
        marker.setZIndexOffset(600);
      } else {
        marker.setZIndexOffset(0);
      }
    });

    // Apply quiet default styles + flow classes once paths are in the DOM
    requestAnimationFrame(() => {
      applyItineraryLegHighlight();
      syncItineraryBadges();
    });

    if (fit && allPts.length >= 1) {
      fitLatLngsWithChrome(allPts, {
        animate: true,
        maxZoom: 14,
        pad: 0.14,
        duration: 0.45,
      });
    }
  };

  const resolvePreviewStops = (
    state: RoutePreviewState,
  ): RoutePreviewStop[] => {
    if (state.stops?.length) return state.stops;
    if (!state.stopIds?.length) return [];
    return state.stopIds
      .map((id) => {
        const pin = pinById.get(id);
        if (!pin) return null;
        return {
          id,
          lat: pin.lat,
          lng: pin.lng,
          kind: 'place' as const,
        };
      })
      .filter((s): s is RoutePreviewStop => s != null);
  };

  const setRoutePreview = (state: RoutePreviewState | null) => {
    clearRoutePreview();
    if (!state) return;

    // Manual planner takes over — drop day itinerary overlay
    if (itineraryLegLayer || itineraryFocusIds) {
      if (itineraryLegLayer) {
        map.removeLayer(itineraryLegLayer);
        itineraryLegLayer = null;
      }
      clearItinerarySliceLayer();
      itineraryAreaSlices = new Map();
      itineraryFocusIds = null;
      itineraryStopNumbers = null;
      markers.forEach((marker) => {
        marker.setZIndexOffset(0);
      });
      applyPinFilterState();
    }

    const { latlngs, fit = true } = state;
    const stops = resolvePreviewStops(state);

    if (latlngs && latlngs.length >= 2) {
      routeLine = L.polyline(latlngs as L.LatLngExpression[], {
        color: '#008fff',
        weight: 4,
        opacity: 0.88,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'travel-route-preview-line',
        interactive: false,
      }).addTo(map);

      if (fit) {
        map.fitBounds(routeLine.getBounds().pad(0.2), {
          animate: true,
          maxZoom: 15,
        });
      }
    }

    if (stops.length) {
      stops.forEach((stop, index) => {
        const n = index + 1;
        const isUser = stop.kind === 'user';
        const icon = L.divIcon({
          className: isUser
            ? 'travel-route-stop-badge travel-route-stop-badge--user'
            : 'travel-route-stop-badge',
          html: isUser
            ? `<span class="travel-route-stop-badge__n" aria-hidden="true"><span class="material-symbols-rounded">my_location</span></span>`
            : `<span class="travel-route-stop-badge__n">${n}</span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        const m = L.marker([stop.lat, stop.lng], {
          icon,
          interactive: false,
          keyboard: false,
          zIndexOffset: 800 + index,
        });
        m.addTo(map);
        routeStopMarkers.push(m);
      });

      // If no geometry yet (transit / loading), fit to stop coords
      if ((!latlngs || latlngs.length < 2) && fit && stops.length >= 2) {
        const pts = stops.map((s) => [s.lat, s.lng] as L.LatLngTuple);
        map.fitBounds(L.latLngBounds(pts).pad(0.22), {
          animate: true,
          maxZoom: 15,
        });
      }
    }
  };

  const clearUserLocationLayers = () => {
    if (userMarker) {
      map.removeLayer(userMarker);
      userMarker = null;
    }
    if (userAccuracyCircle) {
      map.removeLayer(userAccuracyCircle);
      userAccuracyCircle = null;
    }
  };

  const setUserLocation = (loc: UserLocationState | null) => {
    userLocation = loc;
    clearUserLocationLayers();
    if (!loc) return;

    if (
      loc.accuracyM != null &&
      loc.accuracyM > 0 &&
      loc.accuracyM < 2000
    ) {
      userAccuracyCircle = L.circle([loc.lat, loc.lng], {
        radius: loc.accuracyM,
        color: '#008fff',
        weight: 1,
        opacity: 0.35,
        fillColor: '#008fff',
        fillOpacity: 0.08,
        interactive: false,
        className: 'travel-user-accuracy',
      }).addTo(map);
    }

    const icon = L.divIcon({
      className: 'travel-user-loc',
      html: `
        <span class="travel-user-loc__pulse" aria-hidden="true"></span>
        <span class="travel-user-loc__dot" aria-hidden="true"></span>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    userMarker = L.marker([loc.lat, loc.lng], {
      icon,
      interactive: false,
      keyboard: false,
      zIndexOffset: 900,
    }).addTo(map);
  };

  const getUserLocation = () => userLocation;

  const flyToUserLocation = (maxZoom = 15) => {
    if (!userLocation) return;
    const z = map.getZoom();
    const targetZoom = z < 13 ? Math.min(15, maxZoom) : Math.min(z, maxZoom);
    map.flyTo([userLocation.lat, userLocation.lng], targetZoom, {
      animate: true,
      duration: 0.85,
    });
  };

  const getPin = (id: string) => pinById.get(id);

  const onHighlight = (e: Event) => {
    const detail = (e as CustomEvent<{ id: string | null }>).detail;
    highlight(detail?.id ?? null);
  };
  container.addEventListener('travel:highlight', onHighlight);

  /** Leaving the map canvas must always drop map-driven route hover */
  const onMapPointerLeave = () => {
    window.clearTimeout(itineraryMapPointerClearTimer);
    if (itineraryHighlightSource === 'map') {
      highlightItineraryLeg(null);
    }
  };
  container.addEventListener('pointerleave', onMapPointerLeave);

  const onResize = () => map.invalidateSize();
  window.addEventListener('resize', onResize);

  const destroy = () => {
    try {
      unbindBasemapTints?.();
      unbindBasemapTints = null;
      clearItineraryRoute();
      clearRoutePreview();
      clearUserLocationLayers();
      userLocation = null;
      pinMotion.destroy();
      detachTrackpad();
      detachFullscreen();
      detachLocate();
      map.off('zoom zoomend', onZoomPinMode);
      container.classList.remove(
        'travel-map--zoom-far',
        'travel-map--zoom-mid',
        'travel-map--zoom-near',
      );
      container.removeEventListener('travel:highlight', onHighlight);
      container.removeEventListener('pointerleave', onMapPointerLeave);
      window.removeEventListener('resize', onResize);
      areaHideTimers.forEach((t) => window.clearTimeout(t));
      areaHideTimers.clear();
      map.remove();
      glMap = null;
      glLayer = null;
    } catch (err) {
      console.warn('[travel-map] destroy failed, force-cleaning container', err);
      forceCleanMapContainer(container);
    }
  };

  return {
    destroy,
    highlight,
    flyTo,
    setVisibleIds,
    setFilterPreview,
    select,
    setRoutePreview,
    setItineraryRoute,
    highlightItineraryLeg,
    highlightItineraryPlace,
    getPin,
    setChromePadding,
    syncUiChrome,
    ensureVisible,
    setUserLocation,
    getUserLocation,
    flyToUserLocation,
    setBasemapTheme,
  };
}

/**
 * Locate control (bottomright stack): request browser geolocation.
 * Dispatches `travel:locate` on the map container so route UI can set origin.
 */
function attachLocateControl(map: L.Map, mapContainer: HTMLElement): () => void {
  const label =
    mapContainer.getAttribute('data-locate-label') || 'Show my location';

  let btn: HTMLAnchorElement | null = null;
  let bar: HTMLElement | null = null;

  const setBusy = (busy: boolean) => {
    if (!btn || !bar) return;
    bar.classList.toggle('is-locating', busy);
    btn.setAttribute('aria-busy', busy ? 'true' : 'false');
    if (busy) btn.classList.add('is-locating');
    else btn.classList.remove('is-locating');
  };

  const control = new (L.Control.extend({
    options: { position: 'bottomright' as L.ControlPosition },
    onAdd() {
      bar = L.DomUtil.create(
        'div',
        'leaflet-bar leaflet-control travel-map-locate-control',
      );
      btn = L.DomUtil.create(
        'a',
        'travel-map-locate-btn',
        bar,
      ) as HTMLAnchorElement;
      btn.href = '#';
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-label', label);
      btn.title = label;
      btn.innerHTML =
        '<span class="material-symbols-rounded travel-map-locate-icon" aria-hidden="true">my_location</span>';

      const onClick = (e: Event) => {
        L.DomEvent.preventDefault(e);
        L.DomEvent.stopPropagation(e);
        if (btn?.classList.contains('is-locating')) return;
        setBusy(true);
        mapContainer.dispatchEvent(
          new CustomEvent('travel:locate', {
            bubbles: true,
            detail: { source: 'control' },
          }),
        );
      };

      L.DomEvent.disableClickPropagation(bar);
      L.DomEvent.on(btn, 'click', onClick);
      return bar;
    },
  }))();

  control.addTo(map);

  const onDone = () => setBusy(false);
  mapContainer.addEventListener('travel:locate-done', onDone);

  return () => {
    mapContainer.removeEventListener('travel:locate-done', onDone);
    map.removeControl(control);
    btn = null;
    bar = null;
  };
}

/**
 * Fullscreen control stacked above zoom (bottomright).
 * Prefer map shell (includes place panel) → hero → map container.
 */
function attachFullscreenControl(map: L.Map, mapContainer: HTMLElement): () => void {
  const shell =
    mapContainer.closest<HTMLElement>('.travel__map-shell') ??
    mapContainer.closest<HTMLElement>('.travel__map-hero') ??
    mapContainer;

  const labelEnter =
    mapContainer.getAttribute('data-fullscreen-enter') || 'View map fullscreen';
  const labelExit =
    mapContainer.getAttribute('data-fullscreen-exit') || 'Exit fullscreen';

  let btn: HTMLAnchorElement | null = null;
  let bar: HTMLElement | null = null;

  const sync = () => {
    if (!btn || !bar) return;
    const on = Boolean(document.fullscreenElement);
    const icon = btn.querySelector('.material-symbols-rounded');
    if (icon) {
      icon.textContent = on ? 'fullscreen_exit' : 'fullscreen';
    }
    const label = on ? labelExit : labelEnter;
    btn.setAttribute('aria-label', label);
    btn.title = label;
    bar.classList.toggle('is-fullscreen', on);
  };

  const onFsChange = () => {
    map.invalidateSize();
    sync();
  };

  const control = new (L.Control.extend({
    options: { position: 'bottomright' as L.ControlPosition },
    onAdd() {
      bar = L.DomUtil.create(
        'div',
        'leaflet-bar leaflet-control travel-map-fs-control',
      );
      btn = L.DomUtil.create(
        'a',
        'travel-map-fs-btn',
        bar,
      ) as HTMLAnchorElement;
      btn.href = '#';
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-label', labelEnter);
      btn.title = labelEnter;
      btn.innerHTML =
        '<span class="material-symbols-rounded travel-map-fs-icon" aria-hidden="true">fullscreen</span>';

      const toggle = (e: Event) => {
        L.DomEvent.preventDefault(e);
        L.DomEvent.stopPropagation(e);
        if (!document.fullscreenElement) {
          void shell.requestFullscreen?.();
        } else {
          void document.exitFullscreen?.();
        }
      };

      L.DomEvent.disableClickPropagation(bar);
      L.DomEvent.on(btn, 'click', toggle);
      document.addEventListener('fullscreenchange', onFsChange);
      sync();
      return bar;
    },
  }))();

  control.addTo(map);

  return () => {
    document.removeEventListener('fullscreenchange', onFsChange);
    map.removeControl(control);
    btn = null;
    bar = null;
  };
}

let activeHandle: TravelMapHandle | null = null;
/** Coalesce index + city page listeners + immediate boot() into one remount. */
let bootTimer = 0;
let bootGeneration = 0;
let cancelPostReveal: (() => void) | null = null;

function readMapPins(el: HTMLElement): MapPin[] {
  // Prefer JSON script (avoids huge HTML attribute + entity encoding)
  const jsonHost = document.querySelector<HTMLElement>('[data-travel-map-pins]');
  const rawJson = jsonHost?.textContent?.trim();
  if (rawJson) {
    try {
      return JSON.parse(rawJson) as MapPin[];
    } catch (err) {
      console.error('[travel-map] failed to parse [data-travel-map-pins]', err);
    }
  }
  try {
    return JSON.parse(el.dataset.pins || '[]') as MapPin[];
  } catch (err) {
    console.error('[travel-map] failed to parse data-pins', err);
    return [];
  }
}

function bootTravelMapNow(): void {
  cancelPostReveal?.();
  cancelPostReveal = null;

  try {
    activeHandle?.destroy();
  } catch (err) {
    console.warn('[travel-map] previous destroy failed', err);
  }
  activeHandle = null;
  (window as unknown as { __travelMap?: TravelMapHandle | null }).__travelMap =
    null;

  const el = document.querySelector<HTMLElement>('[data-travel-map]');
  if (!el) return;

  const pins = readMapPins(el);
  const mode = (el.dataset.mode as MapMode) || 'cities';
  const centerLat = el.dataset.centerLat
    ? Number(el.dataset.centerLat)
    : undefined;
  const centerLng = el.dataset.centerLng
    ? Number(el.dataset.centerLng)
    : undefined;
  const zoom = el.dataset.zoom ? Number(el.dataset.zoom) : undefined;

  try {
    activeHandle = createTravelMap({
      container: el,
      pins,
      mode,
      center:
        centerLat != null &&
        centerLng != null &&
        Number.isFinite(centerLat) &&
        Number.isFinite(centerLng)
          ? [centerLat, centerLng]
          : undefined,
      zoom: zoom != null && Number.isFinite(zoom) ? zoom : undefined,
      ariaLabel: el.getAttribute('aria-label') ?? undefined,
    });
  } catch (err) {
    console.error('[travel-map] createTravelMap threw', err);
    forceCleanMapContainer(el);
    activeHandle = null;
  }

  (window as unknown as { __travelMap?: TravelMapHandle | null }).__travelMap =
    activeHandle;

  // Filter may have bound before this remount — re-apply pin visibility
  document.dispatchEvent(new CustomEvent('travel:map-ready'));

  // Layout often settles only after page-mask reveal / desktop flex height
  void import('./page-reveal').then(({ whenPageVisible }) => {
    cancelPostReveal = whenPageVisible(() => {
      window.dispatchEvent(new Event('resize'));
      // Second pass: re-measure sidebar chrome + center free region
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
        activeHandle?.syncUiChrome({ refit: true, animate: false });
      });
    });
  });
}

export function bootTravelMap(): void {
  if (bootTimer) window.clearTimeout(bootTimer);
  const gen = ++bootGeneration;
  // 32ms absorbs double fire from index + city scripts / immediate + page-load
  bootTimer = window.setTimeout(() => {
    bootTimer = 0;
    if (gen !== bootGeneration) return;
    bootTravelMapNow();
  }, 32);

  // Theme toggle → basemap (bound once; handle may remount)
  if (!(window as unknown as { __travelThemeMapBound?: boolean }).__travelThemeMapBound) {
    (window as unknown as { __travelThemeMapBound?: boolean }).__travelThemeMapBound =
      true;
    window.addEventListener('travel:theme', ((e: CustomEvent<{ theme: TravelMapBasemapTheme }>) => {
      const theme = e.detail?.theme;
      if (theme === 'light' || theme === 'dark') {
        activeHandle?.setBasemapTheme(theme);
      }
    }) as EventListener);
  }
}

export function getTravelMapHandle(): TravelMapHandle | null {
  return (
    (window as unknown as { __travelMap?: TravelMapHandle | null }).__travelMap ??
    null
  );
}

// Tear down before ClientRouter swaps the DOM so we never keep a handle to a
// detached map (destroy-after-detach + remount race → empty shell).
if (typeof document !== 'undefined') {
  document.addEventListener('astro:before-preparation', () => {
    try {
      activeHandle?.destroy();
    } catch {
      /* ignore */
    }
    activeHandle = null;
    (window as unknown as { __travelMap?: TravelMapHandle | null }).__travelMap =
      null;
  });
}
