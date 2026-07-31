/**
 * Homepage bento multi-filter + preferred-size packer + FLIP reflow.
 *
 * Filter packing rules:
 * 1. Each card has a preferred size (`data-size`) and a priority (`data-priority`).
 * 2. Place high-priority cards first at their preferred size (2-row bands).
 * 3. Smaller preferred cards (e.g. sm) only grow if free space remains after everyone is placed.
 * 4. Unfiltered (ALL) restores authored preferred sizes as-is.
 *
 * Example — WEB + GAS PUMP OS (5 cols):
 *   Staircase lg 2×2, HP lg 2×2, Vibecheck sm, Gilbarco sm → full width, no forced tall on sm.
 */

const EASE = 'cubic-bezier(0.44, 0, 0.56, 1)';
const EXIT_MS = 180;
const MOVE_MS = 420;
const ENTER_MS = 320;

const SIZE_CLASSES = ['is-sm', 'is-md', 'is-wide', 'is-tall', 'is-lg', 'is-xl'] as const;
type CellSize = 'sm' | 'md' | 'wide' | 'tall' | 'lg' | 'xl';

/** Default priority from preferred size when data-priority is 0/missing */
const SIZE_PRIORITY: Record<CellSize, number> = {
  sm: 30,
  md: 30,
  wide: 50,
  tall: 60,
  lg: 80,
  xl: 90,
};

/** Grid units [cols, rows] for each size */
const SIZE_DIMS: Record<CellSize, readonly [number, number]> = {
  sm: [1, 1],
  md: [1, 1],
  wide: [2, 1],
  tall: [1, 2],
  lg: [2, 2],
  xl: [2, 3],
};

type FirstMap = Map<HTMLElement, DOMRect>;
type Placement = { c: number; r: number; w: number; h: number; size: CellSize };

function cellsOf(grid: HTMLElement): HTMLElement[] {
  return Array.from(grid.querySelectorAll<HTMLElement>('[data-bento-cell]'));
}

function boardOf(grid: HTMLElement): HTMLElement | null {
  return grid.querySelector<HTMLElement>('.project-grid');
}

function isShown(el: HTMLElement): boolean {
  return !el.hidden && getComputedStyle(el).display !== 'none';
}

function cellTags(el: HTMLElement): string[] {
  return (el.dataset.tags ?? '').split('|').filter(Boolean);
}

/** Preferred size = authored `size` / data-size */
function preferredSize(el: HTMLElement): CellSize {
  const s = el.dataset.size as CellSize | undefined;
  return s && s in SIZE_DIMS ? s : 'sm';
}

function baseSize(el: HTMLElement): CellSize {
  return preferredSize(el);
}

function cardPriority(el: HTMLElement): number {
  const raw = Number(el.dataset.priority || '0');
  if (Number.isFinite(raw) && raw > 0) return raw;
  return SIZE_PRIORITY[preferredSize(el)];
}

/** OR match: empty set = all; else card needs ≥1 selected tag. */
function matchesSelection(el: HTMLElement, selected: ReadonlySet<string>): boolean {
  if (selected.size === 0) return true;
  const tags = cellTags(el);
  for (const t of selected) {
    if (tags.includes(t)) return true;
  }
  return false;
}

function setCellSize(el: HTMLElement, size: CellSize) {
  el.classList.remove(...SIZE_CLASSES);
  el.classList.add(`is-${size}`);
  el.dataset.layoutSize = size;
}

/** Read computed column count from the live grid (matches breakpoints). */
function getColCount(board: HTMLElement | null): number {
  if (!board) return 5;
  const cols = getComputedStyle(board)
    .gridTemplateColumns.split(/\s+/)
    .filter(Boolean);
  if (cols.length <= 1) return Math.max(1, cols.length);
  return cols.length;
}

/**
 * Tablet (2-col) size exceptions:
 * - tall 1×2: Intermex, Gilbarco (portrait art)
 * - wide 2×1: Moove
 * Everyone else: sm 1×1 (large tiles dominate this width).
 */
const TABLET_TALL_SLUGS = new Set(['intermex', 'gilbarco']);
const TABLET_WIDE_SLUGS = new Set(['moove']);

