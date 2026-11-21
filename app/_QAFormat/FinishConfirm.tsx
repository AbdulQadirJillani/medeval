import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Props = {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  unanswered: number,
  // 0-based index of the first unanswered question
  firstUnanswered: number,
  onGoTo: () => void,
  onFinish: () => void
}

const FinishConfirm = ({ open, onOpenChange, unanswered, firstUnanswered, onGoTo, onFinish }: Props) => {
  const noun = unanswered === 1 ? "question" : "questions"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finish with {unanswered} unanswered {noun}?</DialogTitle>
          <DialogDescription>
            Unanswered questions count as wrong.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFinish}>Finish anyway</Button>
          <Button variant="brand" onClick={onGoTo}>Go to question {firstUnanswered + 1}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default FinishConfirm
