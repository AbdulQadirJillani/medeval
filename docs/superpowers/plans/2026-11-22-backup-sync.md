# Backup & Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/Sync` page where a student backs up everything MedEval stores to one file and restores it on another device. Restoring combines the file with what's already there, and removals (unsaves, discards, "Clear all attempts") stick in both directions.

**Architecture:**
- A tiny `lib/removals.ts` owns the new `removals` key. The four places that delete data today record into it.
- Sessions and attempts are removed by exact identity, never by a cutoff time, so a restore can't delete the other device's own items.
- All backup logic is pure functions in `app/Sync/sync.ts`: snapshot, validate, merge, summary and diff-to-storage. They work on a `Snapshot` of plain objects, so `node --test` can check them.
- A client `SyncPage.tsx` wires the functions to the two buttons, the file picker, the share sheet or download, and the status line.

**Tech Stack:** Next.js 16 / React 19, Tailwind v4, shadcn `Button`, lucide-react (`Download`, `Upload` icons).
- Logic is checked with `node --test`. Node 24 strips TS types, and a scratch resolve hook lets app modules import each other without `.ts`.
- UI is checked with `npm run build`, plus Playwright MCP against a production `npx next start`.

**Spec:** `docs/superpowers/specs/2026-11-22-backup-sync-design.md`

## Global Constraints

- **Dependencies:** none new. No backend, no network calls.
- **Storage:** new localStorage key `removals`. No existing key changes name or shape. `theme` and `-reset` keys are never read into or written from a backup.
- **File:** `{ app: "medeval", version: 1, exportedAt, sessions, attempts, bookmarks, removals }`, named `medeval-backup-YYYY-MM-DD.json` (local date).
- **Paths:** only keys whose path matches `^\/(PastPapers|SystemReview)\/[A-Za-z0-9/-]+$` are read from storage or accepted from a file as sessions or attempts. A crafted file must not be able to write arbitrary keys.
- **Pure modules:** `sync.ts`, `removals.ts`, `bookmarks.ts` and `(Performance)/types.ts`.
  - They import each other by **relative** path, never `@/`.
  - They touch `localStorage` only inside functions the tests never call.
- **Style:** match each file's existing style (2-space indent, no semicolons). Comments only where the why isn't obvious.
- **Lint:** `npm run lint` must not report more than today's 18 problems.
- **Persistence:** checked against a production build, not dev.
- **Branch:** work on `backup-sync`. Commit only the files a task names, never `git add -A`. Delete `.playwright-mcp/` after browser checks.
- **Scratch:** `$SCRATCH` = `/tmp/claude-1000/-home-jillani-Programming-Next-med-eval/3fe6a87d-c5dc-40f8-86ec-60656be1cd87/scratchpad`. Tests live there and aren't committed. `$SCRATCH/ts-resolve.mjs` already exists: it retries a failed relative import with `.ts` appended. Run tests with `node --import $SCRATCH/ts-resolve.mjs --test <file>`.

## Review Focus

1. **Just opening a paper on one device** writes an empty session with the current time. It must never replace an answered session from the other device. An answered incoming session must replace a local empty one (Task 2 test `empty sessions never win`).
2. **Repeated round trips.** Restoring a device's own backup, or the same file twice, changes nothing and says "Already up to date." (Task 2 test `idempotent`).
3. **The wrong file picked.** A photo, a `.txt`, another app's JSON, a JSON array, or a backup from a newer version shows the error and writes nothing (Task 2 `parseBackup` tests, Task 3 browser check).
4. **Legacy local data.** A single-object `-performance` value, a session with only `startDateTime`, or a bookmark without `key` is read, merged and backed up without loss (Task 2 test `legacy local data`).
5. **The other device's own items.** Clearing attempts, discarding a paper or finishing one on the laptop must not remove phone-only attempts or a separate phone session of the same paper when the laptop's backup is restored there (Task 2 test `other device keeps its own`).

---

### Task 1: Removals list, recorded where things are deleted

