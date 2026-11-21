import { useState } from "react"
import { Bookmark, Check, Copy, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  questionOrigin: string,
  counterLabel: string,
  onOpenMap: () => void,
  saved: boolean,
  onToggleSave: () => void,
  copyText: string
}

const Header = ({ questionOrigin, counterLabel, onOpenMap, saved, onToggleSave, copyText }: Props) => {
  // The text that was copied, not a flag, so moving to another question
  // drops the tick instead of showing it against the wrong question
  const [copied, setCopied] = useState<string | null>(null)
  const isCopied = copied === copyText

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText)
    } catch {
      return // Clipboard blocked (insecure origin or denied): no tick
    }
    setCopied(copyText)
    setTimeout(() => setCopied(c => (c === copyText ? null : c)), 1500)
  }

  return (
    <div className="mt-3 flex justify-between items-center gap-3">
      {/* overflow-wrap: text past the box would be invisible (bg-clip-text) */}
      <span className="min-w-0 [overflow-wrap:anywhere] font-semibold capitalize text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
        {questionOrigin.replace(/\//g, "/​")}
      </span>

      <div className="shrink-0 flex items-center gap-2">
        <button
          type="button"
          onClick={copy}
          aria-label={isCopied ? "Question copied" : "Copy question"}
          title="Copy question and options (paste into any AI)"
          className={cn("grid place-items-center size-8 rounded-full border border-input text-muted-foreground hover:bg-input cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring", isCopied && "text-brand")}
        >
          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label="Save question"
          title="Save question (S)"
          className={cn("grid place-items-center size-8 rounded-full border border-input text-muted-foreground hover:bg-input cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring", saved && "text-brand")}
        >
          <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
        </button>

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
    </div>
  )
}

export default Header
