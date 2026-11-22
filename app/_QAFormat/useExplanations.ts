import { useCallback, useEffect, useState } from "react"
import type { Quiz } from "./types"
import { MAX_INFO, MAX_KEYS } from "@/lib/explanations"
import { storedKey, takeKeyFromUrl } from "./explanationKey"

type Role = "author" | "reader"
type ReadResponse = { role?: unknown, explanations?: Record<string, string> }

const API = "/api/explanations"

const headers = (key: string) => ({ Authorization: `Bearer ${key}`, "Content-Type": "application/json" })

// Private explanations for this paper, fetched only when this device holds a
// key: a keyless visitor hashes nothing and sends no request. Any failure
// just means no explanations; the stored key is never cleared here, so a
// brief misconfiguration on the server can't log devices out.
export default function useExplanations(enabled: boolean, data: Quiz, keyAt: (i: number) => string) {
  const [role, setRole] = useState<Role | null>(null)
  const [texts, setTexts] = useState<Record<string, string>>({})

  useEffect(() => {
    // Before reading the key: this effect runs before the layout's capture
    takeKeyFromUrl()
    const key = storedKey()
    if (!enabled || !key) return

    const controller = new AbortController()
    const keys = [...new Set(data.map((_, i) => keyAt(i)))]
    const chunks: string[][] = []
    for (let i = 0; i < keys.length; i += MAX_KEYS) chunks.push(keys.slice(i, i + MAX_KEYS))

    Promise.all(chunks.map(async chunk => {
      const res = await fetch(API, {
        method: "POST",
        headers: headers(key),
        body: JSON.stringify({ keys: chunk }),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`explanations ${res.status}`)
      return await res.json() as ReadResponse
    }))
      .then(results => {
        const r = results[0]?.role
        if (r !== "author" && r !== "reader") return
        setRole(r)
        setTexts(Object.assign({}, ...results.map(res => res.explanations ?? {})))
      })
      .catch(() => {})

    return () => controller.abort()
  }, [enabled, data, keyAt])

  // Only hashes once a key holder's role is known
  const text = (i: number): string | undefined => (role ? texts[keyAt(i)] : undefined)

  // Resolves true once the server has stored it; local state only changes then
  const save = useCallback(async (i: number, value: string): Promise<boolean> => {
    const key = storedKey()
    if (!key) return false
    const k = keyAt(i)
    try {
      const res = await fetch(API, {
        method: "PUT",
        headers: headers(key),
        body: JSON.stringify({ key: k, text: value, info: data[i].info.slice(0, MAX_INFO) }),
      })
      if (!res.ok) return false
    } catch {
      return false
    }
    const trimmed = value.trim()
    setTexts(prev => {
      const next = { ...prev }
      if (trimmed) next[k] = trimmed
      else delete next[k]
      return next
    })
    return true
  }, [data, keyAt])

  return { role, text, save }
}
