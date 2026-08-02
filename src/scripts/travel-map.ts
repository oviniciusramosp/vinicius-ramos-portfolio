/**
 * Leaflet maps for /travel index (world + city pins) and city pages (places).
 * Place pins: category color + optional glyph (airport plane, camera, …).
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  categoryColor,
  categoryIconHtml,
  materialIconHtml,
} from '../data/travel-categories';

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

export type RoutePreviewState = {
  /** Walking geometry in Leaflet [lat, lng] order; null clears the line */
  latlngs: [number, number][] | null;
  /** Place ids in route order (numbered badges on pins) */
  stopIds?: string[];
  /** Fit camera to the route (default true when latlngs present) */
  fit?: boolean;
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
  setVisibleIds: (ids: Set<string> | null) => void;
  /** Temporary opacity preview (chip hover) — does not change base filter */
  setFilterPreview: (preview: FilterPreviewState) => void;
  /** Places mode: open side panel for place id (or clear) */
  select: (id: string | null) => void;
  /** Draw / clear multi-stop route preview polyline + stop numbers */
  setRoutePreview: (state: RoutePreviewState | null) => void;
  /** Resolve pin by id (for route UI without re-parsing dataset) */
  getPin: (id: string) => MapPin | undefined;
  /**
   * Obstruction padding (e.g. form-sheet covering the bottom of the map).
   * Used by select / ensureVisible so the pin sits in free space.
   */
  setChromePadding: (padding: MapChromePadding | null) => void;
  /** Pan/zoom so pin is centered in the unobstructed map region */
  ensureVisible: (id: string, animate?: boolean) => void;
};

const TILE_URL =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Carto Dark Matter paints oceans / seas / rivers as solid pure-gray #262626.
 * Land base is #090909; parks/roads use other grays — so #262626 is a reliable
 * water key for a cheap canvas recolor (raster tiles can't style layers).
 */
const CARTO_WATER = 38; // #262626 channel value

/**
 * Brand accent (#008fff) at ~28% over land (#090909) → dark blue that still
 * reads as our blue at low opacity, without competing with pins.
 * #062f4e
 */
const WATER_TINT_R = 6;
const WATER_TINT_G = 47;
const WATER_TINT_B = 78;

/**
 * Tile layer that recolors Carto water pixels after load.
 * CORS on basemaps.cartocdn.com allows getImageData.
 */
const WaterTintTileLayer = L.TileLayer.extend({
  createTile(coords: L.Coords, done: L.DoneCallback) {
    const layer = this as L.TileLayer;
    const size = layer.getTileSize();
    const canvas = document.createElement('canvas');
    canvas.width = size.x;
    canvas.height = size.y;
    canvas.className = 'leaflet-tile';

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        done(new Error('2d context unavailable'), canvas);
        return;
      }
      ctx.drawImage(img, 0, 0, size.x, size.y);
      const imageData = ctx.getImageData(0, 0, size.x, size.y);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        if (
          data[i] === CARTO_WATER &&
          data[i + 1] === CARTO_WATER &&
          data[i + 2] === CARTO_WATER
        ) {
          data[i] = WATER_TINT_R;
          data[i + 1] = WATER_TINT_G;
          data[i + 2] = WATER_TINT_B;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      done(null, canvas);
    };
    img.onerror = () => {
      done(new Error('tile load failed'), canvas);
    };
    img.src = layer.getTileUrl(coords);
    return canvas;
  },
});

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
  const size = visual.featured ? 48 : 44;
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
 * Magnetic follow for Leaflet pins (same spring idea as portfolio buttons).
 *
 * Why custom (not bindMagnetic on the icon):
 * - Map drag steals pointermoves from the marker
 * - Tooltips / panes can cancel hover
 * - Window-level pointermove while "latched" to a pin is reliable
 *
 * Shell stays fixed (Leaflet positions it); visual gets translate3d spring.
 */
