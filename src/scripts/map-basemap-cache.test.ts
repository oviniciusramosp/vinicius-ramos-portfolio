import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureStyleCached, getStyleForMap } from './map-basemap-cache';

describe('map-basemap-cache', () => {
  const style = {
    version: 8,
    sources: {},
    layers: [
      {
        id: 'bg',
        type: 'background',
        paint: { 'background-color': '#000' },
      },
    ],
  };

  /** Unique per test so module-level maps never collide across cases */
  const styleUrl = () =>
    `https://tiles.openfreemap.org/styles/test-${Math.random().toString(36).slice(2)}`;

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(style), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns URL until style is cached', () => {
    const url = styleUrl();
    expect(getStyleForMap(url)).toBe(url);
  });

  it('caches style JSON and returns a clone for MapLibre', async () => {
    const url = styleUrl();
    const a = await ensureStyleCached(url);
    expect(a).toMatchObject({ version: 8 });
    expect(fetch).toHaveBeenCalledTimes(1);

    const forMap = getStyleForMap(url);
    expect(forMap).not.toBe(url);
    expect(forMap).toEqual(style);
    // Mutating MapLibre’s copy must not poison the cache
    if (typeof forMap === 'object' && forMap && 'version' in forMap) {
      (forMap as { version: number }).version = 99;
    }
    const again = getStyleForMap(url);
    expect(again).toMatchObject({ version: 8 });
    // Still one network call — clone comes from memory
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('dedupes in-flight fetches for the same URL', async () => {
    const url = styleUrl();
    const p1 = ensureStyleCached(url);
    const p2 = ensureStyleCached(url);
    await Promise.all([p1, p2]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
