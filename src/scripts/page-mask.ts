/**
 * Page transition:
 *   1. OUT — blue circle expands to cover the viewport (no blue title)
 *   2. IN  — solid blue plate + black destination title (scale + width-wave)
 *   3. IN  — circular mask opens when the wave hits the last letters
 *
 * Covers navbar + banner (page-mask z-index above both).
 */

import {
  mountWaveText,
  normalizeWaveText,
  type WaveHandle,
  type LogoWaveData,
} from './logo-wave';
import waveGlyphs from '../data/blatant-wave-glyphs.json';
import { projects } from '../data/projects';
import { articles } from '../data/articles';
import { site } from '../data/site';
import { notifyPageRevealed } from './page-reveal';

/** Same blue as case-study section titles (e.g. “Role”) — --color-accent */
const TRANSITION_COLOR = '#008fff';

const waveData = waveGlyphs as LogoWaveData;
let labelWave: WaveHandle | null = null;

/** Shell scale 0→final (whole title) */
const WORD_SCALE_MS = 1400;
/** Width-wave L→R on the black title (independent of shell scale) */
const WORD_WAVE_MS = 1800;
/** Final word width as a fraction of the viewport */
const WORD_TARGET_VW = 0.8;
/** Solid black type on the blue plate during reveal */
const WORD_REVEAL_COLOR = '#000000';

/** OUT: blue circle expands to full cover (after current-page title wave) */
const CIRCLE_OUT_MS = 580;
/** IN: circular hole open duration */
const CIRCLE_IN_MS = 580;
/** Safety: open circle/hole even if onLastLetters never fires */
const WAVE_SAFETY_MS = WORD_WAVE_MS + 200;

type MaskEls = {
  root: HTMLElement;
  stage: HTMLElement;
  circle: HTMLElement;
  label: HTMLElement;
};

/** from = page we’re leaving (blue); to = page that finished loading (black) */
type NavSnapshot = { fromLabel: string; toLabel: string };

let wired = false;
let lastNav: NavSnapshot = { fromLabel: '', toLabel: '' };
let outRunning = false;
/** Solid cover is up; waiting for the new page before starting the reveal */
let awaitingReveal = false;
/** Prevent double transitionIn (page-load + safety timeout) */
let revealStarted = false;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function wait(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms));
}

function easeOutExpo(p: number) {
  return p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
}

function coverDiameter() {
  return Math.ceil(Math.hypot(window.innerWidth, window.innerHeight) * 1.08);
}

