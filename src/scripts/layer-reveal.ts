/**
 * Layered bento cells: photo background + front overlay (icon / wordmark).
 * Host: [data-layer-reveal]
 *
 * Reveals the front after the Moove logo-mark intro settles
 * (`moove:logo-mark-settled`), with a timed fallback if that event is missed.
 */

import { whenPageVisible } from './page-reveal';

export const LOGO_MARK_SETTLED_EVENT = 'moove:logo-mark-settled';

/** ~ logo-mark intro (draw + hold + fill + lines out) after page visible */
const FALLBACK_MS = 3200;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function reveal(host: HTMLElement) {
  host.classList.add('is-revealed');
}

function bindHost(host: HTMLElement) {
  host.classList.remove('is-revealed');

  if (prefersReducedMotion()) {
    reveal(host);
    return;
  }

  let done = false;
  let safety = 0;
  let cancelVisible: (() => void) | undefined;

  const cleanup = () => {
    document.removeEventListener(LOGO_MARK_SETTLED_EVENT, onSettled);
    cancelVisible?.();
    if (safety) window.clearTimeout(safety);
  };

  const go = () => {
    if (done) return;
    done = true;
    cleanup();
    reveal(host);
  };

  const onSettled = () => go();
  document.addEventListener(LOGO_MARK_SETTLED_EVENT, onSettled);

  cancelVisible = whenPageVisible(() => {
    safety = window.setTimeout(go, FALLBACK_MS);
  });
}

export function bootLayerReveal() {
  document.querySelectorAll<HTMLElement>('[data-layer-reveal]').forEach((host) => {
    bindHost(host);
  });
}
