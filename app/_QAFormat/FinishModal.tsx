import { useRouter } from "next/navigation"
import { Dispatch, RefObject, SetStateAction } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Progress from "../(Performance)/Progress"

type Props = {
  finishModal: boolean,
  setFinishModal: Dispatch<SetStateAction<boolean>>,
  score: RefObject<number>,
  totalQuestions: number,
  Retake: () => void
}

const FinishModal = ({ finishModal, setFinishModal, score, totalQuestions, Retake }: Props) => {
  const router = useRouter()

  const HomeRedirect = () => {
    setFinishModal(false)
    router.push("/")
  }

  return (
    <Dialog open={finishModal} onOpenChange={setFinishModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Done</DialogTitle>
          <DialogDescription>
            Score: {score.current} out of {totalQuestions}
          </DialogDescription>
        </DialogHeader>
        <Progress className="mx-auto mb-5" percentage={score.current/totalQuestions*100}/>
        <Button variant="brand" onClick={Retake}>
          Retake quiz
        </Button>
        <Button variant="brand" onClick={HomeRedirect}>
          Go back to HomePage
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default FinishModal