function isInternalNav(link: HTMLAnchorElement) {
  if (link.hasAttribute('data-astro-reload')) return false;
  if (link.target && link.target !== '_self') return false;
  if (link.hasAttribute('download')) return false;
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }
  try {
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function normalizePath(pathname: string): string {
  return pathname.replace(/\/$/, '') || '/';
}

/** Title for a route (current page / destination fallback). */
function labelFromPath(pathname: string): string {
  const path = normalizePath(pathname);
  if (path === '/') return 'VINICIUS RAMOS';

  // Detail routes before parent nav labels (e.g. /articles/foo ≠ "Articles")
  const articleMatch = path.match(/^\/articles\/([^/]+)/);
  if (articleMatch) {
    const article = articles.find((a) => a.id === articleMatch[1]);
    if (article?.title) return article.title;
  }

  const projectMatch = path.match(/^\/projects\/([^/]+)/);
  if (projectMatch) {
    const project = projects.find((p) => p.slug === projectMatch[1]);
    if (project?.title) return project.title;
  }

  for (const item of site.nav) {
    const href = normalizePath(item.href);
    if (path === href || path.startsWith(`${href}/`)) return item.label;
  }

  const h1 = document.querySelector('.page-main h1, .page-main .display-title');
  if (h1?.textContent?.trim()) return h1.textContent.trim().replace(/\s+/g, ' ');

  return 'VINICIUS RAMOS';
}

function labelFromLink(link: HTMLAnchorElement): string {
  // Explicit override (e.g. logo wordmark)
  const dataLabel = link.getAttribute('data-transition-label')?.trim();
  if (dataLabel) return dataLabel;

  // Logo / home — SVG wordmark has no useful textContent
  const href = normalizePath(link.getAttribute('href') || '/');
  if (link.matches('[data-logo-wave], .logo-wave, a.logo') || href === '/') {
    return 'VINICIUS RAMOS';
  }

  // Prefer path map for known routes (stable labels)
  if (href !== '/') {
    const fromPath = labelFromPath(href);
    if (fromPath && fromPath !== 'VINICIUS RAMOS') return fromPath;
    // project links still need card title if path map missed
  }

  const cardTitle =
    link.querySelector('.project-card__title') ||
    link.closest('.project-card-shell')?.querySelector('.project-card__title');
  if (cardTitle?.textContent?.trim()) return cardTitle.textContent.trim();

  const nextTitle = link.querySelector('.next-project__title');
  if (nextTitle) {
    const t = nextTitle.getAttribute('aria-label') || nextTitle.textContent || '';
    if (t.trim()) return t.trim().replace(/\s+/g, ' ');
  }

  const btnLabel = link.querySelector('.btn__label');
  if (btnLabel?.textContent?.trim()) return btnLabel.textContent.trim();

  const aria = link.getAttribute('aria-label')?.trim();
  if (aria) return aria;

  const text = (link.textContent || '').replace(/\s+/g, ' ').trim();
  if (text) return text;

  return labelFromPath(href);
}

function ensureMask(): MaskEls {
  let root = document.getElementById('page-mask');
  if (!root) {
    root = document.createElement('div');
    root.id = 'page-mask';
    root.className = 'page-mask is-idle';
    root.setAttribute('aria-hidden', 'true');
    document.body.appendChild(root);
  }

  if (!root.querySelector('.page-mask__stage')) {
    root.innerHTML = `
      <div class="page-mask__stage">
        <div class="page-mask__circle" aria-hidden="true"></div>
      </div>
      <div class="page-mask__label" aria-hidden="true"></div>
    `;
  }

  const stage = root.querySelector('.page-mask__stage')!;
  const circle = root.querySelector('.page-mask__circle')!;
  let label = root.querySelector('.page-mask__label') as HTMLElement | null;
  // Migrate older DOM where label lived inside stage (got clipped by plate mask)
  if (!label) {
    label = document.createElement('div');
    label.className = 'page-mask__label';
    label.setAttribute('aria-hidden', 'true');
    root.appendChild(label);
  } else if (label.parentElement !== root) {
    root.appendChild(label);
  }

  return { root, stage, circle, label };
}

function setCircleDiameter(circle: HTMLElement, px: number) {
  circle.style.width = `${px}px`;
  circle.style.height = `${px}px`;
}

function setCircleScale(circle: HTMLElement, scale: number) {
  circle.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

function setLabelScale(label: HTMLElement, scale: number) {
  // Only transform — never touch width/height here (avoids reflow + wave fight)
  label.style.transform = `translate(-50%, -50%) scale(${scale})`;
  label.dataset.scale = String(scale);
}

/** Wait 2 frames so the browser paints the initial (small) scale before animating up. */
function waitPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function destroyLabelWave() {
  labelWave?.destroy();
  labelWave = null;
}

function clearLabelLayout(label: HTMLElement) {
  destroyLabelWave();
  label.replaceChildren();
  label.style.width = '';
  label.style.height = '';
  label.style.display = '';
  label.style.alignItems = '';
  label.style.justifyContent = '';
}

/**
 * Mount wave type into an absolute, fixed-size envelope.
 * Outer box never resizes during the wave — only glyph paths swell inside.
 * Returns rest content width (for scale-to-80vw math).
 */
function setLabelWaveText(label: HTMLElement, text: string): number {
  clearLabelLayout(label);

  // Keep letters + supported punctuation (- , ' . ! ?) for Blatant wave
  const clean = normalizeWaveText(text) || 'LOADING';

  // Inner stage holds the wave; label is the absolute scaled shell
  const stage = document.createElement('div');
  stage.className = 'page-mask__label-stage';
  label.appendChild(stage);

  labelWave = mountWaveText(stage, clean, waveData, {
    intro: false,
    pointer: false,
  });

  // Measure at rest (scale 1, no transform noise)
  label.style.transform = 'translate(-50%, -50%) scale(1)';
  void label.offsetWidth;

  const waveRoot =
    stage.querySelector<HTMLElement>('[data-logo-wave]') || stage;
  const restW = Math.max(waveRoot.scrollWidth, stage.scrollWidth, 1);
  const restH = Math.max(waveRoot.scrollHeight, stage.scrollHeight, 1);
  // Envelope large enough for peak stretch (~0.9) without resizing the shell
  const envelopeW = Math.ceil(restW * 1.85);
  const envelopeH = Math.ceil(restH * 1.15);

  // Fixed absolute shell — center is stable under translate(-50%) + scale
  label.style.width = `${envelopeW}px`;
  label.style.height = `${envelopeH}px`;
  label.style.display = 'flex';
  label.style.alignItems = 'center';
  label.style.justifyContent = 'center';

  stage.style.width = `${envelopeW}px`;
  stage.style.height = `${envelopeH}px`;
  stage.style.display = 'flex';
  stage.style.alignItems = 'center';
  stage.style.justifyContent = 'center';
  stage.style.overflow = 'visible';
  stage.dataset.restWidth = String(restW);

  // Wave root: left-start inside centered stage (layout:'start' on sweep)
  waveRoot.style.maxWidth = 'none';
  waveRoot.style.justifyContent = 'flex-start';

  return restW;
}

/** Shell scale so rest content width spans ~80vw. */
function measureWordScale(restContentWidth: number): number {
  const target = window.innerWidth * WORD_TARGET_VW;
  const natural = Math.max(restContentWidth, 1);
  return target / natural;
}

function animateNumber(
  from: number,
  to: number,
  duration: number,
  ease: (p: number) => number,
  onUpdate: (v: number) => void,
) {
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      onUpdate(from + (to - from) * ease(p));
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    onUpdate(from);
    requestAnimationFrame(step);
  });
}

