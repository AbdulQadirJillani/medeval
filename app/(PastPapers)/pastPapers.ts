import { readdirSync, statSync } from "fs"
import { join } from "path"

const DB_ROOT = join(process.cwd(), "Database", "PastPapers")

// Per-year module ordering (curriculum order, not alphabetical).
// Add a module here once its folder exists in Database/PastPapers/<year>/.
export const MODULE_ORDER: Record<string, string[]> = {
  "1st-year": ["foundation", "blood", "locomotor", "respiratory", "cardiovascular"],
  "2nd-year": ["neuroscience", "head-and-neck", "endocrinology", "gastrointestinal", "renal", "reproductive"],
  "3rd-year": ["foundation", "infectious", "blood", "respiratory", "cardiovascular", "gastrointestinal", "renal", "endocrinology"],
  "4th-year": ["orthopedics", "reproductive", "drg", "neuroscience", "otorhinolaryngology", "ophthalmology"],
}

// Years (and "compiled") available for a given year+module, derived from the
// filesystem. Subject-grouped files (e.g. blood-biochemistry.json) are excluded
// — only YYYY and "compiled" tags are surfaced as quiz options.
export function yearsFor(year: string, mod: string): (number | string)[] {
  const dir = join(DB_ROOT, year, mod)
  const tags: (number | string)[] = []
  for (const f of readdirSync(dir)) {
    const m = f.match(new RegExp(`^${mod}-(.+)\\.json$`))
    if (!m) continue
    const tag = m[1]
    if (/^\d{4}$/.test(tag)) tags.push(Number(tag))
    else if (tag === "compiled") tags.push("compiled")
  }
  return tags.sort((a, b) => {
    if (a === "compiled") return 1
    if (b === "compiled") return -1
    return Number(a) - Number(b)
  })
}

// Every (year, module, tag) tuple available for prerendering.
export function allRoutes(): { QA: string[] }[] {
  const out: { QA: string[] }[] = []
  for (const year of Object.keys(MODULE_ORDER)) {
    if (!statSync(join(DB_ROOT, year)).isDirectory()) continue
    for (const mod of MODULE_ORDER[year]) {
      for (const tag of yearsFor(year, mod)) {
        out.push({ QA: [year, mod, String(tag)] })
      }
    }
  }
  return out
}
