import { getImage } from 'astro:assets';
import { resolveLocalImage } from './local-images';

/**
 * Build-time URL for places that need a string path (OG tags, CSS
 * background-image, client data-* attrs for Three.js, etc.).
 * Local rasters are re-encoded; remote/SVG/passthrough returned as-is.
 */
export async function optimizedUrl(
  src: string | undefined | null,
  opts: { width?: number; quality?: number; format?: 'webp' | 'avif' | 'jpg' | 'png' } = {},
): Promise<string | undefined> {
  if (!src) return undefined;
  const meta = resolveLocalImage(src);
  if (!meta) return src;

  const width = Math.min(opts.width ?? 1280, meta.width);
  const image = await getImage({
    src: meta,
    width,
    format: opts.format ?? 'webp',
    quality: opts.quality ?? 75,
  });
  return image.src;
}
