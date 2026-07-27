/**
 * SocialFan client behaviour (Lando-style arc hover peel).
 * SSR starts compressed (stacked); expands to rest when visible + page revealed.
 */

import { whenPageVisible } from './page-reveal';

type RestPose = { x: number; y: number; rot: number; scale: number; z: number };

/** Expand duration — keep in sync with card transition + stagger tail. */
const INTRO_MS = 720;
const STAGGER_MS = 48;

function applyPose(
  card: HTMLElement,
  x: number,
  y: number,
  rot: number,
  scale: number,
) {
  card.style.setProperty('--sf-x', `${x}%`);
  card.style.setProperty('--sf-y', `${y}%`);
  card.style.setProperty('--sf-rot', `${rot}deg`);
  card.style.setProperty('--sf-scale', String(scale));
}

function readRest(card: HTMLElement): RestPose {
  const ds = card.dataset;
  const fromData = (key: string) => {
    const v = ds[key];
    return v != null && v !== '' ? parseFloat(v) : NaN;
  };

  const x = fromData('restX');
  const y = fromData('restY');
  const rot = fromData('restRot');
  const scale = fromData('restScale');
  const zRaw = ds.restZ;

  return {
    x: Number.isFinite(x) ? x : parseFloat(card.style.getPropertyValue('--sf-x')) || 0,
    y: Number.isFinite(y) ? y : parseFloat(card.style.getPropertyValue('--sf-y')) || 0,
    rot: Number.isFinite(rot) ? rot : parseFloat(card.style.getPropertyValue('--sf-rot')) || 0,
    scale: Number.isFinite(scale)
      ? scale
      : parseFloat(card.style.getPropertyValue('--sf-scale')) || 1,
    z:
      zRaw != null && zRaw !== ''
        ? parseInt(zRaw, 10) || 1
        : parseInt(card.style.getPropertyValue('--sf-z') || '1', 10) || 1,
  };
}

function centerIndexFromRoot(root: HTMLElement, count: number): number {
  const raw = root.dataset.centerIndex;
  if (raw != null && raw !== '') {
    const n = parseInt(raw, 10);
    if (Number.isFinite(n)) return Math.max(0, Math.min(count - 1, n));
  }
  return Math.floor((count - 1) / 2);
}

type FanRoot = HTMLElement & {
  __socialFanCleanup?: () => void;
};

