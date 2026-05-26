import Format from "@/app/_QAFormat/Format"
import type { Quiz } from "@/app/_QAFormat/types"
import { redirect } from "next/navigation"
import { systems } from "../systems"

export function generateStaticParams() {
  return systems.map(QA => ({ QA }))
}

type Props = {
  QA: string
}

async function page({ params }: { params: Promise<Props> }) {
  let data: Quiz
  try {
    const { QA } = await params
    const promisedData = await import(`../../../../Database/SystemReview/${QA}.jsx`)
    data = await promisedData.default
    return <Format data={data} />
  }
  catch {
    redirect("/")
  }
}

export default page