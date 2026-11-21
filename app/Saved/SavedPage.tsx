"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Format from "../_QAFormat/Format"
import useBookmarks from "../_QAFormat/useBookmarks"
import { type Bookmark, buildRun, groupBookmarks } from "../_QAFormat/bookmarks"
import { moduleKey } from "../(Performance)/moduleStats"
import { labelParts, paperLabel } from "@/lib/papers"

type Props = { modules: string[], systems: string[] }

function SavedPage({ modules, systems }: Props) {
  const scope = useSearchParams().get("practise")
  return scope ? <SavedQuiz scope={scope} /> : <SavedList modules={modules} systems={systems} />
}

function SavedList({ modules, systems }: Props) {
  const router = useRouter()
  const { bookmarks, ready, remove } = useBookmarks()
  if (!ready) return null

  // Bookmarks saved under a since-renamed folder still practise, but their paper route would redirect home
  const valid = (path: string) => {
    const segs = path.split("/")
    return segs[1] === "PastPapers" ? modules.includes(`${segs[2]}/${segs[3]}`) : systems.includes(segs[2])
  }
  const where = (b: Bookmark) => b.path.startsWith("/PastPapers/") ? `${labelParts(b.path).at(-1)} · Q${b.index + 1}` : `Q${b.index + 1}`

  if (bookmarks.length === 0) {
    return <p className="my-11 w-[85%] mx-auto text-muted-foreground">Nothing saved yet. Tap 🔖 on any question, or press S.</p>
  }

  return (
    <div className="my-11 max-w-[90%] mx-auto space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold">Saved questions ({bookmarks.length})</h1>
        <Button variant="brand" onClick={() => router.push("/Saved?practise=all")}>Practise all</Button>
      </div>
      {
        groupBookmarks(bookmarks, moduleKey).map(g => (
          <section key={g.key} className="space-y-2">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h2 className="font-semibold break-words text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                {paperLabel(g.key)}
              </h2>
              <Button variant="outline" size="sm" onClick={() => router.push(`/Saved?practise=${encodeURIComponent(g.key)}`)}>Practise these</Button>
            </div>
            <ul className="rounded-xl ring ring-accent divide-y divide-accent">
              {
                g.items.map(b => (
                  <li key={`${b.path}#${b.id}`} className="flex items-center gap-3 px-4 sm:px-6 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm sm:text-base">{b.question.question}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{where(b)}</p>
                    </div>
                    {
                      valid(b.path) &&
                      <Link href={`${b.path}#q=${b.index + 1}`} className="shrink-0 text-sm text-brand hover:underline">Open in paper</Link>
                    }
                    <button
                      type="button"
                      onClick={() => remove([b])}
                      aria-label={`Remove ${where(b)} from saved`}
                      className="p-2 shrink-0 rounded-md text-muted-foreground hover:text-destructive cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))
              }
            </ul>
          </section>
        ))
      }
    </div>
  )
}

function SavedQuiz({ scope }: { scope: string }) {
  const router = useRouter()
  const { bookmarks, ready } = useBookmarks()
  const [run, setRun] = useState<Bookmark[] | null>(null)
  const [seed, setSeed] = useState<number>(0)

  // Built once when storage is read; un-bookmarking mid-run must not rebuild it
  useEffect(() => {
    if (ready && run === null) setRun(buildRun(bookmarks, scope, moduleKey))
  }, [ready, run, bookmarks, scope])

  useEffect(() => {
    if (run && run.length === 0) router.replace("/Saved")
  }, [run, router])

  if (!run || run.length === 0) return null

  const onAgain = () => {
    setRun(buildRun(bookmarks, scope, moduleKey))
    setSeed(s => s + 1)
  }

  return (
    <Format
      key={seed}
      data={run.map(b => b.question)}
      practice={{ refs: run.map(({ path, id, index }) => ({ path, id, index })), onAgain, onExit: () => router.push("/Saved") }}
    />
  )
}

export default SavedPage
