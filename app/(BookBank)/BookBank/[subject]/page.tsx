import { redirect } from "next/navigation"
import Books from "../Books"

type Props = {
  subject: string
}

type subjects = {
  title: string,
  authors: string,
  edition: string,
  tag: string,
  cover: string,
  fileID: string
}[]

async function page({ params }: { params: Promise<Props> }) {
  let data: subjects
  try {
    const { subject } = await params
    const promisedData = await import(`../../../../Database/BookBank/${subject}.json`)
    data = await promisedData.default
    return <Books subjects={data} />
  }
  catch {
    redirect("/")
  }
}

export default page