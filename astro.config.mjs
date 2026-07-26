// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Pages:
// - Custom domain (viniciusramos.com): base = '/'
// - Project pages (user.github.io/repo): base = '/repo-name/'
export default defineConfig({
  site: 'https://viniciusramos.com',
  base: '/',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
});