**Files:**
- Create: `lib/removals.ts`
- Modify: `app/_QAFormat/useBookmarks.ts` (`write`)
- Modify: `app/_Homepage/sessions.ts` (`Session` gains `started`) and `app/_Homepage/ContinueStrip.tsx` (`discard`)
- Modify: `app/_QAFormat/useQuizPersistence.ts` (the "Clear in-progress module state once finished" effect)
- Modify: `app/(Performance)/Performance.tsx` (`clearAll`, dialog copy)
- Test (not committed): `$SCRATCH/removals.test.ts`

**Interfaces:**
- Produces, in `lib/removals.ts` (no imports):
  - `export const REMOVALS_KEY = "removals"`
  - `export type Removal = { kind: "bookmark", path: string, key: string, at: string } | { kind: "session", path: string, started: string, at: string } | { kind: "attempt", id: string, at: string }`, where `at` is an ISO time and `started` is the session's `startDateTime` exactly as stored.
  - `attemptId(e: { pathname: string, finishDateTime: string | Date, score: number, totalQuestions: number }): string`. Returns `` `${pathname}|${new Date(finishDateTime).getTime()}|${score}|${totalQuestions}` ``.
  - `removalId(r: Removal): string`. Returns `"bookmark|<path>|<key>"`, `"session|<path>|<started>"` or `"attempt|<id>"`.
  - `cleanRemovals(parsed: unknown): Removal[]`. A non-array gives `[]`. It keeps entries with a known `kind`, the string fields that kind needs (`path` + `key`, `path` + `started`, or `id`), and an `at` that `Date.parse`s to a finite number. Order is preserved.
  - `addRemovals(list: Removal[], items: Removal[]): Removal[]`. Union by `removalId`, keeping the later `at`. It keeps `list` order, replaces an entry in place when the incoming one is later, and appends new ids. It never mutates its inputs.
  - `latestRemoval(list: Removal[], id: string): number`. Returns the `at` in ms, or `-Infinity` if there's none.
  - `recordRemovals(items: Removal[]): void`. Reads `REMOVALS_KEY` (bad JSON counts as `[]`), applies `addRemovals` and writes it back. It swallows storage errors, because a failed record must not break the delete that called it. Empty `items` is a no-op.

- [ ] **Step 1: Create the branch.** Run `git checkout -b backup-sync`.

- [ ] **Step 2: Write the failing tests** in `$SCRATCH/removals.test.ts`. Import `/home/jillani/Programming/Next/med-eval/lib/removals.ts`, with `T = (h: number) => new Date(Date.UTC(2026, 10, 22, h)).toISOString()`.
  - `cleanRemovals`
    - `cleanRemovals("x")` and `cleanRemovals({})` both deep-equal `[]`.
    - On this input it returns only the first entry:
      - `[{ kind: "bookmark", path: "/p", key: "k", at: T(1) }, { kind: "bookmark", path: "/p", at: T(1) }, { kind: "nope", at: T(1) }, { kind: "attempt", id: "x", at: "garbage" }, { kind: "session", path: "/p", at: T(1) }]`
  - `addRemovals`, with `S = (h) => ({ kind: "bookmark", path: "/p", key: "k", at: T(h) })`
    - `addRemovals([S(1)], [S(2)])` deep-equals `[S(2)]`.
    - Adding `S(0)` to a list holding `S(2)` keeps `S(2)`.
    - Adding `{ kind: "attempt", id: "x", at: T(3) }` appends it, so the length becomes 2.
    - The input arrays are unchanged afterwards.
  - `latestRemoval(list, "bookmark|/p|k") === Date.parse(T(2))`, and `latestRemoval([], "attempt|x") === -Infinity`.
  - `removalId` returns `"bookmark|/p|k"`, `"session|/p|" + T(0)` (for `started: T(0)`) and `"attempt|x"`.
  - `attemptId({ pathname: "/p", finishDateTime: T(1), score: 3, totalQuestions: 9 }) === "/p|" + Date.parse(T(1)) + "|3|9"`. Passing `new Date(T(1))` gives the same id.

