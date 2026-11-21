import { redirect } from "next/navigation"
import Books from "../Books"
import { subjects } from "../subjects"

export function generateStaticParams() {
  return subjects.map(subject => ({ subject }))
}

// Unknown subjects get a real 404 rather than a 200 that redirects home
export const dynamicParams = false

type Props = {
  subject: string
}

type Book = {
  title: string,
  authors: string,
  edition: string,
  tag: string,
  cover: string,
  fileID: string
}

async function page({ params }: { params: Promise<Props> }) {
  let data: Book[]
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