function attachPinMagnetic(
  map: L.Map,
  shell: HTMLElement,
  visual: HTMLElement,
  range = 16,
) {
  if (shell.dataset.pinMagnetic === '1') return;
  shell.dataset.pinMagnetic = '1';

  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !window.matchMedia('(pointer: fine)').matches
  ) {
    return;
  }

  const STIFF = 300;
  const DAMP = 30;

  let hovering = false;
  let raf = 0;
  let last = performance.now();
  let cx = 0;
  let cy = 0;
  let tx = 0;
  let ty = 0;
  let vx = 0;
  let vy = 0;

  const spring = (cur: number, target: number, vel: number, dt: number) => {
    const a = -STIFF * (cur - target) - DAMP * vel;
    const v = vel + a * dt;
    return { value: cur + v * dt, velocity: v };
  };

  const apply = () => {
    visual.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
  };

  const tick = (now: number) => {
    const dt = Math.min(0.032, (now - last) / 1000 || 1 / 60);
    last = now;

    const sx = spring(cx, tx, vx, dt);
    const sy = spring(cy, ty, vy, dt);
    cx = sx.value;
    vx = sx.velocity;
    cy = sy.value;
    vy = sy.velocity;
    apply();

    const settled =
      !hovering &&
      Math.abs(cx) < 0.05 &&
      Math.abs(cy) < 0.05 &&
      Math.abs(vx) < 0.05 &&
      Math.abs(vy) < 0.05;

    if (settled) {
      cx = cy = vx = vy = 0;
      visual.style.transform = '';
      raf = 0;
      return;
    }

    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  const aimFromEvent = (clientX: number, clientY: number) => {
    const rect = shell.getBoundingClientRect();
    const halfW = Math.max(rect.width / 2, 1);
    const halfH = Math.max(rect.height / 2, 1);
    const ox = clientX - rect.left - halfW;
    const oy = clientY - rect.top - halfH;
    // Same Framer formula as magnetic.ts
    tx = Math.max(-1, Math.min(1, ox / halfW)) * range;
    ty = Math.max(-1, Math.min(1, oy / halfH)) * range;
  };

  const onWinMove = (e: PointerEvent) => {
    if (!hovering || e.pointerType === 'touch') return;
    aimFromEvent(e.clientX, e.clientY);
    start();
  };

  const onEnter = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    hovering = true;
    shell.classList.add('is-magnetic');
    // Stop the map from eating the gesture
    map.dragging.disable();
    aimFromEvent(e.clientX, e.clientY);
    window.addEventListener('pointermove', onWinMove, { passive: true });
    start();
  };

  const onLeave = () => {
    if (!hovering) return;
    hovering = false;
    shell.classList.remove('is-magnetic');
    map.dragging.enable();
    tx = 0;
    ty = 0;
    window.removeEventListener('pointermove', onWinMove);
    start();
  };

  shell.addEventListener('pointerenter', onEnter);
  shell.addEventListener('pointerleave', onLeave);

  // Block map drag start from this hit target
  L.DomEvent.disableClickPropagation(shell);
  L.DomEvent.disableScrollPropagation(shell);
  L.DomEvent.on(shell, 'mousedown', L.DomEvent.stopPropagation);
  L.DomEvent.on(shell, 'pointerdown', L.DomEvent.stopPropagation);
  L.DomEvent.on(shell, 'dblclick', L.DomEvent.stopPropagation);
  L.DomEvent.on(shell, 'touchstart', L.DomEvent.stopPropagation);
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

