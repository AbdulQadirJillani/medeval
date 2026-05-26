import Format from "@/app/_QAFormat/Format"
import type { Quiz } from "@/app/_QAFormat/types"
import { allRoutes } from "@/app/(PastPapers)/pastPapers"
import { redirect } from "next/navigation"

export function generateStaticParams() {
  return allRoutes()
}

type Props = {
  QA: string[]
}

const page = async ({ params }: { params: Promise<Props> }) => {
  let data: Quiz
  try {
    const { QA } = await params
    const [annual, module, year] = QA
    const promisedData = await import(`../../../../Database/PastPapers/${annual}/${module}/${module}-${year}.json`)
    data = await promisedData.default
    return <Format data={data} />
  }
  catch (e) {
    console.log(e)
    redirect("/")
  }
}

export default page