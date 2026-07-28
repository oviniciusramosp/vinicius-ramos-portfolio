/**
 * Case-study logo mark (Moove hero bento 2×1).
 * Host: [data-logo-mark][data-src="…/logo-mark.svg"]
 *
 * Stroke draw = homepage pipeline (cover-lines.ts → .cover-line + setDrawn).
 *
 * Intro on every page show:
 *   1. Draw construction strokes (fully visible)
 *   2. Hold, then fade in the white mark
 *   3. Fade out the strokes
 *
 * Hover (settled): radial CSS mask near the pointer on the lines group.
 */

import {
  ensureInline,
  prepareSvg,
  setDrawn,
} from './cover-lines';
import { whenPageVisible } from './page-reveal';

type Host = HTMLElement & {
  __logoMarkAbort?: AbortController;
  __logoMarkCancelPage?: () => void;
  __logoMarkGen?: number;
  __logoMarkIntroRunning?: boolean;
};

const DRAW_MS = 900 + 400;
/** Hold fully-drawn lines before bringing the mark in */
const HOLD_DRAWN_MS = 450;
const FILL_FADE_MS = 700;
const LINES_OUT_MS = 600;

/** Content-tight crop of the 1844×1392 artboard (mark + construction band). */
const CONTENT_VIEWBOX = '210 530 1420 320';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const id = window.setTimeout(() => resolve(), ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(id);
        resolve();
      },
      { once: true },
    );
  });
}

function isCurrent(host: Host, gen: number, signal: AbortSignal) {
  return !signal.aborted && host.__logoMarkGen === gen && document.contains(host);
}

function markFillRoot(svg: SVGSVGElement): SVGElement | null {
  const clipped = svg.querySelector(':scope > g[clip-path], :scope > g');
  if (clipped && !clipped.closest('defs')) return clipped as SVGElement;
  return null;
}

function setFillVisible(svg: SVGSVGElement, visible: boolean) {
  const root = markFillRoot(svg);
  if (!root) return;
  root.classList.add('logo-mark-fill');
  root.style.opacity = visible ? '1' : '0';
}

function ensureLinesGroup(svg: SVGSVGElement): SVGGElement {
  const existing = svg.querySelector<SVGGElement>('g.logo-mark-lines-g');
  if (existing) return existing;

  // Visible strokes only — never move mask drawers out of <defs>/<mask>
  const lines = Array.from(
    svg.querySelectorAll<SVGElement>('.cover-line, .cover-line-visible'),
  ).filter(
    (el) =>
      !el.closest('defs') &&
      !el.closest('mask') &&
      !el.classList.contains('cover-line-mask-drawer'),
  );
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.classList.add('logo-mark-lines-g');

  const fill = markFillRoot(svg);
  if (fill?.nextSibling) svg.insertBefore(g, fill.nextSibling);
  else svg.appendChild(g);

  lines.forEach((el) => g.appendChild(el));
  return g;
}

async function loadSvgDetached(src: string): Promise<SVGSVGElement | null> {
  try {
    const res = await fetch(src, { credentials: 'same-origin' });
    if (!res.ok) return null;
    const wrap = document.createElement('div');
    wrap.innerHTML = await res.text();
    return wrap.querySelector('svg');
  } catch {
    return null;
  }
}

async function normalizeAndPrepare(
  host: Host,
  svg: SVGSVGElement,
  gen: number,
  signal: AbortSignal,
): Promise<SVGSVGElement | null> {
  if (!isCurrent(host, gen, signal)) return null;

  delete host.dataset.idsScoped;
  delete host.dataset.linesReady;
  host.replaceChildren(svg);

  const normalized = await ensureInline(host);
  if (!normalized || !isCurrent(host, gen, signal)) return null;

  normalized.setAttribute('viewBox', CONTENT_VIEWBOX);
  normalized.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  normalized.classList.add('logo-mark-svg');

  delete host.dataset.linesReady;
  prepareSvg(host, normalized);
  ensureLinesGroup(normalized);
  setFillVisible(normalized, false);

  const linesG = normalized.querySelector<SVGGElement>('g.logo-mark-lines-g');
  // Start hidden; intro turns them on before the draw
  if (linesG) {
    linesG.style.opacity = '0';
    linesG.style.visibility = 'hidden';
  }

  host.classList.remove(
    'is-intro',
    'is-drawing',
    'is-filled',
    'is-lines-out',
    'is-settled',
    'is-drawn',
    'is-spotlight',
  );

  return isCurrent(host, gen, signal) ? normalized : null;
}

async function prepareHost(
  host: Host,
  gen: number,
  signal: AbortSignal,
): Promise<SVGSVGElement | null> {
  const src = host.dataset.src;
  if (!src) return null;

  const detached = await loadSvgDetached(src);
  if (!detached || !isCurrent(host, gen, signal)) return null;

  return normalizeAndPrepare(host, detached, gen, signal);
}

function settleQuiet(host: Host, svg: SVGSVGElement) {
  setFillVisible(svg, true);
  const linesG = svg.querySelector<SVGGElement>('g.logo-mark-lines-g');
  if (linesG) {
    linesG.style.opacity = '';
    linesG.style.visibility = '';
  }
  host.classList.remove(
    'is-intro',
    'is-drawing',
    'is-lines-out',
    'is-spotlight',
  );
  host.classList.add('is-filled', 'is-settled', 'is-drawn');
  host.__logoMarkIntroRunning = false;
  // Cue layered hero cards (wellness overlay) after logo-mark intro
  document.dispatchEvent(new CustomEvent('moove:logo-mark-settled'));
}

