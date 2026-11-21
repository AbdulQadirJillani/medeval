# Bookmarks & Saved Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let students bookmark any quiz question (icon, S key, dots in the map), list them on a `/Saved` page grouped by module, practise them as a shuffled practice-only quiz, and open any question in its paper via a `#q=N` link.

**Architecture:** All bookmark logic is pure functions in `app/_QAFormat/bookmarks.ts` over one `bookmarks` localStorage array that stores a full copy of each question (spec approach A). A thin `useBookmarks` hook reads/writes it and keeps every mounted reader in sync. `Format` gains an optional `practice` prop that turns persistence off and swaps the finish-screen buttons. `/Saved` is one client page that shows the list, or the quiz when `?practise=` is set.

**Tech Stack:** Next.js 16 / React 19, Tailwind v4, shadcn `Dialog`/`Button`/`Sheet`, lucide-react (`Bookmark` icon). Logic is checked with `node --test` (Node 24 strips TS types natively). UI is checked with `npm run build` plus Playwright MCP against a production `npx next start`.

**Spec:** `docs/superpowers/specs/2026-11-22-bookmarks-saved-design.md`

## Global Constraints

- No new npm dependencies.
- New localStorage key `bookmarks` (array, newest first) and window event `bookmarks-change`. No existing key changes name or shape.
- The Saved quiz writes **no** `-module` or `-performance` key, and opens no Resume popup.
- Option order stays `sortOptions` (longest first); stored question copies are re-sorted by `Options` exactly like live ones.
- The "open at question" link is `<quiz path>#q=N`, 1-based. Never `?q=` (that would force a Suspense boundary onto every prerendered quiz).
- Pure modules (`bookmarks.ts`, `quizLogic.ts`) use only `import type`, so `node --test` can load them.
- Match each file's existing style (2-space indent, no semicolons). Comments only where the why isn't obvious.
- `npm run lint` is broken by design; `npm run build` is the type-check gate. Persistence is checked against a production build, not dev (Strict Mode double effects).
- Work on branch `bookmarks-saved`. Commit only the files a task names: Playwright MCP writes into `.playwright-mcp/`, so delete it and never `git add -A`. `docs/` stays uncommitted (same as pieces A and B).
- `$SCRATCH` = `<scratch>`. The test file lives there and is not committed.

## Review Focus

1. **Open in paper on a half-done paper:** it lands on Q N with answers restored and **no** Resume popup. That must hold for an in-app `Link` click from `/Saved`, not just a typed URL. A reload afterwards behaves normally (Resume popup, because the hash was stripped). `#q=0`, `#q=999`, `#q=abc` are ignored (Task 1 tests, Task 3 check).
2. **Saved quiz leaves no trace:** after starting, answering and finishing a Saved quiz, no localStorage key ending in `-module` or `-performance` contains `Saved`. Performance and the homepage Continue strip are unchanged (Task 4 check).
3. **Corrupt `bookmarks` value:** `{not json`, an object, or entries missing `question`/`path`. The Saved page shows only valid entries (or the empty state) without crashing, and the next toggle writes a clean array (Task 1 tests, Task 4 check).
4. **Set changes under a run:** un-bookmarking mid-run keeps the question in the run. A `?practise=<module>` URL with no saves left goes back to the list. "Remove the N I got right" counts only still-saved ones and disappears after use (Task 4 check).
5. **Phone width (390px):** the quiz header row (long paper label + bookmark + counter pill) and Saved rows with long question text wrap or clamp without horizontal page scroll (Tasks 2 and 4 checks).

---

### Task 1: Pure bookmark and hash logic

**Files:**
- Create: `app/_QAFormat/bookmarks.ts`
- Modify: `app/_QAFormat/types.ts` (add `QuestionRef`)
- Modify: `app/_QAFormat/quizLogic.ts` (add `parseQuestionHash`)
- Test (not committed): `$SCRATCH/pieceC.test.ts`

