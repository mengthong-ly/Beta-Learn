// Real output of every example and solution in the courses the website can't run, recorded by
// `npm run check:content -- --record` into content/<course>/outputs.json. Node only.
import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"

import type { Output } from "./lesson-parser.ts"

export const outputKey = (code: string) =>
  createHash("sha1").update(code.trim()).digest("hex").slice(0, 16)

const file = (course: string) => path.join(process.cwd(), "content", course, "outputs.json")

export const readOutputs = (course: string): Record<string, Output> =>
  existsSync(file(course)) ? JSON.parse(readFileSync(file(course), "utf8")) : {}

export const writeOutputs = (course: string, outputs: Record<string, Output>) =>
  writeFileSync(
    file(course),
    JSON.stringify(Object.fromEntries(Object.entries(outputs).sort()), null, 2) + "\n"
  )

/** A lesson's runnable examples: ```<lang> fences (```<lang>-snippet ones are fragments). */
export const examples = (body: string, lang: string) =>
  [...body.matchAll(new RegExp("```" + lang + "\\n([\\s\\S]*?)```", "g"))].map((m) => m[1])
