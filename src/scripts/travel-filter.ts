/**
 * Search + multi-select filters for /travel.
 * - Index: filter cities by country (cards) — empty selection = all countries
 *   (chip toolbar with horizontal scroll fades).
 * - City page: filter places by category (cards + map pins)
 *   via a filter button + checkbox popover (multi-select).
 *   Default: every category on except commons + markets.
 *   Empty selection = show nothing (explicit multi-select).
 *   Preference persists in localStorage across sessions.
 */

import {
  placeCategoriesOffByDefault,
  type PlaceCategory,
} from '../data/travel-categories';
import { getTravelMapHandle } from './travel-map';

/** Global place-category filter preference (same user, all city pages). */
const PLACE_CATEGORY_FILTER_KEY = 'travel-place-categories';

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Restore saved category ids that still exist on this city page.
 * Returns null when nothing stored / invalid → caller uses defaults.
 * Empty array is valid (user explicitly unchecked everything).
 */
function readStoredPlaceCategories(
  available: ReadonlySet<string>,
): string[] | null {
  try {
    const raw = localStorage.getItem(PLACE_CATEGORY_FILTER_KEY);
    if (raw == null) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter((v): v is string => typeof v === 'string' && available.has(v));
  } catch {
    return null;
  }
}

function writeStoredPlaceCategories(selected: ReadonlySet<string>): void {
  try {
    localStorage.setItem(
      PLACE_CATEGORY_FILTER_KEY,
      JSON.stringify([...selected]),
    );
  } catch {
    /* private mode / quota — ignore */
  }
}

function syncToolbar(
  chips: HTMLButtonElement[],
  selected: ReadonlySet<string>,
): void {
  const none = selected.size === 0;
  chips.forEach((btn) => {
    const value = btn.dataset.travelFilter ?? '';
    const isAll = value === '' || value === 'all';
    const active = isAll ? none : selected.has(value);
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    const tagEl = btn.querySelector<HTMLElement>('.tag--chip');
    if (tagEl) tagEl.classList.toggle('is-pressed', active);
  });
}

function bindChipClicks(
  root: HTMLElement,
  chips: HTMLButtonElement[],
  selected: Set<string>,
  onChange: () => void,
): void {
  const toolbar = root.querySelector<HTMLElement>('.travel__filters');
  toolbar?.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>(
      '[data-travel-filter]',
    );
    if (!chip || !toolbar.contains(chip)) return;

    e.preventDefault();
    const value = chip.dataset.travelFilter ?? '';
    const isAll = value === '' || value === 'all';

    if (isAll) {
      selected.clear();
    } else if (selected.has(value)) {
      selected.delete(value);
    } else {
      selected.add(value);
    }

    syncToolbar(chips, selected);
    onChange();
  });
}

/**
 * Edge fades on a horizontal chip scroller.
 * Classes land on the non-scrolling host (filters-row or the scroller itself)
 * so absolute overlays stay pinned to the viewport of the list.
 * Left fade past start; right fade while more content remains; each fades out at end.
 */
function bindHorizontalScrollFades(scroller: HTMLElement): void {
  if (scroller.dataset.scrollFadesBound === '1') return;
  scroller.dataset.scrollFadesBound = '1';

  const edgeHost =
    scroller.closest<HTMLElement>('.travel__filters-row') ?? scroller;
  edgeHost.classList.add('is-scroll-fade-host');

  const EDGE_PX = 2;

  const update = () => {
    const max = scroller.scrollWidth - scroller.clientWidth;
    const canScroll = max > EDGE_PX;
    const left = scroller.scrollLeft;
    edgeHost.classList.toggle('is-fade-left', canScroll && left > EDGE_PX);
    edgeHost.classList.toggle(
      'is-fade-right',
      canScroll && left < max - EDGE_PX,
    );
  };

  scroller.addEventListener('scroll', update, { passive: true });
  const ro = new ResizeObserver(update);
  ro.observe(scroller);
  window.addEventListener('resize', update, { passive: true });
  void document.fonts?.ready?.then(update);
  requestAnimationFrame(update);
  update();
}

