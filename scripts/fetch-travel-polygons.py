#!/usr/bin/env python3
"""
Fetch place geometries from OpenStreetMap (Nominatim) and merge into
src/data/travel-areas-osm.ts.

Why this exists
---------------
Hand-authored 2–3 point polylines (e.g. Cour du Commerce as a diagonal) do not
follow real streets. OSM LineString/Polygon outlines do. This script is the
source of truth pipeline; travel.ts only holds fallbacks / route waypoints.

Features
--------
- Query catalog: scripts/travel-area-queries.json (id, q, lat, lng, prefer)
- Accepts Polygon, MultiPolygon, LineString, MultiLineString
- Picks the Nominatim hit closest to the place pin (not just highest importance)
- Validates pin→geometry distance; rejects absurd matches
- MERGES into existing travel-areas-osm.ts (never wipes multipolygons / curated paths)
- honor preserve_existing + MANUAL overrides
- Writes quality report: src/data/travel-areas-report.json

Usage
-----
  python3 scripts/fetch-travel-polygons.py
  python3 scripts/fetch-travel-polygons.py --only par-cour-commerce,par-sorbonne
  python3 scripts/fetch-travel-polygons.py --force   # re-fetch even if present

Nominatim: 1 req/s — script sleeps between calls. Use a real User-Agent.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUT_TS = ROOT / "src/data/travel-areas-osm.ts"
RAW_JSON = ROOT / "src/data/travel-polygons-raw.json"
REPORT_JSON = ROOT / "src/data/travel-areas-report.json"
QUERIES_JSON = ROOT / "scripts/travel-area-queries.json"

UA = {
    "User-Agent": "vinicius-ramos-portfolio-travel/2.0 (area sync; contact: portfolio)"
}

# Pin must be within this many meters of the geometry (after simplify)
MAX_DIST_POLYLINE_M = 120.0
MAX_DIST_POLYGON_M = 250.0
EARTH_R = 6_371_000.0

# Hand-tuned when Nominatim only returns a place node (no polygon) or a bad hit.
# Prefer non-axis-aligned rings so tests don't flag areaBox scaffolds.
MANUAL: dict[str, dict[str, Any]] = {
    # SoHo (Manhattan): Houston St – Canal St – Lafayette – 6th Ave (approx.)
    "nyc-soho": {
        "kind": "polygon",
        "path": [
            [40.7268, -74.0058],
            [40.7265, -73.9952],
            [40.7212, -73.9948],
            [40.7198, -73.9975],
            [40.7195, -74.0048],
            [40.7235, -74.0062],
        ],
    },
    # Wynwood Arts District (Miami) approximate district outline
    "mia-wynwood": {
        "kind": "polygon",
        "path": [
            [25.8125, -80.2045],
            [25.8132, -80.1912],
            [25.8048, -80.1895],
            [25.7962, -80.1918],
            [25.7955, -80.2038],
            [25.8040, -80.2055],
        ],
    },
    # Ocean Drive corridor (South Beach) — OSM splits into short stubs far apart;
    # keep a continuous avenue spine through the Art Deco strip.
    "mia-south-beach": {
        "kind": "polyline",
        "path": [
            [25.7905, -80.1305],
            [25.7865, -80.1318],
            [25.7826, -80.1341],
            [25.778, -80.1365],
            [25.7735, -80.1388],
        ],
    },
    # Rue Montorgueil is split across 1er/2e ways in OSM — merge south→north.
    "par-montorgueil": {
        "kind": "polyline",
        "path": [
            [48.863286, 2.346341],
            [48.863346, 2.346331],
            [48.86336, 2.346328],
            [48.863852, 2.34648],
            [48.864131, 2.346572],
            [48.86433, 2.34664],
            [48.864359, 2.34665],
            [48.864429, 2.346675],
            [48.864494, 2.346697],
            [48.86452, 2.346707],
            [48.864533, 2.346711],
            [48.86476, 2.34679],
            [48.865124, 2.346891],
            [48.865533, 2.34699],
            [48.86567, 2.347018],
            [48.865851, 2.347062],
        ],
    },
    # Pont Alexandre III: deck is a thin polygon in OSM; use highway centerline
    # (ways 17067006 + 17066999) so the line sits on the bridge, not a bent diagonal.
    "par-alexandre-iii": {
        "kind": "polyline",
        "path": [
            [48.862973, 2.313463],
            [48.863005, 2.313467],
            [48.864311, 2.313624],
            [48.864488, 2.313645],
            [48.864515, 2.313648],
            [48.864541, 2.313651],
            [48.864577, 2.313655],
            [48.864674, 2.313668],
        ],
    },
    # La Défense CBD: convex hull of Boulevard Patrick Devedjian (ring road)
    # segments — suburb is only a Nominatim node, no official district polygon.
    "par-la-defense": {
        "kind": "polygon",
        "path": [
            [48.886804, 2.240139],
            [48.892532, 2.234228],
            [48.892635, 2.234264],
            [48.892931, 2.234429],
            [48.893189, 2.234696],
            [48.893804, 2.235469],
            [48.893952, 2.235808],
            [48.895141, 2.242075],
            [48.895151, 2.242273],
            [48.895142, 2.242653],
            [48.895076, 2.243049],
            [48.895036, 2.2432],
            [48.894943, 2.243446],
            [48.894507, 2.2441],
            [48.889048, 2.250453],
            [48.888946, 2.250486],
            [48.888827, 2.250505],
            [48.888702, 2.25051],
            [48.888432, 2.250491],
            [48.888164, 2.250428],
            [48.887985, 2.250366],
            [48.887655, 2.250118],
            [48.887529, 2.249919],
            [48.887492, 2.249841],
            [48.887209, 2.249109],
            [48.886989, 2.248501],
            [48.886961, 2.248389],
            [48.886903, 2.248091],
        ],
    },
}


def haversine_m(a: list[float], b: list[float]) -> float:
    φ1, λ1 = math.radians(a[0]), math.radians(a[1])
    φ2, λ2 = math.radians(b[0]), math.radians(b[1])
    dφ, dλ = φ2 - φ1, λ2 - λ1
    s = math.sin(dφ / 2) ** 2 + math.cos(φ1) * math.cos(φ2) * math.sin(dλ / 2) ** 2
    return 2 * EARTH_R * math.asin(min(1.0, math.sqrt(s)))


def meters_per_degree(lat: float) -> tuple[float, float]:
    m_lat = (math.pi / 180) * EARTH_R
    m_lng = m_lat * math.cos(math.radians(lat))
    return m_lat, max(m_lng, 1e-6)


def dist_point_segment_m(p: list[float], a: list[float], b: list[float]) -> float:
    mid = (a[0] + b[0] + p[0]) / 3
    m_lat, m_lng = meters_per_degree(mid)
    px, py = (p[1] - a[1]) * m_lng, (p[0] - a[0]) * m_lat
    bx, by = (b[1] - a[1]) * m_lng, (b[0] - a[0]) * m_lat
    len2 = bx * bx + by * by
    if len2 < 1e-6:
        return haversine_m(p, a)
    t = max(0.0, min(1.0, (px * bx + py * by) / len2))
    q = [a[0] + (t * by) / m_lat, a[1] + (t * bx) / m_lng]
    return haversine_m(p, q)


def dist_point_polyline_m(p: list[float], path: list[list[float]]) -> float:
    if not path:
        return float("inf")
    if len(path) == 1:
        return haversine_m(p, path[0])
    return min(
        dist_point_segment_m(p, path[i], path[i + 1]) for i in range(len(path) - 1)
    )


def point_in_ring(p: list[float], ring: list[list[float]]) -> bool:
    if len(ring) < 3:
        return False
    x, y = p[1], p[0]
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][1], ring[i][0]
        xj, yj = ring[j][1], ring[j][0]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-15) + xi:
            inside = not inside
        j = i
    return inside


def dist_point_polygon_m(p: list[float], ring: list[list[float]]) -> float:
    if len(ring) < 3:
        return dist_point_polyline_m(p, ring)
    if point_in_ring(p, ring):
        return 0.0
    closed = ring if ring[0] == ring[-1] else ring + [ring[0]]
    return dist_point_polyline_m(p, closed)


def pin_distance_m(pin: list[float], area: dict[str, Any]) -> float:
    kind = area["kind"]
    if kind == "polyline":
        return dist_point_polyline_m(pin, area["path"])
    if kind == "polygon":
        return dist_point_polygon_m(pin, area["path"])
    if kind == "multipolygon":
        return min(dist_point_polygon_m(pin, ring) for ring in area["paths"])
    return float("inf")


def fetch_nominatim(q: str) -> list[dict]:
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {
            "q": q,
            "format": "json",
            "polygon_geojson": 1,
            "limit": 5,
            "addressdetails": 0,
        }
    )
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read().decode())


def ring_to_latlng(ring: list) -> list[list[float]]:
    out: list[list[float]] = []
    for pt in ring:
        if len(pt) < 2:
            continue
        # GeoJSON is [lng, lat] → Leaflet [lat, lng]
        out.append([round(float(pt[1]), 6), round(float(pt[0]), 6)])
    if len(out) > 2 and out[0] == out[-1]:
        out = out[:-1]
    return out


def simplify(points: list[list[float]], max_points: int = 64) -> list[list[float]]:
    if len(points) <= max_points:
        return points
    n = len(points)
    idxs = sorted(
        {int(round(i * (n - 1) / (max_points - 1))) for i in range(max_points)}
    )
    return [points[i] for i in idxs]


def extract_geojson(geo: dict) -> dict[str, Any] | None:
    """Return {kind, path?} or {kind, paths?} in Leaflet coords."""
    t = geo.get("type")
    coords = geo.get("coordinates")
    if not t or coords is None:
        return None

    if t == "Polygon":
        path = simplify(ring_to_latlng(coords[0]), 64)
        if len(path) < 3:
            return None
        return {"kind": "polygon", "path": path}

    if t == "MultiPolygon":
        rings = []
        for poly in coords:
            path = simplify(ring_to_latlng(poly[0]), 48)
            if len(path) >= 3:
                rings.append(path)
        if not rings:
            return None
        if len(rings) == 1:
            return {"kind": "polygon", "path": rings[0]}
        return {"kind": "multipolygon", "paths": rings}

    if t == "LineString":
        path = simplify(ring_to_latlng(coords), 48)
        if len(path) < 2:
            return None
        return {"kind": "polyline", "path": path}

    if t == "MultiLineString":
        # Concatenate or pick longest
        best: list[list[float]] = []
        for line in coords:
            path = ring_to_latlng(line)
            if len(path) > len(best):
                best = path
        best = simplify(best, 48)
        if len(best) < 2:
            return None
        return {"kind": "polyline", "path": best}

    return None


def result_centroid(item: dict) -> list[float] | None:
    try:
        return [float(item["lat"]), float(item["lon"])]
    except (KeyError, TypeError, ValueError):
        return None


def score_candidate(
    item: dict,
    extracted: dict[str, Any],
    pin: list[float] | None,
    prefer: str | None,
) -> float:
    """Higher is better."""
    score = float(item.get("importance") or 0) * 5  # weaker than distance
    kind = extracted["kind"]
    if prefer == "linestring" and kind == "polyline":
        score += 5
    if prefer == "polygon" and kind in ("polygon", "multipolygon"):
        score += 5
    # Prefer denser geometries (short 2-pt bridge stubs lose to full outlines)
    if kind == "multipolygon":
        n = sum(len(r) for r in extracted["paths"])
    else:
        n = len(extracted["path"])
    score += min(n, 80) * 0.15
    if kind == "polyline" and n < 4:
        score -= 8  # penalize stub linestrings

    # Prefer real ways/relations over nodes
    osm_type = item.get("osm_type") or ""
    if osm_type == "way":
        score += 2
    elif osm_type == "relation":
        score += 3

    if pin:
        d = pin_distance_m(pin, extracted)
        # Distance dominates importance for multi-segment streets
        score -= min(d, 2000) / 40.0
        if d < 50:
            score += 12
        elif d < 120:
            score += 5

    return score


def parse_existing_ts(path: Path) -> dict[str, dict[str, Any]]:
    """Best-effort parse of osmTravelAreas from the TS file."""
    if not path.exists():
        return {}
    text = path.read_text(encoding="utf-8")
    # Strip comments
    text = re.sub(r"//.*?$", "", text, flags=re.M)
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    # Find object body of osmTravelAreas
    m = re.search(
        r"export const osmTravelAreas[^=]*=\s*(\{)",
        text,
    )
    if not m:
        return {}
    start = m.start(1)
    # Brace match
    i = start
    depth = 0
    end = None
    for j in range(start, len(text)):
        if text[j] == "{":
            depth += 1
        elif text[j] == "}":
            depth -= 1
            if depth == 0:
                end = j + 1
                break
    if end is None:
        return {}
    body = text[start:end]
    # Convert TS to JSON-ish
    body = re.sub(r"'([^']+)'(\s*:)", r'"\1"\2', body)
    body = re.sub(r"(\w+)(\s*:)", r'"\1"\2', body)  # bare kind keys already quoted
    # Fix double-quoted already
    body = body.replace("'", '"')
    # Remove trailing commas
    body = re.sub(r",\s*}", "}", body)
    body = re.sub(r",\s*]", "]", body)
    try:
        return json.loads(body)
    except json.JSONDecodeError:
        # Fallback: extract via regex per entry
        return parse_existing_ts_regex(text)


def parse_existing_ts_regex(text: str) -> dict[str, dict[str, Any]]:
    """Fallback parser when full JSON conversion fails."""
    areas: dict[str, dict[str, Any]] = {}
    # multipolygon blocks
    for m in re.finditer(
        r"'([^']+)':\s*\{\s*kind:\s*'multipolygon',\s*paths:\s*(\[[\s\S]*?\n\s*\]),\s*\}",
        text,
    ):
        pid, paths_s = m.group(1), m.group(2)
        try:
            paths = json.loads(re.sub(r"(\d+\.\d+|\d+)", r"\1", paths_s.replace("'", '"')))
            # paths_s is already JS array of numbers
            paths = json.loads(paths_s.replace("\n", "").replace(" ", ""))
        except Exception:
            # manual number extract
            rings = []
            for ring_m in re.finditer(r"\[(\s*\[[\d\.\-,\s]+\](?:,\s*\[[\d\.\-,\s]+\])*\s*)\]", paths_s):
                pts = re.findall(r"\[([\d\.\-]+),\s*([\d\.\-]+)\]", ring_m.group(1))
                rings.append([[float(a), float(b)] for a, b in pts])
            if not rings:
                continue
            paths = rings
        areas[pid] = {"kind": "multipolygon", "paths": paths}

    for m in re.finditer(
        r"'([^']+)':\s*\{\s*kind:\s*'(polygon|polyline)',\s*path:\s*\[([\s\S]*?)\],\s*\}",
        text,
    ):
        pid, kind, path_s = m.group(1), m.group(2), m.group(3)
        if pid in areas:
            continue
        pts = re.findall(r"\[([\d\.\-]+),\s*([\d\.\-]+)\]", path_s)
        path = [[float(a), float(b)] for a, b in pts]
        if path:
            areas[pid] = {"kind": kind, "path": path}
    return areas


def ts_literal(area: dict[str, Any], indent: str = "  ") -> str:
    kind = area["kind"]
    lines = [f"{indent}kind: '{kind}',"]
    if kind == "multipolygon":
        lines.append(f"{indent}paths: [")
        for ring in area["paths"]:
            lines.append(f"{indent}  [")
            for p in ring:
                lines.append(f"{indent}    [{p[0]}, {p[1]}],")
            lines.append(f"{indent}  ],")
        lines.append(f"{indent}],")
    else:
        lines.append(f"{indent}path: [")
        for p in area["path"]:
            lines.append(f"{indent}  [{p[0]}, {p[1]}],")
        lines.append(f"{indent}],")
    return "\n".join(lines)


def write_ts(areas: dict[str, dict[str, Any]]) -> None:
    header = """/**
 * Precise place areas from OpenStreetMap (Nominatim) + curated overrides.
 * Coordinates: Leaflet [lat, lng].
 *
 * Regenerate / merge:
 *   npm run travel:areas
 *   python3 scripts/fetch-travel-polygons.py
 *
 * Policy: prefer these geometries over hand-authored paths in travel.ts
 * (`resolvePlaceArea`). Do not invent 2–3 point street polylines.
 * Google Maps does not expose free park/building outlines for this use case.
 */

