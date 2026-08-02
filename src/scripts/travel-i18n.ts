/**
 * Client locale for /travel: browser language → en | pt-BR.
 * Applies bilingual strings stored in data-i18n-en / data-i18n-pt attributes.
 */

import type { Locale } from '../data/travel';

const STORAGE_KEY = 'travel-locale';

export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === 'en' || stored === 'pt-BR') return stored;
  } catch {
    /* private mode */
  }

  const list =
    navigator.languages?.length > 0
      ? navigator.languages
      : [navigator.language || 'en'];

  for (const lang of list) {
    if (lang.toLowerCase().startsWith('pt')) return 'pt-BR';
  }
  return 'en';
}

export function applyTravelLocale(root: ParentNode = document, locale?: Locale): Locale {
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

    el.textContent = text;
  });

  document.documentElement.lang = loc === 'pt-BR' ? 'pt-BR' : 'en';
  document.documentElement.dataset.travelLocale = loc;

  try {
    sessionStorage.setItem(STORAGE_KEY, loc);
  } catch {
    /* ignore */
  }

  return loc;
}

export function bootTravelI18n(): void {
  applyTravelLocale();
}
