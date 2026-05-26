import { ReactNode } from "react"

function TileGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid [grid-template-columns:repeat(auto-fit,_minmax(min(220px,_100%),_1fr))] gap-12 m-12">
      {children}
    </div>
  )
}

export default TileGrid
