/**
 * Soft cursor — viniciusramos.com style.
 *
 * Free: 32×32 circle, follows pointer
 * Block: scale + fade OUT under the pointer (no center-seek)
 * Soon (desktop): expand to white “Coming Soon” pill
 *
 * Leaving soon: pill closes (width spring) + label fades — no hard cut.
 */

const DEFAULT_SIZE = 32;
const SOON_W = 132;
const SOON_H = 36;
const BLOCK_SCALE = 2.2;

const POS_STIFF = 300;
const POS_DAMP = 30;
const SCALE_STIFF = 300;
const SCALE_DAMP = 30;
const SIZE_STIFF = 380;
const SIZE_DAMP = 34;

type CursorMode = 'free' | 'block' | 'soon';

type CursorState = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;

  scale: number;
  ts: number;
  vs: number;

  w: number;
  h: number;
  tw: number;
  th: number;
  vw: number;
  vh: number;

  opacity: number;
  to: number;

  /** 0–1 label fade (Coming Soon text) */
  labelOp: number;
  labelTo: number;

  mode: CursorMode;
  visible: boolean;
  raf: number;
  last: number;
  el: HTMLDivElement;
  labelEl: HTMLSpanElement;
  activeTarget: Element | null;
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

function springStep(
  current: number,
  target: number,
  velocity: number,
  stiff: number,
  damp: number,
  dt: number,
) {
  const a = -stiff * (current - target) - damp * velocity;
  const v = velocity + a * dt;
  const c = current + v * dt;
  return { value: c, velocity: v };
}

function findCursorTarget(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof Element)) return null;
  return node.closest<HTMLElement>(
    '[data-cursor="block"], [data-cursor="soon"], [data-magnetic], a.btn, button.btn',
  );
}

function isSoonTarget(el: HTMLElement | null) {
  if (!el) return false;
  return (
    el.dataset.cursor === 'soon' ||
    el.classList.contains('is-soon') ||
    !!el.closest('.is-soon, [data-cursor="soon"]')
  );
}

function ensureCursorEl(): { el: HTMLDivElement; label: HTMLSpanElement } {
  let el = document.getElementById('site-cursor') as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = 'site-cursor';
    el.setAttribute('aria-hidden', 'true');
    el.className = 'site-cursor';
    const label = document.createElement('span');
    label.className = 'site-cursor__label';
    label.textContent = 'Coming Soon';
    el.appendChild(label);
    document.body.appendChild(el);
    return { el, label };
  }
  let label = el.querySelector<HTMLSpanElement>('.site-cursor__label');
  if (!label) {
    label = document.createElement('span');
    label.className = 'site-cursor__label';
    label.textContent = 'Coming Soon';
    el.appendChild(label);
  }
  return { el, label };
}

function applyDom(state: CursorState) {
  const { el, labelEl } = state;
  el.style.width = `${state.w}px`;
  el.style.height = `${state.h}px`;
  el.style.borderRadius = `${Math.min(state.w, state.h) / 2}px`;
  el.style.opacity = String(state.opacity);
  el.style.transform = `translate3d(${state.x - state.w / 2}px, ${state.y - state.h / 2}px, 0) scale(${state.scale})`;

  el.classList.toggle('is-block', state.mode === 'block');
  // Keep “soon” visual while pill is still wide (smooth exit)
  const visuallySoon = state.mode === 'soon' || state.w > DEFAULT_SIZE + 8;
  el.classList.toggle('is-soon', visuallySoon);
  el.classList.toggle('is-active', state.visible && state.opacity > 0.01);

  // Label fades with its own lerp AND collapses with width (no hard cut)
  const widthFactor = clamp((state.w - DEFAULT_SIZE) / (SOON_W - DEFAULT_SIZE), 0, 1);
  labelEl.style.opacity = String(state.labelOp * widthFactor);
}

