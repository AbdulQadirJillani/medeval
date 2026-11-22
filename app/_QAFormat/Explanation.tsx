import { useState } from "react"
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

type Props = {
  text?: string,
  canEdit: boolean,
  onSave: (text: string) => Promise<boolean>
}

// Editing happens in a dialog: it's portaled outside the quiz's swipe area,
// and an open dialog already blocks the quiz's answer/move/bookmark keys
const Explanation = ({ text, canEdit, onSave }: Props) => {
  const [open, setOpen] = useState<boolean>(false)
  const [draft, setDraft] = useState<string>("")
  const [saving, setSaving] = useState<boolean>(false)
  const [failed, setFailed] = useState<boolean>(false)

  if (!text && !canEdit) return null

  const empty = draft.trim() === ""
  const unchanged = draft.trim() === (text ?? "")

  const openEditor = () => {
    setDraft(text ?? "")
    setFailed(false)
    setOpen(true)
  }

  const save = async () => {
    setSaving(true)
    setFailed(false)
    const ok = await onSave(draft)
    setSaving(false)
    if (ok) setOpen(false)
    else setFailed(true)
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
            <p className="whitespace-pre-wrap text-base sm:text-lg">{text}</p>
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
            value={draft}
            onChange={e => setDraft(e.target.value)}
            maxLength={MAX_TEXT}
            rows={8}
            autoFocus
            className="w-full rounded-md border border-input bg-background p-3 text-base focus:outline-none focus-visible:ring"
          />
          {failed && (
            <p role="alert" className="text-sm text-destructive">Couldn&apos;t save. Check your connection and try again.</p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancel</Button>
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
