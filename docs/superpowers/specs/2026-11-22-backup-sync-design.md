# Backup & Sync page

Item #1 of the 2026-11-22 improvement round (#4 page metadata, #6 System Review off the sitemap and
#8 housekeeping are done).

## Why

Students study on both a phone and a laptop and want the same progress on each. Everything MedEval
remembers lives in one browser's `localStorage`, and there's no backend or account. A student
moves their progress by saving a file on one device, sending it to themselves (WhatsApp, email,
Drive) and loading it on the other. They'll do this **often and in both directions**, so loading a
file has to combine it with what the device already has. A round trip repeated with nothing
changed must change nothing.

## Goals

1. **A `/Sync` page, linked from the navbar** as "Sync", between Saved and Past Papers
   (`Menu.tsx`, which serves both the desktop menu and the mobile sidebar).

   ```
   Move your progress to another device
     1. Tap Back up. A file is saved (on a phone, the share sheet opens).
     2. Send it to yourself: WhatsApp, email, Drive.
     3. On the other device, open Sync, tap Restore and pick the file.
     [ ⬇ Back up ]   [ ⬆ Restore ]
     ✓ Added 12 attempts, 5 bookmarks and 2 papers in progress.
   ```

   Plus a line saying what's included (papers in progress, attempt history, saved questions) and
   what isn't (the dark-mode setting).
2. **Back up** writes one JSON file, `medeval-backup-YYYY-MM-DD.json` (local date). On phones that
   can share files, it opens the share sheet. Everywhere else it downloads.
3. **Restore** opens a file picker, checks the file, combines it with this device using the rules
   below, then shows a one-line summary of what changed. A file that isn't a MedEval backup is
   rejected with a message and changes nothing.
4. **Removals stick across devices.** Unsaving a bookmark, discarding an in-progress paper
   (× on the homepage Continue strip) or "Clear all attempts" is remembered with its time, and
   carried in the backup. So a restore from the other device doesn't bring those items back, in
   either direction.

## Merge rules

"Local" is this device, "incoming" is the file. Removals are merged first (the union of both sides,
keeping the latest time per item), and the other three kinds are then checked against them.

| Data | Rule |
|---|---|
| **Bookmarks** (`bookmarks`) | Union by `path + key`. If both sides have one, keep the copy with the later `savedAt`. Drop any whose `savedAt` is older than a bookmark removal for the same `path + key`. Sort newest `savedAt` first, as the list is stored today. |
| **Attempts** (`<path>-performance`) | Union per path, dropping exact duplicates (same `finishDateTime`, `score` and `totalQuestions`). Drop attempts finished at or before the latest "cleared all attempts" removal. |
| **In-progress papers** (`<path>-module`) | Per path, an incoming session replaces the local one only if it has at least one answer, and either the local one is missing, the local one has no answers, or the incoming one is newer. Then drop the surviving session if it's not newer than that path's latest attempt (in the merged attempts) or than a discard removal for that path. |
| **Removals** (`removals`) | Union, keeping the latest time per item. Never pruned: pruning would let an old backup bring removed items back. |

The time used for a session is `updatedAt`, falling back to `startDateTime` (as `sessions.ts` does).

The empty-session rule matters: just opening a paper writes a `-module` key with `answers: []` and
the current time. Without the rule, opening a paper on the phone would beat 30 answers made on
the laptop yesterday.

A session's answers are copied exactly as stored, including `answerKeys`. Opening the paper then
re-places them by content, as it does today (`remapAnswers`). The merge never needs question data.

## Removals: where they're recorded

A new key, `removals`, holds a JSON array of:

```ts
| { kind: "bookmark", path: string, key: string, at: string }  // ISO time
| { kind: "session",  path: string, at: string }
| { kind: "attempts", at: string }                              // "Clear all attempts"
```

Only the three places that delete things today change:

- `useBookmarks.ts` `write()`: records a removal for every bookmark in the old list that's missing
  from the new one. This covers the quiz icon, the S key, Saved-page removals and "Remove the N I
  got right" in one place. Re-saving later needs nothing extra, because the new `savedAt` is
  newer than the removal.
- `ContinueStrip.tsx` `discard`: records a `session` removal.
- `Performance.tsx` `clearAll`: records an `attempts` removal.

Not recorded:
- Finishing a paper. The new attempt's time already handles it.
- Deleting unreadable or corrupt values.
- Discarding a legacy session whose question count changed.

## Non-goals

- Automatic or live sync, accounts, any server or cloud storage.
- Combining the answers of one paper started on both devices. The newer session wins whole.
- Choosing what to restore (only bookmarks, say), or a "replace everything" mode.
- Syncing the theme.
- Encrypting or compressing the file.
- Showing when this device last backed up.

## Anti-goals (failure even if it "works")

- A restore loses answers, attempts or bookmarks the student didn't remove on either device.
- A restore puts answers on the wrong question. Answers stay content-keyed and are re-placed on
  open. Never key anything on question id or position (papers get re-scraped).
- A bad or hand-edited file crashes `/Sync` or any other page afterwards. Every item is validated
  with the same guards the readers use (`parseBookmarks` / `isBookmark`, the Performance page's
  `isEntry`, the `readSession` object check). Bad items are skipped.
