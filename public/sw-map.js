/**
 * Service worker: Cache API for OpenFreeMap basemap assets.
 * Intercepts only https://tiles.openfreemap.org/* — all other requests pass through.
 *
 * Strategy: cache-first for styles/glyphs/sprites/tiles, background revalidate.
 * Caps entry count so city panning does not fill disk unbounded.
 */
/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'openfreemap-v1';
const TILE_ORIGIN = 'https://tiles.openfreemap.org';
/** Soft cap — style + glyphs + sprites + viewport tiles across sessions */
const MAX_ENTRIES = 480;

/** Precache both themes so first paint after SW install is warm. */
const PRECACHE = [
  `${TILE_ORIGIN}/styles/dark`,
  `${TILE_ORIGIN}/styles/bright`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const res = await fetch(url, {
              mode: 'cors',
              credentials: 'omit',
              cache: 'reload',
            });
            if (res.ok) await cache.put(url, res);
          } catch {
            /* offline / blocked — runtime path will fill later */
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('openfreemap-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

/**
 * @param {Cache} cache
 */
async function trimCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_ENTRIES) return;
  const drop = keys.length - MAX_ENTRIES;
  // keys() is insertion order in Chromium/WebKit — oldest first
  await Promise.all(keys.slice(0, drop).map((req) => cache.delete(req)));
}

/**
 * @param {Request} request
 * @param {Response} response
 * @param {Cache} cache
 */
async function putAndTrim(request, response, cache) {
  try {
    await cache.put(request, response);
    await trimCache(cache);
  } catch {
    /* QuotaExceeded or opaque — ignore */
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  if (url.origin !== TILE_ORIGIN) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);

      const networkPromise = fetch(req, {
        mode: 'cors',
        credentials: 'omit',
      })
        .then((res) => {
          if (res.ok) {
            void putAndTrim(req, res.clone(), cache);
          }
          return res;
        })
        .catch(() => null);

      // Cache-first: paint immediately when warm; still revalidate in background
      if (cached) {
        void networkPromise;
        return cached;
      }

      const network = await networkPromise;
      if (network) return network;

      // Last resort: no cache and network failed
      return new Response('Map tile unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    })(),
  );
});
