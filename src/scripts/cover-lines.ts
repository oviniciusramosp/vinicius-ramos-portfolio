/**
 * Homepage card: inline a stroked SVG and draw construction lines.
 * Host: [data-cover-lines][data-src="…svg"]
 *
 * Rules (same as case-study logo-mark):
 *   - Final authored opacity for the whole draw (no temporary boost)
 *   - Dashed strokes keep "5 5" / "8 8" from frame one (mask-draw reveal)
 *   - Solid strokes: classic dashoffset draw at final opacity
 *
 * Desktop: draw on hover / focus / magnetic; reverse on leave.
 * Mobile / touch: auto-draw once when the card enters view (is-inview cascade).
 *
 * Inlined SVGs rewrite clipPath/mask url(#id) to unique IDs so document-scoped
 * references don't break the white mark fills.
 */

type LineEl = SVGGeometryElement & {
  style: CSSStyleDeclaration;
  getTotalLength?: () => number;
};

type BoundCard = HTMLElement & {
  __coverLinesAbort?: AbortController;
};

let uid = 0;

function scopeSvgIds(svg: SVGSVGElement, prefix: string): SVGSVGElement {
  const ids = new Set<string>();
  svg.querySelectorAll('[id]').forEach((el) => {
    const id = el.getAttribute('id');
    if (id) ids.add(id);
  });
  if (ids.size === 0) return svg;

  let html = svg.outerHTML;
  // Longest ids first so "ab" is not partially rewritten by "a"
  const sorted = [...ids].sort((a, b) => b.length - a.length);
  sorted.forEach((id) => {
    const next = `${prefix}${id}`;
    html = html.replaceAll(`id="${id}"`, `id="${next}"`);
    html = html.replaceAll(`id='${id}'`, `id='${next}'`);
    html = html.replaceAll(`url(#${id})`, `url(#${next})`);
    html = html.replaceAll(`url('#${id}')`, `url('#${next}')`);
    html = html.replaceAll(`url("#${id}")`, `url("#${next}")`);
  });

  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  const scoped = wrap.querySelector('svg');
  if (scoped) {
    svg.replaceWith(scoped);
    return scoped;
  }
  return svg;
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
  // path with no measurable length — still give a dash window
  return 120;
}

