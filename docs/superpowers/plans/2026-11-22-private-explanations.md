# Private Explanations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the owner write one explanation per past-paper question from the live quiz, saved instantly to a hosted store and readable only by the owner and one reader holding a key.

**Architecture:** One dynamic route handler (`app/api/explanations/route.ts`) talks to Upstash Redis over its REST API with plain `fetch`, guarded by two secret keys from env vars (write = author, read = reader). Pure validation and auth live in small node-testable modules. On the client, a key captured from `?key=` is kept in `localStorage`. `useExplanations` fetches a paper's explanations only when a key is stored, and an `Explanation` box under the options shows the text (plus a ✎ editor in a dialog for the author) once the correct option has been found, or straight away in Review.

**Tech Stack:** Next.js 16 / React 19, Tailwind v4 (`dark:` = `&:is(.dark *)`), shadcn `Dialog` / `Button`, lucide icons. Logic and the route are checked with `node --test` (Node 24 strips TS types natively). UI is checked with `npm run build` plus Playwright MCP against a production `npx next start` wired to a fake in-memory Upstash.

**Spec:** `docs/superpowers/specs/2026-11-22-private-explanations-design.md`

## Global Constraints

- **No new npm dependencies.** Upstash is reached with `fetch`; auth uses `node:crypto`.
- **Env vars**, read per request (never at module top, never `NEXT_PUBLIC_`): `EXPLAIN_WRITE_KEY`, `EXPLAIN_READ_KEY`, and the store URL/token from `KV_REST_API_URL` / `KV_REST_API_TOKEN`, falling back to `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
- **Store:** one Redis hash `explanations`; field = base `questionKey` (no `-1` twin suffix); value = JSON `{ text, info, updatedAt }`. Only `text` is ever sent to the client.
- **Limits:** text ≤ 5,000 characters after trimming; ≤ 2,000 keys per read request; `info` ≤ 200 characters; question keys match `/^[0-9a-z]{1,12}$/`.
- **Responses:** every route response carries `Cache-Control: no-store`; route has `export const dynamic = "force-dynamic"`.
- **Status codes:** missing config `503` → bad/missing key `401` → reader key on PUT `403` → bad body `400` → store failure `502`, checked in that order.
- **localStorage key:** `explain-key`. `?key=<value>` sets it, `?key=off` or an empty value removes it; the param is always stripped with `history.replaceState(null, "", …)`, keeping any `#…` hash.
- **Keyless visitors:** no hashing, no request to `/api/explanations`, no UI change.
- **Visibility:** the box renders only when this question's clicked options include a correct one, or in Review mode. Past Papers and the Saved quiz only; System Review never passes the prop.
- **Copy (exact):** box title `Explanation`; empty-state author button `Add explanation`; ✎ button `aria-label="Edit explanation"`; dialog title `Explanation`, description `Only you and your reader can see this.`; buttons `Cancel`, `Save` / `Delete` (when the draft is empty) / `Saving…`; error `Couldn't save. Check your connection and try again.`
- Match each file's existing style (2-space indent, no semicolons). Comments only where the why isn't obvious.
- `npm run build` is the type-check gate. `npm run lint` must not report more than today's **18 problems (16 errors, 2 warnings)**.
- Work on branch `private-explanations`. Commit only the files a task names, never `git add -A`. Delete `.playwright-mcp/` after browser checks. Find and kill a stale `:3000` server with `ss -ltnp` (lsof misses it).
- `$SCRATCH` = `/tmp/claude-1000/-home-jillani-Programming-Next-med-eval/7e099d98-4653-467b-b5d7-86524d5d8199/scratchpad`. Tests and the fake store live there and aren't committed. Run tests with `node --import $SCRATCH/ts-resolve.mjs --test <file>`.

## Review Focus

