import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  articleHref,
  articles,
  getArticleById,
  getNextArticle,
  isArticleHighlight,
  youtubeEmbedSrc,
  type ArticleHighlight,
} from './articles';

const publicDir = resolve(process.cwd(), 'public');

function publicAssetExists(path: string): boolean {
  if (!path.startsWith('/')) return true; // remote or non-public path
  return existsSync(resolve(publicDir, path.slice(1)));
}

describe('articles data integrity', () => {
  it('has at least one article', () => {
    expect(articles.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const ids = articles.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('requires id, date, title, description, image, and non-empty content', () => {
    for (const article of articles) {
      expect(article.id, 'id').toBeTruthy();
      expect(article.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(article.date, `${article.id} date`).toBeTruthy();
      expect(article.title, `${article.id} title`).toBeTruthy();
      expect(article.description, `${article.id} description`).toBeTruthy();
      expect(article.image, `${article.id} image`).toBeTruthy();
      expect(article.content.length, `${article.id} content`).toBeGreaterThan(0);
    }
  });

  it('references local images that exist under public/', () => {
    for (const article of articles) {
      expect(
        publicAssetExists(article.image),
        `missing public asset for ${article.id}: ${article.image}`,
      ).toBe(true);
    }
  });

  it('keeps highlight hrefs absolute paths or external urls', () => {
    for (const article of articles) {
      for (const paragraph of article.content) {
        if (typeof paragraph === 'string') continue;
        for (const part of paragraph) {
          if (!isArticleHighlight(part)) continue;
          const h = part as ArticleHighlight;
          expect(h.text).toBeTruthy();
          expect(h.href).toMatch(/^(https?:\/\/|\/)/);
          expect(h.tooltip).toBeTruthy();
        }
      }
    }
  });
});

describe('article helpers', () => {
  it('articleHref builds the shareable path', () => {
    expect(articleHref('ui-on-demand')).toBe('/articles/ui-on-demand');
  });

  it('getArticleById returns a match or undefined', () => {
    const first = articles[0];
    expect(getArticleById(first.id)).toEqual(first);
    expect(getArticleById('does-not-exist')).toBeUndefined();
  });

  it('getNextArticle wraps to the first article', () => {
    const last = articles[articles.length - 1];
    const first = articles[0];
    expect(getNextArticle(last.id)).toEqual(first);
    expect(getNextArticle(first.id)).toEqual(articles[1]);
    expect(getNextArticle('missing')).toBeUndefined();
  });

  it('isArticleHighlight narrows rich parts', () => {
    expect(isArticleHighlight('plain')).toBe(false);
    expect(
      isArticleHighlight({
        text: 'x',
        href: '/projects/crypto-bros',
        tooltip: 'View',
      }),
    ).toBe(true);
  });

  it('youtubeEmbedSrc converts watch and share urls', () => {
    expect(youtubeEmbedSrc('https://www.youtube.com/watch?v=eWKY0OnPByg')).toBe(
      'https://www.youtube-nocookie.com/embed/eWKY0OnPByg',
    );
    expect(youtubeEmbedSrc('https://youtu.be/eWKY0OnPByg')).toBe(
      'https://www.youtube-nocookie.com/embed/eWKY0OnPByg',
    );
    expect(youtubeEmbedSrc('https://www.youtube.com/embed/eWKY0OnPByg')).toBe(
      'https://www.youtube-nocookie.com/embed/eWKY0OnPByg',
    );
    expect(youtubeEmbedSrc('https://example.com/not-youtube')).toBeUndefined();
    expect(youtubeEmbedSrc('not-a-url')).toBeUndefined();
  });
});
