import Format from "@/app/_QAFormat/Format"
import type { Quiz, QuizLink } from "@/app/_QAFormat/types"
import { allRoutes, yearsFor } from "@/app/(PastPapers)/pastPapers"
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

const page = async ({ params }: { params: Promise<Props> }) => {
  let data: Quiz
  try {
    const { QA } = await params
    const [annual, module, year] = QA
    const promisedData = await import(`../../../../Database/PastPapers/${annual}/${module}/${module}-${year}.json`)
    data = await promisedData.default

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
    return <Format key={QA.join("/")} data={data} next={next} back={back} />
  }
  catch (e) {
    console.log(e)
    redirect("/")
  }
}

export default page
