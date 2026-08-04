#!/usr/bin/env node
/**
 * Sync travel places: Notion DB "Lugares" ↔ site snapshot.
 *
 *   npm run travel:notion:pull
 *   npm run travel:notion:schema
 *   npm run travel:notion:migrate   # emoji City/Category + Place unify + place IDs
 *   npm run travel:notion:seed [dump.json]
 *   npm run travel:notion:placeids  # resolve + write Google Place IDs
 *
 * Env (.env):
 *   NOTION_TOKEN
 *   NOTION_DATABASE_ID
 *   GOOGLE_MAPS_API_KEY   (optional but required to bulk-fill Place IDs)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outJsonPath = resolve(root, 'src/data/travel-notion.json');
const outTsPath = resolve(root, 'src/data/travel-notion.generated.ts');
const placeIdCachePath = resolve(root, 'src/data/travel-google-place-ids.json');
const NOTION_VERSION = '2022-06-28';

// —— env ——
function loadEnv() {
  const envPath = resolve(root, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnv();

const TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = (
  process.env.NOTION_DATABASE_ID || '3812da8d81348023afe1ef676eb515f7'
).replace(/-/g, '');
const GOOGLE_KEY =
  process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY || '';

if (!TOKEN) {
  console.error('Missing NOTION_TOKEN. Copy .env.example → .env and fill in.');
  process.exit(1);
}

// —— Display labels (Notion UI) ↔ site slugs ——
/** Site city slug → Notion select label (emoji first). */
const CITY_META = {
  'sao-paulo': { label: '🇧🇷 São Paulo', color: 'red' },
  florianopolis: { label: '🇧🇷 Florianópolis', color: 'blue' },
  'new-york': { label: '🇺🇸 New York', color: 'purple' },
  miami: { label: '🇺🇸 Miami', color: 'orange' },
  paris: { label: '🇫🇷 Paris', color: 'pink' },
  roma: { label: '🇮🇹 Roma', color: 'yellow' },
  lisboa: { label: '🇵🇹 Lisboa', color: 'green' },
  porto: { label: '🇵🇹 Porto', color: 'brown' },
};

/** Site category → Notion select label (emoji first). */
const CATEGORY_META = {
  airport: { label: '✈️ Airport', color: 'gray' },
  transport: { label: '🚆 Transport', color: 'gray' },
  parks: { label: '🌳 Parks', color: 'green' },
  cafes: { label: '☕️ Cafés', color: 'brown' },
  restaurants: { label: '🍽️ Restaurants', color: 'orange' },
  commons: { label: '🍔 Chains', color: 'orange' },
  markets: { label: '🧺 Markets', color: 'blue' },
  shopping: { label: '🛍️ Shopping', color: 'pink' },
  photo: { label: '📷 Photo', color: 'blue' },
  tourist: { label: '⭐ Tourist', color: 'yellow' },
  lodging: { label: '🛏️ Stay', color: 'purple' },
};

const LANDMARK_OPTIONS = [
  'eiffel',
  'arc',
  'notre-dame',
  'sacre-coeur',
  'louvre',
  'opera',
  'pompidou',
  'montparnasse',
  'monument',
];

const CITY_BY_LABEL = Object.fromEntries(
  Object.entries(CITY_META).map(([slug, m]) => [m.label, slug]),
);
const CATEGORY_BY_LABEL = Object.fromEntries(
  Object.entries(CATEGORY_META).map(([slug, m]) => [m.label, slug]),
);

/** Legacy plain values still accepted on pull/migrate. */
const CITY_ALIASES = {
  ...CITY_BY_LABEL,
  'sao-paulo': 'sao-paulo',
  florianopolis: 'florianopolis',
  'new-york': 'new-york',
  miami: 'miami',
  paris: 'paris',
  roma: 'roma',
  lisboa: 'lisboa',
  porto: 'porto',
  // common free-text
  'São Paulo': 'sao-paulo',
  Paris: 'paris',
  Roma: 'roma',
  Rome: 'roma',
};

