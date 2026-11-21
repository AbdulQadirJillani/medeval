import type { Clicked, Question, Quiz } from "./types"

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

// Stops before "s", the bookmark key. System Review has questions with up to 13 options.
const LETTERS = "abcdefghijklmnopqr"

export function optionIndexForKey(key: string, count: number): number | null {
  if (key.length !== 1) return null
  let i = LETTERS.indexOf(key.toLowerCase())
  if (i === -1 && key >= "1" && key <= "9") i = Number(key) - 1
  return i >= 0 && i < count ? i : null
}

export function optionLetter(i: number): string {
  return String.fromCharCode(65 + i)
}

// Text for the copy button, to paste into any AI chat. Letters follow the
// on-screen (sorted) order so they match what the student sees.
export function questionPrompt(q: Question): string {
  const options = sortOptions(q.answers).map((a, i) => `${optionLetter(i)}. ${a.option}`)
  return `${q.question}\n\n${options.join("\n")}`
}

export function isQuizKeyBlocked(e: KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return true
  const t = e.target
  if (t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return true
  // A closing dialog/sheet stays mounted (data-state="closed") for its ~300ms exit
  // animation; matching it too would swallow keys pressed right after closing
  return document.querySelector('[role="dialog"][data-state="open"]') !== null
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
  const k = /^#k=([0-9a-z]+(?:-\d+)?)$/.exec(hash)
  if (!k) return null
  const i = indexOfKey(k[1])
  return i === -1 ? null : i
}

// Any "open at question" link, valid or not, so it can be stripped from the URL
export function isQuestionHash(hash: string): boolean {
  return /^#[qk]=/.test(hash)
}

// In-progress answers saved by content as well as position, so a paper that's
// re-scraped or reordered mid-attempt doesn't put answers on the wrong
// questions. key = questionKey of the question; options = the clicked option
// texts in click order (the first one decides right/wrong).
export type AnswerRecord = { key: string, options: string[] }

const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase()

export function answerRecords(data: Quiz, clicked: Clicked, keyAt: (i: number) => string): AnswerRecord[] {
  return clicked.flatMap(c => {
    const q = data[c.questionIndex]
    if (!q) return []
    const sorted = sortOptions(q.answers)
    return [{ key: keyAt(c.questionIndex), options: c.optionIndex.map(i => sorted[i]?.option).filter((o): o is string => o !== undefined) }]
  })
}

// Records whose question no longer exists, or whose first pick can't be
// found, are dropped rather than guessed at.
export function remapAnswers(records: AnswerRecord[], data: Quiz, keyAt: (i: number) => string): Clicked {
  const free = new Map<string, number[]>()
  data.forEach((_, i) => {
    const k = keyAt(i)
    free.set(k, [...(free.get(k) ?? []), i])
  })
  const out: Clicked = []
  for (const r of records) {
    if (!r || typeof r.key !== "string" || !Array.isArray(r.options)) continue
    // Identical questions share a key: give each record the next unused one
    const questionIndex = free.get(r.key)?.shift()
    if (questionIndex === undefined) continue
    const sorted = sortOptions(data[questionIndex].answers).map(a => norm(a.option))
    const picks = r.options.map(o => typeof o === "string" ? sorted.indexOf(norm(o)) : -1)
    if (picks.length === 0 || picks[0] === -1) continue
    out.push({ questionIndex, optionIndex: picks.filter((i, n) => i !== -1 && picks.indexOf(i) === n) })
  }
  return out
}