/**
 * Visual placement order on 2-col tablet (CSS grid uses order-modified
 * document order). Pairs that must sit side-by-side:
 *   booking | bubble,  intermex | gilbarco
 * Moove (wide) sits above booking/bubble.
 */
const TABLET_ORDER: readonly string[] = [
  'crypto-bros',
  'staircase',
  'hp-printables',
  'vibecheck',
  'moove',
  'booking',
  'bubble',
  'intermex',
  'gilbarco',
];

function cellSlug(el: HTMLElement): string {
  return el.dataset.slug ?? '';
}

function allowsTabletTall(el: HTMLElement): boolean {
  return TABLET_TALL_SLUGS.has(cellSlug(el));
}

function allowsTabletWide(el: HTMLElement): boolean {
  return TABLET_WIDE_SLUGS.has(cellSlug(el));
}

/** Apply / clear grid `order` so tablet pairs sit inline. */
function applyFlowOrder(cells: HTMLElement[], cols: number) {
  // Only 2-col tablet uses a custom flow order
  if (cols !== 2) {
    for (const el of cells) {
      el.style.order = '';
      delete el.dataset.flowOrder;
    }
    return;
  }

  const rank = new Map(TABLET_ORDER.map((slug, i) => [slug, i]));
  // Known slugs first (TABLET_ORDER), unknowns after in stable DOM order
  let extra = TABLET_ORDER.length;
  for (const el of cells) {
    const slug = cellSlug(el);
    const ord = rank.has(slug) ? rank.get(slug)! : extra++;
    el.style.order = String(ord);
    el.dataset.flowOrder = String(ord);
  }
}

/**
 * Desktop (5-col): authored size.
 * Tablet (2-col): slug exceptions → tall/wide; all others → sm.
 * Mobile (1-col): sm (CSS equalizes height tracks).
 */
function clampSizeForCols(size: CellSize, cols: number, el: HTMLElement): CellSize {
  if (cols >= 5) return size;
  if (cols <= 1) return 'sm';
  if (allowsTabletTall(el)) return 'tall';
  if (allowsTabletWide(el)) return 'wide';
  return 'sm';
}

/** Sizes to try if preferred does not fit (never larger than preferred). */
function shrinkLadder(pref: CellSize, cols: number, el: HTMLElement): CellSize[] {
  const capped = clampSizeForCols(pref, cols, el);
  switch (capped) {
    case 'xl':
      return ['xl', 'lg', 'tall', 'wide', 'sm'];
    case 'lg':
      return ['lg', 'tall', 'wide', 'sm'];
    case 'tall':
      return ['tall', 'sm'];
    case 'wide':
      return ['wide', 'sm'];
    default:
      return ['sm'];
  }
}

/** Area in unit cells */
function sizeArea(size: CellSize): number {
  const [w, h] = SIZE_DIMS[size];
  return w * h;
}

/**
 * Growth candidates when leftover space exists.
 * Prefer filling a free column with tall (1×2) before jumping to lg (2×2),
 * which often opens a new band and leaves an empty column.
 * On tablet: only slug exceptions may grow (tall / wide); never lg/xl.
 */
function growLadder(
  cur: CellSize,
  preferred: CellSize,
  alone: boolean,
  cols: number,
  el: HTMLElement,
): CellSize[] {
  // Mobile (1-col): never grow. Tablet (2-col): slug exceptions only.
  if (cols < 5) {
    if (cols <= 1) return [];
    if (allowsTabletTall(el) && (cur === 'sm' || cur === 'md')) return ['tall'];
    if (allowsTabletWide(el) && (cur === 'sm' || cur === 'md')) return ['wide'];
    return [];
  }

  if (alone) {
    const all: CellSize[] = ['tall', 'wide', 'lg', 'xl'];
    return all.filter((s) => sizeArea(s) > sizeArea(cur));
  }

  switch (cur) {
    case 'sm':
    case 'md':
      return ['tall', 'wide', 'lg'];
    case 'wide':
      return preferred === 'xl' ? ['lg', 'xl'] : ['lg'];
    case 'tall':
      return preferred === 'lg' || preferred === 'xl' || alone ? ['lg'] : [];
    case 'lg':
      return preferred === 'xl' ? ['xl'] : [];
    default:
      return [];
  }
}

