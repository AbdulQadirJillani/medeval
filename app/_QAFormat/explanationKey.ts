import { EXPLAIN_KEY_STORAGE } from "@/lib/explanations"

// Set from ?key= links by the inline script in layout.tsx
export function storedKey(): string | null {
  try {
    return localStorage.getItem(EXPLAIN_KEY_STORAGE) || null
  } catch {
    return null
  }
}
