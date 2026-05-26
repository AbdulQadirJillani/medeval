import SystemReview from "../SystemReview"
import { systems } from "./systems"

function page() {
  return (
    <SystemReview systems={systems} />
  )
}

export default page