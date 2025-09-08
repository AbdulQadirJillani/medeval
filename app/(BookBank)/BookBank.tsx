import Link from "next/link"
import styles from "./BookBank.module.css"

type Props = {
  subjects: string[]
}

const BookBank = ({ subjects }: Props) => {
  return (
    <div className="grid [grid-template-columns:repeat(auto-fit,_minmax(min(220px,_100%),_1fr))] gap-12 m-12">
      {
        subjects.map((s) => (
          <Link key={s} href={`/BookBank/${s}`} className={styles.modulewrapper}>
            <h1 className="font-medium text-lg capitalize">
              {s.split('-').join(' ')}
            </h1>
          </Link>
        ))
      }
    </div>
  )
}

export default BookBank
