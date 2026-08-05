/**
 * Authored walk / transit legs between consecutive primary stops.
 * Geometry: walk → OSRM foot; transit → metro/RER spine (+ walk to stations).
 */

import type { LString } from './travel';
import {
  getTransitLine,
  haversineM,
  type LatLng,
  type TransitLineId,
} from './travel-transit-lines';

export type ItineraryLegMode = 'walk' | 'transit';

/**
 * One hop on a multi-line transit leg (e.g. M14 then RER E).
 * Each hop keeps its own line color + spine; map draws a transfer dot between hops.
 */
export type ItineraryTransitHop = {
  /** Line id (m14, m13, rer-e, …) for official color when known */
  line: TransitLineId | string;
  /** Station/corridor polyline for this hop only [lat,lng] */
  path: LatLng[];
  /** Short label for this hop (e.g. "M14") */
  label?: string;
};

export type ItineraryLegDef = {
  from: string;
  to: string;
  mode: ItineraryLegMode;
  /** Transit line key when mode === 'transit' (single-line) */
  line?: TransitLineId | string;
  /** Explicit stations on that line (else nearest to place pins) */
  fromStation?: string;
  toStation?: string;
  /**
   * Pre-authored transit polyline [lat,lng] — station/corridor only.
   * Walk connectors place↔path ends are generated separately.
   * Prefer `hops` for multi-line rides ("RER E + M13").
   */
  path?: LatLng[];
  /**
   * Multi-line transit: ordered hops with per-line geometry + color.
   * When set, overrides single `path` / `line` for map expansion.
   */
  hops?: ItineraryTransitHop[];
  /** Short label for UI (e.g. "M1", "RER E + M13") */
  label?: string;
  /** Optional override for expected duration (minutes) */
  durationMin?: number;
};

/**
 * Fallback brand colors for lines not yet in travel-transit-lines
 * (RER B / RER E spines are still authored as free paths).
 */
export const TRANSIT_LINE_COLORS: Record<string, string> = {
  'rer-b': '#5291CE',
  'rer-e': '#C04191',
  'rer-a': '#E3051C',
  'rer-d': '#00814F',
  m9: '#B6BD00',
};

/** Resolve RATP/RER brand color for a line id */
export function lineBrandColor(lineId?: string): string | undefined {
  if (!lineId) return undefined;
  return getTransitLine(lineId)?.color ?? TRANSIT_LINE_COLORS[lineId];
}

/** Bilingual label for timeline transfer chips */
export function legDisplayLabel(leg: ItineraryLegDef): LString {
  if (leg.mode === 'walk') {
    return { en: 'Walk', 'pt-BR': 'A pé' };
  }
  if (leg.label) {
    return { en: leg.label, 'pt-BR': leg.label };
  }
  if (leg.line) {
    const line = getTransitLine(leg.line);
    const name = line?.name ?? String(leg.line).toUpperCase();
    return { en: name, 'pt-BR': name };
  }
  return { en: 'Transit', 'pt-BR': 'Transporte' };
}

/** Walk ≈ 4.8 km/h; urban transit effective ≈ 21 km/h */
const WALK_M_PER_MIN = 80;
const TRANSIT_M_PER_MIN = 350;
/** Boarding / wait buffer for transit legs */
const TRANSIT_BUFFER_MIN = 2;
/**
 * Min distance between consecutive hop ends/starts to show an inter-station walk
 * (same-station transfers use nearly identical coords and stay silent).
 */
const INTER_HOP_WALK_MIN_M = 40;

/** Walk distance between end of hop A and start of hop B (0 if same station). */
export function interHopWalkM(
  fromHop: ItineraryTransitHop,
  toHop: ItineraryTransitHop,
): number {
  const a = fromHop.path[fromHop.path.length - 1];
  const b = toHop.path[0];
  if (!a || !b) return 0;
  return haversineM(
    { lat: a[0], lng: a[1] },
    { lat: b[0], lng: b[1] },
  );
}

function pathLengthM(path: LatLng[]): number {
  let d = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!;
    const b = path[i + 1]!;
    d += haversineM(
      { lat: a[0], lng: a[1] },
      { lat: b[0], lng: b[1] },
    );
  }
  return d;
}

