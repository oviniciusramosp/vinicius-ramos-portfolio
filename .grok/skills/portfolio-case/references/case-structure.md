# Case structure reference

Source of types: `src/data/projects.ts`.  
Renderer: `src/pages/projects/[slug].astro`.

Keep this file aligned when `CaseBlock` / `Project` types change.

---

## Project fields (homepage + case hero)

```ts
{
  slug: string;           // kebab-case, URL segment
  title: string;
  year: string;           // e.g. "2024"; empty string ok for soon cards
  tags: string[];         // uppercase chips; reuse existing when possible
  summary: string;        // hero + SEO description
  cover: string;          // homepage card back layer
  coverFront?: string;    // homepage card front layer (parallax)
  imageFit?: 'cover' | 'contain';
  size: 'lg' | 'md' | 'sm' | 'tall' | 'wide';
  priority?: number;      // higher packs first on homepage filter grid
  href?: string;          // '/projects/<slug>' to publish case
  soon?: true;            // coming soon card (no full case)
  sections: ProjectSection[];  // flat fallback
  blocks?: CaseBlock[];        // full case body
  quotes?: ProjectQuote[];
  quotesAsIncentive?: boolean; // ScrollGallery quote shell
  nextSlug?: string;
  note?: string;          // footer note under case
}
```

**Published** = has `href` and not `soon` (`getPublishedProjects()`).

### Priority heuristics

| Intent | size | priority (approx) |
|--------|------|-------------------|
| Flagship case | `lg` | 100–110 |
| Strong secondary | `lg` / `tall` | 60–90 |
| Smaller / concept | `sm` / `wide` | 35–55 |
| Coming soon | any | as needed |

Existing anchors: Crypto Bros `105` lg, Staircase `100` lg, HP `90` lg.

### Tag conventions

Existing chips include: `AI`, `WEB`, `MOBILE`, `CONCEPT`, `A11Y`, `BRAND`, `VISION PRO`, `GAS PUMP OS`.  
Prefer reusing. New tags create new filter chips site-wide.

---

## CaseBlock types

### `bento`

Hero mosaic or mid-page design strip.

```ts
{
  type: 'bento',
  columns?: 3 | 4 | 5,   // default 4 (ImagesFull)
  shell?: 'full' | 'content',
  cells: CaseBentoCell[],
}
```

**Image cell:** `kind: 'image'`, `src`, `alt`, optional `span`, `fit`, `objectPosition`, `padded`, `texture`, `surface`.

**Caption cell:** `kind: 'caption'`, `text`, optional `span`, `texture`, `lottie`, `lottieSpeed`, `surface`.

**Spans:** `1x1` | `1x2` | `1x3` | `2x1` | `2x2` | `2x3` | `2x4`.

Typical hero:

- Large product shot `2x2` contain
- Caption or icon `1x1`
- Second product `2x2` or tall phone `1x2`
- Logo / partners `2x1` padded

Mid-page challenge strip (HP): `columns: 3`, `shell: 'content'`, logo `1x1` + visual `2x1`.

### `section`

```ts
{
  type: 'section',
  title?: string,
  paragraphs: string[],
  cta?: { label: string; href: string; modal?: boolean },
}
```

- `**bold**` in paragraphs becomes `<strong>` on the case page.
- `cta.modal: true` opens `EmbedModal` (same-origin-ish embed pattern as HP ArcTouch case).

### `gallery`

```ts
{
  type: 'gallery',
  layout: 'pair' | 'triple' | 'single' | 'social' | 'scroll' | 'stack',
  title?: string,
  images: CaseImage[],
}
```

| layout | Use |
|--------|-----|
| `pair` | Two equal product shots |
| `triple` | Three phones / dashboard tiles (3rd often `hideOn: 'mobile'`) |
| `single` | One wide hero-ish frame |
| `social` | IG/story creatives |
| `scroll` | Horizontal presentation / mood row |
| `stack` | Overlapping cards (Vibecheck-style notes) |

**CaseImage:** `src`, `alt`, optional `fit`, `aspect`, `hideOn: 'mobile'`.

### `deck-slider`

```ts
{
  type: 'deck-slider',
  variant?: 'wireframes' | 'presentation',
  title?: string,
  texture?: string,
  decks: { title: string; images: CaseImage[] }[],
  autoplay?: boolean,
}
```

- **wireframes** (default): HP-style cards with phone frames + side peeks.
- **presentation**: full-width slides, little/no peek.

### `scroll-gallery`

```ts
{
  type: 'scroll-gallery',
  title?: string,
  ariaLabel?: string,
  theme?: 'light' | 'dark',  // dark ≈ incentive-gallery-dark
  short?: boolean,
  entrance?: boolean,
  items: ScrollGalleryItem[],  // kind: feature | quote | article | social
}
```

- Renders Storybook **ScrollGallery** (paddlenav, side-by-side cards).
- Prefer `kind: 'social'` for image-first portrait posts (no + chrome).

