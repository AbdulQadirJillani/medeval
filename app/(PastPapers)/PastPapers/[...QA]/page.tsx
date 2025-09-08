import Format from "@/app/_QAFormat/Format"
import { redirect } from "next/navigation"

type Props = {
  QA: string[]
}

type Data = {
  id: number,
  info: string,
  question: string,
  answers: { option: string, bool: boolean }[]
}[]

const page = async ({ params }: { params: Promise<Props> }) => {
  let data: Data
  try {
    const { QA } = await params
    const [annual, module, year] = QA
    const promisedData = await import(`../../../../Database/PastPapers/${annual}/${module}/${module}-${year}.json`)
    data = await promisedData.default
  }
  catch (e) {
    console.log(e)
    redirect("/")
  }

  return (
    <Format data={data} />
  )
}

export default page