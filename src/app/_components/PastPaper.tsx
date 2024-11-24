import Link from "next/link"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import styles from "./PastPaper.module.css"

type Props = {
  modules: string[],
  years: { [key: string]: (number|string)[] },
  annual: string
}

const PastPaper = ({ modules, years, annual }: Props ) => {
  return (
    <div className="grid [grid-template-columns:repeat(auto-fit,_minmax(min(220px,_100%),_1fr))] gap-12 m-12">
      {
        modules.map((m) => {
          return(
            <div key={m} className={cn(styles.modulewrapper, styles[m])}>
              <h3 className="text-lg font-semibold capitalize">
                {m.split('_').join(' & ')}
              </h3>
              <Separator orientation="horizontal" className='w-[80%] h-[1px] mb-2 mx-auto bg-foreground'/>
              <div className="flex flex-col gap-1 text-lg">
                {
                  years[m].map((y) => <Link key={y} href={`/PastPapers/${annual}/${m}-${y}`}>{y}</Link>)
                }
              </div>
            </div>
          )
        })
      }
    </div>
  )
}

export default PastPaper