/**
 * Expected travel time for a place→place leg (minutes).
 * Uses path geometry when available; otherwise haversine + mode speed.
 */
export function estimateLegDurationMin(
  leg: ItineraryLegDef,
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  if (typeof leg.durationMin === 'number' && leg.durationMin > 0) {
    return Math.max(1, Math.round(leg.durationMin));
  }

  if (leg.mode === 'walk') {
    return Math.max(1, Math.round(haversineM(from, to) / WALK_M_PER_MIN));
  }

  const spinePath =
    leg.hops && leg.hops.length > 0
      ? leg.hops.flatMap((h) => h.path)
      : leg.path;
  if (spinePath && spinePath.length >= 2) {
    const start = spinePath[0]!;
    const end = spinePath[spinePath.length - 1]!;
    const walkIn = haversineM(from, { lat: start[0], lng: start[1] });
    const walkOut = haversineM({ lat: end[0], lng: end[1] }, to);
    let interHopWalk = 0;
    if (leg.hops && leg.hops.length > 1) {
      for (let i = 0; i < leg.hops.length - 1; i++) {
        const d = interHopWalkM(leg.hops[i]!, leg.hops[i + 1]!);
        if (d >= INTER_HOP_WALK_MIN_M) interHopWalk += d;
      }
    }
    const spine = pathLengthM(spinePath);
    const hopBuffer = (leg.hops?.length ?? 1) * TRANSIT_BUFFER_MIN;
    const mins =
      walkIn / WALK_M_PER_MIN +
      spine / TRANSIT_M_PER_MIN +
      interHopWalk / WALK_M_PER_MIN +
      walkOut / WALK_M_PER_MIN +
      hopBuffer;
    return Math.max(3, Math.round(mins));
  }

  // Straight-line detour factor for unpathed transit
  const m = haversineM(from, to) * 1.3;
  return Math.max(
    3,
    Math.round(m / TRANSIT_M_PER_MIN) + TRANSIT_BUFFER_MIN,
  );
}

/** Always-visible duration chip next to transfer label */
export function formatLegDuration(min: number): LString {
  const n = Math.max(1, Math.round(min));
  return {
    en: `~${n} min`,
    'pt-BR': `~${n} min`,
  };
}

/**
 * Official line color for timeline chips.
 * Multi-hop legs use the first hop’s brand color when available.
 */
export function legLineColor(leg: ItineraryLegDef): string | null {
  if (leg.mode !== 'transit') return null;
  if (leg.hops?.length) {
    return lineBrandColor(leg.hops[0]!.line) ?? '#008fff';
  }
  if (!leg.line) return null;
  if (leg.label?.includes('+') && !leg.hops) {
    return lineBrandColor(leg.line) ?? '#008fff';
  }
  return lineBrandColor(leg.line) ?? null;
}

/** Solid vs dotted rail style for stop segments / transfers */
export type TimelineRailKind = 'walk' | 'transit' | 'none';

export function legRailKind(
  leg: ItineraryLegDef | null | undefined,
): TimelineRailKind {
  if (!leg) return 'none';
  return leg.mode === 'walk' ? 'walk' : 'transit';
}

/**
 * One visual transfer row in the day timeline.
 * Multi-line legs (hops) expand to one row per line (e.g. RER E, then M13).
 */
export type TimelineTransferPart = {
  mode: ItineraryLegMode;
  /** Full place→place leg (for map hover / data attributes) */
  leg: ItineraryLegDef;
  label: LString;
  color: string | null;
  /** Per-segment expected duration (minutes) */
  durationMin: number;
  /**
   * Index of this hop within a multi-line transit leg (0-based).
   * Undefined for walk / single-line transit.
   */
  hopIndex?: number;
  /**
   * Station markers along this transit segment (from authored path points).
   * Walk has 0; transit uses hop/leg path length (min 2 when known).
   */
  stationCount: number;
};

/** Count station dots for a transit path (coordinates = stations on spine). */
function stationCountFromPath(path?: LatLng[]): number {
  if (!path || path.length < 2) return 0;
  return path.length;
}

