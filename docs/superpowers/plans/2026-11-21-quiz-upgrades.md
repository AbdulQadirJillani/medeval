# Quiz Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a colour-coded progress map, A–J keyboard answering, a finish screen with Next paper / Back links, and a "Review missed" mode to the shared quiz engine.

**Architecture:** Pure logic (option sort, per-question status, review stepping, key mapping) moves into one new module, `app/_QAFormat/quizLogic.ts`, which every UI piece reads, so "right/wrong" means one thing everywhere. UI changes extend the existing components in `app/_QAFormat/`. Next/Back links are computed in the two server pages and passed to `Format` as props.

**Tech Stack:** Next.js 16 / React 19, Tailwind v4, shadcn `Sheet`/`Dialog` (Radix), lucide-react. No test framework: pure logic is checked with a throwaway `node --test` file (Node 24 runs `.ts` directly), and UI with `npm run build` plus browser checks through the Playwright MCP tools against `npm run dev`.

**Spec:** `docs/superpowers/specs/2026-11-21-quiz-upgrades-design.md`

## Global Constraints

- No new npm dependencies.
- localStorage keys and value shapes are unchanged: `${pathname}-module`, `${pathname}-performance` (array), `${pathname}-reset`.
- Scoring stays first-click-only. During a quiz the correct answer is **never** revealed after a wrong pick (guess-until-correct is intentional); the reveal happens only in review mode.
- Status colours: right `bg-[#66BB6A]`, wrong `bg-[#E74C3C]` (the existing `Options` colours), unanswered `bg-accent`, current `bg-brand`.
- Match each file's existing style (2-space indent, no semicolons in `_QAFormat/`). Comments only where the why isn't obvious.
- `npm run lint` is broken by design; `npm run build` is the type-check gate.
- Work on branch `quiz-upgrades`. Commit only the files a task names: Playwright MCP writes screenshots into `.playwright-mcp/` in the repo, so delete that folder and never `git add -A`.
- `$SCRATCH` = `<scratch>` (session-local; the test file lives there and is not committed).

## Review Focus

1. **Sessions saved before this change** still resume, and the bar shows their saved answers in the right colours (Task 2).
2. **Known data defects:** `1st-year/respiratory/2025` question 7 has 10 options, so the J key and badge must work; `5th-year/gynecology/2013` question 61 has zero correct answers, so it is always "wrong" and review shows no green, with no crash (Tasks 3 and 6).
3. **Letter keys must not answer** while Ctrl/Meta/Alt is held, while typing in a field, or while any dialog is open: the System Review Hint dialog, the mobile nav sheet, the map sheet, resume or finish (Task 3).
4. **Buttons at the edges:** an all-correct paper has no "Review missed", the `compiled` paper and the last system have no "Next", and the first missed question has Back disabled (Tasks 5 and 6).
5. **Extremes of size:** at 390px width the longest origin header (a compiled paper) doesn't squeeze the counter button or scroll sideways, and the 1,205-question `2nd-year/neuroscience/compiled` paper's bar and sheet render and scroll smoothly (Task 2).

---

### Task 1: Shared quiz logic

**Files:**
- Create: `app/_QAFormat/quizLogic.ts`
- Modify: `app/_QAFormat/types.ts` (add two types)
- Modify: `app/_QAFormat/Options.tsx:17-22` (use `sortOptions`, `Clicked`)
- Test (not committed): `$SCRATCH/quizLogic.test.ts`

**Interfaces:**
- Produces, in `types.ts`:
  - `export type Clicked = { questionIndex: number, optionIndex: number[] }[]`
  - `export type QuizLink = { href: string, label: string }`
