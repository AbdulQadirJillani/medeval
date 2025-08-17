import { Dispatch, RefObject, SetStateAction } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
// import { deleteModule } from "../actions/deleteModule"

type clicked = { questionIndex: number, optionIndex: number[] }[]

type Props = {
  resumeModal: boolean,
  setResumeModal: Dispatch<SetStateAction<boolean>>,
  resumeIndex: RefObject<number>,
  setClickedOption: Dispatch<SetStateAction<clicked>>,
  setIndex: Dispatch<SetStateAction<number>>,
  pathname: string
}

const ResumeModal = ({ resumeModal, setResumeModal, resumeIndex, setClickedOption, setIndex, pathname }: Props) => {
  const Resume = () => {
    setResumeModal(false)
    setIndex(resumeIndex.current)
  }

  const StartBegin = async() => {
    setClickedOption([])
    setResumeModal(false)
    // try {
    //   await deleteModule(pathname)
    // }
    // catch(err) {
    //   console.error(err, 'Deleting module data from DB failed!')
    // }
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