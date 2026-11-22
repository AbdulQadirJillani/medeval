// Backup and restore of everything MedEval keeps in localStorage. All of it is
// pure except readLocalSnapshot/applyChanges, so node --test can check it.
// Relative imports (not "@/") for the same reason.
import { BOOKMARKS_KEY, cleanBookmarks, type Bookmark } from "../_QAFormat/bookmarks"
import { isEntry, type PerformanceEntry } from "../(Performance)/types"
import { REMOVALS_KEY, addRemovals, attemptId, cleanRemovals, latestRemoval, removalId, type Removal } from "../../lib/removals"

export const BACKUP_VERSION = 1

// A "-module" value exactly as stored by useQuizPersistence
export type StoredSession = Record<string, unknown> & { answers: unknown[] }

// Keys of sessions/attempts are quiz paths, without the "-module"/"-performance" suffix
export type Snapshot = {
  sessions: Record<string, StoredSession>
  attempts: Record<string, PerformanceEntry[]>
  bookmarks: Bookmark[]
  removals: Removal[]
}

export type Backup = Snapshot & { app: "medeval", version: number, exportedAt: string }

export type MergeSummary = {
  attemptsAdded: number
  attemptsRemoved: number
  bookmarksAdded: number
  bookmarksRemoved: number
  sessionsAdded: number
  sessionsUpdated: number
  sessionsRemoved: number
}

const MODULE = "-module"
const PERFORMANCE = "-performance"
// Only quiz paths become storage keys, so a crafted file can't write any other key
const QUIZ_PATH = /^\/(PastPapers|SystemReview)\/[A-Za-z0-9/-]+$/

function isSession(v: unknown): v is StoredSession {
  return !!v && typeof v === "object" && !Array.isArray(v) && Array.isArray((v as Record<string, unknown>).answers)
}

function cleanAttempts(path: string, v: unknown): PerformanceEntry[] {
  // Legacy values are a single object rather than an array
  const list = Array.isArray(v) ? v : v && typeof v === "object" ? [v] : []
  return list.filter((e): e is PerformanceEntry => isEntry(e) && e.pathname === path)
}

// Storage and backup files go through the same checks
function clean(sessions: [string, unknown][], attempts: [string, unknown][], bookmarks: unknown, removals: unknown): Snapshot {
  const out: Snapshot = { sessions: {}, attempts: {}, bookmarks: cleanBookmarks(bookmarks), removals: cleanRemovals(removals) }
  for (const [path, v] of sessions) {
    if (QUIZ_PATH.test(path) && isSession(v)) out.sessions[path] = v
  }
  for (const [path, v] of attempts) {
    if (!QUIZ_PATH.test(path)) continue
    const list = cleanAttempts(path, v)
    if (list.length > 0) out.attempts[path] = list
  }
  return out
}

function parseJSON(v: string | null): unknown {
  if (v === null) return undefined
  try {
    return JSON.parse(v)
  } catch {
    return undefined
  }
}

export function snapshotFrom(entries: [string, string | null][]): Snapshot {
  const sessions: [string, unknown][] = []
  const attempts: [string, unknown][] = []
  let bookmarks: unknown = []
  let removals: unknown = []
  for (const [key, value] of entries) {
    if (key === BOOKMARKS_KEY) bookmarks = parseJSON(value)
    else if (key === REMOVALS_KEY) removals = parseJSON(value)
    else if (key.endsWith(MODULE)) sessions.push([key.slice(0, -MODULE.length), parseJSON(value)])
    else if (key.endsWith(PERFORMANCE)) attempts.push([key.slice(0, -PERFORMANCE.length), parseJSON(value)])
  }
  return clean(sessions, attempts, bookmarks, removals)
}

export function toBackup(s: Snapshot, now: Date): Backup {
  return { app: "medeval", version: BACKUP_VERSION, exportedAt: now.toISOString(), ...s }
}

