import { LayoutGrid } from "lucide-react"

type Props = {
  questionOrigin: string,
  counterLabel: string,
  onOpenMap: () => void
}

const Header = ({ questionOrigin, counterLabel, onOpenMap }: Props) => {
  return (
    <div className="mt-3 flex justify-between items-center gap-3">
      <span className="min-w-0 font-semibold capitalize text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
        {questionOrigin}
      </span>

      <button
        type="button"
        onClick={onOpenMap}
        className="shrink-0 flex items-center gap-1.5 whitespace-nowrap rounded-full border border-input px-3 py-1 text-sm tabular-nums text-muted-foreground hover:bg-input cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="sr-only">Question map, </span>
        {counterLabel}
      </button>
    </div>
  )
}

export default Header
