// "Your code should…": the messages of a check's expect() calls, for learners who can't run it.
// Works across the courses' check syntaxes: expect(cond, "msg") and flutter_test's reason: '…'.

const QUOTES = `"'\``

/** Index just past the ")" that closes the "(" at `open`, skipping string literals. */
function closing(src: string, open: number) {
  let depth = 0
  for (let i = open; i < src.length; i++) {
    const c = src[i]
    if (QUOTES.includes(c)) {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === "\\") i++
    } else if (c === "(") depth++
    else if (c === ")" && --depth === 0) return i + 1
  }
  return src.length
}

/** The top-level arguments of a call's argument list. */
function args(inner: string) {
  const out: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i]
    if (QUOTES.includes(c)) {
      for (i++; i < inner.length && inner[i] !== c; i++) if (inner[i] === "\\") i++
    } else if ("([{".includes(c)) depth++
    else if (")]}".includes(c)) depth--
    else if (c === "," && depth === 0) {
      out.push(inner.slice(start, i))
      start = i + 1
    }
  }
  return [...out, inner.slice(start)].map((a) => a.trim())
}

export function checkItems(check: string | undefined): string[] {
  if (!check) return []
  const items: string[] = []
  for (const m of check.matchAll(/\bexpect\s*\(/g)) {
    const open = m.index + m[0].length - 1
    const last = args(check.slice(open + 1, closing(check, open) - 1)).at(-1) ?? ""
    const literal = last.replace(/^reason:\s*/, "").match(/^(["'`])([\s\S]*)\1$/)
    if (!literal) continue
    const text = literal[2]
      .replace(/\\(["'`\\])/g, "$1")
      .split(/,?\s+got\b/)[0]
      .trim()
    if (/\$\{|\$[A-Za-z_]/.test(text)) continue // a template over test data, not a requirement
    if (text.length > 2 && !items.includes(text)) items.push(text)
  }
  return items
}
