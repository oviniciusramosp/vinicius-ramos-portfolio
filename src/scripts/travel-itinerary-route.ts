/**
 * Build multi-modal itinerary geometry for a day:
 * - walk legs → FOSSGIS OSRM foot (dotted on map), with straight-line fallback
 * - transit legs → station→station spine (solid, line color) + walk place↔stations
 *
 * Performance: walk OSRM is the slow part (public HTTP). We:
 * 1. Expand all legs in parallel (not sequential await)
 * 2. Support a sync “preview” with straight walks so the map paints instantly
 * 3. Rely on session cache inside fetchWalkingRoute for repeat clicks
 */

import { fetchWalkingRoute } from './travel-route';
import {
  getTransitLine,
  haversineM,
  nearestStation,
  sliceLinePath,
  stationById,
  type LatLng,
} from '../data/travel-transit-lines';
import {
  lineBrandColor,
  type ItineraryLegDef,
  type ItineraryTransitHop,
} from '../data/travel-itinerary-legs';

export type ItinerarySegmentMode = 'walk' | 'transit';

export type ItinerarySegment = {
  mode: ItinerarySegmentMode;
  latlngs: LatLng[];
  /** Transit line id when known (for official line color) */
  lineId?: string;
  /**
   * Official metro/RER color when this is a real line segment.
   * Undefined → map uses default brand blue (no arbitrary multi-colors).
   */
  color?: string;
  label?: string;
  /** Logical place→place leg (for timeline hover highlight) */
  fromId?: string;
  toId?: string;
  /**
   * Hop index within a multi-line place→place leg (0-based).
   * Lets map/timeline highlight a single line (RER E vs M13) separately.
   */
  hopIndex?: number;
};

/** Station change between two transit hops (e.g. M14 → RER E). */
export type ItineraryTransferPoint = {
  lat: number;
  lng: number;
  fromColor: string;
  toColor: string;
  fromLabel?: string;
  toLabel?: string;
  fromId?: string;
  toId?: string;
  /** Hop index of the leg leaving this junction (previous hop). */
  hopIndex?: number;
};

export type PlaceCoord = {
  id: string;
  lat: number;
  lng: number;
};

export type BuiltItineraryRoute = {
  stopIds: string[];
  segments: ItinerarySegment[];
  /** Multi-line transfer dots (drawn on the map) */
  transfers?: ItineraryTransferPoint[];
};

export type BuildItineraryOptions = {
  signal?: AbortSignal;
  /**
   * `straight` — no network; paint transit + line-of-sight walks immediately.
   * `osrm` — full foot routing (cached + parallel). Default.
   */
  walkMode?: 'straight' | 'osrm';
};

/** Skip walk connectors shorter than this (already at the station). */
const WALK_MIN_M = 25;

function straight(a: PlaceCoord | LatLng, b: PlaceCoord | LatLng): LatLng[] {
  const al = Array.isArray(a) ? a : ([a.lat, a.lng] as LatLng);
  const bl = Array.isArray(b) ? b : ([b.lat, b.lng] as LatLng);
  return [al, bl];
}

async function walkPath(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  opts: BuildItineraryOptions,
): Promise<LatLng[]> {
  if (opts.walkMode === 'straight') {
    return straight(a as PlaceCoord, b as PlaceCoord);
  }
  const result = await fetchWalkingRoute(
    [
      { lat: a.lat, lng: a.lng, id: 'a', label: '' },
      { lat: b.lat, lng: b.lng, id: 'b', label: '' },
    ],
    opts.signal,
  );
  if (result?.latlngs?.length && result.latlngs.length >= 2) {
    return result.latlngs;
  }
  return straight(a as PlaceCoord, b as PlaceCoord);
}

function asCoord(p: { lat: number; lng: number }): {
  lat: number;
  lng: number;
} {
  return { lat: p.lat, lng: p.lng };
}

