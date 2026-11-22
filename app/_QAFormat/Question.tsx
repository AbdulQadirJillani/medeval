import { Fragment, MouseEvent, ReactNode, useMemo, useState } from "react"
import { markRuns, stemWords } from "./quizLogic"

// Tap a word to highlight it, tap again to clear it. A reading aid for the
// question on screen only: never saved, and Format remounts this on every move.
const Question = ({ question }: { question: string }) => {
  const [marked, setMarked] = useState<ReadonlySet<number>>(new Set())
  const words = useMemo(() => stemWords(question), [question])

  const toggle = (e: MouseEvent, i: number) => {
    // The second click of a double-click is native word selection, not an undo
    if (e.detail > 1) return
    setMarked(prev => {
      const next = new Set(prev)
      if (!next.delete(i)) next.add(i)
      return next
    })
  }

  const word = (i: number) => (
    <span key={i} className="cursor-pointer" onClick={e => toggle(e, i)}>{words[i]}</span>
  )

  return (
    <p className="text-lg sm:text-xl leading-relaxed my-6 text-pretty">
      {markRuns(words.length, marked).map((run, r) => {
        // Spaces inside a run, so a highlighted phrase is one unbroken band
        const content: ReactNode[] = []
        for (let i = run.start; i < run.end; i++) content.push(i > run.start ? " " : null, word(i))
        return (
          <Fragment key={run.start}>
            {r > 0 && " "}
            {run.marked
              ? <mark className="bg-yellow-200 text-inherit rounded-sm box-decoration-clone dark:bg-yellow-500/40">{content}</mark>
              : content}
          </Fragment>
        )
      })}
    </p>
  )
}

export default Question