function tick(state: CursorState, now: number) {
  const dt = Math.min(0.032, (now - state.last) / 1000 || 1 / 60);
  state.last = now;

  const px = springStep(state.x, state.tx, state.vx, POS_STIFF, POS_DAMP, dt);
  const py = springStep(state.y, state.ty, state.vy, POS_STIFF, POS_DAMP, dt);
  state.x = px.value;
  state.vx = px.velocity;
  state.y = py.value;
  state.vy = py.velocity;

  const ps = springStep(
    state.scale,
    state.ts,
    state.vs,
    SCALE_STIFF,
    SCALE_DAMP,
    dt,
  );
  state.scale = ps.value;
  state.vs = ps.velocity;

  const pw = springStep(state.w, state.tw, state.vw, SIZE_STIFF, SIZE_DAMP, dt);
  const ph = springStep(state.h, state.th, state.vh, SIZE_STIFF, SIZE_DAMP, dt);
  state.w = Math.max(8, pw.value);
  state.vw = pw.velocity;
  state.h = Math.max(8, ph.value);
  state.vh = ph.velocity;

  const opacitySpeed = state.mode === 'block' ? 14 : 11;
  state.opacity += (state.to - state.opacity) * Math.min(1, dt * opacitySpeed);

  // Label fades a bit faster on exit so text is gone before pill fully closes
  const labelSpeed = state.labelTo > state.labelOp ? 12 : 16;
  state.labelOp += (state.labelTo - state.labelOp) * Math.min(1, dt * labelSpeed);

  applyDom(state);

  const moving =
    Math.abs(state.vx) > 0.02 ||
    Math.abs(state.vy) > 0.02 ||
    Math.abs(state.vs) > 0.001 ||
    Math.abs(state.vw) > 0.02 ||
    Math.abs(state.vh) > 0.02 ||
    Math.abs(state.x - state.tx) > 0.1 ||
    Math.abs(state.y - state.ty) > 0.1 ||
    Math.abs(state.scale - state.ts) > 0.002 ||
    Math.abs(state.w - state.tw) > 0.2 ||
    Math.abs(state.h - state.th) > 0.2 ||
    Math.abs(state.opacity - state.to) > 0.01 ||
    Math.abs(state.labelOp - state.labelTo) > 0.01 ||
    state.visible;

  if (moving) {
    state.raf = requestAnimationFrame((t) => tick(state, t));
  } else {
    state.raf = 0;
  }
}

function start(state: CursorState) {
  if (state.raf) return;
  state.last = performance.now();
  state.raf = requestAnimationFrame((t) => tick(state, t));
}

function setFree(state: CursorState, clientX: number, clientY: number) {
  state.mode = 'free';
  state.activeTarget = null;
  state.tx = clientX;
  state.ty = clientY;
  state.ts = 1;
  state.to = 1;
  state.tw = DEFAULT_SIZE;
  state.th = DEFAULT_SIZE;
  state.labelTo = 0;
}

/** Dissolve under the pointer — do not move toward element center */
function setBlock(
  state: CursorState,
  clientX: number,
  clientY: number,
  target: HTMLElement,
) {
  state.mode = 'block';
  state.activeTarget = target;
  state.tx = clientX;
  state.ty = clientY;
  state.ts = BLOCK_SCALE;
  state.to = 0;
  // Close any open soon-pill first (spring), then dissolve as circle
  state.tw = DEFAULT_SIZE;
  state.th = DEFAULT_SIZE;
  state.labelTo = 0;
}

/** Desktop soon cards: pill “Coming Soon” under the pointer */
function setSoon(
  state: CursorState,
  clientX: number,
  clientY: number,
  target: HTMLElement,
) {
  state.mode = 'soon';
  state.activeTarget = target;
  state.tx = clientX;
  state.ty = clientY;
  state.ts = 1;
  state.to = 1;
  state.tw = SOON_W;
  state.th = SOON_H;
  state.labelTo = 1;
}

let disposed = false;

export function initCursor() {
  if (prefersReducedMotion() || !hasFinePointer()) return;
  if (document.documentElement.dataset.cursorReady === 'true') return;
  document.documentElement.dataset.cursorReady = 'true';
  disposed = false;

  const { el, label } = ensureCursorEl();
  const state: CursorState = {
    x: -100,
    y: -100,
    tx: -100,
    ty: -100,
    vx: 0,
    vy: 0,
    scale: 1,
    ts: 1,
    vs: 0,
    w: DEFAULT_SIZE,
    h: DEFAULT_SIZE,
    tw: DEFAULT_SIZE,
    th: DEFAULT_SIZE,
    vw: 0,
    vh: 0,
    opacity: 0,
    to: 0,
    labelOp: 0,
    labelTo: 0,
    mode: 'free',
    visible: false,
    raf: 0,
    last: performance.now(),
    el,
    labelEl: label,
    activeTarget: null,
  };

  applyDom(state);

  const onMove = (e: PointerEvent) => {
    if (disposed || e.pointerType === 'touch') return;

    if (!state.visible) {
      state.visible = true;
      state.x = e.clientX;
      state.y = e.clientY;
      state.tx = e.clientX;
      state.ty = e.clientY;
    }

    const target = findCursorTarget(e.target);
    if (target && isSoonTarget(target)) {
      setSoon(state, e.clientX, e.clientY, target);
    } else if (target) {
      setBlock(state, e.clientX, e.clientY, target);
    } else {
      setFree(state, e.clientX, e.clientY);
    }

    start(state);
  };

  const onLeaveWindow = () => {
    state.to = 0;
    state.ts = 1;
    state.tw = DEFAULT_SIZE;
    state.th = DEFAULT_SIZE;
    state.labelTo = 0;
    state.visible = false;
    state.mode = 'free';
    state.activeTarget = null;
    start(state);
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('mouseleave', onLeaveWindow);

  (window as unknown as { __disposeSiteCursor?: () => void }).__disposeSiteCursor =
    () => {
      disposed = true;
      document.documentElement.dataset.cursorReady = 'false';
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', onLeaveWindow);
      el.remove();
    };
}

export function disposeCursor() {
  (window as unknown as { __disposeSiteCursor?: () => void }).__disposeSiteCursor?.();
}
