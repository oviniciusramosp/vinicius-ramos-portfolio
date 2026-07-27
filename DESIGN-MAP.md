# Design & content map — viniciusramos.com

Source: live Framer site (published Jul 25, 2026). Inspected via HTML, search index, and computed styles.

## Site map

| Route | Status | Notes |
|-------|--------|--------|
| `/` | Live | Home + project bento grid |
| `/resume` | Live | Full CV |
| `/contact` | Live | SAY HI form |
| `/projects/staircase` | Live | Full case study: bento hero + interleaved galleries + quotes |
| `/projects/hp-printables` | Live | Full case: bento + wireframe scrolls + quotes |
| `/projects/vibecheck` | Live | Full case: bento + moodboard + presentation deck |
| `/projects/intermex` | Live | Full case study (homepage card not always linked) |
| `/projects/booking` | Live | Concept case study |
| Gilbarco / Moove / Bubble | Cover only | Marked SOON on homepage |
| `/crypto-bros/*` | Empty shells | Not rebuilt |

## Homepage content

- Banner: “This portfolio is currently in development.”
- Hero title: `hi, i'm Vinicius.` (rendered uppercase via Blatant Bold)
- Bio: product designer and manager… AI and spatial computing
- Grid projects (order / size):

| Project | Tags | Size (approx) | Linked |
|---------|------|---------------|--------|
| Staircase | AI, WEB | 558×448 (lg) | yes |
| HP Printables | WEB | 558×448 (lg) | yes |
| Vibecheck | WEB | 275×220 (sm) | yes |
| Gilbarco | GAS PUMP OS, A11Y | 275×220 (sm) | no / SOON |
| Intermex | MOBILE, A11Y | 275×448 (tall) | page exists |
| Moove | BRAND | 558×220 (wide) | no / SOON |
| Bubble | VISION PRO | 558×448 (lg) | no / SOON |
| Booking.com | MOBILE | 558×220 (wide) | page exists |

## Design tokens

### Color

| Role | Value |
|------|--------|
| Page background | `#000000` |
| Surface / card / banner | `#131219` |
| Elevated overlay | `rgba(23, 22, 29, 0.8)` |
| Primary text | `#FFFFFF` |
| Muted text | `#4B485E` |
| Accent (section titles) | `#008FFF` / `#0099FF` |
| Hairline | `rgba(255,255,255,0.08)` |
| Soft border | `rgba(255,255,255,0.2)` |

### Typography

| Use | Family | Size | Weight | Notes |
|-----|--------|------|--------|-------|
| Logo | Blatant Regular | 22px | 400 | uppercase, ls 0.4px |
| Hero / case H1 | Blatant Bold | 42px | 400 | uppercase, lh ~1.2 |
| Card title | Blatant Bold | 28px | 400 | uppercase |
| Next project | Blatant Bold | 60px | 400 | stroke hover |
| Body | Inter | 14px | 400 | lh 1.7, max ~620px |
| Nav / buttons | IBM Plex Mono | 15px | 400 | |
| Tags | IBM Plex Mono | 12px | 400 | |
| Section H2 | IBM Plex Mono | 22px | 300 | accent blue |

Fonts hosted: Blatant via Framer assets; Inter + IBM Plex via Google Fonts.

### Spacing & radii

| Token | Value |
|-------|--------|
| Nav height | 64px |
| Nav / footer max-width | **1200px** (`--content-max`; not shell 1920) |
| Nav padding | 12px 24px |
| Footer padding | **72×250×24** desktop · **48×64×24** tablet · **32×16×24** mobile |
| Hero padding (desktop) | 86px 250px 48px |
| Grid gap | 8px |
| Grid outer pad | 16px |
| Card radius | **16px** |
| Button radius | **30px** |
| Tag radius | **50px** (pill), pad 6×12 |
| Quote section pad | 48px 220px |
| Quote track gap | 24px |
| Edge fades | ~105px |

### Motion

| Interaction | Spec |
|-------------|------|
| Logo color | `color 300ms cubic-bezier(0.44, 0, 0.56, 1)` |
| Next project | `color ease-in-out 200ms` + white text-stroke on hover |
| Card image | rest scale ~1.02 → hover ~1.08, ~450ms smooth |
| Card overlay | opacity 0.65 → 1, fill `rgba(23,22,29,0.8)` |
| Buttons | bg/border 300ms ease |

## Hover inventory

1. **Project cards**  
   - Rest: title/tags **hidden**; image scale 1  
   - Hover: title/tags fade in; light gradient scrim (no heavy blur);  
     image **scale-up ~1.08** (MPParallaxView-style depth)  
   - Magnetic `withOffset` range **3** on shell  
   - Internal parallax: image (back) less travel, title/tags (front) more  
   - All show/hide via ~420ms transitions  



2. **Header logo**  
   - White → accent blue  

3. **Resume / Contact / LinkedIn buttons** (measured on live site)  
   - Rest: transparent, **no border**, **no box-shadow**, pad `8×16`, radius `30px`  
   - Hover fill: `rgba(255,255,255,0.1)` only  
   - Magnetic (`withOffset` HOC):  
     `spring = { stiffness: 300, damping: 30 }`  
     `offset = clamp(mouse / halfSize, -1, 1) * 6` → max **±6px**  
     Outer fixed size; inner layer gets spring `x`/`y`  
   - **No scale**, no drop shadow, no label parallax  

   - Soft cursor blob (`data-framer-name="Default"` on live):  
     Free: 32×32, `rgba(255,255,255,0.1)`, follows mouse  
     On button: **scale up (~2.2) + opacity → 0** — dissolves into the control  
     (button hover fill is what remains; cursor does not stay as a morph ring)  
     Spring stiff 300 / damp 30 (same as button offset)  
   - Code: `src/scripts/magnetic.ts`, `src/scripts/cursor.ts`, `Button.astro`