1. **A key link that opens a quiz directly**, `/PastPapers/1st-year/blood/2016?key=<write>#k=<key>`: explanations load on that first visit, `?key` is gone from the address bar, and `#k=` still lands on its question (Task 3 Step 5, Task 4 Step 9).
2. **Keyless visitor**: no `/api/explanations` request in the network log, no box or button anywhere, quiz looks as today (Task 4 Step 9).
3. **Guess-until-correct**: after a wrong first pick, nothing shows; after the correct option is found, it shows; Retake hides it again; Review missed shows it straight away (Task 1 `foundCorrect` tests, Task 4 Step 9).
4. **Typing and swiping in the editor** at phone width (390×844): typing `a`, `s`, `1`, arrows and swiping inside the dialog don't answer, bookmark or move the quiz (Task 4 Step 9).
5. **Failed save**: with the fake store stopped, Save shows the error line, keeps the dialog open with the text intact, and succeeds after the store restarts (Task 2 `502` test, Task 4 Step 9).

---

### Task 1: Pure helpers, auth and the test harness

**Files:**
- Create: `lib/explanations.ts`, `app/api/explanations/auth.ts`
- Modify: `app/_QAFormat/quizLogic.ts` (append `foundCorrect`)
- Test (not committed): `$SCRATCH/ts-resolve.mjs`, `$SCRATCH/explanations.test.ts`

**Interfaces:**
- Produces, in `lib/explanations.ts` (no `fs`, no `window`, no env access):
  - `export const EXPLAIN_KEY_STORAGE = "explain-key"`, `MAX_TEXT = 5000`, `MAX_KEYS = 2000`, `MAX_INFO = 200`
  - `isQuestionKey(s: unknown): s is string`
  - `parseReadBody(body: unknown): string[] | null`: `{ keys: string[] }` with 0–`MAX_KEYS` valid keys, otherwise `null`
  - `parseWriteBody(body: unknown): { key: string, text: string, info: string } | null`: `text` is returned trimmed; `null` if key invalid, text not a string or over `MAX_TEXT` after trim, info not a string or over `MAX_INFO`
  - `readKeyParam(href: string): { value: string, cleaned: string } | null`: `null` when the URL has no `key` param; `value` is the param trimmed; `cleaned` is pathname + remaining search + hash
- Produces, in `app/api/explanations/auth.ts`: `roleFor(authorization: string | null, writeKey: string, readKey: string): "author" | "reader" | null`, which compares SHA-256 digests of the bearer token and each key with `crypto.timingSafeEqual`
- Produces, in `quizLogic.ts`: `foundCorrect(q: Question, clicked: Clicked, index: number): boolean`, true when the entry for `index` includes a sorted-option index whose option has `bool: true`

- [ ] **Step 1: Branch and commit the docs.** Run `git checkout -b private-explanations`, then `git add docs/superpowers/specs/2026-11-22-private-explanations-design.md docs/superpowers/plans/2026-11-22-private-explanations.md && git commit -m "Add private explanations design and plan"`.

- [ ] **Step 2: Write the resolve hook** `$SCRATCH/ts-resolve.mjs`. It uses `registerHooks` from `node:module` with a `resolve` hook that rewrites `@/x` to `file:///home/jillani/Programming/Next/med-eval/x`, then tries `next(spec)` and, if that throws for a relative or `file:` specifier, retries `next(spec + ".ts")`.