**Interfaces:**
- Produces, in `types.ts`: `export type QuestionRef = { path: string, id: number, index: number }`
- Produces, in `bookmarks.ts` (type imports from `./types` only):
  - `export const BOOKMARKS_KEY = "bookmarks"`, `export const BOOKMARKS_EVENT = "bookmarks-change"`
  - `export type Bookmark = QuestionRef & { savedAt: string, question: Question }`
  - `export type BookmarkGroup = { key: string, items: Bookmark[] }`
  - `parseBookmarks(raw: string | null): Bookmark[]`. Returns `[]` for null, bad JSON or a non-array. Keeps an entry only if `path` is a string, `id`/`index` are finite numbers, `savedAt` is a string, and `question` is an object with a string `question` and an array `answers`. Preserves order.
  - `isSaved(list: Bookmark[], ref: { path: string, id: number }): boolean`. Identity is `path + id`.
  - `toggleBookmark(list: Bookmark[], ref: QuestionRef, question: Question, now: Date): Bookmark[]`. Removes the entry if saved, otherwise **prepends** `{ ...ref, savedAt: now.toISOString(), question }`. Never mutates `list`.
  - `removeBookmarks(list: Bookmark[], refs: { path: string, id: number }[]): Bookmark[]`
  - `groupBookmarks(list: Bookmark[], keyOf: (path: string) => string): BookmarkGroup[]`. Groups are ordered by their newest `savedAt`, newest first. Within a group, items are sorted by `path` (`localeCompare` with `{ numeric: true }`), then `index`.
  - `buildRun(list: Bookmark[], scope: string, keyOf: (path: string) => string, rand?: () => number): Bookmark[]`. `scope === "all"` takes every bookmark; otherwise it takes those whose `keyOf(path) === scope`. Returns a Fisher–Yates shuffled copy; `rand` defaults to `Math.random`.
- Produces, in `quizLogic.ts`: `parseQuestionHash(hash: string, total: number): number | null`. It matches only `#q=<digits>`. N in `1..total` returns the 0-based `N - 1`; anything else returns `null`.

- [ ] **Step 1: Create the branch.** Run: `git checkout -b bookmarks-saved`

- [ ] **Step 2: Write the failing tests** in `$SCRATCH/pieceC.test.ts`. Import by absolute repo path: `bookmarks.ts`, `quizLogic.ts`, and `moduleKey` from `app/(Performance)/moduleStats.ts`.

```ts
const q = (id: number) => ({ id, info: "x", question: `Q${id}`, answers: [{ option: "a", bool: true }] })
const ref = (path: string, id: number) => ({ path, id, index: id })
const now = (d: string) => new Date(d)

test("toggleBookmark adds newest-first and removes by path+id", () => {
  let l = toggleBookmark([], ref("/PastPapers/1st-year/blood/2016", 3), q(3), now("2026-11-01T00:00:00Z"))
  l = toggleBookmark(l, ref("/PastPapers/1st-year/blood/compiled", 3), q(3), now("2026-11-02T00:00:00Z"))
  assert.deepEqual(l.map(b => b.path), ["/PastPapers/1st-year/blood/compiled", "/PastPapers/1st-year/blood/2016"])
  assert.equal(l[1].savedAt, "2026-11-01T00:00:00.000Z")
  assert.ok(isSaved(l, { path: "/PastPapers/1st-year/blood/2016", id: 3 }))
  l = toggleBookmark(l, ref("/PastPapers/1st-year/blood/2016", 3), q(3), now("2026-11-03T00:00:00Z"))
  assert.equal(l.length, 1)
  assert.equal(isSaved(l, { path: "/PastPapers/1st-year/blood/2016", id: 3 }), false)
})

test("parseBookmarks drops junk", () => {
  assert.deepEqual(parseBookmarks(null), [])
  assert.deepEqual(parseBookmarks("{not json"), [])
  assert.deepEqual(parseBookmarks('{"a":1}'), [])
  const good = { path: "/SystemReview/renal", id: 2, index: 2, savedAt: "2026-11-01T00:00:00Z", question: q(2) }
  const raw = JSON.stringify([good, { ...good, question: undefined }, { ...good, path: 5 }, { ...good, id: "2" }, null])
  assert.deepEqual(parseBookmarks(raw), [good])
})

test("groupBookmarks orders groups by newest save and rows like the paper", () => {
  const b = (path: string, id: number, savedAt: string) => ({ path, id, index: id, savedAt, question: q(id) })
  const groups = groupBookmarks([
    b("/PastPapers/2nd-year/renal-2/2024", 1, "2026-11-05T00:00:00Z"),
    b("/PastPapers/1st-year/blood/compiled", 4, "2026-11-04T00:00:00Z"),
    b("/PastPapers/1st-year/blood/2016", 9, "2026-11-01T00:00:00Z"),
    b("/PastPapers/1st-year/blood/2016", 2, "2026-11-06T00:00:00Z"),
    b("/SystemReview/renal", 7, "2026-11-03T00:00:00Z"),
  ], moduleKey)
  assert.deepEqual(groups.map(g => g.key), ["/PastPapers/1st-year/blood", "/PastPapers/2nd-year/renal-2", "/SystemReview/renal"])
  assert.deepEqual(groups[0].items.map(i => `${i.path.split("/").pop()}:${i.index}`), ["2016:2", "2016:9", "compiled:4"])
})

test("buildRun filters by scope and shuffles a copy", () => {
  const b = (path: string, id: number) => ({ path, id, index: id, savedAt: "2026-11-01T00:00:00Z", question: q(id) })
  const list = [b("/PastPapers/1st-year/blood/2016", 1), b("/PastPapers/1st-year/blood/2017", 2), b("/SystemReview/renal", 3)]
  assert.equal(buildRun(list, "all", moduleKey).length, 3)
  assert.deepEqual(buildRun(list, "/PastPapers/1st-year/blood", moduleKey, () => 0).map(x => x.id).sort(), [1, 2])
  assert.deepEqual(buildRun(list, "/PastPapers/9th-year/none", moduleKey), [])
  assert.deepEqual(list.map(x => x.id), [1, 2, 3])
})

test("parseQuestionHash", () => {
  assert.equal(parseQuestionHash("#q=12", 60), 11)
  assert.equal(parseQuestionHash("#q=1", 60), 0)
  assert.equal(parseQuestionHash("#q=60", 60), 59)
  for (const h of ["", "#q=0", "#q=61", "#q=abc", "#q=1.5", "#q=-1", "#x=3", "q=3"]) assert.equal(parseQuestionHash(h, 60), null)
})
```

