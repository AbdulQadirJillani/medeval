import Progress from "./Progress"

type performance = {
  performance: {
    dateTime: string,
    questionOrigin: string,
    score: number,
    totalQuestions: number
  }[]
}

function Performance({ performance }: { performance: performance }) {
  return (
    <div className="mt-11 max-w-[90%] mx-auto grid lg:grid-cols-2 gap-6">
      {
        performance?.performance.reverse().map(({ dateTime, questionOrigin, score, totalQuestions }, n) => (
          <div key={n} className="flex gap-5 justify-between items-center ring ring-accent rounded-md px-6 md:px-8 py-4">
            <div>
              <div className="flex flex-col gap-1">
                <p className="text-sm">
                  {dateTime.toLocaleString()}
                </p>
                <p className="font-semibold capitalize text-lg bg-clip-text text-transparent bg-gradient-to-r from-[hsl(202,_100%,_56%,_0.8)] via-[hsl(269,_100%,_61%,_0.8)] to-[hsl(343,_100%,_50%,_0.8)]">
                  {questionOrigin}
                </p>
                <p>
                  Score: {score}/{totalQuestions}
                </p>
              </div>
            </div>
            <Progress percentage={score/totalQuestions*100}/>
          </div>
        ))
      }
    </div>
  )
}

export default Performance