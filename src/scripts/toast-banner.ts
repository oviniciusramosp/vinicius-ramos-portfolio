/**
 * Toast banner client behaviour (Apple AAP-style entrance + dismiss).
 *
 * Works when:
 * - Astro view-transitions remount HTML
 * - Storybook swaps story DOM without re-running component <script> modules
 *
 * Markup contract (data attributes on the root):
 * - [data-dev-toast] root
 * - [data-storage-key] optional localStorage key for dismiss
 * - [data-enter-delay] optional ms before entrance (default 160)
 * - children: [data-dev-toast-intro], [data-dev-toast-bg],
 *             [data-dev-toast-content], [data-dev-toast-text],
 *             [data-dev-toast-dismiss]
 */

const DT = 1 / 60;

function springStep(
  mass: number,
  stiffness: number,
  damping: number,
  position: number,
  velocity: number,
  target: number,
): { position: number; velocity: number } {
  const n =
    velocity +
    ((-stiffness * (position - target) + -damping * velocity) / mass) * DT;
  return { position: position + n * DT, velocity: n };
}

type Prop = {
  position: number;
  target: number;
  velocity: number;
  stiffness: number;
  damping: number;
};
type PropMap = Record<string, Prop>;

function prop(position: number, stiffness: number, damping: number): Prop {
  return { position, target: position, velocity: 0, stiffness, damping };
}

