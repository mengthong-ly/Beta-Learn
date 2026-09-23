import { LOCAL_COURSES, runLocal, toolStatus, type LocalCourse } from "@/lib/local-runner"

import { cors, preflight, refuse } from "./guard"

export const dynamic = "force-dynamic"

export const OPTIONS = preflight

/** Which toolchains are installed. */
export async function GET(request: Request) {
  return refuse(request) ?? Response.json(await toolStatus(), { headers: cors(request) })
}

/** Runs one lesson's code: { course, code, check? } → LocalResult. */
export async function POST(request: Request) {
  const refused = refuse(request)
  if (refused) return refused
  const body = await request.json().catch(() => null)
  const course = body?.course as LocalCourse
  if (
    !LOCAL_COURSES.includes(course) ||
    typeof body.code !== "string" ||
    body.code.length > 100_000 ||
    (body.check !== undefined && typeof body.check !== "string")
  )
    return Response.json({ error: "bad request" }, { status: 400, headers: cors(request) })
  return Response.json(
    await runLocal(course, body.code, body.check, { signal: request.signal }),
    { headers: cors(request) }
  )
}