export function initSocialFan(root: HTMLElement) {
  const fan = root as FanRoot;
  fan.__socialFanCleanup?.();

  const stage = root.querySelector<HTMLElement>('[data-social-fan-stage]');
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-social-fan-card]'));
  if (!stage || !cards.length) return;

  const rest = cards.map(readRest);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const center = centerIndexFromRoot(root, cards.length);

  let introTimer: number | null = null;
  let introRaf = 0;
  let introIo: IntersectionObserver | null = null;
  let cancelPageWait: (() => void) | null = null;
  let introDone = false;
  let introStarted = false;
  let pageVisible = false;

  const applyRest = (withStagger: boolean) => {
    cards.forEach((c, i) => {
      const p = rest[i];
      if (withStagger) {
        const dist = Math.abs(i - center);
        c.style.transitionDelay = `${dist * STAGGER_MS}ms`;
      } else {
        c.style.transitionDelay = '';
      }
      applyPose(c, p.x, p.y, p.rot, p.scale);
      c.style.zIndex = String(p.z);
    });
  };

  const clearStagger = () => {
    cards.forEach((c) => {
      c.style.transitionDelay = '';
    });
  };

  /** Compressed stack: all cards at center; scale kept so they don't pop on expand. */
  const applyCompressed = () => {
    cards.forEach((c, i) => {
      const p = rest[i];
      c.style.transitionDelay = '';
      applyPose(c, 0, 0, 0, p.scale);
      c.style.zIndex = String(p.z);
    });
  };

  const snapCompressed = () => {
    cards.forEach((c) => {
      c.style.transition = 'none';
    });
    applyCompressed();
    void stage.offsetWidth;
    cards.forEach((c) => {
      c.style.transition = '';
    });
  };

  /** Expand to rest poses. Runs once when page is visible AND fan is in viewport. */
  const playIntro = () => {
    if (introStarted || introDone) return;
    if (!pageVisible) return;
    introStarted = true;
    introIo?.disconnect();
    introIo = null;

    if (reduced) {
      applyRest(false);
      fan.classList.add('is-expanded');
      fan.classList.remove('is-intro');
      introDone = true;
      return;
    }

    snapCompressed();
    fan.classList.add('is-intro');
    introRaf = requestAnimationFrame(() => {
      introRaf = requestAnimationFrame(() => {
        applyRest(true);
        fan.classList.add('is-expanded');
        fan.classList.remove('is-intro');
        const maxDelay =
          Math.max(...cards.map((_, i) => Math.abs(i - center))) * STAGGER_MS;
        introTimer = window.setTimeout(() => {
          introTimer = null;
          introDone = true;
          clearStagger();
        }, INTRO_MS + maxDelay);
      });
    });
  };

  const armViewportIntro = () => {
    introIo?.disconnect();
    introIo = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          playIntro();
          break;
        }
      },
      { root: null, threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
    );
    introIo.observe(fan);
  };

  // Always start compressed — intro replays on every page open / ClientRouter visit
  snapCompressed();
  fan.classList.add('is-intro');
  fan.classList.remove('is-expanded');

  cancelPageWait = whenPageVisible(() => {
    pageVisible = true;
    armViewportIntro();
  });

  if (reduced || !fineHover) {
    fan.__socialFanCleanup = () => {
      if (introTimer != null) window.clearTimeout(introTimer);
      if (introRaf) cancelAnimationFrame(introRaf);
      introIo?.disconnect();
      cancelPageWait?.();
      clearStagger();
    };
    return;
  }

  let active: number | null = null;
  let leaveTimer: number | null = null;
  const listeners: Array<() => void> = [];

  const on = (
    el: EventTarget,
    type: string,
    handler: EventListener,
    options?: AddEventListenerOptions,
  ) => {
    el.addEventListener(type, handler, options);
    listeners.push(() => el.removeEventListener(type, handler, options));
  };

  const restore = () => {
    active = null;
    cards.forEach((c, i) => {
      c.classList.remove('is-active');
      const p = rest[i];
      applyPose(c, p.x, p.y, p.rot, p.scale);
      c.style.zIndex = String(p.z);
    });
  };

  const activate = (index: number) => {
    if (!introDone) return;
    active = index;
    cards.forEach((c, i) => {
      const p = rest[i];
      const dist = Math.abs(i - index);
      if (i === index) {
        c.classList.add('is-active');
        applyPose(
          c,
          p.x,
          Math.max(0, p.y - 6),
          p.rot * 0.4,
          Math.min(1.08, p.scale * 1.06),
        );
        c.style.zIndex = '20';
        return;
      }
      c.classList.remove('is-active');
      const dir = i < index ? -1 : 1;
      const push = dir * (10 + dist * 5);
      const drop = dist * 1.5;
      const tilt = dir * (1.2 / (dist + 0.5));
      applyPose(c, p.x + push, p.y + drop, p.rot + tilt, p.scale);
      c.style.zIndex = String(Math.max(1, p.z - dist));
    });
  };

  cards.forEach((card, i) => {
    card.tabIndex = 0;
    on(card, 'pointerenter', () => {
      if (leaveTimer != null) {
        window.clearTimeout(leaveTimer);
        leaveTimer = null;
      }
      activate(i);
    });
    on(card, 'pointerleave', () => {
      leaveTimer = window.setTimeout(() => {
        if (active === i) restore();
      }, 40);
    });
    on(card, 'focus', () => activate(i));
    on(card, 'blur', () => {
      if (active === i) restore();
    });
  });

  on(stage, 'pointerleave', () => {
    if (leaveTimer != null) window.clearTimeout(leaveTimer);
    restore();
  });

  fan.__socialFanCleanup = () => {
    if (leaveTimer != null) window.clearTimeout(leaveTimer);
    if (introTimer != null) window.clearTimeout(introTimer);
    if (introRaf) cancelAnimationFrame(introRaf);
    introIo?.disconnect();
    cancelPageWait?.();
    clearStagger();
    listeners.forEach((off) => off());
    // Leave compressed if intro never finished — next boot will re-run entrance
    if (!introDone) {
      snapCompressed();
      fan.classList.remove('is-expanded');
      fan.classList.add('is-intro');
    } else {
      restore();
    }
  };
}

export function initSocialFans(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-social-fan]').forEach(initSocialFan);
}

/** Force rebind — used by Storybook story swaps and astro:page-load. */
export function bootSocialFans() {
  document.querySelectorAll<HTMLElement>('[data-social-fan]').forEach((el) => {
    (el as FanRoot).__socialFanCleanup?.();
    el.classList.remove('is-expanded', 'is-intro');
  });
  initSocialFans();
}
