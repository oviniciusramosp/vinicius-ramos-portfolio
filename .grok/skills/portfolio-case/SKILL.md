---
name: portfolio-case
description: >
  Develop full case-study pages for the vinicius-ramos-portfolio site (Astro).
  Mirrors existing cases (Staircase, HP Printables, Crypto Bros, Vibecheck): Project
  data in src/data/projects.ts, CaseBlock layout, placeholders, and an internal brief.
  Use when adding a new portfolio case, case study page, project page, writing case
  copy, scaffolding /projects/[slug], or when the user runs /portfolio-case.
---

# Portfolio case study

Build **new case studies** the same way published ones work: data-driven page via
`src/pages/projects/[slug].astro` + one `Project` entry in `src/data/projects.ts`.
**Do not invent new page routes or one-off layout components** unless the user
explicitly asks for a new block type.

## When this skill runs

1. Read this file and `references/case-structure.md`.
2. Skim 1–2 real cases in `src/data/projects.ts` (e.g. `staircase`, `hp-printables`,
   `crypto-bros`, `vibecheck`) for voice and block order.
3. If `docs/projects/<slug>.md` already exists, treat it as source of truth for
   unpublished context.
4. Follow the phases below. **Interview before implementing** unless the user
   already provided a complete brief and asked to implement.

---

## Phase 0 — Ground rules (always)

| Rule | Detail |
|------|--------|
| Language | Public copy in **English** (site locale). User may brief in Portuguese; translate. |
| Em dash | **Never** use the character `—` in portfolio-facing text. Prefer commas, colons, periods, or parentheses. |
| Components | Only existing `CaseBlock` types and homepage card fields. Render path is already in `[slug].astro`. |
| Role section | Optional. Skip when the user was solo / “is everything”; invent a **project-specific narrative** instead of forcing Role / Discovery / Deliverables. |
| Tech stack | Mention only if it serves the story. Prefer design, product, craft, impact. |
| Metrics | Prefer honest, usable numbers. Do not invent. Weak vanity metrics stay out or de-emphasized. |
| Quotes / note | Only if the user has real quotes or wants a footer note. |
| Placeholders first | Ship labeled image placeholders; user produces finals later. |
| Internal brief | Always write/update `docs/projects/<slug>.md` so future sessions keep full context. |

---

## Phase 1 — Interview (ask before writing)

Ask in conversation (Portuguese is fine). **Do not dump every question at once** if
the user already answered some; only fill gaps. Aim for one short batch of the
highest-priority unknowns.

### Must know

1. **Name** + preferred **slug** (kebab-case)
2. **Year**
3. **Tags** (reuse existing chips when possible: `AI`, `WEB`, `MOBILE`, `CONCEPT`, `A11Y`, …). Avoid one-off tags unless needed.
4. **One-line outcome** (what changed for users or career)
5. **Story arc**: company product, client work, personal product, concept/audit, etc.
6. **Whether “Role” makes sense** or the narrative should be custom
7. **What to emphasize / de-emphasize** (e.g. education over trading, process over polish)
8. **Homepage card**: `size` (`lg` / `md` / `sm` / `tall` / `wide`) and how high in the grid (`priority`; Staircase ~100, Crypto Bros ~105)
9. **Images**: ready assets vs placeholders; any real URLs or local paths

### Strongly useful

10. Audience and problem
11. Journey / main product surfaces (3–6 beats)
12. Craft details worth showing (DS, motion, a11y, brand constraints)
13. Impact: launches, metrics, recognition, next doors opened
14. Quotes (text, author, role, avatar path if any)
15. External CTA (link + open in embed modal?)
16. Footer `note`?
17. `nextSlug` chain (which case comes after)
18. Anything that must **never** appear in public copy

If answers are incomplete, draft with explicit gaps and confirm before treating as final.

---

## Phase 2 — Propose narrative + media plan

Before editing `projects.ts`, present:

1. **Summary** (1–2 sentences, EN)
2. **Section outline** with titles (no forced template; match the story)
3. **Block sequence** (bento → section → gallery → …)
4. **Image shot list** (filename, layout use, aspect hints)
5. **Open questions** still blocking quality

Wait for approval or small corrections when the user is iterating on story.
If they say “just implement”, proceed.

### Common narrative patterns (pick / mix, do not force)

| Pattern | When | Example sections |
|---------|------|------------------|
| Product journey | Multi-surface product | Origin → User journey / surfaces → Craft → Impact |
| Process client | Agency / client | Discovery → Challenges → Deliverables → Impact |
| Audit / concept | Redesign challenge | Audit → Notes → Exploration → Deliverables |
| Personal build | Solo product | Origin → Product → Engine/ops → Craft → Impact |