function bindCardHover(
  cards: HTMLElement[],
  idAttr: 'cityId' | 'placeId',
): void {
  cards.forEach((card) => {
    const id =
      idAttr === 'cityId'
        ? card.dataset.cityId || null
        : card.dataset.placeId || null;

    card.addEventListener('mouseenter', () =>
      getTravelMapHandle()?.highlight(id),
    );
    card.addEventListener('mouseleave', () =>
      getTravelMapHandle()?.highlight(null),
    );
    card.addEventListener('focusin', () => getTravelMapHandle()?.highlight(id));
    card.addEventListener('focusout', (e) => {
      if (!card.contains((e as FocusEvent).relatedTarget as Node)) {
        getTravelMapHandle()?.highlight(null);
      }
    });
  });
}

/** /travel index — country filter on city cards */
function bootCityFeed(root: HTMLElement): void {
  if (root.dataset.filterBound === '1') return;
  root.dataset.filterBound = '1';

  const search = root.querySelector<HTMLInputElement>('[data-travel-search]');
  const chips = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-travel-filter]'),
  );
  const empty = root.querySelector<HTMLElement>('[data-travel-empty]');
  const selected = new Set<string>();
  let query = '';

  const cards = () =>
    Array.from(root.querySelectorAll<HTMLElement>('[data-travel-city]'));

  const apply = () => {
    const q = normalize(query);
    let visible = 0;
    const visibleIds = new Set<string>();

    for (const card of cards()) {
      const hay = normalize(card.dataset.search || '');
      const key = card.dataset.country || '';
      const matchQ = !q || hay.includes(q);
      const matchC =
        selected.size === 0 || (key !== '' && selected.has(key));
      const show = matchQ && matchC;
      card.hidden = !show;
      card.classList.toggle('is-filtered-out', !show);
      if (show) {
        visible += 1;
        const id = card.dataset.cityId;
        if (id) visibleIds.add(id);
      }
    }

    if (empty) empty.hidden = visible > 0;

    // Also filter index map pins when search/tags active
    const map = getTravelMapHandle();
    if (map) {
      if (selected.size === 0 && !q) {
        map.setVisibleIds(null);
      } else {
        map.setVisibleIds(visibleIds);
      }
    }
  };

  bindCardHover(cards(), 'cityId');

  search?.addEventListener('input', () => {
    query = search.value;
    apply();
  });

  bindChipClicks(root, chips, selected, apply);
  const cityToolbar = root.querySelector<HTMLElement>('.travel__filters');
  if (cityToolbar) bindHorizontalScrollFades(cityToolbar);
  syncToolbar(chips, selected);
  apply();
}

type PlacesView = 'list' | 'itinerary';

