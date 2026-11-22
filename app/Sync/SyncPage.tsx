"use client"

import { useRef, useState } from "react"
import { Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BOOKMARKS_EVENT } from "../_QAFormat/bookmarks"
import { applyChanges, backupFileName, mergeSnapshots, parseBackup, readLocalSnapshot, storageChanges, summaryText, toBackup } from "./sync"

type Status = { text: string, error: boolean } | null

// A real backup is at most a few MB (localStorage itself caps out around
// 5-10 MB). Anything far bigger was picked by mistake, e.g. a video, and
// reading it whole could freeze the tab.
const MAX_BYTES = 20 * 1024 * 1024

const INVALID = "That file isn't a MedEval backup. Nothing was changed."
const NEWER = "This backup was made by a newer version of MedEval. Reload the site and try again."
const UNREADABLE = "Couldn't read that file. Nothing was changed."
const FULL = "Couldn't finish restoring: this browser's storage is full. Free some space, then restore the same file again."

// null when the browser can't read it (e.g. an Android file that's no longer
// accessible). An oversized file reads as "", which parses as not-a-backup.
async function readFile(file: File): Promise<string | null> {
  if (file.size > MAX_BYTES) return ""
  try {
    return await file.text()
  } catch {
    return null
  }
}

function download(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement("a")
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoked a moment later: some browsers start reading the URL after click() returns
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function SyncPage() {
  const input = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>(null)

  const backUp = async () => {
    const now = new Date()
    const file = new File([JSON.stringify(toBackup(readLocalSnapshot(), now))], backupFileName(now), { type: "application/json" })
    // Phones get the share sheet so the file can go straight to WhatsApp; desktops download
    if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "MedEval backup" })
        return
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return
      }
    }
    download(file)
  }

  const restore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    const file = el.files?.[0]
    if (!file) return
    const text = await readFile(file)
    // Cleared so picking the same file again still fires onChange
    el.value = ""
    if (text === null) {
      setStatus({ text: UNREADABLE, error: true })
      return
    }
    const parsed = parseBackup(text)
    if (!parsed.ok) {
      setStatus({ text: parsed.error === "newer" ? NEWER : INVALID, error: true })
      return
    }
    const before = readLocalSnapshot()
    const { result, summary } = mergeSnapshots(before, parsed.snapshot)
    if (!applyChanges(storageChanges(before, result))) {
      setStatus({ text: FULL, error: true })
      return
    }
    window.dispatchEvent(new Event(BOOKMARKS_EVENT))
    setStatus({ text: summaryText(summary), error: false })
  }

  return (
    <div className="my-11 max-w-[90%] mx-auto space-y-6">
      <h1 className="text-xl sm:text-2xl font-semibold">Move your progress to another device</h1>
      <ol className="list-decimal pl-5 space-y-1.5 text-sm sm:text-base">
        <li>Tap Back up. A file is saved (on a phone, the share sheet opens).</li>
        <li>Send it to yourself: WhatsApp, email, Drive.</li>
        <li>On the other device, open Sync, tap Restore and pick the file.</li>
      </ol>
      <p className="text-sm text-muted-foreground">
        Includes papers in progress, attempt history and saved questions. Dark mode stays as set on each device.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button variant="brand" onClick={backUp}>
          <Download />
          Back up
        </Button>
        <Button variant="outline" onClick={() => input.current?.click()}>
          <Upload />
          Restore
        </Button>
        {/* No accept filter: Android can label a .json received over WhatsApp as a
            generic file, and a JSON-only picker would grey it out */}
        <input ref={input} type="file" className="hidden" onChange={restore} />
      </div>
      <p role="status" className={`text-sm sm:text-base break-words ${status?.error ? "text-destructive" : ""}`}>
        {status?.text}
      </p>
    </div>
  )
}

export default SyncPage