/** Official RATP/RER color for a hop/line (includes RER B/E fallbacks). */
function transitColor(lineId?: string): string | undefined {
  return lineBrandColor(lineId);
}

type ExpandResult = {
  segments: ItinerarySegment[];
  transfers: ItineraryTransferPoint[];
};

function hopColor(hop: ItineraryTransitHop): string {
  return transitColor(hop.line) ?? '#008fff';
}

function hopLabel(hop: ItineraryTransitHop): string {
  return hop.label ?? getTransitLine(hop.line)?.name ?? String(hop.line).toUpperCase();
}

/**
 * Multi-line transit: colored spines per hop + transfer dots at junctions.
 * Walk connectors place → first hop / last hop → place.
 */
async function expandMultiHop(
  leg: ItineraryLegDef,
  hops: ItineraryTransitHop[],
  from: PlaceCoord,
  to: PlaceCoord,
  opts: BuildItineraryOptions,
): Promise<ExpandResult> {
  const ends = { fromId: leg.from, toId: leg.to };
  const segs: ItinerarySegment[] = [];
  const transfers: ItineraryTransferPoint[] = [];
  const valid = hops.filter((h) => h.path && h.path.length >= 2);
  if (valid.length === 0) {
    return {
      segments: [
        {
          mode: 'transit',
          latlngs: straight(from, to),
          label: leg.label ?? 'Transit',
          ...ends,
        },
      ],
      transfers,
    };
  }

  const first = valid[0]!;
  const last = valid[valid.length - 1]!;
  const start = first.path[0]!;
  const end = last.path[last.path.length - 1]!;
  const startPt = { lat: start[0], lng: start[1] };
  const endPt = { lat: end[0], lng: end[1] };

  const [walkIn, walkOut] = await Promise.all([
    haversineM(from, startPt) < WALK_MIN_M
      ? Promise.resolve(null as LatLng[] | null)
      : walkPath(from, startPt, opts),
    haversineM(endPt, to) < WALK_MIN_M
      ? Promise.resolve(null as LatLng[] | null)
      : walkPath(endPt, to, opts),
  ]);

  if (walkIn) segs.push({ mode: 'walk', latlngs: walkIn, ...ends });

  // Precompute inter-hop walks (different stations) in parallel
  const interWalkTasks: Array<Promise<LatLng[] | null>> = [];
  for (let i = 0; i < valid.length - 1; i++) {
    const hop = valid[i]!;
    const next = valid[i + 1]!;
    const end = hop.path[hop.path.length - 1]!;
    const startNext = next.path[0]!;
    const a = { lat: end[0], lng: end[1] };
    const b = { lat: startNext[0], lng: startNext[1] };
    interWalkTasks.push(
      haversineM(a, b) < WALK_MIN_M
        ? Promise.resolve(null)
        : walkPath(a, b, opts),
    );
  }
  const interWalks = await Promise.all(interWalkTasks);

  for (let i = 0; i < valid.length; i++) {
    const hop = valid[i]!;
    const color = hopColor(hop);
    segs.push({
      mode: 'transit',
      latlngs: hop.path,
      lineId: hop.line,
      color,
      label: hopLabel(hop),
      hopIndex: i,
      ...ends,
    });

    const next = valid[i + 1];
    if (!next) continue;
    // Transfer at end of this hop
    const junction = hop.path[hop.path.length - 1]!;
    transfers.push({
      lat: junction[0],
      lng: junction[1],
      fromColor: color,
      toColor: hopColor(next),
      fromLabel: hopLabel(hop),
      toLabel: hopLabel(next),
      hopIndex: i,
      ...ends,
    });
    // Walk between stations when hops don't share a platform (e.g. St-Lazare → St-Augustin)
    const inter = interWalks[i];
    if (inter) segs.push({ mode: 'walk', latlngs: inter, ...ends });
  }

  if (walkOut) segs.push({ mode: 'walk', latlngs: walkOut, ...ends });
  return { segments: segs, transfers };
}