- Produces, in `quizLogic.ts` (type-only imports from `./types`, so Node can strip them):
  - `export type QuestionStatus = "right" | "wrong" | "unanswered"`
  - `sortOptions<T extends { option: string }>(options: T[]): T[]`: a copy sorted by descending `option.length` (stable; does not mutate)
  - `questionStatuses(data: Quiz, clicked: Clicked): QuestionStatus[]`: one entry per question. Status = `bool` of `sortOptions(q.answers)[entry.optionIndex[0]]` (the **first** click); no entry gives `"unanswered"`
  - `missedIndices(statuses: QuestionStatus[]): number[]`: indices that are `"wrong"` or `"unanswered"`, ascending
  - `nextMissed(review: number[], index: number): number | undefined`: first element `> index`
  - `prevMissed(review: number[], index: number): number | undefined`: last element `< index`
  - `optionIndexForKey(key: string, count: number): number | null`: `a`–`j` (either case) → 0–9, `1`–`9` → 0–8; `null` if not one of those or `>= count`
  - `optionLetter(i: number): string`: 0 → `"A"` … 9 → `"J"`
  - `isQuizKeyBlocked(e: KeyboardEvent): boolean`: true if `e.ctrlKey || e.metaKey || e.altKey`, or the target is an `input`/`textarea`/`select`/contentEditable element, or `document.querySelector('[role="dialog"]')` is non-null (Radix unmounts closed dialogs/sheets, so presence means open)

- [ ] **Step 1: Create the branch**

Run: `git checkout -b quiz-upgrades`

- [ ] **Step 2: Write the failing test** at `$SCRATCH/quizLogic.test.ts`

```ts
import { test } from "node:test"
import assert from "node:assert/strict"
import { sortOptions, questionStatuses, missedIndices, nextMissed, prevMissed, optionIndexForKey, optionLetter } from "<repo>/app/_QAFormat/quizLogic.ts"

const q = (answers: { option: string, bool: boolean }[]) => ({ id: 1, info: "x", question: "q", answers })

test("sortOptions: longest first, stable, no mutation", () => {
  const input = [{ option: "bb" }, { option: "a" }, { option: "ccc" }, { option: "x1" }]
  assert.deepEqual(sortOptions(input).map(o => o.option), ["ccc", "bb", "x1", "a"])
  assert.deepEqual(input.map(o => o.option), ["bb", "a", "ccc", "x1"])
})

test("questionStatuses uses the first click against the sorted order", () => {
  // sorted: 0 = "bbbb" (wrong), 1 = "a" (right)
  const ans = [{ option: "a", bool: true }, { option: "bbbb", bool: false }]
  const data = [q(ans), q(ans), q(ans)]
  const clicked = [{ questionIndex: 0, optionIndex: [1] }, { questionIndex: 1, optionIndex: [0, 1] }]
  assert.deepEqual(questionStatuses(data, clicked), ["right", "wrong", "unanswered"])
})

test("zero-correct question is wrong whatever is clicked", () => {
  const data = [q([{ option: "a", bool: false }, { option: "b", bool: false }])]
  assert.deepEqual(questionStatuses(data, [{ questionIndex: 0, optionIndex: [0] }]), ["wrong"])
})

test("missedIndices = wrong + unanswered", () => {
  assert.deepEqual(missedIndices(["right", "wrong", "unanswered", "right"]), [1, 2])
})

test("nextMissed / prevMissed are relative to the current index", () => {
  const r = [1, 4, 7]
  assert.equal(nextMissed(r, 0), 1); assert.equal(nextMissed(r, 4), 7); assert.equal(nextMissed(r, 5), 7); assert.equal(nextMissed(r, 7), undefined)
  assert.equal(prevMissed(r, 7), 4); assert.equal(prevMissed(r, 5), 4); assert.equal(prevMissed(r, 1), undefined)
})

test("optionIndexForKey", () => {
  assert.equal(optionIndexForKey("a", 5), 0); assert.equal(optionIndexForKey("E", 5), 4)
  assert.equal(optionIndexForKey("f", 5), null); assert.equal(optionIndexForKey("3", 5), 2)
  assert.equal(optionIndexForKey("0", 5), null); assert.equal(optionIndexForKey("j", 10), 9)
  assert.equal(optionIndexForKey("ArrowRight", 5), null); assert.equal(optionIndexForKey("ab", 5), null)
})

test("optionLetter", () => {
  assert.equal(optionLetter(0), "A"); assert.equal(optionLetter(9), "J")
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `node --test $SCRATCH/quizLogic.test.ts`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `quizLogic.ts`.

- [ ] **Step 4: Add the two types to `types.ts` and implement `quizLogic.ts`** per the Interfaces block.

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test $SCRATCH/quizLogic.test.ts`
Expected: `pass 7`, `fail 0`.

