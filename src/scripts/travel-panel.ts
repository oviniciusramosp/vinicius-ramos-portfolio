/**
 * Side panel over the city map: shows a place card when a pin is selected.
 * Desktop: frosted card on the right of the map.
 * Mobile (≤640px): form-sheet with continuous mid↔full resize (follows the finger),
 * snap on release. Overscroll at top lowers the sheet the same way.
 */

import { getTravelMapHandle } from './travel-map';
import { bindPhotoSlider } from './travel-photo-slider';

const MOBILE_MQ = '(max-width: 640px)';
const SHEET_MS = 340;
/** Dismiss when pulled this far below mid height */
const DISMISS_PX = 120;

type SheetSnap = 'mid' | 'full';

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function bootTravelPanel(): void {
  const hero = document.querySelector<HTMLElement>('.travel__map-hero');
  const shell =
    document.querySelector<HTMLElement>('.travel__map-shell') ?? hero;
  const panel = document.querySelector<HTMLElement>('[data-travel-map-panel]');
  const body = document.querySelector<HTMLElement>(
    '[data-travel-map-panel-body]',
  );
  const scrim = document.querySelector<HTMLElement>(
    '[data-travel-map-panel-scrim]',
  );
  const mapEl = document.querySelector<HTMLElement>('[data-travel-map]');
  const panelClose = panel?.querySelector<HTMLButtonElement>('[data-panel-close]');

  if (!hero || !shell || !panel || !body || !mapEl) return;
  if (panel.dataset.bound === '1') return;
  panel.dataset.bound = '1';

  let openId: string | null = null;
  let snap: SheetSnap = 'mid';
  let closeTimer = 0;
  let openingRaf = 0;
  let mapPadTimer = 0;

  // ── Continuous sheet height (px) ──
  // midH ≤ height ≤ fullH while open; below mid tracked as dismissOffset.
  let liveH = 0;
  let dismissOffset = 0; // px translated down past mid
  let resizing = false;
  let resizeStartY = 0;
  let resizeStartH = 0;
  let resizePointerId: number | null = null;

  /** Visible viewport height (prefer visualViewport — avoids sheet top going off-screen). */
  const viewH = () =>
    Math.round(window.visualViewport?.height ?? window.innerHeight);

  const midH = () => Math.min(viewH() * 0.55, 520);
  /** Max sheet height = viewport. Bottom-anchored → top edge sits at y=0. */
  const fullH = () => viewH();

  const isMobileSheet = () =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_MQ).matches;

  const setHasPanel = (on: boolean) => {
    shell.classList.toggle('has-panel', on);
    hero.classList.toggle('has-panel', on);
  };

  const clearInlineSheet = () => {
    panel.style.height = '';
    panel.style.maxHeight = '';
    panel.style.transform = '';
    panel.style.borderRadius = '';
    panel.style.paddingTop = '';
    panel.style.transition = '';
    panel.classList.remove('is-dragging');
  };

  /**
   * Paint live height (follows finger). `h` is logical height mid…full.
   * Never taller than the viewport (top edge + radius + grab always on-screen).
   * Below mid → dismissOffset translate (does not grow past full).
   */
  const paintLive = (h: number, dismiss = 0) => {
    const m = midH();
    const f = fullH();
    // Hard-clamp: never exceed viewport (no rubber-band past top)
    const logical = clamp(h, m, f);
    liveH = logical;
    dismissOffset = Math.max(0, dismiss);

    panel.classList.add('is-dragging');
    panel.style.transition = 'none';
    panel.style.height = `${logical}px`;
    panel.style.maxHeight = `${f}px`;
    panel.style.transform =
      dismissOffset > 0 ? `translateY(${dismissOffset}px)` : 'translateY(0)';
    // Keep sheet-top identity at every height (radius + grab stay readable)
    panel.style.borderRadius = '18px 18px 0 0';
    panel.style.paddingTop = '0';
  };

  const applySnapClass = (next: SheetSnap) => {
    snap = next;
    panel.classList.toggle('is-expanded', next === 'full');
    panel.dataset.sheetSnap = next;
  };

  const mapOverlapBottom = (): number => {
    if (!isMobileSheet() || panel.hidden) return 0;
    if (snap === 'full' && !resizing) {
      return mapEl.getBoundingClientRect().height;
    }
    const mapRect = mapEl.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const panelTop =
      panel.classList.contains('is-open') &&
      !panel.classList.contains('is-closing')
        ? panelRect.top
        : window.innerHeight - (liveH || midH());
    const overlap = Math.max(0, mapRect.bottom - panelTop);
    return Math.min(Math.round(overlap), Math.round(mapRect.height));
  };

  const syncMapChrome = (animatePin: boolean) => {
    const map = getTravelMapHandle();
    if (!map) return;
    if (!isMobileSheet() || !openId) {
      map.setChromePadding(null);
      return;
    }
    const bottom = mapOverlapBottom();
    map.setChromePadding({ bottom });
    if (
      animatePin &&
      openId &&
      snap === 'mid' &&
      bottom < mapEl.clientHeight * 0.92
    ) {
      map.ensureVisible(openId, true);
    }
  };

  const scheduleMapChrome = (animatePin: boolean, delay = SHEET_MS) => {
    if (mapPadTimer) window.clearTimeout(mapPadTimer);
    syncMapChrome(false);
    mapPadTimer = window.setTimeout(() => {
      mapPadTimer = 0;
      syncMapChrome(animatePin);
    }, delay);
  };

  const setScrimOpen = (open: boolean) => {
    if (!scrim) return;
    if (open && isMobileSheet()) {
      scrim.hidden = false;
      scrim.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrim.classList.add('is-open');
        });
      });
      document.documentElement.classList.add('travel-sheet-open');
    } else {
      scrim.classList.remove('is-open');
      document.documentElement.classList.remove('travel-sheet-open');
      window.setTimeout(() => {
        if (!scrim.classList.contains('is-open')) {
          scrim.hidden = true;
          scrim.setAttribute('aria-hidden', 'true');
        }
      }, SHEET_MS);
    }
  };

  const finishClear = () => {
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    panel.classList.remove('is-open', 'is-closing', 'is-expanded', 'is-dragging');
    clearInlineSheet();
    panel.dataset.sheetSnap = '';
    body.replaceChildren();
    setHasPanel(false);
    snap = 'mid';
    liveH = 0;
    dismissOffset = 0;
    getTravelMapHandle()?.setChromePadding(null);
  };

  const clearUi = (animate: boolean) => {
    if (!openId && panel.hidden) return;

    openId = null;
    resizing = false;
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = 0;
    }
    if (openingRaf) {
      cancelAnimationFrame(openingRaf);
      openingRaf = 0;
    }
    if (mapPadTimer) {
      window.clearTimeout(mapPadTimer);
      mapPadTimer = 0;
    }

    setScrimOpen(false);
    setHasPanel(false);
    getTravelMapHandle()?.setChromePadding(null);

    if (animate && isMobileSheet() && !panel.hidden) {
      // Animate out from current live height
      panel.classList.remove('is-open', 'is-expanded', 'is-dragging');
      panel.classList.add('is-closing');
      clearInlineSheet();
      closeTimer = window.setTimeout(() => {
        closeTimer = 0;
        finishClear();
      }, SHEET_MS);
    } else {
      finishClear();
    }
  };

  const close = () => {
    if (!openId && panel.hidden) return;
    const had = openId;
    clearUi(true);
    if (had) getTravelMapHandle()?.select(null);
  };

  /** Snap to mid/full with CSS transition; clear inline height after. */
  const settle = (next: SheetSnap, animatePin: boolean) => {
    if (!isMobileSheet() || !openId) return;
    resizing = false;
    applySnapClass(next);
    liveH = next === 'full' ? fullH() : midH();
    dismissOffset = 0;

    panel.classList.remove('is-dragging');
    panel.style.transition = '';
    // Continuous into the snap — height never exceeds viewport
    panel.style.height = `${liveH}px`;
    panel.style.maxHeight = `${fullH()}px`;
    panel.style.transform = 'translateY(0)';
    panel.style.borderRadius = '18px 18px 0 0';
    panel.style.paddingTop = '0';

    // After transition, let CSS vars own height again
    window.setTimeout(() => {
      if (!openId) return;
      if (snap !== next) return;
      clearInlineSheet();
      applySnapClass(next);
    }, SHEET_MS);

    scheduleMapChrome(animatePin && next === 'mid', SHEET_MS);
  };

  const setExpanded = (full: boolean, animatePin: boolean) => {
    settle(full ? 'full' : 'mid', animatePin);
  };

  /**
   * End a continuous resize: pick nearest snap (or dismiss).
   * Uses velocity-ish heuristic: distance past midpoint.
   */
  const endResize = () => {
    if (!resizing) return;
    resizing = false;
    resizePointerId = null;

    const m = midH();
    const f = fullH();

    if (dismissOffset > DISMISS_PX) {
      close();
      return;
    }

    // Effective height (if dismissing a little, treat as mid)
    const h = liveH;
    const midPoint = (m + f) / 2;
    if (h >= midPoint) settle('full', false);
    else settle('mid', true);
  };

  /** Finger/wheel delta: positive dy = finger down = lower sheet */
  const applyResizeDelta = (dyFromStart: number) => {
    const m = midH();
    // Finger up (negative dy) → taller sheet
    const h = resizeStartH - dyFromStart;

    if (h < m) {
      // Below mid: hold mid height, translate down for dismiss feel
      paintLive(m, m - h);
    } else {
      paintLive(h, 0);
    }
  };

  const beginResize = (clientY: number, fromH?: number) => {
    resizing = true;
    resizeStartY = clientY;
    resizeStartH =
      fromH ??
      (panel.getBoundingClientRect().height ||
        (snap === 'full' ? fullH() : midH()));
    liveH = resizeStartH;
    dismissOffset = 0;
    panel.classList.add('is-dragging');
    // Freeze at current px so CSS class height doesn't jump
    paintLive(resizeStartH, 0);
  };

  const open = (id: string) => {
    const safeId =
      typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(id)
        : id.replace(/"/g, '\\"');
    const source = document.querySelector<HTMLElement>(
      `.travel-place-card--list[data-place-id="${safeId}"], .travel-city__list .travel-place-card[data-place-id="${safeId}"], .travel-place-card[data-place-id="${safeId}"]`,
    );
    if (!source) return;

    const wasOpen =
      Boolean(openId) &&
      !panel.hidden &&
      panel.classList.contains('is-open');
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = 0;
    }
    if (openingRaf) {
      cancelAnimationFrame(openingRaf);
      openingRaf = 0;
    }

    openId = id;
    resizing = false;
    body.replaceChildren();

    const clone = source.cloneNode(true) as HTMLElement;
    clone.removeAttribute('tabindex');
    clone.classList.remove(
      'is-filtered-out',
      'travel-place-card--list',
      'travel-place-card--grid',
    );
    clone.classList.add('travel-place-card--panel');
    clone.removeAttribute('data-feed-variant');

    // Mobile: grab + close live in sticky panel chrome (not in the scrolling card).
    // Desktop: enable in-card close as before.
    if (isMobileSheet()) {
      clone
        .querySelectorAll<HTMLButtonElement>('[data-place-close]')
        .forEach((closeBtn) => {
          closeBtn.hidden = true;
          closeBtn.classList.remove('is-visible');
          closeBtn.tabIndex = -1;
        });
    } else {
      clone
        .querySelectorAll<HTMLButtonElement>('[data-place-close]')
        .forEach((closeBtn) => {
          closeBtn.classList.add('is-visible');
          closeBtn.hidden = false;
          closeBtn.tabIndex = 0;
          closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            close();
          });
        });
    }

    body.appendChild(clone);
    clone.querySelectorAll<HTMLElement>('[data-photo-slider]').forEach((el) => {
      delete el.dataset.sliderBound;
      el.querySelectorAll('img').forEach((img) => {
        img.loading = 'eager';
        const src = img.getAttribute('src');
        if (src) img.src = src;
      });
    });
    bindPhotoSlider(clone);

    body.scrollTop = 0;
    panel.scrollTop = 0;
    clearInlineSheet();
    panel.classList.remove('is-closing');

    if (!wasOpen) {
      applySnapClass('mid');
      liveH = midH();
    }

    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    setHasPanel(true);
    setScrimOpen(true);

    if (isMobileSheet() && snap === 'mid') {
      const m = midH();
      const mapRect = mapEl.getBoundingClientRect();
      const freeTop = window.innerHeight - m;
      const overlap = Math.max(0, mapRect.bottom - freeTop);
      getTravelMapHandle()?.setChromePadding({
        bottom: Math.min(Math.round(overlap), Math.round(mapRect.height)),
      });
    } else if (isMobileSheet() && snap === 'full') {
      getTravelMapHandle()?.setChromePadding({
        bottom: Math.round(mapEl.getBoundingClientRect().height),
      });
    }

    if (wasOpen) {
      panel.classList.add('is-open');
      scheduleMapChrome(true, 40);
    } else {
      panel.classList.remove('is-open');
      void panel.offsetHeight;
      openingRaf = requestAnimationFrame(() => {
        openingRaf = requestAnimationFrame(() => {
          openingRaf = 0;
          panel.classList.add('is-open');
          scheduleMapChrome(true, SHEET_MS);
        });
      });
    }

    requestAnimationFrame(() => {
      body.scrollTop = 0;
      panel.scrollTop = 0;
    });
  };

  mapEl.addEventListener('travel:select', (e: Event) => {
    const id = (e as CustomEvent<{ id: string | null }>).detail?.id ?? null;
    if (!id) {
      clearUi(true);
      return;
    }
    open(id);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openId) {
      e.preventDefault();
      if (isMobileSheet() && snap === 'full') {
        setExpanded(false, true);
        return;
      }
      close();
    }
  });

  scrim?.addEventListener('click', () => {
    if (!openId) return;
    if (snap === 'full' || liveH > midH() + 40) {
      setExpanded(false, true);
      return;
    }
    close();
  });

  // Sticky chrome close (mobile form-sheet)
  panelClose?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (openId) close();
  });

  // ── Grab: continuous height follows the finger ──
  const onGrabPointerDown = (e: PointerEvent) => {
    if (!isMobileSheet() || !openId) return;
    const target = e.target as HTMLElement | null;
    const grab = target?.closest?.<HTMLElement>('[data-sheet-grab]');
    if (!grab || !panel.contains(grab)) return;
    e.preventDefault();
    resizePointerId = e.pointerId;
    grab.setPointerCapture?.(e.pointerId);
    beginResize(e.clientY);
  };

  const onGrabPointerMove = (e: PointerEvent) => {
    if (!resizing || resizePointerId !== e.pointerId) return;
    applyResizeDelta(e.clientY - resizeStartY);
  };

  const onGrabPointerUp = (e: PointerEvent) => {
    if (!resizing || resizePointerId !== e.pointerId) return;
    endResize();
  };

  panel.addEventListener('pointerdown', onGrabPointerDown);
  panel.addEventListener('pointermove', onGrabPointerMove);
  panel.addEventListener('pointerup', onGrabPointerUp);
  panel.addEventListener('pointercancel', onGrabPointerUp);

  /*
   * Body touch:
   * - At top + pull up while mid (or between mid/full): grow height with finger
   * - At top + pull down: shrink height / dismiss with finger
   * - Once full and scrollTop > 0: normal content scroll
   */
  let bodyTouchY = 0;
  let bodyTracking = false;

  body.addEventListener(
    'touchstart',
    (e) => {
      if (!isMobileSheet() || !openId) return;
      bodyTouchY = e.touches[0]?.clientY ?? 0;
      bodyTracking = true;
      // Don't begin resize yet — wait to see direction + scroll position
    },
    { passive: true },
  );

  body.addEventListener(
    'touchmove',
    (e) => {
      if (!isMobileSheet() || !openId || !bodyTracking) return;
      const y = e.touches[0]?.clientY ?? bodyTouchY;
      const dy = y - bodyTouchY; // + = finger down

      if (resizing) {
        applyResizeDelta(y - resizeStartY);
        if (e.cancelable) e.preventDefault();
        return;
      }

      const atTop = body.scrollTop <= 0;
      const m = midH();
      const f = fullH();
      const currentH = panel.getBoundingClientRect().height;

      // Expand: mid (or not yet full) + at top + finger up
      if (atTop && dy < -2 && currentH < f - 4) {
        beginResize(bodyTouchY, currentH);
        applyResizeDelta(y - resizeStartY);
        if (e.cancelable) e.preventDefault();
        return;
      }

      // Collapse / dismiss: at top + finger down
      if (atTop && dy > 2) {
        beginResize(bodyTouchY, currentH);
        applyResizeDelta(y - resizeStartY);
        if (e.cancelable) e.preventDefault();
        return;
      }
    },
    { passive: false },
  );

  const onBodyTouchEnd = () => {
    bodyTracking = false;
    if (resizing) endResize();
  };
  body.addEventListener('touchend', onBodyTouchEnd, { passive: true });
  body.addEventListener('touchcancel', onBodyTouchEnd, { passive: true });

  // Trackpad / mouse: continuous height via wheel (same model as touch)
  let wheelSettleTimer = 0;
  body.addEventListener(
    'wheel',
    (e) => {
      if (!isMobileSheet() || !openId) return;
      const atTop = body.scrollTop <= 0;
      const f = fullH();
      const currentH = resizing
        ? liveH
        : panel.getBoundingClientRect().height;

      // Fully expanded + scrolled into content → native scroll only
      if (currentH >= f - 2 && !atTop) return;
      if (currentH >= f - 2 && atTop && e.deltaY > 0) {
        // scroll into content from top — allow native
        return;
      }

      // Drive sheet when not full, or overscrolling at top to collapse
      const driveSheet =
        currentH < f - 2 || (atTop && e.deltaY < 0);
      if (!driveSheet) return;

      e.preventDefault();

      if (!resizing) {
        beginResize(0, currentH);
      }

      // Incremental: each event moves from current live height
      // deltaY > 0 (scroll down) → expand (same as finger up)
      // deltaY < 0 (scroll up at top) → collapse
      resizeStartH = liveH || currentH;
      resizeStartY = 0;
      applyResizeDelta(-e.deltaY);

      if (wheelSettleTimer) window.clearTimeout(wheelSettleTimer);
      wheelSettleTimer = window.setTimeout(() => {
        wheelSettleTimer = 0;
        if (resizing) endResize();
      }, 140);
    },
    { passive: false },
  );

  window.matchMedia(MOBILE_MQ).addEventListener('change', () => {
    if (openId) {
      setScrimOpen(true);
      if (!isMobileSheet()) {
        applySnapClass('mid');
        clearInlineSheet();
        getTravelMapHandle()?.setChromePadding(null);
      } else {
        scheduleMapChrome(true, 50);
      }
    } else {
      setScrimOpen(false);
    }
  });

  window.addEventListener(
    'resize',
    () => {
      if (openId && isMobileSheet()) scheduleMapChrome(false, 100);
    },
    { passive: true },
  );
}