export function parseBackup(text: string): { ok: true, snapshot: Snapshot } | { ok: false, error: "invalid" | "newer" } {
  const parsed = parseJSON(text)
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ok: false, error: "invalid" }
  const b = parsed as Record<string, unknown>
  if (b.app !== "medeval" || typeof b.version !== "number") return { ok: false, error: "invalid" }
  if (b.version > BACKUP_VERSION) return { ok: false, error: "newer" }
  const entries = (v: unknown): [string, unknown][] => v && typeof v === "object" && !Array.isArray(v) ? Object.entries(v) : []
  return { ok: true, snapshot: clean(entries(b.sessions), entries(b.attempts), b.bookmarks, b.removals) }
}

const bookmarkId = (b: Bookmark) => `${b.path}|${b.key}`
const savedTime = (b: Bookmark) => Date.parse(b.savedAt) || 0
const finishTime = (e: PerformanceEntry) => new Date(e.finishDateTime).getTime()
const answered = (s: StoredSession | undefined) => !!s && s.answers.length > 0

// updatedAt was added later; older sessions only have startDateTime
function sessionTime(s: StoredSession): number {
  const t = Date.parse(String(s.updatedAt ?? s.startDateTime))
  return Number.isNaN(t) ? 0 : t
}

const paths = (a: object, b: object) => [...new Set([...Object.keys(a), ...Object.keys(b)])]

function mergeBookmarks(local: Bookmark[], incoming: Bookmark[], removals: Removal[]): Bookmark[] {
  const byId = new Map(local.map(b => [bookmarkId(b), b]))
  for (const b of incoming) {
    const mine = byId.get(bookmarkId(b))
    if (!mine || savedTime(b) > savedTime(mine)) byId.set(bookmarkId(b), b)
  }
  // A bookmark saved again after it was removed stays
  return [...byId.values()]
    .filter(b => savedTime(b) >= latestRemoval(removals, removalId({ kind: "bookmark", path: b.path, key: b.key, at: b.savedAt })))
    .sort((a, b) => savedTime(b) - savedTime(a))
}

function mergeAttempts(local: Snapshot["attempts"], incoming: Snapshot["attempts"], removed: (id: string) => boolean): Snapshot["attempts"] {
  const out: Snapshot["attempts"] = {}
  for (const path of paths(local, incoming)) {
    const byId = new Map<string, PerformanceEntry>()
    for (const e of [...(local[path] ?? []), ...(incoming[path] ?? [])]) {
      if (!byId.has(attemptId(e))) byId.set(attemptId(e), e)
    }
    const list = [...byId.values()]
      .filter(e => !removed(removalId({ kind: "attempt", id: attemptId(e), at: "" })))
      .sort((a, b) => finishTime(a) - finishTime(b))
    if (list.length > 0) out[path] = list
  }
  return out
}

function mergeSessions(local: Snapshot["sessions"], incoming: Snapshot["sessions"], removed: (id: string) => boolean): Snapshot["sessions"] {
  const out: Snapshot["sessions"] = {}
  for (const path of paths(local, incoming)) {
    // A finished or discarded session is dropped wherever a copy of it turns up
    const alive = (s: StoredSession | undefined) =>
      s && !removed(removalId({ kind: "session", path, started: String(s.startDateTime ?? ""), at: "" })) ? s : undefined
    const mine = alive(local[path])
    const theirs = alive(incoming[path])
    // Just opening a paper writes an empty session, so an unanswered one never wins
    const winner = theirs && answered(theirs) && (!mine || !answered(mine) || sessionTime(theirs) > sessionTime(mine)) ? theirs : mine
    if (winner) out[path] = winner
  }
  return out
}

function countChanges(before: string[], after: string[]): { added: number, removed: number } {
  const b = new Set(before)
  const a = new Set(after)
  return { added: after.filter(x => !b.has(x)).length, removed: before.filter(x => !a.has(x)).length }
}

function summarize(local: Snapshot, result: Snapshot): MergeSummary {
  const attemptIds = (s: Snapshot) => Object.values(s.attempts).flat().map(attemptId)
  const attempts = countChanges(attemptIds(local), attemptIds(result))
  const bookmarks = countChanges(local.bookmarks.map(bookmarkId), result.bookmarks.map(bookmarkId))
  let sessionsAdded = 0, sessionsUpdated = 0, sessionsRemoved = 0
  for (const path of paths(local.sessions, result.sessions)) {
    const before = local.sessions[path]
    const after = result.sessions[path]
    if (answered(after) && !answered(before)) sessionsAdded++
    else if (answered(after) && answered(before) && JSON.stringify(after) !== JSON.stringify(before)) sessionsUpdated++
    else if (answered(before) && !answered(after)) sessionsRemoved++
  }
  return {
    attemptsAdded: attempts.added,
    attemptsRemoved: attempts.removed,
    bookmarksAdded: bookmarks.added,
    bookmarksRemoved: bookmarks.removed,
    sessionsAdded,
    sessionsUpdated,
    sessionsRemoved,
  }
}

