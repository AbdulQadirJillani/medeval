import { cn } from "@/lib/utils"
import { Dispatch, RefObject, SetStateAction } from "react"

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
  const sortedOptions = options.sort((a, b) => { return (b.option.length - a.option.length) })

  const optionClick = async (questionIndex: number, optionIndex: number, val: option) => {
    if (!lock.current && val.bool) score.current += 1
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
          <button tabIndex={1} className={cn("focus:outline-none focus-visible:ring text-left py-3 px-5 text-base sm:text-lg bg-accent rounded-lg cursor-pointer", clickedOption.map(obj => ((obj.questionIndex == questionIndex && obj.optionIndex.includes(optionIndex)) ? (val.bool ? "bg-[#66BB6A]" : "bg-[#E74C3C]") : "")))} onClick={() => optionClick(questionIndex, optionIndex, val)} key={optionIndex}>
            {val.option}
            <p className={cn("hidden px-5 text-sm", clickedOption.map(obj => ((obj.questionIndex == questionIndex && obj.optionIndex.includes(optionIndex)) ? "flex" : "")))}>
              {val.explanation}
            </p>
          </button>
        ))
      }
    </div>
  )
}

export default Options