/**
 * 2D packer: preferred size first (by priority), then minimal growth into leftovers.
 * Growth never opens a new 2-row band if the current bands still have free cells.
 */
function packFiltered(visible: HTMLElement[], cols: number): Map<HTMLElement, CellSize> {
  const plan = new Map<HTMLElement, CellSize>();
  if (visible.length === 0) return plan;

  if (cols <= 1) {
    for (const el of visible) {
      plan.set(el, clampSizeForCols(preferredSize(el), cols, el));
    }
    return plan;
  }

  /**
   * On narrow grids, place larger footprints first (wide/tall before sm)
   * so 2×1 / 1×2 tiles don't get stuck in awkward holes. Desktop keeps
   * priority-only order for the art-directed 5-col pack.
   */
  const sortedDesc = [...visible].sort((a, b) => {
    if (cols < 5) {
      const sizeA = clampSizeForCols(preferredSize(a), cols, a);
      const sizeB = clampSizeForCols(preferredSize(b), cols, b);
      const areaDiff = sizeArea(sizeB) - sizeArea(sizeA);
      if (areaDiff !== 0) return areaDiff;
    }
    return cardPriority(b) - cardPriority(a);
  });
  const sortedAsc = [...sortedDesc].reverse();
  const alone = visible.length === 1;

  const occ: boolean[][] = [];
  const ensureRows = (n: number) => {
    while (occ.length < n) occ.push(Array.from({ length: cols }, () => false));
  };
  ensureRows(2);

  const canPlace = (c: number, r: number, w: number, h: number) => {
    if (c < 0 || r < 0 || c + w > cols || r + h > occ.length) return false;
    for (let y = r; y < r + h; y++) {
      for (let x = c; x < c + w; x++) {
        if (occ[y][x]) return false;
      }
    }
    return true;
  };

  const mark = (c: number, r: number, w: number, h: number, val: boolean) => {
    for (let y = r; y < r + h; y++) {
      for (let x = c; x < c + w; x++) occ[y][x] = val;
    }
  };

  const freeCount = () => {
    let n = 0;
    for (let r = 0; r < occ.length; r++) {
      for (let c = 0; c < cols; c++) if (!occ[r][c]) n++;
    }
    return n;
  };

  /** Top-most free spot; optionally forbid expanding past maxRows */
  const findSpot = (
    w: number,
    h: number,
    maxRows: number | null,
    allowExpand: boolean,
  ): { c: number; r: number } | null => {
    const limit = maxRows ?? occ.length + (allowExpand ? 8 : 0);
    for (let expand = 0; expand < (allowExpand ? 4 : 1); expand++) {
      const rows = Math.min(occ.length, limit);
      for (let r = 0; r <= rows - h; r++) {
        for (let c = 0; c <= cols - w; c++) {
          if (canPlace(c, r, w, h)) return { c, r };
        }
      }
      if (!allowExpand) break;
      if (occ.length >= limit) break;
      ensureRows(occ.length + 2);
    }
    return null;
  };

  const placements = new Map<HTMLElement, Placement>();

  // —— Pass 1: preferred size (priority order), shrink only if needed ——
  for (const el of sortedDesc) {
    const pref = clampSizeForCols(preferredSize(el), cols, el);
    let placed = false;
    for (const size of shrinkLadder(pref, cols, el)) {
      const [w, h] = SIZE_DIMS[size];
      // Prefer packing into existing free cells before opening a new band
      let spot = findSpot(w, h, occ.length, false);
      if (!spot) spot = findSpot(w, h, null, true);
      if (!spot) continue;
      mark(spot.c, spot.r, w, h, true);
      placements.set(el, { c: spot.c, r: spot.r, w, h, size });
      plan.set(el, size);
      placed = true;
      break;
    }
    if (!placed) {
      ensureRows(occ.length + 2);
      const spot = findSpot(1, 1, null, true);
      if (spot) {
        mark(spot.c, spot.r, 1, 1, true);
        placements.set(el, { c: spot.c, r: spot.r, w: 1, h: 1, size: 'sm' });
      }
      plan.set(el, 'sm');
    }
  }

  // —— Pass 2: minimal growth that reduces free cells, without new bands ——
  // Score: free cells after (lower better), then smaller size area, then lower priority.
  const tryGrowth = (): boolean => {
    const freeBefore = freeCount();
    if (freeBefore === 0) return false;

    // Don't open new bands during growth — fill holes in the current footprint
    const maxRows = occ.length;

    type Cand = {
      el: HTMLElement;
      next: CellSize;
      c: number;
      r: number;
      w: number;
      h: number;
      freeAfter: number;
      area: number;
      pri: number;
    };
    let best: Cand | null = null;

    for (const el of sortedAsc) {
      const cur = placements.get(el);
      // lg/xl already max on desktop; on tablet they should never appear
      if (!cur || cur.size === 'lg' || cur.size === 'xl') continue;
      const pref = clampSizeForCols(preferredSize(el), cols, el);

      for (const next of growLadder(cur.size, pref, alone, cols, el)) {
        if (sizeArea(next) <= sizeArea(cur.size)) continue;
        const clamped = clampSizeForCols(next, cols, el);
        if (clamped !== next) continue;
        const [nw, nh] = SIZE_DIMS[next];

        // Simulate remove current
        mark(cur.c, cur.r, cur.w, cur.h, false);

        const tryApply = (c: number, r: number) => {
          if (!canPlace(c, r, nw, nh)) return;
          // temp mark
          mark(c, r, nw, nh, true);
          const freeAfter = freeCount();
          mark(c, r, nw, nh, false);
          if (freeAfter >= freeBefore) return; // must consume free space
          const cand: Cand = {
            el,
            next,
            c,
            r,
            w: nw,
            h: nh,
            freeAfter,
            area: sizeArea(next),
            pri: cardPriority(el),
          };
          if (
            !best ||
            cand.freeAfter < best.freeAfter ||
            (cand.freeAfter === best.freeAfter && cand.area < best.area) ||
            (cand.freeAfter === best.freeAfter &&
              cand.area === best.area &&
              cand.pri < best.pri)
          ) {
            best = cand;
          }
        };

        // In place first (fills vertical/horizontal leftovers next to self)
        tryApply(cur.c, cur.r);
        // Then any free spot within current bands only
        for (let r = 0; r <= maxRows - nh; r++) {
          for (let c = 0; c <= cols - nw; c++) {
            if (c === cur.c && r === cur.r) continue;
            tryApply(c, r);
          }
        }

        // restore current
        mark(cur.c, cur.r, cur.w, cur.h, true);
      }
    }

    if (!best) return false;

    const cur = placements.get(best.el)!;
    mark(cur.c, cur.r, cur.w, cur.h, false);
    mark(best.c, best.r, best.w, best.h, true);
    placements.set(best.el, {
      c: best.c,
      r: best.r,
      w: best.w,
      h: best.h,
      size: best.next,
    });
    plan.set(best.el, best.next);
    return true;
  };

  while (tryGrowth()) {
    /* keep filling holes */
  }

  return plan;
}

