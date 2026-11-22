# Question Highlighting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let students tap words in a question stem to highlight them (tap again to clear that word), with highlights cleared whenever they move off the question.

**Architecture:** Two pure helpers in `quizLogic.ts` split the stem into words and group them into highlighted / plain runs. `Question.tsx` keeps the highlighted word indices in local state and renders each run, wrapping highlighted runs in one `<mark>`. `Format.tsx` keys `<Question>` by index plus a small `visit` counter, so every move remounts it and the state clears.

**Tech Stack:** Next.js 16 / React 19, Tailwind v4 (`dark:` = `&:is(.dark *)`). Logic is checked with `node --test` (Node 24 strips TS types natively). UI is checked with `npm run build` plus Playwright MCP against a production `npx next start`.

**Spec:** `docs/superpowers/specs/2026-11-22-question-highlighting-design.md`

## Global Constraints

- No new npm dependencies. Nothing written to `localStorage`: no new keys, and no change to `-module`, `-performance` or `bookmarks`.
- Stem only. Options, hints and explanations are untouched.
- No keyboard shortcut and no hint text. A pointer cursor on words is the only affordance.
- Swipe navigation (`useSwipeable` in `Format.tsx`) stays exactly as it is.
- With nothing highlighted, the stem reads and wraps as it does today: same `<p>` classes, words separated by single spaces, newlines collapsed.
- Highlight: `<mark>` with `bg-yellow-200 text-inherit rounded-sm box-decoration-clone dark:bg-yellow-500/40` and **no padding**, so tapping causes no reflow.
- Match each file's existing style (2-space indent, no semicolons). Comments only where the why isn't obvious.
- `npm run lint` is broken; `npm run build` is the type-check gate.
- Work on branch `question-highlighting`. Commit only the files a task names, never `git add -A`. Playwright MCP writes into `.playwright-mcp/`: delete it after browser checks. `docs/` stays uncommitted, as with pieces A–C.
- `$SCRATCH` = `/tmp/claude-1000/-home-jillani-Programming-Next-med-eval/789710ac-c09b-432e-97ee-21ae9ee02c62/scratchpad`. The test file lives there and is not committed.

## Review Focus

1. **Tap vs swipe on a phone:** a tap on a word toggles it without navigating. A horizontal swipe that starts on a word navigates and leaves no highlight behind (Task 2, Step 6).
2. **Desktop double-click:** double-clicking a word (native word selection) leaves it highlighted after the first click instead of flickering on then off. Clicks with `event.detail > 1` are ignored (Task 2, Step 6).
3. **Same-index moves still clear:** after answering everything right except the last question, highlighting the last question and then Finish → Review missed (review starts on that same index) shows it cleared. The same goes for Retake landing on the index you're already on (Task 2, Step 6).
4. **Highlighting never touches the quiz:** after tapping words, pressing A still answers, the score is unchanged, and no localStorage value changes from the tap itself (Task 2, Step 6).
5. **Messy stems:** a stem with newlines or repeated spaces renders with no empty clickable tokens and no doubled spaces, and stays readable in dark mode (Task 1 tests, Task 2 Step 6).

---

### Task 1: Stem word and run helpers

**Files:**
- Modify: `app/_QAFormat/quizLogic.ts` (append at end)
- Test (not committed): `$SCRATCH/highlight.test.ts`

**Interfaces:**
- Produces:
  - `stemWords(question: string): string[]` splits on any whitespace and drops empty strings. Punctuation stays attached to its word.
  - `export type WordRun = { start: number, end: number, marked: boolean }` (`end` exclusive)
  - `markRuns(count: number, marked: ReadonlySet<number>): WordRun[]` covers `0..count-1` with maximal consecutive runs of the same marked state, in order. `count === 0` → `[]`.

- [ ] **Step 1: Branch.** Run: `git checkout -b question-highlighting`

- [ ] **Step 2: Write the failing tests** in `$SCRATCH/highlight.test.ts`, importing `stemWords`, `markRuns` from the absolute path of `app/_QAFormat/quizLogic.ts`, using `node:test` and `node:assert/strict`:

```ts
test("stemWords collapses whitespace and keeps punctuation", () => {
  assert.deepEqual(stemWords("  A 45-year-old\nwoman,  with\tpain. "), ["A", "45-year-old", "woman,", "with", "pain."])
  assert.deepEqual(stemWords(""), [])
  assert.deepEqual(stemWords("   "), [])
})

test("markRuns groups consecutive words by state", () => {
  assert.deepEqual(markRuns(0, new Set()), [])
  assert.deepEqual(markRuns(3, new Set()), [{ start: 0, end: 3, marked: false }])
  assert.deepEqual(markRuns(5, new Set([1, 2, 4])), [
    { start: 0, end: 1, marked: false },
    { start: 1, end: 3, marked: true },
    { start: 3, end: 4, marked: false },
    { start: 4, end: 5, marked: true },
  ])
  assert.deepEqual(markRuns(2, new Set([0, 1])), [{ start: 0, end: 2, marked: true }])
})

test("markRuns ignores indices outside 0..count-1", () => {
  assert.deepEqual(markRuns(2, new Set([-1, 5])), [{ start: 0, end: 2, marked: false }])
})
```

- [ ] **Step 3: Run to verify they fail.** Run: `node --test $SCRATCH/highlight.test.ts`. Expected: FAIL (export not found).

