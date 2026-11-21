import Link from "next/link"
import { Dispatch, RefObject, SetStateAction } from "react"
import { ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Progress from "../(Performance)/Progress"
import type { QuizLink } from "./types"

type Props = {
  finishModal: boolean,
  setFinishModal: Dispatch<SetStateAction<boolean>>,
  score: RefObject<number>,
  totalQuestions: number,
  Retake: () => void,
  next?: QuizLink,
  back?: QuizLink,
  missedCount: number,
  onReview: () => void,
  practice?: {
    removable: number,
    onRemoveRight: () => void,
    onAgain: () => void,
    onExit: () => void
  }
}

const FinishModal = ({ finishModal, setFinishModal, score, totalQuestions, Retake, next, back, missedCount, onReview, practice }: Props) => {
  const percentage = score.current / totalQuestions * 100

  return (
    <Dialog open={finishModal} onOpenChange={setFinishModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Done</DialogTitle>
          <DialogDescription>
            Score: {score.current} / {totalQuestions} ({Math.round(percentage)}%)
          </DialogDescription>
        </DialogHeader>
        <Progress className="mx-auto mb-5" percentage={percentage}/>
        {
          missedCount > 0 &&
          <Button variant="brand" onClick={onReview}>
            Review missed ({missedCount})
          </Button>
        }
        {
          practice ? (
            <>
              {
                practice.removable > 0 &&
                <Button variant="brand" onClick={practice.onRemoveRight}>
                  Remove the {practice.removable} I got right
                </Button>
              }
              <Button variant="brand" onClick={practice.onAgain}>
                Practise again
              </Button>
              <Button variant="outline" onClick={practice.onExit}>
                Back to Saved
              </Button>
            </>
          ) : (
            <>
              {
                next &&
                // Long system names would otherwise widen the whole dialog on phones
                <Button asChild variant="brand" className="whitespace-normal h-auto min-h-9 py-2 text-center">
                  <Link href={next.href} onClick={() => setFinishModal(false)}>
                    {next.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              }
              <Button variant="brand" onClick={Retake}>
                Retake quiz
              </Button>
              {
                back &&
                <Button asChild variant="outline">
                  <Link href={back.href} onClick={() => setFinishModal(false)}>
                    {back.label}
                  </Link>
                </Button>
              }
            </>
          )
        }
      </DialogContent>
    </Dialog>
  )
}

export default FinishModal
