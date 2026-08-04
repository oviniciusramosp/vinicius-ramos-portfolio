/**
 * Policy for travel place map geometries.
 *
 * Architecture:
 * 1. Prefer OpenStreetMap outlines in `travel-areas-osm.ts` (regenerate via
 *    `npm run travel:areas` → scripts/fetch-travel-polygons.py).
 * 2. `resolvePlaceArea()` always prefers OSM over authored `place.area`.
 * 3. Authored areas in travel.ts are fallbacks only — tests forbid short
 *    hand-faked polylines and loose areaBox scaffolds without OSM.
 * 4. Station/route polylines (metro lines) are explicitly allowlisted.
 */

/**
 * Areas built from station / waypoint lists (not street centerlines from OSM).
 * Exempt from "must come from OSM" and may use denser authored paths.
 */
export const ROUTE_WAYPOINT_AREA_IDS = new Set<string>([
  'par-metro-6',
  'par-metro-2',
  // Multi-canal walk with intentional waypoint spine (République → Villette)
  'par-canals',
]);

/**
 * Neighborhood / beach / soft regions where a temporary axis-aligned box is
 * acceptable until OSM has a clean boundary. Prefer replacing with OSM.
 * Tests only *warn* via a softer path if still listed here — still fail if
 * pin is absurdly far. Prefer empty set over time.
 */
export const SCAFFOLD_AREA_BOX_ALLOWLIST = new Set<string>([
  // None — force OSM or remove area. Add id here only with a tracking comment.
]);

/**
 * Places that MUST have a resolved map area (park / avenue / passage).
 * Used to catch forgotten geometries, not restaurants/cafés.
 */
export const REQUIRE_AREA_CATEGORIES = new Set<string>([
  // Intentionally empty for now: many parks get OSM via id; restaurants don't need areas.
]);

/**
 * Max distance (m) pin may sit from geometry after resolve.
 * Slightly looser than geometry defaults for real-world OSM label centroids.
 */
export const PIN_GEOMETRY_MAX_M = {
  polyline: 100,
  /** Large urban parks often pin a gate/address outside the OSM hull */
  polygon: 250,
} as const;

/** Authored polyline shorter than this without OSM override → hard fail. */
export const MIN_AUTHORED_POLYLINE_POINTS = 4;
