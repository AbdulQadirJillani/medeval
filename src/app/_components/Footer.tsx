import { Dispatch, SetStateAction } from "react"
import { Button } from "@/components/ui/button"

type Props = {
  index: number,
  setIndex: Dispatch<SetStateAction<number>>,
  totalQuestions: number,
  setFinishModal: Dispatch<SetStateAction<boolean>>
}

const Footer = ({ index, setIndex, totalQuestions, setFinishModal }: Props) => {
  const Back = () => {
    if (index > 0) setIndex(prev => prev - 1)
  }

  const Next = () => {
    if (index + 1 < totalQuestions) setIndex(prev => prev + 1)
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