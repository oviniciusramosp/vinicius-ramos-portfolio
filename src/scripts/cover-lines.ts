/**
 * Homepage card: inline a stroked SVG and draw construction lines.
 * Host: [data-cover-lines][data-src="…svg"]
 *
 * Desktop: draw on hover / focus / magnetic.
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

async function ensureInline(host: HTMLElement): Promise<SVGSVGElement | null> {
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

function prepareSvg(host: HTMLElement, svg: SVGSVGElement) {
  if (host.dataset.linesReady === 'true') return;

  const lines = Array.from(
    svg.querySelectorAll<LineEl>(
      'path[stroke], circle[stroke], ellipse[stroke], line[stroke], polyline[stroke], polygon[stroke]',
    ),
  ).filter((el) => {
    // Skip filled letterforms if any path has both fill + stroke
    const fill = (el.getAttribute('fill') || '').toLowerCase();
    if (fill && fill !== 'none' && fill !== 'transparent') return false;
    // Skip pure fill groups: only keep elements that actually paint a stroke
    const stroke = el.getAttribute('stroke');
    return Boolean(stroke && stroke !== 'none');
  });

  lines.forEach((el, i) => {
    const len = measureLength(el);
    el.classList.add('cover-line');
    el.style.setProperty('--cover-line-len', String(len));
    el.style.setProperty('--cover-line-delay', `${Math.min(i * 20, 360)}ms`);

    // Preserve authoring dash pattern (e.g. "5 5", "8 8") for after the draw
    const authoredDash = el.getAttribute('stroke-dasharray') || '';
    el.dataset.dashRest = authoredDash;

    // Hide with solid dash = full length (draw technique); restore pattern when drawn
    el.setAttribute('stroke-dasharray', String(len));
    el.setAttribute('stroke-dashoffset', String(len));
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);

    // Authoring opacities are often 0.2–0.5 — boost so the draw is readable
    const op = Number(el.getAttribute('opacity') || '1');
    if (op < 0.85) {
      el.dataset.opacityRest = String(op);
      el.setAttribute('opacity', '0.95');
    }

    // After draw completes, put dashed patterns back
    el.addEventListener('transitionend', (ev) => {
      if (ev.propertyName !== 'stroke-dashoffset') return;
      if (!host.classList.contains('is-drawn')) return;
      restoreAuthoredDash(el);
    });
  });

  host.dataset.linesReady = 'true';
  host.classList.remove('is-drawn');
}

/** Restore "5 5" / "8 8" construction dashes after the solid draw finishes. */
function restoreAuthoredDash(el: LineEl) {
  const rest = el.dataset.dashRest || '';
  if (!rest) {
    // Solid construction stroke — leave as continuous line
    return;
  }
  el.setAttribute('stroke-dasharray', rest);
  el.style.strokeDasharray = rest;
  el.setAttribute('stroke-dashoffset', '0');
  el.style.strokeDashoffset = '0';
}

/** Prepare for a fresh solid draw from empty → full. */
function armForDraw(el: LineEl) {
  const len = el.style.getPropertyValue('--cover-line-len') || '1';
  el.setAttribute('stroke-dasharray', len);
  el.style.strokeDasharray = len;
  el.setAttribute('stroke-dashoffset', len);
  el.style.strokeDashoffset = len;
}

function setDrawn(host: HTMLElement, drawn: boolean) {
  const lines = host.querySelectorAll<LineEl>('.cover-line');
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

  // Desktop: draw on hover / focus / magnetic
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
    delete el.dataset.linesReady;
    // Keep SSR-inlined SVG; only clear fetch-only hosts
    if (!el.querySelector('svg')) {
      el.innerHTML = '';
      delete el.dataset.idsScoped;
    }
    el.classList.remove('is-drawn');
  });
  initCoverLines();
}
