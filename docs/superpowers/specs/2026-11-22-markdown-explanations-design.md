# Markdown explanations

## Why

The owner writes long, structured high-yield notes as explanations: headings, **bold**, nested and
numbered lists, and tables (for example ovarian reserve tests: test / timing / abnormal / key point).
Plain text can't show that structure. Explanations should be written in Markdown and shown
formatted to the owner and the reader.

## Goals

- Explanations render as GitHub-flavoured Markdown: headings, bold/italic, nested and numbered
  lists, tables, links, inline code.
- **A single line break stays a line break** (as in a chat app), so explanations already written
  as plain lines look the same as before.
- **Limit raised from 5,000 to 20,000 characters.** The owner's sample note is over 5,000, and the
  textarea silently cut text at the old limit.
- **Tables scroll sideways on phones** inside their own wrapper; the page itself never scrolls
  horizontally.
- Readable in light and dark mode, sized to sit under the question (a `#` heading isn't
  page-title size).
- Same visibility rules as today: shown once the correct option is found, or in Review.

## Non-goals

- Raw HTML in explanations (shown as typed, never rendered).
- A live preview in the editor; after saving, the box shows the formatted result.
- Formatting toolbar or Markdown help text.

## Anti-goals

- Students without a key download nothing extra and see no change.
- Nothing in an explanation can run script or inject HTML.

## Approaches

1. **react-markdown + remark-gfm + remark-breaks** (picked by the owner). These are 3 widely used
   packages. They render to React elements and never render raw HTML. GFM adds tables, and breaks
   keeps single line breaks.
2. **marked.** One package with tables and line breaks built in. It outputs an HTML string, so
   HTML blocking would be hand-written.
3. **Hand-written converter.** No new package, but it's fragile with nested lists and formatting
   inside tables.

## Design

- **Dependencies:** `react-markdown` (v10, React 19), `remark-gfm` (v4), `remark-breaks` (v4).
- **Rendering:** a new client component renders the text with those plugins. `Explanation` loads it
  with `next/dynamic`, so its code only downloads when a key holder sees an explanation. It shows
  nothing while loading, never raw Markdown. *(my call)*
- **Headings** render two levels down (`#` → `h3`, `##` → `h4`, deeper → `h5`/`h6`). That keeps
  the page outline sane under the box's own "Explanation" title, with modest sizes. *(my call)*
- **Tables** are wrapped in an `overflow-x-auto` container, with borders and padded cells. Links
  open in a new tab (`rel="noopener noreferrer"`). *(my call)*
- **Styling** is scoped Tailwind classes on the wrapper (`[&_ul]:list-disc` etc.); there's no
  typography plugin in the project, and none will be added.
- **Limit:** `MAX_TEXT` becomes 20,000 (shared by the textarea and the API). The textarea gets
  more rows, since the notes are long. *(my call)*
- **Response size:** a read chunk drops from 2,000 to 100 questions (`MAX_KEYS`). Even 100
  full-length explanations with plenty of multi-byte symbols (↑, ⭐) stay well under Vercel's
  4.5 MB response cap. A 1,355-question compiled paper then costs a key holder 14 small parallel
  requests instead of 1. Keyless visitors still send none. *(my call)*
- **Docs:** `CLAUDE.md`'s explanations section notes the Markdown rendering, the new limits, and the
  three packages.

## Left to the builder

Exact spacing, colours, and table styling, matching the quiz in both themes.
