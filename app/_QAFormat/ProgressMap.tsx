"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { QuestionStatus } from "./quizLogic"

type Props = {
  statuses: QuestionStatus[],
  saved: boolean[],
  index: number,
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onJump: (i: number) => void
}

const SLICE: Record<QuestionStatus, string> = {
  right: "bg-[#66BB6A]",
  wrong: "bg-[#E74C3C]",
  unanswered: "bg-accent",
}

const CHIP: Record<QuestionStatus, string> = {
  right: "bg-[#66BB6A] text-white",
  wrong: "bg-[#E74C3C] text-white",
  unanswered: "bg-accent",
}

const ProgressMap = ({ statuses, saved, index, open, onOpenChange, onJump }: Props) => {
  const currentRef = useRef<HTMLButtonElement>(null)
  const right = statuses.filter(s => s === "right").length
  const wrong = statuses.filter(s => s === "wrong").length
  const left = statuses.length - right - wrong

  return (
    <>
      {/* Past ~150 slices, one-pixel gaps would eat most of the bar */}
      <button
        type="button"
        aria-label="Open question map"
        onClick={() => onOpenChange(true)}
        className={cn("mt-3 mb-1 flex w-full h-2 rounded-full overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", statuses.length <= 150 && "gap-px")}
      >
        {statuses.map((s, i) => (
          <span key={i} className={cn("flex-1 h-full", i === index ? "bg-brand min-w-[3px]" : SLICE[s])} />
        ))}
      </button>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-[85%] sm:max-w-md"
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            currentRef.current?.scrollIntoView({ block: "center" })
            currentRef.current?.focus()
          }}
        >
          <SheetHeader className="pb-0">
            <SheetTitle>Questions</SheetTitle>
            <SheetDescription>{right} right · {wrong} wrong · {left} left</SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-6 sm:grid-cols-8 content-start gap-1.5 flex-1 min-h-0 overflow-y-auto px-4 pb-4 pt-1">
            {statuses.map((s, i) => (
              <button
                key={i}
                type="button"
                ref={i === index ? currentRef : undefined}
                aria-label={`Question ${i + 1}, ${s}${saved[i] ? ", saved" : ""}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => onJump(i)}
                className={cn("relative h-9 rounded-md text-sm tabular-nums cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring", CHIP[s], i === index && "ring-2 ring-brand ring-offset-2 ring-offset-background")}
              >
                {i + 1}
                {saved[i] && <span aria-hidden="true" className="absolute top-1 right-1 size-1.5 rounded-full bg-brand ring-1 ring-background" />}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export default ProgressMap