function expandMultiHopSync(
  leg: ItineraryLegDef,
  hops: ItineraryTransitHop[],
  from: PlaceCoord,
  to: PlaceCoord,
): ExpandResult {
  const ends = { fromId: leg.from, toId: leg.to };
  const segs: ItinerarySegment[] = [];
  const transfers: ItineraryTransferPoint[] = [];
  const valid = hops.filter((h) => h.path && h.path.length >= 2);
  if (valid.length === 0) {
    return {
      segments: [
        {
          mode: 'transit',
          latlngs: straight(from, to),
          label: leg.label ?? 'Transit',
          ...ends,
        },
      ],
      transfers,
    };
  }

  const first = valid[0]!;
  const last = valid[valid.length - 1]!;
  const start = first.path[0]!;
  const end = last.path[last.path.length - 1]!;

  pushWalkSync(segs, from, { lat: start[0], lng: start[1] }, ends);

  for (let i = 0; i < valid.length; i++) {
    const hop = valid[i]!;
    const color = hopColor(hop);
    segs.push({
      mode: 'transit',
      latlngs: hop.path,
      lineId: hop.line,
      color,
      label: hopLabel(hop),
      hopIndex: i,
      ...ends,
    });
    const next = valid[i + 1];
    if (!next) continue;
    const junction = hop.path[hop.path.length - 1]!;
    transfers.push({
      lat: junction[0],
      lng: junction[1],
      fromColor: color,
      toColor: hopColor(next),
      fromLabel: hopLabel(hop),
      toLabel: hopLabel(next),
      hopIndex: i,
      ...ends,
    });
    // Inter-station transfer walk (preview uses straight line)
    const startNext = next.path[0]!;
    pushWalkSync(
      segs,
      { lat: junction[0], lng: junction[1] },
      { lat: startNext[0], lng: startNext[1] },
      ends,
    );
  }

  pushWalkSync(segs, { lat: end[0], lng: end[1] }, to, ends);
  return { segments: segs, transfers };
}

/**
 * Transit = solid station spine only.
 * Walk = dotted place → board station, and alight station → place.
 */
