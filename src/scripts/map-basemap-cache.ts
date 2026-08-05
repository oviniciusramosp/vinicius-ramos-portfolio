/**
 * Basemap cache helpers for travel maps (OpenFreeMap + MapLibre).
 *
 * 1. In-memory style JSON — survives ClientRouter remounts in the same tab
 * 2. Service worker registration — durable Cache API across hard reloads
 */

export const OPENFREEMAP_ORIGIN = 'https://tiles.openfreemap.org';

export const VECTOR_STYLE_URLS = {
  dark: `${OPENFREEMAP_ORIGIN}/styles/dark`,
  light: `${OPENFREEMAP_ORIGIN}/styles/bright`,
} as const;

export type BasemapStyleTheme = keyof typeof VECTOR_STYLE_URLS;

/** Parsed style specs keyed by absolute style URL */
const styleSync = new Map<string, object>();
const stylePromises = new Map<string, Promise<object>>();

let swRegisterPromise: Promise<ServiceWorkerRegistration | null> | null = null;

/**
 * Synchronous hit for MapLibre constructor / setStyle.
 * Returns a deep clone so MapLibre can mutate without poisoning the cache.
 */
export function getStyleForMap(url: string): string | object {
  const cached = styleSync.get(url);
  if (!cached) return url;
  try {
    return structuredClone(cached);
  } catch {
    // structuredClone can fail on exotic values — fall back to URL fetch
    return url;
  }
}

/** Ensure style JSON is in memory (and browser/SW HTTP cache). */
export function ensureStyleCached(url: string): Promise<object> {
  const hit = styleSync.get(url);
  if (hit) return Promise.resolve(hit);

  let pending = stylePromises.get(url);
  if (pending) return pending;

  pending = fetch(url, { mode: 'cors', credentials: 'omit' })
    .then((res) => {
      if (!res.ok) {
        throw new Error(`[map-basemap-cache] style ${res.status}: ${url}`);
      }
      return res.json() as Promise<object>;
    })
    .then((json) => {
      styleSync.set(url, json);
      return json;
    })
    .catch((err) => {
      stylePromises.delete(url);
      throw err;
    });

  stylePromises.set(url, pending);
  return pending;
}

/** Prefetch both themes (toggle + SPA remount). Safe to call multiple times. */
export function warmBasemapStyles(preferred?: BasemapStyleTheme): void {
  if (typeof window === 'undefined') return;
  const first = preferred ?? 'dark';
  const second: BasemapStyleTheme = first === 'dark' ? 'light' : 'dark';
  void ensureStyleCached(VECTOR_STYLE_URLS[first]).catch(() => {});
  void ensureStyleCached(VECTOR_STYLE_URLS[second]).catch(() => {});
}

/**
 * Register OpenFreeMap SW once (production only — avoids dev-cache pain).
 * Scope is `/` but fetch handler only touches tiles.openfreemap.org.
 */
export function registerMapServiceWorker(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;
  // Skip local/dev — SW + Vite HMR is a footgun
  if (import.meta.env.DEV) return;
  if (swRegisterPromise) return;

  swRegisterPromise = navigator.serviceWorker
    .register('/sw-map.js', { scope: '/', updateViaCache: 'none' })
    .then((reg) => {
      // Check for updates when user returns to the tab (long sessions)
      const onVisible = () => {
        if (document.visibilityState === 'visible') {
          void reg.update().catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', onVisible);
      return reg;
    })
    .catch((err) => {
      console.warn('[map-basemap-cache] SW register failed', err);
      swRegisterPromise = null;
      return null;
    });
}

/** Call from travel map boot: SW + style warm. */
export function initBasemapCaching(preferred?: BasemapStyleTheme): void {
  registerMapServiceWorker();
  warmBasemapStyles(preferred);
}
