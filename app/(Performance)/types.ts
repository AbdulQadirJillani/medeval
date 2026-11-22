export type PerformanceEntry = {
  pathname: string
  score: number
  totalQuestions: number
  finishDateTime: Date
}

export type PerformanceData = PerformanceEntry[]

// Hand-edited or extension-written values would otherwise crash the page on every visit
export function isEntry(e: unknown): e is PerformanceEntry {
  const o = e as Record<string, unknown> | null
  return !!o && typeof o === "object"
    && typeof o.pathname === "string"
    && Number.isFinite(o.score)
    && Number.isFinite(o.totalQuestions)
    && !Number.isNaN(new Date(o.finishDateTime as string).getTime())
}
