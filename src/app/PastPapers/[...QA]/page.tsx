import Format from "@/app/_components/Format"
import { redirect } from "next/navigation"

type Props = {
  QA: string[]
}

type Data = {
  id: number,
  info: string|string[],
  question: string,
  answers: { option: string, bool: boolean }[]
}[]

const page = async({ params }: { params: Props }) => {
  let data: Data
  try {
    const annual = params.QA[0]
    const[module, year] = params.QA[1].split('-')
    const promisedData = await import(`../../../Database/PastPapers/${annual}/${module}/${module}-${year}.jsx`)
    data = await promisedData.default
  }
  catch {
    redirect("/")
  }

  return (
    <Format data={data}/>
  )
}

export default page