async function playIntro(
  host: Host,
  svg: SVGSVGElement,
  gen: number,
  signal: AbortSignal,
) {
  if (!isCurrent(host, gen, signal)) return;

  host.__logoMarkIntroRunning = true;

  const linesG = svg.querySelector<SVGGElement>('g.logo-mark-lines-g');
  // Solid drawers + mask drawers (dashed lines keep final opacity under mask)
  const lines = host.querySelectorAll('.cover-line');

  host.classList.remove('is-settled', 'is-filled', 'is-lines-out', 'is-spotlight');
  host.classList.add('is-intro', 'is-drawing');
  host.style.removeProperty('--mx');
  host.style.removeProperty('--my');
  host.style.removeProperty('--logo-mark-radius');

  setFillVisible(svg, false);

  // Reveal lines layer before arming the draw
  if (linesG) {
    linesG.style.visibility = 'visible';
    linesG.style.opacity = '1';
  }

  if (!lines.length) {
    settleQuiet(host, svg);
    return;
  }

  if (prefersReducedMotion()) {
    setDrawn(host, true);
    settleQuiet(host, svg);
    // Hide lines after settle — settleQuiet leaves them CSS-controlled
    return;
  }

  // Arm hidden, flush layout, then draw (homepage setDrawn path)
  setDrawn(host, false);
  void host.offsetWidth;
  await wait(80, signal);
  if (!isCurrent(host, gen, signal)) {
    // Aborted mid-intro — leave a clean filled state rather than stuck empty lines
    settleQuiet(host, svg);
    return;
  }

  setDrawn(host, true);
  await wait(DRAW_MS, signal);
  if (!isCurrent(host, gen, signal)) {
    settleQuiet(host, svg);
    return;
  }

  // Hold fully-drawn construction lines so the draw is readable
  await wait(HOLD_DRAWN_MS, signal);
  if (!isCurrent(host, gen, signal)) {
    settleQuiet(host, svg);
    return;
  }

  setFillVisible(svg, true);
  host.classList.add('is-filled');
  host.classList.remove('is-drawing');

  await wait(FILL_FADE_MS * 0.5, signal);
  if (!isCurrent(host, gen, signal)) {
    settleQuiet(host, svg);
    return;
  }

  host.classList.add('is-lines-out');
  if (linesG) linesG.style.opacity = '0';
  await wait(LINES_OUT_MS, signal);

  // Always land on settled — even if aborted during the fade
  settleQuiet(host, svg);
}

function bindHover(host: Host, signal: AbortSignal) {
  if (prefersReducedMotion()) return;
  if (window.matchMedia('(hover: none)').matches) return;

  const onMove = (e: PointerEvent) => {
    if (!host.classList.contains('is-settled')) return;
    const rect = host.getBoundingClientRect();
    host.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    host.style.setProperty('--my', `${e.clientY - rect.top}px`);
    host.style.setProperty(
      '--logo-mark-radius',
      `${Math.min(rect.width, rect.height) * 0.55}px`,
    );
    host.classList.add('is-spotlight');
  };
  const onLeave = () => {
    host.classList.remove('is-spotlight');
    host.style.removeProperty('--mx');
    host.style.removeProperty('--my');
    host.style.removeProperty('--logo-mark-radius');
  };

  host.addEventListener('pointerenter', onMove, { signal });
  host.addEventListener('pointermove', onMove, { signal });
  host.addEventListener('pointerleave', onLeave, { signal });
}

async function bindHost(host: Host) {
  const gen = (host.__logoMarkGen ?? 0) + 1;
  host.__logoMarkGen = gen;

  host.__logoMarkAbort?.abort();
  host.__logoMarkCancelPage?.();

  const ac = new AbortController();
  host.__logoMarkAbort = ac;

  const svg = await prepareHost(host, gen, ac.signal);
  if (!svg || !isCurrent(host, gen, ac.signal)) return;

  if (!host.querySelectorAll('.cover-line').length) {
    console.warn('[logo-mark] 0 cover-line nodes after prepare', host.dataset.src);
  }

  bindHover(host, ac.signal);

  let played = false;
  const go = () => {
    if (played || !isCurrent(host, gen, ac.signal)) return;
    played = true;
    void playIntro(host, svg, gen, ac.signal);
  };

  const cancelVisible = whenPageVisible(go);
  // Hard refresh / missed reveal: still play
  const safety = window.setTimeout(go, 500);
  host.__logoMarkCancelPage = () => {
    cancelVisible();
    window.clearTimeout(safety);
  };
}

export function initLogoMark(root: ParentNode = document) {
  root.querySelectorAll<Host>('[data-logo-mark]').forEach((host) => {
    void bindHost(host);
  });
}

/** Coalesce immediate + astro:page-load into a single boot. */
let bootTimer = 0;

export function bootLogoMark() {
  if (bootTimer) window.clearTimeout(bootTimer);
  // 32ms debounce absorbs the double fire without delaying the intro much
  bootTimer = window.setTimeout(() => {
    bootTimer = 0;
    document.querySelectorAll<Host>('[data-logo-mark]').forEach((host) => {
      // Don't tear down mid-intro if a spurious second boot arrives —
      // only reset when idle / settled
      if (host.__logoMarkIntroRunning) return;
      host.__logoMarkAbort?.abort();
      host.__logoMarkCancelPage?.();
      host.classList.remove(
        'is-intro',
        'is-drawing',
        'is-filled',
        'is-lines-out',
        'is-settled',
        'is-drawn',
        'is-spotlight',
      );
    });
    // Always rebind hosts that aren't mid-intro; mid-intro hosts keep going
    document.querySelectorAll<Host>('[data-logo-mark]').forEach((host) => {
      if (host.__logoMarkIntroRunning) return;
      void bindHost(host);
    });
  }, 32);
}
