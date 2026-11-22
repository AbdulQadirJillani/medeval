// Shared by the explanations API route and the quiz client: no fs, no window,
// no env access, so it runs on both sides (and under node --test).

export const EXPLAIN_KEY_STORAGE = "explain-key"
export const MAX_TEXT = 5000
export const MAX_KEYS = 2000
export const MAX_INFO = 200

// questionKey() output: a base36 hash, at most 11 characters today
export function isQuestionKey(s: unknown): s is string {
  return typeof s === "string" && /^[0-9a-z]{1,12}$/.test(s)
}

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v)
}

export function parseReadBody(body: unknown): string[] | null {
  if (!isObject(body) || !Array.isArray(body.keys)) return null
  const keys = body.keys
  if (keys.length > MAX_KEYS || !keys.every(isQuestionKey)) return null
  return keys
}

export function parseWriteBody(body: unknown): { key: string, text: string, info: string } | null {
  if (!isObject(body)) return null
  const { key, text, info } = body
  if (!isQuestionKey(key) || typeof text !== "string" || typeof info !== "string") return null
  const trimmed = text.trim()
  if (trimmed.length > MAX_TEXT || info.length > MAX_INFO) return null
  return { key, text: trimmed, info }
}