export async function ensureInline(host: HTMLElement): Promise<SVGSVGElement | null> {
  // Prefer SSR-inlined SVG (set:html); fall back to fetch via data-src
  let svg = host.querySelector('svg');

  if (!svg) {
    const src = host.dataset.src;
    if (!src) return null;
    try {
      const res = await fetch(src, { credentials: 'same-origin' });
      if (!res.ok) return null;
      host.innerHTML = await res.text();
      svg = host.querySelector('svg');
    } catch {
      return null;
    }
  }
  if (!svg) return null;

  // Scope ids once per host
  if (host.dataset.idsScoped !== 'true') {
    svg = scopeSvgIds(svg, `cl${++uid}-`);
    host.dataset.idsScoped = 'true';
  }

  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  if (!svg.getAttribute('viewBox')) {
    svg.setAttribute('viewBox', '0 0 1844 1392');
  }
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('cover-lines-svg');
  return svg;
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

/** True authored pattern ("5 5", "8 8") — not a single length used by solid draw. */
function isAuthoredDashPattern(value: string): boolean {
  const parts = value
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  return parts.length >= 2;
}

function readRawDash(el: SVGElement): string {
  return (
    el.getAttribute('stroke-dasharray') ||
    (el.getAttribute('style') || '').match(/stroke-dasharray:\s*([^;]+)/i)?.[1]?.trim() ||
    ''
  );
}

/**
 * Undo a previous prepare so re-boot / HMR can arm cleanly.
 * Restores authored dash patterns from data-dash-authored when present.
 */
function resetArming(svg: SVGSVGElement) {
  svg.querySelectorAll('mask').forEach((mask) => {
    if (mask.querySelector('.cover-line-mask-drawer')) mask.remove();
  });

  svg
    .querySelectorAll<SVGElement>('.cover-line, .cover-line-visible, .cover-line-mask-drawer')
    .forEach((el) => {
      if (el.classList.contains('cover-line-mask-drawer')) {
        el.remove();
        return;
      }
      el.classList.remove('cover-line', 'cover-line-visible');
      el.removeAttribute('mask');
      delete el.dataset.dashRest;
      delete el.dataset.maskId;
      el.style.removeProperty('--cover-line-len');
      el.style.removeProperty('--cover-line-delay');
      clearInlineDashFromStyle(el);

      const authored = el.dataset.dashAuthored || '';
      if (authored && isAuthoredDashPattern(authored)) {
        el.setAttribute('stroke-dasharray', authored);
        el.style.strokeDasharray = authored;
        el.setAttribute('stroke-dashoffset', '0');
        el.style.strokeDashoffset = '0';
      } else {
        el.removeAttribute('stroke-dasharray');
        el.removeAttribute('stroke-dashoffset');
        el.style.removeProperty('stroke-dasharray');
        el.style.removeProperty('stroke-dashoffset');
      }
    });
}

/**
 * Dashed strokes keep authored dash + final opacity from frame one.
 * Progressive reveal uses a solid white mask stroke that draws.
 */
function armDashedWithMask(
  el: LineEl,
  svg: SVGSVGElement,
  length: number,
  dashRest: string,
  delayMs: number,
) {
  const defs = ensureDefs(svg);
  const id = `cl-mask-${++uid}`;

  const mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
  mask.setAttribute('id', id);
  mask.setAttribute('maskUnits', 'userSpaceOnUse');
  mask.setAttribute('maskContentUnits', 'userSpaceOnUse');

  try {
    const vb = svg.viewBox.baseVal;
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('x', String(vb.x));
    bg.setAttribute('y', String(vb.y));
    bg.setAttribute('width', String(vb.width || 1844));
    bg.setAttribute('height', String(vb.height || 1392));
    bg.setAttribute('fill', '#000');
    mask.appendChild(bg);
  } catch {
    /* ignore */
  }

  const drawer = el.cloneNode(true) as LineEl;
  drawer.removeAttribute('id');
  drawer.removeAttribute('mask');
  drawer.removeAttribute('opacity');
  drawer.classList.remove('cover-line', 'cover-line-visible');
  drawer.classList.add('cover-line', 'cover-line-mask-drawer');
  drawer.setAttribute('stroke', '#fff');
  drawer.setAttribute('fill', 'none');
  drawer.setAttribute('opacity', '1');
  const sw = el.getAttribute('stroke-width') || el.style.strokeWidth || '1';
  const swNum = parseFloat(String(sw)) || 1;
  drawer.setAttribute('stroke-width', String(Math.max(swNum * 1.35, swNum + 0.5)));
  clearInlineDashFromStyle(drawer);
  drawer.style.setProperty('--cover-line-len', String(length));
  drawer.style.setProperty('--cover-line-delay', `${delayMs}ms`);
  drawer.style.strokeDasharray = String(length);
  drawer.style.strokeDashoffset = String(length);
  drawer.setAttribute('stroke-dasharray', String(length));
  drawer.setAttribute('stroke-dashoffset', String(length));
  mask.appendChild(drawer);
  defs.appendChild(mask);

  // Visible line: final dash + final authored opacity (no boost)
  clearInlineDashFromStyle(el);
  el.classList.remove('cover-line');
  el.classList.add('cover-line-visible');
  el.dataset.dashRest = dashRest;
  el.dataset.dashAuthored = dashRest;
  el.dataset.maskId = id;
  el.setAttribute('stroke-dasharray', dashRest);
  el.setAttribute('stroke-dashoffset', '0');
  el.style.strokeDasharray = dashRest;
  el.style.strokeDashoffset = '0';
  el.setAttribute('mask', `url(#${id})`);
}

/** Solid stroke: classic length dashoffset draw at final opacity. */
function armSolidDraw(el: LineEl, length: number, delayMs: number) {
  el.classList.remove('cover-line-visible');
  el.classList.add('cover-line');
  el.style.setProperty('--cover-line-len', String(length));
  el.style.setProperty('--cover-line-delay', `${delayMs}ms`);
  el.dataset.dashRest = '';
  el.dataset.dashAuthored = '';
  clearInlineDashFromStyle(el);
  el.style.strokeDasharray = String(length);
  el.style.strokeDashoffset = String(length);
  el.setAttribute('stroke-dasharray', String(length));
  el.setAttribute('stroke-dashoffset', String(length));
}

export function prepareSvg(host: HTMLElement, svg: SVGSVGElement) {
  if (host.dataset.linesReady === 'true') return;

  // HMR / double boot may have half-armed the SVG — start clean
  if (
    svg.querySelector('.cover-line, .cover-line-visible, .cover-line-mask-drawer')
  ) {
    resetArming(svg);
  }

  const lines = Array.from(
    svg.querySelectorAll<LineEl>(
      'path[stroke], circle[stroke], ellipse[stroke], line[stroke], polyline[stroke], polygon[stroke]',
    ),
  ).filter((el) => {
    if (el.closest('defs') || el.closest('mask')) return false;
    if (el.classList.contains('cover-line-mask-drawer')) return false;
    // Skip filled letterforms if any path has both fill + stroke
    const fill = (el.getAttribute('fill') || '').toLowerCase();
    if (fill && fill !== 'none' && fill !== 'transparent') return false;
    // Skip pure fill groups: only keep elements that actually paint a stroke
    const stroke = el.getAttribute('stroke');
    return Boolean(stroke && stroke !== 'none');
  });

  lines.forEach((el, i) => {
    const len = Math.max(measureLength(el), 1);
    const delayMs = Math.min(i * 20, 360);

    // Prefer saved authored pattern (survives solid-length overwrite on re-boot)
    const saved = el.dataset.dashAuthored;
    const raw = saved != null && saved !== '' ? saved : readRawDash(el);
    const authoredDash = isAuthoredDashPattern(raw) ? raw.trim() : '';

    // Keep final authored opacity for the whole draw (no temporary boost).
    if (authoredDash) {
      armDashedWithMask(el, svg, len, authoredDash, delayMs);
    } else {
      armSolidDraw(el, len, delayMs);
    }
  });

  host.dataset.linesReady = 'true';
  host.classList.remove('is-drawn');
}

/** Prepare a cover-line (solid or mask drawer) for a fresh draw from empty → full. */
function armForDraw(el: LineEl) {
  const len = el.style.getPropertyValue('--cover-line-len') || '1';
  el.setAttribute('stroke-dasharray', len);
  el.style.strokeDasharray = len;
  el.setAttribute('stroke-dashoffset', len);
  el.style.strokeDashoffset = len;
}

/** Drawers + solid strokes only — never touch visible dashed (mask) lines. */
function drawableLines(host: HTMLElement): LineEl[] {
  return Array.from(host.querySelectorAll<LineEl>('.cover-line')).filter(
    (el) =>
      el.classList.contains('cover-line-mask-drawer') ||
      !el.classList.contains('cover-line-visible'),
  );
}

export function setDrawn(host: HTMLElement, drawn: boolean) {
  const lines = drawableLines(host);
  if (!lines.length) return;

  if (drawn) {
    // Force a reflow so the browser registers the “from” dashoffset before “to”
    host.classList.remove('is-drawn');
    lines.forEach((el) => armForDraw(el));
    // double rAF: ensure layout flush before animating to 0
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        host.classList.add('is-drawn');
        lines.forEach((el) => {
          el.setAttribute('stroke-dashoffset', '0');
          el.style.strokeDashoffset = '0';
        });
      });
    });
  } else {
    host.classList.remove('is-drawn');
    lines.forEach((el) => armForDraw(el));
  }
}

