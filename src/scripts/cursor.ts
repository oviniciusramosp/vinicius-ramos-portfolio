/**
 * Soft cursor — viniciusramos.com / Framer "Default" highlight.
 *
 * Free space:
 *   32×32 circle, rgba(255,255,255,0.1), opacity 1, follows pointer
 *
 * Over a block (button):
 *   scales up + opacity → 0 (cursor “becomes” the button)
 *   Button’s own hover fill is what remains visible
 *
 * System pointer stays; this is a highlight layer only.
 */

const DEFAULT_SIZE = 32;
const DEFAULT_RADIUS = 40;

// Free-follow spring
const POS_STIFF = 300;
const POS_DAMP = 30;

// Scale / opacity when absorbing into a block
const SCALE_STIFF = 300;
const SCALE_DAMP = 30;
/** How large the blob grows as it dissolves into the control */
const BLOCK_SCALE = 2.2;

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

  opacity: number;
  to: number;

  visible: boolean;
  hoveringBlock: boolean;
  raf: number;
  last: number;
  el: HTMLDivElement;
  activeTarget: Element | null;
};

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function hasFinePointer() {
  return window.matchMedia('(pointer: fine)').matches;
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

function findBlockTarget(node: EventTarget | null): HTMLElement | null {
  if (!(node instanceof Element)) return null;
  return node.closest<HTMLElement>(
    '[data-cursor="block"], [data-magnetic], a.btn, button.btn',
  );
}

function ensureCursorEl(): HTMLDivElement {
  let el = document.getElementById('site-cursor') as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = 'site-cursor';
    el.setAttribute('aria-hidden', 'true');
    el.className = 'site-cursor';
    document.body.appendChild(el);
  }
  return el;
}

function applyDom(state: CursorState) {
  const { el } = state;
  // Fixed visual size; scale handles the “grow into button” feel
  el.style.width = `${DEFAULT_SIZE}px`;
  el.style.height = `${DEFAULT_SIZE}px`;
  el.style.borderRadius = `${DEFAULT_RADIUS}px`;
  el.style.opacity = String(state.opacity);
  el.style.transform = `translate3d(${state.x - DEFAULT_SIZE / 2}px, ${state.y - DEFAULT_SIZE / 2}px, 0) scale(${state.scale})`;
  el.classList.toggle('is-block', state.hoveringBlock);
  el.classList.toggle('is-active', state.visible && state.opacity > 0.01);
}

function tick(state: CursorState, now: number) {
  const dt = Math.min(0.032, (now - state.last) / 1000 || 1 / 60);
  state.last = now;

  // While dissolving into a block, track its center (button also moves magnetically)
  if (state.activeTarget && state.hoveringBlock) {
    const rect = state.activeTarget.getBoundingClientRect();
    state.tx = rect.left + rect.width / 2;
    state.ty = rect.top + rect.height / 2;
  }

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

  // Opacity: ease toward target (0 on block, 1 free)
  const opacityLerp = Math.min(1, dt * (state.hoveringBlock ? 10 : 12));
  state.opacity += (state.to - state.opacity) * opacityLerp;

  applyDom(state);

  const moving =
    Math.abs(state.vx) > 0.02 ||
    Math.abs(state.vy) > 0.02 ||
    Math.abs(state.vs) > 0.001 ||
    Math.abs(state.x - state.tx) > 0.1 ||
    Math.abs(state.y - state.ty) > 0.1 ||
    Math.abs(state.scale - state.ts) > 0.002 ||
    Math.abs(state.opacity - state.to) > 0.01 ||
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
  state.hoveringBlock = false;
  state.activeTarget = null;
  state.tx = clientX;
  state.ty = clientY;
  state.ts = 1;
  state.to = 1;
}

function setBlock(state: CursorState, target: HTMLElement) {
  state.hoveringBlock = true;
  state.activeTarget = target;
  const rect = target.getBoundingClientRect();
  state.tx = rect.left + rect.width / 2;
  state.ty = rect.top + rect.height / 2;
  // Grow + fade out → “becomes” the button
  state.ts = BLOCK_SCALE;
  state.to = 0;
}

let disposed = false;

export function initCursor() {
  if (prefersReducedMotion() || !hasFinePointer()) return;
  if (document.documentElement.dataset.cursorReady === 'true') return;
  document.documentElement.dataset.cursorReady = 'true';
  disposed = false;

  const el = ensureCursorEl();
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
    opacity: 0,
    to: 0,
    visible: false,
    hoveringBlock: false,
    raf: 0,
    last: performance.now(),
    el,
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

    const block = findBlockTarget(e.target);
    if (block) {
      setBlock(state, block);
    } else {
      setFree(state, e.clientX, e.clientY);
    }

    start(state);
  };

  const onLeaveWindow = () => {
    state.to = 0;
    state.ts = 1;
    state.visible = false;
    state.hoveringBlock = false;
    state.activeTarget = null;
    start(state);
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('mouseleave', onLeaveWindow);

  const poll = () => {
    if (disposed) return;
    if (state.activeTarget && state.hoveringBlock) start(state);
    requestAnimationFrame(poll);
  };
  requestAnimationFrame(poll);

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
