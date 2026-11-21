import { readdirSync } from "fs"
import { join } from "path"
import { MODULE_ORDER } from "./modules"

const DB_ROOT = join(process.cwd(), "Database", "PastPapers")

export { MODULE_ORDER } from "./modules"

// Years (and "compiled") available for a given year+module, derived from the
// filesystem. Only YYYY and "compiled" tags are surfaced as quiz options.
// A MODULE_ORDER module whose folder is missing yields [] rather than throwing:
// readdirSync raises ENOENT, which would otherwise fail the whole build from
// generateStaticParams/sitemap and 500 the year page.
export function yearsFor(year: string, mod: string): (number | string)[] {
  const dir = join(DB_ROOT, year, mod)
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return []
  }

  const tags: (number | string)[] = []
  for (const f of entries) {
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
    for (const mod of MODULE_ORDER[year]) {
      for (const tag of yearsFor(year, mod)) {
        out.push({ QA: [year, mod, String(tag)] })
      }
    }
  }
  return out
}
