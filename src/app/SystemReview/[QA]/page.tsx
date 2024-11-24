import Format from "@/app/_components/Format"
import { redirect } from "next/navigation"

type Props = {
  QA: string
}

type Data = {
  id: number,
  info: string,
  question: string,
  difficulty: number,
  hint: string,
  answers: { option: string, explanation: string, bool: boolean }[]
}[]

async function page({ params }: { params: Props }) {
  let data: Data
  try {
    const promisedData = await import(`../../../Database/SystemReview/${params.QA}.jsx`)
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