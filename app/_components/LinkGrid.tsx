import Link from "next/link"
import TileGrid from "./TileGrid"
import styles from "./LinkGrid.module.css"

type Props = {
  items: string[]
  basePath: string
}

function LinkGrid({ items, basePath }: Props) {
  return (
    <TileGrid>
      {items.map((s) => (
        <Link key={s} href={`${basePath}/${s}`} className={styles.modulewrapper}>
          <h1 className="font-medium text-lg capitalize">
            {s.split('-').join(' ')}
          </h1>
        </Link>
      ))}
    </TileGrid>
  )
}

export default LinkGrid