/** Transit spine duration for one hop/path (minutes). */
function transitPathDurationMin(path: LatLng[]): number {
  if (path.length < 2) return TRANSIT_BUFFER_MIN;
  const spine = pathLengthM(path);
  return Math.max(
    1,
    Math.round(spine / TRANSIT_M_PER_MIN) + TRANSIT_BUFFER_MIN,
  );
}

/**
 * Expand a leg into one or more timeline transfer chips.
 * Multi-hop legs → one chip per line, each with its own duration + hopIndex.
 */
export function expandTimelineTransferParts(
  leg: ItineraryLegDef,
  from?: { lat: number; lng: number },
  to?: { lat: number; lng: number },
): TimelineTransferPart[] {
  if (leg.mode === 'walk') {
    const durationMin =
      from && to
        ? estimateLegDurationMin(leg, from, to)
        : Math.max(1, leg.durationMin ?? 5);
    return [
      {
        mode: 'walk',
        leg,
        label: legDisplayLabel(leg),
        color: null,
        durationMin,
        stationCount: 0,
      },
    ];
  }

  if (leg.hops && leg.hops.length > 0) {
    const parts: TimelineTransferPart[] = [];
    for (let i = 0; i < leg.hops.length; i++) {
      const hop = leg.hops[i]!;
      const name =
        hop.label ??
        getTransitLine(hop.line)?.name ??
        String(hop.line).toUpperCase();
      parts.push({
        mode: 'transit',
        leg,
        label: { en: name, 'pt-BR': name },
        color: lineBrandColor(hop.line) ?? '#008fff',
        durationMin: transitPathDurationMin(hop.path),
        hopIndex: i,
        stationCount: stationCountFromPath(hop.path),
      });

      // Different stations (e.g. RER E St-Lazare → M9 St-Augustin): show walk
      const next = leg.hops[i + 1];
      if (!next) continue;
      const walkM = interHopWalkM(hop, next);
      if (walkM < INTER_HOP_WALK_MIN_M) continue;
      const nextName =
        next.label ??
        getTransitLine(next.line)?.name ??
        String(next.line).toUpperCase();
      parts.push({
        mode: 'walk',
        leg,
        label: {
          en: `Walk to ${nextName}`,
          'pt-BR': `A pé até ${nextName}`,
        },
        color: null,
        durationMin: Math.max(1, Math.round(walkM / WALK_M_PER_MIN)),
        stationCount: 0,
      });
    }
    return parts;
  }

  // Single-line transit: path stations, or resolve corridor from line registry
  let count = stationCountFromPath(leg.path);
  if (count === 0 && leg.line && leg.fromStation && leg.toStation) {
    const line = getTransitLine(leg.line);
    if (line) {
      const i = line.stations.findIndex((s) => s.id === leg.fromStation);
      const j = line.stations.findIndex((s) => s.id === leg.toStation);
      if (i >= 0 && j >= 0) {
        count = Math.abs(j - i) + 1;
      }
    }
  }

  const durationMin =
    leg.path && leg.path.length >= 2
      ? transitPathDurationMin(leg.path)
      : from && to
        ? estimateLegDurationMin(leg, from, to)
        : Math.max(3, leg.durationMin ?? 8);

  return [
    {
      mode: 'transit',
      leg,
      label: legDisplayLabel(leg),
      color: legLineColor(leg),
      durationMin,
      stationCount: count,
    },
  ];
}

/**
 * Shared Day 1 legs after first bags at Casa do Gui:
 * house → market → house → Tower loop → dinner → home.
 */
