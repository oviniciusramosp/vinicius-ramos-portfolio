/**
 * Travel light/dark theme toggle.
 * Preference is scoped to /travel and stored in localStorage.
 * Non-travel pages always clear data-theme so the rest of the portfolio stays dark.
 */

export type TravelTheme = 'dark' | 'light';

export const TRAVEL_THEME_KEY = 'travel-theme';
export const TRAVEL_THEME_EVENT = 'travel:theme';

const THEME_COLOR_DARK = '#000000';
const THEME_COLOR_LIGHT = '#f4f5f7';

function isTravelPath(pathname = window.location.pathname): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  return p === '/travel' || p.startsWith('/travel/');
}

export function readStoredTravelTheme(): TravelTheme {
  try {
    const v = localStorage.getItem(TRAVEL_THEME_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    /* private mode */
  }
  return 'dark';
}

export function getTravelTheme(): TravelTheme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 'light'
    : 'dark';
}

function syncMeta(theme: TravelTheme) {
  const scheme = document.querySelector('meta[name="color-scheme"]');
  if (scheme) {
    scheme.setAttribute('content', theme === 'light' ? 'light' : 'dark');
  }
  const color = document.querySelector('meta[name="theme-color"]');
  if (color) {
    color.setAttribute(
      'content',
      theme === 'light' ? THEME_COLOR_LIGHT : THEME_COLOR_DARK,
    );
  }
  const root = document.documentElement;
  root.style.colorScheme = theme === 'light' ? 'light' : 'dark';
  // Keep html bg in sync so FOUC inline style does not fight CSS after boot
  root.style.backgroundColor =
    theme === 'light' ? THEME_COLOR_LIGHT : THEME_COLOR_DARK;
}

function syncToggleUi(theme: TravelTheme) {
  document.querySelectorAll<HTMLButtonElement>('[data-travel-theme-toggle]').forEach(
    (btn) => {
      const isLight = theme === 'light';
      btn.setAttribute('aria-pressed', isLight ? 'true' : 'false');
      const en = isLight
        ? btn.dataset.themeDarkEn || 'Switch to dark mode'
        : btn.dataset.themeLightEn || 'Switch to light mode';
      const pt = isLight
        ? btn.dataset.themeDarkPt || 'Mudar para modo escuro'
        : btn.dataset.themeLightPt || 'Mudar para modo claro';
      const lang = document.documentElement.lang?.toLowerCase().startsWith('pt')
        ? 'pt'
        : 'en';
      const label = lang === 'pt' ? pt : en;
      btn.setAttribute('aria-label', label);
      btn.title = label;
      btn.setAttribute('data-i18n-en', en);
      btn.setAttribute('data-i18n-pt', pt);
      btn.setAttribute('data-i18n-as', 'aria-label');
    },
  );
}

/**
 * Apply theme on documentElement and notify listeners (map basemap).
 * On non-travel routes, always force dark (clear attribute).
 */
export function applyTravelTheme(
  theme: TravelTheme,
  opts: { persist?: boolean; onTravelOnly?: boolean } = {},
) {
  const { persist = true, onTravelOnly = true } = opts;
  const onTravel = isTravelPath();

  if (onTravelOnly && !onTravel) {
    document.documentElement.removeAttribute('data-theme');
    syncMeta('dark');
    return;
  }

  if (theme === 'light' && onTravel) {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
    theme = 'dark';
  }

  if (persist && onTravel) {
    try {
      localStorage.setItem(TRAVEL_THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }

  syncMeta(theme);
  syncToggleUi(theme);

  window.dispatchEvent(
    new CustomEvent(TRAVEL_THEME_EVENT, { detail: { theme } }),
  );
}

export function toggleTravelTheme(): TravelTheme {
  const next: TravelTheme = getTravelTheme() === 'light' ? 'dark' : 'light';
  applyTravelTheme(next);
  return next;
}

function syncTravelNavPrefsVisibility(): void {
  const onTravel = isTravelPath();
  document
    .querySelectorAll<HTMLElement>('[data-travel-nav-prefs]')
    .forEach((el) => {
      el.hidden = !onTravel;
      el.setAttribute('aria-hidden', onTravel ? 'false' : 'true');
    });
}

/** Boot toggle buttons + restore preference on travel pages. */
export function bootTravelTheme() {
  syncTravelNavPrefsVisibility();

  // Always re-evaluate route (ClientRouter navigations)
  if (isTravelPath()) {
    applyTravelTheme(readStoredTravelTheme(), { persist: false });
  } else {
    applyTravelTheme('dark', { persist: false, onTravelOnly: false });
    document.documentElement.removeAttribute('data-theme');
    syncMeta('dark');
  }

  document.querySelectorAll<HTMLButtonElement>('[data-travel-theme-toggle]').forEach(
    (btn) => {
      if (btn.dataset.themeBound === '1') return;
      btn.dataset.themeBound = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isTravelPath()) return;
        toggleTravelTheme();
      });
    },
  );

  syncToggleUi(getTravelTheme());
}
