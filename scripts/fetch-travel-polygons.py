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
    # Galeries Lafayette Haussmann: both department-store buildings (W69224062 + W69224141).
    "par-galeries-lafayette": {
        "kind": "multipolygon",
        "paths": [
            [
                [48.873408, 2.331316],
                [48.873331, 2.331406],
                [48.873329, 2.331422],
                [48.873294, 2.331679],
                [48.87324, 2.332068],
                [48.87319, 2.33243],
                [48.873143, 2.332777],
                [48.873119, 2.332952],
                [48.87317, 2.33302],
                [48.87322, 2.333089],
                [48.873318, 2.333047],
                [48.873478, 2.332978],
                [48.873572, 2.332938],
                [48.873626, 2.332914],
                [48.873666, 2.332897],
                [48.873669, 2.33285],
                [48.873683, 2.332844],
                [48.873787, 2.332798],
                [48.873922, 2.332738],
                [48.874031, 2.33269],
                [48.874068, 2.332674],
                [48.874084, 2.332704],
                [48.874096, 2.332698],
                [48.87409, 2.332616],
                [48.874084, 2.332475],
                [48.874083, 2.332397],
                [48.874082, 2.332292],
                [48.874081, 2.332265],
                [48.87408, 2.332157],
                [48.874079, 2.33208],
                [48.874077, 2.331953],
                [48.87418, 2.331949],
                [48.874179, 2.331889],
                [48.874192, 2.331888],
                [48.874192, 2.331869],
                [48.874191, 2.331784],
                [48.874177, 2.331784],
                [48.874177, 2.331762],
                [48.874176, 2.331724],
                [48.874021, 2.331725],
                [48.874027, 2.331602],
                [48.874075, 2.331599],
                [48.874073, 2.331542],
                [48.874071, 2.331405],
                [48.874018, 2.331398],
                [48.873867, 2.331378],
                [48.873729, 2.331359],
                [48.873704, 2.331356],
                [48.873605, 2.331343],
                [48.873518, 2.331331],
                [48.873423, 2.331318],
            ],
            [
                [48.873491, 2.330193],
                [48.873484, 2.330239],
                [48.873467, 2.330364],
                [48.873457, 2.330441],
                [48.873441, 2.330559],
                [48.873432, 2.330624],
                [48.873402, 2.330844],
                [48.873384, 2.330986],
                [48.873407, 2.331036],
                [48.873427, 2.331078],
                [48.873448, 2.331081],
                [48.873529, 2.33109],
                [48.873612, 2.331101],
                [48.873668, 2.331109],
                [48.873713, 2.331114],
                [48.873757, 2.331121],
                [48.873797, 2.331124],
                [48.873805, 2.331017],
                [48.873811, 2.330918],
                [48.873815, 2.33085],
                [48.873925, 2.330868],
                [48.874063, 2.330889],
                [48.874162, 2.330887],
                [48.874162, 2.330841],
                [48.874161, 2.330791],
                [48.874159, 2.330623],
                [48.874157, 2.330488],
                [48.874155, 2.330357],
                [48.874154, 2.330277],
                [48.874153, 2.330199],
                [48.8741, 2.330201],
                [48.874094, 2.330284],
                [48.874068, 2.33028],
                [48.874041, 2.330276],
            ],
        ],
    },
    # Opéra Garnier: building outline W54667456 (RDP-simplified).
    "par-opera": {
        "kind": "polygon",
        "path": [
            [48.872434, 2.331059],
            [48.872032, 2.331238],
            [48.872011, 2.331067],
            [48.871945, 2.33111],
            [48.871907, 2.331065],
            [48.871861, 2.331068],
            [48.871814, 2.331164],
            [48.871742, 2.331182],
            [48.871786, 2.331343],
            [48.871394, 2.331512],
            [48.871408, 2.331574],
            [48.871328, 2.331621],
            [48.871386, 2.331813],
            [48.871465, 2.332347],
            [48.871549, 2.33232],
            [48.871559, 2.332393],
            [48.87195, 2.332225],
            [48.871965, 2.332394],
            [48.872023, 2.332338],
            [48.872097, 2.332397],
            [48.872097, 2.332379],
            [48.872147, 2.332366],
            [48.872173, 2.332274],
            [48.87224, 2.33227],
            [48.872195, 2.332118],
            [48.872598, 2.331949],
            [48.872584, 2.331873],
            [48.872657, 2.331835],
            [48.872731, 2.331706],
            [48.872705, 2.331554],
            [48.872623, 2.331595],
            [48.872576, 2.331346],
            [48.87266, 2.331314],
            [48.872632, 2.331167],
            [48.872519, 2.331113],
            [48.872449, 2.331138],
        ],
    },
    # Luxor Obelisk: monument base W72937686 at Place de la Concorde.
    "par-luxor-obelisk": {
        "kind": "polygon",
        "path": [
            [48.865468, 2.321094],
            [48.865453, 2.321143],
            [48.865485, 2.321167],
            [48.8655, 2.321118],
        ],
    },
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
    # Hôtel des Invalides: OSM relation 1463538 is a U-shaped building multipolygon
    # that leaves the Cour d'Honneur + Église du Dôme / Napoleon's tomb outside the
    # filled area. Convex hull of that relation + way 112452790 (Église du Dôme).
    "par-invalides": {
        "kind": "polygon",
        "path": [
            [48.854912, 2.310631],
            [48.854734, 2.312606],
            [48.854733, 2.314349],
            [48.855861, 2.314477],
            [48.857036, 2.314141],
            [48.857172, 2.311405],
            [48.855993, 2.310754],
        ],
    },
    # Parc de la Villette: full OSM R7574623 multipolygon (N+S). Prior Nominatim hit was southern half only.
    "par-la-villette": {
        "kind": "multipolygon",
        "paths": [
            [
                [48.895943, 2.384323],
                [48.892715, 2.386404],
                [48.892522, 2.387166],
                [48.894946, 2.392],
                [48.895083, 2.391935],
                [48.895797, 2.393527],
                [48.896036, 2.393418],
                [48.896505, 2.392888],
                [48.896939, 2.391941],
                [48.897199, 2.390744],
                [48.897332, 2.388979],
                [48.897087, 2.388492],
                [48.897102, 2.388268],
                [48.896494, 2.387048],
                [48.897163, 2.386321],
                [48.8972, 2.3864],
                [48.897211, 2.385737],
                [48.897094, 2.385632],
                [48.897051, 2.385708],
                [48.896259, 2.384494],
                [48.896104, 2.384327],
                [48.895968, 2.384411],
            ],
            [
                [48.891842, 2.386876],
                [48.890754, 2.38752],
                [48.89065, 2.387233],
                [48.890547, 2.387265],
                [48.890454, 2.387321],
                [48.890487, 2.387437],
                [48.889622, 2.387963],
                [48.889713, 2.38832],
                [48.89022, 2.387974],
                [48.89039, 2.388387],
                [48.890398, 2.388666],
                [48.889633, 2.389407],
                [48.889749, 2.389641],
                [48.889833, 2.390211],
                [48.890022, 2.390539],
                [48.890129, 2.390636],
                [48.891509, 2.389156],
                [48.892139, 2.390432],
                [48.890719, 2.392006],
                [48.890896, 2.392396],
                [48.890542, 2.392784],
                [48.8899, 2.392789],
                [48.889708, 2.393117],
                [48.890046, 2.393299],
                [48.890255, 2.393288],
                [48.890347, 2.393463],
                [48.890724, 2.393668],
                [48.891013, 2.393609],
                [48.891111, 2.393491],
                [48.891397, 2.393573],
                [48.892119, 2.393414],
                [48.892555, 2.394264],
                [48.893072, 2.394344],
                [48.892992, 2.393748],
                [48.893459, 2.39362],
                [48.893127, 2.392902],
                [48.893552, 2.392428],
                [48.893605, 2.392513],
                [48.893849, 2.392481],
                [48.893885, 2.392183],
                [48.894078, 2.39228],
                [48.894296, 2.392079],
                [48.894395, 2.392297],
                [48.89453, 2.392154],
            ],
        ],
    },
    # Palais-Royal: hull of Jardin (W4263203) + Palais/Cour d'Honneur Buren (R3300400).
    "par-palais-royal": {
        "kind": "polygon",
        "path": [
            [48.863457, 2.335756],
            [48.863371, 2.335808],
            [48.863015, 2.336464],
            [48.862777, 2.337459],
            [48.863918, 2.338084],
            [48.865817, 2.338919],
            [48.866106, 2.337709],
            [48.863811, 2.335948],
        ],
    },
    # Tuileries: multipolygon Jardin des Tuileries (W53820452) + Jardin du Carrousel (R539742).
    "par-tuileries": {
        "kind": "multipolygon",
        "paths": [
            [
                [48.863916, 2.321599],
                [48.86377, 2.321648],
                [48.861069, 2.329959],
                [48.861266, 2.330102],
                [48.861301, 2.329992],
                [48.861362, 2.330023],
                [48.862216, 2.330641],
                [48.862247, 2.330535],
                [48.862622, 2.330811],
                [48.862585, 2.330931],
                [48.863739, 2.331772],
                [48.866205, 2.324147],
                [48.866134, 2.32409],
                [48.866267, 2.323667],
                [48.866163, 2.323318],
            ],
            [
                [48.860969, 2.330217],
                [48.860924, 2.330258],
                [48.861207, 2.330466],
                [48.860829, 2.331799],
                [48.860813, 2.332009],
                [48.860888, 2.332109],
                [48.860688, 2.332963],
                [48.86052, 2.332891],
                [48.860418, 2.333297],
                [48.861136, 2.333765],
                [48.86138, 2.333588],
                [48.86162, 2.333648],
                [48.861732, 2.333802],
                [48.86181, 2.334113],
                [48.862515, 2.334874],
                [48.862912, 2.333645],
                [48.862835, 2.333519],
                [48.863338, 2.331941],
                [48.862928, 2.331656],
                [48.863001, 2.331434],
                [48.862927, 2.331307],
                [48.862443, 2.330977],
                [48.862461, 2.330918],
                [48.861813, 2.330503],
                [48.861683, 2.330492],
                [48.861613, 2.330716],
            ],
        ],
    },
    # Place des Vosges: Square Louis-XIII garden R571765 (not the street ring / 4-pt scaffold).
    "par-vosges": {
        "kind": "polygon",
        "path": [
            [48.85531, 2.364632],
            [48.855237, 2.364698],
            [48.855013, 2.36601],
            [48.855057, 2.366121],
            [48.855933, 2.366455],
            [48.856005, 2.36639],
            [48.856219, 2.365074],
            [48.856177, 2.364965],
        ],
    },
    # Parc de Belleville: OSM W154892778.
    "par-belleville": {
        "kind": "polygon",
        "path": [
            [48.872287, 2.383148],
            [48.871533, 2.383481],
            [48.871271, 2.383221],
            [48.871226, 2.38329],
            [48.871177, 2.383262],
            [48.871103, 2.38336],
            [48.871126, 2.383496],
            [48.871085, 2.38362],
            [48.870998, 2.383673],
            [48.870916, 2.383631],
            [48.870664, 2.384099],
            [48.870556, 2.384138],
            [48.87058, 2.384774],
            [48.870544, 2.384857],
            [48.870354, 2.384647],
            [48.870297, 2.384777],
            [48.870473, 2.386757],
            [48.870687, 2.386713],
            [48.870888, 2.386485],
            [48.870902, 2.386386],
            [48.870997, 2.386374],
            [48.871361, 2.386008],
            [48.871312, 2.38584],
            [48.871342, 2.385838],
            [48.871371, 2.385683],
            [48.871441, 2.385617],
            [48.871431, 2.385565],
            [48.871508, 2.385479],
            [48.871516, 2.385375],
            [48.871474, 2.385302],
            [48.871533, 2.385169],
            [48.871559, 2.38496],
            [48.871631, 2.384933],
            [48.871785, 2.384999],
            [48.871793, 2.384943],
            [48.871944, 2.384887],
            [48.871715, 2.3844],
            [48.871662, 2.384009],
            [48.871725, 2.383945],
            [48.8725, 2.383788],
            [48.872624, 2.384017],
            [48.872673, 2.383953],
            [48.872703, 2.384012],
            [48.8728, 2.383892],
            [48.87249, 2.383346],
            [48.872343, 2.383414],
        ],
    },
    # Coulée Verte René-Dumont: MANUAL spine Bastille→Vincennes (OSM is many short footways).
    "par-promenade-plantee": {
        "kind": "polyline",
        "path": [
            [48.84968, 2.37115],
            [48.84913, 2.3717],
            [48.84869, 2.3728],
            [48.84816, 2.3745],
            [48.84754, 2.3754],
            [48.8468, 2.3768],
            [48.84644, 2.3776],
            [48.84621, 2.3781],
            [48.845, 2.3795],
            [48.84447, 2.3817],
            [48.844, 2.3826],
            [48.84355, 2.384],
            [48.84303, 2.3848],
            [48.84278, 2.3855],
            [48.84242, 2.3868],
            [48.84206, 2.3885],
            [48.84189, 2.3894],
            [48.84113, 2.3928],
            [48.8411, 2.3953],
            [48.84113, 2.3987],
            [48.84106, 2.4005],
        ],
    },
    # Place Dauphine: OSM W53567907 garden.
    "par-place-dauphine": {
        "kind": "polygon",
        "path": [
            [48.856763, 2.341964],
            [48.856237, 2.342566],
            [48.856173, 2.342751],
            [48.856576, 2.343074],
            [48.856642, 2.342877],
            [48.85679, 2.341997],
        ],
    },
    # Conciergerie clock: Tour Carrée de l'Horloge (OSM W248434965).
    # Nominatim "Conciergerie" returns the full Palais de Justice hull.
    "par-horloge": {
        "kind": "polygon",
        "path": [
            [48.856245, 2.346131],
            [48.8562, 2.3461],
            [48.856167, 2.346208],
            [48.856211, 2.346239],
            [48.856245, 2.346131],
        ],
    },
    # La Défense CBD: full convex hull of Boulevard Patrick Devedjian ring
    # (all OSM ways). Prior path missed the SW/W arc.
    "par-la-defense": {
        "kind": "polygon",
        "path": [
            [48.891943, 2.234123],
            [48.888206, 2.234989],
            [48.887491, 2.23557],
            [48.887094, 2.236525],
            [48.886804, 2.240139],
            [48.886903, 2.248091],
            [48.887529, 2.249919],
            [48.887985, 2.250366],
            [48.888946, 2.250486],
            [48.889873, 2.249918],
            [48.89461, 2.244011],
            [48.895076, 2.243049],
            [48.895141, 2.242075],
            [48.893952, 2.235808],
            [48.892931, 2.234429],
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