- [ ] **Step 3: Run them to verify they fail.** Run `node --import $SCRATCH/ts-resolve.mjs --test $SCRATCH/removals.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 4: Implement `lib/removals.ts`** as specified in Interfaces.

- [ ] **Step 5: Record removals at the four delete sites.** Use `const at = new Date().toISOString()` at each.
  - **`useBookmarks.ts` `write`:** read `before = read()` and compute `after = update(before)`. If `setItem` succeeds, call `recordRemovals` with a `bookmark` removal for each `b` in `before` where `!isSaved(after, b)`. If `setItem` throws, return `false` without recording. Then dispatch the event as now.
  - **`sessions.ts`:** `Session` gains `started: string`, filled from `String(obj.startDateTime ?? "")`.
  - **`ContinueStrip.tsx` `discard`:** after `removeItem`, call `recordRemovals([{ kind: "session", path: pending.pathname, started: pending.started, at }])`.
  - **`useQuizPersistence.ts` finish effect:** before `removeItem`, read the session with `readSession`. If there is one, record `{ kind: "session", path: pathname, started: String(obj.startDateTime ?? ""), at }`.
  - **`Performance.tsx` `clearAll`:** after the loop, call `recordRemovals(allData.map(e => ({ kind: "attempt", id: attemptId(e), at })))`.
  - **`Performance.tsx` dialog:** the description becomes `This permanently deletes every attempt recorded in this browser. If you sync with another device, these attempts are removed there too, but attempts made only on that device are kept. This can't be undone.`

- [ ] **Step 6: Run the tests and the build.** Run the Step 3 command: all pass. Then `npm run build`: success, 472 pages. `npm run lint`: ≤ 18 problems.

- [ ] **Step 7: Browser check (production).**
  1. Run `npx next start`. If :3000 is taken, find the listener with `ss -ltnp | grep ':3000'`.
  2. On `/PastPapers/1st-year/blood/2016`, answer Q1 and press S twice (save, then unsave). `localStorage.removals` now holds one `bookmark` entry for that path.
  3. On `/`, discard the paper with ×. A `session` entry is added, whose `started` equals the discarded session's `startDateTime`.
  4. Answer and finish `/PastPapers/1st-year/blood/2017`. A `session` entry for that path is added.
  5. Use "Clear all attempts" on `/Performance`. The dialog shows the new copy, and one `attempt` entry is added per attempt that was listed.
  6. Re-save the same question. `removals` is unchanged, and the bookmark shows as saved.
  7. Stop the server and `rm -rf .playwright-mcp`.

- [ ] **Step 8: Commit.**
  ```bash
  git add lib/removals.ts app/_QAFormat/useBookmarks.ts app/_Homepage/sessions.ts app/_Homepage/ContinueStrip.tsx app/_QAFormat/useQuizPersistence.ts "app/(Performance)/Performance.tsx"
  git commit -m "Remember unsaved bookmarks, discarded papers and cleared attempts so a restore won't bring them back"
  ```
  End the message with the `Co-Authored-By` line.

---

### Task 2: Pure backup logic: snapshot, validate, merge, summary

**Files:**
- Create: `app/Sync/sync.ts`
- Modify: `app/_QAFormat/bookmarks.ts`. Split `parseBookmarks` so the validation is reusable. Behaviour is unchanged.
- Modify: `app/(Performance)/types.ts`. Add `isEntry`, moved verbatim from `Performance/page.tsx`.
- Modify: `app/(Performance)/Performance/page.tsx`. Import `isEntry` instead of defining it.
- Test (not committed): `$SCRATCH/sync.test.ts`

