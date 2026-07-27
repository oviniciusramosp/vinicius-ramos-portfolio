/**
 * Blatant Bold width-wave typography.
 *
 * - full masters: continuous path morph
 * - alts_only: morph alt1↔alt2; extrapolate t<0 for narrow/rest
 * - intro / playSweep: traveling peak L→R (ease-out)
 *
 * Use `initLogoWave` on pre-rendered markup (navbar logo) or
 * `mountWaveText` to build dynamic strings (page transitions).
 */

export type LogoMaster = {
  name: string;
  width: number;
  flat: number[][];
  opSig: string[];
  path: string;
};

export type LogoGlyphDef = {
  base: string;
  kind: 'full' | 'alts_only' | 'static';
  masters: LogoMaster[];
};

export type LogoWaveData = {
  font: string;
  upm: number;
  text?: string;
  spaceWidth: number;
  emUnits?: number;
  baseline?: number;
  glyphs: Record<string, LogoGlyphDef>;
};

export type LogoWaveInitOptions = {
  /**
   * Auto-play L→R sweep after init.
   * - true / 'always': every mount
   * - 'once': once per tab session
   * - false / omit: no auto intro
   */
  intro?: boolean | 'once' | 'always';
  introDurationMs?: number;
  introPeak?: number;
  introStorageKey?: string;
  /** Enable pointer hover wave (default true). */
  pointer?: boolean;
  /**
   * Downscale the letter row when it exceeds the root width.
   * Default: false for navbar `.logo` (must never shrink after intro),
   * true for other wave texts (page-mask, next project, etc.).
   */
  fit?: boolean;
};

export type SweepOptions = {
  durationMs?: number;
  peak?: number;
  /**
   * - `start` (default): left-aligned — navbar logo. No justify center / width pin.
   * - `center`: pin rest width + center letters — page-transition titles under translate(-50%).
   */
  layout?: 'start' | 'center';
  /**
   * Fires once when the last letter is finishing its widen→rest cycle
   * (peak has moved past it). Independent of word length. Used for page-mask hole.
   */
  onLastLetters?: () => void;
  /**
   * How far *past* the last letter center (as a fraction of falloff) before
   * firing onLastLetters — so the letter can grow and start returning.
   * Default 0.65.
   */
  lastLettersTrail?: number;
};

export type WaveHandle = {
  root: HTMLElement;
  destroy: () => void;
  /** Left→right traveling peak. Resolves when sweep + settle complete. */
  playSweep: (opts?: SweepOptions) => Promise<void>;
};

export type GlyphLayer = {
  path: string;
  opacity: number;
  nativeWidth: number;
};

export type GlyphSample = {
  width: number;
  layers: GlyphLayer[];
};

type Slot = {
  el: HTMLElement;
  pathA: SVGPathElement | null;
  pathB: SVGPathElement | null;
  groupA: SVGGElement | null;
  groupB: SVGGElement | null;
  svgEl: SVGSVGElement | null;
  char: string;
  isSpace: boolean;
  glyph: LogoGlyphDef | null;
  /** Width stretch 0..peak */
  current: number;
  target: number;
};

/** Bump when intro gating behavior changes. */
const DEFAULT_INTRO_KEY = 'portfolio:logo-wave-intro-v2';
const CAP_HEIGHT = 559;

/**
 * Extra characters (digits + punct) not in the A–Z path pack.
 * Rendered with real Blatant Bold via SVG <text> (correct shapes for 2, ?, etc.).
 * Behavior matches letter "I": always visible, no width morph (static).
 *
 * Advance widths are em-unit approximations at UPM 1000 so spacing sits
 * next to path letters; exact outlines come from the webfont.
 *
 * Font size must be the full em (≈1000), NOT CAP_HEIGHT (559):
 * path masters draw caps at 559 units inside a 1000-tall viewBox;
 * SVG font-size sets the em square, and Blatant’s cap is ~559/1000 of em —
 * so font-size=559 made digits ~0.56× too small.
 */
export const WAVE_FONT_ADVANCES: Record<string, number> = {
  '0': 580,
  '1': 360,
  '2': 560,
  '3': 560,
  '4': 580,
  '5': 560,
  '6': 580,
  '7': 540,
  '8': 580,
  '9': 580,
  // Wider than glyph ink so hyphens don’t kiss neighbors (e.g. UI-ON-DEMAND)
  '-': 500,
  ',': 260,
  "'": 200,
  '.': 220,
  '!': 280,
  '?': 520,
};

