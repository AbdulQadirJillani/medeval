import { Separator } from "@/components/ui/separator"

type Props = {
  questionOrigin: string|string[],
  questionID: number,
  totalQuestions: number
}

const Header = ({ questionOrigin, questionID, totalQuestions }: Props) => {
  return (
    <>
    <div className="my-3 flex justify-between">
      <span className="font-semibold capitalize text-lg bg-clip-text text-transparent bg-gradient-to-r from-[hsl(202,_100%,_56%,_0.8)] via-[hsl(269,_100%,_61%,_0.8)] to-[hsl(343,_100%,_50%,_0.8)]">
        {questionOrigin}
      </span>
      <span className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-[hsl(202,_100%,_56%,_0.8)] via-[hsl(269,_100%,_61%,_0.8)] to-[hsl(343,_100%,_50%,_0.8)]">
        {questionID} out of {totalQuestions}
      </span>
    </div>
    <Separator orientation="horizontal" className="w-full h-[1px]" />
    </>
  )
}

export default Header