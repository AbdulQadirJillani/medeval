import Markdown from "react-markdown"
import { cn } from "@/lib/utils"
import { keepComparisons, markdownOptions } from "./markdownOptions"

// No typography plugin in the project, so Markdown elements are styled here.
// Cells get a minimum width so a wide table scrolls (inside its wrapper)
// rather than squeezing its columns to a word each on phones.
const styles = cn(
  "text-base sm:text-lg break-words [&>*:first-child]:mt-0",
  "[&_p]:my-2",
  "[&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-lg sm:[&_h3]:text-xl [&_h3]:font-bold",
  "[&_h4]:mt-4 [&_h4]:mb-1.5 [&_h4]:font-semibold sm:[&_h4]:text-lg",
  "[&_h5]:mt-3 [&_h5]:mb-1 [&_h5]:font-semibold [&_h6]:mt-2 [&_h6]:font-semibold",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_li]:my-0.5 [&_li_ul]:my-0.5 [&_li_ol]:my-0.5",
  "[&_.overflow-x-auto]:my-3",
  "[&_table]:border-collapse [&_table]:text-sm sm:[&_table]:text-base",
  "[&_th]:min-w-28 [&_th]:border [&_th]:border-input [&_th]:bg-accent [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:align-top",
  "[&_td]:min-w-28 [&_td]:border [&_td]:border-input [&_td]:px-2 [&_td]:py-1 [&_td]:align-top",
  "[&_a]:text-brand [&_a]:underline",
  "[&_code]:rounded [&_code]:bg-accent [&_code]:px-1 [&_code]:text-[0.9em]",
  "[&_hr]:my-4 [&_hr]:border-input",
  "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-input [&_blockquote]:pl-3 [&_blockquote]:italic",
)

// Loaded with next/dynamic from Explanation, so only key holders download it
const ExplanationMarkdown = ({ text }: { text: string }) => (
  <div className={styles}>
    <Markdown {...markdownOptions}>{keepComparisons(text)}</Markdown>
  </div>
)

export default ExplanationMarkdown