const CATEGORY_ALIASES = {
  ...CATEGORY_BY_LABEL,
  ...Object.fromEntries(Object.keys(CATEGORY_META).map((k) => [k, k])),
  // old Carol tags
  '🏠 Airbnb': 'lodging',
  '🍽️ Restaurante': 'restaurants',
  '✈️ Aeroporto': 'airport',
  '🏞️ Passeio': 'tourist',
  '🪩 Evento': 'tourist',
  '☕️ Café': 'cafes',
  '🛍️ Compras': 'shopping',
  Sobremesas: 'cafes',
};

function cityLabel(slug) {
  return CITY_META[slug]?.label || slug;
}

function categoryLabel(slug) {
  return CATEGORY_META[slug]?.label || slug;
}

function normalizeCity(raw) {
  if (!raw) return null;
  if (CITY_ALIASES[raw]) return CITY_ALIASES[raw];
  // strip emoji / case
  const stripped = raw
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\s]+/u, '')
    .trim()
    .toLowerCase();
  for (const [slug, meta] of Object.entries(CITY_META)) {
    if (
      meta.label.toLowerCase().includes(stripped) ||
      slug === stripped ||
      slug.replace('-', ' ') === stripped
    ) {
      return slug;
    }
  }
  return null;
}

function normalizeCategory(raw) {
  if (!raw) return 'tourist';
  if (CATEGORY_ALIASES[raw]) return CATEGORY_ALIASES[raw];
  const stripped = raw
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\s]+/u, '')
    .trim()
    .toLowerCase();
  for (const [slug, meta] of Object.entries(CATEGORY_META)) {
    const labelCore = meta.label
      .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\s]+/u, '')
      .trim()
      .toLowerCase();
    if (slug === stripped || labelCore === stripped || labelCore.startsWith(stripped)) {
      return slug;
    }
  }
  return 'tourist';
}

// —— Notion helpers ——
async function notion(method, path, body) {
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.message || JSON.stringify(json).slice(0, 400);
    if (res.status === 429) {
      const wait = Number(res.headers.get('retry-after') || 1) * 1000;
      await sleep(wait + 200);
      return notion(method, path, body);
    }
    throw new Error(`Notion ${method} ${path} → ${res.status}: ${msg}`);
  }
  return json;
}

