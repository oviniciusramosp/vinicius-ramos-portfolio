/**
 * Soft cursor — mapped from viniciusramos.com (Framer Cursor component).
 *
 * Variants (production):
 *   Default        32×32 · border 16px glass · solid soft disk
 *   Hover/pointer  58×58 · border → 1px · bg transparent (hole opens as border shrinks)
 *   Text/paragraph  4×32 · blue rgba(0,145,255,0.8)
 *   Text/title      4×48 · blue
 *   Coming Soon   140×32 · glass white + blur · white label
 *
 * The “filled disk → hollow ring” effect is a CSS border on a ::after overlay
 * (same technique as Framer’s data-border). Border width springs down; center
 * becomes transparent.
 */

const DEFAULT_SIZE = 32;
const POINTER_SIZE = 58;
const TEXT_W = 4;
const TEXT_H = 32;
const TEXT_TITLE_H = 48;
const SOON_W = 140;
const SOON_H = DEFAULT_SIZE;

/** Default fills the circle (16+16 = 32). Pointer leaves a 1px ring then transparent. */
const DEFAULT_BORDER = 16;
const POINTER_BORDER = 1;
const ZERO_BORDER = 0;

const GLASS = 'rgba(255, 255, 255, 0.1)';
const CLEAR = 'rgba(255, 255, 255, 0)';
const BLUE = 'rgba(0, 145, 255, 0.8)';
const SOON_BG = 'rgba(255, 255, 255, 0.2)';

/**
 * Position: snappier follow so the disk tracks the real pointer with less lag.
 * Size / border: keep Framer-mapped springs — mode morphs stay smooth.
 * (critically damped-ish: damp ≈ 2√stiff)
 */
const POS_STIFF = 1400;
const POS_DAMP = 78;
const SIZE_STIFF = 500;
const SIZE_DAMP = 60;
const BORDER_STIFF = 500;
const BORDER_DAMP = 60;

type CursorMode = 'free' | 'pointer' | 'text' | 'text-title' | 'soon' | 'none';

type CursorState = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;

  w: number;
  h: number;
  tw: number;
  th: number;
  vw: number;
  vh: number;

  /** Border width (px) — hollow-center mechanism */
  bw: number;
  tbw: number;
  vbw: number;

  opacity: number;
  to: number;

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

/**
 * Priority: none > soon > pointer (interactive) > text > free.
 * Interactive targets win over text so links/buttons never get the blue bar.
 */