/** Touch / narrow viewports — no reliable hover; auto-draw on enter. */
function prefersAutoDraw(): boolean {
  return (
    window.matchMedia('(hover: none)').matches ||
    window.matchMedia('(max-width: 768px)').matches
  );
}

function bindCard(card: BoundCard, host: HTMLElement) {
  card.__coverLinesAbort?.abort();
  const ac = new AbortController();
  card.__coverLinesAbort = ac;
  const { signal } = ac;

  const on = () => setDrawn(host, true);
  const off = () => setDrawn(host, false);

  // Mobile / touch: fire once when the card is revealed (is-inview) or intersects
  if (prefersAutoDraw()) {
    let drawn = false;
    const autoDraw = () => {
      if (drawn) return;
      drawn = true;
      on();
    };

    // card-reveal adds .is-inview in cascade — preferred trigger
    if (card.classList.contains('is-inview')) {
      // Small delay so scale-up has started before lines draw
      window.setTimeout(autoDraw, 120);
    } else {
      const mo = new MutationObserver(() => {
        if (card.classList.contains('is-inview')) {
          mo.disconnect();
          window.setTimeout(autoDraw, 120);
        }
      });
      mo.observe(card, { attributes: true, attributeFilter: ['class'] });
      signal.addEventListener('abort', () => mo.disconnect());

      // Fallback if reveal never arms (e.g. reduced motion without class)
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            io.disconnect();
            window.setTimeout(autoDraw, 120);
            break;
          }
        },
        { threshold: 0.28, rootMargin: '0px 0px -4% 0px' },
      );
      io.observe(card);
      signal.addEventListener('abort', () => io.disconnect());
    }
    return;
  }

  // Desktop: draw on hover / focus / magnetic; reverse on leave (home only)
  card.addEventListener('pointerenter', on, { signal });
  card.addEventListener('pointerleave', off, { signal });
  card.addEventListener('focusin', on, { signal });
  card.addEventListener(
    'focusout',
    (e) => {
      if (!card.contains((e as FocusEvent).relatedTarget as Node | null)) off();
    },
    { signal },
  );

  const mo = new MutationObserver(() => {
    if (card.classList.contains('is-magnetic')) on();
    else if (!card.matches(':hover') && !card.contains(document.activeElement)) off();
  });
  mo.observe(card, { attributes: true, attributeFilter: ['class'] });
  signal.addEventListener('abort', () => mo.disconnect());
}

export function initCoverLines(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-cover-lines]').forEach((host) => {
    const card =
      host.closest<HTMLElement>('.project-card-shell') ||
      host.closest<HTMLElement>('.project-card');
    if (!card) return;

    void ensureInline(host).then((svg) => {
      if (!svg) return;
      if (host.dataset.linesReady !== 'true') prepareSvg(host, svg);
      bindCard(card as BoundCard, host);
    });
  });
}

export function bootCoverLines() {
  document.querySelectorAll<HTMLElement>('[data-cover-lines]').forEach((el) => {
    // Keep SSR-inlined SVG; only clear fetch-only hosts
    if (!el.querySelector('svg')) {
      el.innerHTML = '';
      delete el.dataset.idsScoped;
      delete el.dataset.linesReady;
    } else {
      // Force a clean re-arm so double-boot / HMR can't stack masks
      delete el.dataset.linesReady;
    }
    el.classList.remove('is-drawn');
  });
  initCoverLines();
}
