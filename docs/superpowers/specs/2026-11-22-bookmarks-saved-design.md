# Bookmarks & Saved page

Piece C of the 2026-11-21 UI/UX pass (A quiz upgrades and B homepage/module stats done; D search
follows and reuses the "open at question N" link built here).

## Why

Students meet questions they get wrong or only half-know and want to come back to them before an
exam. Today the only way is to remember which paper and question it was. Saved questions are for
**re-drilling hard ones**: the Saved page's main action is practising them as a quiz; the list is
secondary.

## Goals

1. **Bookmark toggle in the quiz** (everywhere `Format` runs: Past Papers, System Review, finished
   papers, Review-missed mode, and the Saved quiz itself).
   - A bookmark icon button in the `Header` row, between the paper label and the counter pill.
     Filled when the current question is saved. `aria-pressed`, label "Save question".
   - **S** key toggles it. Same blocking rules as the other quiz keys (`isQuizKeyBlocked`: no
     modifiers, not in inputs, not while a dialog/sheet is open). B can't be used: A–J answer.
   - The jump-to-question map (`ProgressMap` sheet) marks saved questions with a small corner dot
     on their chip. The thin progress bar is unchanged.
2. **Saved page at `/Saved`**, linked from the navbar.
   - Navbar link "Saved" next to Performance (desktop menu and the mobile sidebar both use
     `Menu.tsx`). Shows a count badge when > 0; client-only, so it appears after mount.
     The count stays in sync when bookmarks change in this tab and in other tabs.
   - Header: `Saved questions (14)` and a **Practise all** button.
   - Questions grouped by module: `<year>/<module>` for Past Papers (label via
     `lib/papers.ts`, e.g. `1st Year · Blood`), each System Review system its own group.
     Each group has a **Practise these** button.
   - Row: question text clamped to 2 lines; `2016 · Q12` (paper tag + 1-based position in that
     paper); **Open in paper**; **×**. The correct answer is **not** shown.
   - × removes the bookmark immediately, no confirm.
   - Empty state: "Nothing saved yet. Tap 🔖 on any question, or press S."
3. **Saved quiz**, run inside the `/Saved` route (no separate page).
   - Uses the normal quiz UI (`Format`). Questions are **shuffled** on every start.
   - **Practice only:** no `-module` in-progress key, no Resume popup, no `-performance` attempt.
     It never shows up in Performance or the homepage Continue strip.
   - Header label is each question's own `info`, as today.
   - Finish screen: score + donut, Review missed (as today), **Remove the N I got right** (hidden
     when N = 0; "right" = first pick correct, same rule as scoring), **Practise again**
     (reshuffles, replaces "Retake quiz"), **Back to Saved** (returns to the list). No "Next paper".
   - Un-bookmarking a question mid-quiz removes it from the list but keeps it in the current run.
4. **Open at question N** link: `/PastPapers/<year>/<module>/<tag>#q=12` (1-based), and the same
   for `/SystemReview/<system>#q=N`.
   - The quiz opens on that question.
   - If the paper has an in-progress session, its answers and score are restored **silently**
     (no Resume popup) and the student lands on question N, not the resume point.
   - No session → fresh paper, starting at question N.
   - Out-of-range or malformed `#q` → ignored (normal behaviour).
   - D will build its search results on this link.

## Non-goals

- Syncing bookmarks across devices (no backend).
- Folders, tags, notes on bookmarks.
- Deduping a question saved in both a year paper and that module's `compiled` paper: they are
  two separate bookmarks.
- Changing how normal papers score, persist or record attempts.
- Showing answers in the Saved list (reference/look-up use was not the goal).

## Anti-goals

- Saved-quiz attempts leaking into Performance, module stats, or the Continue strip.
- Breaking existing in-progress sessions or attempts in students' browsers.
- A Resume popup appearing on top of an "Open in paper" landing.
- Prerendered quiz pages losing static rendering (e.g. by reading `?q=` with `useSearchParams`,
  which would require a Suspense boundary around every quiz).

## Constraints

- No new dependencies, no backend; bookmarks live in `localStorage`.
- `npm run build` is the type-check gate; test persistence against a production build
  (`npx next start`), since dev's Strict Mode double effects mask persistence bugs.