async function expandLeg(
  leg: ItineraryLegDef,
  from: PlaceCoord,
  to: PlaceCoord,
  opts: BuildItineraryOptions,
): Promise<ExpandResult> {
  const ends = { fromId: leg.from, toId: leg.to };

  if (leg.mode === 'walk') {
    const latlngs = await walkPath(from, to, opts);
    return {
      segments: [{ mode: 'walk', latlngs, label: leg.label, ...ends }],
      transfers: [],
    };
  }

  // Multi-line (M14 + RER E, RER E + M13, …)
  if (leg.hops && leg.hops.length > 0) {
    return expandMultiHop(leg, leg.hops, from, to, opts);
  }

  // Authored single transit spine (stations / corridor only)
  if (leg.path && leg.path.length >= 2) {
    const segs: ItinerarySegment[] = [];
    const start = leg.path[0]!;
    const end = leg.path[leg.path.length - 1]!;
    const color = transitColor(leg.line);

    // Walk connectors in parallel for this transit leg
    const startPt = { lat: start[0], lng: start[1] };
    const endPt = { lat: end[0], lng: end[1] };
    const [walkIn, walkOut] = await Promise.all([
      haversineM(from, startPt) < WALK_MIN_M
        ? Promise.resolve(null as LatLng[] | null)
        : walkPath(from, startPt, opts),
      haversineM(endPt, to) < WALK_MIN_M
        ? Promise.resolve(null as LatLng[] | null)
        : walkPath(endPt, to, opts),
    ]);

    if (walkIn) {
      segs.push({ mode: 'walk', latlngs: walkIn, ...ends });
    }

    segs.push({
      mode: 'transit',
      latlngs: leg.path,
      lineId: color ? leg.line : undefined,
      color,
      label: leg.label ?? getTransitLine(leg.line ?? '')?.name,
      ...ends,
    });

    if (walkOut) {
      segs.push({ mode: 'walk', latlngs: walkOut, ...ends });
    }
    return { segments: segs, transfers: [] };
  }

  const line = leg.line ? getTransitLine(leg.line) : undefined;
  if (!line) {
    // Unknown network — solid default (no fake line color) + no fake stations
    return {
      segments: [
        {
          mode: 'transit',
          latlngs: straight(from, to),
          label: leg.label ?? 'Transit',
          ...ends,
        },
      ],
      transfers: [],
    };
  }

  const fromSt = leg.fromStation
    ? (stationById(line, leg.fromStation) ?? nearestStation(line, from))
    : nearestStation(line, from);
  const toSt = leg.toStation
    ? (stationById(line, leg.toStation) ?? nearestStation(line, to))
    : nearestStation(line, to);

  const metroPath = sliceLinePath(line, fromSt.id, toSt.id);
  const segs: ItinerarySegment[] = [];
  const fromStCoord = asCoord(fromSt);
  const toStCoord = asCoord(toSt);

  const [walkIn, walkOut] = await Promise.all([
    haversineM(from, fromStCoord) < WALK_MIN_M
      ? Promise.resolve(null as LatLng[] | null)
      : walkPath(from, fromStCoord, opts),
    haversineM(toStCoord, to) < WALK_MIN_M
      ? Promise.resolve(null as LatLng[] | null)
      : walkPath(toStCoord, to, opts),
  ]);

  if (walkIn) {
    segs.push({ mode: 'walk', latlngs: walkIn, ...ends });
  }

  const color = transitColor(line.id);
  segs.push({
    mode: 'transit',
    latlngs: metroPath.length >= 2 ? metroPath : straight(fromSt, toSt),
    lineId: color ? line.id : undefined,
    color,
    label: leg.label ?? line.name,
    ...ends,
  });

  if (walkOut) {
    segs.push({ mode: 'walk', latlngs: walkOut, ...ends });
  }

  return { segments: segs, transfers: [] };
}

/**
 * Instant geometry: transit spines + straight-line walks. No network.
 * Used for the first paint so “show on map” feels immediate.
 */
export function buildItineraryRoutePreview(
  stopIds: string[],
  legs: ItineraryLegDef[],
  places: Map<string, PlaceCoord>,
): BuiltItineraryRoute {
  // walkMode straight is sync in practice (no await to network), but expandLeg is async —
  // use a blocking path via the same expand with a flag by running microtasks is wrong.
  // Expand synchronously with a pure sync implementation instead.
  return buildItineraryRouteSync(stopIds, legs, places);
}

function buildItineraryRouteSync(
  stopIds: string[],
  legs: ItineraryLegDef[],
  places: Map<string, PlaceCoord>,
): BuiltItineraryRoute {
  const segments: ItinerarySegment[] = [];
  const transfers: ItineraryTransferPoint[] = [];

  // Expand only the provided legs — do not auto-pair consecutive stopIds.
  // Callers omit legs across disabled periods so the route stays discontinuous
  // instead of inventing a bridge (e.g. morning → evening when afternoon is off).
  for (const authored of legs) {
    const from = places.get(authored.from);
    const to = places.get(authored.to);
    if (!from || !to) continue;

    const expanded = expandLegSync(authored, from, to);
    segments.push(...expanded.segments);
    transfers.push(...expanded.transfers);
  }

  return { stopIds, segments, transfers };
}

function pushWalkSync(
  segs: ItinerarySegment[],
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  ends: { fromId: string; toId: string },
): void {
  if (haversineM(from, to) < WALK_MIN_M) return;
  segs.push({
    mode: 'walk',
    latlngs: straight(from as PlaceCoord, to as PlaceCoord),
    ...ends,
  });
}