const day1AfterBase: ItineraryLegDef[] = [
  // Short walk house ↔ Auchan (~5 min each way)
  { from: 'par-casa-do-gui', to: 'par-auchan-noisy', mode: 'walk' },
  { from: 'par-auchan-noisy', to: 'par-casa-do-gui', mode: 'walk' },
  {
    from: 'par-casa-do-gui',
    to: 'par-trocadero',
    mode: 'transit',
    // Walk house → Noisy RER (auto), RER E west → Saint-Lazare,
    // walk corridor to M9 Saint-Augustin (~3–5 min), M9 to Trocadéro.
    // Inter-hop walk is auto-inserted in timeline + map (coords differ).
    hops: [
      {
        line: 'rer-e',
        label: 'RER E',
        path: [
          [48.8907, 2.4608], // Noisy-le-Sec (board)
          [48.8855, 2.385], // Pantin
          [48.8785, 2.358], // Magenta
          [48.8755, 2.3255], // Saint-Lazare (alight → walk to M9)
        ],
      },
      {
        line: 'm9',
        label: 'M9',
        path: [
          [48.8745, 2.322], // Saint-Augustin (board after walk from St-Lazare)
          [48.8735, 2.3145], // Miromesnil
          [48.869, 2.31], // Franklin D. Roosevelt
          [48.865, 2.3005], // Alma–Marceau
          [48.8645, 2.2935], // Iéna
          [48.863, 2.2875], // Trocadéro
        ],
      },
    ],
    label: 'RER E + M9',
    durationMin: 45,
  },
  // Trocadéro (high view) → Tower exterior → Bake & Blend → Champ de Mars → dinner → home
  { from: 'par-trocadero', to: 'par-eiffel', mode: 'walk' },
  { from: 'par-eiffel', to: 'par-bake-blend', mode: 'walk' },
  { from: 'par-bake-blend', to: 'par-champ-mars', mode: 'walk' },
  { from: 'par-champ-mars', to: 'par-royal-cambronne', mode: 'walk' },
  {
    from: 'par-royal-cambronne',
    to: 'par-casa-do-gui',
    mode: 'transit',
    // Cambronne M6 → Montparnasse, M13 → Saint-Lazare, RER E → Noisy, walk home.
    hops: [
      {
        line: 'm6',
        label: 'M6',
        path: [
          [48.8475, 2.3025], // Cambronne
          [48.8455, 2.31], // Sèvres–Lecourbe
          [48.8428, 2.3125], // Pasteur
          [48.8422, 2.3219], // Montparnasse–Bienvenüe
        ],
      },
      {
        line: 'm13',
        label: 'M13',
        path: [
          [48.8422, 2.3219], // Montparnasse
          [48.847, 2.3165], // Duroc
          [48.856, 2.315], // Varenne
          [48.861, 2.3145], // Invalides
          [48.8676, 2.3135], // Champs-Élysées–Clemenceau
          [48.8735, 2.3145], // Miromesnil
          [48.8755, 2.3255], // Saint-Lazare
        ],
      },
      {
        line: 'rer-e',
        label: 'RER E',
        path: [
          [48.8755, 2.3255], // Saint-Lazare
          [48.8785, 2.358], // Magenta
          [48.8855, 2.385], // Pantin
          [48.8907, 2.4608], // Noisy-le-Sec
        ],
      },
    ],
    label: 'M6 + M13 + RER E',
    durationMin: 55,
  },
];

/**
 * Day 1 — Friday arrival ORY: Orly → Navigo → PAUL → Casa do Gui → Tower.
 */
const day1: ItineraryLegDef[] = [
  { from: 'par-ory', to: 'par-orly-m14', mode: 'walk' },
  { from: 'par-orly-m14', to: 'par-orly-paul', mode: 'walk' },
  {
    from: 'par-orly-paul',
    to: 'par-noisy-le-sec-rer',
    mode: 'transit',
    // M14 Orly → Saint-Lazare, then RER E east to Noisy-le-Sec
    hops: [
      {
        line: 'm14',
        label: 'M14',
        path: [
          [48.7292, 2.3698], // Orly M14
          [48.827, 2.367], // Olympiades
          [48.8298, 2.3765], // Bibliothèque F. Mitterrand
          [48.84, 2.3795], // Bercy
          [48.8448, 2.3735], // Gare de Lyon
          [48.8584, 2.347], // Châtelet
          [48.8665, 2.3345], // Pyramides
          [48.87, 2.3244], // Madeleine
          [48.8755, 2.3255], // Saint-Lazare (transfer → RER E)
        ],
      },
      {
        line: 'rer-e',
        label: 'RER E',
        path: [
          [48.8755, 2.3255], // Saint-Lazare / Haussmann
          [48.8785, 2.358], // Magenta
          [48.8855, 2.385], // Pantin
          [48.8907, 2.4608], // Noisy-le-Sec
        ],
      },
    ],
    label: 'M14 + RER E',
  },
  { from: 'par-noisy-le-sec-rer', to: 'par-casa-do-gui', mode: 'walk' },
  ...day1AfterBase,
];