Reference cases:

- **Staircase**: Role + user journey + interleaved product galleries + social + quotes
- **HP Printables**: Discovery + deck-slider wireframes + challenge bento + impact + CTA modal
- **Crypto Bros**: custom arc, no Role, dashboard engine, education-first
- **Vibecheck**: audit + mood/wire scroll + presentation deck

---

## Phase 3 — Implement

### 3.1 Data entry (`src/data/projects.ts`)

Add a full `Project` object (prefer near the top if high priority).

Required for a **live** case:

- `slug`, `title`, `year`, `tags`, `summary`
- `cover` (and optional `coverFront` for dual-layer parallax)
- `imageFit`: `contain` | `cover`
- `size`, `priority`
- `href: '/projects/<slug>'` (omit or set `soon: true` for coming-soon cards)
- `sections`: flat fallback (same story as blocks)
- `blocks`: full interleaved layout (source of truth for the case page)
- optional: `quotes`, `quotesAsIncentive`, `note`, `nextSlug`

Update **nextSlug chain** so navigation still makes sense (and any previous
project that should lead here).

### 3.2 Blocks only from the type system

Use only `CaseBlock` variants documented in `references/case-structure.md`:

- `bento` (hero mosaic; optional mid-page strip with `columns` + `shell`)
- `section` (title optional; `**bold**` via `**text**`; optional `cta`)
- `gallery` (`pair` | `triple` | `single` | `social` | `scroll` | `stack`)
- `deck-slider` (`wireframes` | `presentation`)
- `video`

Hero meta (year, tags, title, summary) is rendered by the page template from
project fields. Do not duplicate that as a block.

### 3.3 Placeholders

If assets are not final:

1. Create `public/projects/<slug>/`
2. Add labeled SVG (or other) placeholders with **stable filenames**
3. Point `cover` / block `src` to `/projects/<slug>/...`
4. List every file in the internal brief for the user to replace later

Keep alts descriptive (English). Prefer aspect ratios used in siblings:

- Phone columns ~ `0.486`
- Pair portraits ~ `0.8`
- Wide product ~ `1.24` / `1.239`
- Social ~ `0.8`

### 3.4 Internal brief

Write `docs/projects/<slug>.md` with:

- Full raw context from the interview (including what was **not** published)
- Editorial decisions (tone, de-emphasis, no-go topics)
- Published meta (tags, size, priority, nextSlug)
- Narrative outline + block map
- Asset inventory + production shot list
- Backlog

This brief is for agents/humans; it is **not** shipped as a page.

### 3.5 Do not

- Add a new Astro page file per case (routing is dynamic)
- Fork case layout CSS for one project without asking
- Put secrets, private metrics, or “never publish” notes only in `projects.ts`
- Use `—` in any user-visible string
- Invent testimonials or metrics

---

## Phase 4 — Verify

1. Entry exists: `getProject('<slug>')` / `getPublishedProjects()` includes it when `href` is set and not `soon`.
2. Tags appear in filter chips via `getHomeFilterTags()` only if used on homepage projects.
3. No `—` in new public strings.
4. Placeholder paths resolve under `public/`.
5. `nextSlug` targets an existing project when set.
6. Summarize for the user: route, card placement, shot list still owed, brief path.

---

## Voice checklist (EN copy)

- First person when describing Vinicius’s work (“I designed…”, “I led…”)
- Concrete product names in **bold** on first useful mention in `blocks`
- Short paragraphs (1–3 sentences), scannable section titles
- Impact in outcomes, not tools
- Match formality of Staircase / HP (professional, clear, not marketing hype)

---

## Quick file map

| Path | Role |
|------|------|
| `src/data/projects.ts` | All project + case content |
| `src/pages/projects/[slug].astro` | Case template (bento, galleries, quotes, next) |
| `src/components/DeckSlider.astro` | Wireframe / presentation decks |
| `src/components/ScrollGallery.astro` | Quote / incentive gallery |
| `src/components/ProjectGrid.astro` | Homepage bento |
| `public/projects/<slug>/` | Case media |
| `docs/projects/<slug>.md` | Internal brief |
| `.grok/skills/portfolio-case/references/case-structure.md` | Types + block recipes |

---

## Slash usage

`/portfolio-case` or natural language:

- “cria um case novo do projeto X”
- “add a case study for …”
- “escreve o case da home para …”
