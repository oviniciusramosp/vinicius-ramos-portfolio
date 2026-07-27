/**
 * ScrollGallery client behaviour (Apple-style paddlenav + drag + entrance).
 *
 * Uses document-level event delegation so it works when:
 * - Astro view-transitions remount HTML
 * - Storybook swaps story DOM without re-running component <script> modules
 */

import { initMagneticButtons } from './magnetic';

type Root = HTMLElement & { __sgBound?: boolean };

/** Roots that already played entrance (object identity). */
const entrancePlayed = new WeakSet<HTMLElement>();

function maxScrollLeft(el: HTMLElement) {
  return Math.max(0, el.scrollWidth - el.clientWidth);
}

function getRoots(): Root[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[data-scroll-gallery-section]'),
  ) as Root[];
}

function getScroller(root: HTMLElement) {
  return root.querySelector<HTMLElement>('[data-scroll-container]');
}

function getItems(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>('.gallery-item'));
}

function getPaddlenav(root: HTMLElement) {
  return {
    nav: root.querySelector<HTMLElement>('[data-gallery-paddlenav]'),
    prev: root.querySelector<HTMLButtonElement>('[data-paddlenav="prev"]'),
    next: root.querySelector<HTMLButtonElement>('[data-paddlenav="next"]'),
  };
}

function cardStep(root: HTMLElement, scroller: HTMLElement): number {
  const items = getItems(root);
  const gap =
    parseFloat(getComputedStyle(root).getPropertyValue('--feature-card-gap')) || 20;
  const first = items[0];
  const w = first?.getBoundingClientRect().width;
  if (w && w > 0) return w + gap;

  // Fallback when layout not ready: CSS token or Apple default
  const token = parseFloat(
    getComputedStyle(root).getPropertyValue('--feature-card-width'),
  );
  return (token || 372) + gap;
}

function updatePaddles(root: HTMLElement) {
  const scroller = getScroller(root);
  const { nav, prev, next } = getPaddlenav(root);
  if (!scroller || !nav || !prev || !next) return;

  const items = getItems(root);
  const max = maxScrollLeft(scroller);
  const step = cardStep(root, scroller);
  const estimated = items.length * step - (parseFloat(
    getComputedStyle(root).getPropertyValue('--feature-card-gap'),
  ) || 20);
  const canScroll = max > 2 || estimated > scroller.clientWidth + 8;

  nav.classList.toggle('hide', !canScroll);
  nav.removeAttribute('hidden');

  const left = scroller.scrollLeft;
  prev.disabled = !canScroll || left <= 2;
  next.disabled = !canScroll || (max > 2 ? left >= max - 2 : false);
  prev.classList.toggle('disabled', prev.disabled);
  next.classList.toggle('disabled', next.disabled);
}

function scrollByCard(root: HTMLElement, dir: 1 | -1) {
  const scroller = getScroller(root);
  if (!scroller) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const step = cardStep(root, scroller);

  // Prefer native scrollBy — works even when max was mis-measured earlier
  scroller.scrollBy({
    left: dir * step,
    behavior: reduceMotion ? 'auto' : 'smooth',
  });

  // Hard fallback if scrollBy is a no-op (layout not overflow yet)
  window.setTimeout(() => {
    const max = maxScrollLeft(scroller);
    if (max <= 2) {
      // Force content width hint then retry
      const items = getItems(root);
      const set = scroller.querySelector<HTMLElement>('.card-set');
      if (set && items.length) {
        const gap =
          parseFloat(getComputedStyle(root).getPropertyValue('--feature-card-gap')) || 20;
        const w =
          parseFloat(getComputedStyle(root).getPropertyValue('--feature-card-width')) || 372;
        set.style.width = `${items.length * w + (items.length - 1) * gap}px`;
      }
      scroller.scrollBy({
        left: dir * step,
        behavior: reduceMotion ? 'auto' : 'smooth',
      });
    }
    updatePaddles(root);
  }, 0);

  window.setTimeout(() => updatePaddles(root), 50);
  window.setTimeout(() => updatePaddles(root), 320);
}

