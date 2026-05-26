# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint via next lint
```

There are no tests in this project.

## Architecture Overview

MedEval is a Next.js 16 (React 19) app for MBBS students — past papers, a book bank, system review questions, hospital maps, and a performance tracker. It has **no backend, no auth, no API routes**. All data lives in `Database/` and all user state lives in `localStorage`.

### Route Structure

Route groups (`(BookBank)`, `(PastPapers)`, `(SystemReview)`, `(Performance)`) are purely organizational — they don't affect URLs. Folders prefixed with `_` (`_NavBar`, `_Homepage`, `_QAFormat`, `_assets`) are shared components, not routes.

| URL pattern | Route group | Description |
|---|---|---|
| `/PastPapers/[1st-year\|2nd-year\|3rd-year\|4th-year]` | `(PastPapers)` | Module grid for a given year |
| `/PastPapers/[annual]/[module]/[year]` | `(PastPapers)/[...QA]` | Quiz session |
| `/SystemReview` | `(SystemReview)` | System selector grid |
| `/SystemReview/[system]` | `(SystemReview)/[QA]` | Quiz session |
| `/BookBank` | `(BookBank)` | Subject list |
| `/BookBank/[subject]` | `(BookBank)/[subject]` | Book cards for a subject |
| `/Maps` | `Maps/` | Interactive hospital map |
| `/Performance` | `(Performance)` | Quiz history dashboard |

### Data Loading

All quiz and book data is loaded via dynamic `import()` at the server-component level — no fetch calls, no API. The import paths resolve into `Database/`:

- Past Papers: `Database/PastPapers/[annual]/[module]/[module]-[year].json`
- System Review: `Database/SystemReview/[system].jsx`
- Book Bank: `Database/BookBank/[subject].json`

Any failed import redirects to `/` (the `catch` block calls `redirect("/")`).

### Data Shapes

**Past Papers question** (JSON):
```ts
{ id: number, info: string, question: string, answers: { option: string, bool: boolean }[] }
```

**System Review question** (JSX default export):
```ts
{ id: number, info: string, question: string, difficulty: number, hint: string, answers: { option: string, explanation: string, bool: boolean }[] }
```

**Book Bank entry** (JSON):
```ts
{ title: string, authors: string, edition: string, tag: string, cover: string, fileID: string }
```
`fileID` is a Google Drive file ID — downloads go to `https://drive.google.com/uc?export=download&id=${fileID}`.

### QA Format Engine (`app/_QAFormat/Format.tsx`)

The single shared quiz UI used by both Past Papers and SystemReview. It is a `"use client"` component that receives `data` from a server component page.

**localStorage keys** (all keyed by `pathname`):
- `${pathname}-module` — in-progress session (index, score, answers, startDateTime). Debounced 300ms on every state change.
- `${pathname}-performance` — completed attempt record (score, totalQuestions, finishDateTime). Written on quiz finish.
- `${pathname}-reset` — presence flag that skips session restore (consumed and deleted on load).

Navigation: ArrowLeft/ArrowRight keyboard, swipe gestures via `react-swipeable`, and Back/Next/Finish buttons.

System Review questions optionally render `HintDifficulty` when both `hint` and `difficulty` fields are present; Past Papers questions never have these fields.

### Theme

Dark mode is managed entirely client-side. `Toggle.tsx` reads/writes `localStorage` key `theme` (`"true"`/`"false"`) and toggles the `dark` class on `<html>`. The `<html>` element starts with `data-theme='false'` in `layout.tsx`. The dark variant in Tailwind is `&:is(.dark *)` (defined in `globals.css`).

### UI Components

shadcn/ui components are in `components/ui/` (button, card, carousel, chart, dialog, navigation-menu, select, separator, sheet, switch). `lib/utils.ts` exports the `cn` helper. The project uses Tailwind CSS v4 with `tw-animate-css`.

### Maps

`app/Maps/page.tsx` is a very large file (~440 KB) containing an inline SVG hospital map. `app/Maps/Map.tsx` provides pan/zoom via `@panzoom/panzoom` and a dropdown to highlight ward routes (SVG path data is hardcoded in `Map.tsx`).

### Performance Dashboard

`(Performance)/Performance/page.tsx` is a client component that reads all `*-performance` keys from localStorage on mount. `(Performance)/Performance.tsx` renders stats (average accuracy, total attempts), a Recharts bar graph, and an attempts list, filterable by Overall / Last 30 days / Last 7 days.
