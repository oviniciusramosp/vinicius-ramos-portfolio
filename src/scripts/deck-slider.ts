/**
 * Deck slideshow + Apple #aap-media-card-gallery control chrome.
 *
 * Progress model (from Apple MediaCardGallery overview JS):
 *   --autoplay-progress = index + fractional offset between cards
 *   drives min-width expand on every .dotnav-link (Apple CSS formula)
 *
 * Fill model (Apple CSS):
 *   .current::after { animation: aap-animate-progress; duration: --animation-duration }
 *   .playing → animation-play-state: running
 *
 * Advance:
 *   hold on slide ~persistDuration with fill animating
 *   then 200ms handoff (--frame-transition-duration) lerping --autoplay-progress
 *   then move .current and restart fill animation
 */

import { initMagneticButtons } from './magnetic';

type Root = HTMLElement & {
  __deckBound?: boolean;
  /** Abort + teardown for re-boot when multiple carousels share this script */
  __deckCleanup?: () => void;
};

const DEFAULT_INTERVAL = 6150;
/**
 * Slide + bar morph duration when navigating (arrows / autoplay / dots).
 * Long enough to read as a real pan (not a blink); progress tracks the same curve.
 */
const SLIDE_MS = 480;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Center the card in the viewport (content-width cards + side peeks). */
function deckScrollLeft(viewport: HTMLElement, deck: HTMLElement) {
  return deck.offsetLeft - (viewport.clientWidth - deck.offsetWidth) / 2;
}

function maxScroll(el: HTMLElement) {
  return Math.max(0, el.scrollWidth - el.clientWidth);
}

function getDecks(root: HTMLElement) {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-deck]'));
}