/** Staggered entrance: paint opacity 0 first, then add .is-in so CSS transition runs. */
function runEntrance(root: HTMLElement, force = false) {
  const items = getItems(root).filter((el) => el.classList.contains('is-entrance'));
  if (!items.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  // Don't re-play on every resize/paddle update
  if (!force && entrancePlayed.has(root) && items.every((el) => el.classList.contains('is-in'))) {
    return;
  }

  // Reset so the transition has a real "from" state
  items.forEach((el) => el.classList.remove('is-in'));
  void root.offsetHeight;

  const play = () => {
    items.forEach((el) => el.classList.add('is-in'));
    entrancePlayed.add(root);
  };

  // Double rAF: guarantees a painted frame at opacity 0 before transition
  requestAnimationFrame(() => {
    requestAnimationFrame(play);
  });

  // Backup if rAF is coalesced oddly in Storybook
  window.setTimeout(play, 100);
}

function bindScrollerChrome(root: Root) {
  const scroller = getScroller(root);
  if (!scroller) return;

  // Avoid duplicate scroll/resize observers per root
  if (root.__sgBound) {
    updatePaddles(root);
    return;
  }
  root.__sgBound = true;

  scroller.addEventListener('scroll', () => updatePaddles(root), { passive: true });

  const ro = new ResizeObserver(() => updatePaddles(root));
  ro.observe(scroller);

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  scroller.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    if ((e.target as HTMLElement).closest('.card-control, .paddlenav-arrow')) return;
    isDown = true;
    moved = false;
    startX = e.clientX;
    startScroll = scroller.scrollLeft;
    scroller.classList.add('is-dragging');
    try {
      scroller.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  });

  scroller.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    scroller.scrollLeft = startScroll - dx;
  });

  const endDrag = (e: PointerEvent) => {
    if (!isDown) return;
    isDown = false;
    scroller.classList.remove('is-dragging');
    try {
      scroller.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  scroller.addEventListener('pointerup', endDrag);
  scroller.addEventListener('pointercancel', endDrag);

  scroller.addEventListener(
    'click',
    (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    },
    true,
  );

  scroller.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollByCard(root, 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollByCard(root, -1);
    }
  });
}

function enhanceRoot(root: Root, opts: { replayEntrance?: boolean } = {}) {
  bindScrollerChrome(root);
  updatePaddles(root);
  runEntrance(root, Boolean(opts.replayEntrance));
  // Paddlenav uses data-magnetic (same as DeckSlider / app buttons)
  initMagneticButtons(root);

  // Re-measure after layout settles (Storybook/CSS vars)
  requestAnimationFrame(() => updatePaddles(root));
  window.setTimeout(() => updatePaddles(root), 50);
  window.setTimeout(() => updatePaddles(root), 200);
  window.setTimeout(() => updatePaddles(root), 500);
}

export function initAllScrollGalleries() {
  getRoots().forEach((root) => {
    enhanceRoot(root, { replayEntrance: true });
  });
}

/** Full boot: re-bind every root (story change / page-load). */
export function bootScrollGalleries() {
  getRoots().forEach((root) => {
    root.__sgBound = false;
  });
  initAllScrollGalleries();
}

let delegated = false;
let observing = false;
let moTimer: number | undefined;

function ensureDelegation() {
  if (delegated) return;
  delegated = true;

  // Paddlenav clicks — capture phase, works without per-button listeners
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const btn = target.closest<HTMLButtonElement>('[data-paddlenav]');
      if (!btn) return;

      const root = btn.closest<HTMLElement>('[data-scroll-gallery-section]');
      if (!root) return;

      // Allow click even if disabled was stale — recompute first
      updatePaddles(root);
      if (btn.disabled) return;

      e.preventDefault();
      e.stopPropagation();
      const dir = btn.dataset.paddlenav === 'prev' ? -1 : 1;
      scrollByCard(root, dir as 1 | -1);
    },
    true,
  );

  window.addEventListener(
    'resize',
    () => {
      getRoots().forEach((root) => updatePaddles(root));
    },
    { passive: true },
  );
}

function hasNewGallery(mutations: MutationRecord[]): boolean {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      if (
        node.matches?.('[data-scroll-gallery-section]') ||
        node.querySelector?.('[data-scroll-gallery-section]')
      ) {
        return true;
      }
      // Storybook often injects into #storybook-root
      if (node.id === 'storybook-root' || node.id === 'storybook-root-inner') {
        return true;
      }
    }
  }
  return false;
}

export function bootScrollGalleriesOnce() {
  ensureDelegation();
  bootScrollGalleries();

  if (observing || typeof MutationObserver === 'undefined') return;
  observing = true;

  const mo = new MutationObserver((mutations) => {
    if (!hasNewGallery(mutations) && getRoots().every((r) => r.__sgBound)) return;

    window.clearTimeout(moTimer);
    moTimer = window.setTimeout(() => {
      getRoots().forEach((root) => {
        const isNew = !root.__sgBound;
        if (isNew) {
          enhanceRoot(root);
        } else {
          updatePaddles(root);
        }
      });
    }, 40);
  });

  const start = () => {
    if (document.body) {
      mo.observe(document.body, { childList: true, subtree: true });
    }
  };
  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
}

// Auto-boot when imported as a side-effect module (Storybook preview / Astro)
if (typeof window !== 'undefined') {
  const run = () => bootScrollGalleriesOnce();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}