function near(p: Prop, eps = 0.001): boolean {
  return Math.abs(p.position - p.target) < eps && Math.abs(p.velocity) < eps;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function storageKeyOf(toast: HTMLElement): string {
  return toast.dataset.storageKey?.trim() ?? '';
}

function isDismissed(toast: HTMLElement): boolean {
  const key = storageKeyOf(toast);
  if (!key) return false;
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function persistDismiss(toast: HTMLElement): void {
  const key = storageKeyOf(toast);
  if (!key) return;
  try {
    localStorage.setItem(key, '1');
  } catch {
    /* ignore */
  }
}

/** Clear dismiss flag so the toast can play again (Storybook / QA). */
export function clearToastDismiss(storageKey: string): void {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    /* ignore */
  }
}

type Run = { raf: number; timers: number[]; stop: boolean };
const runs = new WeakMap<HTMLElement, Run>();

function stopRun(toast: HTMLElement): void {
  const run = runs.get(toast);
  if (!run) return;
  run.stop = true;
  cancelAnimationFrame(run.raf);
  run.timers.forEach((id) => clearTimeout(id));
  runs.delete(toast);
}

function schedule(run: Run, ms: number, fn: () => void): void {
  run.timers.push(
    window.setTimeout(() => {
      if (!run.stop) fn();
    }, ms),
  );
}

function clearSpringStyles(toast: HTMLElement): void {
  toast.style.transform = '';
  toast.style.width = '';
  toast.style.maxWidth = '';
  toast
    .querySelectorAll<HTMLElement>(
      '[data-dev-toast-intro],[data-dev-toast-bg],[data-dev-toast-text],[data-dev-toast-dismiss]',
    )
    .forEach((el) => {
      el.style.width = '';
      el.style.height = '';
      el.style.transform = '';
      el.style.opacity = '';
    });
}

function tokenPx(toast: HTMLElement, name: string, fallback: number): number {
  const n = parseFloat(getComputedStyle(toast).getPropertyValue(name).trim());
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Max outer width for the toast shell (matches CSS --toast-max). */
function toastMaxPx(toast: HTMLElement): number {
  const raw = getComputedStyle(toast).getPropertyValue('--toast-max').trim();
  // --toast-max is min(calc(...), 420px) — resolve via a probe element
  if (raw) {
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:absolute;visibility:hidden;pointer-events:none;width:var(--toast-max)';
    toast.appendChild(probe);
    const w = probe.getBoundingClientRect().width;
    probe.remove();
    if (w > 0) return Math.floor(w);
  }
  return Math.min(Math.max(0, window.innerWidth - 32), 420);
}

function measure(toast: HTMLElement): {
  w: number;
  h: number;
  icon: number;
  iconTravel: number;
} {
  clearSpringStyles(toast);
  toast.style.width = '';
  toast.style.maxWidth = '';
  toast.classList.add('is-measuring');
  toast.hidden = false;

  const content = toast.querySelector<HTMLElement>('[data-dev-toast-content]');
  const dismiss = toast.querySelector<HTMLElement>('[data-dev-toast-dismiss]');
  const icon = tokenPx(toast, '--icon-size', 36);
  const aapH = tokenPx(toast, '--aap-h', 56);
  const margin = tokenPx(toast, '--icon-margin', 10);
  const maxW = toastMaxPx(toast);

  // Pass 1: natural hug width (short copy stays tight)
  toast.style.width = 'max-content';
  toast.style.maxWidth = `${maxW}px`;
  void toast.offsetWidth;

  let rect = (content ?? toast).getBoundingClientRect();
  let w = Math.ceil(rect.width);

  // Pass 2: if natural wants more than the viewport cap, force cap so text wraps
  // and height is measured at the real final width (bg + content stay in sync)
  if (w >= maxW - 1) {
    w = maxW;
    toast.style.width = `${maxW}px`;
    void toast.offsetWidth;
    rect = (content ?? toast).getBoundingClientRect();
  } else {
    w = Math.min(Math.max(w, icon * 2 + margin * 2), maxW);
    toast.style.width = `${w}px`;
    void toast.offsetWidth;
    rect = (content ?? toast).getBoundingClientRect();
  }

  const h = Math.ceil(Math.max(rect.height, aapH));

  let iconTravel = Math.max(0, w * 0.5 - (margin + icon * 0.5));

  if (content && dismiss) {
    dismiss.style.transform = `translate3d(0, ${-icon / 2}px, 0) scale(1)`;
    dismiss.style.opacity = '0';
    const c = content.getBoundingClientRect();
    const d = dismiss.getBoundingClientRect();
    if (d.width > 0) {
      const contentCx = c.left + c.width / 2;
      const iconCx = d.left + d.width / 2;
      iconTravel = Math.max(0, iconCx - contentCx);
    }
    dismiss.style.transform = '';
    dismiss.style.opacity = '';
  }

  toast.classList.remove('is-measuring');
  // Keep measured width on the shell so content/bg share one box after enter
  toast.style.width = `${w}px`;
  toast.style.maxWidth = `${maxW}px`;
  return { w, h, icon, iconTravel };
}

function stepProps(props: PropMap): boolean {
  let settled = true;
  for (const key of Object.keys(props)) {
    const p = props[key];
    if (near(p)) {
      p.position = p.target;
      p.velocity = 0;
      continue;
    }
    settled = false;
    const next = springStep(1, p.stiffness, p.damping, p.position, p.velocity, p.target);
    p.position = next.position;
    p.velocity = next.velocity;
  }
  return settled;
}

function applyAapY(toast: HTMLElement, y: number): void {
  toast.style.transform = `translate3d(-50%, ${y}px, 0)`;
}

function applyShape(
  el: HTMLElement,
  width: number,
  height: number,
  scale: number,
): void {
  el.style.width = `${Math.max(0, width)}px`;
  el.style.height = `${Math.max(0, height)}px`;
  el.style.transform = `translate3d(-50%, -50%, 0) scale(${scale})`;
}

function applyIcon(
  el: HTMLElement,
  x: number,
  y: number,
  scale: number,
  width: number,
  height: number,
): void {
  el.style.width = `${Math.max(0, width)}px`;
  el.style.height = `${height}px`;
  el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
}

function applyText(el: HTMLElement, scale: number): void {
  el.style.transform = `scale(${scale})`;
}

function playEnter(toast: HTMLElement): void {
  if (toast.dataset.entered === '1') {
    settleInstant(toast);
    return;
  }
  toast.dataset.entered = '1';
  stopRun(toast);

  const intro = toast.querySelector<HTMLElement>('[data-dev-toast-intro]')!;
  const bg = toast.querySelector<HTMLElement>('[data-dev-toast-bg]')!;
  const text = toast.querySelector<HTMLElement>('[data-dev-toast-text]')!;
  const icon = toast.querySelector<HTMLElement>('[data-dev-toast-dismiss]')!;

  const { w, h, icon: iconSize, iconTravel } = measure(toast);
  toast.style.setProperty('--toast-w', `${w}px`);
  toast.style.setProperty('--toast-h', `${h}px`);
  toast.hidden = false;
  toast.classList.remove(
    'inactive',
    'is-leaving',
    'is-text-in',
    'is-interactive',
    'is-activated',
    'is-bg-live',
  );

  const iconY = -iconSize / 2;
  const seed = h;

  if (prefersReducedMotion()) {
    settleInstant(toast, w, h, iconSize);
    return;
  }

  const durBounce = (duration: number, bounce: number) => ({
    stiffness: (2 * Math.PI / duration) ** 2,
    damping: (1 - bounce) * (4 * Math.PI) / duration,
  });
  const scaleEase = durBounce(0.5, 0);

  const aap = { y: prop(180, 100, 8) };

  const introS = {
    scale: prop(1.3, scaleEase.stiffness, scaleEase.damping),
    width: prop(30, 100, 8),
    height: prop(80, 100, 8),
  };

  const bgS = {
    width: prop(seed, 100, 20),
    height: prop(seed, 100, 20),
    scale: prop(1, scaleEase.stiffness, scaleEase.damping),
  };

  const iconS = {
    x: prop(-iconTravel, 110, 20),
    y: prop(iconY, 100, 20),
    scale: prop(0, 100, 20),
    width: prop(iconSize, 100, 10),
  };
  iconS.y.target = iconY;

  const textS = { scale: prop(0.5, 100, 20) };

  const paint = () => {
    applyAapY(toast, aap.y.position);
    applyShape(intro, introS.width.position, introS.height.position, introS.scale.position);
    applyShape(bg, bgS.width.position, bgS.height.position, bgS.scale.position);
    applyIcon(
      icon,
      iconS.x.position,
      iconS.y.position,
      iconS.scale.position,
      iconS.width.position,
      iconSize,
    );
    applyText(text, textS.scale.position);
  };

  intro.style.opacity = '0';
  bg.style.opacity = '';
  paint();

  const run: Run = { raf: 0, timers: [], stop: false };
  runs.set(toast, run);
  let active = true;

  const tick = () => {
    if (run.stop) return;
    let allSettled = true;
    for (const g of [aap, introS, bgS, iconS, textS]) {
      if (!stepProps(g)) allSettled = false;
    }
    if (iconS.width.position < iconSize * 0.85) {
      iconS.width.position = iconSize * 0.85;
    }
    paint();
    if (!allSettled || active) run.raf = requestAnimationFrame(tick);
  };

  schedule(run, 0, () => {
    run.raf = requestAnimationFrame(tick);
  });

  schedule(run, 20, () => {
    toast.classList.add('is-activated');
    intro.style.opacity = '1';
    introS.scale.target = 0.85;
  });

  schedule(run, 30, () => {
    aap.y.target = 0;
  });

  schedule(run, 50, () => {
    introS.width.target = seed;
  });

  schedule(run, 150, () => {
    introS.height.target = seed;
  });

  schedule(run, 200, () => {
    iconS.scale.target = 1;
  });

  schedule(run, 480, () => {
    bgS.width.position = seed;
    bgS.width.target = seed;
    bgS.height.position = seed;
    bgS.height.target = seed;
    bgS.scale.position = 1;
    bgS.scale.target = 1;
    toast.classList.add('is-bg-live');
    intro.style.opacity = '0';
    intro.style.transition = 'opacity 120ms ease';
  });

  schedule(run, 500, () => {
    bgS.width.target = w;
    iconS.width.velocity = 200;
    iconS.x.target = 0;
  });

  schedule(run, 520, () => {
    toast.classList.add('is-interactive');
  });

  schedule(run, 600, () => {
    textS.scale.target = 1;
    toast.classList.add('is-text-in');
  });

  schedule(run, 700, () => {
    bgS.height.target = h;
  });

  schedule(run, 1400, () => {
    aap.y.position = aap.y.target = 0;
    aap.y.velocity = 0;
    bgS.width.position = bgS.width.target = w;
    bgS.width.velocity = 0;
    bgS.height.position = bgS.height.target = h;
    bgS.height.velocity = 0;
    bgS.scale.position = bgS.scale.target = 1;
    bgS.scale.velocity = 0;
    iconS.x.position = iconS.x.target = 0;
    iconS.x.velocity = 0;
    iconS.scale.position = iconS.scale.target = 1;
    iconS.scale.velocity = 0;
    iconS.width.position = iconS.width.target = iconSize;
    iconS.width.velocity = 0;
    iconS.y.position = iconS.y.target = iconY;
    iconS.y.velocity = 0;
    textS.scale.position = textS.scale.target = 1;
    textS.scale.velocity = 0;
    intro.style.opacity = '0';
    toast.classList.add('is-bg-live');
    paint();
    active = false;
  });
}

function settleInstant(
  toast: HTMLElement,
  w?: number,
  h?: number,
  iconSize?: number,
): void {
  const intro = toast.querySelector<HTMLElement>('[data-dev-toast-intro]');
  const bg = toast.querySelector<HTMLElement>('[data-dev-toast-bg]');
  const text = toast.querySelector<HTMLElement>('[data-dev-toast-text]');
  const icon = toast.querySelector<HTMLElement>('[data-dev-toast-dismiss]');

  let width = w;
  let height = h;
  let iSize = iconSize;
  if (width == null || height == null || iSize == null) {
    const m = measure(toast);
    width = m.w;
    height = m.h;
    iSize = m.icon;
  }

  toast.hidden = false;
  toast.classList.remove('inactive', 'is-leaving');
  toast.classList.add('is-activated', 'is-bg-live', 'is-interactive', 'is-text-in');
  toast.style.width = `${width}px`;
  toast.style.maxWidth = `${toastMaxPx(toast)}px`;
  toast.style.setProperty('--toast-w', `${width}px`);
  toast.style.setProperty('--toast-h', `${height}px`);
  applyAapY(toast, 0);
  if (intro) {
    intro.style.opacity = '0';
    applyShape(intro, 56, 56, 1);
  }
  if (bg) applyShape(bg, width, height, 1);
  if (text) {
    applyText(text, 1);
    text.style.opacity = '1';
  }
  if (icon) applyIcon(icon, 0, -iSize / 2, 1, iSize, iSize);
}

/** Re-fit glass + shell after viewport changes (orientation / resize). */
function refitSettled(toast: HTMLElement): void {
  if (toast.hidden || toast.dataset.entered !== '1') return;
  if (toast.classList.contains('is-leaving')) return;
  const { w, h, icon } = measure(toast);
  settleInstant(toast, w, h, icon);
}

function playLeave(toast: HTMLElement): void {
  persistDismiss(toast);
  stopRun(toast);
  toast.classList.add('is-leaving');
  toast.classList.remove('is-interactive');

  const finish = () => {
    toast.hidden = true;
    toast.classList.remove(
      'is-leaving',
      'is-activated',
      'is-bg-live',
      'is-text-in',
      'is-interactive',
    );
    toast.classList.add('inactive');
    toast.dataset.entered = '0';
    toast.dataset.enterScheduled = '0';
    clearSpringStyles(toast);
  };

  if (prefersReducedMotion()) {
    finish();
    return;
  }
  window.setTimeout(finish, 450);
}

function bindToast(toast: HTMLElement): void {
  if (toast.dataset.bound === '1') return;
  toast.dataset.bound = '1';
  toast
    .querySelector<HTMLElement>('[data-dev-toast-dismiss]')
    ?.addEventListener('click', () => playLeave(toast));
}

function enterDelayOf(toast: HTMLElement): number {
  const n = Number(toast.dataset.enterDelay);
  return Number.isFinite(n) && n >= 0 ? n : 160;
}

function waitTimeoutOf(toast: HTMLElement): number {
  const n = Number(toast.dataset.waitTimeout);
  return Number.isFinite(n) && n >= 0 ? n : 4500;
}

/**
 * Wait for an optional DOM event (e.g. logo-wave:intro-end) before entrance.
 * Resolves immediately if the event already fired (html[data-logo-wave-intro-done]).
 */
function waitForGate(toast: HTMLElement): Promise<void> {
  const eventName = toast.dataset.waitEvent?.trim();
  if (!eventName) return Promise.resolve();

  // Logo (or other gate) already finished before we subscribed
  if (
    eventName === 'logo-wave:intro-end' &&
    document.documentElement.dataset.logoWaveIntroDone === '1'
  ) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      document.removeEventListener(eventName, onEvent);
      window.clearTimeout(timer);
      resolve();
    };
    const onEvent = () => finish();
    document.addEventListener(eventName, onEvent);
    const timer = window.setTimeout(finish, waitTimeoutOf(toast));
  });
}

