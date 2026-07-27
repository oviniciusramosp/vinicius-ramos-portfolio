/**
 * Homepage project cards — scroll entrance (title/tags + image scale-up).
 *
 * Mobile (single-column bento ≤720px): one-by-one cascade, top → bottom.
 * Desktop / multi-col: soft entrance in random pairs (2 at a time), cascaded
 * so the full grid never animates as one burst.
 */

import { whenPageVisible } from './page-reveal';

const SELECTOR = '[data-card-reveal]';
const OBSERVED = 'data-card-reveal-ready';

/** Matches ProjectGrid single-column breakpoint */
const MOBILE_MQ = '(max-width: 720px)';

const STAGGER_MS_MOBILE = 160;
/** Gap between desktop pair waves */
const STAGGER_MS_DESKTOP = 320;
const BATCH_DESKTOP = 2;

function isMobileBento() {
  return window.matchMedia(MOBILE_MQ).matches;
}

function staggerMs() {
  return isMobileBento() ? STAGGER_MS_MOBILE : STAGGER_MS_DESKTOP;
}

function batchSize() {
  return isMobileBento() ? 1 : BATCH_DESKTOP;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function reveal(el: HTMLElement) {
  el.classList.add('is-inview');
}

/** Document / visual order: top → bottom, then left → right (mobile cascade) */
function sortByPosition(a: HTMLElement, b: HTMLElement) {
  const ra = a.getBoundingClientRect();
  const rb = b.getBoundingClientRect();
  if (Math.abs(ra.top - rb.top) > 2) return ra.top - rb.top;
  if (Math.abs(ra.left - rb.left) > 2) return ra.left - rb.left;
  const pos = a.compareDocumentPosition(b);
  if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function initCardReveal(root: ParentNode = document) {
  const cards = Array.from(root.querySelectorAll<HTMLElement>(SELECTOR));
  if (!cards.length) return;

  const fresh = cards.filter((el) => el.getAttribute(OBSERVED) !== '1');
  if (!fresh.length) return;

  for (const el of fresh) {
    el.setAttribute(OBSERVED, '1');
  }

  if (prefersReducedMotion()) {
    for (const el of fresh) reveal(el);
    return;
  }

  whenPageVisible(() => {
    const pending = new Set<HTMLElement>();
    let draining = false;
    let timer = 0;

    const pickBatch = (): HTMLElement[] => {
      if (!pending.size) return [];
      const n = batchSize();

      if (n <= 1) {
        const next = [...pending].sort(sortByPosition)[0];
        return next ? [next] : [];
      }

      // Desktop: random pair from whatever is waiting
      const pool = shuffleInPlace([...pending]);
      return pool.slice(0, Math.min(n, pool.length));
    };

    const drain = () => {
      if (draining) return;
      draining = true;

      const step = () => {
        const batch = pickBatch();
        if (!batch.length) {
          draining = false;
          timer = 0;
          return;
        }
        for (const el of batch) {
          pending.delete(el);
          if (!el.classList.contains('is-inview')) reveal(el);
        }
        // Wait before next wave — never flush the whole grid at once
        timer = window.setTimeout(step, staggerMs());
      };

      step();
    };

    const io = new IntersectionObserver(
      (entries) => {
        let hit = false;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          io.unobserve(el);
          if (el.classList.contains('is-inview')) continue;
          pending.add(el);
          hit = true;
        }
        if (hit) drain();
      },
      {
        // Desktop: start a bit earlier so the soft pair-cascade can breathe
        threshold: isMobileBento() ? 0.18 : 0.12,
        rootMargin: isMobileBento() ? '0px 0px -4% 0px' : '0px 0px -2% 0px',
      },
    );

    for (const el of fresh) {
      io.observe(el);
    }

    const onPageLoad = () => {
      io.disconnect();
      if (timer) window.clearTimeout(timer);
      pending.clear();
      draining = false;
    };
    document.addEventListener('astro:before-preparation', onPageLoad, { once: true });
  });
}
