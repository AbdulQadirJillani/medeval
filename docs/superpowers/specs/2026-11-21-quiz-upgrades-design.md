# Quiz upgrades: progress map, keyboard answering, finish screen & mistake review

Piece A of the 2026-11-21 UI/UX pass (B homepage + performance, C bookmarks, D search follow separately).
Applies to the shared quiz engine in `app/_QAFormat/`, so both Past Papers and System Review get it.

## Why

Students spend most of their time in the quiz. Today a paper (up to 319 questions; compiled up to
1,205) shows only "12 out of 81", options can only be clicked, and the finish dialog offers just
"Retake" or "Go back to HomePage", with no way to go over what you got wrong or move on to the next paper.

## Goals

1. **Colour-coded progress map (#2, layout C).** The divider under the quiz header becomes a bar
   with one slice per question: green = first pick right, red = first pick wrong, grey = unanswered,
   brand cyan = current. The "x out of y" counter becomes a button (`▦ 12 / 81`). Tapping the bar
   or the counter opens a side sheet with a numbered grid (same colours, current outlined, summary
   "8 right · 3 wrong · 70 left"); tapping a number jumps there and closes the sheet.
2. **Keyboard answering (#3).** Each option shows a letter badge (A, B, C… up to J) in display
   order. Keys `A`–`J` and `1`–`9` pick that option. Existing ArrowLeft/ArrowRight stay.
3. **Finish screen (#4).** "Done · 54 / 81 (67%)" + donut, then:
   - **Review missed (N)**: hidden when N = 0
   - **Next paper: 2024 →**: next tag in the same module (… → 2025 → compiled); hidden after the last one
   - **Retake quiz**: unchanged
   - **Back to 3rd Year**: replaces "Go back to HomePage"; goes to the year page
   - System Review: "Next system: <name> →" and "Back to systems" (`/SystemReview`).
4. **Mistake review.** "Review missed" steps through the same quiz screen, but Back/Next (and
   swipe/arrow keys) only stop on missed questions, meaning wrong first pick **or** never answered.
   The correct option is shown green next to the student's red picks; System Review explanations
   show on the correct option too. The header shows "Reviewing 3 / 27". On the last missed
   question the Next button becomes "Finish review", which reopens the finish dialog.

5. **Resume where you were working, not where you peeked** (added mid-build at the user's request).
   The map lets students jump ahead, so "furthest question reached" no longer means "where I
   stopped". Resume now lands on the question *after the one most recently answered* (the last
   entry in the saved answers, clamped to the last question; nothing answered = no resume prompt),
   and the resume dialog's "Score so far" is out of the questions answered, not the resume position.
   Stored shape is unchanged; only the `resumeIndex` value's meaning changes.

## Non-goals

- Revealing the correct answer during the quiz. Guessing until you find it is intentional and stays.
- Exam mode, tile progress badges, module-name fixes (all declined in this pass).
- Any change to the localStorage key names or value shapes.

## Anti-goals

- Anything that changes how a question is scored (first click only) or lets a finished paper's
  score drift from the attempt recorded in `-performance`.
- Anything that breaks in-progress sessions already saved in students' browsers.

## Approaches considered

| | Approach | Trade-off | |
|---|---|---|---|
| 1 | **Extend the current components**: new progress-map component, shared option-sort helper, review state in `Format.tsx`, links computed server-side | Small, focused diff; keeps the recently fixed scoring/persistence logic intact | **Chosen** |
| 2 | Move all quiz state into one `useReducer` | Cleaner base for bookmarks/search later, but rewrites `Format.tsx` + `useQuizPersistence.ts` (high regression risk) | Rejected |
| 3 | Separate `/…/review` route | Survives refresh, but ~364 extra prerendered pages and answers passed via localStorage | Rejected |

## Design (decided)

**One definition of right/wrong.** Move the longest-first option sort out of `Options.tsx` into a
shared helper (e.g. `app/_QAFormat/sortOptions.ts`). A question's status comes from the *first*
entry of its `clickedOption[].optionIndex` array (clicks are appended in order and persisted in
order), looked up in the sorted options: `bool: true` → right, otherwise wrong; no entry →
unanswered. `Format.tsx` derives a `statuses` array with `useMemo` over `data` + `clickedOption`;
the bar, the grid, the finish-screen count and review mode all read it. This matches scoring exactly.

**Review mode** is a piece of state in `Format.tsx` (e.g. `review: number[] | null`, the missed
indices at the moment review starts). While it's set, Next goes to the first missed index greater
than the current one and Back to the last one less than it, so jumping via the map mid-review still
works. `Options` gets a `reveal` flag (show correct option green, show its explanation) and does not
accept clicks. Retake clears review.

**Finished papers are read-only until Retake.** Use the existing `recorded` ref as the "finished"
signal:
- the debounced save in `useQuizPersistence.ts` skips while `recorded.current` is true.
  *This also fixes an existing bug:* closing the finish dialog and moving between questions
  re-created `${pathname}-module`, so the next visit offered to resume a finished paper.
- `Options` ignores clicks once finished, so `score` can't drift from the recorded attempt.

**Links.** `Format` takes two new props, `next?: { href, label }` and `back: { href, label }`,
computed in the server pages:
- `PastPapers/[...QA]/page.tsx`: `yearsFor(annual, module)` → tag after the current one;
  back = `/PastPapers/${annual}`.
- `SystemReview/[QA]/page.tsx`: `systems` list → next system; back = `/SystemReview`.
- Give `<Format>` a per-route `key` (e.g. `QA.join("/")`) so "Next paper" always mounts a fresh
  quiz rather than carrying `index`/`clickedOption` across.

**Keyboard.** `Options` owns the sorted list and click handler, so it registers the letter/number
keydown listener itself. Keys are ignored when a modifier (Ctrl/Meta/Alt) is held, when the event
target is an input/textarea/contenteditable (keeps future Ctrl+K search safe), and when any
dialog/sheet is open (resume, finish, map). The same "dialog open" guard is applied to the existing
arrow-key handler.

**Rendering cost.** The bar renders one element per question (≤1,205), with no gaps once there
are too many slices for gaps to fit. The grid only mounts while the sheet is open (Radix unmounts
closed content) and scrolls the current question into view on open.

## Files expected to change

New: `app/_QAFormat/sortOptions.ts`, `app/_QAFormat/ProgressMap.tsx`.
Changed: `Format.tsx`, `Header.tsx`, `Options.tsx`, `Footer.tsx`, `FinishModal.tsx`,
`useQuizPersistence.ts`, `types.ts` (link type), `app/(PastPapers)/PastPapers/[...QA]/page.tsx`,
`app/(SystemReview)/SystemReview/[QA]/page.tsx`.

## Left to the builder

- Exact mobile header arrangement (long origins like "5th Year/Medicine 1/Compiled (2023, 2019, 2017)"
  must not squeeze the counter button).
- Sheet side (right on desktop; right or bottom on mobile) and grid column count.
- Badge styling, as long as it reads on red/green option backgrounds and in dark mode.
- Label casing (e.g. "Compiled", "3rd Year").

## Verification

No test suite: `npm run build` (type-check + prerender), then drive `npm run dev` in a browser:
- wrong first pick → red slice; wrong then right → still red; unanswered → grey
- jump via the sheet; A–J / 1–9 answer; keys do nothing while a dialog is open
- finish a short paper → counts correct; Review missed visits only missed + skipped, shows correct
  answer, blocks clicks; "Finish review" reopens the dialog
- Next paper lands on a fresh quiz; hidden on `compiled`; Back to year works; System Review variants
- after finishing, close the dialog, move around, reload → **no** resume prompt
- a 1,205-question compiled paper renders the bar and sheet smoothly
- dark mode for bar, sheet, badges