- [ ] **Step 3: Write the failing tests** in `$SCRATCH/explanations.test.ts` (`node:test`, `node:assert/strict`, importing the three modules by absolute path):
  - `isQuestionKey`: `"abc123"` and `"z".repeat(12)` are true; `""`, `"z".repeat(13)`, `"Bad-Key"`, `"ab c"`, `42` are false.
  - `parseReadBody`: `{ keys: ["a1", "b2"] }` → `["a1", "b2"]`; `{ keys: [] }` → `[]`; 2,000 valid keys → length 2000; 2,001 → `null`; `{ keys: ["ok", "NO!"] }`, `{ keys: "a1" }`, `null`, `[]` → `null`.
  - `parseWriteBody`: `{ key: "a1", text: "  hi \n", info: "1st-year/blood/2016" }` → `{ key: "a1", text: "hi", info: "1st-year/blood/2016" }`; text `" " + "x".repeat(5000) + " "` is accepted; `"x".repeat(5001)` → `null`; missing `info`, `info` of 201 chars, `text: 5`, `key: "A1"` → `null`.
  - `readKeyParam`: `"https://m.app/?key=abc"` → `{ value: "abc", cleaned: "/" }`; `"https://m.app/PastPapers/1st-year/blood/2016?key=abc#k=zz"` → cleaned `"/PastPapers/1st-year/blood/2016#k=zz"`; `"https://m.app/?a=1&key=off&b=2"` → `{ value: "off", cleaned: "/?a=1&b=2" }`; `"https://m.app/?key="` → `{ value: "", cleaned: "/" }`; `"https://m.app/?a=1"` → `null`.
  - `roleFor(h, "w-key", "r-key")`: `"Bearer w-key"` → `"author"`; `"Bearer r-key"` → `"reader"`; `"Bearer nope"`, `"Bearer "`, `"w-key"`, `null` → `null`.
  - `foundCorrect`, with `q.answers = [{ option: "Aspirin", bool: false }, { option: "Clopidogrel", bool: true }, { option: "Abciximab", bool: false }]` (sorted: Clopidogrel 0, Abciximab 1, Aspirin 2): no entry → false; `optionIndex: [1]` → false; `[1, 0]` → true; `[0]` → true; an entry for a different `questionIndex` → false; a question with no `bool: true` and `[0, 1, 2]` → false; with two correct options, clicking only the second-sorted correct one → true.

- [ ] **Step 4: Run to verify they fail.** Run: `node --import $SCRATCH/ts-resolve.mjs --test $SCRATCH/explanations.test.ts`. Expected: FAIL (modules or exports not found).

- [ ] **Step 5: Implement** the three modules per the Interfaces block. `readKeyParam` uses `new URL(href)` and `searchParams.delete("key")`; `cleaned` keeps `?` only when params remain.

- [ ] **Step 6: Run to verify they pass.** Same command; expected: all pass.

- [ ] **Step 7: Commit.** `git add lib/explanations.ts app/api/explanations/auth.ts app/_QAFormat/quizLogic.ts && git commit -m "Add explanation validation, key auth and found-correct helpers"`

---

### Task 2: The explanations route

**Files:**
- Create: `app/api/explanations/route.ts`
- Test (not committed): `$SCRATCH/route.test.ts`

**Interfaces:**
- Consumes: `parseReadBody`, `parseWriteBody` (`@/lib/explanations`), `roleFor` (`./auth`).
- Produces: `POST(req: Request): Promise<Response>` → `200 { role: "author" | "reader", explanations: Record<string, string> }`; `PUT(req: Request): Promise<Response>` → `200 { ok: true }`; errors as `{ error: string }` with the Global Constraints status codes. Uses `Response.json` (not `NextResponse`) so it runs under `node --test`.

- [ ] **Step 1: Write the failing tests** in `$SCRATCH/route.test.ts`. Each test sets `process.env` (`KV_REST_API_URL=https://kv.test`, `KV_REST_API_TOKEN=tok`, `EXPLAIN_WRITE_KEY=w-key`, `EXPLAIN_READ_KEY=r-key`) and stubs `globalThis.fetch` to record `(url, init)` and return a canned `{ result }`. Requests are `new Request("http://x/api/explanations", { method, headers: { authorization }, body })`.
  - Env unset → POST `503`, fetch never called.
  - `Bearer nope` → POST `401` and PUT `401`, fetch never called.
  - POST with `r-key`, `{ keys: ["a1", "b2", "c3"] }`, store returns `[JSON.stringify({ text: "T", info: "i", updatedAt: "2026-11-22T00:00:00Z" }), null, "not json"]` → `200 { role: "reader", explanations: { a1: "T" } }`; fetch called once with URL `https://kv.test`, header `Authorization: Bearer tok`, body `["HMGET","explanations","a1","b2","c3"]`.
  - POST with `w-key` → `role: "author"`.
  - POST `{ keys: [] }` → `200 { role: "reader", explanations: {} }`, fetch not called.
  - POST with body `"{"` (invalid JSON) or `{ keys: ["BAD"] }` → `400`.
  - PUT with `r-key` → `403`, fetch not called.
  - PUT with `w-key`, `{ key: "a1", text: "  hi ", info: "1st-year/blood/2016" }` → `200 { ok: true }`; command is `HSET explanations a1 <json>` where the JSON parses to `text: "hi"`, `info: "1st-year/blood/2016"`, and an ISO `updatedAt`.
  - PUT with text `"   "` → command `["HDEL","explanations","a1"]`.
  - PUT with 5,001-char text → `400`.
  - fetch rejects, and fetch resolves `{ error: "ERR" }` with status 400 → `502` for both POST and PUT.
  - With only `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` set → works, using those.
  - Every response above has `Cache-Control: no-store`.

