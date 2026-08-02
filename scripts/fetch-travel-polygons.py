#!/usr/bin/env python3
"""
Fetch park/building polygons from OpenStreetMap (Nominatim) and write
src/data/travel-areas-osm.ts.

Google Maps does not offer free precise place outlines for this use case.
OSM Nominatim: polygon_geojson=1 (1 req/sec, set a real User-Agent).

Usage:
  python3 scripts/fetch-travel-polygons.py
"""

from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_TS = ROOT / "src/data/travel-areas-osm.ts"
RAW_JSON = ROOT / "src/data/travel-polygons-raw.json"

UA = {"User-Agent": "vinicius-ramos-portfolio-travel/1.0 (polygon sync)"}

QUERIES: list[tuple[str, str]] = [
    ("par-champ-mars", "Champ de Mars, Paris, France"),
    ("par-invalides", "Hôtel des Invalides, Paris, France"),
    ("par-tuileries", "Jardin des Tuileries, Paris, France"),
    ("par-louvre", "Musée du Louvre, Paris, France"),
    ("par-luxembourg", "Jardin du Luxembourg, Paris, France"),
    ("par-monceau", "Parc Monceau, Paris, France"),
    ("par-palais-royal", "Jardin du Palais Royal, Paris, France"),
    ("par-vincennes", "Bois de Vincennes, Paris, France"),
    ("par-andre-citroen", "Parc André Citroën, Paris, France"),
    ("par-buttes-chaumont", "Parc des Buttes-Chaumont, Paris, France"),
    ("par-boulogne", "Bois de Boulogne, Paris, France"),
    ("par-fondation-lv", "Fondation Louis Vuitton, Paris, France"),
    ("par-serres-auteuil", "Jardin des Serres d'Auteuil, Paris, France"),
    ("par-chateau-vincennes", "Château de Vincennes, France"),
    ("par-vincennes-town", "Vincennes, Val-de-Marne, France"),
    ("par-la-villette", "Parc de la Villette, Paris, France"),
    ("par-orsay", "Musée d'Orsay, Paris, France"),
    ("par-orangerie", "Musée de l'Orangerie, Paris, France"),
    ("sp-ibirapuera", "Parque Ibirapuera, São Paulo, Brazil"),
    ("nyc-central-park", "Central Park, New York, USA"),
    ("lis-alfama", "Alfama, Lisbon, Portugal"),
]

# Hand-tuned when Nominatim only returns roads/points
MANUAL: dict[str, dict] = {
    "par-vosges": {
        "kind": "polygon",
        "path": [
            [48.85595, 2.36495],
            [48.85605, 2.36615],
            [48.85525, 2.36635],
            [48.85515, 2.36515],
        ],
    },
    "par-trocadero": {
        "kind": "polygon",
        "path": [
            [48.86285, 2.28655],
            [48.86315, 2.28885],
            [48.86245, 2.28955],
            [48.86135, 2.28925],
            [48.86095, 2.28785],
            [48.86125, 2.28645],
            [48.86195, 2.28605],
        ],
    },
}


def fetch(q: str) -> list:
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": q, "format": "json", "polygon_geojson": 1, "limit": 3}
    )
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def ring_to_latlng(ring: list) -> list[list[float]]:
    out: list[list[float]] = []
    for pt in ring:
        if len(pt) < 2:
            continue
        out.append([round(pt[1], 6), round(pt[0], 6)])
    if len(out) > 2 and out[0] == out[-1]:
        out = out[:-1]
    return out


def simplify(points: list, max_points: int = 48) -> list:
    if len(points) <= max_points:
        return points
    n = len(points)
    idxs = sorted(
        {int(round(i * (n - 1) / (max_points - 1))) for i in range(max_points)}
    )
    return [points[i] for i in idxs]


def extract(geo: dict) -> tuple[str, list] | None:
    t = geo.get("type")
    coords = geo.get("coordinates")
    if t == "Polygon":
        return "polygon", simplify(ring_to_latlng(coords[0]))
    if t == "MultiPolygon":
        best = max(coords, key=lambda poly: len(poly[0]))
        return "polygon", simplify(ring_to_latlng(best[0]))
    if t == "LineString":
        return "polyline", simplify(ring_to_latlng(coords), 32)
    return None


def main() -> None:
    raw: dict = {}
    areas: dict = {}

    for pid, q in QUERIES:
        time.sleep(1.1)
        try:
            data = fetch(q)
        except Exception as e:
            print("ERR", pid, e)
            continue
        best = None
        for item in data:
            g = item.get("geojson") or {}
            if g.get("type") in ("Polygon", "MultiPolygon"):
                if best is None or float(item.get("importance") or 0) > float(
                    best.get("importance") or 0
                ):
                    best = item
        if not best:
            print("NONE", pid)
            continue
        g = best["geojson"]
        raw[pid] = {"type": g["type"], "coordinates": g["coordinates"]}
        extracted = extract(g)
        if not extracted:
            print("SKIP", pid, g["type"])
            continue
        kind, path = extracted
        if kind == "polygon" and len(path) < 3:
            continue
        areas[pid] = {"kind": kind, "path": path}
        print("OK", pid, kind, len(path), "pts")

    areas.update(MANUAL)
    for k in MANUAL:
        print("MANUAL", k)

    RAW_JSON.write_text(json.dumps(raw, indent=2))

    lines = [
        "/**",
        " * Precise place areas from OpenStreetMap (Nominatim polygon_geojson).",
        " * Coordinates: Leaflet [lat, lng].",
        " * Regenerate: python3 scripts/fetch-travel-polygons.py",
        " * Google Maps does not expose free park/building outlines for this.",
        " */",
        "",
        "export const osmTravelAreas: Record<",
        "  string,",
        "  { kind: 'polygon' | 'polyline'; path: [number, number][] }",
        "> = {",
    ]
    for pid, a in sorted(areas.items()):
        lines.append(f"  '{pid}': {{")
        lines.append(f"    kind: '{a['kind']}',")
        path_str = ",\n      ".join(f"[{p[0]}, {p[1]}]" for p in a["path"])
        lines.append(f"    path: [\n      {path_str},\n    ],")
        lines.append("  },")
    lines += [
        "};",
        "",
        "export function areaForPlace(",
        "  placeId: string,",
        "): { kind: 'polygon' | 'polyline'; path: [number, number][] } | undefined {",
        "  return osmTravelAreas[placeId];",
        "}",
        "",
    ]
    OUT_TS.write_text("\n".join(lines))
    print("wrote", OUT_TS, "places", len(areas))


if __name__ == "__main__":
    main()