- [ ] **Step 6: Switch `Options.tsx` to the shared helper.** Replace the inline `useMemo` sort body with `sortOptions(options)` (keep the existing comment about deterministic order), and replace the local `clicked` type with `Clicked` from `./types`. No behaviour change.

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: "Compiled successfully", TypeScript passes, ~413 static pages generated. Note the exact
"Generating static pages (N/N)" count; Task 7 compares against it.

- [ ] **Step 8: Commit**

```bash
git add app/_QAFormat/quizLogic.ts app/_QAFormat/types.ts app/_QAFormat/Options.tsx
git commit -m "Extract shared quiz logic: option sort, question status, review stepping, key mapping"
```

---

### Task 2: Colour-coded progress map

**Files:**
- Create: `app/_QAFormat/ProgressMap.tsx` (`"use client"`)
- Modify: `app/_QAFormat/Header.tsx` (whole file)
- Modify: `app/_QAFormat/Format.tsx`

**Interfaces:**
- Consumes: `questionStatuses`, `QuestionStatus` (Task 1).
- Produces:
  - `ProgressMap({ statuses, index, open, onOpenChange, onJump }: { statuses: QuestionStatus[], index: number, open: boolean, onOpenChange: (open: boolean) => void, onJump: (i: number) => void })`
  - `Header({ questionOrigin, counterLabel, onOpenMap }: { questionOrigin: string, counterLabel: string, onOpenMap: () => void })`
  - In `Format`: `const statuses = useMemo(() => questionStatuses(data, clickedOption), [data, clickedOption])`, `const [mapOpen, setMapOpen] = useState(false)`, and `jump(i: number)`, which does `setIndex(i)`, `lock.current = false`, `setMapOpen(false)`. Task 6 extends `counterLabel`; until then it is `` `${index + 1} / ${totalQuestions}` ``.

- [ ] **Step 1: Implement `ProgressMap`.**
  - **Bar:** a `<button aria-label="Open question map">` holding one `<span>` per question, in the status colours from Global Constraints (current = `bg-brand`), `h-2 rounded-full overflow-hidden flex`. Use `gap-px` only when `statuses.length <= 150`; above that, no gap (1,205 one-pixel gaps would swallow the bar). Clicking it calls `onOpenChange(true)`.
  - **Sheet:** `<Sheet open onOpenChange>` with `side="right"` and a scrollable body. Title "Questions". Summary line `${right} right · ${wrong} wrong · ${unanswered} left`. A grid (`grid-cols-6 sm:grid-cols-8`) of numbered buttons, 1-based, with the same colours. The current question gets `ring-2 ring-brand` and `aria-current="true"`. Each button has `aria-label="Question N, <status>"` and calls `onJump(i)`.
  - **Open behaviour:** on `onOpenAutoFocus`, `preventDefault()`, then `scrollIntoView({ block: "center" })` and `focus()` the current question's button.
- [ ] **Step 2: Rewrite `Header`.** It shows the gradient origin text and a counter `<button>` (lucide `LayoutGrid` icon + `counterLabel`) that calls `onOpenMap`, on all widths. Remove the old divider lines and the separate mobile counter, because the bar replaces them. The origin must be able to wrap (`min-w-0`), and the counter must not shrink (`shrink-0`).
- [ ] **Step 3: Wire it into `Format`.** Add `statuses`, `mapOpen` and `jump`, pass the new props to `Header`, and render `<ProgressMap … />` directly under `<Header>`.
- [ ] **Step 4: Build.** Run `npm run build`; expect it to succeed.
- [ ] **Step 5: Browser check.** Run `npm run dev` and use the Playwright MCP against `http://localhost:3000/PastPapers/3rd-year/hematology/2023`.
  - Pick a wrong option first on Q1, then the right one: the Q1 slice is red.
  - On Q2, pick the right option first: the slice is green. Q3 onwards stays grey, and the current slice is cyan.
  - Click the counter: the sheet opens, scrolled to the current question, with the summary "1 right · 1 wrong · 79 left". Click "40": the sheet closes and the header reads "40 / 81".
