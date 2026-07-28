/**
 * Multi-layer card parallax (Framer dual-image + MPParallaxView depth).
 *
 * Hierarchy (far → near):
 * - img-back / img-mid — close; depth mainly via different X ranges
 * - front (title/tags) — stronger so text reads as nearer
 *
 * Edge guarantee for image layers (absolute):
 *   |translate| ≤ size × (scale − 1) / 2 − SAFETY
 * Scale comes from card CSS vars (--img-scale / hover), not matrix parsing
 * (computed matrix often read as 1 during transitions and killed all motion).
 *
 * Dual-image edge guarantee (relative):
 *   mid and back share the same Y target so range mid−back (7−5 = 2px)
 *   cannot open the overlaid image’s bottom edge. Depth stays on X.
 *
 * Spring: stiffness 300, damping 30
 */

const STIFFNESS = 300;
const DAMPING = 30;
const MASS = 1;

/** Pixel safety under overscan (subpixel / rounding / AA). */
const BLEED_SAFETY_PX = 4;

/** Fallback when CSS vars are missing — matches ProjectCard defaults. */
const DEFAULT_IMG_SCALE = 1.18;

/** Image layers stay near each other; text stands out more. */
const RANGES = {
  'img-back': 5,
  'img-mid': 7,
  front: 18,
} as const;

type Depth = keyof typeof RANGES;

type Axis = { t: number; c: number; v: number };

type Layer = {
  el: HTMLElement;
  depth: Depth;
  x: Axis;
  y: Axis;
};

