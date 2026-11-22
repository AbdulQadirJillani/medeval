"use client"

import { useEffect } from "react"
import { takeKeyFromUrl } from "@/app/_QAFormat/explanationKey"

// Picks up ?key= on pages without a quiz. Quiz pages also call takeKeyFromUrl
// themselves, because their effects run before this layout-level one.
export default function ExplainKeyCapture() {
  useEffect(() => {
    takeKeyFromUrl()
  }, [])
  return null
}