- [ ] **Step 6: Review Focus #1 (saved sessions).** Answer 3 questions, then reload. Accept "Resume": the bar shows the same three colours, restored from `${pathname}-module`.
- [ ] **Step 7: Review Focus #5 (extremes of size).**
  - Resize to 390×844 and open `/PastPapers/2nd-year/neuroscience/compiled`. The header wraps the long origin, the counter stays one line, and `document.documentElement.scrollWidth <= 390`.
  - The bar is visible across 1,205 questions. Opening the sheet and scrolling the grid has no visible lag, and jumping to 1205 works.
- [ ] **Step 8: Commit.** Delete `.playwright-mcp/` first.

```bash
git add app/_QAFormat/ProgressMap.tsx app/_QAFormat/Header.tsx app/_QAFormat/Format.tsx
git commit -m "Add colour-coded progress bar and jump-to-question map to quizzes"
```

---

### Task 3: Keyboard answering and option badges

**Files:**
- Modify: `app/_QAFormat/Options.tsx`
- Modify: `app/_QAFormat/Format.tsx:93-100` (arrow-key handler)

**Interfaces:**
- Consumes: `optionIndexForKey`, `optionLetter`, `isQuizKeyBlocked` (Task 1).

- [ ] **Step 1: Add badges.** Each option button starts with a badge showing `optionLetter(optionIndex)`, in sorted display order. The badge must stay readable on the red and green answered backgrounds and in dark mode (for example `bg-background/80 text-muted-foreground`, a fixed size, rounded).
- [ ] **Step 2: Add the key listener in `Options`.** A `useEffect` registers a document `keydown` listener that does the following:
  - returns if `isQuizKeyBlocked(e)`;
  - gets `i = optionIndexForKey(e.key, sortedOptions.length)` and returns if it's `null`;
  - otherwise calls `e.preventDefault()` and runs the same `optionClick(questionIndex, i, sortedOptions[i])` path as a mouse click.

  Re-register when the click inputs change, so the handler never scores against a stale `alreadyAnswered`.
- [ ] **Step 3: Guard the arrow keys.** In `Format`'s existing arrow-key handler, return early when `isQuizKeyBlocked(e)`.
- [ ] **Step 4: Build.** Run `npm run build`; expect it to succeed.
- [ ] **Step 5: Browser checks.**
  - On `hematology/2023`: pressing `d` answers the 4th option, exactly like clicking it; pressing `2` on the next question answers the 2nd option.
  - `Ctrl+C` and `Ctrl+A` don't answer anything.
  - With the map sheet open, `a` does nothing and ArrowRight doesn't move the quiz behind the sheet.
- [ ] **Step 6: Review Focus #2 (10-option question).** On `/PastPapers/1st-year/respiratory/2025`, go to question 7. The badges run A–J, and `j` picks the 10th option.
- [ ] **Step 7: Review Focus #3 (other dialogs).**
  - On `/SystemReview/immune-system`, open the Hint dialog: `a` doesn't answer.
  - At 390px width, open the nav menu sheet: `a` doesn't answer.
- [ ] **Step 8: Commit.** Delete `.playwright-mcp/` first.

```bash
git add app/_QAFormat/Options.tsx app/_QAFormat/Format.tsx
git commit -m "Answer quiz options with A-J / 1-9 keys and show option letters"
```

---

### Task 4: Finished papers are read-only (and stop re-saving)

