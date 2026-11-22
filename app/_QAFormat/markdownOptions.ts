import { createElement } from "react"
import type { ComponentProps } from "react"
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

// Wide tables scroll inside their box instead of widening the page. The quiz's
// swipe-to-move listens for native touches on an ancestor, so a touch that
// starts on a table that can scroll is kept from it: otherwise dragging the
// table sideways changes the question instead of scrolling the table.
// A ref callback with a cleanup (React 19): stable, so it's attached once
function keepTouches(el: HTMLDivElement | null) {
  if (!el) return
  const keep = (e: TouchEvent) => {
    if (el.scrollWidth > el.clientWidth) e.stopPropagation()
  }
  const events = ["touchstart", "touchmove", "touchend"] as const
  events.forEach(type => el.addEventListener(type, keep, { passive: true }))
  return () => events.forEach(type => el.removeEventListener(type, keep))
}

function ScrollTable(props: ComponentProps<"table"> & { node?: unknown }) {
  return createElement("div", { ref: keepTouches, className: "overflow-x-auto" }, createElement("table", withoutNode(props)))
}

const components: Components = {
  // Two levels down: the box already has its own "Explanation" title
  h1: "h3",
  h2: "h4",
  h3: "h5",
  h4: "h6",
  h5: "h6",
  h6: "h6",
  table: ScrollTable,
  a: props => createElement("a", { ...withoutNode(props), target: "_blank", rel: "noopener noreferrer" }),
}

export const markdownOptions: Pick<Options, "remarkPlugins" | "components"> = {
  // singleTilde off: "~100" means approximately, so only ~~text~~ strikes through
  remarkPlugins: [[remarkGfm, { singleTilde: false }], remarkBreaks],
  components,
}

// Markdown reads ">" at the start of a line or list item as a quote, so
// "- >40 years" would lose its ">" and change the meaning. A ">" directly
// followed by a number (or "=") is a comparison: escape it. "> text" is
// still a quote.
export function keepComparisons(text: string): string {
  return text.replace(/^(\s*(?:[-*+]\s+|\d+[.)]\s+)?)>(?=[\d=])/gm, "$1\\>")
}
