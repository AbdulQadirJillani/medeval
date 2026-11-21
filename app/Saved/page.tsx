import { Suspense } from "react"
import { MODULE_ORDER } from "../(PastPapers)/pastPapers"
import { systems } from "../(SystemReview)/SystemReview/systems"
import SavedPage from "./SavedPage"

export default function Page() {
  const modules = Object.entries(MODULE_ORDER).flatMap(([year, mods]) => mods.map(m => `${year}/${m}`))
  // SavedPage reads ?practise= with useSearchParams, which needs a Suspense boundary
  return (
    <Suspense>
      <SavedPage modules={modules} systems={systems} />
    </Suspense>
  )
}
