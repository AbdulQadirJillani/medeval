import type { Clicked } from "../_QAFormat/types"

export type Session = {
  pathname: string
  score: number
  totalQuestions: number
  answers: Clicked
  updated: number
}

// In-progress Past Papers sessions, newest first. Opening a paper writes a
// "-module" key even before any answer, so only sessions with answers count.
export function unfinishedSessions(entries: [string, string | null][]): Session[] {
  const out: Session[] = []
  for (const [key, value] of entries) {
    if (!key.startsWith("/PastPapers/") || !key.endsWith("-module") || !value) continue
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
    })
  }
  return out.sort((a, b) => b.updated - a.updated)
}
