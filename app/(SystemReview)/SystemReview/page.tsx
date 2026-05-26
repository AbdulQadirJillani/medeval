import LinkGrid from "@/app/_components/LinkGrid"
import { systems } from "./systems"

function page() {
  return <LinkGrid items={systems} basePath="/SystemReview" />
}

export default page
