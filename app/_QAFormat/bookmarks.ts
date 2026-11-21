import type { Question, QuestionRef } from "./types"

export const BOOKMARKS_KEY = "bookmarks"
export const BOOKMARKS_EVENT = "bookmarks-change"

// A full copy of the question is stored so the Saved page and quiz need no
// data loading. Trade-off: a later Database/ fix doesn't reach old saves.
export type Bookmark = QuestionRef & { savedAt: string, question: Question }

export type BookmarkGroup = { key: string, items: Bookmark[] }

type Ref = { path: string, id: number }

function isBookmark(b: unknown): b is Bookmark {
  if (!b || typeof b !== "object") return false
  const o = b as Record<string, unknown>
  const q = o.question as Record<string, unknown> | undefined
  return typeof o.path === "string"
    && Number.isFinite(o.id)
    && Number.isFinite(o.index)
    && typeof o.savedAt === "string"
    && !!q && typeof q === "object"
    && typeof q.question === "string"
    && Array.isArray(q.answers)
}

export function parseBookmarks(raw: string | null): Bookmark[] {
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  return Array.isArray(parsed) ? parsed.filter(isBookmark) : []
}

const same = (a: Ref, b: Ref) => a.path === b.path && a.id === b.id

export function isSaved(list: Bookmark[], ref: Ref): boolean {
  return list.some(b => same(b, ref))
}

export function toggleBookmark(list: Bookmark[], ref: QuestionRef, question: Question, now: Date): Bookmark[] {
  if (isSaved(list, ref)) return list.filter(b => !same(b, ref))
  return [{ path: ref.path, id: ref.id, index: ref.index, savedAt: now.toISOString(), question }, ...list]
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
