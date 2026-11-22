import { createHash, timingSafeEqual } from "node:crypto"

// Digests first so timingSafeEqual gets equal-length buffers and the compare
// doesn't leak the key's length
const digest = (s: string) => createHash("sha256").update(s).digest()

function same(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b))
}

export function roleFor(authorization: string | null, writeKey: string, readKey: string): "author" | "reader" | null {
  const match = authorization?.match(/^Bearer (.+)$/)
  if (!match) return null
  const token = match[1]
  if (same(token, writeKey)) return "author"
  if (same(token, readKey)) return "reader"
  return null
}
