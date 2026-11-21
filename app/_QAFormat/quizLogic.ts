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
