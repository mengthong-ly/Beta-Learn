import { EMOJI_RE } from "./emoji.ts"

export type Item = { id: string; icon?: string; label: string }
export type TreeNode = Item & { children: TreeNode[] }
export type Shape =
  | { kind: "flow"; items: Item[] }
  | { kind: "list"; items: Item[] }
  | { kind: "values"; items: Item[] }
  | { kind: "bind"; pairs: { name: Item; value: Item }[] }
  | { kind: "tree"; root: TreeNode }
export type Frame = { shapes: Shape[]; caption?: string }

export class DiagramError extends Error {}

const LEAD = new RegExp(`^(${EMOJI_RE.source})\\s*`, "u")

function item(text: string): Item {
  const t = text.trim()
  const icon = t.match(LEAD)?.[1]
  const label = icon ? t.slice(t.match(LEAD)![0].length) : t
  return icon ? { id: label || icon, icon, label } : { id: label, label }
}

/** Splits on `sep`, but not inside "double quotes". */
function split(s: string, sep: string): string[] {
  const out: string[] = []
  let cur = ""
  let quoted = false
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '"') quoted = !quoted
    if (!quoted && s.startsWith(sep, i)) {
      out.push(cur)
      cur = ""
      i += sep.length - 1
    } else cur += s[i]
  }
  return [...out, cur].map((x) => x.trim()).filter(Boolean)
}

/** Same label twice in one shape: the second becomes "label#2" so animations can tell them apart. */
function unique<T extends Item>(items: T[]): T[] {
  const seen = new Map<string, number>()
  return items.map((it) => {
    const n = (seen.get(it.id) ?? 0) + 1
    seen.set(it.id, n)
    return n > 1 ? { ...it, id: `${it.id}#${n}` } : it
  })
}

function parseFrame(lines: string[], first: number): Frame {
  const frame: Frame = { shapes: [] }
  for (let i = 0; i < lines.length; i++) {
    const at = `line ${first + i}`
    if (!lines[i].trim()) continue
    const m = lines[i].match(/^(\w+):\s*(.*)$/)
    if (!m) throw new DiagramError(`${at}: expected flow:, list:, values:, bind:, tree: or caption:`)
    const [, kind, rest] = m
    if (kind === "caption") frame.caption = rest
    else if (kind === "flow" || kind === "list" || kind === "values")
      frame.shapes.push({ kind, items: unique(split(rest, kind === "flow" ? "->" : ",").map(item)) })
    else if (kind === "bind")
      frame.shapes.push({
        kind,
        pairs: split(rest, "|").map((p) => {
          const [name, ...value] = split(p, "=")
          if (!value.length) throw new DiagramError(`${at}: bind needs name = value`)
          return { name: item(name), value: item(p.slice(p.indexOf("=") + 1)) }
        }),
      })
    else if (kind === "tree") {
      const root: TreeNode = { ...item(rest), children: [] }
      const stack: { indent: number; node: TreeNode }[] = [{ indent: -1, node: root }]
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) {
        const line = lines[++i]
        const indent = line.length - line.trimStart().length
        while (stack.at(-1)!.indent >= indent) stack.pop()
        const node: TreeNode = { ...item(line), children: [] }
        stack.at(-1)!.node.children.push(node)
        stack.push({ indent, node })
      }
      frame.shapes.push({ kind, root })
    } else throw new DiagramError(`${at}: unknown "${kind}:"; expected flow, list, values, bind, tree or caption`)
  }
  if (!frame.shapes.length) throw new DiagramError(`line ${first}: a frame needs at least one shape`)
  return frame
}

const FRAME_BREAK = /^---\s*$/

export function parseDiagram(src: string): Frame {
  const lines = src.replace(/\n$/, "").split("\n")
  if (lines.some((l) => FRAME_BREAK.test(l)))
    throw new DiagramError("--- splits frames: use a scene fence for an animation")
  return parseFrame(lines, 1)
}

export function parseScene(src: string): Frame[] {
  const lines = src.replace(/\n$/, "").split("\n")
  const frames: Frame[] = []
  let start = 0
  for (let i = 0; i <= lines.length; i++)
    if (i === lines.length || FRAME_BREAK.test(lines[i])) {
      frames.push(parseFrame(lines.slice(start, i), start + 1))
      start = i + 1
    }
  if (frames.length < 2) throw new DiagramError("a scene needs at least 2 frames separated by ---")
  return frames
}
