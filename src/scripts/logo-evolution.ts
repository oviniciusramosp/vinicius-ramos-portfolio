/**
 * Identity kit: cascade draw of logo-evolution SVGs.
 * Host: [data-logo-evolution][data-src="…svg"]
 *
 * Pipeline (overlap fills with next card’s lines):
 *   1. Lines of image 1
 *   2. While fills of 1 run → lines of 2 start
 *   3. While fills of 2 run → lines of 3 start
 *   4. Fills of 3 finish the sequence
 *
 * Draw technique: solid stroke-dasharray = length, offset length → 0.
 * Arm with transition:none so lines never reverse-shrink.
 */

import { ensureInline } from './cover-lines';
import { whenPageVisible } from './page-reveal';

type Host = HTMLElement & {
  __logoEvoAbort?: AbortController;
  __logoEvoCancelPage?: () => void;
  __logoEvoGen?: number;
  __logoEvoPlayed?: boolean;
};

type LineEl = SVGGeometryElement & {
  style: CSSStyleDeclaration;
  getTotalLength?: () => number;
};

/** Stroke draw duration (must match CSS) */
const DRAW_MS = 1600;
/** Extra hold after longest line delay finishes */
const DRAW_HOLD_MS = 280;
/** Per-line stagger inside one card */
const LINE_STAGGER_MS = 95;
const LINE_STAGGER_MAX_MS = 1400;
/** Per-fill opacity stagger (one-by-one reveal) */
const FILL_STAGGER_MS = 110;
const FILL_STAGGER_MAX_MS = 1600;
/** Single fill opacity transition duration (must match CSS) */
const FILL_FADE_MS = 750;
/** Quiet beat after lines settle, before fills of that card */
const POST_LINES_GAP_MS = 200;

let maskUid = 0;

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
  return !signal.aborted && host.__logoEvoGen === gen && document.contains(host);
}

function measureLength(el: LineEl): number {
  try {
    if (typeof el.getTotalLength === 'function') {
      const n = el.getTotalLength();
      if (Number.isFinite(n) && n > 0) return n;
    }
  } catch {
    /* fall through */
  }
  const r = Number(el.getAttribute('r') || 0);
  const rx = Number(el.getAttribute('rx') || 0);
  const ry = Number(el.getAttribute('ry') || 0);
  if (r > 0) return 2 * Math.PI * r;
  if (rx > 0 && ry > 0) {
    return Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  }
  return 0;
}

/** Promote style/group strokes so we can select via [stroke]. */
function promoteStrokes(svg: SVGSVGElement) {
  svg.querySelectorAll<SVGElement>('[style*="stroke"]').forEach((el) => {
    if (el.getAttribute('stroke')) return;
    const style = el.getAttribute('style') || '';
    const m = style.match(/(?:^|;)\s*stroke:\s*([^;]+)/i);
    if (!m) return;
    const val = m[1].trim();
    if (!val || val === 'none') return;
    el.setAttribute('stroke', val);
  });

  svg.querySelectorAll<SVGGElement>('g[stroke]').forEach((g) => {
    const stroke = g.getAttribute('stroke');
    if (!stroke || stroke === 'none') return;
    g.querySelectorAll<SVGElement>('path, circle, ellipse, line, polyline, polygon').forEach(
      (el) => {
        if (el.closest('defs')) return;
        if (el.getAttribute('stroke')) return;
        const fill = (el.getAttribute('fill') || '').toLowerCase();
        if (fill && fill !== 'none' && fill !== 'transparent' && !fill.startsWith('url(')) {
          return;
        }
        el.setAttribute('stroke', stroke);
      },
    );
  });
}

type Box = { x: number; y: number; width: number; height: number };

function bboxOf(el: SVGElement): Box {
  try {
    const b = (el as SVGGraphicsElement).getBBox();
    if (b && (b.width > 0 || b.height > 0 || b.x !== 0 || b.y !== 0)) {
      return { x: b.x, y: b.y, width: b.width, height: b.height };
    }
  } catch {
    /* fall through */
  }
  // Fallback: first absolute/relative moveto in path `d`
  const d = el.getAttribute('d') || '';
  const m = d.match(/^[Mm]\s*([-\d.]+)[,\s]+([-\d.]+)/);
  if (m) {
    return { x: parseFloat(m[1]) || 0, y: parseFloat(m[2]) || 0, width: 0, height: 0 };
  }
  const x = parseFloat(el.getAttribute('x') || el.getAttribute('cx') || '0') || 0;
  const y = parseFloat(el.getAttribute('y') || el.getAttribute('cy') || '0') || 0;
  return { x, y, width: 0, height: 0 };
}