/** True when char must be drawn as Blatant <text> (not a path master). */
export function isWaveFontChar(char: string): boolean {
  return Object.prototype.hasOwnProperty.call(WAVE_FONT_ADVANCES, char);
}

export function waveFontAdvance(char: string): number {
  return WAVE_FONT_ADVANCES[char] ?? 500;
}

/** SVG font-size so webfont caps match path-letter CAP_HEIGHT in the same viewBox. */
export function waveFontSize(emUnits = 1000): number {
  return emUnits;
}

/**
 * Normalize a title for Blatant wave rendering.
 * Keeps A–Z, digits 0–9, spaces, and supported punctuation (- , ' . ! ?).
 * Path letters may width-wave; font chars (digits/punct) and statics (I) only render.
 */
export function normalizeWaveText(text: string): string {
  return text
    .normalize('NFKC')
    .toUpperCase()
    // curly / accent quotes → straight apostrophe
    .replace(/[\u2018\u2019\u201B\u0060\u00B4]/g, "'")
    // dashes → hyphen
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-')
    .replace(/\u2026/g, '...')
    // keep letters, digits, space, supported punct
    .replace(/[^A-Z0-9\s\-',.?!]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** @deprecated path-based extras removed — digits/punct use WAVE_FONT_ADVANCES */
export function withWavePunctuation(data: LogoWaveData): LogoWaveData {
  return data;
}

function rebuildPath(opSig: string[], flat: number[][]): string {
  let i = 0;
  let d = '';
  for (const op of opSig) {
    if (op === 'M') {
      const [x, y] = flat[i++];
      d += `M${x.toFixed(2)} ${y.toFixed(2)}`;
    } else if (op === 'L') {
      const [x, y] = flat[i++];
      d += `L${x.toFixed(2)} ${y.toFixed(2)}`;
    } else if (op === 'C') {
      const [x1, y1] = flat[i++];
      const [x2, y2] = flat[i++];
      const [x3, y3] = flat[i++];
      d += `C${x1.toFixed(2)} ${y1.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)} ${x3.toFixed(2)} ${y3.toFixed(2)}`;
    } else if (op === 'Z') {
      d += 'Z';
    }
  }
  return d;
}

function canLerp(a: LogoMaster, b: LogoMaster): boolean {
  return a.flat.length === b.flat.length && a.opSig.join() === b.opSig.join();
}

function sampleMasterPair(
  a: LogoMaster,
  b: LogoMaster,
  t: number,
): { width: number; path: string; nativeWidth: number } {
  if (!canLerp(a, b)) {
    const m = t < 0.5 ? a : b;
    return { width: m.width, path: m.path, nativeWidth: m.width };
  }
  const flat = a.flat.map((p, idx) => [
    p[0] + (b.flat[idx][0] - p[0]) * t,
    p[1] + (b.flat[idx][1] - p[1]) * t,
  ]);
  const width = a.width + (b.width - a.width) * t;
  return {
    width,
    path: rebuildPath(a.opSig, flat),
    nativeWidth: width,
  };
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function altsOnlyTMin(def: LogoMaster, alt1: LogoMaster, alt2: LogoMaster): number {
  const span = alt2.width - alt1.width;
  if (Math.abs(span) < 1) return 0;
  let tMin = (def.width - alt1.width) / span;
  if (tMin < -0.85) tMin = -0.85;
  if (tMin > 0) tMin = 0;
  return tMin;
}

/** Sample glyph at stretch s ∈ [0, 1]. */
export function sampleGlyph(glyph: LogoGlyphDef, s: number): GlyphSample {
  const masters = glyph.masters;
  const amount = Math.min(1, Math.max(0, s));

  if (glyph.kind === 'static' || masters.length === 1) {
    const m = masters[0];
    return {
      width: m.width,
      layers: [{ path: m.path, opacity: 1, nativeWidth: m.width }],
    };
  }

  if (glyph.kind === 'full') {
    const maxIdx = masters.length - 1;
    const scaled = amount * maxIdx;
    const i0 = Math.min(maxIdx, Math.floor(scaled));
    const i1 = Math.min(maxIdx, i0 + 1);
    const local = scaled - i0;
    if (local < 0.0005 || i0 === i1) {
      const m = masters[i0];
      return {
        width: m.width,
        layers: [{ path: m.path, opacity: 1, nativeWidth: m.width }],
      };
    }
    const m = sampleMasterPair(masters[i0], masters[i1], local);
    return {
      width: m.width,
      layers: [{ path: m.path, opacity: 1, nativeWidth: m.nativeWidth }],
    };
  }

  const def = masters[0];
  const alt1 = masters[1] ?? def;
  const alt2 = masters[2] ?? alt1;

  if (!canLerp(alt1, alt2)) {
    return {
      width: def.width,
      layers: [{ path: def.path, opacity: 1, nativeWidth: def.width }],
    };
  }

  const tMin = altsOnlyTMin(def, alt1, alt2);
  const t = tMin + amount * (1 - tMin);
  const sampled = sampleMasterPair(alt1, alt2, t);

  return {
    width: sampled.width,
    layers: [
      {
        path: sampled.path,
        opacity: 1,
        nativeWidth: sampled.nativeWidth,
      },
    ],
  };
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function shouldPlayIntro(intro: LogoWaveInitOptions['intro'], key: string): boolean {
  if (!intro || intro === false) return false;
  if (prefersReducedMotion()) return false;
  if (intro === true || intro === 'always') return true;
  if (intro === 'once') {
    try {
      return !sessionStorage.getItem(key);
    } catch {
      return true;
    }
  }
  return false;
}

function markIntroPlayed(key: string) {
  try {
    sessionStorage.setItem(key, '1');
  } catch {
    /* ignore */
  }
}

function normalizeIntro(
  intro: LogoWaveInitOptions['intro'],
): boolean | 'once' | undefined {
  if (intro === 'always' || intro === true) return true;
  if (intro === 'once') return 'once';
  return undefined;
}

/**
 * Build SVG letter markup (same structure as LogoWave.astro) for arbitrary text.
 */
export function buildWaveTextDOM(text: string, data: LogoWaveData): {
  root: HTMLElement;
  row: HTMLElement;
} {
  const emUnits = data.emUnits ?? data.upm ?? 1000;
  /** Path masters use flipped Y; baseline in SVG (y-down) after un-flip. */
  const pathBaseline = emUnits / 2 + CAP_HEIGHT / 2;
  /** SVG text (y-down): alphabetic baseline aligned with path letters. */
  const textBaseline = pathBaseline;
  const upper = normalizeWaveText(text);

  const root = document.createElement('span');
  root.className = 'logo-wave wave-text';
  root.setAttribute('data-logo-wave', '');

  const sr = document.createElement('span');
  sr.className = 'logo-wave__sr';
  sr.textContent = upper;

  const row = document.createElement('span');
  row.className = 'logo-wave__row';
  row.setAttribute('aria-hidden', 'true');

  for (const char of upper) {
    if (char === ' ') {
      const space = document.createElement('span');
      space.className = 'logo-wave__space';
      space.dataset.logoLetter = ' ';
      space.dataset.logoSpace = '1';
      space.style.width = `${data.spaceWidth / emUnits}em`;
      row.appendChild(space);
      continue;
    }

    // Digits / punct: real Blatant Bold via <text> (path pack is A–Z only)
    if (isWaveFontChar(char)) {
      const w = waveFontAdvance(char);
      const size = waveFontSize(emUnits);
      const letter = document.createElement('span');
      letter.className = 'logo-wave__letter logo-wave__letter--static logo-wave__letter--font';
      letter.dataset.logoLetter = char;
      letter.dataset.logoFont = '1';
      letter.style.width = `${w / emUnits}em`;
      letter.innerHTML = `
        <svg viewBox="0 0 ${w} ${emUnits}" width="100%" height="1em" overflow="visible">
          <text
            x="${w / 2}"
            y="${textBaseline}"
            text-anchor="middle"
            font-family="Blatant Bold, Arial Black, Impact, sans-serif"
            font-size="${size}"
            font-weight="700"
            fill="currentColor"
          >${char === '&' ? '&amp;' : char}</text>
        </svg>
      `.trim();
      row.appendChild(letter);
      continue;
    }

    const glyph = data.glyphs[char];
    if (!glyph) continue;

    const master = glyph.masters[0];
    const w = master?.width ?? 500;
    const pathD = master?.path ?? '';

    const letter = document.createElement('span');
    letter.className = `logo-wave__letter${glyph.masters.length > 1 ? ' logo-wave__letter--stretch' : ' logo-wave__letter--static'}`;
    letter.dataset.logoLetter = char;
    letter.style.width = `${w / emUnits}em`;

    letter.innerHTML = `
      <svg viewBox="0 0 ${w} ${emUnits}" width="100%" height="1em" overflow="visible">
        <g transform="translate(0 ${pathBaseline}) scale(1 -1)">
          <g data-logo-layer="a">
            <path data-logo-path="a" d="${pathD}" fill="currentColor" fill-rule="evenodd"></path>
          </g>
          <g data-logo-layer="b">
            <path data-logo-path="b" d="${pathD}" fill="currentColor" fill-rule="evenodd" opacity="0"></path>
          </g>
        </g>
      </svg>
    `.trim();

    row.appendChild(letter);
  }

  root.append(sr, row);
  return { root, row };
}

/**
 * Mount wave text into a host (replaces children) and init interaction/sweep.
 * Returns a handle with `playSweep()` for scripted L→R waves (page transitions).
 */
export function mountWaveText(
  host: HTMLElement,
  text: string,
  data: LogoWaveData,
  options: LogoWaveInitOptions = {},
): WaveHandle {
  const { root } = buildWaveTextDOM(text, data);
  host.replaceChildren(root);
  host.classList.add('wave-text-host');
  return initLogoWave(root, data, options);
}

export function initLogoWave(
  root: HTMLElement,
  data: LogoWaveData,
  options: LogoWaveInitOptions = {},
): WaveHandle {
  const noop: WaveHandle = {
    root,
    destroy: () => undefined,
    playSweep: async () => undefined,
  };

  if (root.dataset.logoWaveInit === '1') {
    return noop;
  }
  root.dataset.logoWaveInit = '1';

  const emUnits = data.emUnits ?? data.upm ?? 1000;
  const row = root.querySelector<HTMLElement>('.logo-wave__row');
  const slots: Slot[] = [];
  const pointerEnabled = options.pointer !== false;
  // Navbar wordmark: never fit-scale. Intro looked correct while lockLayout
  // skipped fitRow; when intro ended, fitRow crushed it to the flex leftover.
  const allowFit =
    options.fit ??
    !(
      root.classList.contains('logo') ||
      root.dataset.logoFit === 'off' ||
      root.closest('.site-nav, [data-site-header]')
    );

  root.querySelectorAll<HTMLElement>('[data-logo-letter]').forEach((el) => {
    const char = el.dataset.logoLetter ?? '';
    const isSpace = el.dataset.logoSpace === '1';
    const isFont = el.dataset.logoFont === '1';
    const svgEl = el.querySelector('svg');
    const pathA = el.querySelector<SVGPathElement>('[data-logo-path="a"]');
    const pathB = el.querySelector<SVGPathElement>('[data-logo-path="b"]');
    const groupA = el.querySelector<SVGGElement>('[data-logo-layer="a"]');
    const groupB = el.querySelector<SVGGElement>('[data-logo-layer="b"]');
    // Path letters need pathA; font digits/punct need data-logo-font
    if (!isSpace && !pathA && !isFont) return;

    const glyph =
      !isSpace && !isFont && char
        ? ((data.glyphs[char] as LogoGlyphDef | undefined) ?? null)
        : null;

    slots.push({
      el,
      pathA,
      pathB,
      groupA,
      groupB,
      svgEl,
      char,
      isSpace,
      glyph,
      current: 0,
      target: 0,
    });
  });

  if (!slots.length) {
    delete root.dataset.logoWaveInit;
    return noop;
  }

  let raf = 0;
  let running = false;
  let pointerActive = false;
  let introPlaying = false;
  let introRaf = 0;
  let introRetryTimer = 0;
  /** When true, skip fitRow (avoids fighting parent transforms e.g. page-mask scale) */
  let lockLayout = false;
  /** Clear inline layout overrides applied during a centered sweep */
  let sweepLayoutPinned = false;
  const peakStretch = 0.92;
  let falloffPx = 96;
  const followIn = 0.12;
  const followOut = 0.08;
  const settle = 0.0015;

  const introDurationMs = options.introDurationMs ?? 2400;
  const introPeak = options.introPeak ?? 0.88;
  const introKey = options.introStorageKey ?? DEFAULT_INTRO_KEY;
  /** Soft ease toward peak during sweep — low enough that growth is visible */
  const introFollow = 0.1;

  let sweepResolve: (() => void) | null = null;

  function applyLayer(
    pathEl: SVGPathElement | null,
    groupEl: SVGGElement | null,
    layer: GlyphLayer | undefined,
    slotWidth: number,
  ) {
    if (!pathEl || !groupEl) return;
    if (!layer || layer.opacity < 0.001) {
      pathEl.setAttribute('opacity', '0');
      pathEl.style.visibility = 'hidden';
      return;
    }
    pathEl.style.visibility = 'visible';
    pathEl.setAttribute('d', layer.path);
    pathEl.setAttribute('opacity', '1');
    const sx = slotWidth / Math.max(1, layer.nativeWidth);
    groupEl.setAttribute('transform', `scale(${sx} 1)`);
  }

  function applySlot(slot: Slot) {
    if (slot.isSpace) {
      slot.el.style.width = `${data.spaceWidth / emUnits}em`;
      slot.el.style.transform = '';
      return;
    }
    // Font glyphs (digits/punct): fixed advance, no path morph — same as "I"
    if (slot.el.dataset.logoFont === '1') {
      const w = waveFontAdvance(slot.char);
      slot.el.style.width = `${w / emUnits}em`;
      slot.el.style.transform = '';
      return;
    }
    if (!slot.glyph || !slot.pathA) return;

    const sample = sampleGlyph(slot.glyph, slot.current);
    const w = Math.max(sample.width, 1);

    slot.el.style.width = `${w / emUnits}em`;
    slot.el.style.transform = '';

    if (slot.svgEl) {
      slot.svgEl.setAttribute('viewBox', `0 0 ${w} ${emUnits}`);
    }

    applyLayer(slot.pathA, slot.groupA, sample.layers[0], w);
    applyLayer(slot.pathB, slot.groupB, undefined, w);
  }

  function fitRow() {
    if (!row) return;
    // Always clear any leftover scale (e.g. pre-intro paint or HMR).
    row.style.transform = '';
    row.style.transformOrigin = '';
    if (lockLayout || !allowFit) return;
    const natural = row.scrollWidth;
    const budget = Math.max(root.clientWidth, 1);
    if (natural > budget * 1.02) {
      const s = budget / natural;
      row.style.transform = `scale(${s})`;
      row.style.transformOrigin = 'left center';
    }
  }

  function paintAll() {
    for (const slot of slots) applySlot(slot);
    fitRow();
  }

  /** Letters that actually change width (skip I, X, Y, spaces, static). */
  function isStretchable(slot: Slot): boolean {
    return !slot.isSpace && !!slot.glyph && slot.glyph.masters.length >= 2;
  }

  function stretchableSlots(): Slot[] {
    return slots.filter(isStretchable);
  }

  /** Pointer hover — width wave only. */
  function updateTargetsFromX(clientX: number, peak = peakStretch, snapCurrent = false) {
    const stretch = stretchableSlots();
    if (stretch.length >= 2) {
      const r0 = stretch[0].el.getBoundingClientRect();
      const r1 = stretch[1].el.getBoundingClientRect();
      const pitch = Math.abs(r1.left - r0.left) || 24;
      falloffPx = Math.max(72, Math.min(160, pitch * 2.6));
    }

    for (const slot of slots) {
      if (!isStretchable(slot)) {
        slot.target = 0;
        if (snapCurrent) slot.current = 0;
        continue;
      }
      const rect = slot.el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const dist = Math.abs(clientX - cx);
      const raw = 1 - dist / falloffPx;
      const influence = raw <= 0 ? 0 : smoothstep(0, 1, raw);
      slot.target = influence * peak;
      if (snapCurrent) slot.current = slot.target;
    }
  }

  /**
   * Scripted L→R width wave using frozen rest centers of stretchable letters only
   * (I/X/Y skipped so the lobe doesn’t die on a non-widening glyph).
   */
  function updateTargetsFromFrozenCenters(
    peakX: number,
    peak: number,
    stretch: Slot[],
    centers: number[],
    falloff: number,
  ) {
    for (const slot of slots) {
      if (!isStretchable(slot)) slot.target = 0;
    }
    for (let i = 0; i < stretch.length; i++) {
      const slot = stretch[i];
      const cx = centers[i] ?? 0;
      const dist = Math.abs(peakX - cx);
      const raw = 1 - dist / falloff;
      const influence = raw <= 0 ? 0 : smoothstep(0, 1, raw);
      slot.target = influence * peak;
    }
  }

  function clearTargets() {
    for (const slot of slots) slot.target = 0;
  }

  function frame() {
    let any = false;
    for (const slot of slots) {
      if (slot.isSpace || !slot.glyph) {
        applySlot(slot);
        continue;
      }

      const d = slot.target - slot.current;
      if (Math.abs(d) > settle) {
        const k = introPlaying ? introFollow : d < 0 ? followOut : followIn;
        slot.current += d * k;
        any = true;
      } else if (slot.current !== slot.target) {
        slot.current = slot.target;
        any = true;
      }
      applySlot(slot);
    }
    fitRow();

    const stillMoving = slots.some(
      (s) => !s.isSpace && s.glyph && Math.abs(s.target - s.current) > settle,
    );

    if (any || pointerActive || introPlaying || stillMoving) {
      raf = requestAnimationFrame(frame);
    } else {
      for (const slot of slots) {
        if (slot.isSpace || !slot.glyph) continue;
        slot.current = 0;
        slot.target = 0;
        applySlot(slot);
      }
      fitRow();
      running = false;
      raf = 0;
      if (sweepResolve) {
        const done = sweepResolve;
        sweepResolve = null;
        done();
      }
    }
  }

  function startLoop() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }

  function clearSweepLayoutPin() {
    if (!sweepLayoutPinned) return;
    sweepLayoutPinned = false;
    root.style.width = '';
    root.style.justifyContent = '';
    root.style.marginInline = '';
    if (row) {
      row.style.justifyContent = '';
      row.style.transform = '';
    }
  }

  function playSweep(opts: SweepOptions = {}): Promise<void> {
    if (prefersReducedMotion()) {
      return Promise.resolve();
    }

    // Peak path only visits stretchable glyphs (I/X/Y skipped for width wave)
    const stretch = stretchableSlots();
    if (!stretch.length) return Promise.resolve();

    const durationMs = opts.durationMs ?? introDurationMs;
    const peak = opts.peak ?? introPeak;
    // Navbar logo stays start-aligned; page-mask titles pin center to avoid shake
    const layout = opts.layout ?? 'start';
    const lastLettersTrail = opts.lastLettersTrail ?? 0.65;
    const onLastLetters = opts.onLastLetters;

    return new Promise<void>((resolve) => {
      const prev = sweepResolve;
      sweepResolve = () => {
        prev?.();
        resolve();
      };

      introPlaying = true;
      lockLayout = true;
      root.classList.add('is-waving', 'is-intro');

      // Width rest only — no per-letter scale (navbar stays visually stable)
      for (const slot of slots) {
        slot.current = 0;
        slot.target = 0;
      }
      paintAll();

      if (layout === 'center' && row) {
        // Only for transition titles (centered under translate(-50%))
        const restW = row.scrollWidth;
        root.style.width = `${restW}px`;
        root.style.justifyContent = 'center';
        row.style.justifyContent = 'center';
        row.style.transform = 'none';
        sweepLayoutPinned = true;
      } else if (row) {
        // Navbar: keep natural left (start) alignment — never center
        root.style.width = '';
        root.style.justifyContent = 'flex-start';
        row.style.justifyContent = 'flex-start';
        row.style.transform = 'none';
        sweepLayoutPinned = false;
      }

      // Centers of stretchable letters only
      const centers = stretch.map((s) => s.el.offsetLeft + s.el.offsetWidth / 2);
      const pitches: number[] = [];
      for (let i = 1; i < centers.length; i++) {
        pitches.push(Math.abs(centers[i] - centers[i - 1]));
      }
      const avgPitch =
        pitches.length > 0
          ? pitches.reduce((a, b) => a + b, 0) / pitches.length
          : stretch[0].el.offsetWidth || 40;
      const falloff = Math.max(avgPitch * 3.1, 64);
      const pad = falloff * 1.05;
      const startX = centers[0] - pad;
      const endX = centers[centers.length - 1] + pad;
      const lastCenter = centers[centers.length - 1];
      // Fire after the peak has left the last letter so its widen→return is finishing
      const lastLettersX = lastCenter + falloff * lastLettersTrail;
      let lastLettersFired = false;

      startLoop();

      const run = () => {
        const t0 = performance.now();

        const tick = (now: number) => {
          const rawT = Math.min(1, (now - t0) / durationMs);
          const e = easeOutCubic(rawT);
          const peakX = startX + (endX - startX) * e;
          updateTargetsFromFrozenCenters(peakX, peak, stretch, centers, falloff);

          if (!lastLettersFired && peakX >= lastLettersX) {
            lastLettersFired = true;
            onLastLetters?.();
          }

          if (rawT < 1) {
            introRaf = requestAnimationFrame(tick);
          } else {
            if (!lastLettersFired) {
              lastLettersFired = true;
              onLastLetters?.();
            }
            clearTargets();
            introPlaying = false;
            root.classList.remove('is-intro');
            startLoop();
          }
        };
        introRaf = requestAnimationFrame(tick);
      };

      const start = () => requestAnimationFrame(() => requestAnimationFrame(run));
      if (document.fonts?.ready) {
        document.fonts.ready.then(start).catch(start);
      } else {
        start();
      }
    }).then(() => {
      lockLayout = false;
      clearSweepLayoutPin();
      // Ensure start alignment is restored on logo after any sweep
      root.style.justifyContent = '';
      if (row) {
        row.style.justifyContent = '';
        row.style.transform = '';
      }
      root.classList.remove('is-waving');
      paintAll();
    });
  }

  // Initial paint
  paintAll();

  const cleanups: Array<() => void> = [];

  if (pointerEnabled) {
    const onMove = (e: PointerEvent) => {
      if (prefersReducedMotion() || introPlaying) return;
      pointerActive = true;
      root.classList.add('is-waving');
      updateTargetsFromX(e.clientX);
      startLoop();
    };

    const onLeave = () => {
      if (introPlaying) return;
      pointerActive = false;
      root.classList.remove('is-waving');
      clearTargets();
      startLoop();
    };

    root.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerenter', onMove, { passive: true });
    root.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerenter', onMove);
      root.removeEventListener('pointerleave', onLeave);
    });
  }

  const emitIntroEnd = () => {
    // Flag so late listeners (e.g. toast banner) don't hang if they mount after
    document.documentElement.dataset.logoWaveIntroDone = '1';
    const detail = { root };
    root.dispatchEvent(
      new CustomEvent('logo-wave:intro-end', { bubbles: true, detail }),
    );
    document.dispatchEvent(new CustomEvent('logo-wave:intro-end', { detail }));
  };

  const introOpt = normalizeIntro(options.intro);
  if (shouldPlayIntro(introOpt, introKey)) {
    // Fresh load — clear previous-session flag so waiters re-arm
    delete document.documentElement.dataset.logoWaveIntroDone;
    playSweep().then(() => {
      if (introOpt === 'once') markIntroPlayed(introKey);
      emitIntroEnd();
    });
  } else {
    // Intro skipped (already played / reduced motion) — unblock waiters immediately
    emitIntroEnd();
  }

  return {
    root,
    playSweep,
    destroy: () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(introRaf);
      window.clearTimeout(introRetryTimer);
      introPlaying = false;
      lockLayout = false;
      clearSweepLayoutPin();
      root.style.justifyContent = '';
      root.style.width = '';
      if (row) {
        row.style.justifyContent = '';
        row.style.transform = '';
      }
      cleanups.forEach((fn) => fn());
      delete root.dataset.logoWaveInit;
      if (sweepResolve) {
        const done = sweepResolve;
        sweepResolve = null;
        done();
      }
    },
  };
}
