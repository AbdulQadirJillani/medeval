import { Dispatch, RefObject, SetStateAction } from "react"
import { Button } from "@/components/ui/button"

type Props = {
  index: number,
  setIndex: Dispatch<SetStateAction<number>>,
  resumeIndex: RefObject<number>,
  totalQuestions: number,
  setFinishModal: Dispatch<SetStateAction<boolean>>,
  lock: RefObject<boolean>
}

const Footer = ({ index, setIndex, resumeIndex, totalQuestions, setFinishModal, lock }: Props) => {
  const Back = () => {
    if (index > 0) {
      setIndex(prev => prev - 1)
      lock.current = true
    }
  }

  const Next = () => {
    if (index + 1 < totalQuestions) {
      setIndex(prev => prev + 1)
      if (resumeIndex.current > index) {
        lock.current = true
      }
      else {
        lock.current = false
      }
    }
  }

  const Finish = () => {
    setFinishModal(true)
  }

  return (
    <div className="flex justify-between mt-9">
      <Button className="bg-[#00ACE6] text-lg hover:bg-[#008fbf]" size={"lg"} disabled={index==0} onClick={Back}>Back</Button>
      {
        (index + 1 < totalQuestions)
        ?
        <Button className="bg-[#00ACE6] text-lg hover:bg-[#008fbf]" size={"lg"} onClick={Next}>Next</Button>
        :
        <Button className="bg-[#00ACE6] text-lg hover:bg-[#008fbf]" size={"lg"} onClick={Finish}>Finish</Button>
      }
    </div>
  )
}

export default Footer