/**
 * Reading order: top → bottom rows, left → right within each row
 * (“esquerda para direita, cima para baixo”).
 */
function sortReadingOrder(a: SVGElement, b: SVGElement) {
  const ra = bboxOf(a);
  const rb = bboxOf(b);
  const ay = ra.y + ra.height * 0.5;
  const by = rb.y + rb.height * 0.5;
  const ax = ra.x + ra.width * 0.5;
  const bx = rb.x + rb.width * 0.5;
  // Same row if centers are within this SVG-unit band
  const ROW = 16;
  if (Math.abs(ay - by) > ROW) return ay - by;
  if (Math.abs(ax - bx) > 0.5) return ax - bx;
  // Stable tie-break
  return (a.getAttribute('d') || '').length - (b.getAttribute('d') || '').length;
}

function assignStaggerDelays(
  els: SVGElement[],
  prop: '--logo-evo-fill-delay' | '--logo-evo-mark-delay',
  stepMs: number,
  maxMs: number,
) {
  els.sort(sortReadingOrder);
  els.forEach((el, i) => {
    el.style.setProperty(prop, `${Math.min(i * stepMs, maxMs)}ms`);
  });
  return els;
}

function prepareFills(svg: SVGSVGElement) {
  const nodes = Array.from(
    svg.querySelectorAll<SVGElement>(
      'path[fill], rect[fill], circle[fill], ellipse[fill], g[fill]',
    ),
  ).filter((el) => {
    if (el.closest('defs')) return false;
    const fill = (el.getAttribute('fill') || '').trim().toLowerCase();
    return Boolean(fill && fill !== 'none' && fill !== 'transparent');
  });

  nodes.forEach((el) => {
    el.classList.add('logo-evo-fill');
    const authored = el.getAttribute('opacity');
    const styleOp = el.style.opacity;
    const rest =
      authored != null && authored !== ''
        ? authored
        : styleOp && styleOp !== ''
          ? styleOp
          : '1';
    el.dataset.fillOp = rest;
    // Instant hide (transition off until .is-filling); delays set at reveal time
    el.style.opacity = '0';
  });
}

/**
 * Stagger fill opacity 0 → authored fillOp.
 * Marks are NOT included — they finish in the lines phase first.
 * Order always re-sorted at reveal: L→R within row, top→bottom.
 * Returns total cascade time (ms).
 */
function showFills(host: HTMLElement, svg: SVGSVGElement): number {
  const fills = assignStaggerDelays(
    Array.from(svg.querySelectorAll<SVGElement>('.logo-evo-fill')),
    '--logo-evo-fill-delay',
    FILL_STAGGER_MS,
    FILL_STAGGER_MAX_MS,
  );
  if (!fills.length) return 0;

  // Ensure fills still at 0, transitions off, then enable cascade
  host.classList.remove('is-filling', 'is-marking');
  fills.forEach((el) => {
    el.style.opacity = '0';
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  host.offsetHeight;

  host.classList.add('is-filling');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      fills.forEach((el) => {
        el.style.opacity = el.dataset.fillOp ?? '1';
      });
    });
  });

  const lastDelay = Math.min((fills.length - 1) * FILL_STAGGER_MS, FILL_STAGGER_MAX_MS);
  return lastDelay + FILL_FADE_MS;
}

function hideFills(host: HTMLElement, svg: SVGSVGElement) {
  host.classList.remove('is-filling', 'is-marking');
  svg.querySelectorAll<SVGElement>('.logo-evo-fill').forEach((el) => {
    el.style.opacity = '0';
  });
}

function ensureDefs(svg: SVGSVGElement): SVGDefsElement {
  let defs = svg.querySelector(':scope > defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.insertBefore(defs, svg.firstChild);
  }
  return defs;
}

function clearInlineDashFromStyle(el: SVGElement) {
  const style = el.getAttribute('style');
  if (!style || !/stroke-dasharray|stroke-dashoffset/i.test(style)) return;
  const cleaned = style
    .replace(/stroke-dasharray:\s*[^;]+;?/gi, '')
    .replace(/stroke-dashoffset:\s*[^;]+;?/gi, '')
    .replace(/;;+/g, ';')
    .replace(/^;|;$/g, '')
    .trim();
  if (cleaned) el.setAttribute('style', cleaned);
  else el.removeAttribute('style');
}