export function mergeSnapshots(local: Snapshot, incoming: Snapshot): { result: Snapshot, summary: MergeSummary } {
  const removals = addRemovals(local.removals, incoming.removals)
  const removed = (id: string) => latestRemoval(removals, id) > -Infinity
  const result: Snapshot = {
    sessions: mergeSessions(local.sessions, incoming.sessions, removed),
    attempts: mergeAttempts(local.attempts, incoming.attempts, removed),
    bookmarks: mergeBookmarks(local.bookmarks, incoming.bookmarks, removals),
    removals,
  }
  return { result, summary: summarize(local, result) }
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const andList = (items: string[]) => items.length > 1 ? `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}` : items[0]

export function summaryText(s: MergeSummary): string {
  const added: string[] = []
  if (s.attemptsAdded) added.push(count(s.attemptsAdded, "attempt", "attempts"))
  if (s.bookmarksAdded) added.push(count(s.bookmarksAdded, "bookmark", "bookmarks"))
  if (s.sessionsAdded) added.push(count(s.sessionsAdded, "paper in progress", "papers in progress"))
  const sentences: string[] = []
  if (added.length > 0) sentences.push(`Added ${andList(added)}.`)
  if (s.sessionsUpdated) sentences.push(`Updated ${count(s.sessionsUpdated, "paper in progress", "papers in progress")}.`)
  if (s.bookmarksRemoved) sentences.push(`Removed ${count(s.bookmarksRemoved, "bookmark", "bookmarks")} you'd unsaved on your other device.`)
  if (s.attemptsRemoved) sentences.push(`Removed ${count(s.attemptsRemoved, "attempt", "attempts")} you'd cleared on your other device.`)
  if (s.sessionsRemoved) sentences.push(`Removed ${count(s.sessionsRemoved, "paper in progress", "papers in progress")} you'd finished or discarded on your other device.`)
  return sentences.length > 0 ? sentences.join(" ") : "Already up to date."
}

export function storageChanges(before: Snapshot, after: Snapshot): { set: [string, string][], remove: string[] } {
  const set: [string, string][] = []
  const remove: string[] = []
  const compare = (suffix: string, b: Record<string, unknown>, a: Record<string, unknown>) => {
    for (const [path, v] of Object.entries(a)) {
      const json = JSON.stringify(v)
      if (json !== JSON.stringify(b[path])) set.push([path + suffix, json])
    }
    for (const path of Object.keys(b)) {
      if (!Object.hasOwn(a, path)) remove.push(path + suffix)
    }
  }
  compare(MODULE, before.sessions, after.sessions)
  compare(PERFORMANCE, before.attempts, after.attempts)
  const bookmarks = JSON.stringify(after.bookmarks)
  if (bookmarks !== JSON.stringify(before.bookmarks)) set.push([BOOKMARKS_KEY, bookmarks])
  const removals = JSON.stringify(after.removals)
  if (removals !== JSON.stringify(before.removals)) set.push([REMOVALS_KEY, removals])
  return { set, remove }
}

export function backupFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `medeval-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`
}

export function readLocalSnapshot(): Snapshot {
  const entries: [string, string | null][] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) entries.push([key, localStorage.getItem(key)])
  }
  return snapshotFrom(entries)
}

// No transaction in localStorage: if a write fails partway (storage full),
// restoring the same file again finishes the job, since merging is idempotent
export function applyChanges(c: { set: [string, string][], remove: string[] }): boolean {
  try {
    for (const key of c.remove) localStorage.removeItem(key)
    for (const [key, value] of c.set) localStorage.setItem(key, value)
  } catch {
    return false
  }
  return true
}
