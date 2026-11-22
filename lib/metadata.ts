import type { Metadata } from "next"
import { MODULE_ORDER } from "@/app/(PastPapers)/modules"
import { labelParts } from "./papers"

// Link-preview fields every page shares. Next merges metadata shallowly, so a
// page that sets openGraph replaces the layout's whole object; pages build
// theirs from this rather than losing the image and site name.
export const baseOpenGraph = {
  type: "website",
  locale: "en_US",
  siteName: "MedEval",
  images: [{ url: "/android-chrome-384x384.png", width: 384, height: 384, alt: "Logo" }],
} satisfies Metadata["openGraph"]

// `title` gets " | MedEval" from the layout's template; the preview title doesn't need it
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    openGraph: { ...baseOpenGraph, title, description, url: path },
  }
}

export function yearMetadata(annual: string): Metadata {
  const [year] = labelParts(annual)
  const modules = MODULE_ORDER[annual].map(m => labelParts(m)[0]).join(", ")
  return pageMetadata(
    `${year} Past Papers`,
    `Free ${year} MBBS past papers as interactive quizzes, by module: ${modules}.`,
    `/PastPapers/${annual}`,
  )
}
