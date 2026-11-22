import { useState } from "react"
import dynamic from "next/dynamic"
import { Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MAX_TEXT } from "@/lib/explanations"

// Only key holders ever render this, so students never download the Markdown code.
// Nothing while it loads, rather than a flash of raw Markdown. If the code can't
// be fetched (bad connection, a tab left open across a deploy), show the note as
// plain text instead of letting the failed import crash the quiz.
const PlainExplanation = ({ text }: { text: string }) => (
  <p className="whitespace-pre-wrap break-words text-base sm:text-lg">{text}</p>
)
const ExplanationMarkdown = dynamic(
  () => import("./ExplanationMarkdown").catch(() => ({ default: PlainExplanation })),
  { loading: () => null },
)

type Props = {
  text?: string,
  canEdit: boolean,
  onSave: (text: string) => Promise<boolean>
}

// Editing happens in a dialog: it's portaled outside the quiz's swipe area,
// and an open dialog already blocks the quiz's answer/move/bookmark keys
const Explanation = ({ text, canEdit, onSave }: Props) => {
  const [open, setOpen] = useState<boolean>(false)
  // Kept until Cancel or a successful save, so a stray tap outside the
  // dialog (or Esc) doesn't throw away what was typed
  const [draft, setDraft] = useState<string | null>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [failed, setFailed] = useState<boolean>(false)

  if (!text && !canEdit) return null

  const value = draft ?? text ?? ""
  const empty = value.trim() === ""
  const unchanged = value.trim() === (text ?? "")

  const openEditor = () => {
    setFailed(false)
    setOpen(true)
  }

  const cancel = () => {
    setDraft(null)
    setOpen(false)
  }

  const save = async () => {
    setSaving(true)
    setFailed(false)
    const ok = await onSave(value)
    setSaving(false)
    if (ok) {
      setDraft(null)
      setOpen(false)
    } else setFailed(true)
  }

  return (
    <>
      {
        text
          ? <div className="mt-6 rounded-lg border-l-4 border-brand bg-accent/50 px-5 py-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="font-semibold">Explanation</h2>
              {canEdit && (
                <Button variant="ghost" size="icon" aria-label="Edit explanation" onClick={openEditor}>
                  <Pencil />
                </Button>
              )}
            </div>
            <ExplanationMarkdown text={text} />
          </div>
          : <Button variant="outline" className="mt-6" onClick={openEditor}>
            <Pencil /> Add explanation
          </Button>
      }

      {/* Held open while saving, so a failure can't be missed */}
      <Dialog open={open} onOpenChange={o => { if (!saving) setOpen(o) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Explanation</DialogTitle>
            <DialogDescription>Only you and your reader can see this.</DialogDescription>
          </DialogHeader>
          <textarea
            value={value}
            onChange={e => setDraft(e.target.value)}
            maxLength={MAX_TEXT}
            rows={14}
            autoFocus
            className="w-full rounded-md border border-input bg-background p-3 text-base focus:outline-none focus-visible:ring"
          />
          {failed && (
            <p role="alert" className="text-sm text-destructive">Couldn&apos;t save. Check your connection and try again.</p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={saving} onClick={cancel}>Cancel</Button>
            <Button variant="brand" disabled={saving || unchanged} onClick={save}>
              {saving ? "Saving…" : empty && text ? "Delete" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default Explanation