/** Clear any CSS mask used for the circular reveal hole */
function clearPlateMask(stage: HTMLElement) {
  stage.style.webkitMaskImage = '';
  stage.style.maskImage = '';
  stage.style.webkitMaskSize = '';
  stage.style.maskSize = '';
}

/**
 * Expanding hole in the solid blue plate (0 = sealed, 1 = fully open).
 * No white shapes — the plate stays accent blue until the page shows through.
 */
function setPlateHole(stage: HTMLElement, progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  stage.style.background = TRANSITION_COLOR;
  if (p <= 0.001) {
    clearPlateMask(stage);
    return;
  }
  const maxR = coverDiameter() / 2;
  const r = maxR * p;
  // transparent center = page visible; opaque edge = blue plate remains
  const grad = `radial-gradient(circle at 50% 50%, transparent ${r}px, #000 ${r + 0.5}px)`;
  stage.style.webkitMaskImage = grad;
  stage.style.maskImage = grad;
}

/** Cover: blue circle only — title comes later (black, after load) */
function setCoverMode(stage: HTMLElement, circle: HTMLElement, label: HTMLElement) {
  stage.classList.remove('is-reveal-mode');
  stage.classList.add('is-cover-mode');
  clearPlateMask(stage);
  stage.style.background = 'transparent';
  circle.style.background = TRANSITION_COLOR;
  circle.style.mixBlendMode = 'normal';
  label.style.opacity = '0';
  label.style.color = WORD_REVEAL_COLOR;
  label.style.mixBlendMode = 'normal';
  label.style.textShadow = 'none';
  label.style.webkitTextStroke = '0';
}

/**
 * Reveal: solid blue plate + black word; hole expands via CSS mask.
 * Black is a clean solid on accent blue — no stroke/shadow hacks.
 */
function setRevealMode(stage: HTMLElement, circle: HTMLElement, label: HTMLElement) {
  stage.classList.remove('is-cover-mode');
  stage.classList.add('is-reveal-mode');
  stage.style.background = TRANSITION_COLOR;
  clearPlateMask(stage);
  circle.style.background = TRANSITION_COLOR;
  circle.style.mixBlendMode = 'normal';
  circle.style.opacity = '0';
  label.style.color = WORD_REVEAL_COLOR;
  label.style.mixBlendMode = 'normal';
  label.style.textShadow = 'none';
  label.style.webkitTextStroke = '0';
  label.style.opacity = '1';
}

function resetModes(stage: HTMLElement, circle: HTMLElement, label: HTMLElement) {
  stage.classList.remove('is-cover-mode', 'is-reveal-mode');
  clearPlateMask(stage);
  stage.style.background = 'transparent';
  circle.style.mixBlendMode = 'normal';
  label.style.mixBlendMode = 'normal';
  label.style.textShadow = '';
  label.style.webkitTextStroke = '';
  label.style.opacity = '0';
  circle.style.opacity = '0';
}

export function syncNavActive() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  document
    .querySelectorAll<HTMLAnchorElement>('.site-nav a[href], .site-menu a[href]')
    .forEach((a) => {
      const href = (a.getAttribute('href') || '/').replace(/\/$/, '') || '/';
      // Footer social (external) — skip active styling
      if (/^https?:\/\//i.test(href) || href.startsWith('mailto:')) {
        a.classList.remove('is-active');
        return;
      }
      const active =
        href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
      a.classList.toggle('is-active', active);
    });
}

