/**
 * Gate entrance animations until the page-mask transition has revealed the page.
 * Full reloads (no transition) run on the next frames so layout is ready.
 */

export const PAGE_REVEAL_EVENT = 'page-mask:reveal-end';

/** True while ClientRouter page-mask is covering the viewport. */
export function isPageTransitioning(): boolean {
  if (document.documentElement.classList.contains('is-page-transitioning')) {
    return true;
  }
  const mask = document.getElementById('page-mask');
  return Boolean(mask?.classList.contains('is-active'));
}

/**
 * Run `cb` once the page is visible to the user.
 * Returns a cancel function (safe to call multiple times).
 */
export function whenPageVisible(cb: () => void): () => void {
  let cancelled = false;
  let done = false;

  const run = () => {
    if (cancelled || done) return;
    done = true;
    cleanup();
    cb();
  };

  let timer = 0;
  const onReveal = () => run();

  const cleanup = () => {
    document.removeEventListener(PAGE_REVEAL_EVENT, onReveal);
    if (timer) {
      window.clearTimeout(timer);
      timer = 0;
    }
  };

  if (isPageTransitioning()) {
    document.addEventListener(PAGE_REVEAL_EVENT, onReveal);
    // Safety: never leave intros stuck if the mask event is missed
    timer = window.setTimeout(run, 5000);
    return () => {
      cancelled = true;
      cleanup();
    };
  }

  // No transition plate — wait two frames so layout/paint settle
  let raf1 = 0;
  let raf2 = 0;
  raf1 = requestAnimationFrame(() => {
    raf2 = requestAnimationFrame(run);
  });

  return () => {
    cancelled = true;
    if (raf1) cancelAnimationFrame(raf1);
    if (raf2) cancelAnimationFrame(raf2);
    cleanup();
  };
}

/** Notify entrance animations that the mask has opened (or was skipped). */
export function notifyPageRevealed() {
  document.dispatchEvent(new CustomEvent(PAGE_REVEAL_EVENT));
}