function rt(content) {
  if (content == null || content === '') return [];
  const text = String(content);
  return [{ type: 'text', text: { content: text.slice(0, 2000) } }];
}
function title(content) {
  return { title: rt(content) };
}
function rich(content) {
  return { rich_text: rt(content) };
}
function richText(prop) {
  if (!prop?.rich_text?.length) return '';
  return prop.rich_text.map((t) => t.plain_text ?? '').join('').trim();
}
function titleText(prop) {
  if (!prop?.title?.length) return '';
  return prop.title.map((t) => t.plain_text ?? '').join('').trim();
}
function selectName(prop) {
  return prop?.select?.name ?? null;
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadPlaceIdCache() {
  if (!existsSync(placeIdCachePath)) return {};
  try {
    return JSON.parse(readFileSync(placeIdCachePath, 'utf8'));
  } catch {
    return {};
  }
}

function savePlaceIdCache(cache) {
  writeFileSync(
    placeIdCachePath,
    `${JSON.stringify(cache, null, 2)}\n`,
    'utf8',
  );
}

/** Extract Google Place ID from Maps URLs / strings. */
function extractPlaceId(...candidates) {
  for (const raw of candidates) {
    if (!raw || typeof raw !== 'string') continue;
    // query_place_id=ChIJ...
    let m = raw.match(/[?&]query_place_id=([^&]+)/i);
    if (m) return decodeURIComponent(m[1]);
    // !1sChIJ... or placeid=
    m = raw.match(/(?:place_id|placeid|query_place_id)[=:][\s"]*(ChIJ[\w-]+)/i);
    if (m) return m[1];
    // bare ChIJ…
    m = raw.match(/\b(ChIJ[A-Za-z0-9_-]{20,})\b/);
    if (m) return m[1];
  }
  return null;
}

// —— schema ——
async function ensureSchema() {
  // Only *add* emoji labels. Do not re-send legacy plain slugs with new colors
  // (Notion 400: "Cannot update color of select with name: …").
  const cityOpts = Object.values(CITY_META).map((m) => ({
    name: m.label,
    color: m.color,
  }));
  const catOpts = Object.values(CATEGORY_META).map((m) => ({
    name: m.label,
    color: m.color,
  }));
  const landmarkOpts = LANDMARK_OPTIONS.map((name, i) => ({
    name,
    color: [
      'yellow',
      'gray',
      'brown',
      'pink',
      'blue',
      'purple',
      'orange',
      'default',
      'green',
    ][i % 9],
  }));

  // Fetch current options so we preserve colors on already-existing names
  const current = await notion('GET', `/databases/${DATABASE_ID}`);
  const curCity = current.properties?.City?.select?.options ?? [];
  const curCat = current.properties?.Category?.select?.options ?? [];
  const curLandmark = current.properties?.Landmark?.select?.options ?? [];

  const mergeOptions = (existing, wanted) => {
    const byName = new Map(existing.map((o) => [o.name, o]));
    for (const w of wanted) {
      if (!byName.has(w.name)) byName.set(w.name, w);
    }
    // Keep existing entries as-is (name + color); only append new wanted ones
    return [...byName.values()].map((o) => ({
      name: o.name,
      color: o.color || 'default',
    }));
  };

  const updated = await notion('PATCH', `/databases/${DATABASE_ID}`, {
    properties: {
      Slug: { rich_text: {} },
      City: { select: { options: mergeOptions(curCity, cityOpts) } },
      Category: { select: { options: mergeOptions(curCat, catOpts) } },
      'Name EN': { rich_text: {} },
      Description: { rich_text: {} },
      'Description EN': { rich_text: {} },
      Rating: { number: { format: 'number' } },
      'Google Rating': { number: { format: 'number' } },
      Favorite: { checkbox: {} },
      Featured: { checkbox: {} },
      'Cover URL': { url: {} },
      'Maps URL': { url: {} },
      'Maps Query': { rich_text: {} },
      // Address = searchable mirror of Place.address (auto-filled on migrate)
      Address: { rich_text: {} },
      'Google Place ID': { rich_text: {} },
      Lat: { number: { format: 'number' } },
      Lng: { number: { format: 'number' } },
      Landmark: {
        select: { options: mergeOptions(curLandmark, landmarkOpts) },
      },
      Subcategories: { multi_select: {} },
      Published: { checkbox: {} },
    },
  });
  console.log(
    'Schema OK. Properties:',
    Object.keys(updated.properties).sort().join(', '),
  );
  const cities = updated.properties.City?.select?.options?.map((o) => o.name);
  const cats = updated.properties.Category?.select?.options?.map((o) => o.name);
  console.log('  City options:', cities?.join(', '));
  console.log('  Category options:', cats?.join(', '));
}

// —— pull ——
async function queryAllPages() {
  const results = [];
  let cursor;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const page = await notion(
      'POST',
      `/databases/${DATABASE_ID}/query`,
      body,
    );
    results.push(...page.results);
    cursor = page.has_more ? page.next_cursor : null;
    if (cursor) await sleep(350);
  } while (cursor);
  return results;
}

/**
 * Map a Notion page → portable place record.
 * City/Category normalized to site slugs (emoji labels stripped).
 * Coords: Lat/Lng numbers → Place native.
 * Address: Address text → Place.address.
 * Place ID: Google Place ID text → Place.google_place_id → URL extract.
 */
function mapPage(page) {
  const p = page.properties;
  if (p.Published?.checkbox === false) return null;

  const namePt = titleText(p.Nome) || richText(p['Name EN']);
  const nameEn = richText(p['Name EN']) || namePt;
  if (!namePt && !nameEn) return null;

  const place = p.Place?.place ?? null;
  const latNum = p.Lat?.number;
  const lngNum = p.Lng?.number;
  const lat =
    typeof latNum === 'number'
      ? latNum
      : typeof place?.lat === 'number'
        ? place.lat
        : null;
  const lng =
    typeof lngNum === 'number'
      ? lngNum
      : typeof place?.lon === 'number'
        ? place.lon
        : null;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    console.warn(`  skip (no coords): ${namePt || nameEn}`);
    return null;
  }

  let slug = richText(p.Slug);
  if (!slug) {
    slug = `notion-${page.id.replace(/-/g, '').slice(0, 12)}`;
    console.warn(`  warn (missing Slug, using ${slug}): ${namePt || nameEn}`);
  }

  const cityRaw = selectName(p.City);
  const city = normalizeCity(cityRaw);
  if (!city) {
    console.warn(`  skip (no City): ${slug} raw=${cityRaw}`);
    return null;
  }

  // Category: prefer Category select; fall back to first Tag
  let categoryRaw = selectName(p.Category);
  if (!categoryRaw) {
    const tags = p.Tag?.multi_select ?? [];
    if (tags[0]?.name) categoryRaw = tags[0].name;
  }
  const category = normalizeCategory(categoryRaw);

  const descriptionPt = richText(p.Description);
  const descriptionEn = richText(p['Description EN']) || descriptionPt;
  const coverUrl = p['Cover URL']?.url || null;
  const mapsUrl = p['Maps URL']?.url || null;
  const mapsQuery = richText(p['Maps Query']) || null;
  const rating = p.Rating?.number;
  const googleRating = p['Google Rating']?.number;
  const favorite = p.Favorite?.checkbox === true;
  const featured = p.Featured?.checkbox === true;
  const conhecido = p.Conhecido?.checkbox === true;
  const tags = (p.Tag?.multi_select ?? []).map((o) => o.name);
  const subcategories = (p.Subcategories?.multi_select ?? []).map(
    (o) => o.name,
  );
  const landmark = selectName(p.Landmark);
  const date = p.Date?.date?.start ?? null;
  const address =
    richText(p.Address) || place?.address || place?.name || undefined;

  const placeId =
    richText(p['Google Place ID']) ||
    place?.google_place_id ||
    extractPlaceId(mapsUrl, mapsQuery) ||
    undefined;

  return {
    notionPageId: page.id,
    id: slug,
    city,
    name: { en: nameEn, 'pt-BR': namePt },
    category,
    description: {
      en: descriptionEn || nameEn,
      'pt-BR': descriptionPt || namePt,
    },
    lat,
    lng,
    ...(address ? { address } : {}),
    ...(placeId ? { placeId } : {}),
    ...(mapsUrl ? { mapsUrl } : {}),
    ...(mapsQuery ? { mapsQuery } : {}),
    ...(typeof rating === 'number' ? { rating } : {}),
    ...(typeof googleRating === 'number' ? { googleRating } : {}),
    // Always include so unchecking in Notion can clear local defaults
    favorite,
    featured,
    ...(landmark ? { landmark } : {}),
    ...(subcategories.length ? { subcategories } : {}),
    ...(coverUrl
      ? {
          coverUrl,
          photos: [
            {
              url: coverUrl,
              alt: { en: nameEn, 'pt-BR': namePt },
            },
          ],
        }
      : {}),
    tags,
    conhecido,
    date,
    lastEdited: page.last_edited_time,
  };
}

function mapsUrlForPlace(place) {
  if (place.mapsUrl) return place.mapsUrl;
  if (place.placeId) {
    const q = place.mapsQuery || place.address || place.name?.en || place.id;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}&query_place_id=${encodeURIComponent(place.placeId)}`;
  }
  return null;
}

/** Build Notion page properties from a seed/migrate place record (site slugs). */
function placeToNotionProps(place, citySlug) {
  const namePt = place.name?.['pt-BR'] || place.name?.en || place.id;
  const nameEn = place.name?.en || namePt;
  const descPt = place.description?.['pt-BR'] || '';
  const descEn = place.description?.en || descPt;
  const cat = place.category || 'tourist';
  const city = citySlug || place.city;

  const placeId =
    place.placeId ||
    extractPlaceId(place.mapsUrl, place.mapsQuery) ||
    null;
  const address = place.address || null;
  const mapsUrl = mapsUrlForPlace({ ...place, placeId }) || place.mapsUrl || null;

  const props = {
    Nome: title(namePt),
    'Name EN': rich(nameEn),
    Slug: rich(place.id),
    City: { select: { name: cityLabel(city) } },
    Category: { select: { name: categoryLabel(cat) } },
    Description: rich(descPt),
    'Description EN': rich(descEn),
    Lat: { number: place.lat },
    Lng: { number: place.lng },
    Published: { checkbox: place.published !== false },
    Favorite: { checkbox: place.favorite === true },
    Featured: { checkbox: place.featured === true },
    Conhecido: { checkbox: place.conhecido !== false },
  };

  if (address) props.Address = rich(address);
  if (place.mapsQuery) props['Maps Query'] = rich(place.mapsQuery);
  if (mapsUrl) props['Maps URL'] = { url: mapsUrl };
  if (placeId) props['Google Place ID'] = rich(placeId);
  if (place.coverUrl) props['Cover URL'] = { url: place.coverUrl };
  if (typeof place.rating === 'number') props.Rating = { number: place.rating };
  if (typeof place.googleRating === 'number') {
    props['Google Rating'] = { number: place.googleRating };
  }
  if (place.landmark) props.Landmark = { select: { name: place.landmark } };
  if (place.subcategories?.length) {
    props.Subcategories = {
      multi_select: place.subcategories.map((name) => ({ name })),
    };
  }

  // Unify: native Place pin = Address + coords + Google Place ID
  if (typeof place.lat === 'number' && typeof place.lng === 'number') {
    props.Place = {
      place: {
        lat: place.lat,
        lon: place.lng,
        name: address || nameEn,
        address: address || nameEn,
        ...(placeId ? { google_place_id: placeId } : {}),
      },
    };
  }

  // Tag column: mirror Category (emoji) so old views still group nicely
  props.Tag = { multi_select: [{ name: categoryLabel(cat) }] };

  return props;
}

// —— Google Place ID resolution ——
async function googleFindPlaceId({ name, address, lat, lng, mapsQuery }) {
  if (!GOOGLE_KEY) return null;

  // 1) Find Place From Text (best for named venues)
  const input = mapsQuery || (address ? `${name}, ${address}` : name);
  if (input) {
    const url = new URL(
      'https://maps.googleapis.com/maps/api/place/findplacefromtext/json',
    );
    url.searchParams.set('input', input);
    url.searchParams.set('inputtype', 'textquery');
    url.searchParams.set('fields', 'place_id,name,geometry');
    url.searchParams.set('key', GOOGLE_KEY);
    if (typeof lat === 'number' && typeof lng === 'number') {
      url.searchParams.set('locationbias', `point:${lat},${lng}`);
    }
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.candidates?.[0]?.place_id) {
        return data.candidates[0].place_id;
      }
    } catch {
      /* continue */
    }
  }

  // 2) Reverse geocode
  if (typeof lat === 'number' && typeof lng === 'number') {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${lat},${lng}`);
    url.searchParams.set('key', GOOGLE_KEY);
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.results?.[0]?.place_id) {
        return data.results[0].place_id;
      }
    } catch {
      /* continue */
    }
  }

  // 3) Forward geocode address
  if (address || name) {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address || name);
    url.searchParams.set('key', GOOGLE_KEY);
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.results?.[0]?.place_id) {
        return data.results[0].place_id;
      }
    } catch {
      /* continue */
    }
  }

  return null;
}

