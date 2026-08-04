/**
 * Route planner UI over the city map:
 * - Add/remove stops from place cards
 * - Optional GPS origin ("my location") as first stop
 * - Walk preview via FOSSGIS OSRM foot (polyline + time)
 * - Transit → Google Maps deep link (accurate times)
 */

import { getTravelMapHandle } from './travel-map';
import {
  fetchWalkingRoute,
  formatRouteDistance,
  formatRouteDuration,
  getCurrentPosition,
  googleDirectionsUrl,
  isFarFromCity,
  isUserLocationStop,
  pointLabel,
  userLocationPoint,
  type RouteMode,
  type RoutePoint,
  type UserPosition,
} from './travel-route';

/** Manual “add to route” from place cards */
const MAX_STOPS = 8;
/** Curated day itineraries can load more (map badges + transit; Google URL caps mid-waypoints) */
const MAX_ITINERARY_STOPS = 20;

export type SetRouteDetail = {
  placeIds: string[];
  mode?: RouteMode;
  title?: { en: string; pt: string };
};

type Locale = 'en' | 'pt-BR';

function locale(): Locale {
  return document.documentElement.dataset.travelLocale === 'pt-BR'
    ? 'pt-BR'
    : 'en';
}

function t(en: string, pt: string): string {
  return locale() === 'pt-BR' ? pt : en;
}

function readLabels(el: HTMLElement) {
  return {
    addEn: el.dataset.addEn || 'Add to route',
    addPt: el.dataset.addPt || 'Adicionar à rota',
    removeEn: el.dataset.removeEn || 'Remove from route',
    removePt: el.dataset.removePt || 'Remover da rota',
    titleEn: el.dataset.titleEn || 'Route',
    titlePt: el.dataset.titlePt || 'Rota',
    walkEn: el.dataset.walkEn || 'Walk',
    walkPt: el.dataset.walkPt || 'A pé',
    transitEn: el.dataset.transitEn || 'Transit',
    transitPt: el.dataset.transitPt || 'Transporte',
    openEn: el.dataset.openEn || 'Open route in Google Maps',
    openPt: el.dataset.openPt || 'Abrir rota no Google Maps',
    needEn: el.dataset.needEn || 'Add at least 2 places',
    needPt: el.dataset.needPt || 'Adicione pelo menos 2 lugares',
    loadingEn: el.dataset.loadingEn || 'Calculating…',
    loadingPt: el.dataset.loadingPt || 'Calculando…',
    errorEn: el.dataset.errorEn || 'Could not preview walking route',
    errorPt: el.dataset.errorPt || 'Não foi possível pré-visualizar a rota a pé',
    transitHintEn:
      el.dataset.transitHintEn || 'Transit times open in Google Maps',
    transitHintPt:
      el.dataset.transitHintPt || 'Horários de transporte abrem no Google Maps',
    clearEn: el.dataset.clearEn || 'Clear route',
    clearPt: el.dataset.clearPt || 'Limpar rota',
    previewEn: el.dataset.previewEn || 'Walking preview',
    previewPt: el.dataset.previewPt || 'Prévia a pé',
    myLocEn: el.dataset.myLocEn || 'My location',
    myLocPt: el.dataset.myLocPt || 'Minha localização',
    startFromEn: el.dataset.startFromEn || 'Start from my location',
    startFromPt: el.dataset.startFromPt || 'Começar da minha localização',
    locatingEn: el.dataset.locatingEn || 'Finding your location…',
    locatingPt: el.dataset.locatingPt || 'Localizando…',
    locateDeniedEn: el.dataset.locateDeniedEn || 'Location permission denied',
    locateDeniedPt:
      el.dataset.locateDeniedPt || 'Permissão de localização negada',
    locateUnavailableEn:
      el.dataset.locateUnavailableEn || 'Could not get your location',
    locateUnavailablePt:
      el.dataset.locateUnavailablePt ||
      'Não foi possível obter sua localização',
    locateFarEn:
      el.dataset.locateFarEn ||
      'You seem far from this city. Walking routes may not make sense here.',
    locateFarPt:
      el.dataset.locateFarPt ||
      'Você parece estar longe desta cidade. Rotas a pé podem não fazer sentido aqui.',
  };
}

