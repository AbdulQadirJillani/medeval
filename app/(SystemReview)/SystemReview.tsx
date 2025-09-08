import Link from "next/link"
import styles from "./SystemReview.module.css"

type Props = {
  systems: string[]
}

const SystemReview = ({ systems }: Props) => {
  return (
    <div className="grid [grid-template-columns:repeat(auto-fit,_minmax(min(220px,_100%),_1fr))] gap-12 m-12">
      {
        systems.map((s) => (
          <Link key={s} href={`/SystemReview/${s}`} className={styles.modulewrapper}>
            <h1 className="font-medium text-lg capitalize">
              {s.split('-').join(' ')}
            </h1>
          </Link>
        ))
      }
    </div>
  )
}

export default SystemReview