- [ ] **Step 2: Run to verify they fail.** Run: `node --import $SCRATCH/ts-resolve.mjs --test $SCRATCH/route.test.ts`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement `route.ts`.** `export const dynamic = "force-dynamic"`. A private `config()` reads the four values per request (returning `null` if any is empty). A private `redis(cfg, command: string[]): Promise<unknown>` POSTs the JSON array and throws on a network error, a non-OK status or an `error` field. Checks run in the Global Constraints order. A stored value that doesn't parse, or has no string `text`, is skipped.

- [ ] **Step 4: Run to verify they pass.** Same command; expected: all pass. Then run the Task 1 tests again; expected: still pass.

- [ ] **Step 5: Commit.** `git add app/api/explanations/route.ts && git commit -m "Add explanations API route backed by Upstash Redis"`

---

### Task 3: Capture the key from the URL

**Files:**
- Create: `app/_QAFormat/explanationKey.ts`, `app/_components/ExplainKeyCapture.tsx`
- Modify: `app/layout.tsx` (render `<ExplainKeyCapture />` after `<NavBar />`)

**Interfaces:**
- Consumes: `readKeyParam`, `EXPLAIN_KEY_STORAGE` (`@/lib/explanations`).
- Produces, in `explanationKey.ts` (browser only):
  - `takeKeyFromUrl(): void`: if `readKeyParam(location.href)` is non-null, store `value` (or remove the key when `value` is `""` or `"off"`), then `history.replaceState(null, "", cleaned)`. Storage access is wrapped in try/catch.
  - `storedKey(): string | null`: reads `explain-key`; `null` on a missing value or a throwing `localStorage`.
- Produces: `ExplainKeyCapture`, a `"use client"` component whose mount effect calls `takeKeyFromUrl()` and which renders `null`. Child effects run before the layout's, so Task 4's hook also calls `takeKeyFromUrl()` first; calling it twice is harmless.

- [ ] **Step 1: Implement** the two files and the layout change.

- [ ] **Step 2: Build.** Run: `npm run build`. Expected: success; quiz routes still listed as prerendered.

- [ ] **Step 3: Start production.** Run `npx next start` in the background (kill any stale `:3000` listener found with `ss -ltnp` first).

- [ ] **Step 4: Browser check (Playwright MCP).**
  - `/?key=abc123` → `localStorage["explain-key"] === "abc123"`, and the URL is `/`.
  - `/?key=off` → the key is removed.
  - `/Saved?x=1&key=k2` → stored, and the URL is `/Saved?x=1`.

- [ ] **Step 5: Hash survives (Review Focus 1).** Open `/PastPapers/1st-year/blood/2016?key=k3#q=5`. Expected: key stored; the quiz opens on question 5 with no Resume popup; the address bar ends up `/PastPapers/1st-year/blood/2016`.

- [ ] **Step 6: Clean up and commit.** Stop the server, `rm -rf .playwright-mcp`, then `git add app/_QAFormat/explanationKey.ts app/_components/ExplainKeyCapture.tsx app/layout.tsx && git commit -m "Remember an explanations key from ?key= links"`

---

