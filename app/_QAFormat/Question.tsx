import { Fragment, MouseEvent, ReactNode, useMemo, useState } from "react"
import { markRuns, stemWords } from "./quizLogic"

// Tap a word to highlight it, tap again to clear it. A reading aid for the
// question on screen only: never saved, and Format remounts this on every move.
const Question = ({ question }: { question: string }) => {
  const [marked, setMarked] = useState<ReadonlySet<number>>(new Set())
  const words = useMemo(() => stemWords(question), [question])

  // One handler on the <p>, not one per word: a click handler on every word
  // makes screen readers treat each word as a separate clickable item
  const toggle = (e: MouseEvent<HTMLParagraphElement>) => {
    // A double-click or drag is selecting text, not highlighting
    if (window.getSelection()?.isCollapsed === false) return
    const wordOf = (n: Node | null | undefined) =>
      (n instanceof Element ? n : n?.parentElement)?.closest<HTMLElement>("[data-i]")
    // A tap that lands between lines misses every word: take the nearest character
    const w = wordOf(e.target as Node)
      ?? wordOf(document.caretPositionFromPoint?.(e.clientX, e.clientY)?.offsetNode
        ?? document.caretRangeFromPoint?.(e.clientX, e.clientY)?.startContainer)
    if (!w || !e.currentTarget.contains(w)) return
    const i = Number(w.dataset.i)
    setMarked(prev => {
      const next = new Set(prev)
      if (!next.delete(i)) next.add(i)
      return next
    })
  }

  const word = (i: number) => (
    <span key={i} data-i={i} className="cursor-pointer">{words[i]}</span>
  )

  return (
    // No tap flash: on a single handler it would cover the whole paragraph
    <p className="text-lg sm:text-xl leading-relaxed my-6 text-pretty [-webkit-tap-highlight-color:transparent]" onClick={toggle}>
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
