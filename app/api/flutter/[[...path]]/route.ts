import { readFile } from "node:fs/promises"
import path from "node:path"

import { RUNTIMES } from "@/lib/local-runner"

import { refuse } from "../../run/guard"

export const dynamic = "force-dynamic"

const WEB = path.join(RUNTIMES, "flutter/build/web")
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".json": "application/json",
  ".wasm": "application/wasm",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".frag": "application/octet-stream",
}

/** Serves the last `flutter build web` (built by the local runner) to the Preview tab. */
export async function GET(
  request: Request,
  { params }: RouteContext<"/api/flutter/[[...path]]">
) {
  // The iframe loads its own files, so it can't send our custom header; the host check still applies.
  const refused = refuse(request, false)
  if (refused) return refused
  const file = path.join(WEB, ...((await params).path ?? ["index.html"]))
  if (!file.startsWith(WEB + path.sep))
    return new Response("not found", { status: 404 })
  try {
    return new Response(await readFile(file), {
      headers: {
        "content-type": TYPES[path.extname(file)] ?? "application/octet-stream",
        "cache-control": "no-store",
      },
    })
  } catch {
    return new Response("not found", { status: 404 })
  }
}
