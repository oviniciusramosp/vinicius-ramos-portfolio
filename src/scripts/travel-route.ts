/**
 * Route preview between travel places.
 * - Walking: FOSSGIS OSRM foot graph (paths, parks, sidewalks) → polyline + duration
 * - Transit: no free global engine; Google Maps deep link is the accurate path
 *
 * Note: router.project-osrm.org exposes a /foot/ URL but its public extract is
 * car-based (same geometry/times as driving, ~car speeds). Do not use it for walk.
 */

export type RouteMode = 'walk' | 'transit';

/** Reserved stop id for browser geolocation origin (not a curated place). */
export const USER_LOCATION_ID = 'user-location';

export type RoutePoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  labelPt?: string;
};

export type UserPosition = {
  lat: number;
  lng: number;
  /** Horizontal accuracy in meters when the browser provides it */
  accuracyM?: number;
};

/**
 * Browser geolocation (HTTPS / localhost). Rejects with a short code for UI copy.
 * - unsupported | denied | unavailable | timeout
 */
export function getCurrentPosition(
  options?: PositionOptions,
): Promise<UserPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('unsupported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM:
            Number.isFinite(pos.coords.accuracy) && pos.coords.accuracy > 0
              ? pos.coords.accuracy
              : undefined,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) reject(new Error('denied'));
        else if (err.code === err.TIMEOUT) reject(new Error('timeout'));
        else reject(new Error('unavailable'));
      },
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 30_000,
        ...options,
      },
    );
  });
}

export function isUserLocationStop(point: Pick<RoutePoint, 'id'>): boolean {
  return point.id === USER_LOCATION_ID;
}

/** Great-circle distance in km (WGS84 sphere). */
export function haversineKm(
  a: Pick<UserPosition, 'lat' | 'lng'>,
  b: Pick<UserPosition, 'lat' | 'lng'>,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Beyond this distance from the city center, walking preview is rarely useful
 * and we surface a soft warning.
 */
export const CITY_FAR_KM = 80;

export function isFarFromCity(
  user: Pick<UserPosition, 'lat' | 'lng'>,
  city: Pick<UserPosition, 'lat' | 'lng'>,
  thresholdKm = CITY_FAR_KM,
): boolean {
  return haversineKm(user, city) > thresholdKm;
}

/** Build (or refresh) the route origin from a GPS fix. */
export function userLocationPoint(
  pos: UserPosition,
  labels: { en: string; pt: string } = {
    en: 'My location',
    pt: 'Minha localização',
  },
): RoutePoint {
  return {
    id: USER_LOCATION_ID,
    lat: pos.lat,
    lng: pos.lng,
    label: labels.en,
    labelPt: labels.pt,
  };
}

export type WalkingRoute = {
  /** Leaflet order [lat, lng] */
  latlngs: [number, number][];
  durationSec: number;
  distanceM: number;
};

/**
 * FOSSGIS public OSRM — dedicated foot extract (footways, park paths, etc.).
 * Free, CORS-open, fair-use; no API key.
 * @see https://routing.openstreetmap.de/
 */
const OSRM_FOOT =
  'https://routing.openstreetmap.de/routed-foot/route/v1/foot';

/** Round coords so nearby re-clicks share a cache entry (~1.1 m at equator). */
const CACHE_DECIMALS = 5;

/**
 * Session cache for OSRM foot routes. Day itineraries re-fetch the same
 * short walks on every “show on map” click — cache makes the 2nd+ paint free.
 */
const walkRouteCache = new Map<string, WalkingRoute>();
/** In-flight de-dupe so parallel legs with the same endpoints share one request. */
const walkRouteInflight = new Map<string, Promise<WalkingRoute | null>>();

function walkCacheKey(points: Pick<RoutePoint, 'lat' | 'lng'>[]): string {
  return points
    .map(
      (p) =>
        `${p.lat.toFixed(CACHE_DECIMALS)},${p.lng.toFixed(CACHE_DECIMALS)}`,
    )
    .join(';');
}

/**
 * Walking route via FOSSGIS OSRM foot profile.
 * Returns null on failure / <2 points.
 * Cached in-memory for the session (key = rounded waypoints).
 */
export async function fetchWalkingRoute(
  points: Pick<RoutePoint, 'lat' | 'lng'>[],
  signal?: AbortSignal,
): Promise<WalkingRoute | null> {
  if (points.length < 2) return null;

  const key = walkCacheKey(points);
  const cached = walkRouteCache.get(key);
  if (cached) return cached;

  const inflight = walkRouteInflight.get(key);
  if (inflight) {
    // Share the network call; still honor abort for this waiter
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    return inflight.then((r) => {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      return r;
    });
  };

  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
  const url = `${OSRM_FOOT}/${coords}?overview=full&geometries=geojson&steps=false`;

  // No AbortSignal on fetch: aborted day switches still populate the session
  // cache so the next “show on map” is free. Waiters honor their own signal.
  const request = (async (): Promise<WalkingRoute | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = (await res.json()) as {
        code?: string;
        routes?: Array<{
          distance: number;
          duration: number;
          geometry?: { coordinates?: [number, number][] };
        }>;
      };
      if (data.code !== 'Ok' || !data.routes?.[0]) return null;
      const route = data.routes[0];
      const raw = route.geometry?.coordinates;
      if (!raw?.length) return null;

      // GeoJSON is [lng, lat] → Leaflet [lat, lng]
      const latlngs = raw.map(
        ([lng, lat]) => [lat, lng] as [number, number],
      );

      const built: WalkingRoute = {
        latlngs,
        durationSec: route.duration,
        distanceM: route.distance,
      };
      walkRouteCache.set(key, built);
      return built;
    } catch {
      return null;
    } finally {
      walkRouteInflight.delete(key);
    }
  })();

  walkRouteInflight.set(key, request);

  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const result = await request;
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  return result;
}

