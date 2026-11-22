import { Dispatch, RefObject, SetStateAction } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { recordRemovals } from "@/lib/removals"
import { readSession } from "./useQuizPersistence"

type clicked = { questionIndex: number, optionIndex: number[] }[]

type Props = {
  pathname: string,
  answered: number,
  resumeModal: boolean,
  setResumeModal: Dispatch<SetStateAction<boolean>>,
  resumeIndex: RefObject<number>,
  score: RefObject<number>,
  setClickedOption: Dispatch<SetStateAction<clicked>>,
  setIndex: Dispatch<SetStateAction<number>>
}

const ResumeModal = ({ pathname, answered, resumeModal, setResumeModal, resumeIndex, score, setClickedOption, setIndex }: Props) => {
  const Resume = () => {
    setResumeModal(false)
    setIndex(resumeIndex.current)
  }

  const StartBegin = async () => {
    //For deleting module data from local storage and DB on StartBegin
    try {
      // Remembered so restoring another device's backup doesn't bring the old answers back
      const obj = readSession(`${pathname}-module`)
      localStorage.removeItem(`${pathname}-module`)
      if (obj) recordRemovals([{ kind: "session", path: pathname, started: String(obj.startDateTime ?? ""), at: new Date().toISOString() }])
      resumeIndex.current = 0
      score.current = 0
      setClickedOption([])
    }
    catch (err) {
      console.error(err, 'Deleting module data from DB failed!')
    }
    finally {
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
            <br />
            Score so far: {score.current}/{answered}
          </DialogDescription>
        </DialogHeader>
        <Button variant="brand" onClick={Resume}>
          Resume
        </Button>
        <Button variant="brand" onClick={StartBegin}>
          Start from beginning
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default ResumeModal