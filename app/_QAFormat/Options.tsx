import { cn } from "@/lib/utils"
import { Dispatch, RefObject, SetStateAction, useMemo } from "react"

type clicked = { questionIndex: number, optionIndex: number[] }[]
type option = { option: string, explanation?: string, bool: boolean }

type Props = {
  options: option[],
  clickedOption: clicked,
  setClickedOption: Dispatch<SetStateAction<clicked>>,
  questionIndex: number,
  score: RefObject<number>,
  lock: RefObject<boolean>
}

const Options = ({ options, clickedOption, setClickedOption, questionIndex, score, lock }: Props) => {
  // Sorted longest-first. The order must stay deterministic: persisted answers
  // in localStorage reference optionIndex within THIS sorted array.
  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => b.option.length - a.option.length),
    [options]
  )

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

  return (
    <div className="flex flex-col gap-[0.6rem]">
      {
        sortedOptions.map((val, optionIndex) => (
          <button className={cn("focus:outline-none focus-visible:ring text-left py-3 px-5 text-base sm:text-lg bg-accent rounded-lg cursor-pointer", clickedOption.map(obj => ((obj.questionIndex == questionIndex && obj.optionIndex.includes(optionIndex)) ? (val.bool ? "bg-[#66BB6A]" : "bg-[#E74C3C]") : "")))} onClick={() => optionClick(questionIndex, optionIndex, val)} key={`${optionIndex}-${val.option}`}>
            {val.option}
            <span className={cn("hidden px-5 text-sm", clickedOption.map(obj => ((obj.questionIndex == questionIndex && obj.optionIndex.includes(optionIndex)) ? "block" : "")))}>
              {val.explanation}
            </span>
          </button>
        ))
      }
    </div>
  )
}

export default Options