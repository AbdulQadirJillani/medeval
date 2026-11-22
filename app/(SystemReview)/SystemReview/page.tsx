import LinkGrid from "@/app/_components/LinkGrid"
import { pageMetadata } from "@/lib/metadata"
import { systems } from "./systems"

export const metadata = pageMetadata(
  "System Review",
  "Practice questions organised by body system, with hints and difficulty ratings.",
  "/SystemReview",
)

function page() {
  return <LinkGrid items={systems} basePath="/SystemReview" />
}

export default page