function resolveMode(node: EventTarget | null): {
  mode: CursorMode;
  target: HTMLElement | null;
} {
  if (!(node instanceof Element)) return { mode: 'free', target: null };

  // Fully hide soft + native cursor (e.g. decorative heart hover)
  const hideEl = node.closest<HTMLElement>('[data-cursor="none"]');
  if (hideEl) return { mode: 'none', target: hideEl };

  // Travel map: native system cursor only (no soft site cursor)
  if (node.closest('.travel-map, .leaflet-container')) {
    const mapEl = node.closest<HTMLElement>('.travel-map, .leaflet-container');
    return { mode: 'none', target: mapEl };
  }

  const interactive = node.closest<HTMLElement>(
    '[data-cursor="block"], [data-cursor="pointer"], [data-cursor="soon"], [data-magnetic], a.btn, button.btn, a[href], button',
  );

  if (interactive) {
    if (
      interactive.dataset.cursor === 'soon' ||
      interactive.classList.contains('is-soon') ||
      !!interactive.closest('.is-soon, [data-cursor="soon"]')
    ) {
      return { mode: 'soon', target: interactive };
    }
    // plain links without data-cursor still get pointer expand
    if (
      interactive.dataset.cursor === 'block' ||
      interactive.dataset.cursor === 'pointer' ||
      interactive.dataset.cursor === 'soon' ||
      interactive.hasAttribute('data-magnetic') ||
      interactive.matches('a.btn, button.btn, a[href], button')
    ) {
      // Text-only links (no card/button chrome) can still prefer text if marked
      if (interactive.dataset.cursor === 'text') {
        return { mode: 'text', target: interactive };
      }
      if (interactive.dataset.cursor === 'text-title') {
        return { mode: 'text-title', target: interactive };
      }
      return { mode: 'pointer', target: interactive };
    }
  }

  const textEl = node.closest<HTMLElement>(
    '[data-cursor="text"], [data-cursor="text-title"], h1, h2, h3, h4, h5, h6, p, .display-title, .body-text, .hero__title, .hero__bio',
  );
  if (textEl && !textEl.closest('a, button, [data-cursor="block"], [data-cursor="pointer"], [data-cursor="soon"], [data-magnetic]')) {
    if (
      textEl.dataset.cursor === 'text-title' ||
      textEl.matches('h1, h2, .display-title, .hero__title')
    ) {
      return { mode: 'text-title', target: textEl };
    }
    return { mode: 'text', target: textEl };
  }

  return { mode: 'free', target: null };
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
  el.style.transform = `translate3d(${state.x - state.w / 2}px, ${state.y - state.h / 2}px, 0)`;
  el.style.setProperty('--cursor-bw', `${Math.max(0, state.bw)}px`);

  const isPointer = state.mode === 'pointer';
  const isText = state.mode === 'text' || state.mode === 'text-title';
  // Keep soon visual while pill is still wide (smooth exit)
  const visuallySoon = state.mode === 'soon' || state.w > DEFAULT_SIZE + 8;

  el.classList.toggle('is-pointer', isPointer);
  el.classList.toggle('is-text', isText);
  el.classList.toggle('is-soon', visuallySoon && !isText && !isPointer);
  el.classList.toggle('is-active', state.visible && state.opacity > 0.01);

  // Background / border color by mode (CSS handles transition)
  if (isPointer) {
    el.style.setProperty('--cursor-bg', CLEAR);
    el.style.setProperty('--cursor-bc', CLEAR);
  } else if (isText) {
    el.style.setProperty('--cursor-bg', BLUE);
    el.style.setProperty('--cursor-bc', CLEAR);
  } else if (visuallySoon) {
    el.style.setProperty('--cursor-bg', SOON_BG);
    el.style.setProperty('--cursor-bc', CLEAR);
  } else {
    el.style.setProperty('--cursor-bg', GLASS);
    el.style.setProperty('--cursor-bc', GLASS);
  }

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

  const pw = springStep(state.w, state.tw, state.vw, SIZE_STIFF, SIZE_DAMP, dt);
  const ph = springStep(state.h, state.th, state.vh, SIZE_STIFF, SIZE_DAMP, dt);
  state.w = Math.max(2, pw.value);
  state.vw = pw.velocity;
  state.h = Math.max(2, ph.value);
  state.vh = ph.velocity;

  const pb = springStep(state.bw, state.tbw, state.vbw, BORDER_STIFF, BORDER_DAMP, dt);
  state.bw = Math.max(0, pb.value);
  state.vbw = pb.velocity;

  state.opacity += (state.to - state.opacity) * Math.min(1, dt * 11);

  const labelSpeed = state.labelTo > state.labelOp ? 12 : 16;
  state.labelOp += (state.labelTo - state.labelOp) * Math.min(1, dt * labelSpeed);

  applyDom(state);

  const moving =
    Math.abs(state.vx) > 0.02 ||
    Math.abs(state.vy) > 0.02 ||
    Math.abs(state.vw) > 0.02 ||
    Math.abs(state.vh) > 0.02 ||
    Math.abs(state.vbw) > 0.02 ||
    Math.abs(state.x - state.tx) > 0.1 ||
    Math.abs(state.y - state.ty) > 0.1 ||
    Math.abs(state.w - state.tw) > 0.2 ||
    Math.abs(state.h - state.th) > 0.2 ||
    Math.abs(state.bw - state.tbw) > 0.05 ||
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
  state.to = 1;
  state.tw = DEFAULT_SIZE;
  state.th = DEFAULT_SIZE;
  state.tbw = DEFAULT_BORDER;
  state.labelTo = 0;
}

