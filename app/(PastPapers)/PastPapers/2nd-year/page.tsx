import PastPaper from "@/app/(PastPapers)/PastPaper"
import { MODULE_ORDER, yearsFor } from "@/app/(PastPapers)/pastPapers"

const ANNUAL = "2nd-year"

export default function page() {
  const modules = MODULE_ORDER[ANNUAL]
  const years = Object.fromEntries(modules.map(m => [m, yearsFor(ANNUAL, m)]))
  return <PastPaper modules={modules} years={years} annual={ANNUAL} />
}