- [ ] **Step 4: Implement** `WordRun`, `stemWords` and `markRuns` at the end of `app/_QAFormat/quizLogic.ts`. Keep the file free of runtime imports (it only uses `import type`).

- [ ] **Step 5: Run to verify they pass.** Run: `node --test $SCRATCH/highlight.test.ts`. Expected: all pass. Then `npm run build`; expect success.

- [ ] **Step 6: Commit**

```bash
git add app/_QAFormat/quizLogic.ts
git commit -m "Add helpers that split a question stem into words and group highlighted runs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 2: Tap-to-highlight in the question, cleared on every move

**Files:**
- Modify: `app/_QAFormat/Question.tsx` (whole file, 8 lines today)
- Modify: `app/_QAFormat/Format.tsx` (state block near the top; `startReview`; `Retake`; the `<Question … />` line)

**Interfaces:**
- Consumes: `stemWords`, `markRuns`, `WordRun` from Task 1.
- Produces: `Question` keeps its props `{ question: string }`. `Format` renders it as `<Question key={`${index}-${visit}`} question={data[index].question} />`.

- [ ] **Step 1: Implement `Question.tsx`.**
  - State: `marked: ReadonlySet<number>`, initially empty, always replaced with a new `Set` on toggle (never mutated). `words = useMemo(() => stemWords(question), [question])`.
  - Keep the existing `<p className="text-lg sm:text-xl leading-relaxed my-6 text-pretty">`.
  - Render `markRuns(words.length, marked)`. A plain run is its words. A marked run is one `<mark>` (classes from Global Constraints) containing its words. Within a run, words are joined by a single `" "`, so the space between two highlighted words is inside the `<mark>`. Between runs, a single `" "` sits outside any `<mark>`.
  - Each word is a `<span className="cursor-pointer">` whose `onClick` toggles its own index, so tapping inside a phrase clears only that word. Ignore the click when `e.detail > 1`.
  - No `role="button"`, no `tabIndex`, no key handler: the stem must stay plain readable text for screen readers.

- [ ] **Step 2: Implement the remount in `Format.tsx`.**
  - Add `const [visit, setVisit] = useState<number>(0)`, with a one-line comment: it is bumped by moves that can land on the index already shown, so the stem's highlights still clear.
  - In `startReview` and `Retake`, call `setVisit(v => v + 1)` next to their `setIndex(…)`.
  - Change the question line to `<Question key={`${index}-${visit}`} question={data[index].question} />`.
  - Do **not** bump `visit` in `jump`: tapping the current question's chip in the map isn't leaving the question. Back, Next, swipe, the map and Resume change `index`, which already remounts.

- [ ] **Step 3: Build.** Run: `npm run build`. Expected: success, with the same route count as before (~413 pages).

- [ ] **Step 4: Confirm the prerendered stem.** Run: `grep -c '<span class="cursor-pointer">' ".next/server/app/PastPapers/1st-year/blood/2016.html"`. Expected: > 0, and no `<mark` in that file (nothing highlighted at render).

- [ ] **Step 5: Start production.** Run (background): `npx next start`. Find or kill a stale :3000 listener with `ss -ltnp`, not `lsof`.

- [ ] **Step 6: Browser checks** with Playwright MCP at a 390×844 viewport on a long-stem paper (pick one where the first question is 40+ words), then at desktop width:
  - Tap 3 adjacent words → one continuous yellow band. Tap the middle one → only it clears, leaving two separate marks. Tap the rest → nothing highlighted, and the stem looks identical to before.
  - Highlight a word, then Next and Back → cleared. Same via the map to another question, and ArrowRight/ArrowLeft.
  - Review Focus 1: dispatch a horizontal touch swipe (`touchstart`/`touchmove`/`touchend` via `browser_evaluate`) starting on a word → the question changes and no `<mark>` remains. If the emulation can't produce a swipe, say so and leave it for a real-phone check instead of claiming it passed.
  - Review Focus 2: double-click a word at desktop width → it stays highlighted.
  - Review Focus 3: answer every question right except the last, highlight the last, Finish → Review missed → cleared. Then Retake → Q1 with nothing highlighted.
  - Review Focus 4: snapshot `JSON.stringify(localStorage)`, tap words, compare → identical. Press A → the question is answered as before.
  - Review Focus 5: toggle dark mode → highlighted text is readable. Check one stem containing a newline (find one with `grep -l '\\n' Database/PastPapers/*/*/*.json | head`) → no doubled spaces.
  - With words highlighted, the header Copy button still copies the plain stem and lettered options (it builds text from data, not the DOM). Long-press copy can't be emulated reliably: list it for a real-phone check.
  - Saved quiz (`/Saved?practise=all`, with at least one bookmark) → tapping works the same.
  - Then stop the server and `rm -rf .playwright-mcp`.

- [ ] **Step 7: Commit**

```bash
git add app/_QAFormat/Question.tsx app/_QAFormat/Format.tsx
git commit -m "Let students tap words in a question to highlight key points, cleared on leaving the question

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 8: Update `CLAUDE.md`.** In the QA Format Engine section, add one sentence after the `HintDifficulty` paragraph: stem words are tappable highlights held in `Question`'s local state (`stemWords`/`markRuns` in `quizLogic.ts`), never persisted, and cleared on every move because `Format` keys `<Question>` by `` `${index}-${visit}` `` (`visit` bumps in Retake and Review). Commit it on its own (`git add CLAUDE.md`), with the same attribution line.