### Bento `social-fan` cell

```ts
{
  kind: 'social-fan',
  images: CaseImage[],  // prefer odd count (5–7)
  span?: '2x2',
  ariaLabel?: string,
}
```

Fanned stack on a circular arc (landonorris.com/off-track); hover peels a card forward.  
Component: `SocialFan.astro` · client: `src/scripts/social-fan.ts` · Storybook: **Components/SocialFan**.

### Bento `device-3d` cell

```ts
{
  kind: 'device-3d',
  screen: string,       // app UI image or video
  alt: string,
  span?: '2x2',         // typical hero
  model?: string,       // GLB (default iphone-ready.glb)
  poster?: string,      // optional flat poster; else Cosmic Orange bezel + screen
}
```

WebGL progressive enhancement: poster always paints first; Three.js enhances when ready.  
Component: `Device3D.astro` · client: `src/scripts/device-three.ts`. Prefer **one** per case.

### `video`

```ts
{
  type: 'video',
  src: string,
  alt?: string,
  aspect?: string,
  fit?: 'cover' | 'contain',
  poster?: string,
  controls?: boolean,           // pause/play outside the frame
  shell?: 'full' | 'copy',      // full media column (default) | section copy width
}
```

- **full** (default): full media column (Staircase listings demo).
- **copy**: same width as section title/copy (Crypto Bros craft chart).

---

## Recommended block recipes

### Flagship product (Staircase / Crypto Bros family)

```
bento (hero)
section (origin / role / problem)
section (journey beat 1)
gallery triple|pair
section (journey beat 2)
gallery …
section (craft or challenges)
gallery single|pair
section (impact)
gallery social   // optional
// quotes via project.quotes
```

### Client process (HP family)

```
bento (hero)
section Discovery
deck-slider wireframes
section Challenges
bento columns:3 shell:content   // design system craft
section Deliverables
gallery single
section Impact + cta modal
// quotes
```

### Audit / concept (Vibecheck family)

```
bento
section Audit
section Audit notes + gallery single
section Wireframing / mood + gallery scroll
section Deliverables + gallery single
gallery scroll (presentation) or deck-slider presentation
```

---

## Placeholder assets

Directory: `public/projects/<slug>/`

Suggested baseline set (adapt names to the story):

| File | Role |
|------|------|
| `cover.svg` | Homepage back |
| `cover-front.svg` | Homepage front (optional) |
| `hero-*.svg` | Bento large cells |
| `app-*.svg` / `web-*.svg` | Product galleries |
| `craft-*.svg` | Process / DS / detail |
| `story-1..n.svg` | Social |

Minimal SVG pattern (label must match filename for easy swap):

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500" viewBox="0 0 1200 1500">
  <rect width="1200" height="1500" fill="#0B0F14"/>
  <text x="600" y="750" text-anchor="middle" fill="#8B949E"
        font-family="system-ui,sans-serif" font-size="28">placeholder-name</text>
</svg>
```

Public URL: `/projects/<slug>/<file>`.

Remote Framer assets still work (`https://framerusercontent.com/images/...`) for legacy cases.

---

## Quotes

```ts
quotes: [
  {
    text: string,
    author: string,
    role: string,
    avatar?: '/avatars/Name_Context.ext',
  },
]
```

Avatars live in `public/avatars/`.  
`quotesAsIncentive: true` uses ScrollGallery incentive shell (Staircase).

---

## nextSlug

Linear “next project” CTA. Keep a sensible loop among published cases, e.g.:

`booking → crypto-bros → staircase → hp-printables → …`

When inserting a high-priority case, update the previous neighbor’s `nextSlug`.

---

## Internal brief template (`docs/projects/<slug>.md`)

```markdown
# <Title> — case brief (internal)

- slug, year, route, status, last updated

## Raw context
(what the user said; full fidelity)

## Editorial decisions
(tone, de-emphasize, no-go, tags, role yes/no)

## Published meta
(summary, size, priority, nextSlug, quotes?)

## Narrative outline
(section titles + intent)

## Block map
(ordered CaseBlocks)

## Assets
(table: file → use → status)

## Not published
(stack, weak metrics, private notes)

## Backlog
```

See `docs/projects/crypto-bros.md` as a filled example.

---

## Writing constraints (public strings)

- English
- No em dash `—`
- No fabricated metrics or quotes
- Bold product names sparingly with `**Name**` in `blocks` paragraphs
- `sections` should mirror the story without depending on media order

---

## Validation checklist

- [ ] `href` set for live case
- [ ] `blocks` non-empty for full layout
- [ ] `sections` populated as fallback
- [ ] Images under `public/` or valid remote URLs
- [ ] Alts written
- [ ] `nextSlug` valid or omitted
- [ ] `docs/projects/<slug>.md` written
- [ ] Homepage `priority` / `size` intentional
- [ ] Grep public copy for `—` → zero hits in new strings