**Interfaces:**
- Consumes, from Task 1: `Removal`, `cleanRemovals`, `addRemovals`, `latestRemoval`, `removalId`, `attemptId`.
- Produces, in `bookmarks.ts`: `export function cleanBookmarks(parsed: unknown): Bookmark[]`. This is today's filter-and-derive-key half of `parseBookmarks`. `parseBookmarks(raw)` becomes `JSON.parse`, then `cleanBookmarks`.
- Produces, in `(Performance)/types.ts`: `export function isEntry(e: unknown): e is PerformanceEntry`.
- Produces, in `app/Sync/sync.ts`. These are relative imports: `../_QAFormat/bookmarks`, `../(Performance)/types`, `../../lib/removals`.
  - `export const BACKUP_VERSION = 1`
  - `export type StoredSession = Record<string, unknown> & { answers: unknown[] }`. This is the `-module` object exactly as stored.
  - `export type Snapshot = { sessions: Record<string, StoredSession>, attempts: Record<string, PerformanceEntry[]>, bookmarks: Bookmark[], removals: Removal[] }`. Keys of `sessions`/`attempts` are quiz paths without the `-module`/`-performance` suffix.
  - `export type Backup = Snapshot & { app: "medeval", version: number, exportedAt: string }`
  - `export type MergeSummary = { attemptsAdded: number, attemptsRemoved: number, bookmarksAdded: number, bookmarksRemoved: number, sessionsAdded: number, sessionsUpdated: number, sessionsRemoved: number }`
  - `snapshotFrom(entries: [string, string | null][]): Snapshot`, from raw storage entries.
  - `toBackup(s: Snapshot, now: Date): Backup`
  - `parseBackup(text: string): { ok: true, snapshot: Snapshot } | { ok: false, error: "invalid" | "newer" }`
  - `mergeSnapshots(local: Snapshot, incoming: Snapshot): { result: Snapshot, summary: MergeSummary }`. It doesn't mutate its inputs.
  - `summaryText(s: MergeSummary): string`
  - `storageChanges(before: Snapshot, after: Snapshot): { set: [string, string][], remove: string[] }`
  - `backupFileName(now: Date): string`
  - Storage-touching helpers, for Task 3 only. The tests never call them.
    - `readLocalSnapshot(): Snapshot`, which is `snapshotFrom` over every `localStorage` entry.
    - `applyChanges(c: ReturnType<typeof storageChanges>): boolean`. It removes keys, then sets them, and returns `false` as soon as a `setItem` throws.

**Rules the signatures don't fix:**
- **Validation.** `snapshotFrom` and `parseBackup` go through one internal validator, so storage and files are checked the same way.
  - A session is kept if its path matches the Global Constraints regex and its value is a non-array object with an array `answers`.
  - Attempts for a path are an array, or a legacy single object turned into a one-item array. They're filtered by `isEntry` and `e.pathname === path`. A path left with no attempts is omitted.
  - Bookmarks go through `cleanBookmarks`, and removals through `cleanRemovals`.
  - Bad JSON in any single storage value just skips that value.
- **`parseBackup` errors.**
  - It returns `invalid` for unparseable text, a non-object, `app !== "medeval"`, or a non-number `version`.
  - It returns `newer` for `version > BACKUP_VERSION`.
  - Missing `sessions`/`attempts`/`bookmarks`/`removals` count as empty.
- **Merge order.** Implement the spec's "Merge rules" table in this order:
  1. `removals = addRemovals(local.removals, incoming.removals)`.
  2. **Bookmarks.**
     - Start from `local.bookmarks`, add incoming ones whose `path + key` isn't there, and where both have one, keep the later `savedAt` (a tie keeps local).
     - Drop `b` if `Date.parse(b.savedAt) < latestRemoval(removals, "bookmark|" + path + "|" + key)`.
     - Stable sort by `Date.parse(savedAt)`, descending.
  3. **Attempts.**
     - Per path, take local, then incoming whose `attemptId` isn't already present.
     - Drop any attempt with a removal `"attempt|" + attemptId(e)`, whatever its time.
     - Sort ascending by finish time, and omit paths left empty.
  4. **Sessions.**
     - The session time is `Date.parse(s.updatedAt ?? s.startDateTime)`, with NaN counted as 0. A session is answered if `s.answers.length > 0`. A session's id is `"session|" + path + "|" + String(s.startDateTime ?? "")`.
     - For each path, first discard each candidate (local, incoming) that has a removal for its id.
     - Of what's left, the incoming session replaces the local one if incoming is answered and (local is missing, or local is unanswered, or the incoming time is later than the local time).
     - Attempt times play no part.
