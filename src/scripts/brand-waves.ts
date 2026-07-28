/**
 * Neumorphism expanding-ring waves on brand icon cards.
 * Host: [data-brand-waves]
 *
 * Auto-plays when the card enters the viewport (no click).
 * Base circle diameter is measured from the icon (equal width & height in px)
 * so rings start as true circles at least as large as the mark.
 * Reference: https://codepen.io/kilianso/pen/vYOjGpQ (orange base).
 */

import { whenPageVisible } from './page-reveal';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/**
 * Size rings so scale(1) matches the icon’s visual box (true circle in px),
 * and scale(end) reaches past the cell corners.
 *
 * One CSS var --brand-wave-size on the host drives both width and height,
 * so the ring can never become an oval from mismatched axes.
 */
function syncSizeToIcon(host: HTMLElement) {
  const cell = host.closest('.case-bento__cell') as HTMLElement | null;
  if (!cell) return;

  // Prefer the <img> (transform: scale lives on it), not the <picture> wrapper
  const icon =
    cell.querySelector<HTMLElement>(':scope > .opt-picture img') ||
    cell.querySelector<HTMLElement>(':scope > img') ||
    cell.querySelector<HTMLElement>('img');
  if (!icon) return;

  const cellRect = cell.getBoundingClientRect();
  // Includes CSS transforms (scale)
  const iconRect = icon.getBoundingClientRect();
  // Diameter = larger side of the mark (wide infinity → width)
  const diameter = Math.max(iconRect.width, iconRect.height);
  if (!(diameter > 0) || !(cellRect.width > 0) || !(cellRect.height > 0)) return;

  // Single token → CSS applies equal width/height/min/max (always a circle)
  host.style.setProperty('--brand-wave-size', `${diameter.toFixed(1)}px`);

  // Expand past the farther corner from center
  const reach = Math.hypot(cellRect.width, cellRect.height);
  const scale = Math.max(reach / diameter, 2.5) * 1.08;
  host.style.setProperty('--brand-wave-scale', scale.toFixed(2));
}

/** Independent slow + uneven durations/delays per ring. */
function randomizeRhythm(host: HTMLElement) {
  const dots = host.querySelectorAll<HTMLElement>('.brand-waves__dot');
  dots.forEach((dot, i) => {
    const duration = rand(3.8, 5.8);
    const delay = i * rand(1.1, 2.0) + rand(0, 1.2);
    dot.style.setProperty('--brand-wave-duration', `${duration.toFixed(2)}s`);
    dot.style.setProperty('--brand-wave-delay', `${delay.toFixed(2)}s`);
  });
}

function bindHost(host: HTMLElement) {
  if (prefersReducedMotion()) return;

  const cell = host.closest('.case-bento__cell') || host;
  let playing = false;

  const play = () => {
    if (playing) return;
    playing = true;
    let started = false;
    const run = () => {
      if (started || !playing) return;
      started = true;
      syncSizeToIcon(host);
      randomizeRhythm(host);
      host.classList.add('is-playing');
    };
    // Wait for the icon image so getBoundingClientRect reflects real size
    const img = cell.querySelector('img');
    if (img && !img.complete) {
      img.addEventListener('load', () => requestAnimationFrame(run), { once: true });
      window.setTimeout(run, 500);
    } else {
      requestAnimationFrame(run);
    }
  };

  const stop = () => {
    playing = false;
    host.classList.remove('is-playing');
  };

  const ro = new ResizeObserver(() => {
    if (playing) syncSizeToIcon(host);
  });
  ro.observe(cell);

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > 0.25) play();
        else if (!entry.isIntersecting) stop();
      }
    },
    { threshold: [0, 0.25, 0.5], rootMargin: '0px 0px -5% 0px' },
  );

  io.observe(cell);

  whenPageVisible(() => {
    requestAnimationFrame(() => {
      syncSizeToIcon(host);
      const rect = cell.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      if (rect.top < vh * 0.9 && rect.bottom > vh * 0.1) play();
    });
  });
}

export function bootBrandWaves(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-brand-waves]').forEach((host) => {
    host.classList.remove('is-playing');
    bindHost(host);
  });
}