### Task 4: Fetch, show and edit explanations in the quiz

**Files:**
- Create: `app/_QAFormat/useExplanations.ts`, `app/_QAFormat/Explanation.tsx`
- Modify: `app/_QAFormat/Format.tsx`, `app/(PastPapers)/PastPapers/[...QA]/page.tsx`, `app/Saved/SavedPage.tsx`, `CLAUDE.md`
- Test (not committed): `$SCRATCH/fake-upstash.mjs`

**Interfaces:**
- Consumes: `takeKeyFromUrl`, `storedKey` (Task 3); `MAX_KEYS` (Task 1); `foundCorrect` (Task 1); the route (Task 2); `Format`'s existing `keyAt(i): string` (base `questionKey`, cached).
- Produces:
  - `useExplanations(enabled: boolean, data: Quiz, keyAt: (i: number) => string): { role: "author" | "reader" | null, text: (i: number) => string | undefined, save: (i: number, text: string) => Promise<boolean> }`. Its effect (deps `[enabled, data, keyAt]`) calls `takeKeyFromUrl()`, then returns early when `!enabled` or `storedKey()` is null. Otherwise it de-duplicates `data.map((_, i) => keyAt(i))`, POSTs chunks of `MAX_KEYS` in parallel with `Authorization: Bearer <key>`, and sets `role` plus the merged texts. Any non-OK or thrown request leaves it at `role: null`, silently, and never removes the stored key (a brief misconfiguration on Vercel mustn't log devices out); it aborts on unmount. `save` PUTs `{ key: keyAt(i), text, info: data[i].info }` and only on `200` updates the map (deleting the entry when `text.trim()` is empty); it returns whether it succeeded. State is set only in async callbacks, so the react-hooks lint rules aren't tripped.
  - `Explanation({ text, canEdit, onSave }: { text?: string, canEdit: boolean, onSave: (text: string) => Promise<boolean> })`. It renders `null` when there's no text and `!canEdit`. With text, it's a box titled `Explanation` showing the text in `whitespace-pre-wrap`, with a ✎ (lucide `Pencil`) button when `canEdit`. With no text and `canEdit`, it's an outline `Button` reading `Add explanation`. The editor is a shadcn `Dialog` with the Global Constraints copy, a `textarea` (`maxLength={5000}`, `autoFocus`), and the draft reset to `text ?? ""` in the open handler (not an effect). Save is disabled while saving, when the draft is unchanged, or when the draft is empty and there's no text. On success the dialog closes; on failure it stays open with the error line and the draft intact.
  - `Format` gains `explanations?: boolean`. It renders `<Explanation key={index} … />` between `Options` and `Footer` only when `review !== null || foundCorrect(data[index], clickedOption, index)`, passing `canEdit={role === "author"}` and `onSave={t => save(index, t)}`.

- [ ] **Step 1: Implement** `useExplanations.ts` and `Explanation.tsx`. Style the box to match the quiz (`bg-accent`, `rounded-lg`, the `brand` button for Save), with a dark-mode variant.

- [ ] **Step 2: Wire it up.** Make the `Format` change. Pass `explanations` from the Past Papers page's `<Format … />` and from `SavedPage`'s. The System Review page is untouched.

- [ ] **Step 3: Update `CLAUDE.md`.**
  - Architecture overview: replace "no backend, no auth, no API routes" with one API route, `/api/explanations`, backed by Upstash Redis.
  - Add a `### Private explanations` section: the env vars, the `explain-key` / `?key=` flow, the store shape, the visibility rule, and the one-time setup from the spec.
  - Add a Gotcha: a keyless visitor must never trigger a request to `/api/explanations` or receive explanation text; the explanations live only in Redis, never in `Database/` or the build.

- [ ] **Step 4: Build with test secrets set.** Run: `EXPLAIN_WRITE_KEY=test-write-key-0123 EXPLAIN_READ_KEY=test-read-key-4567 npm run build`.
  - Expected: success, `/api/explanations` listed as dynamic (ƒ), quiz routes still prerendered.
  - Then `grep -rl "test-write-key-0123\|test-read-key-4567" .next/static .next/server/app --include=*.html --include=*.js`; expected: no output.

- [ ] **Step 5: Lint.** Run: `npx eslint . 2>/dev/null | grep problems`. Expected: no more than `18 problems (16 errors, 2 warnings)`.

- [ ] **Step 6: Write the fake store** `$SCRATCH/fake-upstash.mjs`. It's an in-memory `node:http` server on `127.0.0.1:8079` that requires `Authorization: Bearer test-token`, takes a JSON-array command body, implements `HMGET` / `HSET` / `HDEL` on named hashes, and replies `{ result }` (or `400 { error }` for anything else).

- [ ] **Step 7: Start both.** Run in the background: `node $SCRATCH/fake-upstash.mjs`, and `KV_REST_API_URL=http://127.0.0.1:8079 KV_REST_API_TOKEN=test-token EXPLAIN_WRITE_KEY=test-write-key-0123 EXPLAIN_READ_KEY=test-read-key-4567 npx next start`.

- [ ] **Step 8: API smoke test with curl.**
  - POST `{"keys":["a1"]}` with no auth → `401`.
  - The same POST with the read key → `200 {"role":"reader","explanations":{}}`.
  - PUT with the read key → `403`.

- [ ] **Step 9: Browser check (Playwright MCP), at 390×844 and at desktop size.**
  - **Keyless (Review Focus 2):** in a fresh context, open `/PastPapers/1st-year/blood/2016` and answer Q1 correctly. Expected: no `/api/explanations` request in the network log, and no box or button.
  - **Author (Review Focus 1, 3):** open `/PastPapers/1st-year/blood/2016?key=test-write-key-0123#q=1`. Expected: one POST, and the param is stripped.
    - Pick a wrong option on Q1 → nothing appears. Pick Clopidogrel → `Add explanation` appears.
    - Write two lines and Save → the box shows them with the line break kept.
    - Reload → still there.
    - Open `/PastPapers/1st-year/blood/compiled`, find the same question (`#k=` from the Saved page or the map), answer it → the same text shows.
    - Bookmark Q1 and run it in `/Saved?practise=all` → the text shows after answering.
    - Retake the paper → the box is hidden until Q1 is answered again.
    - Finish with Q1 wrong, then Review missed → the box shows straight away.
  - **Editor isolation (Review Focus 4):** with the dialog open, type `a`, `s`, `1` and press ArrowRight; swipe inside the dialog at phone width.
    - Expected: the text goes into the textarea; the question number, answers and bookmark state don't change; closing with Cancel discards the draft.
  - **Failed save (Review Focus 5):** stop the fake store, edit, and Save.
    - Expected: `Couldn't save. Check your connection and try again.` shows, the dialog stays open, and the text is intact.
    - Restart the fake store and Save again → it saves (the earlier text is lost with the in-memory store, which is fine).
  - **Delete:** clear the textarea → the button reads `Delete`; Save → the box falls back to `Add explanation`.
  - **Reader:** in a fresh context, open `/?key=test-read-key-4567`, then the paper, and answer Q1 correctly → the text shows with no ✎ and no `Add explanation` button.
  - **Dark mode:** the box is readable.

- [ ] **Step 10: Clean up and commit.** Stop both servers, `rm -rf .playwright-mcp`, then `git add app/_QAFormat/useExplanations.ts app/_QAFormat/Explanation.tsx app/_QAFormat/Format.tsx "app/(PastPapers)/PastPapers/[...QA]/page.tsx" app/Saved/SavedPage.tsx CLAUDE.md && git commit -m "Show and edit private explanations in past-paper and Saved quizzes"`

- [ ] **Step 11: Hand over the setup.** Don't push, merge or deploy. Give the owner:
  - the spec's one-time setup steps;
  - two freshly generated keys (`openssl rand -hex 24`, run twice);
  - their two links: `https://med-eval.vercel.app/?key=<write>` (theirs) and `?key=<read>` (their reader's).
