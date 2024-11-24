import { cn } from "@/lib/utils"
import { Dispatch, MutableRefObject, SetStateAction } from "react"

type clicked = {
  optionHx: { questionIndex: number, optionIndex: number }[]
}

type option = { option: string, explanation?: string, bool: boolean }

type Props = {
  options: option[],
  clickedOption: clicked,
  setClickedOption: Dispatch<SetStateAction<clicked>>,
  index: number,
  score: MutableRefObject<number>,
  lock: MutableRefObject<boolean>,
  highestIndex: MutableRefObject<number>
}

const Options = ({ options, clickedOption, setClickedOption, index, score, lock }: Props) => {
  const sortedOptions = options.sort((a, b) => {return(b.option.length - a.option.length)})
  
  const optionClick = (index: number, i: number, val: option) => {
    if (!lock.current && val.bool) score.current += 1
    lock.current = true
    setClickedOption(prev => (
      {
        optionHx: [
          ...prev.optionHx,
          {
            questionIndex: index,
            optionIndex: i
          }
        ]
      }
    ))
  }

  return (
    <div className="flex flex-col gap-[0.6rem]">
      {
        sortedOptions.map((val, i) => (
          <button tabIndex={1} className={cn("focus:outline-none focus-visible:ring text-left py-3 px-5 text-lg bg-accent rounded-lg cursor-pointer", clickedOption.optionHx.map(obj => ((obj.questionIndex == index && obj.optionIndex == i) ? (val.bool ? "bg-green-500" : "bg-red-500") : "")))} onClick={() => optionClick(index, i, val)} key={val.option}>
            {val.option}
            <p className={cn("hidden px-5 text-sm", clickedOption.optionHx.map(obj => ((obj.questionIndex == index && obj.optionIndex == i) ? "flex" : "")))}>
              {val.explanation}
            </p>
          </button>
        ))
      }
    </div>
  )
}

export default Options