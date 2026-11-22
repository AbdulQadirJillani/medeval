import { useCallback, useEffect, useState } from "react"
import type { Question, QuestionRef } from "./types"
import { BOOKMARKS_EVENT, BOOKMARKS_KEY, type Bookmark, isSaved, parseBookmarks, removeBookmarks, toggleBookmark } from "./bookmarks"
import { recordRemovals } from "@/lib/removals"

type Ref = { path: string, key: string }

const read = () => parseBookmarks(localStorage.getItem(BOOKMARKS_KEY))

// Re-reads storage before every write so another tab's saves aren't clobbered.
// Returns false (and changes nothing) if the write fails, e.g. quota exceeded.
function write(update: (list: Bookmark[]) => Bookmark[]): boolean {
  const before = read()
  const after = update(before)
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(after))
  } catch {
    return false
  }
  // Remembered so restoring another device's backup doesn't re-save them
  const at = new Date().toISOString()
  recordRemovals(before.filter(b => !isSaved(after, b)).map(b => ({ kind: "bookmark", path: b.path, key: b.key, at })))
  window.dispatchEvent(new Event(BOOKMARKS_EVENT))
  return true
}

function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [ready, setReady] = useState<boolean>(false)

  useEffect(() => {
    const sync = () => setBookmarks(read())
    const onStorage = (e: StorageEvent) => {
      if (e.key === BOOKMARKS_KEY || e.key === null) sync()
    }
    sync()
    setReady(true)
    window.addEventListener(BOOKMARKS_EVENT, sync)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(BOOKMARKS_EVENT, sync)
      window.removeEventListener("storage", onStorage)
    }
  }, [])

  const toggle = useCallback((ref: QuestionRef, question: Question) => {
    write(list => toggleBookmark(list, ref, question, new Date()))
  }, [])

  const remove = useCallback((refs: Ref[]) => {
    write(list => removeBookmarks(list, refs))
  }, [])

  return { bookmarks, ready, toggle, remove }
}

export default useBookmarks
