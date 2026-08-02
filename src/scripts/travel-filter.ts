/**
 * Search + multi-select filters for /travel.
 * - Index: filter cities by country (cards)
 * - City page: filter places by category (cards + map pins)
 *
 * Chip UX mirrors homepage bento (Tag chip + is-pressed).
 * Match rule: empty set = all; otherwise OR across selected keys.
 *
 * Chip hover previews only map pin opacity (list cards stay untouched).
 * Click applies the real filter to both map and list cards.
 */

import { getTravelMapHandle } from './travel-map';

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
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
  syncToolbar(chips, selected);
  apply();
}

type PlacesView = 'grid' | 'list' | 'itinerary';

/** /travel/[slug] — category filter on place cards + map pins + view modes */
function bootPlacesFeed(root: HTMLElement): void {
  if (root.dataset.filterBound === '1') return;
  root.dataset.filterBound = '1';

  const search = root.querySelector<HTMLInputElement>('[data-travel-search]');
  const toolbar = root.querySelector<HTMLElement>('.travel__filters');
  const chips = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-travel-filter]'),
  );
  const empty = root.querySelector<HTMLElement>('[data-travel-empty]');
  const expandToggle = root.querySelector<HTMLButtonElement>(
    '[data-travel-expand-toggle]',
  );
  const viewsRoot = root.querySelector<HTMLElement>('.travel-city__views');
  const viewButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>('[data-travel-view]'),
  );
  const selected = new Set<string>();
  let query = '';
  let view: PlacesView =
    (viewsRoot?.dataset.placesView as PlacesView | undefined) || 'list';

  /** All feed cards (grid + list duplicates). Map uses unique place ids. */
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

  const idsForCategory = (cat: string): Set<string> => {
    const out = new Set<string>();
    for (const card of cards()) {
      if (card.dataset.category === cat && card.dataset.placeId) {
        out.add(card.dataset.placeId);
      }
    }
    return out;
  };

  const idsForSelected = (): Set<string> => {
    const out = new Set<string>();
    for (const card of cards()) {
      const cat = card.dataset.category || '';
      const id = card.dataset.placeId;
      if (!id) continue;
      if (selected.size === 0 || selected.has(cat)) out.add(id);
    }
    return out;
  };

  /** Chip hover → map pin opacity only (list cards unchanged until click) */
  const applyChipPreview = (hoverValue: string | null) => {
    const map = getTravelMapHandle();
    const isAll = !hoverValue || hoverValue === 'all' || hoverValue === '';

    toolbar?.classList.toggle('is-chip-preview', Boolean(hoverValue) && !isAll);
    chips.forEach((btn) => {
      const v = btn.dataset.travelFilter ?? '';
      const isHover = v === hoverValue;
      btn.classList.toggle('is-preview-hover', isHover && !isAll);
    });

    if (!hoverValue || isAll) {
      map?.setFilterPreview(null);
      return;
    }

    // Already selected: click would deselect — no preview
    if (selected.has(hoverValue)) {
      map?.setFilterPreview(null);
      toolbar?.classList.remove('is-chip-preview');
      chips.forEach((btn) => btn.classList.remove('is-preview-hover'));
      return;
    }

    const hoverIds = idsForCategory(hoverValue);
    const solid = new Set<string>();
    const dim = new Set<string>();
    const fadeOthers = selected.size === 0;

    if (fadeOthers) {
      hoverIds.forEach((id) => solid.add(id));
    } else {
      idsForSelected().forEach((id) => solid.add(id));
      hoverIds.forEach((id) => {
        if (!solid.has(id)) dim.add(id);
      });
    }

    map?.setFilterPreview({ solid, dim, fadeOthers });
  };

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

  /** Per-city open/closed map for list groups (survives navigation in the tab). */
  const groupStateKey = `travel-list-groups:${location.pathname}`;

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

  const syncExpandToggle = (allOpen: boolean) => {
    if (!expandToggle) return;
    expandToggle.dataset.expanded = allOpen ? 'true' : 'false';
    expandToggle.setAttribute('aria-expanded', allOpen ? 'true' : 'false');
    const loc =
      document.documentElement.dataset.travelLocale === 'pt-BR' ? 'pt' : 'en';
    const label = allOpen
      ? loc === 'pt'
        ? collapsePt
        : collapseEn
      : loc === 'pt'
        ? expandPt
        : expandEn;
    expandToggle.setAttribute('aria-label', label);
    expandToggle.setAttribute('title', label);
    expandToggle.setAttribute('data-i18n-en', allOpen ? collapseEn : expandEn);
    expandToggle.setAttribute('data-i18n-pt', allOpen ? collapsePt : expandPt);
    const icon = expandToggle.querySelector<HTMLElement>(
      '[data-travel-expand-icon]',
    );
    if (icon) {
      icon.setAttribute(
        'name',
        allOpen ? 'chevron-up-outline' : 'chevron-down-outline',
      );
    }
  };

  const setView = (next: PlacesView) => {
    view = next;
    if (viewsRoot) viewsRoot.dataset.placesView = next;

    root.querySelectorAll<HTMLElement>('[data-view-panel]').forEach((panel) => {
      const isActive = panel.dataset.viewPanel === next;
      panel.hidden = !isActive;
    });

    viewButtons.forEach((btn) => {
      const active = btn.dataset.travelView === next;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    // Expand/collapse only applies to list groups
    if (expandToggle) {
      expandToggle.hidden = next !== 'list';
    }

    apply();
  };

  const apply = () => {
    const q = normalize(query);
    const uniqueVisible = new Set<string>();
    const visibleIds = new Set<string>();

    for (const card of cards()) {
      const hay = normalize(card.dataset.search || '');
      const key = card.dataset.category || '';
      const matchQ = !q || hay.includes(q);
      const matchC =
        selected.size === 0 || (key !== '' && selected.has(key));
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

    // Empty state only for grid/list (itinerary has its own placeholder)
    if (empty) {
      if (view === 'itinerary') {
        empty.hidden = true;
      } else {
        empty.hidden = uniqueVisible.size > 0;
      }
    }

    const map = getTravelMapHandle();
    if (map) {
      if (selected.size === 0 && !q) {
        map.setVisibleIds(null);
      } else {
        map.setVisibleIds(visibleIds);
      }
    }
  };

  bindCardHover(cards(), 'placeId');

  // Feed card click → select pin + open side panel (grid + list)
  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('a, button')) return;
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

  // Keep list highlight in sync when pin/panel selection changes
  document
    .querySelector<HTMLElement>('[data-travel-map]')
    ?.addEventListener('travel:select', (e: Event) => {
      const id = (e as CustomEvent<{ id: string | null }>).detail?.id ?? null;
      setListActive(id);
    });

  search?.addEventListener('input', () => {
    query = search.value;
    apply();
  });

  bindChipClicks(root, chips, selected, () => {
    applyChipPreview(null);
    apply();
  });

  // Hover preview: map pins only (fine pointer)
  if (window.matchMedia('(pointer: fine)').matches) {
    chips.forEach((chip) => {
      chip.addEventListener('pointerenter', () => {
        if (chip.dataset.travelFilter === 'all' || !chip.dataset.travelFilter) {
          applyChipPreview('all');
          return;
        }
        applyChipPreview(chip.dataset.travelFilter ?? null);
      });
      chip.addEventListener('pointerleave', () => {
        applyChipPreview(null);
      });
    });
    toolbar?.addEventListener('pointerleave', () => {
      applyChipPreview(null);
    });
  }

  // View mode: grid | list | itinerary
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

  syncToolbar(chips, selected);
  // Default: all collapsed. Restore prior open groups when user returns.
  restoreGroupState();
  syncExpandToggle(allVisibleGroupsOpen());
  setView(view);
}

export function bootTravelFilter(): void {
  const cityRoot = document.querySelector<HTMLElement>('[data-travel-feed]');
  if (cityRoot) bootCityFeed(cityRoot);

  const placesRoot = document.querySelector<HTMLElement>('[data-travel-places]');
  if (placesRoot) bootPlacesFeed(placesRoot);
}
