import { createElement } from "react"
import type { Components, Options } from "react-markdown"
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"

// Built without JSX so node --test can render it. react-markdown escapes raw
// HTML by default (no rehype-raw), so nothing typed can inject markup.

// react-markdown passes its syntax-tree node to custom components; keep it
// off the DOM element
function withoutNode<P extends { node?: unknown }>(props: P): Omit<P, "node"> {
  const rest = { ...props }
  delete rest.node
  return rest
}

const components: Components = {
  // Two levels down: the box already has its own "Explanation" title
  h1: "h3",
  h2: "h4",
  h3: "h5",
  h4: "h6",
  h5: "h6",
  h6: "h6",
  // Wide tables scroll inside their box instead of widening the page
  table: props => createElement("div", { className: "overflow-x-auto" }, createElement("table", withoutNode(props))),
  a: props => createElement("a", { ...withoutNode(props), target: "_blank", rel: "noopener noreferrer" }),
}

export const markdownOptions: Pick<Options, "remarkPlugins" | "components"> = {
  remarkPlugins: [remarkGfm, remarkBreaks],
  components,
}

// Markdown reads ">" at the start of a line or list item as a quote, so
// "- >40 years" would lose its ">" and change the meaning. A ">" directly
// followed by a number (or "=") is a comparison: escape it. "> text" is
// still a quote.
export function keepComparisons(text: string): string {
  return text.replace(/^(\s*(?:[-*+]\s+|\d+[.)]\s+)?)>(?=[\d=])/gm, "$1\\>")
}
