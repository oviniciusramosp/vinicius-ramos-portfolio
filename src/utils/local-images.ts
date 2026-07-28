import type { ImageMetadata } from 'astro';

/**
 * Local raster assets live under `src/assets/` with the same logical path they
 * used to have under `public/` (e.g. `/projects/vibecheck/cover.png`).
 * Data layers keep those public-style paths; this registry resolves them for
 * Astro's image pipeline (`Picture` / `getImage`).
 *
 * SVGs, videos, and remote URLs are intentionally absent — leave them as-is.
 */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/**/*.{jpeg,jpg,png,webp,gif,avif}',
  { eager: true },
);

const byPath = new Map<string, ImageMetadata>();

for (const [filePath, mod] of Object.entries(modules)) {
  // filePath: /src/assets/projects/foo/bar.jpg → /projects/foo/bar.jpg
  const logical = filePath.replace(/^\/src\/assets/, '');
  byPath.set(logical, mod.default);
}

/** True for remote or non-raster paths that skip local optimization. */
export function isRemoteOrPassthrough(src: string): boolean {
  return (
    src.startsWith('https://') ||
    src.startsWith('http://') ||
    src.startsWith('data:') ||
    src.startsWith('//') ||
    src.endsWith('.svg') ||
    src.endsWith('.mp4') ||
    src.endsWith('.webm') ||
    src.endsWith('.gif')
  );
}

/** Resolve a logical path (`/projects/...`) to ImageMetadata, if local. */
export function resolveLocalImage(src: string | undefined | null): ImageMetadata | undefined {
  if (!src || isRemoteOrPassthrough(src)) return undefined;
  const normalized = src.startsWith('/') ? src : `/${src}`;
  return byPath.get(normalized);
}

export type ImgPreset = 'card' | 'hero' | 'gallery' | 'deck' | 'avatar' | 'full' | 'icon' | 'phone';

export type ImgPresetConfig = {
  widths: number[];
  sizes: string;
  quality: number;
};

/**
 * Display-size aware defaults.
 * Keep width steps lean (3–4) so GH Pages artifact stays reasonable while
 * still covering phone / tablet / desktop / retina.
 */
export const IMG_PRESETS: Record<ImgPreset, ImgPresetConfig> = {
  /** Homepage project cards */
  card: {
    widths: [400, 720, 1080],
    sizes: '(max-width: 640px) 92vw, (max-width: 1100px) 45vw, 540px',
    quality: 72,
  },
  /** Case hero / bento cells */
  hero: {
    widths: [640, 1024, 1600],
    sizes: '(max-width: 900px) 100vw, (max-width: 1400px) 50vw, 720px',
    quality: 75,
  },
  /** Pair / triple / stack galleries */
  gallery: {
    widths: [480, 800, 1200],
    sizes: '(max-width: 700px) 92vw, (max-width: 1100px) 48vw, 640px',
    quality: 75,
  },
  /** Deck slides / presentation */
  deck: {
    widths: [720, 1080, 1440],
    sizes: '(max-width: 1100px) 92vw, 1040px',
    quality: 72,
  },
  /** Quote avatars */
  avatar: {
    widths: [96, 192],
    sizes: '96px',
    quality: 70,
  },
  /** Full-bleed single media */
  full: {
    widths: [800, 1280, 1920],
    sizes: '100vw',
    quality: 75,
  },
  /** App icons / small marks */
  icon: {
    widths: [128, 256],
    sizes: '(max-width: 700px) 28vw, 160px',
    quality: 80,
  },
  /** Phone columns in wireframe decks */
  phone: {
    widths: [320, 480, 720],
    sizes: '(max-width: 700px) 40vw, 280px',
    quality: 75,
  },
};
/**
 * Cap requested widths to the source's native width so we don't upscale
 * or emit empty variants.
 */
export function clampWidths(requested: number[], nativeWidth: number): number[] {
  const capped = requested.filter((w) => w <= nativeWidth);
  if (capped.length === 0) return [nativeWidth];
  if (!capped.includes(nativeWidth) && nativeWidth < Math.max(...requested)) {
    capped.push(nativeWidth);
  }
  return [...new Set(capped)].sort((a, b) => a - b);
}
