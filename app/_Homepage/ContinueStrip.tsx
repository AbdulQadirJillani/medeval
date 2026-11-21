"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { paperLabel } from "@/lib/papers"
import { resumeIndexFor } from "../_QAFormat/quizLogic"
import { type Session, unfinishedSessions } from "./sessions"

const VISIBLE = 3

function ContinueStrip({ modules }: { modules: string[] }) {
  // null until mounted: the server never renders the strip, so new visitors
  // and the prerendered HTML never see it.
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [pending, setPending] = useState<Session | null>(null)

  useEffect(() => {
    const entries: [string, string | null][] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) entries.push([key, localStorage.getItem(key)])
    }
    setSessions(unfinishedSessions(entries, modules))
  }, [modules])

  if (!sessions || sessions.length === 0) return null

  const discard = () => {
    if (!pending) return
    localStorage.removeItem(`${pending.pathname}-module`)
    setSessions(sessions.filter(s => s.pathname !== pending.pathname))
    setPending(null)
  }

  const shown = showAll ? sessions : sessions.slice(0, VISIBLE)

  return (
    <section className="w-[85%] mx-auto mt-5 animate-in fade-in duration-500">
      <h2 className="text-lg sm:text-xl font-semibold mb-3">Continue where you left off</h2>
      <ul className="rounded-xl ring ring-accent divide-y divide-accent">
        {shown.map(s => {
          const label = paperLabel(s.pathname)
          const at = Math.min(resumeIndexFor(s.answers, s.totalQuestions) + 1, s.totalQuestions)
          return (
            <li key={s.pathname} className="flex items-center">
              <Link href={s.pathname} className="flex flex-1 min-w-0 items-center justify-between gap-3 px-4 sm:px-6 py-3 rounded-xl hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
                <div className="min-w-0">
                  <p className="font-semibold break-words text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                    {label}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Q {at} / {s.totalQuestions} · {s.score} of {s.answers.length} right
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </Link>
              <button
                type="button"
                onClick={() => setPending(s)}
                aria-label={`Discard progress for ${label}`}
                className="p-3 mr-1 shrink-0 rounded-md text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          )
        })}
      </ul>
      {!showAll && sessions.length > VISIBLE && (
        <div className="flex justify-center mt-2">
          <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
            Show all ({sessions.length}) ▾
          </Button>
        </div>
      )}

      <Dialog open={pending !== null} onOpenChange={open => { if (!open) setPending(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard progress?</DialogTitle>
            <DialogDescription>
              Your answers on {pending ? paperLabel(pending.pathname) : ""} will be deleted. Past attempts on Performance are kept.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={discard}>Discard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export default ContinueStrip
