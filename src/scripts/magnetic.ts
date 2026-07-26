/**
 * Magnetic offset — Framer withOffset HOC:
 *
 * ```
 * const spring = { type: "spring", stiffness: 300, damping: 30 }
 * offsetFactorX = clamp(mouseX / elementCenterX, -1, 1) * range
 * offsetFactorY = clamp(mouseY / elementCenterY, -1, 1) * range
 * ```
 *
 * Default range = 6 (buttons). Cards use a smaller range via
 * data-magnetic-range (e.g. 3) for a subtler feel on larger targets.
 *
 * Outer shell keeps hit-area size; [data-magnetic-visual] receives spring x/y.
 */

const STIFFNESS = 300;
const DAMPING = 30;
const MASS = 1;

/** Framer default: * 6 after clamping to [-1, 1] */
const DEFAULT_RANGE = 6;

type MagneticState = {
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  vx: number;
  vy: number;
  hovering: boolean;
  raf: number;
  visual: HTMLElement;
  /** Outer fixed hit target (used for mouse math) */
  shell: HTMLElement;
  range: number;
  lastTime: number;
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

/**
 * Framer formula:
 * mouseX = clientX - rect.x - width/2
 * offset = clamp(mouseX / (width/2), -1, 1) * range
 *
 * Measure against the fixed shell so transforms on the visual
 * don't feed back into the math.
 */
function offsetFromEvent(
  shell: HTMLElement,
  clientX: number,
  clientY: number,
  range: number,
) {
  const rect = shell.getBoundingClientRect();
  const elementCenterX = rect.width / 2;
  const elementCenterY = rect.height / 2;
  if (elementCenterX <= 0 || elementCenterY <= 0) {
    return { x: 0, y: 0 };
  }

  const mouseX = clientX - rect.x - elementCenterX;
  const mouseY = clientY - rect.y - elementCenterY;

  const offsetFactorX = clamp(mouseX / elementCenterX, -1, 1) * range;
  const offsetFactorY = clamp(mouseY / elementCenterY, -1, 1) * range;

  return { x: offsetFactorX, y: offsetFactorY };
}

function springStep(
  current: number,
  target: number,
  velocity: number,
  dt: number,
) {
  const a = (-STIFFNESS * (current - target) - DAMPING * velocity) / MASS;
  const v = velocity + a * dt;
  const c = current + v * dt;
  return { value: c, velocity: v };
}

function tick(state: MagneticState, now: number) {
  const dt = Math.min(0.032, (now - state.lastTime) / 1000 || 1 / 60);
  state.lastTime = now;

  const sx = springStep(state.currentX, state.targetX, state.vx, dt);
  const sy = springStep(state.currentY, state.targetY, state.vy, dt);
  state.currentX = sx.value;
  state.vx = sx.velocity;
  state.currentY = sy.value;
  state.vy = sy.velocity;

  if (
    !state.hovering &&
    Math.abs(state.currentX) < 0.02 &&
    Math.abs(state.currentY) < 0.02 &&
    Math.abs(state.vx) < 0.02 &&
    Math.abs(state.vy) < 0.02
  ) {
    state.currentX = 0;
    state.currentY = 0;
    state.vx = 0;
    state.vy = 0;
    state.visual.style.transform = '';
    state.raf = 0;
    return;
  }

  state.visual.style.transform = `translate3d(${state.currentX.toFixed(3)}px, ${state.currentY.toFixed(3)}px, 0)`;

  const moving =
    state.hovering ||
    Math.abs(state.vx) > 0.01 ||
    Math.abs(state.vy) > 0.01 ||
    Math.abs(state.currentX - state.targetX) > 0.02 ||
    Math.abs(state.currentY - state.targetY) > 0.02;

  if (moving) {
    state.raf = requestAnimationFrame((t) => tick(state, t));
  } else {
    state.raf = 0;
  }
}

function startLoop(state: MagneticState) {
  if (state.raf) return;
  state.lastTime = performance.now();
  state.raf = requestAnimationFrame((t) => tick(state, t));
}

function bindMagnetic(el: HTMLElement) {
  if (el.dataset.magneticReady === 'true') return;
  el.dataset.magneticReady = 'true';

  const visual =
    el.querySelector<HTMLElement>('[data-magnetic-visual]') || el;

  const rangeAttr = el.dataset.magneticRange;
  const range = rangeAttr ? parseFloat(rangeAttr) : DEFAULT_RANGE;
  const safeRange = Number.isFinite(range) && range > 0 ? range : DEFAULT_RANGE;

  const state: MagneticState = {
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    vx: 0,
    vy: 0,
    hovering: false,
    raf: 0,
    visual,
    shell: el,
    range: safeRange,
    lastTime: performance.now(),
  };

  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    state.hovering = true;
    el.classList.add('is-magnetic');
    const { x, y } = offsetFromEvent(state.shell, e.clientX, e.clientY, state.range);
    state.targetX = x;
    state.targetY = y;
    startLoop(state);
  });

  el.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || !state.hovering) return;
    const { x, y } = offsetFromEvent(state.shell, e.clientX, e.clientY, state.range);
    state.targetX = x;
    state.targetY = y;
    startLoop(state);
  });

  el.addEventListener('pointerleave', () => {
    state.hovering = false;
    state.targetX = 0;
    state.targetY = 0;
    el.classList.remove('is-magnetic');
    startLoop(state);
  });
}

/** Init all [data-magnetic] elements (buttons, cards, …) */
export function initMagneticButtons(root: ParentNode = document) {
  if (prefersReducedMotion() || !hasFinePointer()) return;
  root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(bindMagnetic);
}

export function destroyMagneticTransforms(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    el.classList.remove('is-magnetic');
    const visual =
      el.querySelector<HTMLElement>('[data-magnetic-visual]') || el;
    visual.style.transform = '';
  });
}
