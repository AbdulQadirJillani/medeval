import { parseReadBody, parseWriteBody } from "@/lib/explanations"
import { roleFor } from "./auth"

// Private explanations: readable with either key, writable with the write key.
// Keyed by request auth, so nothing here may be cached.
export const dynamic = "force-dynamic"

const HASH = "explanations"

type Config = { url: string, token: string, writeKey: string, readKey: string }

// Read per request so a changed env var (a rotated key) applies on redeploy,
// and so tests can set it. Vercel's Upstash integration sets the KV_ names.
function config(): Config | null {
  const env = process.env
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN
  const writeKey = env.EXPLAIN_WRITE_KEY
  const readKey = env.EXPLAIN_READ_KEY
  if (!url || !token || !writeKey || !readKey) return null
  return { url, token, writeKey, readKey }
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } })
}

// One command over Upstash's REST API; throws on any failure
async function redis(cfg: Config, command: string[]): Promise<unknown> {
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
    // Under the client's 10s save timeout, so a hung store answers 502
    signal: AbortSignal.timeout(8000),
  })
  const data = await res.json().catch(() => null) as { result?: unknown, error?: unknown } | null
  if (!res.ok || !data || data.error !== undefined) throw new Error(`Upstash ${res.status}`)
  return data.result
}

async function body(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    return undefined
  }
}

function storedText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  try {
    const text = (JSON.parse(value) as { text?: unknown })?.text
    return typeof text === "string" ? text : undefined
  } catch {
    return undefined
  }
}

export async function POST(req: Request): Promise<Response> {
  const cfg = config()
  if (!cfg) return json({ error: "Not configured" }, 503)
  const role = roleFor(req.headers.get("authorization"), cfg.writeKey, cfg.readKey)
  if (!role) return json({ error: "Unauthorized" }, 401)
  const keys = parseReadBody(await body(req))
  if (!keys) return json({ error: "Bad request" }, 400)
  if (keys.length === 0) return json({ role, explanations: {} })

  let values: unknown[]
  try {
    const result = await redis(cfg, ["HMGET", HASH, ...keys])
    values = Array.isArray(result) ? result : []
  } catch {
    return json({ error: "Store unavailable" }, 502)
  }
  const explanations: Record<string, string> = {}
  keys.forEach((k, i) => {
    const text = storedText(values[i])
    if (text !== undefined) explanations[k] = text
  })
  return json({ role, explanations })
}

export async function PUT(req: Request): Promise<Response> {
  const cfg = config()
  if (!cfg) return json({ error: "Not configured" }, 503)
  const role = roleFor(req.headers.get("authorization"), cfg.writeKey, cfg.readKey)
  if (!role) return json({ error: "Unauthorized" }, 401)
  if (role !== "author") return json({ error: "Forbidden" }, 403)
  const input = parseWriteBody(await body(req))
  if (!input) return json({ error: "Bad request" }, 400)

  const { key, text, info } = input
  try {
    if (text === "") await redis(cfg, ["HDEL", HASH, key])
    else await redis(cfg, ["HSET", HASH, key, JSON.stringify({ text, info, updatedAt: new Date().toISOString() })])
  } catch {
    return json({ error: "Store unavailable" }, 502)
  }
  return json({ ok: true })
}
