import { CACHE_IDS, caches, clean, requirements, type CacheId } from "@/lib/runner-status"

import { cors, preflight, refuse } from "../run/guard"

export const dynamic = "force-dynamic"

export const OPTIONS = preflight

const snapshot = async () => {
  const [req, c] = await Promise.all([requirements(), caches()])
  return { requirements: req, caches: c }
}

/** Toolchain versions per local course, and the caches runs leave behind. */
export async function GET(request: Request) {
  return refuse(request) ?? Response.json(await snapshot(), { headers: cors(request) })
}

/** Cleans one cache: { id } → a fresh snapshot, or { error }. */
export async function POST(request: Request) {
  const refused = refuse(request)
  if (refused) return refused
  const id = (await request.json().catch(() => null))?.id as CacheId
  if (!CACHE_IDS.includes(id)) return Response.json({ error: "bad request" }, { status: 400, headers: cors(request) })
  try {
    await clean(id)
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e), ...(await snapshot()) }, { status: 500, headers: cors(request) })
  }
  return Response.json(await snapshot(), { headers: cors(request) })
}