- [ ] **Step 3: Run to verify they fail.** Run: `node --test $SCRATCH/pieceC.test.ts`. Expected: FAIL (module/export not found).

- [ ] **Step 4: Implement** `QuestionRef`, `bookmarks.ts` and `parseQuestionHash` per the Interfaces above.

- [ ] **Step 5: Run to verify they pass.** Run: `node --test $SCRATCH/pieceC.test.ts`. Expected: all pass. Then `npm run build`; expect success.

- [ ] **Step 6: Commit**

```bash
git add app/_QAFormat/bookmarks.ts app/_QAFormat/types.ts app/_QAFormat/quizLogic.ts
git commit -m "Add bookmark storage helpers and #q=N question hash parser"
```

---

### Task 2: Bookmark toggle in the quiz and Saved nav link

**Files:**
- Create: `app/_QAFormat/useBookmarks.ts`
- Modify: `app/_QAFormat/Format.tsx`, `app/_QAFormat/Header.tsx`, `app/_QAFormat/ProgressMap.tsx`
- Modify: `app/_NavBar/Menu.tsx`

**Interfaces:**
- Consumes: Task 1's `bookmarks.ts` exports and `QuestionRef`.
- Produces: `useBookmarks(): { bookmarks: Bookmark[], ready: boolean, toggle: (ref: QuestionRef, question: Question) => void, remove: (refs: { path: string, id: number }[]) => void }`.
  - `bookmarks` starts as `[]` and `ready` as `false` until the mount effect has read storage.
  - Writes re-read `localStorage` first, so another tab's saves aren't clobbered. They apply the pure helper, `setItem` inside `try/catch` (on failure: no state change, nothing shown), then `window.dispatchEvent(new Event(BOOKMARKS_EVENT))`.
  - Each hook instance re-reads on `BOOKMARKS_EVENT` and on `storage` events whose `key` is `BOOKMARKS_KEY` or `null`.
- Produces: `Header` gains props `saved: boolean, onToggleSave: () => void`. `ProgressMap` gains `saved: boolean[]` (same length as `statuses`).

