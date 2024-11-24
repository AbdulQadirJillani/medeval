import { useRouter } from "next/navigation"
import { Dispatch, MutableRefObject, SetStateAction } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Progress from "./Progress"

type Props = {
  finishModal: boolean,
  setFinishModal: Dispatch<SetStateAction<boolean>>,
  score: MutableRefObject<number>,
  totalQuestions: number
}

const FinishModal = ({ finishModal, setFinishModal, score, totalQuestions }: Props) => {
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
            <Button className="bg-[#00ACE6] hover:bg-[#008fbf]" onClick={HomeRedirect}>
              Go back to HomePage
            </Button>
        </DialogContent>
    </Dialog>
  )
}

export default FinishModal