/**
 * Client-side live opening hours for place cards (when data-osm-ref is set).
 * Uses Overpass / OSM — no backend required (static deploy).
 */

const PARIS_TZ = 'Europe/Paris';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

function parisNow(): { day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: PARIS_TZ,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date());

  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 12);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);

  const dayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 0,
  };

  return { day: dayMap[weekday] ?? 1, hour, minute };
}

/** Minimal opening_hours evaluator for common OSM patterns. */
function isOpenFromOsmHours(
  oh: string,
  day: number,
  hour: number,
  minute: number,
): boolean | null {
  if (!oh || oh === 'unknown') return null;
  if (oh.includes('24/7')) return true;

  const nowMins = hour * 60 + minute;
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const today = dayNames[day];

  const rules = oh
    .split(';')
    .map((r) => r.trim())
    .filter(Boolean);

  let open: boolean | null = null;

  for (const rule of rules) {
    if (/\boff\b/i.test(rule) && rule.includes(today)) {
      return false;
    }

    const m = rule.match(
      /^(?:(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?|PH)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/i,
    );
    if (!m) continue;

    const d1 = m[1];
    const d2 = m[2];
    const t1 = m[3];
    const t2 = m[4];
    if (!d1 || !t1 || !t2) continue;

    const idx = (d: string) => dayNames.indexOf(d);
    let inDay = false;
    if (d2) {
      const a = idx(d1);
      const b = idx(d2);
      if (a <= b) inDay = day >= a && day <= b;
      else inDay = day >= a || day <= b;
    } else {
      inDay = d1 === today;
    }
    if (!inDay) continue;

    const [h1, m1] = t1.split(':').map(Number);
    const [h2, m2] = t2.split(':').map(Number);
    const start = h1 * 60 + m1;
    let end = h2 * 60 + m2;
    if (end <= start) end += 24 * 60;
    let cur = nowMins;
    if (end > 24 * 60 && cur < start) cur += 24 * 60;
    open = cur >= start && cur < end;
  }

  return open;
}

async function fetchOsmOpeningHours(osmRef: string): Promise<string | null> {
  const m = osmRef.match(/^(node|way|relation)\/(\d+)$/i);
  if (!m) return null;
  const type = m[1].toLowerCase();
  const id = m[2];

  const query = `[out:json][timeout:15];${type}(${id});out tags;`;
  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      elements?: { tags?: Record<string, string> }[];
    };
    const tags = data.elements?.[0]?.tags;
    return tags?.opening_hours ?? null;
  } catch {
    return null;
  }
}

function applyHoursUi(
  card: HTMLElement,
  hours: string | null,
  open: boolean | null,
): void {
  const el = card.querySelector<HTMLElement>('[data-live-hours]');
  if (!el) return;

  const locale =
    document.documentElement.dataset.travelLocale === 'pt-BR' ? 'pt-BR' : 'en';

  if (open === true) {
    const en = el.getAttribute('data-open-en') || 'Open now';
    const pt = el.getAttribute('data-open-pt') || 'Aberto agora';
    el.textContent = locale === 'pt-BR' ? pt : en;
    el.setAttribute('data-i18n-en', en);
    el.setAttribute('data-i18n-pt', pt);
    el.classList.add('is-open');
    el.classList.remove('is-closed');
    el.hidden = false;
  } else if (open === false) {
    const en = el.getAttribute('data-closed-en') || 'Closed now';
    const pt = el.getAttribute('data-closed-pt') || 'Fechado agora';
    el.textContent = locale === 'pt-BR' ? pt : en;
    el.setAttribute('data-i18n-en', en);
    el.setAttribute('data-i18n-pt', pt);
    el.classList.add('is-closed');
    el.classList.remove('is-open');
    el.hidden = false;
  } else if (hours) {
    el.textContent = hours;
    el.setAttribute('data-i18n-en', hours);
    el.setAttribute('data-i18n-pt', hours);
    el.hidden = false;
  }

  if (hours) el.title = hours;

  const row = card.querySelector<HTMLElement>('[data-live-row]');
  if (row && !el.hidden) row.hidden = false;
}

function enhanceCard(card: HTMLElement): void {
  if (card.dataset.liveBound === '1') return;
  card.dataset.liveBound = '1';

  const osmRef = card.getAttribute('data-osm-ref');
  if (!osmRef) return;

  const run = () => {
    void fetchOsmOpeningHours(osmRef).then((hours) => {
      if (!hours) return;
      const { day, hour, minute } = parisNow();
      const open = isOpenFromOsmHours(hours, day, hour, minute);
      applyHoursUi(card, hours, open);
    });
  };

  if ('requestIdleCallback' in window) {
    (
      window as Window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void;
      }
    ).requestIdleCallback(run, { timeout: 2500 });
  } else {
    setTimeout(run, 400);
  }
}

export function bootTravelLive(): void {
  document
    .querySelectorAll<HTMLElement>('.travel-place-card[data-osm-ref]')
    .forEach(enhanceCard);

  const panelBody = document.querySelector('[data-travel-map-panel-body]');
  if (panelBody) {
    const mo = new MutationObserver(() => {
      panelBody
        .querySelectorAll<HTMLElement>('.travel-place-card')
        .forEach(enhanceCard);
    });
    mo.observe(panelBody, { childList: true });
  }
}