function getViewport(root: HTMLElement) {
  return root.querySelector<HTMLElement>('[data-deck-viewport]');
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function nearestIndex(viewport: HTMLElement, decks: HTMLElement[]): number {
  if (!decks.length) return 0;
  const mid = viewport.scrollLeft + viewport.clientWidth / 2;
  let best = 0;
  let bestDist = Infinity;
  decks.forEach((deck, i) => {
    const center = deck.offsetLeft + deck.offsetWidth / 2;
    const dist = Math.abs(center - mid);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}

function scrollToIndex(
  viewport: HTMLElement,
  decks: HTMLElement[],
  index: number,
  smooth: boolean,
) {
  const deck = decks[index];
  if (!deck) return;
  const left =
    deck.offsetLeft - (viewport.clientWidth - deck.offsetWidth) / 2;
  viewport.scrollTo({
    left: Math.max(0, Math.min(left, maxScroll(viewport))),
    behavior: prefersReducedMotion() || !smooth ? 'auto' : 'smooth',
  });
}

/** Apple: set --autoplay-progress on gallery host (drives CSS expand formula). */
function setAutoplayProgress(host: HTMLElement, value: number) {
  host.style.setProperty('--autoplay-progress', String(value));
}

/** Restart aap-animate-progress on the current link (reflow). */
function restartFillAnimation(aap: HTMLElement) {
  const current = aap.querySelector<HTMLElement>('.dotnav-link.current');
  if (!current) return;
  current.classList.remove('current');
  // force reflow so animation restarts when class returns
  void current.offsetWidth;
  current.classList.add('current');
}

function bindRoot(root: Root) {
  if (root.__deckBound) return;
  root.__deckBound = true;

  const viewport = getViewport(root);
  if (!viewport) return;

  const decks = getDecks(root);
  if (!decks.length) return;

  const aapRoot = root.querySelector<HTMLElement>('.aap-root') ?? root;
  const aap =
    root.querySelector<HTMLElement>('[data-deck-aap]') ??
    root.querySelector<HTMLElement>('.aap-media-card-gallery') ??
    root;

  const interval = Number(root.dataset.deckInterval) || DEFAULT_INTERVAL;
  const autoplayEnabled =
    root.dataset.deckAutoplay !== 'false' && !prefersReducedMotion();
  const loop = root.dataset.deckLoop !== 'false';
  const n = decks.length;
  const ac = new AbortController();
  const { signal } = ac;
  let entranceTimer = 0;
  let ro: ResizeObserver | null = null;
  let io: IntersectionObserver | null = null;

  // Apple CSS vars
  aapRoot.style.setProperty('--autoplay-persist-duration', `${interval}ms`);
  aapRoot.style.setProperty('--animation-duration', `${interval}ms`);
  aapRoot.style.setProperty('--frame-transition-duration', `${SLIDE_MS}ms`);
  aapRoot.classList.add('enhanced');

  const itemsEl = root.querySelector<HTMLElement>('.dotnav-items');
  if (itemsEl) itemsEl.style.setProperty('--dotnav-count', String(n));

  const playBtn = root.querySelector<HTMLButtonElement>('[data-deck-play]');
  const dotLinks = Array.from(
    root.querySelectorAll<HTMLElement>('[data-deck-dot]'),
  );
  const dotItems = Array.from(
    root.querySelectorAll<HTMLElement>('.dotnav-item'),
  );

  let index = 0;
  let playing = autoplayEnabled;
  let userPaused = !autoplayEnabled;
  let ended = false;
  let inView = false;
  let entered = false;
  let holdTimer = 0;
  let handoffRaf = 0;
  let scrollRaf = 0;
  /** true while lerping --autoplay-progress between indices */
  let handoffing = false;
  /** true while pointer-dragging the viewport */
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  const setAapState = (state: 'playing' | 'paused' | 'ended') => {
    aap.classList.remove('playing', 'paused', 'ended');
    aap.classList.add(state);
    if (!playBtn) return;
    if (state === 'playing') {
      playBtn.setAttribute('aria-label', 'Pause Highlights gallery');
    } else if (state === 'ended') {
      playBtn.setAttribute('aria-label', 'Replay Highlights gallery');
    } else {
      playBtn.setAttribute('aria-label', 'Play Highlights gallery');
    }
  };

  const setCurrent = (i: number) => {
    dotItems.forEach((item, di) => {
      item.classList.toggle('current', di === i);
      item.style.setProperty('--item-index', String(di));
    });
    dotLinks.forEach((link, di) => {
      const on = di === i;
      link.classList.toggle('current', on);
      link.setAttribute('aria-current', on ? 'true' : 'false');
      link.style.setProperty('--item-index', String(di));
    });
  };

  const noPeek = root.dataset.deckVariant === 'presentation';

  const updateDeckChrome = (i: number) => {
    decks.forEach((deck, di) => {
      const active = di === i;
      deck.classList.toggle('is-active', active);
      deck.setAttribute('aria-hidden', active ? 'false' : 'true');
      if (noPeek) {
        // Presentation: only current slide is in view — keep full opacity
        deck.style.opacity = '1';
        return;
      }
      // Active full opacity; immediate neighbors peek dimmed; farther quieter
      const dist = Math.abs(di - i);
      deck.style.opacity =
        dist === 0 ? '1' : dist === 1 ? '0.4' : '0.22';
    });

    const prev = root.querySelector<HTMLButtonElement>('[data-deck-prev]');
    const next = root.querySelector<HTMLButtonElement>('[data-deck-next]');
    if (prev) {
      prev.disabled = i <= 0;
      prev.classList.toggle('is-disabled', i <= 0);
    }
    if (next) {
      const disabled = !loop && i >= n - 1;
      next.disabled = disabled;
      next.classList.toggle('is-disabled', disabled);
    }
    root.dataset.deckIndex = String(i);
  };

  const clearTimers = () => {
    if (holdTimer) {
      window.clearTimeout(holdTimer);
      holdTimer = 0;
    }
    if (handoffRaf) {
      cancelAnimationFrame(handoffRaf);
      handoffRaf = 0;
    }
    handoffing = false;
    aap.classList.remove('is-handoff');
    viewport.classList.remove('is-animating');
  };

  /**
   * Hold on slide with CSS fill animation, then same animated goTo as arrows.
   */
  const scheduleAdvance = () => {
    clearTimers();
    if (!playing || userPaused || ended || !inView || handoffing) return;

    setAapState('playing');
    setAutoplayProgress(aapRoot, index);
    setCurrent(index);
    restartFillAnimation(aap);

    holdTimer = window.setTimeout(() => {
      if (!playing || userPaused || ended || !inView) return;
      const next = loop ? (index + 1) % n : index + 1;
      if (next >= n) {
        ended = true;
        playing = false;
        setAapState('ended');
        return;
      }
      goTo(next);
    }, interval);
  };

  /** Restore real --item-index on every dot (0..n-1). */
  const resetItemIndices = () => {
    dotItems.forEach((item, di) => {
      item.style.setProperty('--item-index', String(di));
    });
    dotLinks.forEach((link, di) => {
      link.style.setProperty('--item-index', String(di));
    });
  };

  /**
   * Shared navigation: pan the track (eased scroll) while lerping
   * --autoplay-progress so the bar↔dot morph follows the slide.
   *
   * Loop wrap (last→first / first→last): Apple’s expand formula is linear in
   * index space, so we temporarily map the target (or source) dot onto a
   * virtual index (n or -1) during the lerp, then restore real indices.
   */
  const runHandoff = (nextIndex: number) => {
    if (holdTimer) {
      window.clearTimeout(holdTimer);
      holdTimer = 0;
    }
    if (handoffRaf) {
      cancelAnimationFrame(handoffRaf);
      handoffRaf = 0;
    }

    const from = index;
    const to = ((nextIndex % n) + n) % n;
    if (from === to) return;

    handoffing = true;
    ended = false;
    // Keep .playing so the pause icon does not flash to play mid-transition.
    // Fill is restarted on the new current after the pan ends.
    aap.classList.add('is-handoff');

    // Progress path + virtual item-index for wrap morph
    let progressFrom = from;
    let progressTo = to;
    const wrapForward = loop && from === n - 1 && to === 0;
    const wrapBackward = loop && from === 0 && to === n - 1;

    if (wrapForward) {
      // last (n-1) → virtual n ≡ first; give first dot --item-index: n
      progressTo = n;
      if (dotLinks[0]) dotLinks[0].style.setProperty('--item-index', String(n));
      if (dotItems[0]) dotItems[0].style.setProperty('--item-index', String(n));
    } else if (wrapBackward) {
      // first (0) → virtual -1 ≡ last; give last dot --item-index: -1
      progressTo = -1;
      const last = n - 1;
      if (dotLinks[last])
        dotLinks[last].style.setProperty('--item-index', String(-1));
      if (dotItems[last])
        dotItems[last].style.setProperty('--item-index', String(-1));
    }

    const fromLeft = deckScrollLeft(viewport, decks[from]);
    const toLeft = deckScrollLeft(viewport, decks[to]);
    const max = maxScroll(viewport);
    const scrollFrom = viewport.scrollLeft;
    const scrollTo = Math.max(0, Math.min(toLeft, max));

    // Disable snap so it can't fight the pan
    const prevSnap = viewport.style.scrollSnapType;
    viewport.style.scrollSnapType = 'none';
    viewport.classList.add('is-animating');

    const t0 = performance.now();
    const duration = prefersReducedMotion() ? 0 : SLIDE_MS;

    const finish = () => {
      handoffing = false;
      aap.classList.remove('is-handoff');
      viewport.style.scrollSnapType = prevSnap;
      viewport.classList.remove('is-animating');
      index = to;
      // Real indices again before setting progress to `to` (0..n-1)
      resetItemIndices();
      setAutoplayProgress(aapRoot, index);
      setCurrent(index);
      updateDeckChrome(index);
      viewport.scrollLeft = scrollTo;
      restartFillAnimation(aap);

      if (playing && !userPaused && inView) {
        setAapState('playing');
        scheduleAdvance();
      } else {
        setAapState('paused');
      }
    };

    if (duration <= 0) {
      finish();
      return;
    }

    const step = (now: number) => {
      const raw = Math.min(1, (now - t0) / duration);
      const t = easeInOutCubic(raw);

      viewport.scrollLeft = scrollFrom + (scrollTo - scrollFrom) * t;
      setAutoplayProgress(
        aapRoot,
        progressFrom + (progressTo - progressFrom) * t,
      );

      if (raw < 1) {
        handoffRaf = requestAnimationFrame(step);
        return;
      }
      finish();
    };

    handoffRaf = requestAnimationFrame(step);
  };

  /**
   * Navigate to a slide — same animated handoff for arrows & autoplay.
   */
  const goTo = (next: number, opts: { instant?: boolean } = {}) => {
    const target = Math.max(0, Math.min(next, n - 1));

    if (holdTimer) {
      window.clearTimeout(holdTimer);
      holdTimer = 0;
    }

    if (opts.instant || prefersReducedMotion()) {
      if (handoffRaf) {
        cancelAnimationFrame(handoffRaf);
        handoffRaf = 0;
      }
      handoffing = false;
      aap.classList.remove('is-handoff');
      viewport.classList.remove('is-animating');
      viewport.style.scrollSnapType = '';
      ended = false;
      index = target;
      setAutoplayProgress(aapRoot, index);
      setCurrent(index);
      updateDeckChrome(index);
      scrollToIndex(viewport, decks, index, false);
      restartFillAnimation(aap);
      if (playing && !userPaused && inView) {
        setAapState('playing');
        scheduleAdvance();
      } else {
        setAapState('paused');
      }
      return;
    }

    if (target === index && !handoffing) {
      if (playing && !userPaused && inView) scheduleAdvance();
      return;
    }

    runHandoff(target);
  };

  const setPlaying = (next: boolean) => {
    if (ended && next) {
      ended = false;
      userPaused = false;
      playing = true;
      goTo(0, { instant: false });
      return;
    }
    playing = next;
    userPaused = !next;
    ended = false;
    if (playing) {
      setAapState('playing');
      scheduleAdvance();
    } else {
      clearTimers();
      setAapState('paused');
      setAutoplayProgress(aapRoot, index);
    }
  };

  const activateEntrance = () => {
    if (entered) return;
    entered = true;
    // Apple: class `activated` on AAP → CSS entrance (scale dots / play)
    aap.classList.add('activated');
    aap.classList.remove('inactive');
    aapRoot.classList.add('is-activated');
    // Start autoplay after entrance delays (~1s Apple playpause delay)
    if (entranceTimer) window.clearTimeout(entranceTimer);
    entranceTimer = window.setTimeout(() => {
      entranceTimer = 0;
      if (signal.aborted) return;
      if (playing && !userPaused && inView) {
        setAapState('playing');
        scheduleAdvance();
      }
    }, 1000);
  };

  // —— events ——
  // Ignore scroll while we drive handoff ourselves; after drag we call goTo().
  viewport.addEventListener(
    'scroll',
    () => {
      if (handoffing || isDown) return;
      cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(() => {
        if (handoffing || isDown) return;
        const nearest = nearestIndex(viewport, decks);
        if (nearest !== index) {
          // User scroll / snap — use same handoff morph
          goTo(nearest);
        }
      });
    },
    { passive: true, signal },
  );

  root.querySelector('[data-deck-prev]')?.addEventListener(
    'click',
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (handoffing) return;
      if (index <= 0) {
        if (loop) goTo(n - 1);
        return;
      }
      goTo(index - 1);
    },
    { signal },
  );

  root.querySelector('[data-deck-next]')?.addEventListener(
    'click',
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (handoffing) return;
      if (index >= n - 1) {
        if (loop) goTo(0);
        return;
      }
      goTo(index + 1);
    },
    { signal },
  );

  dotLinks.forEach((link) => {
    link.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (handoffing) return;
        goTo(Number(link.dataset.deckDot) || 0);
      },
      { signal },
    );
  });

  playBtn?.addEventListener(
    'click',
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (ended) {
        setPlaying(true);
        return;
      }
      setPlaying(!playing);
    },
    { signal },
  );

  // Drag
  viewport.addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType === 'touch') return;
      if ((e.target as HTMLElement).closest('button, a, .play-pause-button'))
        return;
      isDown = true;
      moved = false;
      startX = e.clientX;
      startScroll = viewport.scrollLeft;
      viewport.classList.add('is-dragging');
      clearTimers();
      try {
        viewport.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    { signal },
  );

  viewport.addEventListener(
    'pointermove',
    (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      viewport.scrollLeft = startScroll - dx;
      // Live --autoplay-progress from scroll (Apple)
      const nearest = nearestIndex(viewport, decks);
      const deck = decks[nearest];
      const next = decks[Math.min(nearest + 1, n - 1)];
      if (deck && next && nearest < n - 1) {
        const a = deckScrollLeft(viewport, deck);
        const b = deckScrollLeft(viewport, next);
        const span = b - a || 1;
        const t = (viewport.scrollLeft - a) / span;
        setAutoplayProgress(aapRoot, nearest + Math.max(0, Math.min(1, t)));
      }
    },
    { signal },
  );

  const endDrag = (e: PointerEvent) => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove('is-dragging');
    try {
      viewport.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const nearest = nearestIndex(viewport, decks);
    goTo(nearest, true);
  };

  viewport.addEventListener('pointerup', endDrag, { signal });
  viewport.addEventListener('pointercancel', endDrag, { signal });

  viewport.addEventListener(
    'click',
    (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    },
    { capture: true, signal },
  );

  viewport.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (!handoffing) {
          if (index >= n - 1) {
            if (loop) goTo(0);
          } else goTo(index + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!handoffing) {
          if (index <= 0) {
            if (loop) goTo(n - 1);
          } else goTo(index - 1);
        }
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setPlaying(!playing);
      }
    },
    { signal },
  );

  ro = new ResizeObserver(() => {
    if (handoffing) return;
    scrollToIndex(viewport, decks, index, false);
    setAutoplayProgress(aapRoot, index);
    updateDeckChrome(index);
  });
  ro.observe(viewport);

  if (typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio > 0.25;
        if (inView) {
          activateEntrance();
          if (playing && !userPaused && entered) scheduleAdvance();
        } else {
          clearTimers();
        }
      },
      { threshold: [0, 0.25, 0.5] },
    );
    io.observe(root);
  } else {
    inView = true;
    activateEntrance();
  }

  initMagneticButtons(root);

  // Initial item-index on links
  dotLinks.forEach((link, di) => {
    link.style.setProperty('--item-index', String(di));
  });
  dotItems.forEach((item, di) => {
    item.style.setProperty('--item-index', String(di));
  });

  setAutoplayProgress(aapRoot, 0);
  setCurrent(0);
  updateDeckChrome(0);
  goTo(0, { instant: true });
  setAapState('paused'); // fill paused until entrance + schedule

  requestAnimationFrame(() => {
    if (signal.aborted) return;
    const rect = root.getBoundingClientRect();
    const vh = window.innerHeight || 0;
    if (rect.top < vh * 0.85 && rect.bottom > vh * 0.15) {
      inView = true;
      activateEntrance();
    }
  });

  root.__deckCleanup = () => {
    ac.abort();
    clearTimers();
    if (entranceTimer) window.clearTimeout(entranceTimer);
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
    ro?.disconnect();
    io?.disconnect();
    root.__deckBound = false;
    root.__deckCleanup = undefined;
  };
}

export function initDeckSliders(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-deck-slider]').forEach((el) => {
    bindRoot(el as Root);
  });
}

export function bootDeckSliders() {
  document.querySelectorAll<HTMLElement>('[data-deck-slider]').forEach((el) => {
    const r = el as Root;
    r.__deckCleanup?.();
    r.__deckBound = false;
  });
  initDeckSliders();
}
