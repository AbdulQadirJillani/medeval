# Markdown Explanations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render private explanations as GitHub-flavoured Markdown (headings, lists, tables, line breaks kept), and raise their length limit to 20,000 characters.

**Architecture:** The react-markdown options (plugins, heading shift, table wrapper, link attributes) live in a JSX-free `.ts` module, so `node --test` can render them with `react-dom/server`. A small client component applies them inside a styled wrapper. `Explanation.tsx` loads that component with `next/dynamic`, so only key holders download it. The shared limits in `lib/explanations.ts` change: `MAX_TEXT` 5,000 → 20,000, `MAX_KEYS` 2,000 → 100.

**Tech Stack:** Next.js 16 / React 19, Tailwind v4 (`dark:` = `&:is(.dark *)`), react-markdown 10.1.0, remark-gfm 4.0.1, remark-breaks 4.0.0. Logic is checked with `node --test` (Node 24 strips TS types). UI is checked with `npm run build` plus Playwright MCP against a production `npx next start` wired to the fake Upstash.

**Spec:** `docs/superpowers/specs/2026-11-22-markdown-explanations-design.md`

## Global Constraints

- New dependencies, exactly these and nothing else: `react-markdown@10.1.0`, `remark-gfm@4.0.1`, `remark-breaks@4.0.0` (in `dependencies`). No rehype-raw, and no typography plugin.
- Raw HTML in an explanation is never rendered as HTML.
- Headings shift down two levels: `h1→h3`, `h2→h4`, `h3→h5`, `h4`/`h5`/`h6→h6`.
- Tables render inside `<div class="overflow-x-auto">`. Links get `target="_blank"` and `rel="noopener noreferrer"`.
- `MAX_TEXT = 20000`, `MAX_KEYS = 100`. The textarea's `maxLength` keeps using `MAX_TEXT`.
- Keyless visitors download no Markdown code: the renderer is only reachable through `next/dynamic`, with `loading: () => null`.
- Match each file's existing style (2-space indent, no semicolons). Comments only where the why isn't obvious.
- `npm run build` is the type-check gate. `npm run lint` must not report more than **18 problems (16 errors, 2 warnings)**.
- Work on branch `markdown-explanations`. Commit only the files a task names. Delete `.playwright-mcp/` after browser checks. Kill a stale `:3000` / `:8079` listener found with `ss -ltnp`.
- `$SCRATCH` = `/tmp/claude-1000/-home-jillani-Programming-Next-med-eval/7e099d98-4653-467b-b5d7-86524d5d8199/scratchpad`. It already has `ts-resolve.mjs`, `explanations.test.ts`, `route.test.ts` and `fake-upstash.mjs`. Run tests with `node --import $SCRATCH/ts-resolve.mjs --test <files>`.

## Review Focus

1. **Keyless visitors download nothing new:** answering a question without a key fetches no chunk containing the Markdown renderer (Task 2 Step 8).
2. **Wide table on a phone (390×844):** the table scrolls inside its box, and the page never scrolls sideways (`documentElement.scrollWidth <= 390`) (Task 2 Step 8).
3. **A long note survives:** pasting the owner's sample note (over 5,000 characters) keeps every character, saves, and renders formatted after a reload (Task 2 Step 8).
4. **Plain notes keep their lines:** a note written as separate lines still shows them on separate lines (Task 2 `<br/>` test, Step 8).
5. **Dark mode:** table borders, the header row, and headings are readable (Task 2 Step 8).

---

### Task 1: Raise the length limit and shrink read chunks

**Files:**
- Modify: `lib/explanations.ts` (`MAX_TEXT`, `MAX_KEYS`)
- Modify: `app/_QAFormat/Explanation.tsx` (textarea `rows` 8 → 14)
- Test (not committed): `$SCRATCH/explanations.test.ts`

**Interfaces:**
- Produces: `MAX_TEXT = 20000`, `MAX_KEYS = 100`, consumed unchanged by `parseReadBody`, `parseWriteBody`, `useExplanations` chunking, and the textarea.

- [ ] **Step 1: Branch and commit the docs.** Run `git checkout -b markdown-explanations`, then commit the spec and this plan: `git add docs/superpowers/specs/2026-11-22-markdown-explanations-design.md docs/superpowers/plans/2026-11-22-markdown-explanations.md`.
- [ ] **Step 2: Update the failing tests** in `$SCRATCH/explanations.test.ts`:
  - `parseReadBody`: 100 valid keys → length 100; 101 → `null`. These replace the 2,000 / 2,001 cases.
  - `parseWriteBody`: `" " + "x".repeat(20000) + " "` → text length 20000; `"x".repeat(20001)` → `null`. These replace the 5,000 / 5,001 cases.
  - In `$SCRATCH/route.test.ts`, the "text over 5000 characters" case becomes 20,001 characters.
- [ ] **Step 3: Run to verify they fail.** Run: `node --import $SCRATCH/ts-resolve.mjs --test $SCRATCH/explanations.test.ts $SCRATCH/route.test.ts`. Expected: FAIL on the 101-key case and the 20,000-character case (the old limits reject them).
- [ ] **Step 4: Implement:** set `MAX_TEXT = 20000` and `MAX_KEYS = 100` in `lib/explanations.ts`, and `rows={14}` on the textarea.
- [ ] **Step 5: Run to verify they pass.** Same command; expected: all pass.
- [ ] **Step 6: Commit.** `git add lib/explanations.ts app/_QAFormat/Explanation.tsx`, message `Raise explanation limit to 20,000 characters and read in chunks of 100`.

---

### Task 2: Render explanations as Markdown