/**
 * Dashed lines keep their dash pattern at final opacity.
 * Progressive reveal is done via a solid white mask stroke that draws.
 */
function armDashedWithMask(
  el: LineEl,
  svg: SVGSVGElement,
  length: number,
  dashRest: string,
  delayMs: number,
) {
  const defs = ensureDefs(svg);
  const id = `logo-evo-mask-${++maskUid}`;

  const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
  mask.setAttribute('id', id);
  mask.setAttribute('maskUnits', 'userSpaceOnUse');
  mask.setAttribute('maskContentUnits', 'userSpaceOnUse');

  // Full-frame black so only the white drawer reveals content
  try {
    const vb = svg.viewBox.baseVal;
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', String(vb.x));
    bg.setAttribute('y', String(vb.y));
    bg.setAttribute('width', String(vb.width || 1083));
    bg.setAttribute('height', String(vb.height || 658));
    bg.setAttribute('fill', '#000');
    mask.appendChild(bg);
  } catch {
    /* ignore */
  }

  const drawer = el.cloneNode(true) as LineEl;
  drawer.removeAttribute('id');
  drawer.removeAttribute('mask');
  drawer.removeAttribute('opacity');
  drawer.classList.remove('logo-evo-line', 'logo-evo-line-visible');
  drawer.classList.add('logo-evo-line', 'logo-evo-mask-drawer');
  drawer.setAttribute('stroke', '#fff');
  drawer.setAttribute('fill', 'none');
  drawer.setAttribute('opacity', '1');
  // Slightly thicker so the mask doesn’t fringe the dashes
  const sw = el.getAttribute('stroke-width') || el.style.strokeWidth || '1';
  const swNum = parseFloat(String(sw)) || 1;
  drawer.setAttribute('stroke-width', String(Math.max(swNum * 1.35, swNum + 0.5)));
  clearInlineDashFromStyle(drawer);
  drawer.style.strokeDasharray = String(length);
  drawer.style.strokeDashoffset = String(length);
  drawer.setAttribute('stroke-dasharray', String(length));
  drawer.setAttribute('stroke-dashoffset', String(length));
  drawer.style.setProperty('--logo-evo-len', String(length));
  drawer.style.setProperty('--logo-evo-delay', `${delayMs}ms`);
  mask.appendChild(drawer);
  defs.appendChild(mask);

  // Visible line: final dash + final opacity from frame one
  clearInlineDashFromStyle(el);
  el.classList.add('logo-evo-line-visible');
  el.dataset.dashRest = dashRest;
  el.dataset.maskId = id;
  el.setAttribute('stroke-dasharray', dashRest);
  el.setAttribute('stroke-dashoffset', '0');
  el.style.strokeDasharray = dashRest;
  el.style.strokeDashoffset = '0';
  el.setAttribute('mask', `url(#${id})`);
}

/** Solid stroke draw (undashed). Final opacity kept as authored. */
function armSolidDraw(el: LineEl, length: number, delayMs: number) {
  el.classList.add('logo-evo-line');
  el.style.setProperty('--logo-evo-len', String(length));
  el.style.setProperty('--logo-evo-delay', `${delayMs}ms`);
  el.dataset.dashRest = '';
  clearInlineDashFromStyle(el);
  el.style.strokeDasharray = String(length);
  el.style.strokeDashoffset = String(length);
  el.setAttribute('stroke-dasharray', String(length));
  el.setAttribute('stroke-dashoffset', String(length));
}

/**
 * Arm construction lines for a one-way draw.
 * Must run while host does NOT have `.is-drawing` so CSS transition is off.
 * - Solid lines: classic dashoffset draw at final opacity
 * - Dashed lines: keep dashes + final opacity; mask drawer performs the draw
 */
