// What a student deliberately removed, and when, so restoring a backup from
// another device doesn't bring it back. Sessions and attempts name one exact
// item: a time cutoff would also delete the other device's own older items.
export const REMOVALS_KEY = "removals"

export type Removal =
  | { kind: "bookmark", path: string, key: string, at: string }
  // started = the session's startDateTime as stored; it's the same on every copy of a session
  | { kind: "session", path: string, started: string, at: string }
  | { kind: "attempt", id: string, at: string }

type AttemptLike = { pathname: string, finishDateTime: string | Date, score: number, totalQuestions: number }

export function attemptId(e: AttemptLike): string {
  return `${e.pathname}|${new Date(e.finishDateTime).getTime()}|${e.score}|${e.totalQuestions}`
}

export function removalId(r: Removal): string {
  if (r.kind === "bookmark") return `bookmark|${r.path}|${r.key}`
  if (r.kind === "session") return `session|${r.path}|${r.started}`
  return `attempt|${r.id}`
}

const isStr = (v: unknown): v is string => typeof v === "string"

function isRemoval(r: unknown): r is Removal {
  if (!r || typeof r !== "object") return false
  const o = r as Record<string, unknown>
  if (!isStr(o.at) || !Number.isFinite(Date.parse(o.at))) return false
  if (o.kind === "bookmark") return isStr(o.path) && isStr(o.key)
  if (o.kind === "session") return isStr(o.path) && isStr(o.started)
  if (o.kind === "attempt") return isStr(o.id)
  return false
}

export function cleanRemovals(parsed: unknown): Removal[] {
  return Array.isArray(parsed) ? parsed.filter(isRemoval) : []
}

export function addRemovals(list: Removal[], items: Removal[]): Removal[] {
  const out = [...list]
  const at = new Map(out.map((r, i) => [removalId(r), i]))
  for (const r of items) {
    const id = removalId(r)
    const i = at.get(id)
    if (i === undefined) {
      at.set(id, out.length)
      out.push(r)
    } else if (Date.parse(r.at) > Date.parse(out[i].at)) {
      out[i] = r
    }
  }
  return out
}

export function latestRemoval(list: Removal[], id: string): number {
  let latest = -Infinity
  for (const r of list) if (removalId(r) === id) latest = Math.max(latest, Date.parse(r.at))
  return latest
}

// Never throws: a failed record must not break the delete that called it
export function recordRemovals(items: Removal[]): void {
  if (items.length === 0) return
  try {
    let stored: unknown = []
    try {
      stored = JSON.parse(localStorage.getItem(REMOVALS_KEY) ?? "[]")
    } catch {}
    localStorage.setItem(REMOVALS_KEY, JSON.stringify(addRemovals(cleanRemovals(stored), items)))
  } catch {}
}
