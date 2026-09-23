/**
 * The local runner executes code on this machine, so every request must pass all of these
 * (docs/adr/0001-local-runner.md):
 * - LOCAL_RUNNER=1, set by `npm run dev` (which also binds to 127.0.0.1)
 * - a loopback Host header, so a DNS-rebinding page can't reach us under another name
 * - our custom header, which forces a CORS preflight that we only approve for RUNNER_ORIGINS,
 *   so no other site can call us. It's empty unless the learner opts in with `npm run dev:hosted`.
 */
const ORIGINS = (process.env.RUNNER_ORIGINS ?? "").split(",").filter(Boolean)

/** CORS headers for an allowed hosted origin; empty for same-origin or anyone else. */
export function cors(request: Request): Record<string, string> {
  const origin = request.headers.get("origin")
  if (!origin || !ORIGINS.includes(origin)) return {}
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST",
    "access-control-allow-headers": "content-type, x-thonglearn-run",
    "access-control-allow-private-network": "true",
    vary: "origin",
  }
}

export function refuse(request: Request, needHeader = true): Response | undefined {
  const deny = (error: string) => Response.json({ error }, { status: 403, headers: cors(request) })
  if (process.env.LOCAL_RUNNER !== "1") return deny("disabled")
  const host = (request.headers.get("host") ?? "").replace(/:\d+$/, "")
  if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) return deny("forbidden host")
  if (needHeader && request.headers.get("x-thonglearn-run") !== "1") return deny("missing header")
}

/** Answers the preflight: approved only for RUNNER_ORIGINS, since cors() is empty otherwise. */
export function preflight(request: Request) {
  return refuse(request, false) ?? new Response(null, { status: 204, headers: cors(request) })
}