function syncToast(toast: HTMLElement): void {
  bindToast(toast);

  if (isDismissed(toast)) {
    stopRun(toast);
    toast.hidden = true;
    toast.classList.add('inactive');
    toast.dataset.entered = '0';
    toast.dataset.enterScheduled = '0';
    return;
  }

  if (toast.dataset.entered === '1') {
    settleInstant(toast);
    return;
  }

  if (toast.dataset.enterScheduled === '1') return;
  toast.dataset.enterScheduled = '1';

  const delay = enterDelayOf(toast);
  void waitForGate(toast).then(() => {
    if (toast.dataset.entered === '1') return;
    window.setTimeout(() => playEnter(toast), delay);
  });
}

function getRoots(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-dev-toast]'));
}

/**
 * Boot / re-boot every toast banner currently in the document.
 * `forceReplay` resets animation state (Storybook story swaps) but does **not**
 * clear localStorage — use `clearToastDismiss` for that.
 */
export function bootToastBanners(options?: { forceReplay?: boolean }): void {
  for (const toast of getRoots()) {
    if (options?.forceReplay) {
      stopRun(toast);
      toast.dataset.entered = '0';
      toast.dataset.enterScheduled = '0';
      toast.dataset.bound = '0';
      clearSpringStyles(toast);
    }
    syncToast(toast);
  }
}

export function bootToastBannersOnce(): void {
  bootToastBanners();
}

// Auto-boot when imported as a side-effect module (Storybook preview / Astro)
if (typeof document !== 'undefined') {
  const boot = () => bootToastBanners();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
  document.addEventListener('astro:page-load', boot);

  // Keep glass bg + shell in sync when the viewport changes (small phones / rotate)
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      for (const toast of getRoots()) refitSettled(toast);
    }, 120);
  });
}
