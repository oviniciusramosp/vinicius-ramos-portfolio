# Design & content map — viniciusramos.com

Source: live Framer site (published Jul 25, 2026). Inspected via HTML, search index, and computed styles.

## Site map

| Route | Status | Notes |
|-------|--------|--------|
| `/` | Live | Home + project bento grid |
| `/resume` | Live | Full CV |
| `/contact` | Live | SAY HI form |
| `/projects/staircase` | Live | Full case study + quotes slider |
| `/projects/hp-printables` | Live | Full case study + quotes |
| `/projects/vibecheck` | Live | Full case study |
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
| Nav padding | 12px 24px |
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
   - Image zooms inside `overflow: hidden` + 16px radius  
   - Dark glass overlay strengthens  
   - Title (Blatant) + tags (mono pills) remain on bottom  
   - Magnetic `withOffset` (same spring 300/30), range **3** (half of buttons’ 6)  


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

## Rebuild mapping

| Live (Framer) | Rebuild |
|---------------|---------|
| Desktop nav | `Header.astro` + `Button.astro` |
| Project cell | `ProjectCard.astro` |
| ImagesFull grid | `ProjectGrid.astro` |
| SectionQuotes | `QuoteSlider.astro` |
| LinkNextProject | `NextProject.astro` |
| Content | `src/data/*.ts` |