- **Summary counts** compare `local` with `result`.
  - Attempts and bookmarks: by identity, counting those added and those removed.
  - `sessionsAdded`: the result has an answered session where local had none answered.
  - `sessionsUpdated`: local and result are both answered and their JSON differs.
  - `sessionsRemoved`: local was answered and the result has none.
- **`storageChanges`**
  - Writes `<path>-module` and `<path>-performance` for each path whose `JSON.stringify` value differs or is new.
  - Removes those keys for paths that are present in `before` and absent in `after`.
  - Sets `bookmarks` and `removals` when their JSON differs.
- **`backupFileName`** is `medeval-backup-YYYY-MM-DD.json`, using the local year, month and day, zero-padded.
- **`summaryText`** builds sentences joined by one space, using only the non-zero counts:
  - `Added <list>.`, where the list items are `N attempt(s)`, `N bookmark(s)` and `N paper(s) in progress`, joined as "A, B and C".
  - `Updated N paper(s) in progress.`
  - `Removed N bookmark(s) you'd unsaved on your other device.`
  - `Removed N attempt(s) you'd cleared on your other device.`
  - `Removed N paper(s) in progress you'd finished or discarded on your other device.`
  - All zero gives `Already up to date.`
  - Singular forms: "1 attempt", "1 bookmark", "1 paper in progress".

