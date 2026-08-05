/**
 * City itinerary view: day cards → multi-modal map route (walk + transit).
 * Timeline hover/click syncs highlight + select on the map.
 */

import { getTravelMapHandle } from './travel-map';
import {
  buildItineraryRoute,
  buildItineraryRoutePreview,
} from './travel-itinerary-route';
import type { ItineraryLegDef } from '../data/travel-itinerary-legs';
import type { PlaceCoord } from './travel-itinerary-route';

type Locale = 'en' | 'pt-BR';

type RouteStopMeta = {
  placeId: string;
  slot: string;
  optional?: boolean;
  lat?: number;
  lng?: number;
};

function locale(): Locale {
  return document.documentElement.dataset.travelLocale === 'pt-BR'
    ? 'pt-BR'
    : 'en';
}

function parseJsonArray<T>(raw: string | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** Google Maps multi-stop directions (path form — works well with many points). */
export function googleMapsDirUrl(
  coords: Array<{ lat: number; lng: number }>,
): string | null {
  if (coords.length < 2) return null;
  const path = coords
    .map((c) => `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`)
    .join('/');
  return `https://www.google.com/maps/dir/${path}`;
}

export function bootTravelItinerary(): void {
  const root = document.querySelector<HTMLElement>('[data-travel-itinerary]');
  if (!root) return;
  if (root.dataset.itineraryBound === '1') return;
  root.dataset.itineraryBound = '1';

  const mapEl = document.querySelector<HTMLElement>(
    '[data-travel-map][data-mode="places"]',
  );

  let abort: AbortController | null = null;
  let activeDayId: string | null = null;
  /** Temporary single-leg (or stop) paint while hovering timeline without day route on. */
  let hoverPreview = false;
  let hoverPreviewDayId: string | null = null;
  /**
   * Mobile day-slider: swipe changes day and draws it on the map.
   * Turns off when the user manually deactivates a day; later slides stay off
   * until they manually turn a day on again.
   */
  let autoRouteOnSlide = true;

  const dayCards = () =>
    Array.from(root.querySelectorAll<HTMLElement>('[data-travel-day]'));

  const routeStopsForCard = (card: HTMLElement): RouteStopMeta[] => {
    const meta = parseJsonArray<RouteStopMeta>(card.dataset.routeStops);
    if (meta.length) return meta;
    // Fallback: ids only, treat as always-on
    return parseJsonArray<string>(card.dataset.routeIds).map((placeId) => ({
      placeId,
      slot: 'other',
    }));
  };

  /** Coords from day-card routeStops JSON (SSR) — no map pins required. */
  const placesFromRouteMeta = (card: HTMLElement): Map<string, PlaceCoord> => {
    const out = new Map<string, PlaceCoord>();
    for (const s of routeStopsForCard(card)) {
      if (
        typeof s.lat === 'number' &&
        Number.isFinite(s.lat) &&
        typeof s.lng === 'number' &&
        Number.isFinite(s.lng)
      ) {
        out.set(s.placeId, { id: s.placeId, lat: s.lat, lng: s.lng });
      }
    }
    return out;
  };

  const placesFromMap = (): Map<string, PlaceCoord> => {
    const map = getTravelMapHandle();
    const out = new Map<string, PlaceCoord>();
    dayCards().forEach((card) => {
      // Prefer authored coords on the card (available immediately)
      for (const [id, p] of placesFromRouteMeta(card)) {
        if (!out.has(id)) out.set(id, p);
      }
      if (!map) return;
      const ids = parseJsonArray<string>(card.dataset.routeIds);
      for (const id of ids) {
        if (out.has(id)) continue;
        const pin = map.getPin(id);
        if (pin) out.set(id, { id, lat: pin.lat, lng: pin.lng });
      }
    });
    return out;
  };

  const ensurePlaces = (
    ids: string[],
    places: Map<string, PlaceCoord>,
    card?: HTMLElement | null,
  ): Map<string, PlaceCoord> => {
    if (card) {
      for (const [id, p] of placesFromRouteMeta(card)) {
        if (!places.has(id)) places.set(id, p);
      }
    }
    const map = getTravelMapHandle();
    for (const id of ids) {
      if (places.has(id)) continue;
      const pin = map?.getPin(id);
      if (pin) places.set(id, { id, lat: pin.lat, lng: pin.lng });
    }
    return places;
  };

  const setRouteBtnChrome = (
    btn: HTMLButtonElement,
    state: 'idle' | 'on' | 'loading',
  ) => {
    const en = btn.getAttribute('data-i18n-en') || 'Show day on map';
    const pt = btn.getAttribute('data-i18n-pt') || 'Ver dia no mapa';
    const onEn = root.dataset.onMapEn || 'On map';
    const onPt = root.dataset.onMapPt || 'No mapa';
    const loadingEn = 'Drawing…';
    const loadingPt = 'Traçando…';

    btn.classList.toggle('is-on-map', state === 'on');
    btn.classList.toggle('is-loading', state === 'loading');
    btn.disabled = state === 'loading';
    btn.setAttribute('aria-pressed', state === 'on' ? 'true' : 'false');

    let label = locale() === 'pt-BR' ? pt : en;
    if (state === 'on') label = locale() === 'pt-BR' ? onPt : onEn;
    else if (state === 'loading')
      label = locale() === 'pt-BR' ? loadingPt : loadingEn;

    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  };

  const clearActiveDays = () => {
    dayCards().forEach((card) => {
      card.classList.remove('is-route-active', 'is-route-loading');
      const btn = card.querySelector<HTMLButtonElement>('[data-day-route]');
      if (btn) setRouteBtnChrome(btn, 'idle');
    });
  };

  const markDayActive = (card: HTMLElement, loading = false) => {
    clearActiveDays();
    card.classList.add('is-route-active');
    if (loading) card.classList.add('is-route-loading');
    const btn = card.querySelector<HTMLButtonElement>('[data-day-route]');
    if (btn) setRouteBtnChrome(btn, loading ? 'loading' : 'on');
  };

  const clearItineraryMap = () => {
    abort?.abort();
    abort = null;
    activeDayId = null;
    hoverPreview = false;
    hoverPreviewDayId = null;
    getTravelMapHandle()?.setItineraryRoute(null);
    mapEl?.dispatchEvent(
      new CustomEvent('travel:set-route', {
        bubbles: true,
        detail: { placeIds: [] },
      }),
    );
  };

  const setStopListActive = (id: string | null) => {
    root
      .querySelectorAll<HTMLElement>('.travel-day-card__stop[data-place-id]')
      .forEach((el) => {
        el.classList.toggle(
          'is-map-active',
          Boolean(id) && el.dataset.placeId === id,
        );
        el.querySelector('.travel-pin')?.classList.toggle(
          'is-active',
          Boolean(id) && el.dataset.placeId === id,
        );
      });
  };

  const storageKeyForCard = (card: HTMLElement) => {
    const dayId = card.dataset.travelDay || '';
    const city = card.dataset.citySlug || '';
    return `travel-arrival:${city}:${dayId}`;
  };

  /** Slots currently enabled for the map (period switches). */
  const enabledSlotsForCard = (card: HTMLElement): Set<string> => {
    const enabled = new Set<string>([
      'morning',
      'afternoon',
      'evening',
      'other',
    ]);
    // Prefer visible arrival panel's switches
    const panel =
      card.querySelector<HTMLElement>(
        '[data-arrival-panel]:not([hidden])',
      ) ?? card;
    panel
      .querySelectorAll<HTMLElement>('[data-slot-map-toggle]')
      .forEach((el) => {
        const slot = el.getAttribute('data-slot-map-toggle');
        if (!slot) return;
        const on = el.getAttribute('aria-checked') !== 'false';
        if (!on) enabled.delete(slot);
      });
    return enabled;
  };

  const slotIsOnMap = (enabled: Set<string>, slot: string): boolean =>
    enabled.has(slot) || slot === 'other';

  /**
   * Primary stop ids filtered by enabled period switches.
   * Preserves order and intentional revisits.
   * Note: filtering only hides those stops — it does not rewire the route
   * (see legsForEnabledRoute: no bridges across disabled periods).
   */
  const filteredStopIds = (card: HTMLElement): string[] => {
    const enabled = enabledSlotsForCard(card);
    const stops = routeStopsForCard(card);
    if (!stops.length) return parseJsonArray<string>(card.dataset.routeIds);
    return stops
      .filter((s) => slotIsOnMap(enabled, s.slot))
      .map((s) => s.placeId);
  };

  /**
   * Route geometry for the day with period switches applied.
   * Only keeps original consecutive pairs where BOTH ends stay enabled —
   * never invents a leg that jumps a disabled period (e.g. morning → evening
   * when afternoon is off). The itinerary sequence is unchanged; off periods
   * are visual/map hide only.
   */
  const legsForEnabledRoute = (
    card: HTMLElement,
    allLegs: ItineraryLegDef[],
  ): { stopIds: string[]; legs: ItineraryLegDef[] } => {
    const enabled = enabledSlotsForCard(card);
    const stops = routeStopsForCard(card);

    if (!stops.length) {
      const stopIds = parseJsonArray<string>(card.dataset.routeIds);
      const legs: ItineraryLegDef[] = [];
      for (let i = 0; i < stopIds.length - 1; i++) {
        const from = stopIds[i]!;
        const to = stopIds[i + 1]!;
        legs.push(
          allLegs.find((l) => l.from === from && l.to === to) ?? {
            from,
            to,
            mode: 'walk' as const,
          },
        );
      }
      return { stopIds, legs };
    }

    const stopIds = stops
      .filter((s) => slotIsOnMap(enabled, s.slot))
      .map((s) => s.placeId);

    const legs: ItineraryLegDef[] = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i]!;
      const b = stops[i + 1]!;
      if (!slotIsOnMap(enabled, a.slot) || !slotIsOnMap(enabled, b.slot)) {
        continue;
      }
      legs.push(
        allLegs.find((l) => l.from === a.placeId && l.to === b.placeId) ?? {
          from: a.placeId,
          to: b.placeId,
          mode: 'walk' as const,
        },
      );
    }
    return { stopIds, legs };
  };

  const gmapsUrlForStops = (
    stopIds: string[],
    card?: HTMLElement | null,
  ): string | null => {
    const places = ensurePlaces(stopIds, placesFromMap(), card);
    const coords = stopIds
      .map((id) => places.get(id))
      .filter((p): p is PlaceCoord => Boolean(p))
      .map((p) => ({ lat: p.lat, lng: p.lng }));
    return googleMapsDirUrl(coords);
  };

  const applyGmapsControl = (
    el: HTMLElement,
    stopIds: string[],
    card?: HTMLElement | null,
  ) => {
    const url = gmapsUrlForStops(stopIds, card);
    if (url) {
      el.dataset.gmapsUrl = url;
      el.removeAttribute('aria-disabled');
      el.classList.remove('is-disabled');
      if (el instanceof HTMLAnchorElement) el.href = url;
    } else {
      delete el.dataset.gmapsUrl;
      el.setAttribute('aria-disabled', 'true');
      el.classList.add('is-disabled');
      if (el instanceof HTMLAnchorElement) el.href = '#';
    }
  };

  const syncGmapsHref = (card: HTMLElement) => {
    const dayLink = card.querySelector<HTMLElement>('[data-day-gmaps]');
    if (dayLink) applyGmapsControl(dayLink, filteredStopIds(card), card);

    // Per-period Google Maps (left icon on each expandable)
    const stops = routeStopsForCard(card);
    const panel =
      card.querySelector<HTMLElement>(
        '[data-arrival-panel]:not([hidden])',
      ) ?? card;
    panel
      .querySelectorAll<HTMLElement>('[data-slot-gmaps]')
      .forEach((btn) => {
        const slot = btn.getAttribute('data-slot-gmaps');
        if (!slot) return;
        const ids = stops
          .filter((s) => s.slot === slot)
          .map((s) => s.placeId);
        applyGmapsControl(btn, ids, card);
      });
  };

  const applyArrival = (
    card: HTMLElement,
    arrivalId: string,
    opts?: { persist?: boolean; redrawRoute?: boolean },
  ) => {
    const panels = Array.from(
      card.querySelectorAll<HTMLElement>('[data-arrival-panel]'),
    );
    if (!panels.length) return;

    const panel = panels.find((p) => p.dataset.arrivalPanel === arrivalId);
    if (!panel) return;

    for (const p of panels) {
      p.hidden = p !== panel;
    }

    card.dataset.arrival = arrivalId;
    card.dataset.routeIds = panel.dataset.routeIds || '[]';
    card.dataset.routeStops = panel.dataset.routeStops || '[]';
    card.dataset.legs = panel.dataset.legs || '[]';
    card.dataset.allIds = panel.dataset.allIds || '[]';
    // New arrival = different walk endpoints; allow prefetch again
    delete card.dataset.walkPrefetch;

    // Header title: “N stops” for the active arrival route
    const nEl = card.querySelector<HTMLElement>('[data-day-stop-n]');
    if (nEl) {
      try {
        const ids = JSON.parse(panel.dataset.routeIds || '[]') as unknown[];
        nEl.textContent = String(Array.isArray(ids) ? ids.length : 0);
      } catch {
        nEl.textContent = '0';
      }
    }

    card
      .querySelectorAll<HTMLButtonElement>('[data-arrival-opt]')
      .forEach((btn) => {
        const on = btn.dataset.arrivalOpt === arrivalId;
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
        btn.tabIndex = on ? 0 : -1;
      });

    setStopListActive(null);
    syncGmapsHref(card);

    if (opts?.persist !== false) {
      try {
        localStorage.setItem(storageKeyForCard(card), arrivalId);
      } catch {
        /* ignore quota / private mode */
      }
    }

    const shouldRedraw =
      opts?.redrawRoute !== false &&
      card.classList.contains('is-route-active') &&
      !card.classList.contains('is-route-loading');
    if (shouldRedraw) {
      void showDayRoute(card);
    }
  };

  const showDayRoute = async (
    card: HTMLElement,
    opts?: { fit?: boolean; scrollIntoView?: boolean },
  ) => {
    const dayId = card.dataset.travelDay || '';
    const allLegs = parseJsonArray<ItineraryLegDef>(card.dataset.legs);
    const { stopIds, legs } = legsForEnabledRoute(card, allLegs);
    if (stopIds.length < 1) return;

    const fit = opts?.fit !== false;
    /** Page scroll to map — off for mobile day-slider auto-activate */
    const scrollPage = opts?.scrollIntoView ?? fit;

    abort?.abort();
    abort = new AbortController();
    const signal = abort.signal;
    activeDayId = dayId;
    hoverPreview = false;
    hoverPreviewDayId = null;

    markDayActive(card, true);

    if (scrollPage) {
      document
        .querySelector('.travel__map-shell')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    mapEl?.dispatchEvent(
      new CustomEvent('travel:set-route', {
        bubbles: true,
        detail: { placeIds: [] },
      }),
    );

    try {
      const places = ensurePlaces(stopIds, placesFromMap(), card);
      const map = getTravelMapHandle();

      // 1) Instant paint — transit spines + straight walks (no network)
      const preview = buildItineraryRoutePreview(stopIds, legs, places);
      if (signal.aborted || activeDayId !== dayId) return;
      map?.setItineraryRoute({
        stopIds: preview.stopIds,
        segments: preview.segments,
        transfers: preview.transfers,
        fit,
      });
      // Route is already useful — drop loading chrome while OSRM refines walks
      markDayActive(card, false);

      // 2) Refine walks in parallel (session-cached OSRM) without re-fitting
      const built = await buildItineraryRoute(stopIds, legs, places, signal);
      if (signal.aborted || activeDayId !== dayId) return;

      map?.setItineraryRoute({
        stopIds: built.stopIds,
        segments: built.segments,
        transfers: built.transfers,
        fit: false,
      });
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      if (activeDayId !== dayId) return;
      // Preview may already be on the map — keep it, just clear loading chrome
      markDayActive(card, false);
    }
  };

  // Restore persisted arrival choice (e.g. ORY / CDG on Day 1)
  dayCards().forEach((card) => {
    if (card.dataset.hasArrivals !== '1') return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(storageKeyForCard(card));
    } catch {
      saved = null;
    }
    if (saved && card.querySelector(`[data-arrival-panel="${saved}"]`)) {
      applyArrival(card, saved, { persist: false, redrawRoute: false });
    } else {
      syncGmapsHref(card);
    }
  });
  dayCards().forEach((card) => {
    if (card.dataset.hasArrivals === '1') return;
    syncGmapsHref(card);
  });

  /** Warm OSRM walk cache so the refine pass after click is often free. */
  const prefetchDayWalks = (card: HTMLElement) => {
    if (card.dataset.walkPrefetch === '1') return;
    card.dataset.walkPrefetch = '1';
    const allLegs = parseJsonArray<ItineraryLegDef>(card.dataset.legs);
    const { stopIds, legs } = legsForEnabledRoute(card, allLegs);
    if (stopIds.length < 2 || legs.length < 1) return;
    const places = ensurePlaces(stopIds, placesFromMap(), card);
    void buildItineraryRoute(stopIds, legs, places).catch(() => {
      card.dataset.walkPrefetch = '0';
    });
  };

  // Prefetch on hover of the route button (pointer fine only)
  if (window.matchMedia('(pointer: fine)').matches) {
    root.addEventListener(
      'pointerenter',
      (e) => {
        const btn = (e.target as HTMLElement | null)?.closest?.(
          '[data-day-route]',
        );
        if (!btn || !root.contains(btn)) return;
        const card = btn.closest<HTMLElement>('[data-travel-day]');
        if (card) prefetchDayWalks(card);
      },
      true,
    );
  }

  const setSlotSwitch = (sw: HTMLElement, on: boolean) => {
    sw.setAttribute('aria-checked', on ? 'true' : 'false');
    const card = sw.closest<HTMLElement>('[data-travel-day]');
    const details = sw.closest<HTMLElement>('[data-day-slot]');
    if (details) {
      details.dataset.slotOnMap = on ? '1' : '0';
      details.classList.toggle('is-slot-off-map', !on);
    }
    const onEn =
      sw.getAttribute('data-i18n-en') || 'Show this period on the map';
    const onPt =
      sw.getAttribute('data-i18n-pt') || 'Mostrar este período no mapa';
    const offEn = root.dataset.slotOffMapEn || 'Hide this period from the map';
    const offPt =
      root.dataset.slotOffMapPt || 'Ocultar este período do mapa';
    const title =
      locale() === 'pt-BR' ? (on ? onPt : offPt) : on ? onEn : offEn;
    sw.title = title;
    sw.setAttribute('aria-label', title);
    if (card) {
      syncGmapsHref(card);
      if (
        card.classList.contains('is-route-active') &&
        !card.classList.contains('is-route-loading')
      ) {
        void showDayRoute(card, { fit: false });
      }
    }
  };

  /**
   * Capture-phase: intercept map/toggle clicks inside <summary> so they
   * don't toggle <details>, and apply the control action ourselves.
   */
  root.addEventListener(
    'click',
    (e) => {
      const t = e.target as HTMLElement | null;
      if (!t || !root.contains(t)) return;

      const sw = t.closest<HTMLElement>('[data-slot-map-switch]');
      if (sw && root.contains(sw)) {
        e.preventDefault();
        e.stopPropagation();
        const on = sw.getAttribute('aria-checked') !== 'false';
        setSlotSwitch(sw, !on);
        return;
      }

      const gmaps = t.closest<HTMLElement>(
        '[data-slot-gmaps], [data-day-gmaps]',
      );
      if (gmaps && root.contains(gmaps)) {
        e.preventDefault();
        e.stopPropagation();
        const card = gmaps.closest<HTMLElement>('[data-travel-day]');
        if (card) syncGmapsHref(card);
        if (gmaps.classList.contains('is-disabled')) return;
        const url =
          gmaps.dataset.gmapsUrl ||
          (gmaps instanceof HTMLAnchorElement ? gmaps.href : '');
        if (url && url !== '#' && !url.endsWith('/#')) {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      }
    },
    true,
  );

  // Keyboard: Space/Enter on custom switch
  root.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    const sw = t.closest?.('[data-slot-map-switch]');
    if (!sw || !root.contains(sw)) return;
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    e.stopPropagation();
    const on = sw.getAttribute('aria-checked') !== 'false';
    setSlotSwitch(sw as HTMLElement, !on);
  });

  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const arrivalBtn = target.closest<HTMLButtonElement>('[data-arrival-opt]');
    if (arrivalBtn && root.contains(arrivalBtn)) {
      e.preventDefault();
      e.stopPropagation();
      const card = arrivalBtn.closest<HTMLElement>('[data-travel-day]');
      const id = arrivalBtn.dataset.arrivalOpt;
      if (!card || !id || card.dataset.arrival === id) return;
      applyArrival(card, id);
      return;
    }

    const routeBtn = target.closest<HTMLButtonElement>('[data-day-route]');
    if (routeBtn && root.contains(routeBtn)) {
      e.preventDefault();
      e.stopPropagation();
      const card = routeBtn.closest<HTMLElement>('[data-travel-day]');
      if (!card) return;

      if (
        card.classList.contains('is-route-active') &&
        !card.classList.contains('is-route-loading')
      ) {
        // Manual off: stop auto-activating days on the mobile slider
        autoRouteOnSlide = false;
        clearActiveDays();
        clearItineraryMap();
        setStopListActive(null);
        return;
      }

      // Manual on: resume auto-activate when swiping days
      autoRouteOnSlide = true;
      void showDayRoute(card);
      return;
    }

    const stopBtn = target.closest<HTMLButtonElement>('[data-day-stop]');
    if (stopBtn && root.contains(stopBtn)) {
      e.preventDefault();
      e.stopPropagation();
      // Ignore stops in hidden arrival panels
      const panel = stopBtn.closest<HTMLElement>('[data-arrival-panel]');
      if (panel?.hidden) return;
      const id = stopBtn.dataset.placeId;
      if (!id) return;
      setStopListActive(id);
      getTravelMapHandle()?.select(id);
      document
        .querySelector('.travel__map-shell')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Arrow keys on arrival segment control
  root.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const btn = target.closest<HTMLButtonElement>('[data-arrival-opt]');
    if (!btn || !root.contains(btn)) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const card = btn.closest<HTMLElement>('[data-travel-day]');
    if (!card) return;
    const buttons = Array.from(
      card.querySelectorAll<HTMLButtonElement>('[data-arrival-opt]'),
    );
    const i = buttons.indexOf(btn);
    if (i < 0) return;
    const next =
      e.key === 'ArrowRight'
        ? buttons[(i + 1) % buttons.length]
        : buttons[(i - 1 + buttons.length) % buttons.length];
    const id = next?.dataset.arrivalOpt;
    if (!id) return;
    applyArrival(card, id);
    next?.focus();
  });

  const paintHoverLeg = (
    card: HTMLElement,
    fromId: string,
    toId: string,
    hopIndex?: number,
  ) => {
    const allLegs = parseJsonArray<ItineraryLegDef>(card.dataset.legs);
    const leg =
      allLegs.find((l) => l.from === fromId && l.to === toId) ??
      ({ from: fromId, to: toId, mode: 'walk' as const } satisfies ItineraryLegDef);
    const stopIds = [fromId, toId];
    const places = ensurePlaces(stopIds, placesFromMap(), card);
    const preview = buildItineraryRoutePreview(stopIds, [leg], places);
    const map = getTravelMapHandle();
    map?.setItineraryRoute({
      stopIds: preview.stopIds,
      segments: preview.segments,
      transfers: preview.transfers,
      fit: false,
    });
    hoverPreview = true;
    hoverPreviewDayId = card.dataset.travelDay || null;
    map?.highlightItineraryLeg(
      fromId,
      toId,
      'timeline',
      hopIndex != null && Number.isFinite(hopIndex) ? hopIndex : undefined,
    );
    map?.highlight(fromId);
  };

  const highlightTransfer = (transfer: Element | null) => {
    if (!(transfer instanceof HTMLElement)) return;
    const fromId = transfer.getAttribute('data-leg-from');
    const toId = transfer.getAttribute('data-leg-to');
    if (!fromId || !toId) return;
    const hopRaw = transfer.getAttribute('data-leg-hop');
    const hopIndex =
      hopRaw != null && hopRaw !== '' ? Number(hopRaw) : undefined;
    transfer.classList.add('is-hover');

    const card = transfer.closest<HTMLElement>('[data-travel-day]');
    const dayRouteOn =
      card?.classList.contains('is-route-active') &&
      !card.classList.contains('is-route-loading');

    if (dayRouteOn) {
      getTravelMapHandle()?.highlightItineraryLeg(
        fromId,
        toId,
        'timeline',
        hopIndex != null && Number.isFinite(hopIndex) ? hopIndex : undefined,
      );
      getTravelMapHandle()?.highlight(fromId);
      return;
    }

    // Day route not on map — still paint this place→place trajectory
    if (card) {
      paintHoverLeg(
        card,
        fromId,
        toId,
        hopIndex != null && Number.isFinite(hopIndex) ? hopIndex : undefined,
      );
    }
  };

  const clearTransferHighlight = (transfer: Element | null) => {
    if (!(transfer instanceof HTMLElement)) return;
    transfer.classList.remove('is-hover');
    if (hoverPreview) {
      // Don't clear if the day route was activated meanwhile
      const card = transfer.closest<HTMLElement>('[data-travel-day]');
      if (card?.classList.contains('is-route-active')) {
        hoverPreview = false;
        hoverPreviewDayId = null;
        getTravelMapHandle()?.highlightItineraryLeg(null);
        getTravelMapHandle()?.highlight(null);
        return;
      }
      clearItineraryMap();
      return;
    }
    getTravelMapHandle()?.highlightItineraryLeg(null);
    getTravelMapHandle()?.highlight(null);
  };

  // Hover / focus → map highlight (fine pointer for hover)
  if (window.matchMedia('(pointer: fine)').matches) {
    root.addEventListener('pointerover', (e) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;

      // Transfer leg: emphasize that place→place segment on the day route
      const transfer = t.closest?.('.travel-day-card__transfer[data-leg-from]');
      if (transfer && root.contains(transfer)) {
        // Ignore transfers in hidden arrival panels
        const panel = transfer.closest<HTMLElement>('[data-arrival-panel]');
        if (panel?.hidden) return;
        highlightTransfer(transfer);
        return;
      }

      const stop = t.closest?.('.travel-day-card__stop[data-place-id]');
      if (!stop || !root.contains(stop)) return;
      const panel = stop.closest<HTMLElement>('[data-arrival-panel]');
      if (panel?.hidden) return;
      const id = stop.dataset.placeId;
      if (!id) return;
      stop.classList.add('is-hover');
      stop.querySelector('.travel-pin')?.classList.add('is-active');
      // Brighten map segments that touch this stop (if day route is on)
      getTravelMapHandle()?.highlightItineraryPlace(id);
      getTravelMapHandle()?.highlight(id);
    });

    root.addEventListener('pointerout', (e) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const related = e.relatedTarget as Node | null;

      const transfer = t.closest?.('.travel-day-card__transfer[data-leg-from]');
      if (transfer && root.contains(transfer)) {
        if (related && transfer.contains(related)) return;
        clearTransferHighlight(transfer);
        return;
      }

      const stop = t.closest?.('.travel-day-card__stop[data-place-id]');
      if (!stop || !root.contains(stop)) return;
      if (related && stop.contains(related)) return;
      stop.classList.remove('is-hover');
      getTravelMapHandle()?.highlightItineraryPlace(null);
      if (!stop.classList.contains('is-map-active')) {
        stop.querySelector('.travel-pin')?.classList.remove('is-active');
      }
      // Clear hover highlight unless something is selected
      getTravelMapHandle()?.highlight(null);
    });
  }

  root.addEventListener('focusin', (e) => {
    const transfer = (e.target as HTMLElement | null)?.closest?.(
      '.travel-day-card__transfer[data-leg-from]',
    );
    if (transfer && root.contains(transfer)) highlightTransfer(transfer);
  });
  root.addEventListener('focusout', (e) => {
    const transfer = (e.target as HTMLElement | null)?.closest?.(
      '.travel-day-card__transfer[data-leg-from]',
    );
    if (!transfer || !root.contains(transfer)) return;
    const related = e.relatedTarget as Node | null;
    if (related && transfer.contains(related)) return;
    clearTransferHighlight(transfer);
  });

  // Keep list in sync when pin/panel selection changes
  mapEl?.addEventListener('travel:select', (e: Event) => {
    const id =
      (e as CustomEvent<{ id: string | null }>).detail?.id ?? null;
    setStopListActive(id);
  });

  const mo = new MutationObserver(() => {
    const active = root.querySelector<HTMLElement>(
      '[data-travel-day].is-route-active:not(.is-route-loading)',
    );
    if (active) markDayActive(active, false);
  });
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-travel-locale'],
  });

  // —— Mobile day slider: swipe day → activate route on map ——
  const daysTrack = root.querySelector<HTMLElement>(
    '.travel-city__itinerary-days',
  );
  const mobileItineraryMq = window.matchMedia('(max-width: 900px)');

  const isMobileItineraryLayout = () => mobileItineraryMq.matches;

  const nearestSlideDay = (): HTMLElement | null => {
    if (!daysTrack) return null;
    const cards = dayCards().filter((c) => daysTrack.contains(c));
    if (!cards.length) return null;
    const mid = daysTrack.scrollLeft + daysTrack.clientWidth / 2;
    let best = cards[0]!;
    let bestDist = Infinity;
    for (const card of cards) {
      const center = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = card;
      }
    }
    return best;
  };

  const activateSlideDay = (card: HTMLElement) => {
    const dayId = card.dataset.travelDay || '';
    if (!dayId) return;
    if (
      dayId === activeDayId &&
      card.classList.contains('is-route-active') &&
      !card.classList.contains('is-route-loading')
    ) {
      return;
    }
    void showDayRoute(card, { fit: true, scrollIntoView: false });
  };

  const syncSlideDayRoute = () => {
    if (!isMobileItineraryLayout()) return;
    if (!autoRouteOnSlide) return;
    if (root.hidden) return;
    const card = nearestSlideDay();
    if (!card) return;
    activateSlideDay(card);
  };

  let slideScrollTimer: number | null = null;
  const onDaysTrackScroll = () => {
    if (!isMobileItineraryLayout() || !autoRouteOnSlide) return;
    if (slideScrollTimer != null) window.clearTimeout(slideScrollTimer);
    // Debounce until snap settles (scrollend not everywhere)
    slideScrollTimer = window.setTimeout(() => {
      slideScrollTimer = null;
      syncSlideDayRoute();
    }, 120);
  };

  if (daysTrack) {
    daysTrack.addEventListener('scroll', onDaysTrackScroll, { passive: true });
    daysTrack.addEventListener(
      'scrollend',
      () => {
        if (slideScrollTimer != null) {
          window.clearTimeout(slideScrollTimer);
          slideScrollTimer = null;
        }
        syncSlideDayRoute();
      },
      { passive: true },
    );
  }

  // Entering itinerary view on mobile → (re)draw the visible day if auto is on.
  // List view clears the map overlay, so always force a redraw on re-enter.
  const panelVisibilityMo = new MutationObserver(() => {
    if (root.hidden) return;
    if (!isMobileItineraryLayout() || !autoRouteOnSlide) return;
    requestAnimationFrame(() => {
      const card = nearestSlideDay();
      if (!card) return;
      void showDayRoute(card, { fit: true, scrollIntoView: false });
    });
  });
  panelVisibilityMo.observe(root, {
    attributes: true,
    attributeFilter: ['hidden'],
  });

  // If itinerary is already visible on boot (restored view), sync once layout is ready
  if (!root.hidden && isMobileItineraryLayout() && autoRouteOnSlide) {
    requestAnimationFrame(() => {
      const card = nearestSlideDay();
      if (card) void showDayRoute(card, { fit: true, scrollIntoView: false });
    });
  }
}