/** /travel/[slug] — category filter on place cards + map pins + view modes */
function bootPlacesFeed(root: HTMLElement): void {
  if (root.dataset.filterBound === '1') return;
  root.dataset.filterBound = '1';

  const search = root.querySelector<HTMLInputElement>('[data-travel-search]');
  const filterWrap = root.querySelector<HTMLElement>('.travel__filter-wrap');
  const filterToggle = root.querySelector<HTMLButtonElement>(
    '[data-travel-filter-toggle]',
  );
  const filterPopover = root.querySelector<HTMLElement>(
    '[data-travel-filter-popover]',
  );
  const filterCount = root.querySelector<HTMLElement>(
    '[data-travel-filter-count]',
  );
  const checkboxes = Array.from(
    root.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"][data-travel-filter]',
    ),
  );
  const empty = root.querySelector<HTMLElement>('[data-travel-empty]');
  const expandToggle = root.querySelector<HTMLButtonElement>(
    '[data-travel-expand-toggle]',
  );
  const viewsRoot = root.querySelector<HTMLElement>('.travel-city__views');
  const viewButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-travel-view]'),
  );

  /** Category keys present on this city (checkboxes in the popover). */
  const availableCategories = new Set(
    checkboxes
      .map((box) => box.dataset.travelFilter ?? '')
      .filter((v) => v && v !== 'all'),
  );

  /**
   * Multi-select selection set.
   * Prefer last session preference; else defaults (all on except chains + markets).
   */
  const selected = new Set<string>();
  const stored = readStoredPlaceCategories(availableCategories);
  if (stored != null) {
    for (const v of stored) selected.add(v);
  } else {
    for (const v of availableCategories) {
      if (!placeCategoriesOffByDefault.has(v as PlaceCategory)) {
        selected.add(v);
      }
    }
  }
  for (const box of checkboxes) {
    const v = box.dataset.travelFilter ?? '';
    if (!v || v === 'all') continue;
    box.checked = selected.has(v);
  }

  let query = '';
  let popoverOpen = false;

  /** All feed cards (list). Map uses unique place ids. */
  const cards = () =>
    Array.from(
      root.querySelectorAll<HTMLElement>(
        '.travel-place-card[data-place-id]:not(.travel-place-card--panel)',
      ),
    );

  const groups = () =>
    Array.from(
      root.querySelectorAll<HTMLDetailsElement>('[data-travel-group]'),
    );

  const setListActive = (id: string | null) => {
    cards().forEach((card) => {
      card.classList.toggle(
        'is-map-active',
        Boolean(id) && card.dataset.placeId === id,
      );
    });
  };

  const collapseEn = expandToggle?.dataset.collapseEn || 'Collapse all';
  const collapsePt = expandToggle?.dataset.collapsePt || 'Recolher tudo';
  const expandEn = expandToggle?.dataset.expandEn || 'Expand all';
  const expandPt = expandToggle?.dataset.expandPt || 'Expandir tudo';

  /** Per-city UI state (survives refresh in the same tab). */
  const pathKey = location.pathname;
  const groupStateKey = `travel-list-groups:${pathKey}`;
  const viewStateKey = `travel-places-view:${pathKey}`;
  const selectedPlaceKey = `travel-selected-place:${pathKey}`;

  const readStoredView = (): PlacesView | null => {
    try {
      const v = sessionStorage.getItem(viewStateKey);
      if (v === 'list' || v === 'itinerary') return v;
      return null;
    } catch {
      return null;
    }
  };

  const writeStoredView = (next: PlacesView) => {
    try {
      sessionStorage.setItem(viewStateKey, next);
    } catch {
      /* private mode / quota — ignore */
    }
  };

  const readStoredPlace = (): string | null => {
    try {
      const id = sessionStorage.getItem(selectedPlaceKey);
      return id && id.length > 0 ? id : null;
    } catch {
      return null;
    }
  };

  const writeStoredPlace = (id: string | null) => {
    try {
      if (id) sessionStorage.setItem(selectedPlaceKey, id);
      else sessionStorage.removeItem(selectedPlaceKey);
    } catch {
      /* private mode / quota — ignore */
    }
  };

  const placeExistsOnPage = (id: string): boolean =>
    Boolean(
      root.querySelector(
        `.travel-place-card[data-place-id="${CSS.escape(id)}"]`,
      ),
    );

  /** Re-select place after map boot / refresh. No-op if missing or filtered out. */
  const restoreSelectedPlace = () => {
    const id = readStoredPlace();
    if (!id) return;
    if (!placeExistsOnPage(id)) {
      writeStoredPlace(null);
      return;
    }
    const map = getTravelMapHandle();
    if (!map) return;
    // camera:false — load city zoom-in owns the first fly; pin focus waits
    map.select(id, { camera: false });
    setListActive(id);
  };

  const storedView = readStoredView();
  const initialView = storedView ?? viewsRoot?.dataset.placesView;
  let view: PlacesView =
    initialView === 'list' || initialView === 'itinerary' ? initialView : 'list';

  const readGroupState = (): Record<string, boolean> | null => {
    try {
      const raw = sessionStorage.getItem(groupStateKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  };

  const writeGroupState = () => {
    try {
      const state: Record<string, boolean> = {};
      for (const g of groups()) {
        const cat = g.dataset.category;
        if (cat) state[cat] = g.open;
      }
      sessionStorage.setItem(groupStateKey, JSON.stringify(state));
    } catch {
      /* private mode / quota — ignore */
    }
  };

  const restoreGroupState = () => {
    const saved = readGroupState();
    for (const g of groups()) {
      const cat = g.dataset.category;
      if (saved && cat && Object.prototype.hasOwnProperty.call(saved, cat)) {
        g.open = Boolean(saved[cat]);
      } else {
        // First visit (or unknown group): start collapsed
        g.open = false;
      }
    }
  };

  const allVisibleGroupsOpen = () => {
    const visibleGroups = groups().filter((g) => !g.hidden);
    return (
      visibleGroups.length > 0 && visibleGroups.every((g) => g.open)
    );
  };

  /** Blue text label above category groups (Expand all / Collapse all). */
  const syncExpandToggle = (allOpen: boolean) => {
    if (!expandToggle) return;
    expandToggle.dataset.expanded = allOpen ? 'true' : 'false';
    expandToggle.setAttribute('aria-expanded', allOpen ? 'true' : 'false');
    const loc =
      document.documentElement.dataset.travelLocale === 'pt-BR' ? 'pt' : 'en';
    const en = allOpen ? collapseEn : expandEn;
    const pt = allOpen ? collapsePt : expandPt;
    const label = loc === 'pt' ? pt : en;
    expandToggle.textContent = label;
    expandToggle.setAttribute('data-i18n-en', en);
    expandToggle.setAttribute('data-i18n-pt', pt);
  };

  const defaultSelected = new Set(
    checkboxes
      .map((box) => box.dataset.travelFilter ?? '')
      .filter(
        (v) => v && !placeCategoriesOffByDefault.has(v as PlaceCategory),
      ),
  );

  const isDefaultSelection = () => {
    if (selected.size !== defaultSelected.size) return false;
    for (const v of defaultSelected) {
      if (!selected.has(v)) return false;
    }
    return true;
  };

  const syncFilterUi = () => {
    checkboxes.forEach((box) => {
      const v = box.dataset.travelFilter ?? '';
      box.checked = Boolean(v && selected.has(v));
    });

    const count = selected.size;
    const custom = !isDefaultSelection();
    if (filterCount) {
      if (custom) {
        filterCount.hidden = false;
        filterCount.textContent = String(count);
      } else {
        filterCount.hidden = true;
        filterCount.textContent = '';
      }
    }
    filterToggle?.classList.toggle('is-active', custom);
  };

  const setPopoverOpen = (open: boolean) => {
    popoverOpen = open;
    if (filterPopover) {
      filterPopover.hidden = !open;
    }
    filterToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  const setView = (next: PlacesView) => {
    view = next;
    if (viewsRoot) viewsRoot.dataset.placesView = next;
    writeStoredView(next);

    root.querySelectorAll<HTMLElement>('[data-view-panel]').forEach((panel) => {
      const isActive = panel.dataset.viewPanel === next;
      panel.hidden = !isActive;
    });

    viewButtons.forEach((btn) => {
      const active = btn.dataset.travelView === next;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // View mode only — keep map camera still (filter changes still refit)
    apply({ fitMap: false });
  };

  const apply = (opts?: { fitMap?: boolean }) => {
    const fitMap = opts?.fitMap !== false;
    const q = normalize(query);
    const uniqueVisible = new Set<string>();
    const visibleIds = new Set<string>();

    for (const card of cards()) {
      const hay = normalize(card.dataset.search || '');
      const key = card.dataset.category || '';
      const matchQ = !q || hay.includes(q);
      // Explicit multi-select: empty selection shows nothing
      const matchC = key !== '' && selected.has(key);
      const show = matchQ && matchC;
      card.hidden = !show;
      card.classList.toggle('is-filtered-out', !show);
      if (show) {
        const id = card.dataset.placeId;
        if (id) {
          uniqueVisible.add(id);
          visibleIds.add(id);
        }
      }
    }

    // Hide category groups with zero visible cards; update counts.
    // Count only place cards — route-add buttons also carry data-place-id.
    for (const group of groups()) {
      const groupCards = Array.from(
        group.querySelectorAll<HTMLElement>(
          '.travel-place-card[data-place-id]:not(.travel-place-card--panel)',
        ),
      );
      const groupVisible = groupCards.filter(
        (c) => !c.hidden && !c.classList.contains('is-filtered-out'),
      ).length;
      const hideGroup = groupVisible === 0;
      group.hidden = hideGroup;
      group.classList.toggle('is-filtered-out', hideGroup);
      const countEl = group.querySelector<HTMLElement>('[data-group-count]');
      if (countEl) countEl.textContent = String(groupVisible);
    }

    // Empty state only for list (itinerary has its own empty / cards)
    if (empty) {
      if (view === 'itinerary') {
        empty.hidden = true;
      } else {
        empty.hidden = uniqueVisible.size > 0;
      }
    }

    // Itinerary: show all pins (focus fade is handled by setItineraryRoute)
    if (view === 'itinerary') {
      getTravelMapHandle()?.setVisibleIds(null, { fit: fitMap });
    } else {
      // Leaving itinerary (or list apply): drop multi-modal overlay
      getTravelMapHandle()?.setItineraryRoute(null);
      getTravelMapHandle()?.setVisibleIds(visibleIds, { fit: fitMap });
    }

    // Expand label only meaningful when visible groups remain
    syncExpandToggle(allVisibleGroupsOpen());
  };

  bindCardHover(cards(), 'placeId');

  // Map remounts after filter bind (ClientRouter / debounce) — re-push visibility
  // and re-apply the last selected place (refresh / SPA remount).
  // Ignore events after this feed was navigated away (stale listeners).
  // fitMap: false — city page owns the load zoom-in; a second animated fit
  // here made the intro look like it fired twice on refresh.
  document.addEventListener('travel:map-ready', () => {
    if (!root.isConnected) return;
    apply({ fitMap: false });
    restoreSelectedPlace();
  });

  // Feed card click → select pin + open side panel
  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('a, button, label, input')) return;
    const card = target.closest<HTMLElement>(
      '.travel-place-card[data-place-id]',
    );
    if (!card || !root.contains(card)) return;
    if (card.classList.contains('travel-place-card--panel')) return;
    const id = card.dataset.placeId;
    if (!id) return;
    e.preventDefault();
    getTravelMapHandle()?.select(id);
    setListActive(id);
  });
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = (e.target as HTMLElement | null)?.closest?.<HTMLElement>(
      '.travel-place-card[data-place-id]',
    );
    if (!card || e.target !== card) return;
    if (card.classList.contains('travel-place-card--panel')) return;
    if (!root.contains(card)) return;
    const id = card.dataset.placeId;
    if (!id) return;
    e.preventDefault();
    getTravelMapHandle()?.select(id);
    setListActive(id);
  });

  // Keep list highlight + session state in sync when pin/panel selection changes
  document
    .querySelector<HTMLElement>('[data-travel-map]')
    ?.addEventListener('travel:select', (e: Event) => {
      const id = (e as CustomEvent<{ id: string | null }>).detail?.id ?? null;
      setListActive(id);
      writeStoredPlace(id);
    });

  search?.addEventListener('input', () => {
    query = search.value;
    apply();
  });

  // Checkbox multi-select (persist across sessions)
  checkboxes.forEach((box) => {
    box.addEventListener('change', () => {
      const v = box.dataset.travelFilter ?? '';
      if (!v || v === 'all') return;
      if (box.checked) selected.add(v);
      else selected.delete(v);
      writeStoredPlaceCategories(selected);
      syncFilterUi();
      apply();
    });
  });

  filterToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPopoverOpen(!popoverOpen);
  });

  // Close popover on outside click / Escape
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (!popoverOpen || !filterWrap) return;
      const t = e.target as Node | null;
      if (t && filterWrap.contains(t)) return;
      setPopoverOpen(false);
    },
    true,
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popoverOpen) {
      e.preventDefault();
      setPopoverOpen(false);
      filterToggle?.focus();
    }
  });

  // View mode: list | itinerary
  viewButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const next = btn.dataset.travelView as PlacesView | undefined;
      if (!next || next === view) return;
      setView(next);
    });
  });

  expandToggle?.addEventListener('click', (e) => {
    e.preventDefault();
    const visibleGroups = groups().filter((g) => !g.hidden);
    const allOpen =
      visibleGroups.length > 0 && visibleGroups.every((g) => g.open);
    const nextOpen = !allOpen;
    visibleGroups.forEach((g) => {
      g.open = nextOpen;
    });
    syncExpandToggle(nextOpen);
    writeGroupState();
  });

  // Keep toggle label in sync if user opens/closes individual groups
  root.addEventListener('toggle', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLDetailsElement) || !t.matches('[data-travel-group]'))
      return;
    syncExpandToggle(allVisibleGroupsOpen());
    writeGroupState();
  }, true);

  syncFilterUi();
  // Default: all collapsed. Restore prior open groups when user returns.
  restoreGroupState();
  syncExpandToggle(allVisibleGroupsOpen());
  setView(view);
  // If map already booted (HMR / late filter bind), restore selection now.
  // Otherwise travel:map-ready will restore after pins exist.
  if (getTravelMapHandle()) restoreSelectedPlace();
}

export function bootTravelFilter(): void {
  const cityRoot = document.querySelector<HTMLElement>('[data-travel-feed]');
  if (cityRoot) bootCityFeed(cityRoot);

  const placesRoot = document.querySelector<HTMLElement>('[data-travel-places]');
  if (placesRoot) bootPlacesFeed(placesRoot);
}
