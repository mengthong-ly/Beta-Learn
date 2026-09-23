/**
 * The local runner executes code on this machine, so every request must pass all of these
 * (docs/adr/0001-local-runner.md):
 * - LOCAL_RUNNER=1, set by `npm run dev` (which also binds to 127.0.0.1)
 * - a loopback Host header, so a DNS-rebinding page can't reach us under another name
 * - our custom header, which forces a CORS preflight that we never approve, so no other site can call us
 */
export function refuse(request: Request, needHeader = true): Response | undefined {
  const deny = (error: string) => Response.json({ error }, { status: 403 })
  if (process.env.LOCAL_RUNNER !== "1") return deny("disabled")
  const host = (request.headers.get("host") ?? "").replace(/:\d+$/, "")
  if (!["localhost", "127.0.0.1", "[::1]"].includes(host)) return deny("forbidden host")
  if (needHeader && request.headers.get("x-thonglearn-run") !== "1") return deny("missing header")
}
