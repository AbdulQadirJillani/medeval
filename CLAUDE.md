# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build — also the only type-check gate ("Running TypeScript ...")
npm run start    # Serve production build
```

There are no tests in this project. **`npm run lint` is broken** — `next lint` was removed in
Next.js 16, so the script resolves to `next <dir>` and errors. `npx eslint .` also fails
(FlatCompat circular-structure bug with ESLint 9.33 + `eslint.config.mjs`). Verify changes with
`npm run build`, then inspect prerendered HTML under `.next/server/app/` (see Verifying, below).

## Architecture Overview

MedEval is a Next.js 16 (React 19) app for MBBS students — past papers, a book bank, system review
questions, hospital maps, and a performance tracker. It has **no backend, no auth, no API routes**.
All data lives in `Database/` and all user state lives in `localStorage`. Deployed to Vercel at
`med-eval.vercel.app`.

Scale: ~47.7k past-paper questions across 300 JSON files (5 years), ~4.9k System Review questions
across 17 JSX files (~20 MB), 90 books. A full build prerenders ~349 pages.

### Route Structure

Route groups (`(BookBank)`, `(PastPapers)`, `(SystemReview)`, `(Performance)`) are purely
organizational — they don't affect URLs. Folders prefixed with `_` (`_NavBar`, `_Homepage`,
`_QAFormat`, `_components`, `_assets`) are shared components, not routes.

| URL pattern | Route group | Description |
|---|---|---|
| `/PastPapers/[1st-year…5th-year]` | `(PastPapers)` | Module grid for a given year |
| `/PastPapers/[annual]/[module]/[year]` | `(PastPapers)/[...QA]` | Quiz session |
| `/SystemReview` | `(SystemReview)` | System selector grid |
| `/SystemReview/[system]` | `(SystemReview)/[QA]` | Quiz session |
| `/BookBank` | `(BookBank)` | Subject list |
| `/BookBank/[subject]` | `(BookBank)/[subject]` | Book cards for a subject |
| `/Maps` | `Maps/` | Interactive hospital map |
| `/Performance` | `(Performance)` | Quiz history dashboard |

Every `loading.tsx` is a one-liner: `export { default } from '@/app/_components/RouteLoader'`.
Also present: `app/robots.ts`, `app/sitemap.ts` (enumerates all quiz/book/system routes from the
same source lists), `app/not-found.tsx`.

### Past Papers routing (`app/(PastPapers)/pastPapers.ts`)

Module/tag discovery is **filesystem-driven** via `readdirSync` at build time:

- `MODULE_ORDER` — per-year module lists in curriculum order. **Names must match the
  `Database/PastPapers/<year>/` folder names exactly.** A mismatch is the single most likely way to
  break the build. Note the irregular names: 3rd/4th-year module repeats carry a `-2` suffix
  (`cardiovascular-2`, `reproductive-2`, …), and 3rd-year blood is foldered as `hematology`.
- `yearsFor(year, mod)` — surfaces only `YYYY` and `compiled` tags. Returns `[]` for a missing
  folder rather than throwing, so a stale `MODULE_ORDER` entry degrades to an empty tile instead of
  failing the build and 500ing the year page.
- `allRoutes()` — every `(year, module, tag)` tuple; feeds both `generateStaticParams` and
  `sitemap.ts`.

Adding a year means: a `Database/PastPapers/<year>/` folder, a `MODULE_ORDER` entry, a
`PastPapers/<year>/page.tsx` + `loading.tsx` (copy an existing year, change `ANNUAL`), an entry in
the `years` array in `app/_NavBar/Menu.tsx`, and artwork classes in `PastPaper.module.css`.

### Data Loading

All quiz and book data is loaded via dynamic `import()` at the server-component level — no fetch
calls, no API. The import paths resolve into `Database/`:

- Past Papers: `Database/PastPapers/[annual]/[module]/[module]-[year].json`
- System Review: `Database/SystemReview/[system].jsx`
- Book Bank: `Database/BookBank/[subject].json`

Any failed import redirects to `/` (the `catch` block calls `redirect("/")`).

### Data Shapes

**Past Papers question** (JSON):
```ts
{ id: number, info: string, question: string, answers: { option: string, bool: boolean }[] }
```
`info` is `"<year>/<module>/<tag>"`, e.g. `"1st-year/blood/2016"`. In `-compiled.json` files it also
records which years the question recurred in: `"1st-year/blood/compiled (2023, 2019, 2017)"`.
`Format.tsx` renders it as the quiz header with hyphens replaced by spaces.

**System Review question** (JSX default export):
```ts
{ id: number, info: string, question: string, difficulty: number, hint: string, answers: { option: string, explanation: string, bool: boolean }[] }
```

**Book Bank entry** (JSON):
```ts
{ title: string, authors: string, edition: string, tag: string, cover: string, fileID: string }
```
`fileID` is a Google Drive file ID — downloads go to
`https://drive.google.com/uc?export=download&id=${fileID}`. `cover` points into `public/covers/`.
`tag` is currently unused by the UI.

### QA Format Engine (`app/_QAFormat/`)

The shared quiz UI used by both Past Papers and SystemReview. `Format.tsx` is the `"use client"`
container that receives `data` from a server component page; it composes `Header`, `Question`,
`HintDifficulty`, `Options`, `Footer`, `ResumeModal` and `FinishModal`. All persistence lives in the
`useQuizPersistence.ts` hook (four effects), not in `Format.tsx`.

**localStorage keys** (all keyed by `pathname`):
- `${pathname}-module` — in-progress session (score, resumeIndex, totalQuestions, startDateTime,
  answers). Debounced 300ms on every state change; removed on finish.
- `${pathname}-performance` — **an array** of completed attempts, appended once per finish (guarded
  by a `recorded` ref). Reads tolerate the legacy single-object value.