**Files:**
- Modify: `app/_QAFormat/useQuizPersistence.ts:31-58` (debounced save)
- Modify: `app/_QAFormat/Options.tsx`, `app/_QAFormat/Format.tsx` (pass the ref)

**Interfaces:**
- Consumes: the existing `recorded: RefObject<boolean>`. It is set `true` in the finish effect and reset in `Retake`, and it now doubles as the "finished" signal.
- Produces: an `Options` prop `finished: RefObject<boolean>`.

- [ ] **Step 1: Reproduce the bug before changing anything.** On `/PastPapers/5th-year/obstetrics/2011` (4 questions):
  1. Answer Q1, go to Q4 and press Finish.
  2. Close the dialog, press Back twice, wait 1 second, then reload.

  Expected **today**: the "Resume from where you left off?" dialog appears, which is the bug.
- [ ] **Step 2: Fix the save.** In the debounced save, check `recorded.current` **inside** the `setTimeout` callback and return if it's true. Checking at fire time also catches a save that was queued in the 300ms before Finish.
- [ ] **Step 3: Ignore clicks after finish.** `Options` takes `finished`, and `optionClick` returns immediately when `finished.current` is true (so the keyboard path is covered too). `Format` passes `recorded`.
- [ ] **Step 4: Build.** Run `npm run build`; expect it to succeed.
- [ ] **Step 5: Repeat the Step 1 check.**
  - No resume dialog appears.
  - `localStorage.getItem("/PastPapers/5th-year/obstetrics/2011-module")` is `null`.
  - The `-performance` array has exactly one new entry.
  - After closing the dialog, clicking an unanswered option does nothing.
  - After Retake, options are clickable again and progress saves again: reload mid-quiz and the resume dialog appears.
- [ ] **Step 6: Commit.** Delete `.playwright-mcp/` first.

```bash
git add app/_QAFormat/useQuizPersistence.ts app/_QAFormat/Options.tsx app/_QAFormat/Format.tsx
git commit -m "Make finished quizzes read-only and stop re-saving them as in-progress"
```

**Added mid-build (user request, spec Goal 5): resume at the last answered question.**

- [ ] **Step 7: Write the failing test.** Append to `$SCRATCH/quizLogic.test.ts`: `resumeIndexFor(clicked: Clicked, total: number): number`.
  - `[]` gives 0.
  - Answering Q1–Q5 in order gives 5.
  - Answering Q1–Q5, then jumping to answer Q50 (index 49), gives 50.
  - With the last entry on the last question, `resumeIndexFor([…, { questionIndex: 80 }], 81)` gives 80.
  - Run it: FAIL with `resumeIndexFor is not a function` / a missing export.
- [ ] **Step 8: Implement `resumeIndexFor` in `quizLogic.ts`.** It returns `min(last.questionIndex + 1, total - 1)`, or 0 when nothing is answered. Run the test: `pass 8`.
- [ ] **Step 9: Use it in the debounced save.** Both branches set `resumeIndex` (stored and ref) to `resumeIndexFor(clickedOption, totalQuestions)` instead of the max-index logic. `ResumeModal` takes `answered: number` (Format passes `clickedOption.length`) and shows `Score so far: ${score}/${answered}`.
- [ ] **Step 10: Browser check.**
  1. On `hematology/2023`, answer Q1–Q2, jump to Q40 through the map and reload.
  2. The dialog says "You left off at question number: 3" and "Score so far: x/2". Resume lands on Q3.
  3. Commit as `Resume quizzes after the last answered question, not the furthest one viewed` with `quizLogic.ts`, `useQuizPersistence.ts`, `ResumeModal.tsx` and `Format.tsx`.

---

### Task 5: Next paper / Back links on the finish screen

**Files:**
- Modify: `app/(PastPapers)/PastPapers/[...QA]/page.tsx`
- Modify: `app/(SystemReview)/SystemReview/[QA]/page.tsx`
- Modify: `app/_QAFormat/Format.tsx` (props)
- Modify: `app/_QAFormat/FinishModal.tsx`

