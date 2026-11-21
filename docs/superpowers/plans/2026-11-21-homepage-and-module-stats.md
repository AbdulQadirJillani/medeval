# Homepage Continue Strip, Hero Links & Per-Module Accuracy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Continue where you left off" strip to the homepage, make the hero's feature cards and 1st–5th Year buttons clickable, and show per-module accuracy (Weakest card + By-module list) on Performance.

**Architecture:** Three small pure modules hold all the logic: `lib/papers.ts` (labels), `app/_Homepage/sessions.ts` (reading in-progress sessions) and `app/(Performance)/moduleStats.ts` (grouping attempts). They have no runtime imports, so a throwaway `node --test` file can check them. Thin client components (`ContinueStrip`, `ModuleList`) render them; `Hero` stays a server component. `useQuizPersistence` gains one additive `updatedAt` field.

**Tech Stack:** Next.js 16 / React 19, Tailwind v4 (+ `tw-animate-css`), shadcn `Dialog`/`Button`/`Card`, lucide-react. Logic is checked with `node --test` (Node 24 strips TS types natively). UI is checked with `npm run build` plus Playwright MCP against a production `npx next start`.

**Spec:** `docs/superpowers/specs/2026-11-21-homepage-and-module-stats-design.md`

## Global Constraints

- No new npm dependencies.
- localStorage: key names unchanged. The only shape change is an **optional, additive** `updatedAt` on `${pathname}-module`. Readers must treat it as optional and fall back to `startDateTime`.
- Discard removes `${pathname}-module` only, never `${pathname}-performance`.
- Pure modules (`lib/papers.ts`, `sessions.ts`, `moduleStats.ts`) use only `import type` (erased by Node) so `node --test` can load them; no `@/` runtime imports inside them.
- Match each file's existing style (2-space indent, no semicolons). Comments only where the why isn't obvious.
- `npm run lint` is broken by design; `npm run build` is the type-check gate. Persistence is checked against a production build, not dev (Strict Mode double effects).
- Work on branch `homepage-and-stats`. Commit only the files a task names: Playwright MCP writes into `.playwright-mcp/`, so delete it and never `git add -A`. `docs/` stays uncommitted (same as piece A).
- `$SCRATCH` = `<scratch>`. The test file lives there and is not committed.

## Review Focus

1. **Old or broken saved sessions:** a `-module` value without `updatedAt`, one with unparseable JSON, one with no `answers`, and one where `answers` is `[]` (any paper you merely open writes one). The first sorts by `startDateTime`; the other three are skipped without throwing (Task 1 tests).
2. **New visitor / nothing unfinished:** the strip renders nothing (no heading, no empty box) and the server HTML for `/` contains no strip markup, so there's no hydration mismatch (Task 1, Step 8).
3. **Discard edge:** discarding the last row removes the whole strip; reopening that paper starts fresh with no Resume dialog; its Performance attempts are still there (Task 1, Step 8).
4. **Odd attempt history:** a legacy single-object `-performance` value (already flattened by the page), `finishDateTime` as an ISO string, several attempts on one paper (only the newest counts), and an attempt with `totalQuestions: 0` (no NaN%) (Task 3 tests).
5. **Phone width (390px):** the longest labels ("4th Year · Otorhinolaryngology · compiled", Weakest = "Otorhinolaryngology 54%") wrap instead of scrolling sideways; the five year buttons wrap; the × stays tappable (Tasks 1–3 browser checks).

---

### Task 1: Continue strip (#10)

**Files:**
- Create: `lib/papers.ts`
- Create: `app/_Homepage/sessions.ts`
- Create: `app/_Homepage/ContinueStrip.tsx` (`"use client"`)
- Modify: `app/_QAFormat/useQuizPersistence.ts` (both branches of the debounced save)
- Modify: `app/page.tsx` (render `<ContinueStrip />` above `<Hero />`)
- Test (not committed): `$SCRATCH/pieceB.test.ts`