type CardState = {
  shell: HTMLElement;
  layers: Layer[];
  hovering: boolean;
  raf: number;
  last: number;
};

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function hasFinePointer() {
  return window.matchMedia('(pointer: fine)').matches;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function springStep(c: number, t: number, v: number, dt: number) {
  const a = (-STIFFNESS * (c - t) - DAMPING * v) / MASS;
  const nv = v + a * dt;
  return { value: c + nv * dt, velocity: nv };
}

function factors(shell: HTMLElement, clientX: number, clientY: number) {
  const rect = shell.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  if (cx <= 0 || cy <= 0) return { nx: 0, ny: 0 };
  return {
    nx: clamp((clientX - rect.x - cx) / cx, -1, 1),
    ny: clamp((clientY - rect.y - cy) / cy, -1, 1),
  };
}

function parseScaleVar(raw: string, fallback: number): number {
  const n = Number.parseFloat(raw.trim());
  return Number.isFinite(n) && n >= 1 ? n : fallback;
}

/**
 * Intended image scale from ProjectCard CSS variables.
 * Prefer rest scale for the clamp (smaller overscan = safer). Hover only
 * increases scale, so using rest never under-clamps during the transition.
 */
function readImageScale(shell: HTMLElement): number {
  const card =
    shell.querySelector<HTMLElement>('.project-card') ?? shell;
  const cs = getComputedStyle(card);
  return parseScaleVar(cs.getPropertyValue('--img-scale'), DEFAULT_IMG_SCALE);
}

/**
 * Max axis translation (px) that keeps a center-scaled layer covering its box.
 * overscan each side = size * (scale - 1) / 2
 */
function maxBleedPx(size: number, scale: number, safety = BLEED_SAFETY_PX): number {
  if (size <= 0 || scale <= 1) return 0;
  return Math.max(0, (size * (scale - 1)) / 2 - safety);
}

function layerSize(el: HTMLElement): { w: number; h: number } {
  const w = el.offsetWidth || el.getBoundingClientRect().width;
  const h = el.offsetHeight || el.getBoundingClientRect().height;
  return { w, h };
}

function isImageDepth(depth: Depth): boolean {
  return depth === 'img-back' || depth === 'img-mid';
}

function applyLayer(layer: Layer) {
  const { el, x, y } = layer;
  if (Math.abs(x.c) < 0.02 && Math.abs(y.c) < 0.02) {
    el.style.transform = '';
    return;
  }
  el.style.transform = `translate3d(${x.c.toFixed(3)}px, ${y.c.toFixed(3)}px, 0)`;
}

function tick(state: CardState, now: number) {
  const dt = Math.min(0.032, (now - state.last) / 1000 || 1 / 60);
  state.last = now;

  let moving = state.hovering;

  for (const layer of state.layers) {
    const sx = springStep(layer.x.c, layer.x.t, layer.x.v, dt);
    const sy = springStep(layer.y.c, layer.y.t, layer.y.v, dt);
    layer.x.c = sx.value;
    layer.x.v = sx.velocity;
    layer.y.c = sy.value;
    layer.y.v = sy.velocity;
    applyLayer(layer);

    if (
      Math.abs(layer.x.v) > 0.01 ||
      Math.abs(layer.y.v) > 0.01 ||
      Math.abs(layer.x.c - layer.x.t) > 0.02 ||
      Math.abs(layer.y.c - layer.y.t) > 0.02
    ) {
      moving = true;
    }
  }

  if (!state.hovering && !moving) {
    for (const layer of state.layers) {
      layer.x = { t: 0, c: 0, v: 0 };
      layer.y = { t: 0, c: 0, v: 0 };
      applyLayer(layer);
    }
    state.raf = 0;
    return;
  }

  if (moving) {
    state.raf = requestAnimationFrame((t) => tick(state, t));
  } else {
    state.raf = 0;
  }
}

function start(state: CardState) {
  if (state.raf) return;
  state.last = performance.now();
  state.raf = requestAnimationFrame((t) => tick(state, t));
}

function bindCard(shell: HTMLElement) {
  if (shell.dataset.cardParallaxReady === 'true') return;
  shell.dataset.cardParallaxReady = 'true';

  const layers: Layer[] = [];
  (Object.keys(RANGES) as Depth[]).forEach((depth) => {
    shell.querySelectorAll<HTMLElement>(`[data-parallax-depth="${depth}"]`).forEach((el) => {
      layers.push({
        el,
        depth,
        x: { t: 0, c: 0, v: 0 },
        y: { t: 0, c: 0, v: 0 },
      });
    });
  });

  if (!layers.length) return;

  const state: CardState = {
    shell,
    layers,
    hovering: false,
    raf: 0,
    last: performance.now(),
  };

  const dualCard = Boolean(shell.querySelector('.has-dual-image'));

  const setFromEvent = (clientX: number, clientY: number) => {
    const { nx, ny } = factors(shell, clientX, clientY);
    const scale = readImageScale(shell);

    type Plan = { layer: Layer; xRange: number; yRange: number };
    const plans: Plan[] = [];

    for (const layer of state.layers) {
      const range = RANGES[layer.depth];
      let xRange = range;
      let yRange = range;

      if (isImageDepth(layer.depth)) {
        const { w, h } = layerSize(layer.el);
        // Never let a bad size/scale zero out motion if scale is clearly > 1 —
        // fall back to full design range when bleed is huge vs range anyway.
        const bleedX = maxBleedPx(w, scale);
        const bleedY = maxBleedPx(h, scale);
        xRange = bleedX > 0 ? Math.min(range, bleedX) : range;
        yRange = bleedY > 0 ? Math.min(range, bleedY) : range;
        // If we truly have no overscan (scale ≈ 1), keep a tiny X-only drift
        // for contain cards instead of a hard edge peek on Y.
        if (bleedY <= 0) yRange = 0;
        if (bleedX <= 0) xRange = Math.min(range, 2);
      }

      plans.push({ layer, xRange, yRange });
    }

    if (dualCard) {
      /**
       * Same Y on back + mid → relative vertical drift = 0.
       * (Design ranges 7 vs 5 produced exactly ~2px edge peek.)
       * X ranges stay different so dual depth remains readable.
       */
      const imgPlans = plans.filter((p) => isImageDepth(p.layer.depth));
      if (imgPlans.length > 1) {
        const yLock = Math.min(...imgPlans.map((p) => p.yRange));
        for (const p of imgPlans) p.yRange = yLock;
      }
    }

    for (const { layer, xRange, yRange } of plans) {
      layer.x.t = nx * xRange;
      layer.y.t = ny * yRange;
    }
  };

  const zero = () => {
    for (const layer of state.layers) {
      layer.x.t = 0;
      layer.y.t = 0;
    }
  };

  shell.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    state.hovering = true;
    setFromEvent(e.clientX, e.clientY);
    start(state);
  });

  shell.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || !state.hovering) return;
    setFromEvent(e.clientX, e.clientY);
    start(state);
  });

  shell.addEventListener('pointerleave', () => {
    state.hovering = false;
    zero();
    start(state);
  });
}

export function initCardParallax(root: ParentNode = document) {
  if (prefersReducedMotion() || !hasFinePointer()) return;
  root
    .querySelectorAll<HTMLElement>('[data-card-parallax]')
    .forEach(bindCard);
}