- `${pathname}-reset` — presence flag that skips session restore (consumed and deleted on load).

Quiz state uses refs for things that must not trigger rerenders (`score`, `lock`, `resumeIndex`,
`recorded`). Navigation: ArrowLeft/ArrowRight, swipe via `react-swipeable`, and Back/Next/Finish.

`HintDifficulty` renders only when both `hint` and `difficulty` are present — i.e. System Review
only; Past Papers questions never have these fields.

`Options.tsx` sorts options by **descending string length**, so the longest option always renders
first. It's deterministic, which is what keeps persisted answer indices valid across a resume.

### Performance Dashboard

`(Performance)/Performance/page.tsx` is a client component that scans all `*-performance` keys from
localStorage on mount (flattening arrays) and sorts newest-first. `Performance.tsx` renders
`StatCard`s (average accuracy, total attempts), a `Graph`, an `Attempts` list, Overall / Last 30
days / Last 7 days filters (`date-fns`), and a "Clear all attempts" confirm dialog that deletes
every `*-performance` key.

`Graph.tsx` is a **recharts `AreaChart`** ("Accuracy Trend") grouping attempts by calendar day.
`Progress.tsx` is a hand-rolled SVG donut, reused by `FinishModal`.

### Theme

Dark mode is client-only. `layout.tsx` injects a blocking inline script that reads `localStorage`
key `theme` (`"true"`/`"false"`) and adds the `dark` class before paint, preventing a flash; `<html>`
carries `suppressHydrationWarning`. `_NavBar/Toggle.tsx` then syncs it, guarding its first write
with a `hydrated` ref so it can't clobber the stored value on mount. The dark variant in Tailwind is
`&:is(.dark *)` (defined in `globals.css`).

### Maps

`app/Maps/page.tsx` is 10 lines. The inline SVG hospital map lives in `HospitalMapSVG.tsx` (~2.2k
lines) and the ward route path data in `routes.ts`, where ~50 wards are deduped onto 9 shared
corridor paths. `Map.tsx` provides pan/zoom via `@panzoom/panzoom` plus a dropdown that injects an
animated red `<path>` and fits it to the viewBox.

### UI Components

shadcn/ui components are in `components/ui/` (button, card, carousel, chart, dialog,
navigation-menu, select, separator, sheet, switch); `chart.tsx` and `carousel.tsx` are unused
scaffolding — the app uses recharts and embla directly. `switch.tsx` is customized to render the
local `_NavBar/Sun`/`Moon` icons. `button.tsx` adds a `brand` variant used throughout.
`lib/utils.ts` exports the `cn` helper. Tailwind CSS v4 with `tw-animate-css`.

### Verifying changes (no test suite)

```bash
npm run build                                          # type-checks + prerenders everything
grep -o 'class="PastPaper-module__[^"]*"' .next/server/app/PastPapers/3rd-year.html
grep -o 'href="/PastPapers/5th-year/[^"]*"' .next/server/app/PastPapers/5th-year.html
```

Prerendered HTML under `.next/server/app/` is the cheapest way to confirm module tiles, artwork
classes and quiz links actually resolved. Note that each class name appears twice in that HTML —
once in the markup and once in the inlined RSC flight payload — so count `class="…"` matches, not
raw substrings.

For a full runtime sweep, `npx next start` and curl every route from `allRoutes()` plus the subject
and system lists (347 routes, all expected 200). Data-side invariants worth re-checking after any
`Database/` edit: every file parses and is a non-empty array, exactly one `bool: true` per question,
and option text unique within a question.

## Gotchas

- **`MODULE_ORDER` vs. folder names** — see above. `Database/` has been restructured independently
  of the code before (folders renamed to `-2`/`hematology`, a whole 5th year added), silently
  breaking the build at `generateStaticParams`.
- **Tile artwork is keyed by module name.** `PastPaper.tsx` does `styles[m]` against
  `PastPaper.module.css`, so each module folder needs a matching class there or it renders with the
  gradient frame and no background image. Hyphenated and digit-suffixed keys (`foundation-2`) work
  fine as CSS-module class names. Currently missing artwork: 5th-year `medicine-1/-2`,
  `surgery-1/-2`, `pediatrics` — `_assets/images-transparent/` has no suitable asset for them.
- **`PastPaper.tsx` splits module names on `_`**, but the data uses `-`, so `head-and-neck` renders
  literally as "head-and-neck" rather than "Head & Neck".
- **`public/` shadows app route handlers.** A static `public/robots.txt` silently overrode
  `app/robots.ts` for months (so the `Sitemap:` directive was never served) until it was deleted.
  Never add `public/robots.txt` or `public/sitemap.xml`.
- **Quiz scoring is answer-derived, not navigation-derived.** `Options.tsx` computes
  `alreadyAnswered` from `clickedOption`; `lock` is only a synchronous latch against two clicks in
  one render, and `Back`/`Next` just clear it. Don't go back to direction-based locking — setting
  `lock = true` in `Back` made questions the student *skipped* unscoreable on return.
- **Known data defects** (content fixes need domain knowledge, so they're unresolved): 18 questions
  carry the same option text twice, 4 have an empty-string option, and
  `5th-year/gynecology` 2013 id=60 has zero correct answers so it can never be scored. Each also
  appears in that module's `-compiled.json`. Option text must stay unique per question and exactly
  one answer needs `bool: true`.
- **System Review is built but hidden** — its nav link is commented out in `_NavBar/Menu.tsx`, yet
  the routes prerender and `sitemap.ts` still publishes all 17 systems.
- `globals.css` carries ~180 lines of `#legacy` styles that nothing uses — no `id="legacy"` exists
  in `app/` or `Database/`.
- `README.md` is still the untouched create-next-app default.
