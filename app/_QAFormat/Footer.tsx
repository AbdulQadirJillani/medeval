import { Button } from "@/components/ui/button"

type Props = {
  index: number,
  totalQuestions: number,
  Next: () => void,
  Back: () => void,
  Finish: () => void
}

const Footer = ({ index, totalQuestions, Back, Next, Finish }: Props) => {
  return (
    <div className="flex justify-between mt-9">
      <Button variant="brand" className="text-lg" size={"lg"} disabled={index == 0} onClick={Back}>Back</Button>
      {
        (index + 1 < totalQuestions)
          ?
          <Button variant="brand" className="text-lg" size={"lg"} onClick={Next}>Next</Button>
          :
          <Button variant="brand" className="text-lg" size={"lg"} onClick={Finish}>Finish</Button>
      }
    </div>
  )
}

export default Footer