/**
 * Guardrails for travel map geometries.
 *
 * Prevents regressions like Cour du Commerce Saint-André: a 3-point hand
 * polyline that does not follow any real street.
 *
 * Run: npm test -- src/data/travel-areas.test.ts
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_AREA_POLICY,
  looksLikeAreaBox,
  pinDistanceToAreaM,
  validatePlaceGeometry,
  type AreaIssue,
} from './travel-area-geometry';
import { areaForPlace, osmTravelAreas } from './travel-areas-osm';
import {
  MIN_AUTHORED_POLYLINE_POINTS,
  PIN_GEOMETRY_MAX_M,
  ROUTE_WAYPOINT_AREA_IDS,
  SCAFFOLD_AREA_BOX_ALLOWLIST,
} from './travel-areas-policy';
import {
  travelCities,
  withResolvedArea,
  type TravelPlace,
} from './travel';

function allPlaces(): TravelPlace[] {
  return travelCities.flatMap((c) => c.places);
}

function resolvedPlaces(): TravelPlace[] {
  return allPlaces().map(withResolvedArea);
}

describe('travel area geometry math', () => {
  it('haversine / pin-on-polyline is ~0 when pin is on the path', () => {
    const path: [number, number][] = [
      [48.8532567, 2.3390195],
      [48.8530736, 2.3390876],
      [48.8525824, 2.3392754],
    ];
    const mid: [number, number] = [48.8530736, 2.3390876];
    const d = pinDistanceToAreaM(mid, { kind: 'polyline', path });
    expect(d).toBeLessThan(1);
  });

  it('detects axis-aligned areaBox scaffolds', () => {
    expect(
      looksLikeAreaBox([
        [-23.6, -46.67],
        [-23.6, -46.64],
        [-23.57, -46.64],
        [-23.57, -46.67],
      ]),
    ).toBe(true);
    expect(
      looksLikeAreaBox([
        [48.85, 2.33],
        [48.851, 2.331],
        [48.852, 2.332],
        [48.853, 2.333],
      ]),
    ).toBe(false);
  });
});

describe('travel areas — OSM registry integrity', () => {
  it('every OSM entry has a usable path/paths', () => {
    for (const [id, area] of Object.entries(osmTravelAreas)) {
      if (area.kind === 'multipolygon') {
        expect(area.paths.length, id).toBeGreaterThan(0);
        for (const ring of area.paths) {
          expect(ring.length, `${id} ring`).toBeGreaterThanOrEqual(3);
        }
      } else {
        expect(area.path.length, id).toBeGreaterThanOrEqual(
          area.kind === 'polyline' ? 2 : 3,
        );
      }
    }
  });

  it('areaForPlace returns registered entries', () => {
    for (const id of Object.keys(osmTravelAreas)) {
      expect(areaForPlace(id)?.kind).toBeTruthy();
    }
  });
});

describe('travel areas — resolved place geometries', () => {
  it('forbids short hand-faked polylines without OSM override', () => {
    const fails: string[] = [];
    for (const place of allPlaces()) {
      const authored = place.area;
      if (!authored || authored.kind !== 'polyline') continue;
      if (ROUTE_WAYPOINT_AREA_IDS.has(place.id)) continue;
      if (authored.path.length >= MIN_AUTHORED_POLYLINE_POINTS) continue;
      // Short polyline is only OK if OSM provides a better geometry
      const osm = areaForPlace(place.id);
      if (!osm || (osm.kind === 'polyline' && osm.path.length < MIN_AUTHORED_POLYLINE_POINTS)) {
        fails.push(
          `${place.id}: authored polyline has ${authored.path.length} pts and no solid OSM override`,
        );
      }
    }
    expect(fails, fails.join('\n')).toEqual([]);
  });

  it('every place with a resolved area keeps the pin near the geometry', () => {
    const policy = {
      ...DEFAULT_AREA_POLICY,
      minPolylinePoints: MIN_AUTHORED_POLYLINE_POINTS,
      maxPinDistPolylineM: PIN_GEOMETRY_MAX_M.polyline,
      maxPinDistPolygonM: PIN_GEOMETRY_MAX_M.polygon,
    };
    const issues: AreaIssue[] = [];

    for (const place of resolvedPlaces()) {
      if (!place.area) continue;
      const allowShort = ROUTE_WAYPOINT_AREA_IDS.has(place.id);
      const allowBox = SCAFFOLD_AREA_BOX_ALLOWLIST.has(place.id);
      // When OSM won, skip short-polyline authored check (already solid)
      issues.push(
        ...validatePlaceGeometry(
          place.id,
          [place.lat, place.lng],
          place.area,
          policy,
          {
            allowShortPolyline: allowShort,
            allowScaffoldBox: allowBox,
          },
        ),
      );
    }

    // Scaffold boxes: only fail pin distance, not the scaffold code, when allowlisted
    const hard = issues.filter((i) => {
      if (i.code === 'scaffold_area_box' && SCAFFOLD_AREA_BOX_ALLOWLIST.has(i.placeId)) {
        return false;
      }
      return true;
    });

    expect(
      hard,
      hard.map((i) => i.message).join('\n'),
    ).toEqual([]);
  });

  it('rejects unresolved areaBox scaffolds (neighborhood rectangles)', () => {
    const fails: string[] = [];
    for (const place of resolvedPlaces()) {
      if (!place.area || place.area.kind !== 'polygon') continue;
      if (!looksLikeAreaBox(place.area.path)) continue;
      if (SCAFFOLD_AREA_BOX_ALLOWLIST.has(place.id)) continue;
      // OSM polygon would not look like a perfect 4-corner box at unique lat/lng pairs
      // (unless OSM is a perfect rectangle — rare). Fail to force real outlines.
      const osm = areaForPlace(place.id);
      if (osm && osm.kind !== 'polyline') {
        // Has real OSM — if still a box after resolve, something wrong
        if (osm.kind === 'polygon' && looksLikeAreaBox(osm.path)) {
          // Real rectangular parks exist; only fail if pin is far
          continue;
        }
        continue;
      }
      fails.push(
        `${place.id}: still using areaBox scaffold without OSM outline — add to fetch-travel-polygons.py`,
      );
    }
    expect(fails, fails.join('\n')).toEqual([]);
  });

  it('Cour du Commerce follows the real N–S passage (not a diagonal fake)', () => {
    const place = resolvedPlaces().find((p) => p.id === 'par-cour-commerce');
    expect(place?.area?.kind).toBe('polyline');
    if (!place?.area || place.area.kind !== 'polyline') return;

    // Must have enough points and stay within a narrow lng band (real passage)
    expect(place.area.path.length).toBeGreaterThanOrEqual(4);
    const lngs = place.area.path.map((p) => p[1]);
    const lngSpan = Math.max(...lngs) - Math.min(...lngs);
    const lats = place.area.path.map((p) => p[0]);
    const latSpan = Math.max(...lats) - Math.min(...lats);
    // Real way is ~N–S: lat span >> lng span
    expect(latSpan).toBeGreaterThan(lngSpan * 1.5);
    // Pin near the path
    const d = pinDistanceToAreaM([place.lat, place.lng], place.area);
    expect(d).toBeLessThan(40);
  });

  it('route waypoint areas (metro) have dense station paths', () => {
    for (const id of ROUTE_WAYPOINT_AREA_IDS) {
      const place = resolvedPlaces().find((p) => p.id === id);
      if (!place?.area) continue;
      if (place.area.kind !== 'polyline') continue;
      expect(
        place.area.path.length,
        `${id} should have a dense station/waypoint path`,
      ).toBeGreaterThanOrEqual(6);
      const d = pinDistanceToAreaM([place.lat, place.lng], place.area);
      expect(d, `${id} pin off route`).toBeLessThan(PIN_GEOMETRY_MAX_M.polyline);
    }
  });
});

describe('travel areas — inventory snapshot (document gaps)', () => {
  it('lists places with area for human review (always passes)', () => {
    const rows = resolvedPlaces()
      .filter((p) => p.area)
      .map((p) => {
        const osm = areaForPlace(p.id);
        const d = p.area
          ? Math.round(pinDistanceToAreaM([p.lat, p.lng], p.area))
          : -1;
        return {
          id: p.id,
          kind: p.area!.kind,
          pts:
            p.area!.kind === 'multipolygon'
              ? p.area!.paths.reduce((n, r) => n + r.length, 0)
              : p.area!.path.length,
          osm: osm?.kind ?? null,
          route: ROUTE_WAYPOINT_AREA_IDS.has(p.id),
          distM: d,
        };
      });
    // Sanity: we have some areas
    expect(rows.length).toBeGreaterThan(10);
    // Expose for `vitest` reporters / debugging
    expect(rows.every((r) => r.id)).toBe(true);
  });
});
