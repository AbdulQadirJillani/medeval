# Private explanations

## Why

The owner wants to write an explanation for a past-paper question **while doing the quiz on the
live site**, from any device, and have it saved straight away. The explanations are drafts, not
ready for every student, so they must be visible to **exactly two people: the owner and one other
reader** the owner chooses. Opening them to everyone may come later; it's not part of this work.

The site has no backend today (everything is prerendered or in one browser's `localStorage`), so
saving live from the quiz needs somewhere online to store them. This adds the project's first API
route and a small hosted database.

## Goals

- **One explanation per question**, plain text with line breaks kept.
- **Only the owner can write**, from the quiz on the live site on any of their devices. Save goes
  straight to the database: no export, no commit, no deploy.
- **Only the owner and one reader can read.** The reader sees a new or changed explanation on
  their next page load.
- **Shown once the correct option has been found** on that question (on any click, not just the
  first), or straight away in Review-missed mode, where the answer is already revealed. The owner's
  ✎ box appears at the same moment, so the owner can study the paper normally and write as they go.
- **Matched by question content** (`questionKey()` in `bookmarks.ts`), not id or position. One
  explanation covers the question in its year paper, the module's `-compiled.json`, the Saved quiz,
  and any other module that repeats it. Checked 2026-11-22: all 28,065 compiled questions match a
  year-paper question exactly, and 148 questions appear in more than one module.
- **Where:** Past Papers quizzes and the Saved quiz.

## Non-goals

- System Review. It's hidden, and it already has per-option explanations in its data.
- Per-option explanations, formatting (Markdown, images, links), edit history, more than one writer.
- Publishing to all students. (Possible later, for example a script that copies the store into
  `Database/`, or an "everyone can read" switch, but nothing here builds toward it.)
- Offline editing or a retry queue.
- Explanations in the `/Sync` backup file.

## Anti-goals

- **Nobody without a key gets an explanation**: none in prerendered HTML, page source, or the
  client bundle, and no API request at all from a keyless visitor. Their pages look and load
  exactly as today.
- **Never reveal the answer early.** The quiz deliberately lets students keep guessing after a
  wrong pick, and an explanation must not appear before the correct option is found.
- **Typing an explanation must never answer, move, or bookmark** (A–R/1–9 answer, S bookmarks,
  arrows move, swipes move).
- **A failed save must not lose what the owner typed.**
- Quiz pages stay statically prerendered; the build must not grow by the explanation data.

## Constraints

- Next 16 on Vercel; quiz routes are prerendered with `dynamicParams = false`. The new route
  handler is dynamic and uncached.
- **No new npm dependencies.** Upstash Redis has a REST API, used with plain `fetch`.
- Secrets live only in Vercel environment variables (locally in `.env.local`, which `.gitignore`
  already covers via `.env*`). They must never reach the client bundle.
- Upstash free tier (generous for two people).

## Approaches

1. **Hosted database + two private keys** (picked). A free Upstash Redis database added from
   Vercel's Storage tab, one API route, a write key for the owner and a read key for the reader.
   Saves are live and truly private. The catch is that it's the first backend, and it needs an
   Upstash account.
2. **Commit each save to GitHub**, which triggers a Vercel redeploy. No new service, but every save
   rebuilds all ~413 pages (minutes before it shows), the free plan caps deploys per day, and the
   text ships in the public site (hidden, not private). Rejected.
3. **Write in the browser, export a file, import it on the laptop** into `Database/`. Picked at
   first, then dropped when the owner clarified that saves must go live from the quiz.
4. **A dev-only editor writing into `Database/`** (`npm run dev` on the laptop). Not live, and it
   can't be used from a phone. Rejected.

## Design

### Setup (one-time, by the owner)

1. Vercel project → Storage → add **Upstash for Redis** (free). Vercel injects its REST credentials
   as environment variables. Read `KV_REST_API_URL` / `KV_REST_API_TOKEN` (what the Vercel
   integration sets), falling back to `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
2. Add two env vars, each a long random string (for example `openssl rand -hex 24`):
   `EXPLAIN_WRITE_KEY` (owner) and `EXPLAIN_READ_KEY` (reader). Redeploy.
3. For local testing, `vercel env pull .env.local` or copy the values in by hand.
4. Owner opens `https://med-eval.vercel.app/?key=<write key>` once on each device; the reader opens
   `?key=<read key>` once on theirs.

A leaked link is fixed by changing that env var and redeploying: the old key stops working.

### Keys on a device

- On any page, `?key=<value>` stores the value in `localStorage` as `explain-key` (`?key=off`
  removes it). The param is then stripped with `history.replaceState(null, …)`, matching how
  `#q=`/`#k=` are stripped, and any `#…` hash is kept. No `useSearchParams`, which would force a
  Suspense boundary onto every prerendered page. *(my call)*
- **The key must be captured before `useExplanations` reads it.** Child effects run before the
  layout's, so a layout effect would be too late when the link opens a quiz page directly. Put the
  capture in the existing blocking inline script in `layout.tsx` (the theme script), or in a helper
  that `useExplanations` also calls first.
- The client doesn't decide its own role. The API answers with `role`, so a stored key that was
  rotated out simply gets nothing back. A rejected key isn't deleted automatically, so a brief
  misconfiguration on Vercel can't wipe the owner's devices. *(my call)*

### API: `app/api/explanations/route.ts`

Both methods take `Authorization: Bearer <key>`, compared against the two env vars in constant
time (`crypto.timingSafeEqual`). Anything else gets `401` and never reaches Redis.
`export const dynamic = "force-dynamic"`; every response is `Cache-Control: no-store`.

- **`POST` (read):** body `{ keys: string[] }`, base `questionKey`s (no `-1` twin suffix). Either
  key works. Runs `HMGET explanations …keys` and returns
  `{ role: "author" | "reader", explanations: { [questionKey]: string } }`, leaving out missing
  ones. It's POST rather than GET because a 1,355-question compiled paper would make a long URL.
  At most 2,000 keys per request; the client chunks above that (only "practise all" in Saved could
  exceed it).
- **`PUT` (write):** write key only (`403` for the read key). Body
  `{ key: string, text: string, info: string }`. Text is trimmed: if empty, `HDEL`, otherwise
  `HSET explanations <key> <json>`. Text over 5,000 characters gets `400`. Returns `{ ok: true }`.
- **Validation:** keys must look like `questionKey` output (base36, up to 12 characters), and the
  body must be the expected shape, or `400`.
- **Not configured** (any env var missing, as in a fresh `npm run dev`): `503`. The client treats
  it like any failed fetch and shows nothing.
- **Stored value:** JSON `{ text, info, updatedAt }`. `info` is the question's `info` string
  ("1st-year/blood/2016"), so the store makes sense when browsed in the Upstash console or exported
  later. Only `text` goes back to the client. *(my call)*
- Upstash REST call: `POST <url>` with body `["HMGET", "explanations", …]` and
  `Authorization: Bearer <token>`.

### Client

- **`useExplanations`** hook (in `app/_QAFormat/`). With no `explain-key` stored, or when disabled,
  it does nothing: no hashing, no request. Otherwise, on mount it computes every question's base
  key (using `Format`'s `keyAt` cache, which is only paid by the two key holders), POSTs them, and
  keeps `{ role, texts }`. A failed fetch means no explanations and no ✎, silently.
  It exposes `text(i)`, `role`, and `save(i, text)`.
- **`save`** PUTs, and only updates local state once the server confirms. Identical twin questions
  share a key, so they update together.
- **`Format`** gets an `explanations?: boolean` prop. The Past Papers page and `SavedPage` pass it;
  System Review doesn't, so its own per-option explanations are untouched. For the Saved quiz,
  `questionKey` of the bookmark's stored question copy gives the same key. *(my call)*

### Display

- New `Explanation` component between `Options` and `Footer`. It renders only when this
  question's clicked options include the correct one, or when in Review mode (`reveal`), and only
  if there's something to show:
  - **Text exists:** a box titled "Explanation" with the text (`whitespace-pre-wrap`). For the
    owner it has a ✎ button.
  - **No text:** nothing for the reader; an "Add explanation" button for the owner.
- **Editing happens in a dialog** (the shadcn `Dialog`, as `HintDifficulty` uses): a textarea
  pre-filled with the current text, plus Cancel and Save. The dialog portals outside the swipe
  area, and an open dialog already blocks quiz keys (`isQuizKeyBlocked`), so typing and swiping
  inside it can't answer, move, or bookmark. *(my call)*
- **Saving:** while saving, the button shows "Saving…" and is disabled. On success the dialog
  closes. On failure it stays open with the text intact and an error line ("Couldn't save. Check
  your connection and try again."). Saving empty text deletes the explanation, and the button
  reads "Delete" when the textarea is empty. *(my call)*
- Styling follows the existing quiz cards and buttons (`bg-accent`, `rounded-lg`, the `brand`
  button variant), with a dark-mode variant.

### Docs

Update `CLAUDE.md`: the site now has one API route and a hosted store; list the env vars, the
setup, and the rule that a keyless visitor must never trigger a request or see explanation text.

## Left to the builder

Exact styling and wording, the loading state while explanations fetch (nothing shown is fine),
which Upstash env-var name pair is present, the request chunking, and the file layout of the hook
and component.

## Verifying

- `npm run build` passes, and quiz pages are still listed as prerendered (static).
- `grep -r` across `.next/server/app/**/*.html` and `.next/static` for the key values and for the
  text of a saved test explanation: no matches. (Don't grep for the word "Explanation"; it's the
  component's title and is meant to be in the bundle.)
- Open a quiz page directly via `/PastPapers/…?key=<write key>`: explanations load on that first
  visit, and the param is gone from the address bar.
- `npx next start` with `.env.local` against the real store:
  - With no key: no `/api/explanations` request in the network log, and the quiz looks unchanged.
  - Write key: ✎ appears only after the correct option is found; save, reload, and it's still there.
    Clear and save deletes it. A failed save (server stopped) keeps the text in the dialog.
  - Read key in another browser: the explanation shows after finding the answer, with no ✎. A PUT
    with the read key gets `403`.
  - A wrong key gets `401`. An explanation written on a year paper also shows on the compiled
    paper and in the Saved quiz.
  - Typing A–R, S, or arrows in the dialog doesn't answer, bookmark, or move.