/**
 * Day 1 — Friday arrival CDG: CDG → PAUL → Navigo RER → Casa do Gui → Tower.
 */
const day1Cdg: ItineraryLegDef[] = [
  { from: 'par-cdg', to: 'par-cdg-paul', mode: 'walk' },
  { from: 'par-cdg-paul', to: 'par-cdg-rer', mode: 'walk' },
  {
    from: 'par-cdg-rer',
    to: 'par-noisy-le-sec-rer',
    mode: 'transit',
    // RER B south → Magenta, then RER E east to Noisy-le-Sec
    hops: [
      {
        line: 'rer-b',
        label: 'RER B',
        path: [
          [49.0039, 2.5708], // CDG 2 TGV
          [49.0099, 2.561], // CDG 1
          [48.973, 2.515], // Parc des Expositions / Aulnay corridor
          [48.936, 2.425], // Sevran / north suburbs
          [48.8809, 2.3553], // Gare du Nord
          [48.8785, 2.358], // Magenta (transfer → RER E)
        ],
      },
      {
        line: 'rer-e',
        label: 'RER E',
        path: [
          [48.8785, 2.358], // Magenta
          [48.8855, 2.385], // Pantin
          [48.8907, 2.4608], // Noisy-le-Sec
        ],
      },
    ],
    label: 'RER B + RER E',
    durationMin: 65,
  },
  { from: 'par-noisy-le-sec-rer', to: 'par-casa-do-gui', mode: 'walk' },
  ...day1AfterBase,
];

/**
 * Day 2 — Optimized west axis (former Day 1).
 * Defense → Tuileries picnic → Champs / Arc → Invalides → Opéra / Bouillon.
 */
const day2: ItineraryLegDef[] = [
  { from: 'par-paul-defense', to: 'par-grande-arche', mode: 'walk' },
  { from: 'par-grande-arche', to: 'par-esplanade-de-gaulle', mode: 'walk' },
  { from: 'par-esplanade-de-gaulle', to: 'par-la-defense', mode: 'walk' },
  {
    from: 'par-la-defense',
    to: 'par-monoprix-rivoli',
    mode: 'transit',
    line: 'm1',
    fromStation: 'la-defense',
    toStation: 'tuileries',
    label: 'M1',
  },
  { from: 'par-monoprix-rivoli', to: 'par-tuileries', mode: 'walk' },
  { from: 'par-tuileries', to: 'par-louvre', mode: 'walk' },
  { from: 'par-louvre', to: 'par-vendome', mode: 'walk' },
  { from: 'par-vendome', to: 'par-champs-elysees', mode: 'walk' },
  { from: 'par-champs-elysees', to: 'par-pierre-herme', mode: 'walk' },
  { from: 'par-pierre-herme', to: 'par-arc-triomphe', mode: 'walk' },
  { from: 'par-arc-triomphe', to: 'par-palais', mode: 'walk' },
  { from: 'par-palais', to: 'par-alexandre-iii', mode: 'walk' },
  { from: 'par-alexandre-iii', to: 'par-invalides', mode: 'walk' },
  {
    from: 'par-invalides',
    to: 'par-opera',
    mode: 'transit',
    line: 'm8',
    fromStation: 'invalides',
    toStation: 'opera',
    label: 'M8',
  },
  { from: 'par-opera', to: 'par-galeries-lafayette', mode: 'walk' },
  { from: 'par-galeries-lafayette', to: 'par-bouillon', mode: 'walk' },
];

/**
 * Day 3 — Left bank cluster walk, then north for canal / Montmartre.
 */
