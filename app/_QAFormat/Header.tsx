type Props = {
  questionOrigin: string,
  questionID: number,
  totalQuestions: number
}

const Header = ({ questionOrigin, questionID, totalQuestions }: Props) => {
  return (
    <>
      <div className="my-3 flex justify-between">
        <span className="font-semibold capitalize text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
          {questionOrigin}
        </span>

        <span className="hidden md:flex text-sm sm:text-base text-muted-foreground">
          {questionID} out of {totalQuestions}
        </span>
      </div>
      <div className="hidden md:flex flex-grow h-[1px] bg-accent" />

      <div className="md:hidden flex items-center w-full">
        <div className="flex-grow h-[1px] bg-accent" />
        <span className="mx-3 text-sm sm:text-base whitespace-nowrap px-2 text-muted-foreground">
          {questionID} out of {totalQuestions}
        </span>
        <div className="flex-grow h-[1px] bg-accent" />
      </div>
    </>
  )
}

export default Header