- Option order is `sortOptions` (longest first, deterministic). Anything that stores or replays
  answer indices must keep using it.

## Approaches

| | Approach | Trade-off | |
|---|---|---|---|
| A | **Copy on save.** The bookmark stores the full question object alongside its reference. | Instant Saved page, no loading, works offline, small code. A later `Database/` fix doesn't reach copies already saved (re-saving refreshes it). ~1 KB/question (~4 KB System Review) — well over a thousand fit in 5 MB. | **Chosen** |
| B | Reference only (path + id); Saved page dynamically imports each paper's JSON on the client | Always current with `Database/`, but a loading state, one download per paper (System Review files ~1 MB), and ~380 client data chunks | Rejected |
| C | Copy `Database/` into `public/` at build and fetch | B plus an extra build step and ~30 MB duplicated | Rejected |

Also decided: the "open at N" link uses a **hash** (`#q=N`), not a query string, so quiz pages stay
statically prerendered.

## Data

One localStorage key, `bookmarks`: a JSON array, newest first, of

```ts
{
  path: string        // quiz pathname, e.g. "/PastPapers/1st-year/blood/2016" or "/SystemReview/cardiovascular"
  key: string         // questionKey(question): hash of normalised stem + sorted option texts
  index: number       // 0-based position when saved — display/history only, never used to find it
  savedAt: string     // ISO date
  question: Question  // full copy from types.ts (info, question, answers, hint/difficulty if any)
}
```

Identity is `path + key`. **Revised 2026-11-22 (user request):** ids and question order can't be
guaranteed stable across re-scrapes, so bookmarks match questions by content. "Open in paper" uses
`#k=<key>`; a key with no match (question text edited) opens the paper normally, never on a wrong
question. Saved rows show only the paper tag, not "Q12". Unparseable values or malformed entries are skipped on read, never thrown.

## Builder's calls (mine — correct if wrong)

- Groups on the Saved page are ordered by their newest bookmark; within a group, rows go by paper
  tag then question number (reads like the paper).
- "Practise again" and "Practise these/all" build the run from the **current** bookmarks in that
  scope, so questions removed via "Remove the N I got right" don't come back.
- "Open in paper" is hidden for bookmarks whose path no longer exists (a module folder renamed
  later, like the pre-`-2` 3rd/4th-year names). The server page passes the current route list,
  as `app/page.tsx` does for the Continue strip. Practising those bookmarks still works.
- After reading `#q=N`, the quiz removes the hash (`history.replaceState`) so reloading behaves
  like a normal visit.
- `index` is stored even though today every question's `id` equals its 0-based position (checked
  across all 364 + 17 files), so a future reorder or renumber of a file doesn't silently break it.
- System Review rows have no paper tag: they show just `Q12`.
- Count sync: a custom `bookmarks-change` window event for this tab plus the `storage` event for
  other tabs.
- "Remove the N I got right" counts only questions in the run that are still bookmarked.
- The running quiz is addressed as `/Saved?practise=all` or `/Saved?practise=<module key>` (still
  the `/Saved` route, client-only). So the navbar "Saved" link and browser Back both return to the
  list, and a refresh mid-quiz starts a fresh shuffle of the same scope.
- If saving hits the storage quota, the toggle stays off and nothing else happens (no toast
  library in the project).
- The Saved quiz needs each question's own `path`/`id`/`index` for the bookmark toggle; how
  `Format` receives that (a parallel array, or a per-question field) is left to the plan.
- How `Format` turns persistence off for the Saved quiz (a prop on `Format`/`useQuizPersistence`)
  is left to the plan.

## Files likely touched

- `app/_QAFormat/`: `Format.tsx`, `Header.tsx`, `ProgressMap.tsx`, `FinishModal.tsx`,
  `useQuizPersistence.ts`, `quizLogic.ts` (pure helpers), new bookmark storage helper.
- `app/_NavBar/Menu.tsx` (link + badge).
- New `app/Saved/page.tsx` (+ `loading.tsx`, client list component).
- `app/sitemap.ts`: leave `/Saved` out — it's per-browser and empty for crawlers.
- `CLAUDE.md`: new localStorage key, `#q=N` link, Saved route.
