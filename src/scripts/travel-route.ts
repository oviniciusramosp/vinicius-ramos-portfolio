/**
 * Route preview between travel places.
 * - Walking: FOSSGIS OSRM foot graph (paths, parks, sidewalks) → polyline + duration
 * - Transit: no free global engine; Google Maps deep link is the accurate path
 *
 * Note: router.project-osrm.org exposes a /foot/ URL but its public extract is
 * car-based (same geometry/times as driving, ~car speeds). Do not use it for walk.
 */

export type RouteMode = 'walk' | 'transit';

export type RoutePoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  labelPt?: string;
};

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

/**
 * Walking route via FOSSGIS OSRM foot profile.
 * Returns null on failure / <2 points.
 */
export async function fetchWalkingRoute(
  points: Pick<RoutePoint, 'lat' | 'lng'>[],
  signal?: AbortSignal,
): Promise<WalkingRoute | null> {
  if (points.length < 2) return null;

  const coords = points.map((p) => `${p.lng},${p.lat}`).join(';');
  const url = `${OSRM_FOOT}/${coords}?overview=full&geometries=geojson&steps=false`;

  try {
    const res = await fetch(url, { signal });
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

    return {
      latlngs,
      durationSec: route.duration,
      distanceM: route.distance,
    };
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err;
    return null;
  }
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
