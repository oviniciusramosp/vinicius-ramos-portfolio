/**
 * Geometry helpers for travel place areas (Leaflet [lat, lng]).
 * Used by tests and by resolve-time sanity checks — no map runtime dependency.
 */

import type { LatLngPoint, TravelArea } from './travel';

const EARTH_R_M = 6_371_000;

/** Great-circle distance in meters between two [lat, lng] points. */
export function haversineM(a: LatLngPoint, b: LatLngPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(a[0]);
  const φ2 = toRad(b[0]);
  const Δφ = toRad(b[0] - a[0]);
  const Δλ = toRad(b[1] - a[1]);
  const s =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * EARTH_R_M * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Local meters-per-degree at latitude (for planar projections on short segments). */
function metersPerDegree(lat: number): { mLat: number; mLng: number } {
  const mLat = (Math.PI / 180) * EARTH_R_M;
  const mLng = mLat * Math.cos((lat * Math.PI) / 180);
  return { mLat, mLng: Math.max(mLng, 1e-6) };
}

/** Distance from point to line segment AB, in meters. */
export function distPointToSegmentM(
  p: LatLngPoint,
  a: LatLngPoint,
  b: LatLngPoint,
): number {
  const midLat = (a[0] + b[0] + p[0]) / 3;
  const { mLat, mLng } = metersPerDegree(midLat);
  const px = (p[1] - a[1]) * mLng;
  const py = (p[0] - a[0]) * mLat;
  const bx = (b[1] - a[1]) * mLng;
  const by = (b[0] - a[0]) * mLat;
  const len2 = bx * bx + by * by;
  if (len2 < 1e-6) return haversineM(p, a);
  let t = (px * bx + py * by) / len2;
  t = Math.max(0, Math.min(1, t));
  const qx = a[1] + (t * bx) / mLng;
  const qy = a[0] + (t * by) / mLat;
  return haversineM(p, [qy, qx]);
}

/** Min distance from point to polyline (meters). */
export function distPointToPolylineM(
  p: LatLngPoint,
  path: LatLngPoint[],
): number {
  if (path.length === 0) return Number.POSITIVE_INFINITY;
  if (path.length === 1) return haversineM(p, path[0]!);
  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < path.length - 1; i++) {
    min = Math.min(min, distPointToSegmentM(p, path[i]!, path[i + 1]!));
  }
  return min;
}

/** Ray-cast point-in-ring (lat/lng as y/x). Ring need not be closed. */
export function pointInRing(p: LatLngPoint, ring: LatLngPoint[]): boolean {
  if (ring.length < 3) return false;
  const x = p[1];
  const y = p[0];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i]![1];
    const yi = ring[i]![0];
    const xj = ring[j]![1];
    const yj = ring[j]![0];
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Distance to polygon: 0 if inside, else min distance to edges (meters). */
export function distPointToPolygonM(
  p: LatLngPoint,
  ring: LatLngPoint[],
): number {
  if (ring.length < 3) return distPointToPolylineM(p, ring);
  if (pointInRing(p, ring)) return 0;
  // Close ring for edge walk
  const closed =
    ring[0]![0] === ring[ring.length - 1]![0] &&
    ring[0]![1] === ring[ring.length - 1]![1]
      ? ring
      : [...ring, ring[0]!];
  return distPointToPolylineM(p, closed);
}

/**
 * Distance from pin to area geometry (meters).
 * - polygon / multipolygon: 0 if inside any ring, else nearest edge
 * - polyline: nearest point on the path
 */
export function pinDistanceToAreaM(
  pin: LatLngPoint,
  area: TravelArea,
): number {
  if (area.kind === 'polyline') {
    return distPointToPolylineM(pin, area.path);
  }
  if (area.kind === 'polygon') {
    return distPointToPolygonM(pin, area.path);
  }
  // multipolygon
  let min = Number.POSITIVE_INFINITY;
  for (const ring of area.paths) {
    min = Math.min(min, distPointToPolygonM(pin, ring));
  }
  return min;
}

/** True if 4-point path looks like an axis-aligned `areaBox` scaffold. */
export function looksLikeAreaBox(path: LatLngPoint[]): boolean {
  if (path.length !== 4) return false;
  const lats = path.map((p) => p[0]);
  const lngs = path.map((p) => p[1]);
  const uniqLat = new Set(lats.map((v) => v.toFixed(6)));
  const uniqLng = new Set(lngs.map((v) => v.toFixed(6)));
  // Exactly two distinct lats and two distinct lngs → rectangle aligned to axes
  return uniqLat.size === 2 && uniqLng.size === 2;
}