- [ ] **Step 1: Write `useBookmarks.ts`** (`"use client"` not needed; it's a hook) per the Interfaces.

- [ ] **Step 2: Wire it into `Format`.**
  - The current question's ref is `{ path: pathname, id: data[index].id, index }`. Task 4 swaps in `practice.refs[index]` when practising, so compute it through one `refAt(i)` helper.
  - `saved = isSaved(bookmarks, refAt(index))`; `toggleSave = () => toggle(refAt(index), data[index])`.
  - **S/s** in the existing `navigate` keydown handler calls `toggleSave` (after `isQuizKeyBlocked`). Add what it closes over to that effect's deps. `optionIndexForKey("s")` already returns null, so `Options` ignores it.
  - Pass `saved` to `ProgressMap` as `data.map((_, i) => isSaved(bookmarks, refAt(i)))` (memoised).

- [ ] **Step 3: `Header`.** Wrap the right side in `shrink-0 flex items-center gap-2`. Before the counter pill, add an icon `button` styled like the pill but round (`size-8`), with lucide `Bookmark` `h-4 w-4`. When saved it gets `fill="currentColor"` and `text-brand`. Attributes: `aria-pressed={saved}`, `aria-label="Save question"`, `title="Save question (S)"`.

- [ ] **Step 4: `ProgressMap`.** The chip gets `relative`. When `saved[i]`, add `<span aria-hidden className="absolute top-1 right-1 size-1.5 rounded-full bg-brand ring-1 ring-background" />`, and append `", saved"` to the chip's `aria-label`. The thin bar is unchanged.

- [ ] **Step 5: `Menu.tsx`.** Add a `Saved` link to `/Saved` right after Performance, with the same classes and `onClick={close}`. Its badge is `bookmarks.length` from `useBookmarks()`. It renders only when `> 0`: `ml-1.5 rounded-full bg-brand px-1.5 text-xs text-white tabular-nums align-middle`, with `aria-label` "{n} saved".

- [ ] **Step 6: Verify in a production build.** Run `npm run build` (expect success, page count unchanged from `main`), then `npx next start` in the background. Use Playwright MCP:
  1. On `/PastPapers/1st-year/blood/2016`, click the bookmark. It fills, the navbar shows `Saved 1`, and `JSON.parse(localStorage.bookmarks)[0]` has `path` `/PastPapers/1st-year/blood/2016`, `index: 0` and the full question.
  2. Press Right, then `s`. The badge shows 2. Open the map: chips 1 and 2 have dots. Press `s` again: the badge shows 1. Pressing `s` while the map sheet is open does nothing.
  3. With two tabs open, a save in tab A updates tab B's badge.
  4. Pressing `a` still answers. Answering after Finish still behaves as before.
  5. At 390px width, check `/PastPapers/4th-year/otorhinolaryngology/compiled` (long label): `document.documentElement.scrollWidth <= 390`.
  Stop the server, then `rm -rf .playwright-mcp`.

- [ ] **Step 7: Commit**

```bash
git add app/_QAFormat/useBookmarks.ts app/_QAFormat/Format.tsx app/_QAFormat/Header.tsx app/_QAFormat/ProgressMap.tsx app/_NavBar/Menu.tsx
git commit -m "Bookmark quiz questions with an icon or the S key, and link Saved in the navbar"
```

---

### Task 3: Open a paper at question N (`#q=N`)

**Files:**
- Modify: `app/_QAFormat/useQuizPersistence.ts` (restore effect), `app/_QAFormat/Format.tsx` (pass `setIndex`)

**Interfaces:**
- Consumes: `parseQuestionHash` (Task 1).
- Produces: `useQuizPersistence` takes a new `setIndex: Dispatch<SetStateAction<number>>` option. D's search will link with `${path}#q=${index + 1}`.

- [ ] **Step 1: Implement in the restore effect.**
  - Read `jump = parseQuestionHash(window.location.hash, totalQuestions)`. When it isn't null:
    - strip the hash with `window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search)`. Keeping `history.state` preserves the Next router's state.
    - restore a stored session's answers, score and resumeIndex exactly as today, but **don't** open the Resume modal;
    - `setIndex(jump)`.
  - Without a hash, nothing changes.
  - A `landed` ref in the hook records that the hash was consumed. When it's set, a re-run of the effect (dev Strict Mode; the hash is gone by then) must not open the Resume modal.
  - A malformed or out-of-range hash is left in the URL and ignored.

- [ ] **Step 2: Verify in a production build.** Run `npm run build`, then `npx next start`. Use Playwright MCP:
  1. With no session, typing `/PastPapers/1st-year/blood/2016#q=12` opens on Q12 (counter `12 / N`), with no popup, and the URL has no hash.
  2. Answer Q1–Q3, then load `…/2016#q=12`. It opens on Q12 with no popup, and the map shows Q1–Q3 coloured. Reload: the Resume popup appears ("question number: 4").
  3. `#q=999` and `#q=abc` open normally (Resume popup if a session exists). The in-app `Link` case is checked in Task 4, Step 5.3. If the hash isn't visible on mount after a `Link` navigation, make the Saved row's "Open in paper" a plain `<a>` instead.
  Stop the server, then `rm -rf .playwright-mcp`.

- [ ] **Step 3: Commit**

```bash
git add app/_QAFormat/useQuizPersistence.ts app/_QAFormat/Format.tsx
git commit -m "Open a quiz at question N from a #q=N link, restoring progress without the Resume popup"
```

---

### Task 4: Saved page and practice-only Saved quiz

**Files:**
- Create: `app/Saved/page.tsx` (server), `app/Saved/loading.tsx` (one-liner re-export of `RouteLoader`, like every other route), `app/Saved/SavedPage.tsx` (`"use client"`)
- Modify: `app/_QAFormat/Format.tsx`, `app/_QAFormat/useQuizPersistence.ts`, `app/_QAFormat/FinishModal.tsx`, `app/_QAFormat/types.ts`

**Interfaces:**
- Consumes: `useBookmarks`, `groupBookmarks`, `buildRun`, `isSaved` (Tasks 1–2); `moduleKey` from `app/(Performance)/moduleStats.ts`; `paperLabel`/`labelParts` from `lib/papers.ts`; `MODULE_ORDER` from `app/(PastPapers)/pastPapers.ts`; `systems` from `app/(SystemReview)/SystemReview/systems.ts`.
- Produces, in `types.ts`: `export type Practice = { refs: QuestionRef[], onAgain: () => void, onExit: () => void }`.
- Produces: `Format` props become `{ data: Quiz, next?: QuizLink, back?: QuizLink, practice?: Practice }`. Existing pages are unchanged.
- Produces: `useQuizPersistence` takes `enabled: boolean`. When false, all four effects return immediately: save, restore/`#q`, performance append, module clear.
- Produces: `FinishModal` takes `back?: QuizLink` plus `practice?: { removable: number, onRemoveRight: () => void, onAgain: () => void, onExit: () => void }`.

- [ ] **Step 1: Practice mode in the quiz engine.**
  - `Format` passes `enabled: !practice` to the hook. `refAt(i)` returns `practice.refs[i]` when practising.
  - `removableRefs = practice ? practice.refs.filter((r, i) => statuses[i] === "right" && isSaved(bookmarks, r)) : []`.
  - `FinishModal` in practice mode shows, in order:
    - `Review missed (n)`, as today;
    - `Remove the {n} I got right` (`brand`), only when `removable > 0`; it calls `remove(removableRefs)`;
    - `Practise again` (`brand`), calling `onAgain`;
    - `Back to Saved` (`outline`), calling `onExit`.
    No Next / Retake / back link. Outside practice mode nothing changes, except that the back link renders only if `back` is given.

- [ ] **Step 2: `app/Saved/page.tsx`.**
  - Compute `modules` exactly as `app/page.tsx` does.
  - Render `<Suspense><SavedPage modules={modules} systems={systems} /></Suspense>`; the Suspense is needed because `SavedPage` uses `useSearchParams`.
  - Leave `sitemap.ts` untouched.

- [ ] **Step 3: `SavedPage.tsx`, list view** (when `practise` param is absent). Width/spacing follow the Performance page; rows sit in a `rounded-xl ring ring-accent divide-y` box like `Attempts`.
  - Render nothing until `ready`.
  - Empty state copy, exactly: `Nothing saved yet. Tap 🔖 on any question, or press S.`
  - Heading `Saved questions ({n})` and `Practise all` (`brand`) → `router.push("/Saved?practise=all")`.
  - Per `groupBookmarks(bookmarks, moduleKey)` group: heading `paperLabel(group.key)` (gradient text like `Attempts`) and a `Practise these` button → `?practise=${encodeURIComponent(group.key)}`.
  - Row:
    - line 1: `question.question` with `line-clamp-2`;
    - line 2: Past Papers `${labelParts(path).at(-1)} · Q${index + 1}`, System Review `Q${index + 1}`;
    - `Open in paper` → Next `Link` to `${path}#q=${index + 1}`, rendered only if the path is still valid: `/PastPapers/<y>/<m>/…` needs `<y>/<m>` in `modules`, and `/SystemReview/<s>` needs `<s>` in `systems`;
    - `×` button with `aria-label="Remove {line 2} from saved"`, calling `remove([b])`.

- [ ] **Step 4: `SavedPage.tsx`, quiz view** (when `practise` is set).
  - Once `ready`, build `run = buildRun(bookmarks, scope, moduleKey)` **once** and keep it in state with a `seed` number. Un-bookmarking mid-run must not rebuild it.
  - An empty run → `router.replace("/Saved")`.
  - Render `<Format key={seed} data={run.map(b => b.question)} practice={{ refs: run.map(({ path, id, index }) => ({ path, id, index })), onAgain, onExit: () => router.push("/Saved") }} />`.
  - `onAgain` rebuilds the run from the current bookmarks and bumps `seed`.
  - Leaving the quiz view (navbar link, Back) unmounts it, so returning reshuffles.

- [ ] **Step 5: Verify in a production build.** Run `npm run build` (expect success; route count is `main`'s + 1), then `npx next start`. Use Playwright MCP:
  1. Clear storage. `/Saved` shows the empty-state copy.
  2. Save Q1–Q3 of `1st-year/blood/2016`, Q2 of `1st-year/blood/compiled`, and Q1 of `/SystemReview/renal`. `/Saved` shows the groups in this order: System Review · Renal, then 1st Year · Blood with rows `2016 · Q1, Q2, Q3`, then `Compiled · Q2`.
  3. **Open in paper** on `2016 · Q3`, after first answering Q1 of that paper: it lands on Q3 with no Resume popup (closes Task 3's in-app check).
  4. `Practise all`: 5 questions; the header shows each question's own `info`. Un-bookmark one mid-run: the run still has 5, and the badge drops. Answer some right and finish. `Remove the N I got right` matches the still-saved right ones and disappears after a click. `Practise again` reshuffles (repeat until the order differs). `Back to Saved` shows the list.
  5. After step 4, no localStorage key ending in `-module` or `-performance` contains `Saved`, and `/Performance` shows no new attempt.
  6. Navbar `Saved` during a run returns to the list. Browser Back from a run returns to the list. `/Saved?practise=%2FPastPapers%2F9th-year%2Fx` returns to the list.
  7. Set `localStorage.bookmarks = "{not json"`: `/Saved` shows the empty state, and saving a question then writes a clean one-item array.
  8. Seed one bookmark with path `/PastPapers/3rd-year/renal/2019` (old folder name). Its row has no Open in paper, and Practise still works.
  9. At 390px: `scrollWidth <= 390` on the list and in a run.
  Stop the server, then `rm -rf .playwright-mcp`.

- [ ] **Step 6: Commit**

```bash
git add app/Saved app/_QAFormat/Format.tsx app/_QAFormat/useQuizPersistence.ts app/_QAFormat/FinishModal.tsx app/_QAFormat/types.ts
git commit -m "Add Saved page with a practice-only shuffled quiz of bookmarked questions"
```

---

### Task 5: Docs and final check

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update `CLAUDE.md`.**
  - Route table: add `/Saved`.
  - localStorage keys: add `bookmarks` (newest-first array of full question copies with `path`/`id`/`index`, so a later `Database/` fix doesn't reach old saves) and the `bookmarks-change` event.
  - QA Format: S key, the `#q=N` link (hash, not query, so it stays prerendered; it restores silently without Resume) and `practice` mode (no persistence).
  - Note that `/Saved` is deliberately absent from `sitemap.ts`.

- [ ] **Step 2: Full check.**
  - `npm run build`: success, ~414 pages.
  - `node --test $SCRATCH/pieceC.test.ts`: all pass.
  - `git status --short`: only `docs/` untracked, nothing from `.playwright-mcp/`.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Update CLAUDE.md for bookmarks and the Saved page"
```