export type OsmArea =
  | { kind: 'polygon'; path: [number, number][] }
  | { kind: 'polyline'; path: [number, number][] }
  | { kind: 'multipolygon'; paths: [number, number][][] };

export const osmTravelAreas: Record<string, OsmArea> = {
"""
    parts = [header]
    for pid in sorted(areas.keys()):
        a = areas[pid]
        parts.append(f"  '{pid}': {{\n")
        parts.append(ts_literal(a, "    "))
        parts.append("\n  },\n")
    parts.append(
        """};

export function areaForPlace(placeId: string): OsmArea | undefined {
  return osmTravelAreas[placeId];
}
"""
    )
    OUT_TS.write_text("".join(parts), encoding="utf-8")


def load_queries() -> list[dict[str, Any]]:
    data = json.loads(QUERIES_JSON.read_text(encoding="utf-8"))
    return list(data.get("queries") or [])


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--only",
        type=str,
        default="",
        help="Comma-separated place ids to fetch (default: all in catalog)",
    )
    ap.add_argument(
        "--force",
        action="store_true",
        help="Re-fetch even when geometry already exists",
    )
    ap.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch and report only; do not write travel-areas-osm.ts",
    )
    args = ap.parse_args()

    only = {x.strip() for x in args.only.split(",") if x.strip()}
    catalog = load_queries()
    if only:
        catalog = [q for q in catalog if q["id"] in only]

    existing = parse_existing_ts(OUT_TS)
    print(f"existing areas: {len(existing)}")

    raw: dict[str, Any] = {}
    if RAW_JSON.exists():
        try:
            raw = json.loads(RAW_JSON.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            raw = {}

    report: dict[str, Any] = {"ok": [], "fail": [], "skip": [], "preserved": []}
    merged = dict(existing)

    for entry in catalog:
        pid = entry["id"]
        if entry.get("preserve_existing") and pid in existing and not args.force:
            report["preserved"].append(pid)
            print(f"PRESERVE {pid} ({entry.get('note', 'catalog flag')})")
            continue

        if pid in existing and not args.force and not only:
            # Still allow missing-from-existing to be filled; skip if present
            # unless --force or --only
            report["skip"].append({"id": pid, "reason": "already_present"})
            print(f"SKIP {pid} (already present; use --force to refresh)")
            continue

        q = entry["q"]
        pin = None
        if "lat" in entry and "lng" in entry:
            pin = [float(entry["lat"]), float(entry["lng"])]
        prefer = entry.get("prefer")

        print(f"FETCH {pid} … {q}")
        time.sleep(1.15)
        try:
            data = fetch_nominatim(q)
        except Exception as e:
            report["fail"].append({"id": pid, "error": str(e)})
            print(f"  ERR {e}")
            continue

        max_d_line = MAX_DIST_POLYLINE_M
        max_d_poly = MAX_DIST_POLYGON_M
        candidates: list[tuple[float, dict, dict[str, Any], float]] = []
        for item in data:
            g = item.get("geojson")
            if not g:
                continue
            ext = extract_geojson(g)
            if not ext:
                continue
            dist = pin_distance_m(pin, ext) if pin else 0.0
            max_d = max_d_line if ext["kind"] == "polyline" else max_d_poly
            # Hard filter: never pick a geometry far from the place pin
            if pin and dist > max_d:
                continue
            sc = score_candidate(item, ext, pin, prefer)
            candidates.append((sc, item, ext, dist))

        if not candidates:
            report["fail"].append({"id": pid, "error": "no_geometry_near_pin"})
            print("  NONE (no geojson near pin)")
            continue

        candidates.sort(key=lambda x: x[0], reverse=True)
        best_score, best_item, best_ext, dist = candidates[0]

        raw[pid] = {
            "query": q,
            "osm_type": best_item.get("osm_type"),
            "osm_id": best_item.get("osm_id"),
            "display_name": best_item.get("display_name"),
            "geojson": best_item.get("geojson"),
            "dist_m": round(dist, 1) if pin else None,
            "kind": best_ext["kind"],
        }
        merged[pid] = best_ext
        npts = (
            sum(len(r) for r in best_ext["paths"])
            if best_ext["kind"] == "multipolygon"
            else len(best_ext["path"])
        )
        report["ok"].append(
            {
                "id": pid,
                "kind": best_ext["kind"],
                "points": npts,
                "dist_m": round(dist, 1) if pin else None,
            }
        )
        print(
            f"  OK {best_ext['kind']} {npts} pts"
            + (f" dist={dist:.0f}m" if pin else "")
        )

    # MANUAL overrides always win
    for pid, area in MANUAL.items():
        merged[pid] = area
        print(f"MANUAL {pid}")

    REPORT_JSON.write_text(json.dumps(report, indent=2), encoding="utf-8")
    RAW_JSON.write_text(json.dumps(raw, indent=2), encoding="utf-8")

    if args.dry_run:
        print("dry-run: not writing", OUT_TS)
    else:
        write_ts(merged)
        print("wrote", OUT_TS, "places", len(merged))
    print(
        f"report: ok={len(report['ok'])} fail={len(report['fail'])} "
        f"skip={len(report['skip'])} preserved={len(report['preserved'])}"
    )
    print("→", REPORT_JSON)


if __name__ == "__main__":
    main()
