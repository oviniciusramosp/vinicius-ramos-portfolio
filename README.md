# Vinicius Ramos · Portfolio

Static rebuild of [viniciusramos.com](https://viniciusramos.com/) using **Astro** for reusable components and **GitHub Pages** deployment.

## Stack

- **Astro 7** — static site generation, file-based routing, component islands
- **TypeScript** — typed content models (`src/data/*`)
- **CSS design tokens** — fonts, colors, radii, motion (`src/styles/tokens.css`)
- **GitHub Actions** — auto-deploy on push to `main`

Why Astro (vs plain HTML or SPA frameworks):

- Reusable `.astro` components without shipping a heavy client runtime
- Perfect fit for content-heavy portfolios
- First-class static output for GitHub Pages
- Easy to grow with React/Vue islands later if needed

## Project structure

```
src/
  components/     # Header, Button, Tag, ProjectCard, ProjectGrid, QuoteSlider…
  data/           # site, projects, resume (single source of truth)
  layouts/        # BaseLayout
  pages/          # routes → index, resume, contact, projects/[slug]
  styles/         # tokens + global CSS
public/           # static assets, .nojekyll
.github/workflows # GitHub Pages deploy
```

## Local development

```bash
npm install
npm run dev
```

```bash
npm run build    # output → dist/
npm run preview  # preview production build
```

## GitHub Pages setup

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment → Source:** GitHub Actions.
3. On push to `main`, `.github/workflows/deploy.yml` builds and deploys `dist/`.

### Custom domain (`viniciusramos.com`)

`astro.config.mjs` already uses:

```js
site: 'https://viniciusramos.com',
base: '/',
```

1. In the repo, **Settings → Pages → Custom domain**, add `viniciusramos.com`.
2. Point DNS (A/CNAME) to GitHub Pages as documented by GitHub.
3. Optionally add `public/CNAME` with the domain.

### Project site (`username.github.io/repo-name`)

Change `astro.config.mjs`:

```js
site: 'https://username.github.io',
base: '/repo-name',
```

## Content editing

| What | Where |
|------|--------|
| Home hero / nav / footer | `src/data/site.ts` |
| Case studies & home grid | `src/data/projects.ts` |
| Resume | `src/data/resume.ts` |

Home project sizes (`lg` | `tall` | `wide` | `sm`) drive the bento grid.

## Contact form

`/contact` posts to the same **Framer Forms** endpoint as the live site (`site.contactForm` in `src/data/site.ts`). Client-side proof-of-work runs in `src/scripts/contact-form.ts` — no Formspree key required.

## Design map (from live site)

| Token | Value |
|-------|--------|
| Background | `#000000` |
| Surface / cards | `#131219` |
| Text | `#FFFFFF` |
| Muted | `#4B485E` |
| Accent | `#008FFF` |
| Card radius | `16px` |
| Button radius | `30px` |
| Tag radius | `50px` |
| Display font | Blatant Bold / Regular |
| Body | Inter 14px / 1.7 |
| UI mono | IBM Plex Mono 12–15px |
| Nav | 64px, `backdrop-filter: blur(20px)` |

### Hover

- **Project cards:** image scales `1.02 → 1.08`, dark overlay `rgba(23,22,29,0.8)`, content stays legible
- **Nav logo:** color transition `300ms cubic-bezier(0.44,0,0.56,1)` → accent
- **Buttons:** border/background lift to white 10% fill
- **Next project:** filled black letters → white + white text-stroke

### Sliders

- **Quote slider** (case studies): horizontal drag/scroll track, duplicated quotes, L/R black fades (~105px)
- **Gallery slider** (optional per section images): horizontal scroll-snap + drag