- A new dependency.

## Constraints

- `localStorage` only. There's no transaction, so build the whole merged result in memory before
  writing anything. Restoring is idempotent, so if a write fails partway (storage full), restoring
  the same file again after freeing space finishes the job. Say so in the error message.
- No test suite. Keep the merge a pure function (local snapshot + incoming → result + summary) so
  the plan can exercise it with scratch node scripts. Check persistence against a production
  build (`npm run build && npx next start`), per CLAUDE.md.
- Device clocks are trusted. Phones and laptops set their time automatically, and a badly wrong
  clock could make the wrong copy win. That's accepted.

## Approaches

1. **Separate removals list (chosen).** A new `removals` key, written only where things are
   deleted today. Readers of bookmarks, attempts and sessions don't change. It's small and
   low-risk.
2. **Mark items deleted in place.** Removed bookmarks stay with a `removedAt` time. No extra key,
   but every reader (navbar count, `/Saved`, quiz icon, map dots) has to skip them, and a missed
   reader shows deleted items. Rejected.
3. **Change log and replay.** Robust, but it rewrites every storage write in the app. Rejected as
   far too big.

The user picked 1. They also chose "remember removals" over a plain combine (unsaved bookmarks
come back) and over Replace (wipes anything that exists only on this device). Replace only suits
copying one way, and students go both ways.

## File format

```json
{
  "app": "medeval",
  "version": 1,
  "exportedAt": "2026-11-22T10:15:00.000Z",
  "sessions": { "/PastPapers/1st-year/blood/2016": { "…stored -module object…": "" } },
  "attempts": { "/PastPapers/1st-year/blood/2016": [ { "pathname": "…", "score": 30, "totalQuestions": 39, "finishDateTime": "…" } ] },
  "bookmarks": [ { "path": "…", "key": "…", "index": 4, "savedAt": "…", "question": {} } ],
  "removals": [ { "kind": "bookmark", "path": "…", "key": "…", "at": "…" } ]
}
```

Every `-module` and `-performance` key under `/PastPapers/` and `/SystemReview/` is included, even
for paths that no longer exist (that's harmless; the Continue strip already hides them). Legacy
single-object `-performance` values are written out as one-item arrays. `theme` and the legacy
`-reset` keys are left out. Reject files whose `app` isn't `"medeval"`, or whose `version` is
newer than 1 ("made by a newer version of MedEval, reload the site and try again").

## Builder's calls (mine, correct if wrong)

- **Share or download.** Back up uses `navigator.share({ files })` only when `navigator.canShare`
  accepts the file and the pointer is coarse (`matchMedia("(pointer: coarse)")`), so desktops
  always download. If the student cancels the share sheet (`AbortError`), nothing happens. Any
  other share error falls back to a download.
- **Picker.** A hidden `<input type="file">`, opened by the Restore button, with **no `accept`
  filter**. Android can tag a `.json` file received over WhatsApp as `application/octet-stream`,
  and a JSON-only filter would grey it out in the picker. Validating the contents catches wrong
  files anyway.
- **Summary wording.**
  - Additions: "Added 12 attempts, 5 bookmarks and 2 papers in progress."
  - Removals, when any: "Removed 1 bookmark you'd unsaved on your other device."
  - "Updated 1 paper in progress" when a newer session replaced a local one.
  - "Already up to date" when nothing changed.
  - Counts compare the device before and after, so a backup from the same device reads "Already
    up to date".
- **After restoring,** dispatch `bookmarks-change` so the navbar Saved badge updates. Other tabs
  get native `storage` events. The Continue strip and Performance read on mount, so they're right
  on the next visit.
- **Restore with an empty file** (a backup from a fresh device) is allowed and is a no-op. Back up
  on a fresh device is allowed too.
- **The page.** `app/Sync/`: `page.tsx` (server, metadata via `pageMetadata("Sync devices", …)`),
  a client component, and the one-line `loading.tsx`. It's left out of `sitemap.ts`, like
  `/Saved`, because there's nothing there for search.
- **Code location.** The merge and the snapshot read/write live in a module beside the page (e.g.
  `app/Sync/sync.ts`). `recordRemoval()` lives with the removals key, so the three delete sites
  can import it without pulling in the page. The Performance page's `isEntry` moves somewhere
  shared so restore can use it.
- **Removed items in the summary** count only things that were on this device before and are now
  gone, not removals that merely arrived in the file.

## Files likely touched

- New `app/Sync/page.tsx`, `loading.tsx`, client page component, `sync.ts` (snapshot, validate,
  merge, write).
- New removals helper (e.g. `lib/removals.ts` or `app/_QAFormat/removals.ts`).
- `app/_QAFormat/useBookmarks.ts` (record removals in `write`).
- `app/_Homepage/ContinueStrip.tsx` (record discard).
- `app/(Performance)/Performance.tsx` (record clear), and `Performance/page.tsx` (`isEntry` moves
  out).
- `app/_NavBar/Menu.tsx` (Sync link).
- `CLAUDE.md`: the `removals` key, the `/Sync` route, the merge rules in short.
