import { EMOJI_RE, emojiCode } from "./emoji.ts"
import { EMOJI } from "./emoji-manifest.ts"

type Node = {
  type: string
  tagName?: string
  value?: string
  children?: Node[]
  properties?: Record<string, unknown>
}

const SKIP = new Set(["code", "pre"])

/** Rehype plugin: emoji in prose become their Fluent 3D icon (alt = the emoji, so copy and
 *  screen readers still get it). Code is left alone, and so is any emoji `has` doesn't know. */
export function rehypeEmoji(has: (code: string) => boolean) {
  const split = (text: string): Node[] => {
    const out: Node[] = []
    let last = 0
    for (const m of text.matchAll(EMOJI_RE)) {
      const code = emojiCode(m[0])
      if (!has(code)) continue
      if (m.index > last) out.push({ type: "text", value: text.slice(last, m.index) })
      out.push({
        type: "element",
        tagName: "img",
        properties: {
          src: `/emoji/${code}.webp`,
          alt: m[0],
          draggable: "false",
          className: ["inline-block", "size-[1.3em]", "align-[-0.28em]"],
        },
        children: [],
      })
      last = m.index + m[0].length
    }
    if (!out.length) return [{ type: "text", value: text }]
    if (last < text.length) out.push({ type: "text", value: text.slice(last) })
    return out
  }
  const walk = (n: Node) => {
    if (!n.children || SKIP.has(n.tagName ?? "")) return
    n.children = n.children.flatMap((c) => (c.type === "text" ? split(c.value ?? "") : (walk(c), [c])))
  }
  return () => (tree: Node) => walk(tree)
}

export const rehypeEmoji3d = rehypeEmoji((c) => EMOJI.has(c))