**Interfaces:**
- Produces, in `lib/papers.ts`:
  - `labelParts(path: string): string[]` splits on `/` and drops empties. A leading `PastPapers` is dropped; `SystemReview` becomes `"System Review"`. Each remaining segment has hyphens turned into spaces and every word capitalised, except `and`, which stays lowercase.
  - `paperLabel(path: string): string` is `labelParts(path).join(" · ")`.
- Produces, in `app/_Homepage/sessions.ts`:
  - `export type Session = { pathname: string, score: number, totalQuestions: number, answers: Clicked, updated: number }` (`Clicked` via `import type` from `../_QAFormat/types`)
  - `unfinishedSessions(entries: [string, string | null][]): Session[]`. It keeps keys that start with `/PastPapers/` and end with `-module`. Values that fail `JSON.parse`, lack a numeric `totalQuestions`, or whose `answers` is not a non-empty array are dropped. `pathname` is the key minus `-module`. `updated` is `Date.parse(obj.updatedAt ?? obj.startDateTime)`, or `0` if NaN. Output is sorted by `updated`, newest first.
- Consumes: `resumeIndexFor(clicked, total)` from `app/_QAFormat/quizLogic.ts`, used in the component, not in `sessions.ts`.

- [ ] **Step 1: Create the branch.** Run: `git checkout -b homepage-and-stats`

- [ ] **Step 2: Write the failing tests** in `$SCRATCH/pieceB.test.ts` (imports by absolute path from the repo, e.g. `<repo>/lib/papers.ts`):

```ts
test("paperLabel", () => {
  assert.equal(paperLabel("/PastPapers/2nd-year/renal-2/2024"), "2nd Year · Renal 2 · 2024")
  assert.equal(paperLabel("/PastPapers/2nd-year/head-and-neck/compiled"), "2nd Year · Head and Neck · Compiled")
  assert.equal(paperLabel("/SystemReview/cardiovascular"), "System Review · Cardiovascular")
  assert.deepEqual(labelParts("/PastPapers/1st-year/blood"), ["1st Year", "Blood"])
})

test("unfinishedSessions filters and sorts", () => {
  const s = (o: object) => JSON.stringify({ score: 1, totalQuestions: 10, answers: [{ questionIndex: 0, optionIndex: [1] }], ...o })
  const out = unfinishedSessions([
    ["/PastPapers/1st-year/blood/2016-module", s({ startDateTime: "2026-11-01T00:00:00Z" })],   // legacy: no updatedAt
    ["/PastPapers/2nd-year/renal/2024-module", s({ startDateTime: "2026-10-01T00:00:00Z", updatedAt: "2026-11-20T00:00:00Z" })],
    ["/PastPapers/1st-year/blood/2017-module", s({ answers: [] })],      // opened, never answered
    ["/PastPapers/1st-year/blood/2018-module", "{not json"],
    ["/PastPapers/1st-year/blood/2019-module", s({ answers: undefined })],
    ["/SystemReview/renal-module", s({})],
    ["/PastPapers/1st-year/blood/2016-performance", "[]"],
    ["theme", "true"],
  ])
  assert.deepEqual(out.map(x => x.pathname), ["/PastPapers/2nd-year/renal/2024", "/PastPapers/1st-year/blood/2016"])
  assert.equal(out[1].updated, Date.parse("2026-11-01T00:00:00Z"))
})
```

- [ ] **Step 3: Run to verify they fail.** Run: `node --test $SCRATCH/pieceB.test.ts`. Expected: FAIL (module not found).

- [ ] **Step 4: Implement `lib/papers.ts` and `app/_Homepage/sessions.ts`** per the Interfaces above.

- [ ] **Step 5: Run to verify they pass.** Run: `node --test $SCRATCH/pieceB.test.ts`. Expected: all pass.

- [ ] **Step 6: Write `updatedAt`.** In `useQuizPersistence.ts`, set `obj.updatedAt = new Date()` in the update branch and add `updatedAt: new Date()` to the created object. Nothing else in the hook changes. Opening a paper with restored answers bumps it too; that counts as "worked on recently".

