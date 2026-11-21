import type { Question, QuestionRef } from "./types"

export const BOOKMARKS_KEY = "bookmarks"
export const BOOKMARKS_EVENT = "bookmarks-change"

// A full copy of the question is stored so the Saved page and quiz need no
// data loading. Trade-off: a later Database/ fix doesn't reach old saves.
export type Bookmark = QuestionRef & { savedAt: string, question: Question }

export type BookmarkGroup = { key: string, items: Bookmark[] }

type Ref = { path: string, key: string }

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase()

// cyrb53: a fast 53-bit string hash; collisions within one paper are negligible
function hash53(str: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

// Identifies a question by its content, not its id or position, so bookmarks
// survive a paper being re-scraped, reordered or renumbered. Option order,
// spacing, case and which option is marked correct don't change the key.
export function questionKey(q: Pick<Question, "question" | "answers">): string {
  const options = q.answers.map(a => norm(a.option)).sort()
  return hash53([norm(q.question), ...options].join("\u0000"))
}

// Identical questions (same stem and options) share a questionKey. Numbering
// repeats ("a", "a-1", "a-2") keeps twins separate bookmarks; it's stable
// under reordering because twins are indistinguishable anyway.
export function occurrenceKeys(baseKeys: string[]): string[] {
  const seen = new Map<string, number>()
  return baseKeys.map(k => {
    const n = seen.get(k) ?? 0
    seen.set(k, n + 1)
    return n === 0 ? k : `${k}-${n}`
  })
}

function isBookmark(b: unknown): b is Bookmark {
  if (!b || typeof b !== "object") return false
  const o = b as Record<string, unknown>
  const q = o.question as Record<string, unknown> | undefined
  return typeof o.path === "string"
    && Number.isFinite(o.index)
    && typeof o.savedAt === "string"
    && !!q && typeof q === "object"
    && typeof q.question === "string"
    && typeof q.info === "string"
    // Every option must render and hash: a bad one would throw in the navbar on every page
    && Array.isArray(q.answers)
    && q.answers.every(a => !!a && typeof a.option === "string" && typeof a.bool === "boolean")
}

export function parseBookmarks(raw: string | null): Bookmark[] {
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []
  // The key can always be re-derived from the stored copy
  return parsed.filter(isBookmark).map(b => typeof b.key === "string" ? b : { ...b, key: questionKey(b.question) })
}

const same = (a: Ref, b: Ref) => a.path === b.path && a.key === b.key

export function isSaved(list: Bookmark[], ref: Ref): boolean {
  return list.some(b => same(b, ref))
}

export function toggleBookmark(list: Bookmark[], ref: QuestionRef, question: Question, now: Date): Bookmark[] {
  if (isSaved(list, ref)) return list.filter(b => !same(b, ref))
  return [{ path: ref.path, key: ref.key, index: ref.index, savedAt: now.toISOString(), question }, ...list]
}

export function removeBookmarks(list: Bookmark[], refs: Ref[]): Bookmark[] {
  return list.filter(b => !refs.some(r => same(b, r)))
}

// Groups newest-saved first; rows within a group read like the paper
export function groupBookmarks(list: Bookmark[], keyOf: (path: string) => string): BookmarkGroup[] {
  const groups = new Map<string, { group: BookmarkGroup, newest: number }>()
  for (const b of list) {
    const key = keyOf(b.path)
    const t = Date.parse(b.savedAt) || 0
    const g = groups.get(key)
    if (g) {
      g.group.items.push(b)
      g.newest = Math.max(g.newest, t)
    } else {
      groups.set(key, { group: { key, items: [b] }, newest: t })
    }
  }
  const out = [...groups.values()].sort((a, b) => b.newest - a.newest).map(g => g.group)
  for (const g of out) {
    g.items.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }) || a.index - b.index)
  }
  return out
}

export function buildRun(list: Bookmark[], scope: string, keyOf: (path: string) => string, rand: () => number = Math.random): Bookmark[] {
  const run = scope === "all" ? [...list] : list.filter(b => keyOf(b.path) === scope)
  for (let i = run.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[run[i], run[j]] = [run[j], run[i]]
  }
  return run
}