function expandLegSync(
  leg: ItineraryLegDef,
  from: PlaceCoord,
  to: PlaceCoord,
): ExpandResult {
  const ends = { fromId: leg.from, toId: leg.to };

  if (leg.mode === 'walk') {
    return {
      segments: [
        {
          mode: 'walk',
          latlngs: straight(from, to),
          label: leg.label,
          ...ends,
        },
      ],
      transfers: [],
    };
  }

  if (leg.hops && leg.hops.length > 0) {
    return expandMultiHopSync(leg, leg.hops, from, to);
  }

  if (leg.path && leg.path.length >= 2) {
    const segs: ItinerarySegment[] = [];
    const start = leg.path[0]!;
    const end = leg.path[leg.path.length - 1]!;
    const color = transitColor(leg.line);

    pushWalkSync(segs, from, { lat: start[0], lng: start[1] }, ends);
    segs.push({
      mode: 'transit',
      latlngs: leg.path,
      lineId: color ? leg.line : undefined,
      color,
      label: leg.label ?? getTransitLine(leg.line ?? '')?.name,
      ...ends,
    });
    pushWalkSync(segs, { lat: end[0], lng: end[1] }, to, ends);
    return { segments: segs, transfers: [] };
  }

  const line = leg.line ? getTransitLine(leg.line) : undefined;
  if (!line) {
    return {
      segments: [
        {
          mode: 'transit',
          latlngs: straight(from, to),
          label: leg.label ?? 'Transit',
          ...ends,
        },
      ],
      transfers: [],
    };
  }

  const fromSt = leg.fromStation
    ? (stationById(line, leg.fromStation) ?? nearestStation(line, from))
    : nearestStation(line, from);
  const toSt = leg.toStation
    ? (stationById(line, leg.toStation) ?? nearestStation(line, to))
    : nearestStation(line, to);

  const metroPath = sliceLinePath(line, fromSt.id, toSt.id);
  const segs: ItinerarySegment[] = [];
  const color = transitColor(line.id);

  pushWalkSync(segs, from, asCoord(fromSt), ends);
  segs.push({
    mode: 'transit',
    latlngs: metroPath.length >= 2 ? metroPath : straight(fromSt, toSt),
    lineId: color ? line.id : undefined,
    color,
    label: leg.label ?? line.name,
    ...ends,
  });
  pushWalkSync(segs, asCoord(toSt), to, ends);
  return { segments: segs, transfers: [] };
}

/**
 * Build full day route geometry from an explicit legs list.
 * Legs may be discontinuous (gaps when a period switch is off) — only the
 * given legs are drawn; consecutive stopIds are never auto-paired.
 * Walk OSRM requests run in parallel across all legs (session-cached).
 */
export async function buildItineraryRoute(
  stopIds: string[],
  legs: ItineraryLegDef[],
  places: Map<string, PlaceCoord>,
  signalOrOpts?: AbortSignal | BuildItineraryOptions,
): Promise<BuiltItineraryRoute> {
  const opts: BuildItineraryOptions =
    signalOrOpts instanceof AbortSignal || signalOrOpts == null
      ? { signal: signalOrOpts ?? undefined, walkMode: 'osrm' }
      : { walkMode: 'osrm', ...signalOrOpts };

  if (opts.walkMode === 'straight') {
    return buildItineraryRouteSync(stopIds, legs, places);
  }

  const tasks: Array<Promise<ExpandResult>> = [];

  for (const authored of legs) {
    if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const from = places.get(authored.from);
    const to = places.get(authored.to);
    if (!from || !to) continue;
    tasks.push(expandLeg(authored, from, to, opts));
  }

  const parts = await Promise.all(tasks);
  if (opts.signal?.aborted) throw new DOMException('Aborted', 'AbortError');

  return {
    stopIds,
    segments: parts.flatMap((p) => p.segments),
    transfers: parts.flatMap((p) => p.transfers),
  };
}