function planLayout(
  visible: HTMLElement[],
  selected: ReadonlySet<string>,
  cols: number,
): Map<HTMLElement, CellSize> {
  // Desktop 5-col ALL — preserve authored preferred sizes (art-directed).
  // Narrower grids always pack so 2-wide tiles don't leave empty tracks.
  if (selected.size === 0 && cols >= 5) {
    const plan = new Map<HTMLElement, CellSize>();
    for (const el of visible) plan.set(el, preferredSize(el));
    return plan;
  }
  return packFiltered(visible, cols);
}

function captureFirst(cells: HTMLElement[]): FirstMap {
  const map: FirstMap = new Map();
  for (const el of cells) {
    if (isShown(el)) map.set(el, el.getBoundingClientRect());
  }
  return map;
}

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function syncToolbar(toolbar: HTMLElement, selected: ReadonlySet<string>) {
  const none = selected.size === 0;
  toolbar.querySelectorAll<HTMLElement>('[data-bento-filter]').forEach((btn) => {
    const value = btn.dataset.bentoFilter ?? '';
    const active = value === '' ? none : selected.has(value);
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');

    const tagEl = btn.querySelector<HTMLElement>('.tag--chip');
    if (tagEl) tagEl.classList.toggle('is-pressed', active);
  });
}

