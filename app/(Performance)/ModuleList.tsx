import { paperLabel } from "@/lib/papers";
import { type ModuleStat } from "./moduleStats";

function ModuleList({ stats }: { stats: ModuleStat[] }) {
  if (stats.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="text-lg sm:text-xl font-semibold">
        By module <span className="text-sm font-normal text-muted-foreground">weakest first</span>
      </h2>
      <ul className="rounded-xl ring ring-accent divide-y divide-accent">
        {stats.map(({ key, percent, papers }) => (
          <li key={key} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] items-center gap-x-4 gap-y-2 px-4 sm:px-6 py-3">
            <p className="min-w-0 break-words font-medium text-sm sm:text-base">{paperLabel(key)}</p>
            <p className="text-right text-sm sm:order-last whitespace-nowrap">
              <span className="font-semibold">{Math.round(percent)}%</span>
              <span className="text-muted-foreground"> · {papers} paper{papers === 1 ? "" : "s"}</span>
            </p>
            <div className="col-span-2 sm:col-span-1 h-2 rounded-full bg-accent overflow-hidden">
              <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ModuleList
