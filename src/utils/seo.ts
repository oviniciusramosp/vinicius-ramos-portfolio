/**
 * SEO helpers: absolute URLs, date parsing, JSON-LD builders.
 * Keep page-level structured data consistent across the site.
 */

import { site } from '../data/site';

export type JsonLd = Record<string, unknown> | Record<string, unknown>[];

/** Collapse trailing slashes except for site root. */
export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

/** Absolute site URL for a path or absolute URL. */
export function absoluteUrl(pathOrUrl: string, base = site.url): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, base.endsWith('/') ? base : `${base}/`).toString();
}

/** Canonical URL for a pathname (respects trailingSlash: never). */
export function canonicalUrl(pathname: string): string {
  const path = normalizePathname(pathname);
  if (path === '/') return `${site.url}/`;
  return `${site.url}${path}`;
}

/** "Jun 2026" → "2026-06-01" (month-precision ISO for schema.org). */
export function parseMonthYear(date: string): string | undefined {
  const months: Record<string, string> = {
    Jan: '01',
    Feb: '02',
    Mar: '03',
    Apr: '04',
    May: '05',
    Jun: '06',
    Jul: '07',
    Aug: '08',
    Sep: '09',
    Oct: '10',
    Nov: '11',
    Dec: '12',
  };
  const m = date.trim().match(/^([A-Za-z]{3})\s+(\d{4})$/);
  if (!m) return undefined;
  const month = months[m[1]];
  if (!month) return undefined;
  return `${m[2]}-${month}-01`;
}

/** Shared Person node (author / site owner). */
export function personJsonLd(): Record<string, unknown> {
  return {
    '@type': 'Person',
    '@id': `${site.url}/#person`,
    name: site.name,
    url: site.url,
    jobTitle: site.jobTitle,
    description: site.description,
    image: absoluteUrl(site.ogImage),
    sameAs: site.sameAs,
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.location.city,
      addressRegion: site.location.region,
      addressCountry: site.location.country,
    },
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    name: site.name,
    url: site.url,
    description: site.description,
    inLanguage: site.locale,
    publisher: { '@id': `${site.url}/#person` },
  };
}

export function webPageJsonLd(opts: {
  path: string;
  title: string;
  description: string;
  type?: string;
  image?: string;
}): Record<string, unknown> {
  const url = canonicalUrl(opts.path);
  return {
    '@type': opts.type ?? 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: opts.title,
    description: opts.description,
    isPartOf: { '@id': `${site.url}/#website` },
    about: { '@id': `${site.url}/#person` },
    inLanguage: site.locale,
    ...(opts.image
      ? {
          primaryImageOfPage: {
            '@type': 'ImageObject',
            url: absoluteUrl(opts.image),
          },
        }
      : {}),
  };
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export function articleJsonLd(opts: {
  path: string;
  title: string;
  description: string;
  image?: string;
  datePublished?: string;
  dateDisplay?: string;
}): Record<string, unknown> {
  const url = canonicalUrl(opts.path);
  const published =
    opts.datePublished ??
    (opts.dateDisplay ? parseMonthYear(opts.dateDisplay) : undefined);

  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: opts.title,
    description: opts.description,
    url,
    mainEntityOfPage: { '@id': `${url}#webpage` },
    author: { '@id': `${site.url}/#person` },
    publisher: { '@id': `${site.url}/#person` },
    inLanguage: site.locale,
    ...(published ? { datePublished: published } : {}),
    ...(opts.image
      ? {
          image: {
            '@type': 'ImageObject',
            url: absoluteUrl(opts.image),
          },
        }
      : {}),
  };
}

export function projectJsonLd(opts: {
  path: string;
  title: string;
  description: string;
  image?: string;
  year?: string;
  keywords?: string[];
}): Record<string, unknown> {
  const url = canonicalUrl(opts.path);
  return {
    '@type': 'CreativeWork',
    '@id': `${url}#work`,
    name: opts.title,
    description: opts.description,
    url,
    author: { '@id': `${site.url}/#person` },
    creator: { '@id': `${site.url}/#person` },
    inLanguage: site.locale,
    ...(opts.year ? { dateCreated: opts.year } : {}),
    ...(opts.keywords?.length ? { keywords: opts.keywords.join(', ') } : {}),
    ...(opts.image
      ? {
          image: {
            '@type': 'ImageObject',
            url: absoluteUrl(opts.image),
          },
        }
      : {}),
  };
}

/** Graph wrapper for multiple nodes. */
export function jsonLdGraph(nodes: Record<string, unknown>[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };
}
