import type { Metadata } from "next"
import Format from "@/app/_QAFormat/Format"
import type { Quiz, QuizLink } from "@/app/_QAFormat/types"
import { allRoutes, yearsFor } from "@/app/(PastPapers)/pastPapers"
import { pageMetadata } from "@/lib/metadata"
import { labelParts } from "@/lib/papers"
import { redirect } from "next/navigation"

export function generateStaticParams() {
  return allRoutes()
}

// Anything not prerendered (a missing paper, an extra segment) is a real 404,
// not a 200 that streams a redirect home after loading.tsx's shell
export const dynamicParams = false

type Props = {
  QA: string[]
}

async function loadPaper([annual, module, year]: string[]): Promise<Quiz> {
  const promisedData = await import(`../../../../Database/PastPapers/${annual}/${module}/${module}-${year}.json`)
  return promisedData.default
}

export async function generateMetadata({ params }: { params: Promise<Props> }): Promise<Metadata> {
  const { QA } = await params
  const path = `/PastPapers/${QA.join("/")}`
  const [annual, module, tag] = labelParts(path)
  const compiled = QA[2] === "compiled"
  const title = compiled ? `${annual} · ${module} · Compiled Past Papers` : `${annual} · ${module} · ${tag} Past Paper`
  const count = await loadPaper(QA).then(d => d.length, () => undefined)
  const mcqs = count === undefined ? "MCQs" : `${count} MCQs`
  const source = compiled ? `compiled from past ${annual} ${module} papers` : `from the ${annual} ${module} ${tag} paper`
  return pageMetadata(title, `${mcqs} ${source}, as a free interactive quiz. Progress saves in your browser.`, path)
}

const page = async ({ params }: { params: Promise<Props> }) => {
  let data: Quiz
  try {
    const { QA } = await params
    const [annual, module, year] = QA
    data = await loadPaper(QA)

    const tags = yearsFor(annual, module)
    const i = tags.findIndex(t => String(t) === year)
    const nextTag = i === -1 ? undefined : tags[i + 1]
    const next: QuizLink | undefined = nextTag === undefined ? undefined : {
      href: `/PastPapers/${annual}/${module}/${nextTag}`,
      label: `Next paper: ${nextTag === "compiled" ? "Compiled" : nextTag}`,
    }
    const back: QuizLink = { href: `/PastPapers/${annual}`, label: `Back to ${annual.replace("-year", " Year")}` }

    // Keyed per paper so "Next paper" mounts a fresh quiz instead of keeping
    // the previous paper's index and answers.
    return <Format key={QA.join("/")} data={data} next={next} back={back} explanations />
  }
  catch (e) {
    console.log(e)
    redirect("/")
  }
}

export default page
