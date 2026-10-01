import assert from "node:assert/strict"
import { test } from "node:test"

import { rehypeEmoji } from "./rehype-emoji.ts"

type H = { tagName?: string; value?: string; properties?: Record<string, unknown>; children: H[] }
type Tree = { children: H[] }

const p = (...children: object[]) => ({ type: "root", children: [{ type: "element", tagName: "p", children }] })
const run = (tree: object, has: (code: string) => boolean = () => true) => (rehypeEmoji(has)()(tree as never), tree as Tree)

test("swaps prose emoji for a 3D icon image whose alt is the emoji", () => {
  const tree = run(p({ type: "text", value: "💡 Tip" }))
  const [img, rest] = tree.children[0].children
  assert.equal(img.tagName, "img")
  assert.equal(img.properties?.src, "/emoji/1f4a1.webp")
  assert.equal(img.properties?.alt, "💡")
  assert.deepEqual(rest, { type: "text", value: " Tip" })
})

test("leaves emoji in code alone", () => {
  const code = { type: "element", tagName: "code", children: [{ type: "text", value: "💡" }] }
  const tree = run(p(code))
  assert.deepEqual(tree.children[0].children[0].children, [{ type: "text", value: "💡" }])
})

test("keeps emoji without an icon as text", () => {
  const tree = run(p({ type: "text", value: "a 🦄 b" }), () => false)
  assert.deepEqual(tree.children[0].children, [{ type: "text", value: "a 🦄 b" }])
})
