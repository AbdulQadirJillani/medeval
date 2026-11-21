import Format from "@/app/_QAFormat/Format"
import type { Quiz, QuizLink } from "@/app/_QAFormat/types"
import { redirect } from "next/navigation"
import { systems } from "../systems"

export function generateStaticParams() {
  return systems.map(QA => ({ QA }))
}

// Unknown systems get a real 404 rather than a 200 that redirects home
export const dynamicParams = false

type Props = {
  QA: string
}

async function page({ params }: { params: Promise<Props> }) {
  let data: Quiz
  try {
    const { QA } = await params
    const promisedData = await import(`../../../../Database/SystemReview/${QA}.jsx`)
    data = await promisedData.default

    const nextSystem = systems[systems.indexOf(QA) + 1]
    const next: QuizLink | undefined = nextSystem === undefined ? undefined : {
      href: `/SystemReview/${nextSystem}`,
      label: `Next system: ${nextSystem.replace(/-/g, " ").replace(/^./, c => c.toUpperCase())}`,
    }
    const back: QuizLink = { href: "/SystemReview", label: "Back to systems" }

    return <Format key={QA} data={data} next={next} back={back} />
  }
  catch {
    redirect("/")
  }
}

export default page
