import type { Clicked } from "../_QAFormat/types"

export type Session = {
  pathname: string
  score: number
  totalQuestions: number
  answers: Clicked
  updated: number
  started: string
}

// In-progress Past Papers sessions, newest first. Opening a paper writes a
// "-module" key even before any answer, so only sessions with answers count.
// `modules` lists current "<year>/<module>" folders: sessions saved under a
// since-renamed folder (e.g. 3rd-year "renal" → "renal-2") would link to a
// route that redirects home, so they're hidden (not deleted).
export function unfinishedSessions(entries: [string, string | null][], modules: string[]): Session[] {
  const valid = new Set(modules)
  const out: Session[] = []
  for (const [key, value] of entries) {
    if (!key.startsWith("/PastPapers/") || !key.endsWith("-module") || !value) continue
    if (!valid.has(key.split("/").slice(2, 4).join("/"))) continue
    let obj
    try {
      obj = JSON.parse(value)
    } catch {
      continue
    }
    if (typeof obj?.totalQuestions !== "number" || !Array.isArray(obj.answers) || obj.answers.length === 0) continue
    // updatedAt was added later; older sessions only have startDateTime.
    const updated = Date.parse(obj.updatedAt ?? obj.startDateTime)
    out.push({
      pathname: key.slice(0, -"-module".length),
      score: obj.score ?? 0,
      totalQuestions: obj.totalQuestions,
      answers: obj.answers,
      updated: Number.isNaN(updated) ? 0 : updated,
      // Identifies the session on every device it's synced to (see lib/removals.ts)
      started: String(obj.startDateTime ?? ""),
    })
  }
  return out.sort((a, b) => b.updated - a.updated)
}
