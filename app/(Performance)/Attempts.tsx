import Progress from "./Progress";

type performance = {
  id?: string,
  userId?: string,
  clerkId?: string;
  pathname: string;
  score: number;
  totalQuestions: number;
  finishDateTime: Date
}[]

function Attempts({ data }: { data: performance }) {
  return (
    <div className="grid lg:grid-cols-2 gap-3">
      {
        data.map(({ pathname, score, totalQuestions, finishDateTime }, n) => (
          <div key={n} className="flex justify-between items-center gap-3 rounded-xl ring ring-accent px-6 md:px-8 py-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {new Date(finishDateTime).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false
                }).replace(/\//g, "-")}
              </p>
              <p className="font-semibold capitalize text-sm sm:text-base md:text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                {pathname.split('/').slice(1).join(' / ')}
              </p>
              <p className="text-sm sm:text-base font-medium text-muted-foreground mt-2">
                Score: <span className="font-semibold">{score}</span>/{totalQuestions}
              </p>
            </div>
            <div>
              <Progress percentage={score / totalQuestions * 100} />
            </div>
          </div>
        ))
      }
    </div>)
}

export default Attempts
