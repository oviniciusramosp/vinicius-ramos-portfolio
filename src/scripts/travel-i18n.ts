/**
 * Client locale for /travel: stored preference → browser language → en.
 * Applies bilingual strings stored in data-i18n-en / data-i18n-pt attributes.
 * Preference persists across sessions (localStorage).
 */

import type { Locale } from '../data/travel';

export const TRAVEL_LOCALE_KEY = 'travel-locale';
export const TRAVEL_LOCALE_EVENT = 'travel:locale';

function isTravelPath(pathname = window.location.pathname): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  return p === '/travel' || p.startsWith('/travel/');
}

export function readStoredTravelLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(TRAVEL_LOCALE_KEY);
    if (stored === 'en' || stored === 'pt-BR') return stored;
  } catch {
    /* private mode */
  }
  return null;
}

export function detectLocale(): Locale {
  const stored = readStoredTravelLocale();
  if (stored) return stored;

  if (typeof navigator === 'undefined') return 'en';

  const list =
    navigator.languages?.length > 0
      ? navigator.languages
      : [navigator.language || 'en'];

  for (const lang of list) {
    if (lang.toLowerCase().startsWith('pt')) return 'pt-BR';
  }
  return 'en';
}

export function getTravelLocale(): Locale {
  if (typeof document === 'undefined') return 'en';
  return document.documentElement.dataset.travelLocale === 'pt-BR'
    ? 'pt-BR'
    : 'en';
}

function syncLangToggleUi(locale: Locale): void {
  document
    .querySelectorAll<HTMLButtonElement>('[data-travel-lang]')
    .forEach((btn) => {
      const value = btn.dataset.travelLang ?? '';
      const active = value === locale;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
}

export function applyTravelLocale(
  root: ParentNode = document,
  locale?: Locale,
): Locale {
  const loc = locale ?? detectLocale();
  const attr = loc === 'pt-BR' ? 'data-i18n-pt' : 'data-i18n-en';

  root.querySelectorAll<HTMLElement>('[data-i18n-en]').forEach((el) => {
    const text = el.getAttribute(attr) ?? el.getAttribute('data-i18n-en');
    if (text == null) return;

    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      if (el.hasAttribute('placeholder') || el.dataset.i18nAs === 'placeholder') {
        el.placeholder = text;
      } else {
        el.value = text;
      }
      return;
    }

    if (el.dataset.i18nAs === 'aria-label') {
      el.setAttribute('aria-label', text);
      // Keep native tooltip in sync for icon-only controls
      if (el.hasAttribute('title')) el.setAttribute('title', text);
      return;
    }

    if (el.dataset.i18nAs === 'alt' && el instanceof HTMLImageElement) {
      el.alt = text;
      return;
    }

    if (el.dataset.i18nAs === 'title') {
      el.setAttribute('title', text);
      return;
    }

    // Homepage-style Tag chip: update only the label node
    if (el.dataset.i18nAs === 'tag-label') {
      const label = el.querySelector<HTMLElement>('.tag__label');
      if (label) label.textContent = text;
      return;
    }

    // Tips (and any multi-line i18n) store newlines as the two-char sequence "\n"
    // in data attributes so HTML attr normalization does not collapse them.
    el.textContent = text.replace(/\\n/g, '\n');
  });

  document.documentElement.lang = loc === 'pt-BR' ? 'pt-BR' : 'en';
  document.documentElement.dataset.travelLocale = loc;

  try {
    localStorage.setItem(TRAVEL_LOCALE_KEY, loc);
  } catch {
    /* ignore */
  }

  syncLangToggleUi(loc);

  window.dispatchEvent(
    new CustomEvent(TRAVEL_LOCALE_EVENT, { detail: { locale: loc } }),
  );

  return loc;
}

export function setTravelLocale(locale: Locale): Locale {
  return applyTravelLocale(document, locale);
}

function bindLangToggles(): void {
  document
    .querySelectorAll<HTMLButtonElement>('[data-travel-lang]')
    .forEach((btn) => {
      if (btn.dataset.langBound === '1') return;
      btn.dataset.langBound = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isTravelPath()) return;
        const next = btn.dataset.travelLang as Locale | undefined;
        if (next !== 'en' && next !== 'pt-BR') return;
        if (next === getTravelLocale()) return;
        setTravelLocale(next);
      });
    });
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

/** Boot locale + language selectors; only active on /travel routes. */
export function bootTravelI18n(): void {
  syncTravelNavPrefsVisibility();
  bindLangToggles();

  if (!isTravelPath()) {
    // Leave portfolio html lang alone when leaving travel
    if (document.documentElement.dataset.travelLocale) {
      delete document.documentElement.dataset.travelLocale;
      document.documentElement.lang = 'en-US';
    }
    return;
  }

  applyTravelLocale();
}