/**
 * Resolve Google Place IDs for all pages missing them; write Place + column.
 */
async function resolvePlaceIds({ force = false } = {}) {
  const cache = loadPlaceIdCache();
  const pages = await queryAllPages();
  console.log(`Resolving Google Place IDs for ${pages.length} page(s)…`);
  if (!GOOGLE_KEY) {
    console.warn(
      '  ⚠ GOOGLE_MAPS_API_KEY not set — will only use cache, URL extract, and Place.google_place_id.',
    );
    console.warn(
      '  Add GOOGLE_MAPS_API_KEY to .env (Places API + Geocoding enabled) for bulk fill.',
    );
  }

  let filled = 0;
  let skipped = 0;
  let failed = 0;
  let fromCache = 0;
  let fromGoogle = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (page.archived || page.in_trash) continue;
    const mapped = mapPage(page);
    if (!mapped) {
      skipped++;
      continue;
    }

    let placeId = force ? null : mapped.placeId || null;
    if (!placeId && cache[mapped.id]) {
      placeId = cache[mapped.id];
      fromCache++;
    }
    if (!placeId) {
      placeId = await googleFindPlaceId({
        name: mapped.name.en,
        address: mapped.address,
        lat: mapped.lat,
        lng: mapped.lng,
        mapsQuery: mapped.mapsQuery,
      });
      if (placeId) fromGoogle++;
      if (GOOGLE_KEY) await sleep(200); // gentle on quota
    }

    if (!placeId) {
      failed++;
      if ((i + 1) % 20 === 0) {
        console.log(
          `  … ${i + 1}/${pages.length} filled=${filled} failed=${failed}`,
        );
      }
      continue;
    }

    cache[mapped.id] = placeId;

    // Only PATCH if changed
    const existingCol = richText(page.properties['Google Place ID']);
    const existingPlace = page.properties.Place?.place?.google_place_id;
    if (!force && existingCol === placeId && existingPlace === placeId) {
      skipped++;
      continue;
    }

    const props = {
      'Google Place ID': rich(placeId),
      Place: {
        place: {
          lat: mapped.lat,
          lon: mapped.lng,
          name: mapped.address || mapped.name.en,
          address: mapped.address || mapped.name.en,
          google_place_id: placeId,
        },
      },
      // Keep Address in sync with Place
      Address: rich(mapped.address || mapped.name.en),
      'Maps URL': {
        url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapped.mapsQuery || mapped.address || mapped.name.en)}&query_place_id=${encodeURIComponent(placeId)}`,
      },
    };

    try {
      await notion('PATCH', `/pages/${page.id}`, { properties: props });
      filled++;
    } catch (err) {
      failed++;
      console.error(`  ✗ ${mapped.id}: ${err.message}`);
    }

    if ((i + 1) % 10 === 0 || i === pages.length - 1) {
      console.log(
        `  … ${i + 1}/${pages.length} filled=${filled} cache=${fromCache} google=${fromGoogle} failed=${failed}`,
      );
    }
    await sleep(350);
  }

  savePlaceIdCache(cache);
  console.log(
    `Place IDs done: filled=${filled} fromCache=${fromCache} fromGoogle=${fromGoogle} failed=${failed} skipped=${skipped}`,
  );
  console.log(`Cache → ${placeIdCachePath} (${Object.keys(cache).length} ids)`);
}

/**
 * Migrate existing rows: emoji City/Category, Place↔Address unify, Tag mirror.
 * Optionally resolve place IDs (if GOOGLE_MAPS_API_KEY set).
 */
async function migrate() {
  await ensureSchema();
  const pages = await queryAllPages();
  console.log(`Migrating ${pages.length} page(s)…`);

  const cache = loadPlaceIdCache();
  let updated = 0;
  let failed = 0;

  // Count by city for the "only 30" confusion
  const byCity = {};

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (page.archived || page.in_trash) continue;
    const mapped = mapPage(page);
    if (!mapped) {
      console.warn(`  skip unmappable page ${page.id}`);
      continue;
    }
    byCity[mapped.city] = (byCity[mapped.city] || 0) + 1;

    // Prefer cached / resolved place id
    if (!mapped.placeId && cache[mapped.id]) {
      mapped.placeId = cache[mapped.id];
    }
    if (!mapped.placeId && GOOGLE_KEY) {
      const id = await googleFindPlaceId({
        name: mapped.name.en,
        address: mapped.address,
        lat: mapped.lat,
        lng: mapped.lng,
        mapsQuery: mapped.mapsQuery,
      });
      if (id) {
        mapped.placeId = id;
        cache[mapped.id] = id;
      }
      await sleep(150);
    }

    const props = placeToNotionProps(mapped, mapped.city);
    try {
      await notion('PATCH', `/pages/${page.id}`, { properties: props });
      updated++;
    } catch (err) {
      failed++;
      console.error(`  ✗ ${mapped.id}: ${err.message}`);
    }

    if ((i + 1) % 10 === 0 || i === pages.length - 1) {
      console.log(
        `  … ${i + 1}/${pages.length} updated=${updated} failed=${failed}`,
      );
    }
    await sleep(350);
  }

  savePlaceIdCache(cache);
  console.log(`Migrate done: updated=${updated} failed=${failed}`);
  console.log('Counts by city (API — if Notion UI shows less, clear view filters / open full page):');
  console.log(byCity);
}

async function seed(dumpPath) {
  if (!dumpPath || !existsSync(dumpPath)) {
    throw new Error(`Seed dump not found: ${dumpPath || '(missing path)'}`);
  }
  await ensureSchema();

  const dump = JSON.parse(readFileSync(dumpPath, 'utf8'));
  const citySlug = dump.city;
  const places = dump.places || [];
  if (!citySlug || !places.length) {
    throw new Error('Dump must include { city, places: [...] }');
  }

  const cache = loadPlaceIdCache();
  console.log(`Seeding ${places.length} place(s) for city="${citySlug}"…`);

  const existing = await queryAllPages();
  const bySlug = new Map();
  for (const page of existing) {
    if (page.archived || page.in_trash) continue;
    const slug = richText(page.properties?.Slug);
    if (slug) bySlug.set(slug, page.id);
  }
  console.log(`  existing pages with slug: ${bySlug.size}`);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < places.length; i++) {
    const place = { ...places[i], city: citySlug };
    if (!place.placeId && cache[place.id]) place.placeId = cache[place.id];
    if (!place.placeId && GOOGLE_KEY) {
      place.placeId = await googleFindPlaceId({
        name: place.name?.en,
        address: place.address,
        lat: place.lat,
        lng: place.lng,
        mapsQuery: place.mapsQuery,
      });
      if (place.placeId) cache[place.id] = place.placeId;
      await sleep(150);
    }

    const props = placeToNotionProps(place, citySlug);
    const pageId = bySlug.get(place.id);
    try {
      if (pageId) {
        await notion('PATCH', `/pages/${pageId}`, { properties: props });
        updated++;
      } else {
        const page = await notion('POST', '/pages', {
          parent: { database_id: DATABASE_ID },
          properties: props,
        });
        bySlug.set(place.id, page.id);
        created++;
      }
      if ((i + 1) % 10 === 0 || i === places.length - 1) {
        console.log(
          `  … ${i + 1}/${places.length} (created ${created}, updated ${updated}, failed ${failed})`,
        );
      }
    } catch (err) {
      failed++;
      console.error(`  ✗ ${place.id}: ${err.message}`);
    }
    await sleep(350);
  }

  savePlaceIdCache(cache);
  console.log(
    `Seed done: created=${created} updated=${updated} failed=${failed}`,
  );
}

/**
 * Seed Subcategories multi-select from local registry dump:
 *   { "par-eiffel": ["monument", "tower"], ... }
 */
async function seedSubcategories(dumpPath) {
  const path =
    dumpPath || resolve(root, 'src/data/subcategories-seed.json');
  if (!existsSync(path)) {
    throw new Error(`Subcategories dump not found: ${path}`);
  }
  const bySlug = JSON.parse(readFileSync(path, 'utf8'));
  const pages = await queryAllPages();
  console.log(
    `Seeding subcategories for ${Object.keys(bySlug).length} ids across ${pages.length} pages…`,
  );

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (page.archived || page.in_trash) continue;
    const slug = richText(page.properties?.Slug);
    const tags = bySlug[slug];
    if (!tags?.length) {
      skipped++;
      continue;
    }
    try {
      await notion('PATCH', `/pages/${page.id}`, {
        properties: {
          Subcategories: {
            multi_select: tags.map((name) => ({ name })),
          },
        },
      });
      updated++;
    } catch (err) {
      failed++;
      console.error(`  ✗ ${slug}: ${err.message}`);
    }
    if ((i + 1) % 20 === 0 || i === pages.length - 1) {
      console.log(
        `  … ${i + 1}/${pages.length} updated=${updated} skipped=${skipped} failed=${failed}`,
      );
    }
    await sleep(350);
  }

  console.log(
    `Subcategories seed done: updated=${updated} skipped=${skipped} failed=${failed}`,
  );
}

async function pull() {
  console.log('Pulling places from Notion…');
  const pages = await queryAllPages();
  console.log(`  ${pages.length} page(s) in database`);

  const places = [];
  for (const page of pages) {
    if (page.archived || page.in_trash) continue;
    const mapped = mapPage(page);
    if (mapped) places.push(mapped);
  }

  places.sort((a, b) => {
    if (a.city !== b.city) return a.city.localeCompare(b.city);
    return a.name.en.localeCompare(b.name.en);
  });

  const byCity = {};
  for (const pl of places) {
    byCity[pl.city] = (byCity[pl.city] || 0) + 1;
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    databaseId: DATABASE_ID,
    count: places.length,
    byCity,
    places,
  };

  writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const ts = `/**
 * AUTO-GENERATED by \`npm run travel:notion:pull\`. Do not edit by hand.
 * Source: Notion DB "Lugares" → editorial place snapshot.
 */

const snapshot = ${JSON.stringify(payload, null, 2)} as const;

export default snapshot;
`;
  writeFileSync(outTsPath, ts, 'utf8');

  console.log(`Wrote ${places.length} place(s) →`);
  console.log(`  ${outTsPath}`);
  console.log(`  ${outJsonPath}`);
  console.log('By city:', byCity);
  if ((byCity.paris || 0) > 30) {
    console.log(
      `\nNote: API has ${byCity.paris} Paris places. If the Notion UI shows ~30, open the DB as full page and clear view filters (inline DBs paginate).`,
    );
  }
}

// —— CLI ——
const cmd = process.argv[2] || 'pull';
const arg = process.argv[3];

try {
  if (cmd === 'pull') {
    await pull();
  } else if (cmd === 'schema') {
    await ensureSchema();
  } else if (cmd === 'sync') {
    await ensureSchema();
    await pull();
  } else if (cmd === 'seed') {
    await seed(arg || resolve(root, 'src/data/paris-seed-dump.json'));
  } else if (cmd === 'migrate') {
    await migrate();
  } else if (cmd === 'placeids') {
    await resolvePlaceIds({ force: arg === '--force' });
  } else if (cmd === 'seed-subcategories') {
    await seedSubcategories(arg);
  } else {
    console.error(`Unknown command: ${cmd}`);
    console.error(
      'Usage: sync-travel-notion.mjs [pull|schema|sync|seed|migrate|placeids|seed-subcategories]',
    );
    process.exit(1);
  }
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
