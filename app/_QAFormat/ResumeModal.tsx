import { Dispatch, RefObject, SetStateAction } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { deleteModule } from "../actions/functions"

type clicked = { questionIndex: number, optionIndex: number[] }[]

type Props = {
  pathname: string,
  resumeModal: boolean,
  setResumeModal: Dispatch<SetStateAction<boolean>>,
  resumeIndex: RefObject<number>,
  score: RefObject<number>,
  setClickedOption: Dispatch<SetStateAction<clicked>>,
  setIndex: Dispatch<SetStateAction<number>>
}

const ResumeModal = ({ pathname, resumeModal, setResumeModal, resumeIndex, score, setClickedOption, setIndex }: Props) => {
  const Resume = () => {
    setResumeModal(false)
    setIndex(resumeIndex.current)
  }

  const StartBegin = async () => {
    //For deleting module data from local storage and DB on StartBegin
    try {
      await deleteModule(pathname)
      localStorage.removeItem(`${pathname}-module`)
      resumeIndex.current = 0
      score.current = 0
      setClickedOption([])
    }
    catch (err) {
      console.error(err, 'Deleting module data from DB failed!')
    }
    finally {
      localStorage.setItem(`${pathname}-reset`, "true")
      setResumeModal(false)
    }
  }

  return (
    <Dialog open={resumeModal} onOpenChange={setResumeModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resume from where you left off?</DialogTitle>
          <DialogDescription>
            You left off at question number: {resumeIndex.current + 1}
          </DialogDescription>
        </DialogHeader>
        <Button className="bg-[#00ACE6] hover:bg-[#008fbf]" onClick={Resume}>
          Resume
        </Button>
        <Button className="bg-[#00ACE6] hover:bg-[#008fbf]" onClick={StartBegin}>
          Start from beginning
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default ResumeModal