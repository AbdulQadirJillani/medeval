# Question highlighting

## Why

Long questions (10% of past-paper stems are 50+ words, the longest 152) are easy to zone out on.
Students want to mark the key points of the stem as they read ("painless", "after a fatty meal")
so they stay focused and can reason toward the answer. Highlights are a **reading aid for the
question on screen**, not study notes.

## Goals

- **Tap a word in the question stem to highlight it; tap again to clear.** Works the same with a
  mouse and on phones.
- Adjacent highlighted words join into one continuous band (the space between them is highlighted
  too), so a marked phrase reads as one mark. *(my call)* Tapping a word inside a joined phrase
  clears **only that word**; the rest of the phrase stays highlighted.
- Yellow marker colour, with a darker variant in dark mode. *(my call)*
- **Highlights last only while the student stays on that question.** Any move clears them: Next,
  Back, swipe, arrow keys, the question map, Resume, Retake, and Review missed. That includes a
  move that lands back on the same question number (e.g. Retake or Review starting where the
  student already is).
- Everywhere `Format` runs: Past Papers, System Review, the Saved quiz, finished papers and
  Review-missed mode.

## Non-goals

- No saving: nothing goes to `localStorage`, no new keys, nothing in `-module` or `bookmarks`.
- No highlighting of options, hints or explanations: stem only.
- No keyboard shortcut (A–R answer, S saves; there's no free key worth taking).
- No discoverability hint. Desktop gets a pointer cursor on hover; phones rely on finding it.

## Anti-goals

- Tapping or highlighting must never answer a question, move to another question, or interfere with
  swiping, which stays as it is.
- The question must read and wrap exactly as it does today when nothing is highlighted.
- Long-press copy on phones and the header's Copy button must keep working.

## Approaches

1. **Tappable word spans in `Question.tsx`** (chosen). Split the stem on whitespace, render each
   word as a `<span>` with a click handler and the highlight set in local component state, then
   remount the component on every move so state clears. No storage, no new dependency, and a tap is
   not a swipe, so it doesn't conflict with `react-swipeable`.
2. **Select text, then a "Highlight" button.** Familiar from e-readers, good for phrases, but on
   phones a drag-select fires the quiz's swipe navigation, so swiping would have to be paused while
   selecting. Rejected: more code, and it fights the existing gesture.
3. **CSS Custom Highlight API** (`CSS.highlights` with `Range`s). Marks text without wrapping words,
   but support is missing in older phone browsers and it needs selection handling anyway. Rejected:
   more code, nothing gained.

## Left to the builder

- **How "every move" clears state.** Keying `<Question>` by `index` alone misses moves that land on
  the same index (Retake at Q1, Review starting on the current question). A small counter in
  `Format` bumped on every navigation, used in the key, covers all of them.
- **Tokenising.** Split on whitespace and keep punctuation attached to its word. 278 stems contain
  newlines; today's `<p>` collapses them, so keep collapsing them.
- Words stay in a single `<p>`, so screen readers read the stem as normal text, not 150 buttons.
- Verify with `npm run build`, plus a manual check in `npx next start` on a phone-sized viewport:
  tap toggles, swipe still navigates, every navigation path clears.
