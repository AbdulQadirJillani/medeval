import { cn } from "@/lib/utils"
import { Dispatch, RefObject, SetStateAction, useEffect, useMemo } from "react"
import type { Clicked } from "./types"
import { isQuizKeyBlocked, optionIndexForKey, optionLetter, sortOptions } from "./quizLogic"

type option = { option: string, explanation?: string, bool: boolean }

type Props = {
  options: option[],
  clickedOption: Clicked,
  setClickedOption: Dispatch<SetStateAction<Clicked>>,
  questionIndex: number,
  score: RefObject<number>,
  lock: RefObject<boolean>
}

const Options = ({ options, clickedOption, setClickedOption, questionIndex, score, lock }: Props) => {
  // Sorted longest-first. The order must stay deterministic: persisted answers
  // in localStorage reference optionIndex within THIS sorted array.
  const sortedOptions = useMemo(() => sortOptions(options), [options])

  // Whether this question has been answered before. Derived from the answer
  // data rather than navigation direction, so returning to a question that was
  // SKIPPED still scores, while returning to an answered one never re-scores.
  // `lock` stays as a synchronous latch against two clicks inside one render.
  const alreadyAnswered = clickedOption.some(p => p.questionIndex === questionIndex)

  const optionClick = (questionIndex: number, optionIndex: number, val: option) => {
    if (!alreadyAnswered && !lock.current && val.bool) score.current += 1
    lock.current = true

    setClickedOption(prev => {
      const existing = prev.find(p => p.questionIndex === questionIndex)

      if (existing) {
        if (!existing.optionIndex.includes(optionIndex)) {
          // Update existing question with new option
          return prev.map(p =>
            p.questionIndex === questionIndex
              ? { ...p, optionIndex: [...p.optionIndex, optionIndex] }
              : p
          )
        }
        return prev // Option already exists, do nothing
      } else {
        // New question entry
        return [...prev, { questionIndex, optionIndex: [optionIndex] }]
      }
    })
  }

  // Re-registered every render so the handler never scores against stale
  // alreadyAnswered / clickedOption values.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isQuizKeyBlocked(e)) return
      const i = optionIndexForKey(e.key, sortedOptions.length)
      if (i === null) return
      e.preventDefault()
      optionClick(questionIndex, i, sortedOptions[i])
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  })

  return (
    <div className="flex flex-col gap-[0.6rem]">
      {
        sortedOptions.map((val, optionIndex) => (
          <button className={cn("focus:outline-none focus-visible:ring flex items-start gap-3 text-left py-3 px-5 text-base sm:text-lg bg-accent rounded-lg cursor-pointer", clickedOption.map(obj => ((obj.questionIndex == questionIndex && obj.optionIndex.includes(optionIndex)) ? (val.bool ? "bg-[#66BB6A]" : "bg-[#E74C3C]") : "")))} onClick={() => optionClick(questionIndex, optionIndex, val)} key={`${optionIndex}-${val.option}`}>
            <span aria-hidden="true" className="shrink-0 mt-0.5 grid place-items-center size-6 rounded-md bg-background/80 text-xs font-semibold text-muted-foreground">
              {optionLetter(optionIndex)}
            </span>
            <span>
              {val.option}
              <span className={cn("hidden px-5 text-sm", clickedOption.map(obj => ((obj.questionIndex == questionIndex && obj.optionIndex.includes(optionIndex)) ? "block" : "")))}>
                {val.explanation}
              </span>
            </span>
          </button>
        ))
      }
    </div>
  )
}

export default Options