export function createTravelMap(options: TravelMapOptions): TravelMapHandle | null {
  const { container, pins, mode, center, zoom = 3, ariaLabel } = options;
  if (!container || (pins.length === 0 && !center)) return null;

  if ((container as HTMLElement & { _leaflet_id?: number })._leaflet_id) {
    return null;
  }

  if (ariaLabel) container.setAttribute('aria-label', ariaLabel);
  container.setAttribute('role', 'region');

  // Gesture-friendly: drag, touch pinch, trackpad pan+pinch (custom wheel)
  const map = L.map(container, {
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
  });

  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const detachFullscreen = attachFullscreenControl(map, container);

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

  new WaterTintTileLayer(TILE_URL, {
    attribution: TILE_ATTR,
    subdomains: 'abcd',
    maxZoom: 19,
    // Scale existing tiles during zoom; swap tile set on settle (no mid-gesture flash)
    updateWhenZooming: false,
    keepBuffer: 4,
  }).addTo(map);

  const markers = new Map<string, L.Marker>();
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

  /** Polygon: fill only, no stroke. Start invisible for CSS/style fade-in. */
  const areaStyleHidden = (category: string | undefined) => {
    const color = categoryColor(category);
    return {
      stroke: false,
      color,
      weight: 0,
      opacity: 0,
      fillColor: color,
      fillOpacity: 0,
      className: 'travel-area travel-area--poly',
      interactive: false,
      bubblingMouseEvents: false,
    } as L.PathOptions;
  };

  const areaStyleVisible = (category: string | undefined) => {
    const color = categoryColor(category);
    return {
      stroke: false,
      color,
      weight: 0,
      opacity: 0,
      fillColor: color,
      fillOpacity: 0.32,
      className: 'travel-area travel-area--poly is-visible',
      interactive: false,
      bubblingMouseEvents: false,
    } as L.PathOptions;
  };

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

  const clearRouteStops = () => {
    if (routeStopLayer) {
      map.removeLayer(routeStopLayer);
      routeStopLayer = null;
    }
  };

  const showRouteStops = (pin: MapPin) => {
    clearRouteStops();
    const stops = pin.routeStops;
    if (!stops?.length) return;

    const color = categoryColor(pin.category);
    const group = L.layerGroup();
    const isPt = locale === 'pt-BR';

    for (const stop of stops) {
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
    const style = visible
      ? isLine
        ? lineStyleVisible(pin?.category)
        : areaStyleVisible(pin?.category)
      : isLine
        ? lineStyleHidden(pin?.category)
        : areaStyleHidden(pin?.category);

    if (layer instanceof L.LayerGroup) {
      layer.eachLayer((child) => {
        if (child instanceof L.Path) child.setStyle(style);
      });
    } else {
      layer.setStyle(style);
    }
  };

  const setAreaActive = (id: string | null) => {
    clearRouteStops();

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
        layer = L.polygon(
          pin.area.path as L.LatLngExpression[],
          areaStyleHidden(pin.category),
        );
      } else if (pin.area.kind === 'multipolygon' && pin.area.paths.length > 0) {
        const group = L.layerGroup();
        for (const ring of pin.area.paths) {
          if (ring.length < 3) continue;
          group.addLayer(
            L.polygon(
              ring as L.LatLngExpression[],
              areaStyleHidden(pin.category),
            ),
          );
        }
        layer = group;
      }

      if (layer) {
        areas.set(pin.id, layer);
        // Bounds from paths
        if (pin.area.kind === 'multipolygon') {
          for (const ring of pin.area.paths) {
            for (const pt of ring) {
              latLngs.push(pt as L.LatLngTuple);
              if (!excludeFromFit) boundsLatLngs.push(pt as L.LatLngTuple);
            }
          }
        } else {
          const b =
            layer instanceof L.LayerGroup
              ? null
              : (layer as L.Polygon | L.Polyline).getBounds();
          if (b) {
            latLngs.push(b.getSouthWest(), b.getNorthEast());
            if (!excludeFromFit) {
              boundsLatLngs.push(b.getSouthWest(), b.getNorthEast());
            }
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

    if (pin.href) {
      // City pins on /travel index → navigate to city page
      marker.on('click', () => {
        window.location.href = pin.href!;
      });
      marker.on('keypress', (e: L.LeafletKeyboardEvent) => {
        if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
          window.location.href = pin.href!;
        }
      });
    } else if (mode === 'places') {
      // City map: open side panel (handled by travel-panel via travel:select)
      const openPanel = () => {
        select(pin.id);
      };
      marker.on('click', openPanel);
      marker.on('keypress', (e: L.LeafletKeyboardEvent) => {
        if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
          L.DomEvent.preventDefault(e);
          openPanel();
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

    // Magnetic follow only (no soft site cursor on map pins)
    const hit = marker.getElement();
    const visual = hit?.querySelector<HTMLElement>('[data-magnetic-visual]');
    if (hit && visual) {
      hit.classList.add('travel-pin-hit');
      attachPinMagnetic(map, hit, visual, 14);
    }

    markers.set(pin.id, marker);
    latLngs.push([pin.lat, pin.lng]);
    if (!excludeFromFit) {
      boundsLatLngs.push([pin.lat, pin.lng]);
    }
  }

  const fitSource =
    mode === 'places' && boundsLatLngs.length > 0 ? boundsLatLngs : latLngs;

  if (mode === 'cities' && latLngs.length > 0) {
    const bounds = L.latLngBounds(latLngs as L.LatLngTuple[]);
    map.fitBounds(bounds.pad(0.35), { animate: false, maxZoom: 5 });
  } else if (mode === 'places' && fitSource.length > 0) {
    // City zoom: ignore airports so ORY/CDG don't pull the viewport out
    const bounds = L.latLngBounds(fitSource as L.LatLngTuple[]);
    map.fitBounds(bounds.pad(0.18), {
      animate: false,
      maxZoom: zoom ?? 13,
    });
  } else if (center) {
    map.setView(center, zoom, { animate: false });
  } else if (latLngs.length > 0) {
    map.setView(latLngs[0] as L.LatLngTuple, zoom, { animate: false });
  }

  requestAnimationFrame(() => {
    map.invalidateSize();
    applyZoomPinMode(map, container);
  });

  let activeId: string | null = null;
  /** Pin kept active while side panel is open */
  let selectedId: string | null = null;
  let visibleIds: Set<string> | null = null;
  let filterPreview: FilterPreviewState = null;

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
        mode === 'solid' ? '1' : mode === 'dim' ? '0.38' : '0.16';
      el.classList.toggle('is-filter-preview-dim', mode === 'dim');
      el.classList.toggle('is-filter-preview-fade', mode === 'fade');
      // Never set `transition` inline — it overrides Leaflet's zoom-anim
      // transform transition and makes pins jump after the map finishes zooming.
    }
  };

  /** Apply base filter + optional chip-hover preview (no camera fit). */
  const applyPinFilterState = () => {
    markers.forEach((marker, id) => {
      const baseShow = !visibleIds || visibleIds.has(id);
      let mode: 'solid' | 'dim' | 'fade' | 'hide';

      if (!filterPreview) {
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
  };

  const highlight = (id: string | null) => {
    if (id && visibleIds && !visibleIds.has(id)) {
      id = null;
    }
    activeId = id;
    setPinActive(id ?? selectedId);
    setAreaActive(id ?? selectedId);
  };

  /** Pixels covered by UI chrome (form sheet, etc.) on each edge of the map */
  let chromePad: Required<MapChromePadding> = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };

  const setChromePadding = (padding: MapChromePadding | null) => {
    chromePad = {
      top: padding?.top ?? 0,
      right: padding?.right ?? 0,
      bottom: padding?.bottom ?? 0,
      left: padding?.left ?? 0,
    };
  };

  /**
   * Geographic center such that `latlng` sits in the free rectangle
   * (map size minus chrome padding — e.g. form sheet on the bottom).
   */
  const chromeAwareCenter = (
    latlng: L.LatLngExpression,
    z: number,
  ): L.LatLng => {
    const { top, right, bottom, left } = chromePad;
    const size = map.getSize();
    // Sheet covering nearly everything → no useful free region; center normally
    if (bottom + top >= size.y - 48) {
      return L.latLng(latlng);
    }
    // Free-region center in container pixels
    const freeCenter = L.point(
      (size.x + left - right) / 2,
      (size.y + top - bottom) / 2,
    );
    const mapCenterPx = size.divideBy(2);
    // Projected offset so pin lands on freeCenter after setView/flyTo
    const offset = mapCenterPx.subtract(freeCenter);
    const pin = L.latLng(latlng);
    return map.unproject(map.project(pin, z).add(offset), z);
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
      const fitOpts = {
        maxZoom: z,
        paddingTopLeft: [chromePad.left + 24, chromePad.top + 24] as L.PointExpression,
        paddingBottomRight: [
          chromePad.right + 24,
          chromePad.bottom + 24,
        ] as L.PointExpression,
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

  const setVisibleIds = (ids: Set<string> | null) => {
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
    }

    applyPinFilterState();

    const visibleLatLngs: L.LatLngExpression[] = [];
    markers.forEach((_marker, id) => {
      const show = !visibleIds || visibleIds.has(id);
      if (!show) return;
      const pin = pinById.get(id);
      if (!pin || pin.category === 'airport') return;
      const areaLayer = areas.get(id);
      if (areaLayer && id === activeId) {
        const b = areaLayer.getBounds();
        visibleLatLngs.push(b.getSouthWest(), b.getNorthEast());
      }
      visibleLatLngs.push([pin.lat, pin.lng]);
    });

    if (visibleLatLngs.length > 1) {
      const bounds = L.latLngBounds(visibleLatLngs as L.LatLngTuple[]);
      map.fitBounds(bounds.pad(0.22), {
        animate: true,
        maxZoom: mode === 'places' ? (zoom ?? 14) : 5,
      });
    } else if (visibleLatLngs.length === 1) {
      map.flyTo(
        visibleLatLngs[0] as L.LatLngTuple,
        mode === 'places' ? Math.max(zoom ?? 13, 13) : map.getZoom(),
        { duration: 0.4 },
      );
    }
  };

  const setFilterPreview = (preview: FilterPreviewState) => {
    filterPreview = preview;
    applyPinFilterState();
  };

  /** Multi-stop walking preview (OSRM geometry) + optional stop index badges */
  let routeLine: L.Polyline | null = null;
  let routeStopMarkers: L.Marker[] = [];

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

  const setRoutePreview = (state: RoutePreviewState | null) => {
    clearRoutePreview();
    if (!state) return;

    const { latlngs, stopIds, fit = true } = state;

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

    if (stopIds?.length) {
      stopIds.forEach((id, index) => {
        const pin = pinById.get(id);
        if (!pin) return;
        const n = index + 1;
        const icon = L.divIcon({
          className: 'travel-route-stop-badge',
          html: `<span class="travel-route-stop-badge__n">${n}</span>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        const m = L.marker([pin.lat, pin.lng], {
          icon,
          interactive: false,
          keyboard: false,
          zIndexOffset: 800 + index,
        });
        m.addTo(map);
        routeStopMarkers.push(m);
      });

      // If no geometry yet (transit / loading), fit to stop pins
      if ((!latlngs || latlngs.length < 2) && fit && stopIds.length >= 2) {
        const pts = stopIds
          .map((id) => pinById.get(id))
          .filter(Boolean)
          .map((p) => [p!.lat, p!.lng] as L.LatLngTuple);
        if (pts.length >= 2) {
          map.fitBounds(L.latLngBounds(pts).pad(0.22), {
            animate: true,
            maxZoom: 15,
          });
        }
      }
    }
  };

  const getPin = (id: string) => pinById.get(id);

  const onHighlight = (e: Event) => {
    const detail = (e as CustomEvent<{ id: string | null }>).detail;
    highlight(detail?.id ?? null);
  };
  container.addEventListener('travel:highlight', onHighlight);

  const onResize = () => map.invalidateSize();
  window.addEventListener('resize', onResize);

  const destroy = () => {
    clearRoutePreview();
    detachTrackpad();
    detachFullscreen();
    map.off('zoom zoomend', onZoomPinMode);
    container.classList.remove(
      'travel-map--zoom-far',
      'travel-map--zoom-mid',
      'travel-map--zoom-near',
    );
    container.removeEventListener('travel:highlight', onHighlight);
    window.removeEventListener('resize', onResize);
    areaHideTimers.forEach((t) => window.clearTimeout(t));
    areaHideTimers.clear();
    map.remove();
  };

  return {
    destroy,
    highlight,
    flyTo,
    setVisibleIds,
    setFilterPreview,
    select,
    setRoutePreview,
    getPin,
    setChromePadding,
    ensureVisible,
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

export function bootTravelMap(): void {
  activeHandle?.destroy();
  activeHandle = null;

  const el = document.querySelector<HTMLElement>('[data-travel-map]');
  if (!el) return;

  let pins: MapPin[] = [];
  try {
    pins = JSON.parse(el.dataset.pins || '[]') as MapPin[];
  } catch {
    pins = [];
  }

  const mode = (el.dataset.mode as MapMode) || 'cities';
  const centerLat = el.dataset.centerLat
    ? Number(el.dataset.centerLat)
    : undefined;
  const centerLng = el.dataset.centerLng
    ? Number(el.dataset.centerLng)
    : undefined;
  const zoom = el.dataset.zoom ? Number(el.dataset.zoom) : undefined;

  activeHandle = createTravelMap({
    container: el,
    pins,
    mode,
    center:
      centerLat != null && centerLng != null
        ? [centerLat, centerLng]
        : undefined,
    zoom,
    ariaLabel: el.getAttribute('aria-label') ?? undefined,
  });

  (window as unknown as { __travelMap?: TravelMapHandle | null }).__travelMap =
    activeHandle;
}

export function getTravelMapHandle(): TravelMapHandle | null {
  return (
    (window as unknown as { __travelMap?: TravelMapHandle | null }).__travelMap ??
    null
  );
}
