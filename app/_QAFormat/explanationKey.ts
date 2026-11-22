import { EXPLAIN_KEY_STORAGE, readKeyParam } from "@/lib/explanations"

// A ?key= link remembers its key on this device ("off" or empty forgets it),
// then drops the param from the address bar. null state, as with #q=/#k=, so
// Next syncs its stored URL. Safe to call more than once.
export function takeKeyFromUrl(): void {
  const param = readKeyParam(window.location.href)
  if (!param) return
  try {
    if (param.value === "" || param.value === "off") localStorage.removeItem(EXPLAIN_KEY_STORAGE)
    else localStorage.setItem(EXPLAIN_KEY_STORAGE, param.value)
  } catch {
    // Storage blocked: the key just isn't remembered
  }
  window.history.replaceState(null, "", param.cleaned)
}

export function storedKey(): string | null {
  try {
    return localStorage.getItem(EXPLAIN_KEY_STORAGE) || null
  } catch {
    return null
  }
}