- [ ] **Step 1: Write the failing tests** in `$SCRATCH/sync.test.ts`. Import `app/Sync/sync.ts` and `app/_QAFormat/bookmarks.ts` by absolute repo path. Fixtures:
  ```ts
  const T = (h: number) => new Date(Date.UTC(2026, 10, 22, h)).toISOString()
  const P = "/PastPapers/1st-year/blood/2016"
  const q = (s: string) => ({ id: 0, info: "1st-year/blood/2016", question: s, answers: [{ option: "a", bool: true }, { option: "b", bool: false }] })
  const bm = (key: string, h: number) => ({ path: P, key, index: 0, savedAt: T(h), question: q(key) })
  const att = (h: number, score = 1) => ({ pathname: P, score, totalQuestions: 2, finishDateTime: T(h) })
  const ses = (h: number, n = 1, start = 0) => ({ pathname: P, score: 0, resumeIndex: n, totalQuestions: 2, startDateTime: T(start), updatedAt: T(h),
    answers: Array.from({ length: n }, (_, i) => ({ questionIndex: i, optionIndex: [0] })) })
  const gone = (o: object) => ({ ...o, at: T(20) })   // a removal recorded later than everything else
  const snap = (o = {}) => ({ sessions: {}, attempts: {}, bookmarks: [], removals: [], ...o })
  ```
  Tests:
  - **`bookmarks union`**
    - `merge(snap({ bookmarks: [bm("a", 1)] }), snap({ bookmarks: [bm("b", 2)] }))` gives `result.bookmarks` keys `["b", "a"]`, and `summary.bookmarksAdded === 1`.
  - **`unsave sticks both ways`**
    - Local has `bm("a", 1)` and incoming has a removal `{ kind: "bookmark", path: P, key: "a", at: T(2) }`. The result has no bookmarks, and `bookmarksRemoved === 1`.
    - The reverse (local removal at `T(2)`, incoming `bm("a", 1)`) also gives no bookmarks, and `bookmarksAdded === 0`.
    - With `bm("a", 3)`, a re-save after the removal, the bookmark is kept.
  - **`attempts dedupe and clear`**
    - Local `[att(1)]` with incoming `[att(1), att(2)]` gives 2 attempts in ascending order, and `attemptsAdded === 1`.
    - Adding an incoming removal `gone({ kind: "attempt", id: attemptId(att(1)) })` keeps only `att(2)`, and `attemptsRemoved === 1`.
  - **`empty sessions never win`**
    - Local `ses(1, 3)` with incoming `ses(5, 0)` keeps local.
    - Local `ses(5, 0)` with incoming `ses(1, 3)` takes incoming, and `sessionsAdded === 1`.
  - **`newer session wins whole`**
    - Local `ses(1, 1)` with incoming `ses(2, 2)` gives the result `ses(2, 2)`, and `sessionsUpdated === 1`.
    - Swapping local and incoming keeps `ses(2, 2)`, and `sessionsUpdated === 0`.
  - **`finishing and discarding stick`**
    - Local `ses(1, 1)` with an incoming removal `gone({ kind: "session", path: P, started: T(0) })` (finished or discarded on the other device) drops the session, and `sessionsRemoved === 1`.
    - With the removal on the local side and `ses(1, 1)` incoming, there's no session in the result.
    - Local `ses(1, 1)` with incoming `ses(3, 1, 2)` (a new session started at `T(2)`) plus the incoming removal for the `T(0)` session gives `ses(3, 1, 2)`, and `sessionsUpdated === 1`.
  - **`other device keeps its own`**
    - Local attempts `[att(1, 1)]` plus incoming removals for a *different* attempt `gone({ kind: "attempt", id: attemptId(att(5, 2)) })` keeps `att(1, 1)`, and `attemptsRemoved === 0`.
    - Local `ses(4, 2, 3)` (started at `T(3)`) with an incoming removal for the session started at `T(0)` and incoming attempts `[att(6)]` keeps the local session.
  - **`idempotent`**
    - Build `L` and `I` with one of each kind, then let `r = merge(L, I).result`.
    - `merge(r, I).summary` is all zeros, and `storageChanges(r, merge(r, I).result)` deep-equals `{ set: [], remove: [] }`.
    - `merge(L, L)` also gives all zeros.
  - **`storageChanges`**
    - When the local `ses(1, 1)` at `P` is dropped by an incoming session removal that arrives with incoming attempts `[att(2)]`, `remove` contains `P + "-module"`, and `set` has a `P + "-performance"` entry whose JSON parses to `[att(2)]`. `set` also has a `removals` entry.
  - **`legacy local data`**
    - Input to `snapshotFrom`:
      - `[P + "-performance", JSON.stringify(att(1))]`, a single object.
      - `[P + "-module", JSON.stringify({ ...ses(0, 1), updatedAt: undefined })]`
      - `["bookmarks", JSON.stringify([{ ...bm("x", 1), key: undefined }])]`
      - `["theme", "true"]`
      - `["/Evil-module", "{\"answers\":[]}"]`
      - `[P + "-reset", "true"]`
    - The output has `attempts[P]` equal to `[att(1)]`, `sessions[P]` present, one bookmark with a non-empty string `key`, and no other keys.
    - Merging that snapshot with a newer incoming `ses(1, 2)` replaces the session. This shows the `startDateTime` fallback.
  - **`parseBackup`**
    - `"not json"`, `"[]"`, `{"app":"other","version":1}` and `{"app":"medeval"}` all give `{ ok: false, error: "invalid" }`.
    - `{"app":"medeval","version":2}` gives `newer`.
    - A file with `sessions: { "/Evil": ses(1), [P]: ses(1) }` and `bookmarks: [bm("a", 1), { path: P }]` keeps only `P` and one bookmark.
  - **`round trip`**
    - `parseBackup(JSON.stringify(toBackup(s, new Date(T(9)))))` deep-equals `{ ok: true, snapshot: s }` for the `L` built in `idempotent`.
    - `toBackup(s, …)` has `app === "medeval"`, `version === 1` and `exportedAt === T(9)`.
  - **`summaryText`**
    - `{ attemptsAdded: 12, bookmarksAdded: 5, sessionsAdded: 2, rest 0 }` gives `"Added 12 attempts, 5 bookmarks and 2 papers in progress."`
    - `{ bookmarksRemoved: 1, rest 0 }` gives `"Removed 1 bookmark you'd unsaved on your other device."`
    - `{ sessionsUpdated: 1, attemptsAdded: 1, rest 0 }` gives `"Added 1 attempt. Updated 1 paper in progress."`
    - All zero gives `"Already up to date."`
  - **`backupFileName`**
    - `backupFileName(new Date(2026, 10, 2, 23, 30)) === "medeval-backup-2026-11-02.json"`
  - **`parseBookmarks unchanged`**
    - `parseBookmarks("{bad")` deep-equals `[]`.
    - `parseBookmarks(JSON.stringify([bm("a", 1)]))` deep-equals `[bm("a", 1)]`.

