# MedEval

A free study hub for MBBS students: past papers as interactive quizzes, a book bank, a hospital
map and a performance tracker. Live at [med-eval.vercel.app](https://med-eval.vercel.app).

Built with Next.js 16, React 19 and Tailwind CSS 4. There is no backend, database server or login:
all content is static files in `Database/`, prerendered at build time, and each student's progress,
bookmarks and attempt history stay in their own browser's `localStorage`.

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build; also the type check
npm run start   # serve the production build
npm run lint
```

There is no test suite. `npm run build` prerenders every page (~410), so a passing build means
every paper and book list loaded.

## Content

| Folder | Holds |
|---|---|
| `Database/PastPapers/<year>/<module>/` | One JSON file per paper, named `<module>-<YYYY>.json` or `<module>-compiled.json` |
| `Database/BookBank/<subject>.json` | Book entries; downloads are Google Drive file IDs, covers live in `public/covers/` |
| `Database/SystemReview/<system>.jsx` | System Review questions (built, but hidden from the menu) |

Module folders must match the names in `MODULE_ORDER` (`app/(PastPapers)/modules.ts`) exactly.
Adding a module or year needs a code change there too; see `CLAUDE.md` for the steps and the data
shapes.

## Deploying

Hosted on Vercel. `public/robots.txt` and `public/sitemap.xml` must not exist: they would shadow
`app/robots.ts` and `app/sitemap.ts`.