- [ ] **Step 7: Build `ContinueStrip.tsx` and mount it in `app/page.tsx` above `<Hero />`.**
  - On mount, read every `localStorage` key into `[key, getItem(key)]` pairs, then call `unfinishedSessions`. State starts `null`; render `null` while `null` or empty.
  - Wrapper: `w-[85%] mx-auto mt-5`, fade-in (`animate-in fade-in duration-500`). Heading "Continue where you left off".
  - Rows sit in one `rounded-xl ring ring-accent divide-y` box, like `Attempts`. Each row is a `Link` to `pathname` with:
    - line 1: `paperLabel(pathname)`, using the gradient text from `Attempts`;
    - line 2: `Q {Math.min(resumeIndexFor(answers, totalQuestions) + 1, totalQuestions)} / {totalQuestions} · {score} of {answers.length} right`;
    - a `ChevronRight`.
    The `×` is a sibling `button` next to the `Link` (never nested in it), with `aria-label="Discard progress for {label}"`.
  - Show the first 3 rows. When there are more than 3, a `Show all ({n}) ▾` button reveals the rest; there's no collapse back.
  - Discard uses one controlled shadcn `Dialog` (state: the pending `Session` or `null`). Title "Discard progress?", description "Your answers on {label} will be deleted. Past attempts on Performance are kept." Buttons "Cancel" (outline) and "Discard" (destructive). Discard runs `localStorage.removeItem(\`${pathname}-module\`)` and drops the row from state.

- [ ] **Step 8: Verify in a production build.** Run `npm run build` (expect success), then `npx next start` in the background. Use Playwright MCP:
  1. With a fresh profile (`localStorage.clear()`, reload), `/` shows no strip. Also run `curl -s localhost:3000/ | grep -c "Continue where"`; expect `0`.
  2. Answer 2 questions on `/PastPapers/2nd-year/renal/2024`, merely open `/PastPapers/1st-year/blood/2016`, then go to `/`. Exactly one row, "2nd Year · Renal · 2024", "Q 3 / N · x of 2 right". Clicking it opens the Resume dialog.
  3. Seed 5 sessions with `browser_evaluate`. 3 rows plus "Show all (5)" show; clicking it shows 5.
  4. Discard every row via × → Discard. The strip disappears. Reopening one of those papers shows no Resume dialog, and its earlier `-performance` key still exists.
  5. At 390px width, check that long labels wrap without horizontal page scroll (`document.documentElement.scrollWidth <= 390`).
  Stop the server, then `rm -rf .playwright-mcp`.

- [ ] **Step 9: Commit**

```bash
git add lib/papers.ts app/_Homepage/sessions.ts app/_Homepage/ContinueStrip.tsx app/_QAFormat/useQuizPersistence.ts app/page.tsx
git commit -m "Add Continue where you left off strip to the homepage"
```

---

### Task 2: Clickable hero cards and year buttons (#11)

**Files:**
- Modify: `app/_Homepage/Hero.tsx` (stays a server component)

**Interfaces:** none produced. It uses `Button` (`variant="brand"`, `asChild`) and `next/link`.

- [ ] **Step 1: Add the year buttons.** Under the subtitle `<p>`, add `<div id="years" className="mt-6 flex flex-wrap gap-2 justify-center md:justify-start scroll-mt-24">` with five `Button asChild variant="brand"` → `Link href="/PastPapers/{y}"`, labelled `1st Year` … `5th Year`. The year list is a local const matching `Menu.tsx`.

- [ ] **Step 2: Make the cards links.** Add `href` to each `features` entry: Past Papers `#years`, Book Bank `/BookBank`, Maps `/Maps`. Wrap each `Card` in `Link` (`className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"`; the key moves to the `Link`). The card gets `h-full hover:-translate-y-1 transition`, keeping the existing shadow classes.