/**
 * OUT — cover.
 * Blue circle expands to full frame. No title in this phase.
 */
async function transitionOut(_fromLabel: string) {
  const { root, stage, circle, label } = ensureMask();
  outRunning = true;
  document.documentElement.classList.add('is-page-transitioning');

  root.classList.remove('is-idle', 'is-in');
  root.classList.add('is-active', 'is-out');

  setCoverMode(stage, circle, label);
  stage.style.opacity = '1';
  clearLabelLayout(label);
  label.style.opacity = '0';

  const diameter = coverDiameter();
  setCircleDiameter(circle, diameter);
  setCircleScale(circle, 0);
  circle.style.opacity = '1';
  void circle.offsetHeight;

  await animateNumber(0, 1, CIRCLE_OUT_MS, easeOutExpo, (s) => {
    setCircleScale(circle, s);
  });

  // Solid lock for swap — full blue plate under the next page
  setCircleScale(circle, 1);
  stage.style.background = TRANSITION_COLOR;
  circle.style.opacity = '0';
  label.style.opacity = '0';
  outRunning = false;
}

/**
 * IN — destination ready on blue plate.
 * 1. Black destination title: scale-up + letter wave
 * 2. Circular mask opens when the last letter is finishing its animation
 */
async function transitionIn() {
  const { root, stage, circle, label } = ensureMask();

  root.classList.remove('is-out');
  root.classList.add('is-active', 'is-in');

  const text = (
    lastNav.toLabel ||
    labelFromPath(window.location.pathname) ||
    'VINICIUS RAMOS'
  ).toUpperCase();
  const restW = setLabelWaveText(label, text);

  setRevealMode(stage, circle, label);
  stage.style.opacity = '1';
  setPlateHole(stage, 0); // sealed blue plate
  circle.style.opacity = '0';

  label.style.opacity = '1';
  // Whole-title scale 0→final (like the circle); letter width-wave runs in parallel
  const finalScale = measureWordScale(restW);
  setLabelScale(label, 0);
  void label.offsetWidth;
  await waitPaint();

  const wordAnim = animateNumber(0, finalScale, WORD_SCALE_MS, easeOutExpo, (s) => {
    setLabelScale(label, s);
  });

  let holeGo!: () => void;
  let holeArmed = false;
  const holeGate = new Promise<void>((resolve) => {
    holeGo = () => {
      if (holeArmed) return;
      holeArmed = true;
      resolve();
    };
  });

  const waveAnim =
    labelWave?.playSweep({
      durationMs: WORD_WAVE_MS,
      peak: 0.82,
      layout: 'start',
      onLastLetters: () => holeGo(),
    }) ?? Promise.resolve().then(() => holeGo());

  void wait(WAVE_SAFETY_MS).then(() => holeGo());

  const holeAnim = (async () => {
    await holeGate;
    await animateNumber(0, 1, CIRCLE_IN_MS, easeOutExpo, (p) => {
      setPlateHole(stage, p);
      label.style.opacity = String(Math.max(0, 1 - p * 1.35));
    });
  })();

  await holeAnim;
  void wordAnim;
  void waveAnim;

  // Teardown
  root.classList.remove('is-active', 'is-out', 'is-in');
  root.classList.add('is-idle');
  resetModes(stage, circle, label);
  stage.style.opacity = '0';
  setCircleScale(circle, 0);
  setLabelScale(label, 1);
  clearLabelLayout(label);
  document.documentElement.classList.remove('is-page-transitioning');
}

function hardReset() {
  awaitingReveal = false;
  revealStarted = false;
  outRunning = false;
  const root = document.getElementById('page-mask');
  if (!root) return;
  root.className = 'page-mask is-idle';
  document.documentElement.classList.remove('is-page-transitioning');
  const els = ensureMask();
  resetModes(els.stage, els.circle, els.label);
  els.stage.style.opacity = '0';
  setCircleScale(els.circle, 0);
  clearLabelLayout(els.label);
  // Entrance animations (fan / device-3d) wait for this when a transition was active
  notifyPageRevealed();
}

/** Keep the plate solid blue until the next page has actually painted. */
function lockSolidCover() {
  const { root, stage, circle, label } = ensureMask();
  root.classList.add('is-active', 'is-out');
  root.classList.remove('is-idle', 'is-in');
  stage.classList.remove('is-reveal-mode');
  stage.classList.add('is-cover-mode');
  clearPlateMask(stage);
  stage.style.opacity = '1';
  stage.style.background = TRANSITION_COLOR;
  circle.style.opacity = '0';
  circle.style.background = TRANSITION_COLOR;
  circle.style.mixBlendMode = 'normal';
  label.style.opacity = '0';
  label.style.color = TRANSITION_COLOR;
  label.style.mixBlendMode = 'normal';
  label.style.textShadow = '';
}

