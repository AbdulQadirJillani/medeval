// Human-readable labels for quiz paths, e.g.
// "/PastPapers/2nd-year/renal-2/2024" → ["2nd Year", "Renal 2", "2024"]
export function labelParts(path: string): string[] {
  const segs = path.split("/").filter(Boolean)
  if (segs[0] === "PastPapers") segs.shift()
  else if (segs[0] === "SystemReview") segs[0] = "System Review"
  return segs.map(s => s
    .split("-")
    .map(w => (w === "and" ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" "))
}

export function paperLabel(path: string): string {
  return labelParts(path).join(" · ")
}
