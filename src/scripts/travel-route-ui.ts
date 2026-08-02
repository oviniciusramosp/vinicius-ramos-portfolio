/**
 * Route planner UI over the city map:
 * - Add/remove stops from place cards
 * - Walk preview via FOSSGIS OSRM foot (polyline + time)
 * - Transit → Google Maps deep link (accurate times)
 */

import { getTravelMapHandle } from './travel-map';
import {
  fetchWalkingRoute,
  formatRouteDistance,
  formatRouteDuration,
  googleDirectionsUrl,
  pointLabel,
  type RouteMode,
  type RoutePoint,
} from './travel-route';

const MAX_STOPS = 8;

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

  const stopsEl = bar.querySelector<HTMLOListElement>('[data-route-stops]')!;
  const metaEl = bar.querySelector<HTMLElement>('[data-route-meta]')!;
  const titleEl = bar.querySelector<HTMLElement>('[data-route-title]')!;
  const clearBtn = bar.querySelector<HTMLButtonElement>('[data-route-clear]')!;
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

  const applyI18nChrome = () => {
    const loc = locale();
    titleEl.textContent = loc === 'pt-BR' ? labels.titlePt : labels.titleEn;
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
      li.className = 'travel-route-bar__stop';
      li.innerHTML = `
        <span class="travel-route-bar__stop-n">${i + 1}</span>
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

  const setMeta = (text: string, kind: 'idle' | 'loading' | 'ok' | 'error' | 'hint' = 'idle') => {
    metaEl.textContent = text;
    metaEl.dataset.kind = kind;
  };

  const pushMapPreview = async () => {
    const map = getTravelMapHandle();
    if (!map) return;

    const stopIds = stops.map((s) => s.id);

    if (stops.length < 2) {
      map.setRoutePreview(
        stops.length === 1
          ? { latlngs: null, stopIds, fit: false }
          : null,
      );
      googleLink.hidden = true;
      googleLink.removeAttribute('href');
      if (stops.length === 0) {
        bar.hidden = true;
        return;
      }
      setMeta(
        t(labels.needEn, labels.needPt),
        'idle',
      );
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
      map.setRoutePreview({ latlngs: null, stopIds, fit: true });
      setMeta(t(labels.transitHintEn, labels.transitHintPt), 'hint');
      return;
    }

    // Walking preview
    abort?.abort();
    abort = new AbortController();
    const mySeq = ++seq;
    setMeta(t(labels.loadingEn, labels.loadingPt), 'loading');
    map.setRoutePreview({ latlngs: null, stopIds, fit: false });

    try {
      const result = await fetchWalkingRoute(stops, abort.signal);
      if (mySeq !== seq) return;
      if (!result) {
        map.setRoutePreview({ latlngs: null, stopIds, fit: true });
        setMeta(t(labels.errorEn, labels.errorPt), 'error');
        return;
      }
      map.setRoutePreview({
        latlngs: result.latlngs,
        stopIds,
        fit: true,
      });
      const loc = locale();
      const dur = formatRouteDuration(result.durationSec, loc);
      const dist = formatRouteDistance(result.distanceM, loc);
      const preview = loc === 'pt-BR' ? labels.previewPt : labels.previewEn;
      setMeta(`${preview} · ${dur} · ${dist}`, 'ok');
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      if (mySeq !== seq) return;
      map.setRoutePreview({ latlngs: null, stopIds, fit: true });
      setMeta(t(labels.errorEn, labels.errorPt), 'error');
    }
  };

  const refresh = () => {
    applyI18nChrome();
    bar.hidden = stops.length === 0;
    renderStops();
    syncAddButtons();
    void pushMapPreview();
  };

  const addStop = (point: RoutePoint) => {
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
    refresh();
  };

  clearBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    stops = [];
    abort?.abort();
    getTravelMapHandle()?.setRoutePreview(null);
    refresh();
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
  modeBtns.forEach((b) => {
    b.setAttribute(
      'aria-pressed',
      b.dataset.routeMode === mode ? 'true' : 'false',
    );
  });
}
