import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { pageMetadata } from "@/lib/metadata"
import { labelParts } from "@/lib/papers"
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

async function loadBooks(subject: string): Promise<Book[]> {
  const promisedData = await import(`../../../../Database/BookBank/${subject}.json`)
  return promisedData.default
}

export async function generateMetadata({ params }: { params: Promise<Props> }): Promise<Metadata> {
  const { subject } = await params
  const [label] = labelParts(subject)
  const books = await loadBooks(subject).catch(() => [])
  const titles = books.slice(0, 2).map(b => b.title).join(" and ")
  const description = books.length === 0
    ? `${label} books to download free as PDFs.`
    : `${books.length} ${label} books to download free as PDFs, including ${titles}.`
  return pageMetadata(`${label} Books`, description, `/BookBank/${subject}`)
}

async function page({ params }: { params: Promise<Props> }) {
  let data: Book[]
  try {
    const { subject } = await params
    data = await loadBooks(subject)
    return <Books subjects={data} />
  }
  catch {
    redirect("/")
  }
}

export default page