import type { Metadata } from "next"
import Format from "@/app/_QAFormat/Format"
import type { Quiz, QuizLink } from "@/app/_QAFormat/types"
import { pageMetadata } from "@/lib/metadata"
import { labelParts } from "@/lib/papers"
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

async function loadSystem(QA: string): Promise<Quiz> {
  const promisedData = await import(`../../../../Database/SystemReview/${QA}.jsx`)
  return promisedData.default
}

export async function generateMetadata({ params }: { params: Promise<Props> }): Promise<Metadata> {
  const { QA } = await params
  const path = `/SystemReview/${QA}`
  const [, system] = labelParts(path)
  const count = await loadSystem(QA).then(d => d.length, () => undefined)
  const questions = count === undefined ? `${system} practice questions` : `${count} ${system} practice questions`
  return pageMetadata(`${system} · System Review`, `${questions}, with hints and difficulty ratings.`, path)
}

async function page({ params }: { params: Promise<Props> }) {
  let data: Quiz
  try {
    const { QA } = await params
    data = await loadSystem(QA)

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
