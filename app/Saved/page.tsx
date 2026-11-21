import { Suspense } from "react"
import { allRoutes } from "../(PastPapers)/pastPapers"
import { systems } from "../(SystemReview)/SystemReview/systems"
import SavedPage from "./SavedPage"
import { quizPaths } from "@/lib/papers"

export default function Page() {
  // Exact routes, so a paper dropped or renamed in a re-scrape hides its "Open in paper" link
  const paths = quizPaths(allRoutes(), systems)
  // SavedPage reads ?practise= with useSearchParams, which needs a Suspense boundary
  return (
    <Suspense>
      <SavedPage paths={paths} />
    </Suspense>
  )
}