**Interfaces:**
- Consumes: `QuizLink` (Task 1), `yearsFor` (`app/(PastPapers)/pastPapers.ts`), `systems` (`app/(SystemReview)/SystemReview/systems.ts`).
- Produces:
  - `Format({ data, next, back }: { data: Quiz, next?: QuizLink, back: QuizLink })`
  - New `FinishModal` props `next?: QuizLink` and `back: QuizLink`. The `HomeRedirect` button is removed.

- [ ] **Step 1: Compute the links in the Past Papers page.**
  - `tags = yearsFor(annual, module)`. The next tag is the one after `year` (compare as `String(t) === year`).
  - `next = { href: \`/PastPapers/${annual}/${module}/${tag}\`, label: \`Next paper: ${tag === "compiled" ? "Compiled" : tag}\` }`, or `undefined` when there is no next tag.
  - `back = { href: \`/PastPapers/${annual}\`, label: "Back to 3rd Year" }`, built from `annual` as "Nth Year".
  - Render `<Format key={QA.join("/")} data={data} next={next} back={back} />`.
- [ ] **Step 2: Compute the links in the System Review page.**
  - `next` is the next entry in `systems`, with label `` `Next system: ${name}` ``, where `name` has hyphens turned into spaces and the first letter capitalised.
  - `back = { href: "/SystemReview", label: "Back to systems" }`.
  - Use `key={QA}`.
- [ ] **Step 3: Update `FinishModal`.**
  - The description reads `` `Score: ${score} / ${total} (${pct}%)` ``, rounded to whole percent.
  - Buttons, in order:
    1. `next` (if present): a `Link` styled as `variant="brand"`, with the label and a lucide `ArrowRight`.
    2. "Retake quiz" (unchanged).
    3. `back`: `variant="outline"`, the label as text, closes the dialog before navigating.
- [ ] **Step 4: Build.** Run `npm run build`; expect it to succeed with the same page count as before.
- [ ] **Step 5: Browser checks.**
  - On `obstetrics/2011`, finish. "Next paper: 2012" lands on `/PastPapers/5th-year/obstetrics/2012` showing "1 / N" with an all-grey bar (a fresh quiz, not the old index).
  - "Back to 5th Year" lands on `/PastPapers/5th-year`.
- [ ] **Step 6: Review Focus #4 (edges).**
  - Finishing `/PastPapers/5th-year/obstetrics/compiled` shows no Next button. Jump via the map to the last question to reach Finish quickly.
  - `/SystemReview/social-sciences` shows no Next button.
  - `/SystemReview/blood-and-lymphoreticular-system` shows "Next system: Immune system", which goes to `/SystemReview/immune-system`.
- [ ] **Step 7: Commit.** Delete `.playwright-mcp/` first.

```bash
git add "app/(PastPapers)/PastPapers/[...QA]/page.tsx" "app/(SystemReview)/SystemReview/[QA]/page.tsx" app/_QAFormat/Format.tsx app/_QAFormat/FinishModal.tsx
git commit -m "Add Next paper and Back links to the quiz finish screen"
```

---

### Task 6: Review missed questions

**Files:**
- Modify: `app/_QAFormat/Format.tsx`
- Modify: `app/_QAFormat/Footer.tsx` (whole file)
- Modify: `app/_QAFormat/Options.tsx`
- Modify: `app/_QAFormat/FinishModal.tsx`

**Interfaces:**
- Consumes: `missedIndices`, `nextMissed`, `prevMissed` (Task 1); `statuses` and `jump` (Task 2); `finished` (Task 4).
- Produces:
  - In `Format`: `const [review, setReview] = useState<number[] | null>(null)`.
  - `Footer({ canBack, isLast, finishLabel, Back, Next, Finish }: { canBack: boolean, isLast: boolean, finishLabel: string, Back: () => void, Next: () => void, Finish: () => void })`
  - New `Options` prop `reveal: boolean`.
  - New `FinishModal` props `missedCount: number` and `onReview: () => void`.

