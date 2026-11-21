import type { Clicked, Quiz } from "./types"

export type QuestionStatus = "right" | "wrong" | "unanswered"

// Longest option first. Persisted answers store indices into THIS order, so it
// must stay deterministic (Array.prototype.sort is stable).
export function sortOptions<T extends { option: string }>(options: T[]): T[] {
  return [...options].sort((a, b) => b.option.length - a.option.length)
}

// Right/wrong is decided by the FIRST option clicked, matching how the quiz
// scores; picking the correct one later (guess-until-correct) doesn't count.
export function questionStatuses(data: Quiz, clicked: Clicked): QuestionStatus[] {
  return data.map((q, i) => {
    const entry = clicked.find(c => c.questionIndex === i)
    if (!entry || entry.optionIndex.length === 0) return "unanswered"
    return sortOptions(q.answers)[entry.optionIndex[0]]?.bool ? "right" : "wrong"
  })
}

export function missedIndices(statuses: QuestionStatus[]): number[] {
  const out: number[] = []
  statuses.forEach((s, i) => { if (s !== "right") out.push(i) })
  return out
}

export function nextMissed(review: number[], index: number): number | undefined {
  return review.find(i => i > index)
}

export function prevMissed(review: number[], index: number): number | undefined {
  return review.findLast(i => i < index)
}

// Where Resume should land: the question after the one most recently answered.
// Entries are appended the first time a question is answered, so the last one
// is the latest. Using the furthest question *viewed* would send a student who
// peeked ahead via the map to that far question.
export function resumeIndexFor(clicked: Clicked, total: number): number {
  const last = clicked[clicked.length - 1]
  return last ? Math.min(last.questionIndex + 1, total - 1) : 0
}

const LETTERS = "abcdefghij"

export function optionIndexForKey(key: string, count: number): number | null {
  if (key.length !== 1) return null
  let i = LETTERS.indexOf(key.toLowerCase())
  if (i === -1 && key >= "1" && key <= "9") i = Number(key) - 1
  return i >= 0 && i < count ? i : null
}

export function optionLetter(i: number): string {
  return String.fromCharCode(65 + i)
}

export function isQuizKeyBlocked(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return true
  const t = e.target
  if (t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return true
  // Radix unmounts closed dialogs/sheets, so any [role=dialog] in the DOM is open
  return document.querySelector('[role="dialog"]') !== null
}

// Which question a link opens: "#q=12" by position (0-based 11, when in
// range) or "#k=<questionKey>" by content, so a bookmark still finds its
// question after the paper is reordered. No match → null (open normally).
// indexOfKey is only called for #k, so ordinary visits hash nothing.
export function parseQuestionHash(hash: string, total: number, indexOfKey: (key: string) => number): number | null {
  const q = /^#q=(\d+)$/.exec(hash)
  if (q) {
    const n = Number(q[1])
    return n >= 1 && n <= total ? n - 1 : null
  }
  const k = /^#k=([0-9a-z]+)$/.exec(hash)
  if (!k) return null
  const i = indexOfKey(k[1])
  return i === -1 ? null : i
}