**Files:**
- Modify: `package.json`, `package-lock.json` (the three dependencies)
- Create: `app/_QAFormat/markdownOptions.ts`, `app/_QAFormat/ExplanationMarkdown.tsx`
- Modify: `app/_QAFormat/Explanation.tsx` (render the text through the dynamic component), `CLAUDE.md`
- Test (not committed): `$SCRATCH/markdown.test.ts`, `$SCRATCH/sample-note.md`

**Interfaces:**
- Produces, in `markdownOptions.ts` (no JSX, built with `createElement`):
  - `export const markdownOptions: Pick<Options, "remarkPlugins" | "components">` (`Options` from `react-markdown`).
  - `remarkPlugins: [remarkGfm, remarkBreaks]`.
  - `components` does the heading shift, wraps `table` in the overflow div, and adds the link attributes from Global Constraints. Each strips react-markdown's `node` prop before passing props on.
- Produces: `ExplanationMarkdown({ text }: { text: string })`, a default export that renders `<Markdown {...markdownOptions}>{text}</Markdown>` inside a styled wrapper `div`.
  - The wrapper styles headings (modest sizes, `h3` largest), `ul` disc and `ol` decimal with left padding, nested lists, `p` margins, table borders, cell padding, a tinted header row (`th`), links underlined, `break-words`, and dark-mode variants.
- Consumes: `Explanation`'s `text` prop (unchanged).

- [ ] **Step 1: Install.** Run `npm install react-markdown@10.1.0 remark-gfm@4.0.1 remark-breaks@4.0.0`. Expected: all three in `package.json` `dependencies`, and no peer warnings for react.
- [ ] **Step 2: Write the failing tests** in `$SCRATCH/markdown.test.ts`. Each test renders with `renderToStaticMarkup(createElement(Markdown, markdownOptions, input))`, importing `markdownOptions` by absolute path.
  - `"# H\n## I\n### J\n#### K"` contains `<h3>H</h3>`, `<h4>I</h4>`, `<h5>J</h5>`, `<h6>K</h6>`, and no `<h1` or `<h2`.
  - `"| a | b |\n|---|---|\n| **x** | y |"` contains `<div class="overflow-x-auto"><table>` and `<strong>x</strong>`.
  - `"line1\nline2"` contains `line1<br/>`.
  - `"- a\n  - b"` contains `<ul>` twice. `"1. a\n2. b"` contains `<ol>`.
  - `"<35 years and >40 years"` contains `&lt;35 years`.
  - `"<script>alert(1)</script> and <b>bold</b>"` contains neither `<script` nor `<b>`.
  - `"[x](https://e.com)"` contains `target="_blank"` and `rel="noopener noreferrer"`. `"[x](javascript:alert(1))"` does not contain `javascript:`.
- [ ] **Step 3: Run to verify they fail.** Run: `node --import $SCRATCH/ts-resolve.mjs --test $SCRATCH/markdown.test.ts`. Expected: FAIL (`markdownOptions.ts` not found).
- [ ] **Step 4: Implement `markdownOptions.ts`, `ExplanationMarkdown.tsx`, and the `Explanation.tsx` change.** In `Explanation.tsx`, replace the `<p className="whitespace-pre-wrap …">{text}</p>` with `<ExplanationMarkdown text={text} />`, declared at module level as `dynamic(() => import("./ExplanationMarkdown"), { loading: () => null })`.
- [ ] **Step 5: Run to verify they pass.** Same command, plus the Task 1 suites. Expected: all pass.
- [ ] **Step 6: Update `CLAUDE.md`** (explanations section):
  - Explanations are Markdown (react-markdown, remark-gfm, remark-breaks, no raw HTML), with the heading shift, the table wrapper, and the dynamic import that keeps it out of keyless visitors' downloads.
  - The limits are now 20,000 characters and 100 keys per read.
- [ ] **Step 7: Build and lint.** Run: `npm run build` (expected: success, quiz routes still ● prerendered), then `npx eslint . 2>/dev/null | grep problems` (expected: no more than 18).
- [ ] **Step 8: Browser check (Playwright MCP, fake store + `npx next start` with the test env vars, as in the previous plan).** Save the owner's sample note (the "Infertility and Ovarian Reserve" Markdown from the conversation) to `$SCRATCH/sample-note.md`.
  - **Keyless (Review Focus 1):**
    - Find the renderer's chunk: `grep -l "remark-gfm\|micromark" .next/static/chunks/*.js`, or a distinctive string from it.
    - In a fresh context, answer Blood 2016 Q1. Expected: no request for that chunk, and no `/api/explanations` request.
  - **Author, at 390×844:**
    - Open Q1 with the write key, then fill the textarea with the sample note. Expected: `inputValue().length` equals the file's length (Review Focus 3).
    - Save, then reload and answer Q1 again. Expected: an `h3` "Infertility and Ovarian Reserve: High-Yield Notes", `h4` section headings, tables with `<strong>` cells, and nested lists.
    - Expected at phone width: a table wrapper's `scrollWidth > clientWidth`, and `document.documentElement.scrollWidth <= 390` (Review Focus 2).
  - **Plain lines (Review Focus 4):** edit Q2 to `"first line\nsecond line"` and save. Expected: the two lines render on separate lines (`<br>` present).
  - **Dark mode (Review Focus 5):** set `theme` to `"true"` and screenshot the note. Expected: table borders, the header row, and the text are readable.
  - **Reader:** in a fresh context with the read key, the note renders formatted, with no ✎.
- [ ] **Step 9: Clean up and commit.** Stop both servers, `rm -rf .playwright-mcp`, then `git add package.json package-lock.json app/_QAFormat/markdownOptions.ts app/_QAFormat/ExplanationMarkdown.tsx app/_QAFormat/Explanation.tsx CLAUDE.md`, message `Render explanations as Markdown with tables and kept line breaks`.