4. **Next project link** (`LinkNextProject`)  
   - Rest: black fill + white stroke  
   - Hover: white fill + white stroke  

## Sliders

### Quote slider (case studies)

- Horizontal track of quote cards (~640–800px wide)
- Drag / pointer pan + optional wheel remap
- Quotes duplicated in track for continuous feel
- Left/right black gradient fades (`LFade` / `RFade`, ~105px)
- Section padding ~48px vertical, large horizontal inset

### Content / gallery slider

- Horizontal scroll row for optional section images
- Scroll-snap on figures
- Same drag pattern as quotes

### Homepage grid

- Not a carousel on desktop: **CSS bento grid** (4 columns, variable row spans)
- Collapses to 2 → 1 columns on smaller breakpoints

## Case study: Staircase (`/projects/staircase`)

Source: live Framer HTML + CSS (Jul 25, 2026). **Breakpoints:** mobile ≤809 · tablet 810–1193 · desktop ≥1194 · xl ≥1536.

### Content order (Framer names)

1. **Hero** — year `2021`, tags `AI`/`WEB`, title, summary  
2. **ImagesFull** (bento 4×3 desktop)  
   - `Staircase01` — dual iPhones (`0jPwP3iw…`, contain, span 2×2)  
   - Caption chip — “Let me evaluate your documents…”  
   - `Staircase02` — custom icons SVG (`5yTt4aAX…`, padded)  
   - `Staircase04` — Listings on MacBook (`GkbdAK27…`, contain, span 2×2)  
   - `Staircase05` — partner logos SVG (`QPkE0ysp…`, span 2×1)  
3. **SectionRole** — title + 2 paragraphs  
4. **SectionUserJourney01** — “User Journey and Products” + Listings copy  
5. **Listings pair** (`Post5_Large` / `Post4_Large`) — `hSrf3zxG…`, `rcoyAGVi…` · 2-col, aspect ~0.8  
6. **SectionUserJourney02** — Chat MTG paragraph  
7. **ImagesMoodBoard / chtmtg01×3** — phone screens (`hL18ARQA…`, `orzZ7ixQ…`, `5PfcG5Ci…`) · 3-col desktop, 2-col tablet, 3rd hidden on mobile  
8. **SectionUserJourney03** — PreApproval paragraph  
9. **Calc+PreApproval** — single image (`USSwtHSR…`, max-width 900, aspect ~1.24)  
10. **SectionUserJourney04** — Rate Calculator paragraph  
11. **SectionFinalDeliverable** — “Challenges and Impact”  
12. **ImagesSocialMedia** — 3 creatives (`Dwip1xnu…`, `vnhZ06nm…`, `5cE2nYL0…`) · 3-col desktop, middle hidden on mobile  
13. **SectionQuotes** — Guido + Alonso  
14. **SectionThanks** — branding note  
15. **SectionNext** → HP Printables  

### Section padding (live)

| BP | Hero | Text sections | Media rows |
|----|------|---------------|------------|
| Desktop | `125px 250px 48px` | `48px 250px` | `16px 250px` (bento shell `16px` full-bleed max 1920) |
| Tablet | `125px 64px 48px` | `48px 64px` | `16px 64px` |
| Mobile | `80px 16px 24px` | `24px 16px` | `16px` |
| XL | `144px 240px 48px` · width 1536 | `48px 240px` | `16px 240px` |

### Data model

- Case studies with interleaved media use `project.blocks` (`bento` | `section` | `gallery`).  
- Gallery layouts: `pair` | `triple` | `single` | `social` | `scroll` (horizontal drag).  
- Projects without `blocks` keep legacy `sections` + single `case__cover`.

## Case study: HP Printables

1. ImagesFull bento 4×3: laptop 2×2 · hover 2×1 · logo 1×1 (+texture) · phone 1×2 · partners 1×1 · multi-page 2×1  
2. Project Kickoff and Discovery  
3. SectionWireframes **deck-slider** — Framer Slideshow: centered decks + L/R fade masks, prev/next arrows, 4 page dots; each card = title + phone rail on texture  
4. Design Challenges + logo 35° / CMYK+halftone pair  
5. Final Deliverables + laptop mockup  
6. Results and Impact  
7. Quotes (Chad, Stefan, James) · Thanks note · Next → Vibecheck  

## Case study: Vibecheck

1. ImagesFull bento: MacBook **2×3** · detail 1×1 · decor 1×1 (light) · phones 2×2  
2. Audit · Audit Notes + notes photo  
3. Wireframing text → **stack** of 3 overlapping hand-drawn wireframes  
4. Moodboard text → ImagesMoodBoard **5-col mosaic** (Mac 2×4 · mood 2×3 · brand 1×3 light · phones 1×3 · mobile 2×3 · alt 2×2)  
5. Final Deliverables + prototype mockup  
6. Presentation — **DeckSlider `presentation`** (25 full content-width slides, no peeks)  
7. Next → Intermex

## Rebuild mapping

| Live (Framer) | Rebuild |
|---------------|---------|
| Desktop nav | `Header.astro` + `Button.astro` |
| Project cell | `ProjectCard.astro` |
| ImagesFull grid (home) | `ProjectGrid.astro` |
| ImagesFull / galleries (case) | `projects/[slug].astro` + `blocks` in `projects.ts` |
| SectionWireframes slideshow | `DeckSlider.astro` + `deck-slider.ts` |
| AAP slide navigator (Apple highlights) | DeckSlider timed-dotnav + play/pause (inspired by `#aap-media-card-gallery`) |
| SectionQuotes | `QuoteSlider.astro` |
| LinkNextProject | `NextProject.astro` |
| Content | `src/data/*.ts` |
