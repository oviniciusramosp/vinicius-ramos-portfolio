import { describe, expect, it } from 'vitest';
import {
  absoluteUrl,
  canonicalUrl,
  normalizePathname,
  parseMonthYear,
  personJsonLd,
  jsonLdGraph,
} from './seo';

describe('normalizePathname', () => {
  it('keeps root as /', () => {
    expect(normalizePathname('/')).toBe('/');
    expect(normalizePathname('')).toBe('/');
  });

  it('strips trailing slashes', () => {
    expect(normalizePathname('/articles/')).toBe('/articles');
    expect(normalizePathname('/projects/staircase/')).toBe(
      '/projects/staircase',
    );
  });
});

describe('canonicalUrl', () => {
  it('uses trailing slash only for root', () => {
    expect(canonicalUrl('/')).toBe('https://viniciusramos.com/');
    expect(canonicalUrl('/articles')).toBe(
      'https://viniciusramos.com/articles',
    );
    expect(canonicalUrl('/articles/')).toBe(
      'https://viniciusramos.com/articles',
    );
  });
});

describe('absoluteUrl', () => {
  it('passes through absolute URLs', () => {
    expect(absoluteUrl('https://example.com/x.jpg')).toBe(
      'https://example.com/x.jpg',
    );
  });

  it('resolves site-relative paths', () => {
    expect(absoluteUrl('/og-default.jpg')).toBe(
      'https://viniciusramos.com/og-default.jpg',
    );
  });
});

describe('parseMonthYear', () => {
  it('parses display dates to ISO month-start', () => {
    expect(parseMonthYear('Jun 2026')).toBe('2026-06-01');
    expect(parseMonthYear('Apr 2026')).toBe('2026-04-01');
  });

  it('returns undefined for unknown formats', () => {
    expect(parseMonthYear('2026-06-01')).toBeUndefined();
    expect(parseMonthYear('June 2026')).toBeUndefined();
  });
});

describe('jsonLdGraph', () => {
  it('wraps nodes in schema.org graph', () => {
    const graph = jsonLdGraph([personJsonLd()]);
    expect(graph).toMatchObject({
      '@context': 'https://schema.org',
      '@graph': [{ '@type': 'Person', name: 'Vinicius Ramos' }],
    });
  });
});
