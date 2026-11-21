import { Button } from "@/components/ui/button"

type Props = {
  canBack: boolean,
  isLast: boolean,
  finishLabel: string,
  Next: () => void,
  Back: () => void,
  Finish: () => void
}

const Footer = ({ canBack, isLast, finishLabel, Back, Next, Finish }: Props) => {
  return (
    <div className="flex justify-between mt-9">
      <Button variant="brand" className="text-lg" size={"lg"} disabled={!canBack} onClick={Back}>Back</Button>
      {
        isLast
          ?
          <Button variant="brand" className="text-lg" size={"lg"} onClick={Finish}>{finishLabel}</Button>
          :
          <Button variant="brand" className="text-lg" size={"lg"} onClick={Next}>Next</Button>
      }
    </div>
  )
}

export default Footer