- [ ] **Step 2: Run them to verify they fail.** Run `node --import $SCRATCH/ts-resolve.mjs --test $SCRATCH/sync.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement it.** Add `cleanBookmarks` to `bookmarks.ts`, move `isEntry` into `(Performance)/types.ts`, and write `app/Sync/sync.ts` per Interfaces and Rules.

- [ ] **Step 4: Run the tests and the build.** Run both test files: all pass. `npm run build`: success. `npm run lint`: ≤ 18 problems.

- [ ] **Step 5: Commit.**
  ```bash
  git add app/Sync/sync.ts app/_QAFormat/bookmarks.ts "app/(Performance)/types.ts" "app/(Performance)/Performance/page.tsx"
  git commit -m "Add backup snapshot, validation and merge logic for syncing between devices"
  ```
  End the message with the `Co-Authored-By` line.

---

### Task 3: `/Sync` page, navbar link and docs

**Files:**
- Create: `app/Sync/page.tsx`, `app/Sync/SyncPage.tsx`, `app/Sync/loading.tsx` (the standard one-liner)
- Modify: `app/_NavBar/Menu.tsx` (Sync link)
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes, from Task 2: `readLocalSnapshot`, `toBackup`, `backupFileName`, `parseBackup`, `mergeSnapshots`, `storageChanges`, `applyChanges`, `summaryText`. From `bookmarks.ts`: `BOOKMARKS_EVENT`. From `lib/metadata.ts`: `pageMetadata`.

- [ ] **Step 1: `page.tsx`.** It's a server component that renders `<SyncPage />` and exports
  `metadata = pageMetadata("Sync devices", "Move your MedEval progress, attempt history and saved questions between your phone and laptop with a backup file.", "/Sync")`.
  Don't add it to `sitemap.ts`.

- [ ] **Step 2: `SyncPage.tsx` (`"use client"`).** Use the layout and heading classes of `SavedPage.tsx` (`my-11 max-w-[90%] mx-auto space-y-6`, `h1 text-xl sm:text-2xl font-semibold`). Exact copy:
  - **Heading:** `Move your progress to another device`
  - **Ordered steps:**
    1. `Tap Back up. A file is saved (on a phone, the share sheet opens).`
    2. `Send it to yourself: WhatsApp, email, Drive.`
    3. `On the other device, open Sync, tap Restore and pick the file.`
  - **Muted line:** `Includes papers in progress, attempt history and saved questions. Dark mode stays as set on each device.`
  - **Buttons:** `Back up` (`variant="brand"`, `Download` icon) and `Restore` (`variant="outline"`, `Upload` icon).
  - **Status line:** a `<p role="status">` showing the last result. Errors are in `text-destructive`.
  - **Back up**
    - Build `new File([JSON.stringify(toBackup(readLocalSnapshot(), now))], backupFileName(now), { type: "application/json" })`.
    - If `matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })`, call `navigator.share({ files: [file], title: "MedEval backup" })`. Ignore an `AbortError`, and fall back to a download on any other error.
    - The download is an object URL plus a temporary `<a download>`, then revoke the URL.
  - **Restore**
    - The button clicks a hidden `<input type="file">` with **no `accept`**. Read `file.text()`.
    - Error copy:
      - `invalid`: `That file isn't a MedEval backup. Nothing was changed.`
      - `newer`: `This backup was made by a newer version of MedEval. Reload the site and try again.`
    - Otherwise:
      1. `const before = readLocalSnapshot()`
      2. `const { result, summary } = mergeSnapshots(before, parsed.snapshot)`
      3. `applyChanges(storageChanges(before, result))`
    - On `false`, show `Couldn't finish restoring: this browser's storage is full. Free some space, then restore the same file again.`
    - On success, dispatch `new Event(BOOKMARKS_EVENT)` and show `summaryText(summary)`.
    - Reset the input's value so the same file can be picked again.