const day3: ItineraryLegDef[] = [
  { from: 'par-maison-isabelle', to: 'par-luxembourg', mode: 'walk' },
  { from: 'par-luxembourg', to: 'par-pantheon', mode: 'walk' },
  { from: 'par-pantheon', to: 'par-sorbonne', mode: 'walk' },
  { from: 'par-sorbonne', to: 'par-creperie-arts', mode: 'walk' },
  { from: 'par-creperie-arts', to: 'par-saint-michel', mode: 'walk' },
  { from: 'par-saint-michel', to: 'par-notre-dame', mode: 'walk' },
  { from: 'par-notre-dame', to: 'par-hotel-ville', mode: 'walk' },
  { from: 'par-hotel-ville', to: 'par-horloge', mode: 'walk' },
  { from: 'par-horloge', to: 'par-sainte-chapelle', mode: 'walk' },
  {
    from: 'par-sainte-chapelle',
    to: 'par-fric-frac',
    mode: 'transit',
    line: 'm4',
    fromStation: 'cite',
    toStation: 'barbès',
    label: 'M4',
  },
  { from: 'par-fric-frac', to: 'par-montmartre', mode: 'walk' },
  { from: 'par-montmartre', to: 'par-sacre-coeur', mode: 'walk' },
  { from: 'par-sacre-coeur', to: 'par-moulin-rouge', mode: 'walk' },
  { from: 'par-moulin-rouge', to: 'par-arnaud-nicolas', mode: 'walk' },
];

/**
 * Day 4 — Versailles day. RER C is the spine; Michalak is a western pastry stop.
 */
const day4: ItineraryLegDef[] = [
  {
    from: 'par-michalak',
    to: 'par-versailles',
    mode: 'transit',
    line: 'rer-c',
    // Transit spine only (stations). Walk place↔ends drawn separately.
    path: [
      [48.880692, 2.272281], // Les Sablons (M1 near Michalak)
      [48.87803, 2.282547], // Porte Maillot
      [48.8738, 2.295], // Étoile
      [48.8676, 2.3135], // Clemenceau
      [48.861, 2.3145], // Invalides RER C
      [48.8555, 2.2895], // Champ de Mars
      [48.8465, 2.2785], // Javel
      [48.8215, 2.2595], // Issy
      [48.8125, 2.2215], // Meudon
      [48.8003, 2.1293], // Versailles-Château
    ],
    label: 'RER C',
  },
  {
    from: 'par-versailles',
    to: 'par-eiffel',
    mode: 'transit',
    line: 'rer-c',
    fromStation: 'versailles-chateau',
    toStation: 'champ-mars',
    label: 'RER C',
  },
  {
    from: 'par-eiffel',
    to: 'par-bien-eleve',
    mode: 'transit',
    line: 'm6',
    // Station spine only: M6 → Étoile → M2 east (walk ends to places)
    path: [
      [48.8539, 2.2893], // Bir-Hakeim
      [48.8575, 2.2858], // Passy
      [48.863, 2.2875], // Trocadéro
      [48.8712, 2.2928], // Kléber
      [48.8738, 2.295], // Étoile
      [48.8755, 2.305], // Ternes
      [48.878, 2.314], // Courcelles
      [48.882, 2.3275], // Villiers
      [48.8835, 2.333], // Rome
      [48.8838, 2.338], // Place de Clichy
      [48.8828, 2.3499], // Pigalle
    ],
    label: 'M6 + M2',
  },
];

/**
 * Day 5 — Right bank + Louvre + L6 scenic ride + Montparnasse.
 */
const day5: ItineraryLegDef[] = [
  { from: 'par-palais-royal', to: 'par-bohemia', mode: 'walk' },
  {
    from: 'par-bohemia',
    to: 'par-bnf',
    mode: 'transit',
    line: 'm14',
    fromStation: 'pyramides',
    toStation: 'bibliotheque',
    label: 'M14',
  },
  {
    from: 'par-bnf',
    to: 'par-chatelet',
    mode: 'transit',
    line: 'm14',
    fromStation: 'bibliotheque',
    toStation: 'chatelet',
    label: 'M14',
  },
  { from: 'par-chatelet', to: 'par-saint-eustache', mode: 'walk' },
  { from: 'par-saint-eustache', to: 'par-montorgueil', mode: 'walk' },
  { from: 'par-montorgueil', to: 'par-pompidou', mode: 'walk' },
  { from: 'par-pompidou', to: 'par-amorino', mode: 'walk' },
  {
    from: 'par-amorino',
    to: 'par-madeleine',
    mode: 'transit',
    line: 'm14',
    fromStation: 'chatelet',
    toStation: 'madeleine',
    label: 'M14',
  },
  { from: 'par-madeleine', to: 'par-jeffrey-cagnes', mode: 'walk' },
  { from: 'par-jeffrey-cagnes', to: 'par-louvre', mode: 'walk' },
  {
    from: 'par-louvre',
    to: 'par-metro-6',
    mode: 'transit',
    line: 'm1',
    fromStation: 'palais-royal',
    toStation: 'etoile',
    label: 'M1 → M6',
  },
  {
    // Ride Line 6 elevated toward Montparnasse / Gaîté
    from: 'par-metro-6',
    to: 'par-bakery-gaite',
    mode: 'transit',
    line: 'm6',
    fromStation: 'bir-hakeim',
    toStation: 'montparnasse',
    label: 'M6',
  },
  { from: 'par-bakery-gaite', to: 'par-montparnasse', mode: 'walk' },
  {
    from: 'par-montparnasse',
    to: 'par-entrecote',
    mode: 'transit',
    line: 'm6',
    fromStation: 'montparnasse',
    toStation: 'etoile',
    label: 'M6',
  },
];