function prepareLines(host: HTMLElement, svg: SVGSVGElement) {
  const candidates = Array.from(
    svg.querySelectorAll<LineEl>(
      'path[stroke], circle[stroke], ellipse[stroke], line[stroke], polyline[stroke], polygon[stroke]',
    ),
  ).filter((el) => {
    if (el.closest('defs')) return false;
    if (el.classList.contains('logo-evo-mask-drawer')) return false;
    const fill = (el.getAttribute('fill') || '').toLowerCase();
    if (fill && fill !== 'none' && fill !== 'transparent' && !fill.startsWith('url(')) {
      return false;
    }
    const stroke = el.getAttribute('stroke');
    return Boolean(stroke && stroke !== 'none');
  });

  candidates.sort(sortReadingOrder);

  let drawIndex = 0;
  candidates.forEach((el) => {
    const len = Math.max(measureLength(el), 1);
    const authoredDash =
      el.getAttribute('stroke-dasharray') ||
      (el.getAttribute('style') || '').match(/stroke-dasharray:\s*([^;]+)/i)?.[1]?.trim() ||
      '';

    const delay = Math.min(drawIndex * LINE_STAGGER_MS, LINE_STAGGER_MAX_MS);
    drawIndex += 1;

    if (authoredDash) {
      armDashedWithMask(el, svg, len, authoredDash, delay);
    } else {
      armSolidDraw(el, len, delay);
    }
  });

  host.dataset.linesReady = 'true';
  return drawIndex;
}

function finishLines(host: HTMLElement) {
  // Solid drawers: lock fully drawn
  host.querySelectorAll<LineEl>('.logo-evo-line:not(.logo-evo-mask-drawer)').forEach((el) => {
    el.style.strokeDashoffset = '0';
    el.setAttribute('stroke-dashoffset', '0');
  });

  // Mask drawers: fully open, leave visible dashed line as-is
  host.querySelectorAll<LineEl>('.logo-evo-mask-drawer').forEach((el) => {
    el.style.strokeDashoffset = '0';
    el.setAttribute('stroke-dashoffset', '0');
  });

  // Visible dashed lines already have final dash pattern + opacity
  host.querySelectorAll<SVGElement>('.logo-evo-line-visible').forEach((el) => {
    const rest = el.dataset.dashRest || '';
    if (rest) {
      el.setAttribute('stroke-dasharray', rest);
      el.style.strokeDasharray = rest;
    }
    el.setAttribute('stroke-dashoffset', '0');
    el.style.strokeDashoffset = '0';
  });
}

function startDraw(host: HTMLElement) {
  const lines = host.querySelectorAll<LineEl>('.logo-evo-line');
  if (!lines.length) return 0;

  // Re-arm hidden state without transition
  lines.forEach((el) => {
    const len = el.style.getPropertyValue('--logo-evo-len') || '1';
    // Solid lines need solid dasharray; mask drawers too
    el.style.strokeDasharray = len;
    el.style.strokeDashoffset = len;
    el.setAttribute('stroke-dasharray', len);
    el.setAttribute('stroke-dashoffset', len);
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  host.offsetHeight;

  host.classList.add('is-drawing');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      lines.forEach((el) => {
        el.style.strokeDashoffset = '0';
        el.setAttribute('stroke-dashoffset', '0');
      });
    });
  });

  let maxDelay = 0;
  lines.forEach((el) => {
    const d = parseFloat(el.style.getPropertyValue('--logo-evo-delay') || '0');
    if (d > maxDelay) maxDelay = d;
  });
  return maxDelay;
}

async function prepareHost(
  host: Host,
  gen: number,
  signal: AbortSignal,
): Promise<SVGSVGElement | null> {
  if (!isCurrent(host, gen, signal)) return null;

  delete host.dataset.idsScoped;
  delete host.dataset.linesReady;
  host.classList.remove(
    'is-intro',
    'is-drawing',
    'is-filling',
    'is-filled',
    'is-settled',
  );

  delete host.dataset.idsScoped;
  const prepared = await ensureInline(host);
  if (!prepared || !isCurrent(host, gen, signal)) return null;

  prepared.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  prepared.removeAttribute('width');
  prepared.removeAttribute('height');
  prepared.classList.add('logo-evo-svg');

  promoteStrokes(prepared);
  prepareLines(host, prepared);
  prepareFills(prepared);
  hideFills(host, prepared);

  return isCurrent(host, gen, signal) ? prepared : null;
}

type Prepared = { host: Host; svg: SVGSVGElement; gen: number };

