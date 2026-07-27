/**
 * Regression: educational social posts slider collapsed to 0 height.
 *
 * Root cause was CSS specificity:
 * 1. `.feature-card .card { height: var(--feature-card-min-height) }` with
 *    `--feature-card-min-height: 0` on social sections beat `.card--social { height: auto }`.
 * 2. Later `.feature-card-image-container { position: relative }` beat
 *    `.feature-card-image-container--social { position: absolute }`, so the
 *    figure collapsed (absolute img, no in-flow height).
 *
 * Guards: double-class selectors must keep winning.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'src/components/ScrollGallery.astro'),
  'utf8',
);

/** Pull the component `<style>` block (first unscoped style in the file). */
function styleBlock(src: string): string {
  const match = src.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  if (!match) throw new Error('ScrollGallery.astro: no <style> block found');
  return match[1];
}

const css = styleBlock(source);

describe('ScrollGallery social posts layout (CSS regression)', () => {
  it('social section zeroes feature-card min-height (aspect-ratio drives size)', () => {
    expect(css).toMatch(
      /\.scroll-gallery-section--social\s*\{[^}]*--feature-card-min-height:\s*0/,
    );
  });

  it('social cards override height with higher specificity than .feature-card .card', () => {
    // Must be two classes under .feature-card so it beats
    // `.feature-card .card { height: var(--feature-card-min-height) }`
    expect(css).toMatch(/\.feature-card\s+\.card\.card--social\s*\{/);

    const block = css.match(
      /\.feature-card\s+\.card\.card--social\s*\{([^}]+)\}/,
    );
    expect(block, 'missing .feature-card .card.card--social rule').toBeTruthy();
    const body = block![1];
    expect(body).toMatch(/height:\s*auto/);
    expect(body).toMatch(/aspect-ratio:\s*0\.75/);
  });

  it('social image container stays absolute with higher specificity than base figure', () => {
    // Double class beats later `.feature-card-image-container { position: relative }`
    expect(css).toMatch(
      /\.feature-card-image-container\.feature-card-image-container--social\s*\{/,
    );

    const block = css.match(
      /\.feature-card-image-container\.feature-card-image-container--social\s*\{([^}]+)\}/,
    );
    expect(
      block,
      'missing double-class social image container rule',
    ).toBeTruthy();
    expect(block![1]).toMatch(/position:\s*absolute/);
    expect(block![1]).toMatch(/inset:\s*0/);
  });

  it('does not reintroduce low-specificity social height rules as the only override', () => {
    // Alone, these lose to `.feature-card .card { height: var(...) }`
    const weakOnly =
      /\.card--social\s*\{[^}]*height:\s*auto[^}]*\}/.test(css) &&
      !/\.feature-card\s+\.card\.card--social\s*\{/.test(css);
    expect(weakOnly).toBe(false);

    const weakFigureOnly =
      /\.feature-card-image-container--social\s*\{[^}]*position:\s*absolute[^}]*\}/.test(
        css,
      ) &&
      !/\.feature-card-image-container\.feature-card-image-container--social\s*\{/.test(
        css,
      );
    expect(weakFigureOnly).toBe(false);
  });
});