- [ ] **Step 3: Navbar.** In `Menu.tsx`, add a `Sync` link to `/Sync` right after the Saved link. Use the same classes and `onClick={close}`.

- [ ] **Step 4: `CLAUDE.md`.**
  - Add a `/Sync` row to the route table.
  - Add a `removals` bullet to "localStorage keys": what's recorded, where (the four sites), and that it's never pruned.
  - Add a short "Sync" paragraph covering the file format, that the merge lives in `app/Sync/sync.ts`, and these rules:
    - An empty session never wins, and the newer session wins whole.
    - Sessions (path + `startDateTime`) and attempts are removed by exact identity, never by a cutoff time, so a restore can't delete the other device's own items.
    - Bookmarks compare the removal time with `savedAt`.
  - Note in the Gotchas: a new delete site must call `recordRemovals`, or restores will undo it.

- [ ] **Step 5: Build and lint.** `npm run build`: success, 473 pages. `npm run lint`: ≤ 18 problems. Both test files still pass.

- [ ] **Step 6: Browser check (production, `npx next start`), desktop 1280px.**
  1. **Prepare data.** Start from cleared localStorage. Answer 3 questions on `/PastPapers/1st-year/blood/2016`. Finish `/PastPapers/1st-year/blood/2017`. Save 2 questions.
  2. **Back up** on `/Sync`. A download named `medeval-backup-<today>.json` happens.
  3. Copy its contents. Alternatively, build an equivalent file in `$SCRATCH` with `toBackup(snapshotFrom(<entries read via browser_evaluate>), new Date())`.
  4. **Restore on a "second device".** Clear localStorage, reload `/Sync`, and Restore the file. The status reads `Added 1 attempt, 2 bookmarks and 1 paper in progress.` The navbar Saved badge shows 2 without a reload. The homepage Continue strip lists blood 2016 as "3 of … answered". Opening it lands with the 3 answers restored.
  5. **Restore the same file again.** The status reads `Already up to date.`
  6. **Unsave sticks.** Unsave one question, then Restore the same file. The status reads `Already up to date.`, and Saved still shows 1.
  7. **Wrong files.** Restore a `.txt`, a PNG, `[]` saved as `.json`, and `{"app":"medeval","version":2}`. Each shows the right error, and `localStorage` is byte-for-byte unchanged (compare `JSON.stringify(localStorage)` before and after).
  8. **Storage full.**
     - Clear storage. Via `browser_evaluate`, wrap `Storage.prototype.setItem` so it throws for the key `bookmarks`, then Restore the file. The status shows the storage-full message.
     - Restore the original `setItem` and Restore again. The status reports the bookmarks added, and all data is present.
  9. **Phone width (390px).** The page and the navbar sidebar (with Sync) have no horizontal scroll. The status line wraps.
  10. Stop the server and `rm -rf .playwright-mcp`.

- [ ] **Step 7: Commit.**
  ```bash
  git add app/Sync/page.tsx app/Sync/SyncPage.tsx app/Sync/loading.tsx app/_NavBar/Menu.tsx CLAUDE.md
  git commit -m "Add Sync page to back up progress and restore it on another device"
  ```
  End the message with the `Co-Authored-By` line.
