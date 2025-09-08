import { LucideHammer, LucideLightbulb } from "lucide-react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"

type Props = {
  hint: string,
  difficulty: number
}

const HintDifficulty = ({ hint, difficulty }: Props) => {
  return (
    <div className="mb-6 flex justify-between">
      <Dialog>
        <DialogTrigger className="flex gap-1 items-center border-2 border-input bg-background shadow-sm h-9 px-4 py-2 rounded-md">
          Hint
          <LucideLightbulb size={18}/>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex gap-1 items-center">
                  Hint
                  <LucideLightbulb size={18}/>
                </DialogTitle>
                <DialogDescription>
                    {hint}
                </DialogDescription>
            </DialogHeader>
        </DialogContent>
      </Dialog>

      <div className="flex">
        {
          [...Array(difficulty)].map((_, i) => <LucideHammer color="#A4ADB3" fill="#ABB4BA" key={i}/>)
        }
      </div>
    </div>
  )
}

export default HintDifficulty