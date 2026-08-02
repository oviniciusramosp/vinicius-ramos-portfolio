// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages:
// - Custom domain (viniciusramos.com): base = '/'
// - Project pages (user.github.io/repo): base = '/repo-name/'
//
// Images: local rasters under src/assets are optimized at build (Sharp → AVIF/WebP).
// Remaining Framer CDN covers are authorized so build can re-encode them too
// (no runtime CDN dependency in the HTML once built).
export default defineConfig({
  site: 'https://viniciusramos.com',
  base: '/',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      // Exclude internal type labs + personal travel from search indexes
      filter: (page) =>
        !page.includes('/preview/') && !page.includes('/travel'),
    }),
  ],
  image: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'framerusercontent.com',
      },
    ],
  },
  /**
   * Vite CSS minify uses LightningCSS with `build.cssTarget`.
   * Without targets, LightningCSS mishandles `backdrop-filter` vendor prefixes
   * (can emit only `-webkit-backdrop-filter`, which modern Chrome ignores).
   * Baseline-widely-available targets: unprefixed + -webkit for Safari.
   */
  vite: {
    build: {
      cssTarget: ['chrome111', 'edge111', 'firefox114', 'safari16.4'],
    },
  },
});