export type AreaIssueCode =
  | 'missing_area'
  | 'polyline_too_short'
  | 'polygon_too_few_points'
  | 'pin_far_from_geometry'
  | 'scaffold_area_box'
  | 'empty_path';

export type AreaIssue = {
  code: AreaIssueCode;
  placeId: string;
  message: string;
  meta?: Record<string, number | string | boolean>;
};

export type AreaPolicy = {
  /** Min vertices for an authored/resolved polyline (street/passage). */
  minPolylinePoints: number;
  /** Min vertices for a polygon ring. */
  minPolygonPoints: number;
  /** Max pin→geometry distance (m) for polylines. */
  maxPinDistPolylineM: number;
  /** Max pin→geometry distance (m) for polygons (0 = inside OK). */
  maxPinDistPolygonM: number;
};

export const DEFAULT_AREA_POLICY: AreaPolicy = {
  minPolylinePoints: 4,
  minPolygonPoints: 3,
  maxPinDistPolylineM: 90,
  maxPinDistPolygonM: 150,
};

/**
 * Validate a place pin against its resolved area.
 * Returns empty array when OK.
 */
export function validatePlaceGeometry(
  placeId: string,
  pin: LatLngPoint,
  area: TravelArea | undefined,
  policy: AreaPolicy = DEFAULT_AREA_POLICY,
  opts?: {
    /** Skip short-polyline rule (station-based metro routes, etc.) */
    allowShortPolyline?: boolean;
    /** Allow axis-aligned areaBox scaffolds */
    allowScaffoldBox?: boolean;
  },
): AreaIssue[] {
  const issues: AreaIssue[] = [];
  if (!area) return issues;

  if (area.kind === 'polyline') {
    if (area.path.length === 0) {
      issues.push({
        code: 'empty_path',
        placeId,
        message: `${placeId}: polyline has empty path`,
      });
      return issues;
    }
    if (
      !opts?.allowShortPolyline &&
      area.path.length < policy.minPolylinePoints
    ) {
      issues.push({
        code: 'polyline_too_short',
        placeId,
        message: `${placeId}: polyline has ${area.path.length} points (min ${policy.minPolylinePoints}) — looks hand-faked; use OSM`,
        meta: { points: area.path.length },
      });
    }
    const d = pinDistanceToAreaM(pin, area);
    if (d > policy.maxPinDistPolylineM) {
      issues.push({
        code: 'pin_far_from_geometry',
        placeId,
        message: `${placeId}: pin is ${Math.round(d)} m from polyline (max ${policy.maxPinDistPolylineM} m)`,
        meta: { distM: Math.round(d) },
      });
    }
    return issues;
  }

  if (area.kind === 'polygon') {
    if (area.path.length < policy.minPolygonPoints) {
      issues.push({
        code: 'polygon_too_few_points',
        placeId,
        message: `${placeId}: polygon has ${area.path.length} points`,
        meta: { points: area.path.length },
      });
    }
    if (!opts?.allowScaffoldBox && looksLikeAreaBox(area.path)) {
      issues.push({
        code: 'scaffold_area_box',
        placeId,
        message: `${placeId}: area looks like areaBox() scaffold — replace with OSM outline`,
      });
    }
    const d = pinDistanceToAreaM(pin, area);
    if (d > policy.maxPinDistPolygonM) {
      issues.push({
        code: 'pin_far_from_geometry',
        placeId,
        message: `${placeId}: pin is ${Math.round(d)} m outside polygon (max ${policy.maxPinDistPolygonM} m)`,
        meta: { distM: Math.round(d) },
      });
    }
    return issues;
  }

  // multipolygon
  if (area.paths.length === 0) {
    issues.push({
      code: 'empty_path',
      placeId,
      message: `${placeId}: multipolygon has no rings`,
    });
    return issues;
  }
  for (const [i, ring] of area.paths.entries()) {
    if (ring.length < policy.minPolygonPoints) {
      issues.push({
        code: 'polygon_too_few_points',
        placeId,
        message: `${placeId}: multipolygon ring ${i} has ${ring.length} points`,
        meta: { ring: i, points: ring.length },
      });
    }
  }
  const d = pinDistanceToAreaM(pin, area);
  if (d > policy.maxPinDistPolygonM) {
    issues.push({
      code: 'pin_far_from_geometry',
      placeId,
      message: `${placeId}: pin is ${Math.round(d)} m outside multipolygon (max ${policy.maxPinDistPolygonM} m)`,
      meta: { distM: Math.round(d) },
    });
  }
  return issues;
}