/** Expand + open transparent center (border 16 → 1, bg clear). */
function setPointer(
  state: CursorState,
  clientX: number,
  clientY: number,
  target: HTMLElement,
) {
  state.mode = 'pointer';
  state.activeTarget = target;
  state.tx = clientX;
  state.ty = clientY;
  state.to = 1;
  state.tw = POINTER_SIZE;
  state.th = POINTER_SIZE;
  state.tbw = POINTER_BORDER;
  state.labelTo = 0;
}

/** Blue thin bar — paragraph (4×32) or title (4×48). */
function setText(
  state: CursorState,
  clientX: number,
  clientY: number,
  target: HTMLElement,
  title: boolean,
) {
  state.mode = title ? 'text-title' : 'text';
  state.activeTarget = target;
  state.tx = clientX;
  state.ty = clientY;
  state.to = 1;
  state.tw = TEXT_W;
  state.th = title ? TEXT_TITLE_H : TEXT_H;
  state.tbw = ZERO_BORDER;
  state.labelTo = 0;
}

/** Desktop soon cards: glass “Coming Soon” pill. */
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
  state.to = 1;
  state.tw = SOON_W;
  state.th = SOON_H;
  state.tbw = ZERO_BORDER;
  state.labelTo = 1;
}

/** Fully hide soft cursor (native is hidden via CSS cursor: none). */
function setNone(
  state: CursorState,
  clientX: number,
  clientY: number,
  target: HTMLElement,
) {
  state.mode = 'none';
  state.activeTarget = target;
  state.tx = clientX;
  state.ty = clientY;
  state.to = 0;
  state.tw = DEFAULT_SIZE;
  state.th = DEFAULT_SIZE;
  state.tbw = DEFAULT_BORDER;
  state.labelTo = 0;
}

function applyMode(
  state: CursorState,
  mode: CursorMode,
  clientX: number,
  clientY: number,
  target: HTMLElement | null,
) {
  switch (mode) {
    case 'pointer':
      if (target) setPointer(state, clientX, clientY, target);
      else setFree(state, clientX, clientY);
      break;
    case 'text':
      if (target) setText(state, clientX, clientY, target, false);
      else setFree(state, clientX, clientY);
      break;
    case 'text-title':
      if (target) setText(state, clientX, clientY, target, true);
      else setFree(state, clientX, clientY);
      break;
    case 'soon':
      if (target) setSoon(state, clientX, clientY, target);
      else setFree(state, clientX, clientY);
      break;
    case 'none':
      if (target) setNone(state, clientX, clientY, target);
      else setFree(state, clientX, clientY);
      break;
    default:
      setFree(state, clientX, clientY);
  }
}

let disposed = false;

export function initCursor() {
  if (prefersReducedMotion() || !hasFinePointer()) return;

  // View Transitions swap <body> and drop #site-cursor; stale flag would skip re-init.
  const existing = document.getElementById('site-cursor');
  if (document.documentElement.dataset.cursorReady === 'true') {
    if (existing) return;
    disposeCursor();
  }

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
    w: DEFAULT_SIZE,
    h: DEFAULT_SIZE,
    tw: DEFAULT_SIZE,
    th: DEFAULT_SIZE,
    vw: 0,
    vh: 0,
    bw: DEFAULT_BORDER,
    tbw: DEFAULT_BORDER,
    vbw: 0,
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

    const { mode, target } = resolveMode(e.target);
    applyMode(state, mode, e.clientX, e.clientY, target);
    start(state);
  };

  const onLeaveWindow = () => {
    state.to = 0;
    state.tw = DEFAULT_SIZE;
    state.th = DEFAULT_SIZE;
    state.tbw = DEFAULT_BORDER;
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
