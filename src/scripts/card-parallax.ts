/**
 * Multi-layer card parallax (Framer dual-image + MPParallaxView depth).
 *
 * Hierarchy (far → near):
 * - img-back / img-mid — close to each other (subtle relative drift)
 * - front (title/tags) — clearly stronger so text reads as nearer
 *
 * Same normalize as withOffset: clamp(mouse/half, -1, 1) * range
 * Spring: stiffness 300, damping 30
 */

const STIFFNESS = 300;
const DAMPING = 30;
const MASS = 1;

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

  /**
   * Contain / bottom-aligned assets (Booking, etc.) have little or no scale
   * bleed. Full Y parallax translates the layer off its fitted edge and shows
   * a hard crop line — dampen image layers heavily; leave text (front) alone.
   */
  const containCard = Boolean(shell.querySelector('.project-card--fit-contain'));
  const bookingCard = Boolean(shell.querySelector('.project-card--slug-booking'));

  const setFromEvent = (clientX: number, clientY: number) => {
    const { nx, ny } = factors(shell, clientX, clientY);
    for (const layer of state.layers) {
      const range = RANGES[layer.depth];
      const isImage = layer.depth === 'img-back' || layer.depth === 'img-mid';
      let xRange = range;
      let yRange = range;
      if (isImage && (containCard || bookingCard)) {
        // Mostly horizontal drift; tiny Y so bottom edge never peeks
        xRange = range * 0.45;
        yRange = bookingCard ? range * 0.12 : range * 0.25;
      }
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