/**
 * Google Maps multi-stop directions (precise + transit when needed).
 * @see https://developers.google.com/maps/documentation/urls/get-started#directions-action
 */
export function googleDirectionsUrl(
  points: RoutePoint[],
  mode: RouteMode,
): string | null {
  if (points.length < 2) return null;

  const origin = `${points[0].lat},${points[0].lng}`;
  const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
  const mid = points.slice(1, -1);
  const travelmode = mode === 'transit' ? 'transit' : 'walking';

  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode,
  });

  if (mid.length > 0) {
    // Max ~9 intermediate waypoints in the free URL scheme
    const wp = mid
      .slice(0, 9)
      .map((p) => `${p.lat},${p.lng}`)
      .join('|');
    params.set('waypoints', wp);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function formatRouteDuration(
  sec: number,
  locale: 'en' | 'pt-BR' = 'en',
): string {
  const totalMin = Math.max(1, Math.round(sec / 60));
  if (totalMin < 60) {
    return locale === 'pt-BR' ? `${totalMin} min` : `${totalMin} min`;
  }
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (locale === 'pt-BR') {
    return m > 0 ? `${h} h ${m} min` : `${h} h`;
  }
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

export function formatRouteDistance(
  meters: number,
  locale: 'en' | 'pt-BR' = 'en',
): string {
  if (meters < 1000) {
    const m = Math.round(meters);
    return locale === 'pt-BR' ? `${m} m` : `${m} m`;
  }
  const km = meters / 1000;
  const rounded = km >= 10 ? Math.round(km) : Math.round(km * 10) / 10;
  const n =
    locale === 'pt-BR'
      ? String(rounded).replace('.', ',')
      : String(rounded);
  return `${n} km`;
}

export function pointLabel(
  point: RoutePoint,
  locale: 'en' | 'pt-BR',
): string {
  return locale === 'pt-BR' && point.labelPt ? point.labelPt : point.label;
}
