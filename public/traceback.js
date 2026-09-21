// Plain JS on purpose: imported by the unbundled module worker (public/python.worker.js)
// and by scripts/check-content.ts, so both share one implementation.

/**
 * Pyodide tracebacks include its own internal frames (_pyodide/_base.py …).
 * Keep only the learner's frames ("<exec>") and report the last line number.
 * @param {string} raw
 * @returns {{ text: string, line?: number }}
 */
export function cleanTraceback(raw) {
  const lines = raw.trimEnd().split("\n")
  const out = []
  let line
  for (let i = 0; i < lines.length; i++) {
    const frame = lines[i].match(/^\s+File "([^"]+)", line (\d+)/)
    if (!frame) {
      out.push(lines[i])
      continue
    }
    if (frame[1] === "<exec>") {
      line = Number(frame[2])
      out.push(lines[i].replace(/"<exec>"/, '"main.py"'))
    } else {
      // skip the internal frame and its indented source line(s)
      while (i + 1 < lines.length && /^\s{4,}/.test(lines[i + 1])) i++
    }
  }
  return { text: out.join("\n"), line }
}