/**
 * Wait until the swapped page is ready enough to show under the reveal.
 * Never open the mask onto an empty/unpainted document.
 */
async function waitForPageReady() {
  try {
    if (document.fonts?.ready) {
      await Promise.race([document.fonts.ready, wait(500)]);
    }
  } catch {
    /* ignore */
  }

  // Main content must exist and have layout height
  const main = document.querySelector('.page-main');
  if (main) {
    await Promise.race([
      new Promise<void>((resolve) => {
        const started = performance.now();
        const check = () => {
          const h = (main as HTMLElement).offsetHeight;
          const kids = main.childElementCount;
          if (kids > 0 && h > 40) {
            resolve();
            return;
          }
          if (performance.now() - started > 1200) {
            resolve();
            return;
          }
          requestAnimationFrame(check);
        };
        check();
      }),
      wait(1200),
    ]);
  }

  // Two frames: layout + first paint under the cover
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

  // Eager / in-flight images only (skip lazy below the fold)
  const pending = Array.from(document.images).filter((img) => {
    if (img.complete) return false;
    if (img.getAttribute('loading') === 'lazy') return false;
    return true;
  });

  if (pending.length > 0) {
    await Promise.race([
      Promise.all(
        pending.map(
          (img) =>
            new Promise<void>((res) => {
              img.addEventListener('load', () => res(), { once: true });
              img.addEventListener('error', () => res(), { once: true });
            }),
        ),
      ),
      wait(900),
    ]);
  }

  // One more paint after assets settle
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

async function startRevealWhenReady() {
  if (!awaitingReveal || revealStarted) return;
  if (prefersReducedMotion()) {
    hardReset();
    lastNav = { fromLabel: '', toLabel: '' };
    return;
  }

  revealStarted = true;
  awaitingReveal = false;

  // Stay locked solid while we wait
  lockSolidCover();

  try {
    await waitForPageReady();
  } catch {
    /* still reveal — better than stuck cover */
  }

  await transitionIn();
  lastNav = { fromLabel: '', toLabel: '' };
  revealStarted = false;
  // Page is visible — run deferred entrances (SocialFan, Device3D, …)
  notifyPageRevealed();
}

function captureClicks() {
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href]');
      if (!(link instanceof HTMLAnchorElement)) return;
      if (!isInternalNav(link)) return;
      lastNav = {
        fromLabel: labelFromPath(window.location.pathname),
        toLabel: labelFromLink(link),
      };
    },
    true,
  );
}

export function initPageMask() {
  if (wired) return;
  wired = true;

  ensureMask();
  captureClicks();

  document.addEventListener('astro:before-preparation', (event) => {
    if (prefersReducedMotion()) {
      lastNav = { fromLabel: '', toLabel: '' };
      return;
    }

    const e = event as Event & { loader: () => Promise<void> };
    const fromLabel = lastNav.fromLabel || labelFromPath(window.location.pathname);
    const toLabel = lastNav.toLabel || 'VINICIUS RAMOS';
    lastNav = { fromLabel, toLabel };

    const originalLoader = e.loader;
    e.loader = async () => {
      // Circle cover + load destination in parallel; black title shows after ready
      await Promise.all([transitionOut(fromLabel), originalLoader()]);
    };
  });

  document.addEventListener('astro:after-swap', () => {
    syncNavActive();

    if (prefersReducedMotion()) {
      hardReset();
      return;
    }

    // Keep a solid plate — do NOT reveal yet (page may still be blank/unpainted)
    awaitingReveal = true;
    revealStarted = false;
    lockSolidCover();
    // Destination (black) title is mounted in transitionIn after page is ready
  });

  document.addEventListener('astro:page-load', () => {
    syncNavActive();

    // Reveal only after the new document has loaded scripts + content under the cover
    if (awaitingReveal) {
      void startRevealWhenReady();
      return;
    }

    // Safety: if something left the plate stuck, force a reveal later
    const root = document.getElementById('page-mask');
    if (!root?.classList.contains('is-active') || outRunning) return;
    window.setTimeout(() => {
      if (root.classList.contains('is-active') && !revealStarted) {
        awaitingReveal = true;
        void startRevealWhenReady();
      }
    }, 2000);
  });
}