/**
 * Day 6 — Monceau → Marais → Vincennes → Train Bleu (Gare de Lyon).
 */
const day6: ItineraryLegDef[] = [
  {
    from: 'par-monceau',
    to: 'par-bastille',
    mode: 'transit',
    line: 'm1',
    // Station spine only: M2 west to Étoile then M1 east to Bastille
    path: [
      [48.8805, 2.322], // Monceau (M2)
      [48.878, 2.314], // Courcelles
      [48.8755, 2.305], // Ternes
      [48.8738, 2.295], // Étoile
      [48.872, 2.3006], // George V
      [48.8691, 2.3098], // FDR
      [48.8676, 2.3135], // Clemenceau
      [48.8656, 2.3211], // Concorde
      [48.8636, 2.3303], // Tuileries
      [48.8625, 2.3364], // Palais Royal
      [48.8584, 2.347], // Châtelet
      [48.8573, 2.3517], // Hôtel de Ville
      [48.8553, 2.3609], // Saint-Paul
      [48.8532, 2.3691], // Bastille
    ],
    label: 'M2 + M1',
  },
  { from: 'par-bastille', to: 'par-vosges', mode: 'walk' },
  { from: 'par-vosges', to: 'par-chez-janou', mode: 'walk' },
  {
    from: 'par-chez-janou',
    to: 'par-vincennes-town',
    mode: 'transit',
    line: 'm1',
    fromStation: 'bastille',
    toStation: 'chateau-vincennes',
    label: 'M1',
  },
  {
    from: 'par-vincennes-town',
    to: 'par-train-bleu',
    mode: 'transit',
    line: 'm1',
    fromStation: 'chateau-vincennes',
    toStation: 'gare-lyon',
    label: 'M1',
  },
];

/**
 * Day 7 — Disneyland Paris full day (all stops in Chessy cluster).
 * RER A from central Paris is described on the first stop note; on-site hops are walks.
 */
const day7: ItineraryLegDef[] = [
  { from: 'par-disneyland', to: 'par-bella-notte', mode: 'walk' },
  { from: 'par-bella-notte', to: 'par-disneyland', mode: 'walk' },
  { from: 'par-disneyland', to: 'par-mcdonalds-disney', mode: 'walk' },
  { from: 'par-mcdonalds-disney', to: 'par-disneyland', mode: 'walk' },
];

/** day.id → ordered legs between primary stops (default arrival when day has variants) */
export const parisDayLegsById: Record<string, ItineraryLegDef[]> = {
  'paris-d1': day1,
  'paris-d1:cdg': day1Cdg,
  'paris-d2': day2,
  'paris-d3': day3,
  'paris-d4': day4,
  'paris-d5': day5,
  'paris-d6': day6,
  'paris-d7': day7,
};

/**
 * Legs for a day. When the day has arrival variants, pass `arrivalId`
 * (e.g. `'cdg'`) to load the alternate route; default / `'ory'` uses `dayId`.
 */
export function legsForDay(
  dayId: string,
  arrivalId?: string | null,
): ItineraryLegDef[] {
  if (arrivalId && arrivalId !== 'ory' && arrivalId !== 'default') {
    const keyed = parisDayLegsById[`${dayId}:${arrivalId}`];
    if (keyed) return keyed;
  }
  return parisDayLegsById[dayId] ?? [];
}
