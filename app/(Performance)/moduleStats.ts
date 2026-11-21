import type { PerformanceData, PerformanceEntry } from "./types"

export type ModuleStat = { key: string, score: number, total: number, percent: number, papers: number }

// "/PastPapers/<year>/<module>/<tag>" → "/PastPapers/<year>/<module>".
// Anything else (System Review: "/SystemReview/<system>") is its own module.
export function moduleKey(pathname: string): string {
  const segs = pathname.split("/")
  return segs[1] === "PastPapers" && segs.length === 5 ? segs.slice(0, 4).join("/") : pathname
}

// Only each paper's latest attempt counts, so retakes show where a student
// stands now; papers are then pooled by question count within their module.
export function moduleStats(data: PerformanceData): ModuleStat[] {
  const latest = new Map<string, PerformanceEntry>()
  for (const d of data) {
    const prev = latest.get(d.pathname)
    if (!prev || new Date(d.finishDateTime).getTime() > new Date(prev.finishDateTime).getTime()) {
      latest.set(d.pathname, d)
    }
  }

  const groups = new Map<string, ModuleStat>()
  for (const d of latest.values()) {
    const key = moduleKey(d.pathname)
    const g = groups.get(key) ?? { key, score: 0, total: 0, percent: 0, papers: 0 }
    g.score += d.score
    g.total += d.totalQuestions
    g.papers += 1
    groups.set(key, g)
  }

  const stats = [...groups.values()]
  for (const g of stats) g.percent = g.total > 0 ? g.score / g.total * 100 : 0
  return stats.sort((a, b) => a.percent - b.percent || a.key.localeCompare(b.key))
}

// Tiny pools (e.g. one 5-question attempt) are too noisy to call "weakest".
export function weakestModule(stats: ModuleStat[], minQuestions = 20): ModuleStat | undefined {
  return stats.find(s => s.total >= minQuestions)
}