- [ ] **Step 3: Verify.** Run `npm run build`; expect success. Then check:
  - `grep -o 'href="/PastPapers/[1-5][a-z]*-year"' .next/server/app/index.html | sort -u` lists 5 hrefs.
  - `grep -c 'href="#years"' .next/server/app/index.html` is ≥ 1.
  - In the browser, clicking the Past Papers card scrolls the year buttons into view below the navbar, and Tab reaches each card with a visible ring.
  - At 390px the buttons wrap with no sideways scroll.
  Then `rm -rf .playwright-mcp`.

- [ ] **Step 4: Commit**

```bash
git add app/_Homepage/Hero.tsx
git commit -m "Make homepage feature cards links and add 1st-5th Year buttons to the hero"
```

---

### Task 3: Per-module accuracy on Performance (#13)

**Files:**
- Create: `app/(Performance)/moduleStats.ts`
- Create: `app/(Performance)/ModuleList.tsx`
- Modify: `app/(Performance)/StatCard.tsx` (optional `subtitle`)
- Modify: `app/(Performance)/Performance.tsx` (third card, grid, list placement)
- Test (not committed): `$SCRATCH/pieceB.test.ts` (append)

**Interfaces:**
- Produces, in `moduleStats.ts` (`import type` from `./types`):
  - `export type ModuleStat = { key: string, score: number, total: number, percent: number, papers: number }`
  - `moduleKey(pathname: string): string`. For `/PastPapers/<y>/<m>/<tag>` it drops the last segment, giving `/PastPapers/<y>/<m>`. Any other path is returned unchanged, so `/SystemReview/<s>` is its own module.
  - `moduleStats(data: PerformanceData): ModuleStat[]`:
    - per `pathname`, keep only the entry with the greatest `new Date(finishDateTime).getTime()`;
    - group the kept entries by `moduleKey` and sum `score` and `totalQuestions`;
    - `papers` = number of kept entries in the group;
    - `percent` = `total > 0 ? score / total * 100 : 0`;
    - sort by `percent` ascending, then `key` ascending.
  - `weakestModule(stats: ModuleStat[], minQuestions = 20): ModuleStat | undefined` returns the first stat with `total >= minQuestions`.
- Consumes: `labelParts`, `paperLabel` from `lib/papers.ts` (Task 1), in the components only.
- `StatCard` gains `subtitle?: string`, rendered as small muted text under the value.

- [ ] **Step 1: Append the failing tests:**

```ts
const e = (pathname: string, score: number, totalQuestions: number, finishDateTime: string) =>
  ({ pathname, score, totalQuestions, finishDateTime: finishDateTime as unknown as Date })

test("moduleStats keeps the latest attempt per paper and pools by module", () => {
  const stats = moduleStats([
    e("/PastPapers/2nd-year/renal/2024", 10, 40, "2026-11-01T00:00:00Z"),
    e("/PastPapers/2nd-year/renal/2024", 30, 40, "2026-11-10T00:00:00Z"),   // newer: this one counts
    e("/PastPapers/2nd-year/renal/compiled", 50, 100, "2026-11-05T00:00:00Z"),
    e("/PastPapers/1st-year/blood/2016", 9, 10, "2026-11-02T00:00:00Z"),
    e("/SystemReview/renal", 0, 0, "2026-11-03T00:00:00Z"),
  ])
  assert.deepEqual(stats.map(s => [s.key, s.score, s.total, s.papers]), [
    ["/SystemReview/renal", 0, 0, 1],
    ["/PastPapers/2nd-year/renal", 80, 140, 2],
    ["/PastPapers/1st-year/blood", 9, 10, 1],
  ])
  assert.equal(stats[0].percent, 0)
  assert.ok(Math.abs(stats[1].percent - 57.142857) < 1e-4)
})

test("weakestModule skips modules under the question threshold", () => {
  const stats = moduleStats([
    e("/PastPapers/1st-year/blood/2016", 1, 5, "2026-11-01T00:00:00Z"),
    e("/PastPapers/2nd-year/renal/2024", 15, 20, "2026-11-01T00:00:00Z"),
  ])
  assert.equal(weakestModule(stats)?.key, "/PastPapers/2nd-year/renal")
  assert.equal(weakestModule([]), undefined)
})
```

