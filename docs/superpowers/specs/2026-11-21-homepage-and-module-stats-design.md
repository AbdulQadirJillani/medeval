# Homepage continue strip, hero links & per-module accuracy

Piece B of the 2026-11-21 UI/UX pass (A quiz upgrades done; C bookmarks, D search follow).

## Why

Returning students land on a marketing-style homepage with no way back into the paper they were
halfway through, and the hero's feature cards look clickable but aren't. On Performance they see
one overall average, which says nothing about *which* module needs work.

## Goals

1. **#10 Continue strip** at the very top of the homepage (above the hero).
   - Lists Past Papers sessions (`/PastPapers/...-module` keys) with at least one answer.
     Visiting a paper writes a `-module` key even with zero answers; those are ignored.
   - Newest first by a new `updatedAt` field; sessions saved before this change fall back to
     `startDateTime`.
   - Row: `2nd Year · Renal · 2024` / `Q 34 / 81 · 22 of 33 right` / `→`. "Q" is the resume
     position (`resumeIndexFor(answers) + 1`, clamped to total); "of 33" is the number answered.
     Tapping the row opens the paper; the existing Resume dialog takes over.
   - Shows 3 rows; `Show all (N) ▾` expands the rest (hidden when N ≤ 3).
   - Each row has a `×` → "Discard progress?" confirm dialog → removes that paper's `-module`
     key only (never its `-performance` history). Strip disappears when the last row goes.
   - Renders nothing until mounted, and nothing for visitors with no unfinished papers.
2. **#11 Hero links.**
   - Under the subtitle: five buttons `1st Year … 5th Year` → `/PastPapers/<year>`, `brand` variant,
     wrapping on phones. Container has `id="years"`.
   - Feature cards become links: Past Papers → `#years` (scroll to the buttons), Book Bank →
     `/BookBank`, Maps → `/Maps`. Hover lift + visible focus ring.
3. **#13 Per-module accuracy** on Performance, following the Overall / 30 / 7-day tabs.
   - Per paper (pathname) keep only the **latest** attempt in the filtered set; group papers by
     module (`<year>/<module>` for Past Papers, `<system>` for System Review); module % =
     Σ score ÷ Σ totalQuestions. Compiled papers count like any other paper.
   - Third stat card **Weakest module: Renal 54%** (2nd-year label in the subtitle). Only modules
     with ≥ 20 questions in the pool are eligible; if none are, the card shows `—`.
   - **By module** list between the graph and the attempts list, weakest first: label, bar, %,
     `3 papers`. All modules listed, regardless of the 20-question threshold.

## Non-goals

- System Review in the continue strip (its nav link is hidden).
- Any change to how attempts are recorded or scored; any new `/PastPapers` index page.
- A study calendar (declined), tile progress badges (declined).

## Anti-goals

- Breaking sessions already saved in students' browsers (the `updatedAt` field is additive and
  optional on read).
- A layout where the strip flashes for new visitors or the hero renders differently on the server.

## Constraints

- No new dependencies. No backend: all data from `localStorage`.
- Verify via `npm run build` + a production `next start` (Strict Mode double effects in dev).

## Approaches

| | Approach | Trade-off | |
|---|---|---|---|
| 1 | **Small separate pieces**: `_Homepage/ContinueStrip.tsx` (client), server `Hero` with `Link`s, pure `moduleStats()` + `ModuleList.tsx` in `(Performance)/`, one shared paper-label helper, `updatedAt` written by `useQuizPersistence` | Small diff; leaves the just-fixed quiz persistence alone | **Chosen** |
| 2 | Central `lib/storage.ts` for all localStorage access first | Groundwork for C, but rewrites persistence code for no gain in B | Rejected |
| 3 | Server-render the strip | Impossible: the data exists only in the browser | Rejected |

## Builder's calls (marked as mine, correct if wrong)

- Label helper: `"/PastPapers/2nd-year/renal-2/2024"` → `2nd Year · Renal 2 · 2024`
  (hyphens → spaces, title case); System Review → `System Review · <System>`.
- Strip fades in after mount (it pushes the hero down; accepted since it's only for returning users).
- Stat-card grid: 2 columns on phones with Weakest spanning both; 3 columns from `sm`.
- Corrupt/unparseable `-module` values are skipped, not thrown.