- [ ] **Step 1: Start review from the finish dialog.** Add `startReview()` to `Format`:
  - `const m = missedIndices(statuses)`;
  - `setReview(m)`, `setIndex(m[0])`, `lock.current = false`, `setFinishModal(false)`.

  `FinishModal` shows a "Review missed (N)" button **first**, and only when `missedCount > 0`.
- [ ] **Step 2: Step through missed questions only.** While `review` is set:
  - `Next` goes to `nextMissed(review, index)` and `Back` to `prevMissed(review, index)`. Swipe and arrow keys already call these functions.
  - The Footer gets `canBack = prevMissed(...) !== undefined`, `isLast = nextMissed(...) === undefined` and `finishLabel = "Finish review"`. Outside review it gets `canBack = index > 0`, `isLast = index + 1 === totalQuestions` and `finishLabel = "Finish"`.
  - The Footer renders the Finish button (calling `Finish`, which reopens the dialog) when `isLast`, and Next otherwise.
- [ ] **Step 3: Show the review position in the header.** `counterLabel` becomes `` `Reviewing ${review.filter(i => i <= index).length} / ${review.length}` `` during review.
- [ ] **Step 4: Reveal answers in review.** `Options` takes `reveal`. When it's true, every option with `bool: true` gets the green class and shows its `explanation`, alongside any recorded picks. Clicks are already ignored because of `finished`.
- [ ] **Step 5: Retake leaves review.** `Retake` also calls `setReview(null)`.
- [ ] **Step 6: Build.** Run `npm run build`; expect it to succeed.
- [ ] **Step 7: Browser check.** Use `obstetrics/2011` and look up the correct options in `Database/PastPapers/5th-year/obstetrics/obstetrics-2011.json`.
  1. Answer as follows: Q1 right; Q2 wrong then right; skip Q3; Q4 wrong. Then Finish.
  2. The dialog shows "Review missed (3)". Starting review lands on Q2 with the header "Reviewing 1 / 3". Your red pick and the green correct option both show, and Back is disabled.
  3. Next goes to Q3: the correct option is green and nothing is red. Next goes to Q4, where the button reads "Finish review" and reopens the dialog.
  4. Close the dialog, jump to Q1 through the map, then press Next: it lands on Q2.
  5. Clicking options during review changes nothing.
  6. Retake: the header reads "1 / 4", the bar is all grey, and answering works again.
- [ ] **Step 8: Review Focus #4 (all correct).** Answer every question in `obstetrics/2011` correctly: no "Review missed" button appears.
- [ ] **Step 9: Review Focus #2 (zero-correct question).** On `/PastPapers/5th-year/gynecology/2013`:
  1. Jump to Q61 and click both options: both turn red, and its slice is red.
  2. Jump to the last question and Finish.
  3. Review includes Q61. It shows no green option and no error in the console.
- [ ] **Step 10: Commit.** Delete `.playwright-mcp/` first.

```bash
git add app/_QAFormat/Format.tsx app/_QAFormat/Footer.tsx app/_QAFormat/Options.tsx app/_QAFormat/FinishModal.tsx
git commit -m "Add Review missed mode that steps through wrong and skipped questions with answers shown"
```

---

### Task 7: Final sweep

**Files:** none expected. Fix anything found inside the task that owns it.

- [ ] **Step 1: Re-run the logic tests.** Run `node --test $SCRATCH/quizLogic.test.ts` and expect `pass 7`.
- [ ] **Step 2: Build.** Run `npm run build`. Expect success, with the static page count identical to the one noted in Task 1 Step 7.
- [ ] **Step 3: Dark mode.** Toggle dark mode on `hematology/2023`. The bar, sheet, badges on grey/red/green options, the review reveal and the finish dialog are all legible.
- [ ] **Step 4: Phone width end to end.** At 390×844, swipe through a few questions, open the map, finish `obstetrics/2011`, review, and use Next paper. There is no horizontal scroll at any point.
- [ ] **Step 5: Clean up.** Delete `.playwright-mcp/`. `git status` should show a clean tree apart from the committed work.