/** Lines only (solid draw / dashed via mask). Fills stay at 0. Final line opacity always. */
async function playLinesPhase(item: Prepared, signal: AbortSignal) {
  const { host, svg, gen } = item;
  if (!isCurrent(host, gen, signal)) return;

  host.classList.add('is-intro');
  hideFills(host, svg);

  const lines = host.querySelectorAll('.logo-evo-line');

  if (prefersReducedMotion()) {
    finishLines(host);
    return;
  }

  if (lines.length) {
    const maxLineDelay = startDraw(host);
    await wait(DRAW_MS + maxLineDelay + DRAW_HOLD_MS, signal);
    if (!isCurrent(host, gen, signal)) return;
    host.classList.remove('is-drawing');
    finishLines(host);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    host.offsetHeight;
  }

  await wait(POST_LINES_GAP_MS, signal);
}

/** Fills only, one-by-one. Safe to run while the next card draws lines. */
async function playFillsPhase(item: Prepared, signal: AbortSignal) {
  const { host, svg, gen } = item;
  if (!isCurrent(host, gen, signal)) return;

  if (prefersReducedMotion()) {
    host.classList.add('is-filling');
    svg.querySelectorAll<SVGElement>('.logo-evo-fill').forEach((el) => {
      el.style.opacity = el.dataset.fillOp ?? '1';
    });
    host.classList.remove('is-intro', 'is-drawing');
    host.classList.add('is-filled', 'is-settled');
    return;
  }

  const fillMs = showFills(host, svg);
  host.classList.add('is-filled');
  await wait(fillMs + 80, signal);
  if (!isCurrent(host, gen, signal)) return;

  host.classList.remove('is-intro', 'is-drawing');
  host.classList.add('is-settled');
}

/**
 * Pipeline:
 *   lines1 → (fills1 ∥ lines2) → (fills2 ∥ lines3) → fills3
 */
async function playPipeline(prepared: Prepared[], signal: AbortSignal) {
  if (!prepared.length || signal.aborted) return;

  if (prefersReducedMotion()) {
    for (const item of prepared) {
      await playLinesPhase(item, signal);
      await playFillsPhase(item, signal);
    }
    return;
  }

  const fillJobs: Promise<void>[] = [];

  for (let i = 0; i < prepared.length; i++) {
    await playLinesPhase(prepared[i], signal);
    if (signal.aborted) return;

    // Start this card’s fills; do not block the next card’s lines on fill completion
    fillJobs.push(playFillsPhase(prepared[i], signal));
  }

  await Promise.all(fillJobs);
}

export function bootLogoEvolution(root: ParentNode = document) {
  const hosts = Array.from(root.querySelectorAll<Host>('[data-logo-evolution]'));
  if (!hosts.length) return;

  // Document order = cascade order (top → bottom)
  hosts.forEach((host, i) => {
    host.dataset.cascadeIndex = String(i);
  });

  hosts.forEach((host) => {
    host.__logoEvoAbort?.abort();
    host.__logoEvoCancelPage?.();
    host.__logoEvoPlayed = false;
  });

  const ac = new AbortController();
  hosts.forEach((host) => {
    host.__logoEvoAbort = ac;
  });

  const cancelPage = whenPageVisible(() => {
    void (async () => {
      const prepared: Prepared[] = [];
      for (const host of hosts) {
        const gen = (host.__logoEvoGen ?? 0) + 1;
        host.__logoEvoGen = gen;
        const svg = await prepareHost(host, gen, ac.signal);
        if (svg && isCurrent(host, gen, ac.signal)) {
          prepared.push({ host, svg, gen });
        }
      }
      if (!prepared.length || ac.signal.aborted) return;

      // Sort by cascade index so pipeline order is stable
      prepared.sort(
        (a, b) =>
          Number(a.host.dataset.cascadeIndex || 0) - Number(b.host.dataset.cascadeIndex || 0),
      );

      const anchor =
        prepared[0].host.closest('.case-bento--split-3-2') ||
        prepared[0].host.closest('.case-bento') ||
        prepared[0].host;

      let started = false;
      const io = new IntersectionObserver(
        (entries) => {
          const hit = entries.some((e) => e.isIntersecting && e.intersectionRatio > 0.15);
          if (!hit || started) return;
          started = true;
          io.disconnect();
          prepared.forEach((p) => {
            p.host.__logoEvoPlayed = true;
          });
          void playPipeline(prepared, ac.signal);
        },
        { threshold: [0, 0.15, 0.3], rootMargin: '0px 0px -10% 0px' },
      );
      io.observe(anchor);
      ac.signal.addEventListener('abort', () => io.disconnect(), { once: true });
    })();
  });

  hosts.forEach((host) => {
    host.__logoEvoCancelPage = cancelPage;
  });
}
