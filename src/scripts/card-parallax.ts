/**
 * Internal card layer parallax (MPParallaxView-inspired).
 *
 * Combines with magnetic withOffset on the shell:
 * - Shell / whole card: magnetic range 3 (existing)
 * - Image (back): moves less / slightly opposite → depth “far”
 * - Content (front): moves more with the pointer → depth “near”
 *
 * Depth offsets use the same Framer normalize formula:
 *   factor = clamp(mouse / half, -1, 1) * range
 * with smaller ranges than the shell magnetic.
 *
 * @see https://github.com/DroidsOnRoids/MPParallaxView
 */

const STIFFNESS = 300;
const DAMPING = 30;
const MASS = 1;

/** Extra px range for internal layers (subtle; shell already moves ±3) */
const BACK_RANGE = 6;
const FRONT_RANGE = 10;

type LayerState = {
  shell: HTMLElement;
  back: HTMLElement | null;
  front: HTMLElement | null;
  // back
  btx: number;
  bty: number;
  bx: number;
  by: number;
  bvx: number;
  bvy: number;
  // front
  ftx: number;
  fty: number;
  fx: number;
  fy: number;
  fvx: number;
  fvy: number;
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
  const mx = clientX - rect.x - cx;
  const my = clientY - rect.y - cy;
  return {
    nx: clamp(mx / cx, -1, 1),
    ny: clamp(my / cy, -1, 1),
  };
}

function applyLayer(el: HTMLElement | null, x: number, y: number) {
  if (!el) return;
  if (Math.abs(x) < 0.02 && Math.abs(y) < 0.02) {
    el.style.transform = '';
    return;
  }
  el.style.transform = `translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, 0)`;
}

function tick(state: LayerState, now: number) {
  const dt = Math.min(0.032, (now - state.last) / 1000 || 1 / 60);
  state.last = now;

  const bx = springStep(state.bx, state.btx, state.bvx, dt);
  const by = springStep(state.by, state.bty, state.bvy, dt);
  state.bx = bx.value;
  state.bvx = bx.velocity;
  state.by = by.value;
  state.bvy = by.velocity;

  const fx = springStep(state.fx, state.ftx, state.fvx, dt);
  const fy = springStep(state.fy, state.fty, state.fvy, dt);
  state.fx = fx.value;
  state.fvx = fx.velocity;
  state.fy = fy.value;
  state.fvy = fy.velocity;

  applyLayer(state.back, state.bx, state.by);
  applyLayer(state.front, state.fx, state.fy);

  const still =
    state.hovering ||
    Math.abs(state.bvx) > 0.01 ||
    Math.abs(state.bvy) > 0.01 ||
    Math.abs(state.fvx) > 0.01 ||
    Math.abs(state.fvy) > 0.01 ||
    Math.abs(state.bx - state.btx) > 0.02 ||
    Math.abs(state.fx - state.ftx) > 0.02;

  if (!state.hovering && !still) {
    applyLayer(state.back, 0, 0);
    applyLayer(state.front, 0, 0);
    state.raf = 0;
    return;
  }

  if (still) {
    state.raf = requestAnimationFrame((t) => tick(state, t));
  } else {
    state.raf = 0;
  }
}

function start(state: LayerState) {
  if (state.raf) return;
  state.last = performance.now();
  state.raf = requestAnimationFrame((t) => tick(state, t));
}

function bindCard(shell: HTMLElement) {
  if (shell.dataset.cardParallaxReady === 'true') return;
  shell.dataset.cardParallaxReady = 'true';

  const state: LayerState = {
    shell,
    back: shell.querySelector<HTMLElement>('[data-parallax-depth="back"]'),
    front: shell.querySelector<HTMLElement>('[data-parallax-depth="front"]'),
    btx: 0,
    bty: 0,
    bx: 0,
    by: 0,
    bvx: 0,
    bvy: 0,
    ftx: 0,
    fty: 0,
    fx: 0,
    fy: 0,
    fvx: 0,
    fvy: 0,
    hovering: false,
    raf: 0,
    last: performance.now(),
  };

  if (!state.back && !state.front) return;

  const setFromEvent = (clientX: number, clientY: number) => {
    const { nx, ny } = factors(shell, clientX, clientY);
    // Back (image): less travel → reads as farther
    state.btx = nx * BACK_RANGE * 0.45;
    state.bty = ny * BACK_RANGE * 0.45;
    // Front (title/tags): more travel → nearer
    state.ftx = nx * FRONT_RANGE;
    state.fty = ny * FRONT_RANGE;
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
    state.btx = 0;
    state.bty = 0;
    state.ftx = 0;
    state.fty = 0;
    start(state);
  });
}

export function initCardParallax(root: ParentNode = document) {
  if (prefersReducedMotion() || !hasFinePointer()) return;
  root
    .querySelectorAll<HTMLElement>('[data-card-parallax]')
    .forEach(bindCard);
}