function updateStatus(grid: HTMLElement, selected: ReadonlySet<string>) {
  const status = grid.querySelector<HTMLElement>('[data-bento-status]');
  if (!status) return;

  const visible = cellsOf(grid).filter((c) => matchesSelection(c, selected)).length;
  if (selected.size === 0) {
    status.textContent = `Showing all ${visible} projects`;
    return;
  }
  const list = [...selected].join(', ');
  status.textContent = `Showing ${visible} project${visible === 1 ? '' : 's'} tagged ${list}`;
}

/**
 * FLIP with inverse scale on the card shell so images keep aspect ratio.
 */
function flipTo(
  el: HTMLElement,
  first: DOMRect,
  last: DOMRect,
  duration: number,
): Promise<unknown> {
  const dx = first.left - last.left;
  const dy = first.top - last.top;
  const sx = first.width / Math.max(last.width, 1);
  const sy = first.height / Math.max(last.height, 1);

  const noMove = Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5;
  const noScale = Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01;
  if (noMove && noScale) return Promise.resolve();

  const shell = el.querySelector<HTMLElement>('.project-card-shell');
  el.style.transformOrigin = '0 0';
  if (shell) shell.style.transformOrigin = '0 0';

  const jobs: Promise<unknown>[] = [
    el
      .animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
          { transform: 'translate(0px, 0px) scale(1, 1)' },
        ],
        { duration, easing: EASE },
      )
      .finished.catch(() => undefined),
  ];

  if (shell && !noScale) {
    jobs.push(
      shell
        .animate(
          [
            { transform: `scale(${1 / sx}, ${1 / sy})` },
            { transform: 'scale(1, 1)' },
          ],
          { duration, easing: EASE },
        )
        .finished.catch(() => undefined),
    );
  }

  return Promise.all(jobs).finally(() => {
    el.style.transformOrigin = '';
    el.style.transform = '';
    if (shell) {
      shell.style.transformOrigin = '';
      shell.style.transform = '';
    }
  });
}

function clearMotion(el: HTMLElement) {
  el.getAnimations().forEach((a) => a.cancel());
  el.style.opacity = '';
  el.style.transform = '';
  el.style.transformOrigin = '';
  const shell = el.querySelector<HTMLElement>('.project-card-shell');
  if (shell) {
    shell.getAnimations().forEach((a) => a.cancel());
    shell.style.transform = '';
    shell.style.transformOrigin = '';
  }
}