function pointFromCard(card: HTMLElement): RoutePoint | null {
  const id = card.dataset.placeId;
  if (!id) return null;
  const lat = Number(card.dataset.lat);
  const lng = Number(card.dataset.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    // Fallback: map pin dataset
    const pin = getTravelMapHandle()?.getPin(id);
    if (!pin) return null;
    return {
      id,
      lat: pin.lat,
      lng: pin.lng,
      label: pin.label,
      labelPt: pin.labelPt,
    };
  }
  const nameEl = card.querySelector<HTMLElement>('.travel-place-card__name');
  return {
    id,
    lat,
    lng,
    label: nameEl?.getAttribute('data-i18n-en') || nameEl?.textContent || id,
    labelPt: nameEl?.getAttribute('data-i18n-pt') || undefined,
  };
}

function pointFromMap(id: string): RoutePoint | null {
  const pin = getTravelMapHandle()?.getPin(id);
  if (!pin) return null;
  return {
    id,
    lat: pin.lat,
    lng: pin.lng,
    label: pin.label,
    labelPt: pin.labelPt,
  };
}

export function bootTravelRoute(): void {
  const hero = document.querySelector<HTMLElement>('.travel__map-hero');
  const mapEl = document.querySelector<HTMLElement>('[data-travel-map]');
  if (!hero || !mapEl) return;
  if (mapEl.dataset.mode !== 'places') return;
  if (hero.dataset.routeBound === '1') return;
  hero.dataset.routeBound = '1';

  const labels = readLabels(mapEl);

  const bar = document.createElement('div');
  bar.className = 'travel-route-bar';
  bar.hidden = true;
  bar.setAttribute('data-travel-route', '');
  bar.innerHTML = `
    <div class="travel-route-bar__head">
      <span class="travel-route-bar__title" data-route-title></span>
      <button type="button" class="travel-route-bar__clear" data-route-clear
        aria-label="">
        <span class="material-symbols-rounded" aria-hidden="true">close</span>
      </button>
    </div>
    <button type="button" class="travel-route-bar__from-me" data-route-from-me hidden>
      <span class="material-symbols-rounded" aria-hidden="true">my_location</span>
      <span data-route-from-me-label></span>
    </button>
    <ol class="travel-route-bar__stops" data-route-stops></ol>
    <div class="travel-route-bar__modes" role="group" data-route-modes>
      <button type="button" class="travel-route-bar__mode is-active" data-route-mode="walk">
        <span class="material-symbols-rounded" aria-hidden="true">directions_walk</span>
        <span data-route-mode-walk-label></span>
      </button>
      <button type="button" class="travel-route-bar__mode" data-route-mode="transit">
        <span class="material-symbols-rounded" aria-hidden="true">directions_transit</span>
        <span data-route-mode-transit-label></span>
      </button>
    </div>
    <p class="travel-route-bar__meta" data-route-meta></p>
    <a class="travel-route-bar__google" data-route-google
      target="_blank" rel="noopener noreferrer" hidden>
      <span class="material-symbols-rounded" aria-hidden="true">map</span>
      <span data-route-google-label></span>
    </a>
  `;
  hero.appendChild(bar);

  // Lightweight toast for locate status when the route bar is closed
  const toast = document.createElement('div');
  toast.className = 'travel-locate-toast';
  toast.hidden = true;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  hero.appendChild(toast);

  const stopsEl = bar.querySelector<HTMLOListElement>('[data-route-stops]')!;
  const metaEl = bar.querySelector<HTMLElement>('[data-route-meta]')!;
  const titleEl = bar.querySelector<HTMLElement>('[data-route-title]')!;
  const clearBtn = bar.querySelector<HTMLButtonElement>('[data-route-clear]')!;
  const fromMeBtn = bar.querySelector<HTMLButtonElement>('[data-route-from-me]')!;
  const fromMeLabel = bar.querySelector<HTMLElement>('[data-route-from-me-label]')!;
  const googleLink = bar.querySelector<HTMLAnchorElement>('[data-route-google]')!;
  const googleLabel = bar.querySelector<HTMLElement>('[data-route-google-label]')!;
  const walkLabel = bar.querySelector<HTMLElement>('[data-route-mode-walk-label]')!;
  const transitLabel = bar.querySelector<HTMLElement>(
    '[data-route-mode-transit-label]',
  )!;
  const modeBtns = Array.from(
    bar.querySelectorAll<HTMLButtonElement>('[data-route-mode]'),
  );

  let stops: RoutePoint[] = [];
  let mode: RouteMode = 'walk';
  let abort: AbortController | null = null;
  let seq = 0;
  let locating = false;
  let toastHideTimer = 0;
  /** Soft warning: GPS origin is far from this city */
  let originFar = false;
  /** Override title while a curated day route is loaded */
  let customTitle: { en: string; pt: string } | null = null;

  const hasUserOrigin = () => stops.some(isUserLocationStop);

  const cityCenter = (): UserPosition | null => {
    const lat = Number(mapEl.dataset.centerLat);
    const lng = Number(mapEl.dataset.centerLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  };

  const userIsFar = (pos: UserPosition) => {
    const city = cityCenter();
    return city ? isFarFromCity(pos, city) : false;
  };

  const applyI18nChrome = () => {
    const loc = locale();
    if (customTitle) {
      titleEl.textContent =
        loc === 'pt-BR' ? customTitle.pt : customTitle.en;
    } else {
      titleEl.textContent = loc === 'pt-BR' ? labels.titlePt : labels.titleEn;
    }
    clearBtn.setAttribute(
      'aria-label',
      loc === 'pt-BR' ? labels.clearPt : labels.clearEn,
    );
    clearBtn.title = loc === 'pt-BR' ? labels.clearPt : labels.clearEn;
    walkLabel.textContent = loc === 'pt-BR' ? labels.walkPt : labels.walkEn;
    transitLabel.textContent =
      loc === 'pt-BR' ? labels.transitPt : labels.transitEn;
    googleLabel.textContent = loc === 'pt-BR' ? labels.openPt : labels.openEn;
    googleLink.setAttribute(
      'aria-label',
      loc === 'pt-BR' ? labels.openPt : labels.openEn,
    );
    const fromMe = loc === 'pt-BR' ? labels.startFromPt : labels.startFromEn;
    fromMeLabel.textContent = fromMe;
    fromMeBtn.setAttribute('aria-label', fromMe);
    fromMeBtn.title = fromMe;
  };

  const emitLocateDone = () => {
    mapEl.dispatchEvent(
      new CustomEvent('travel:locate-done', { bubbles: true }),
    );
  };

  const locateErrorMessage = (code: string) => {
    if (code === 'denied') {
      return t(labels.locateDeniedEn, labels.locateDeniedPt);
    }
    return t(labels.locateUnavailableEn, labels.locateUnavailablePt);
  };

  const farMessage = () => t(labels.locateFarEn, labels.locateFarPt);

  const hideToast = () => {
    toast.hidden = true;
    toast.textContent = '';
    toast.dataset.kind = '';
  };

  const showToast = (
    text: string,
    kind: 'loading' | 'error' | 'hint' | 'ok' = 'ok',
    autoHideMs = 0,
  ) => {
    window.clearTimeout(toastHideTimer);
    toast.textContent = text;
    toast.dataset.kind = kind;
    toast.hidden = false;
    if (autoHideMs > 0) {
      toastHideTimer = window.setTimeout(hideToast, autoHideMs);
    }
  };

  const syncAddButtons = () => {
    const ids = new Set(stops.map((s) => s.id));
    document
      .querySelectorAll<HTMLButtonElement>('[data-route-add]')
      .forEach((btn) => {
        const card = btn.closest<HTMLElement>('[data-place-id]');
        const id = card?.dataset.placeId || btn.dataset.placeId;
        const on = id ? ids.has(id) : false;
        btn.classList.toggle('is-on-route', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        const en = on ? labels.removeEn : labels.addEn;
        const pt = on ? labels.removePt : labels.addPt;
        btn.setAttribute('data-i18n-en', en);
        btn.setAttribute('data-i18n-pt', pt);
        const labelSpan = btn.querySelector('[data-route-add-label]');
        if (labelSpan) {
          labelSpan.textContent = locale() === 'pt-BR' ? pt : en;
        }
        btn.title = locale() === 'pt-BR' ? pt : en;
        btn.setAttribute('aria-label', locale() === 'pt-BR' ? pt : en);
      });
  };

  const renderStops = () => {
    stopsEl.replaceChildren();
    const loc = locale();
    stops.forEach((stop, i) => {
      const li = document.createElement('li');
      const user = isUserLocationStop(stop);
      li.className = user
        ? 'travel-route-bar__stop travel-route-bar__stop--user'
        : 'travel-route-bar__stop';
      li.innerHTML = `
        <span class="travel-route-bar__stop-n">${
          user
            ? '<span class="material-symbols-rounded" aria-hidden="true">my_location</span>'
            : String(i + 1)
        }</span>
        <span class="travel-route-bar__stop-name"></span>
        <button type="button" class="travel-route-bar__stop-rm" data-route-rm="${stop.id}"
          aria-label="">
          <span class="material-symbols-rounded" aria-hidden="true">close</span>
        </button>
      `;
      const name = li.querySelector('.travel-route-bar__stop-name')!;
      name.textContent = pointLabel(stop, loc);
      const rm = li.querySelector<HTMLButtonElement>('[data-route-rm]')!;
      const rmLabel = loc === 'pt-BR' ? labels.removePt : labels.removeEn;
      rm.setAttribute('aria-label', rmLabel);
      rm.title = rmLabel;
      stopsEl.appendChild(li);
    });
  };

  const syncFromMeButton = () => {
    // Show when route is open and origin is not already GPS
    const show = stops.length > 0 && !hasUserOrigin();
    fromMeBtn.hidden = !show;
    fromMeBtn.disabled = locating;
  };

  const setMeta = (text: string, kind: 'idle' | 'loading' | 'ok' | 'error' | 'hint' = 'idle') => {
    metaEl.textContent = text;
    metaEl.dataset.kind = kind;
  };

  const previewStops = () =>
    stops.map((s) => ({
      id: s.id,
      lat: s.lat,
      lng: s.lng,
      kind: isUserLocationStop(s) ? ('user' as const) : ('place' as const),
    }));

  const pushMapPreview = async () => {
    const map = getTravelMapHandle();
    if (!map) return;

    const preview = previewStops();
    // Drop far flag if GPS origin was removed
    if (!hasUserOrigin()) originFar = false;

    if (stops.length < 2) {
      map.setRoutePreview(
        stops.length === 1
          ? { latlngs: null, stops: preview, fit: false }
          : null,
      );
      googleLink.hidden = true;
      googleLink.removeAttribute('href');
      if (stops.length === 0) {
        bar.hidden = true;
        return;
      }
      // Prefer distance warning over "need 2 places" when GPS is far
      if (originFar && hasUserOrigin()) {
        setMeta(farMessage(), 'hint');
      } else {
        setMeta(t(labels.needEn, labels.needPt), 'idle');
      }
      return;
    }

    bar.hidden = false;
    const gUrl = googleDirectionsUrl(stops, mode);
    if (gUrl) {
      googleLink.href = gUrl;
      googleLink.hidden = false;
    } else {
      googleLink.hidden = true;
    }

    if (mode === 'transit') {
      map.setRoutePreview({ latlngs: null, stops: preview, fit: true });
      setMeta(
        originFar
          ? farMessage()
          : t(labels.transitHintEn, labels.transitHintPt),
        'hint',
      );
      return;
    }

    // Walking preview — if origin is far, skip OSRM (often fails / nonsense)
    if (originFar && hasUserOrigin()) {
      map.setRoutePreview({ latlngs: null, stops: preview, fit: true });
      setMeta(farMessage(), 'hint');
      return;
    }

    abort?.abort();
    abort = new AbortController();
    const mySeq = ++seq;
    setMeta(t(labels.loadingEn, labels.loadingPt), 'loading');
    map.setRoutePreview({ latlngs: null, stops: preview, fit: false });

    try {
      const result = await fetchWalkingRoute(stops, abort.signal);
      if (mySeq !== seq) return;
      if (!result) {
        map.setRoutePreview({ latlngs: null, stops: preview, fit: true });
        setMeta(t(labels.errorEn, labels.errorPt), 'error');
        return;
      }
      map.setRoutePreview({
        latlngs: result.latlngs,
        stops: preview,
        fit: true,
      });
      const loc = locale();
      const dur = formatRouteDuration(result.durationSec, loc);
      const dist = formatRouteDistance(result.distanceM, loc);
      const previewLabel = loc === 'pt-BR' ? labels.previewPt : labels.previewEn;
      setMeta(`${previewLabel} · ${dur} · ${dist}`, 'ok');
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      if (mySeq !== seq) return;
      map.setRoutePreview({ latlngs: null, stops: preview, fit: true });
      setMeta(t(labels.errorEn, labels.errorPt), 'error');
    }
  };

  const refresh = () => {
    applyI18nChrome();
    bar.hidden = stops.length === 0;
    renderStops();
    syncAddButtons();
    syncFromMeButton();
    void pushMapPreview();
  };

  /**
   * Insert / refresh GPS as stop #1 (origin). Keeps place stops after it.
   * Caps total length at MAX_STOPS (drops last place if needed).
   */
  const setOriginFromUser = (point: RoutePoint, opts?: { far?: boolean }) => {
    const rest = stops.filter((s) => !isUserLocationStop(s));
    const next = [point, ...rest].slice(0, MAX_STOPS);
    stops = next;
    originFar = Boolean(opts?.far);
    refresh();
  };

  /**
   * Map locate control: show GPS on the map only (no route bar).
   * Route-bar "Start from my location": also set as stop #1.
   */
  const runLocate = async (asRouteOrigin: boolean) => {
    if (locating) return;
    locating = true;
    syncFromMeButton();
    hideToast();

    const routeOpen = stops.length > 0;
    if (asRouteOrigin || routeOpen) {
      // Feedback inside the existing route chrome
      if (asRouteOrigin) bar.hidden = false;
      setMeta(t(labels.locatingEn, labels.locatingPt), 'loading');
    } else {
      // Map control alone — toast, never open the planner
      showToast(t(labels.locatingEn, labels.locatingPt), 'loading');
    }

    try {
      const pos = await getCurrentPosition();
      const map = getTravelMapHandle();
      map?.setUserLocation(pos);
      map?.flyToUserLocation(15);
      const far = userIsFar(pos);

      if (asRouteOrigin) {
        setOriginFromUser(
          userLocationPoint(pos, {
            en: labels.myLocEn,
            pt: labels.myLocPt,
          }),
          { far },
        );
        hideToast();
      } else {
        // Marker only — do not open / alter the route
        if (far) {
          if (routeOpen) {
            setMeta(farMessage(), 'hint');
            hideToast();
          } else {
            showToast(farMessage(), 'hint', 5600);
          }
        } else if (routeOpen) {
          // Restore prior meta (need stops / walk preview / far / etc.)
          void pushMapPreview();
          hideToast();
        } else {
          hideToast();
        }
      }
    } catch (err) {
      const code = (err as Error)?.message || 'unavailable';
      const msg = locateErrorMessage(code);
      if (asRouteOrigin || routeOpen) {
        // Planner already open — keep it, surface error in meta
        setMeta(msg, 'error');
        hideToast();
      } else {
        // Map-only locate — toast, never open the planner
        showToast(msg, 'error', 4200);
      }
    } finally {
      locating = false;
      syncFromMeButton();
      emitLocateDone();
    }
  };

  const addStop = (point: RoutePoint) => {
    if (isUserLocationStop(point)) {
      setOriginFromUser(point);
      return;
    }
    if (stops.some((s) => s.id === point.id)) {
      // Toggle off if already present
      stops = stops.filter((s) => s.id !== point.id);
      refresh();
      return;
    }
    if (stops.length >= MAX_STOPS) return;
    stops = [...stops, point];
    refresh();
  };

  const removeStop = (id: string) => {
    stops = stops.filter((s) => s.id !== id);
    if (!hasUserOrigin()) originFar = false;
    refresh();
  };

  const clearRoute = (opts?: { emit?: boolean }) => {
    stops = [];
    originFar = false;
    customTitle = null;
    abort?.abort();
    getTravelMapHandle()?.setRoutePreview(null);
    refresh();
    if (opts?.emit !== false) {
      mapEl.dispatchEvent(
        new CustomEvent('travel:route-cleared', { bubbles: true }),
      );
    }
  };

  clearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Keep GPS marker if the user still wants orientation
    clearRoute();
  });

  /**
   * Load a curated stop list (day itinerary). Empty placeIds clears.
   * Defaults to transit — multi-arrondissement days are not walk previews.
   */
  const setRouteFromPlaceIds = (detail: SetRouteDetail) => {
    const ids = detail.placeIds ?? [];
    if (ids.length === 0) {
      clearRoute({ emit: true });
      return;
    }

    const next: RoutePoint[] = [];
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      const point = pointFromMap(id);
      if (!point) continue;
      next.push(point);
      if (next.length >= MAX_ITINERARY_STOPS) break;
    }

    if (next.length === 0) return;

    stops = next;
    originFar = false;
    customTitle = detail.title ?? null;
    mode = detail.mode ?? 'transit';
    modeBtns.forEach((b) => {
      const on = b.dataset.routeMode === mode;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    refresh();
  };

  mapEl.addEventListener('travel:set-route', (e: Event) => {
    const detail = (e as CustomEvent<SetRouteDetail>).detail;
    if (!detail) return;
    setRouteFromPlaceIds(detail);
  });

  fromMeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Explicit: use GPS as route origin (planner already open)
    void runLocate(true);
  });

  // Map locate control: show position only — never opens the route planner
  mapEl.addEventListener('travel:locate', () => {
    void runLocate(false);
  });

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const next = btn.dataset.routeMode as RouteMode | undefined;
      if (!next || next === mode) return;
      mode = next;
      modeBtns.forEach((b) => {
        const on = b.dataset.routeMode === mode;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      void pushMapPreview();
    });
  });

  stopsEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement | null)?.closest?.<HTMLButtonElement>(
      '[data-route-rm]',
    );
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const id = btn.dataset.routeRm;
    if (id) removeStop(id);
  });

  // Event delegation: add/remove from place cards (feed + panel clones)
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement | null)?.closest?.<HTMLButtonElement>(
      '[data-route-add]',
    );
    if (!btn) return;
    // Only on city travel page
    if (!document.querySelector('[data-travel-map][data-mode="places"]')) return;
    e.preventDefault();
    e.stopPropagation();

    const card = btn.closest<HTMLElement>('.travel-place-card[data-place-id]');
    const fromCard = card ? pointFromCard(card) : null;
    const id =
      fromCard?.id ||
      btn.dataset.placeId ||
      card?.dataset.placeId;
    if (!id) return;
    const point = fromCard || pointFromMap(id);
    if (!point) return;
    addStop(point);
  });

  // Re-sync button labels when panel opens (clone)
  mapEl.addEventListener('travel:select', () => {
    requestAnimationFrame(() => syncAddButtons());
  });

  // Locale switch (if travel i18n flips dataset)
  const mo = new MutationObserver(() => {
    applyI18nChrome();
    renderStops();
    syncAddButtons();
    // Re-format meta without re-fetch if already ok
    void pushMapPreview();
  });
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-travel-locale'],
  });

  applyI18nChrome();
  syncFromMeButton();
  modeBtns.forEach((b) => {
    b.setAttribute(
      'aria-pressed',
      b.dataset.routeMode === mode ? 'true' : 'false',
    );
  });
}