- [ ] **Step 2: Run to verify they fail.** Run: `node --test $SCRATCH/pieceB.test.ts`. Expected: the new tests FAIL, Task 1's still pass.

- [ ] **Step 3: Implement `moduleStats.ts`** per the Interfaces.

- [ ] **Step 4: Run to verify they pass.** Same command; all pass.

- [ ] **Step 5: Build the UI.**
  - **`ModuleList.tsx`:**
    - props `{ stats: ModuleStat[] }`; render `null` when empty;
    - heading "By module" with muted "weakest first";
    - each row shows `paperLabel(key)`, a bar track (`bg-accent`, fill `bg-brand` at `width: ${percent}%`), `${Math.round(percent)}%`, and `` `${papers} paper${papers === 1 ? "" : "s"}` ``;
    - rows inside a `rounded-xl ring ring-accent` box, like `Attempts`; labels wrap (`break-words min-w-0`).
  - **`Performance.tsx`:**
    - compute `const stats = moduleStats(perfList)` and `const weakest = weakestModule(stats)`;
    - change the card grid to `grid grid-cols-2 sm:grid-cols-3 gap-6`;
    - add a third `StatCard` (`className` wrapper or prop so it spans `col-span-2 sm:col-span-1`), titled "Weakest module" with the `TrendingDown` icon. Its value is `` `${labelParts(weakest.key).at(-1)} ${Math.round(weakest.percent)}%` `` and its subtitle is `labelParts(weakest.key).slice(0, -1).join(" · ")`; without a weakest module, the value is `"—"` and there's no subtitle;
    - render `<ModuleList stats={stats} />` between `<Graph>` and `<Attempts>`.
  - **`StatCard.tsx`:** accept `subtitle` and a `className` passthrough on the `Card`; the value gets `break-words`.

- [ ] **Step 6: Verify.** Run `npm run build` (expect success), then `npx next start`. Seed `-performance` keys via Playwright `browser_evaluate`:
  - two Renal 2024 attempts, the newer 30/40;
  - Renal compiled 50/100;
  - Blood 2016 9/10, dated 40 days ago;
  - `/PastPapers/4th-year/otorhinolaryngology/compiled` 20/100 as a legacy single object, not an array.
  Then check:
  - **Overall:** Weakest is "Otorhinolaryngology 20%" with subtitle "4th Year". The list order is Otorhinolaryngology, Renal (57%, 2 papers), Blood (90%, 1 paper).
  - **Last 30 days:** Blood is gone from the list.
  - **Clear all attempts:** the Weakest card and list disappear along with the rest (the page shows its empty state on reload).
  - **390px:** no sideways scroll; the Weakest card spans full width.
  Stop the server, then `rm -rf .playwright-mcp`.

- [ ] **Step 7: Commit**

```bash
git add "app/(Performance)/moduleStats.ts" "app/(Performance)/ModuleList.tsx" "app/(Performance)/StatCard.tsx" "app/(Performance)/Performance.tsx"
git commit -m "Show per-module accuracy and weakest module on Performance"
```

---

### Task 4: Docs and final check

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update `CLAUDE.md`.**
  - Performance Dashboard: add the Weakest card and By-module list (latest attempt per paper, pooled, ≥ 20-question threshold, `moduleStats.ts`).
  - localStorage keys: `-module` now also carries optional `updatedAt`.
  - New "Homepage" note: `ContinueStrip` reads `/PastPapers/*-module` with ≥ 1 answer; the hero's year buttons and card links; `lib/papers.ts` labels.

- [ ] **Step 2: Full check.** Run `npm run build`; expect success with the same page count as `main` (~413). Run `node --test $SCRATCH/pieceB.test.ts`; all pass. Run `git status --short`; only `docs/` is untracked, and nothing from `.playwright-mcp/` is present.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Update CLAUDE.md for the homepage strip and per-module stats"
```