async function applyFilter(grid: HTMLElement, selected: ReadonlySet<string>) {
  const cells = cellsOf(grid);
  const board = boardOf(grid);

  if (grid.dataset.animating === 'true') {
    for (const el of cells) clearMotion(el);
  }

  // Always authored dense grid when packing with spans (no equal-tile fill mode)
  if (board) board.removeAttribute('data-fill');

  const cols = getColCount(board);
  const first = captureFirst(cells);
  const willShow = cells.filter((el) => matchesSelection(el, selected));
  const plan = planLayout(willShow, selected, cols);

  const staying: HTMLElement[] = [];
  const leaving: HTMLElement[] = [];
  const entering: HTMLElement[] = [];

  for (const el of cells) {
    const show = matchesSelection(el, selected);
    const was = first.has(el);
    if (was && show) staying.push(el);
    else if (was && !show) leaving.push(el);
    else if (!was && show) entering.push(el);
  }

  let sizeChanged = false;
  for (const el of staying) {
    const next = plan.get(el)!;
    const current = (el.dataset.layoutSize as CellSize | undefined) ?? baseSize(el);
    if (next !== current) sizeChanged = true;
  }

  let orderChanged = false;
  if (cols === 2) {
    const rank = new Map(TABLET_ORDER.map((slug, i) => [slug, i]));
    for (const el of willShow) {
      const slug = cellSlug(el);
      const want = String(rank.has(slug) ? rank.get(slug)! : 99);
      if ((el.dataset.flowOrder ?? '') !== want) orderChanged = true;
    }
  } else {
    orderChanged = willShow.some((el) => el.style.order !== '');
  }

  if (leaving.length === 0 && entering.length === 0 && !sizeChanged && !orderChanged) {
    for (const el of cells) {
      el.hidden = !matchesSelection(el, selected);
      if (!el.hidden) setCellSize(el, plan.get(el) ?? baseSize(el));
    }
    applyFlowOrder(willShow, cols);
    return;
  }

  const commitLayout = () => {
    for (const el of cells) {
      clearMotion(el);
      const show = matchesSelection(el, selected);
      el.hidden = !show;
      if (show) setCellSize(el, plan.get(el) ?? baseSize(el));
      else setCellSize(el, baseSize(el));
    }
    applyFlowOrder(
      cells.filter((el) => matchesSelection(el, selected)),
      cols,
    );
  };

  if (reducedMotion()) {
    commitLayout();
    return;
  }

  grid.dataset.animating = 'true';

  try {
    if (leaving.length) {
      await Promise.all(
        leaving.map((el) =>
          el
            .animate(
              [
                { opacity: 1, transform: 'scale(1)' },
                { opacity: 0, transform: 'scale(0.96)' },
              ],
              { duration: EXIT_MS, easing: 'ease', fill: 'forwards' },
            )
            .finished.catch(() => undefined),
        ),
      );
    }

    commitLayout();
    void board?.offsetWidth;

    const jobs: Promise<unknown>[] = [];

    for (const el of staying) {
      const f = first.get(el);
      if (!f) continue;
      jobs.push(flipTo(el, f, el.getBoundingClientRect(), MOVE_MS));
    }

    for (const el of entering) {
      jobs.push(
        el
          .animate(
            [
              { opacity: 0, transform: 'scale(0.96)' },
              { opacity: 1, transform: 'scale(1)' },
            ],
            { duration: ENTER_MS, easing: EASE },
          )
          .finished.catch(() => undefined),
      );
    }

    await Promise.all(jobs);
  } finally {
    for (const el of cells) clearMotion(el);
    grid.dataset.animating = 'false';
  }
}

export function initBentoFilter(root: ParentNode = document) {
  const grids = root.querySelectorAll<HTMLElement>('[data-bento-grid]');
  grids.forEach((grid) => {
    if (grid.dataset.bentoReady === 'true') return;
    grid.dataset.bentoReady = 'true';

    const toolbar = grid.querySelector<HTMLElement>('[data-bento-toolbar]');

    for (const el of cellsOf(grid)) {
      el.dataset.layoutSize = baseSize(el);
    }
    boardOf(grid)?.removeAttribute('data-fill');

    let selected = new Set<string>();
    if (toolbar) syncToolbar(toolbar, selected);

    // Initial pack on tablet/mobile (no toolbar required — home ships without filters)
    const board = boardOf(grid);
    if (getColCount(board) < 5) {
      void applyFilter(grid, new Set(selected));
    }

    // Re-pack when column count changes (ALL on tablet, or any active filter)
    let resizeTimer = 0;
    let lastCols = getColCount(board);
    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const cols = getColCount(boardOf(grid));
        if (cols === lastCols && selected.size === 0 && cols >= 5) return;
        lastCols = cols;
        void applyFilter(grid, new Set(selected));
      }, 120);
    });

    if (!toolbar) return;

    toolbar.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-bento-filter]');
      if (!target || !toolbar.contains(target)) return;

      const raw = target.dataset.bentoFilter ?? '';

      if (raw === '') {
        selected = new Set();
      } else if (selected.has(raw)) {
        selected.delete(raw);
      } else {
        selected.add(raw);
      }

      const snapshot = new Set(selected);
      syncToolbar(toolbar, snapshot);
      void applyFilter(grid, snapshot);
      updateStatus(grid, snapshot);
    });
  });
}

export { matchesSelection, packFiltered, preferredSize };
