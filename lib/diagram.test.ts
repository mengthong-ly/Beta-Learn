import assert from "node:assert/strict"
import { test } from "node:test"

import { DiagramError, parseDiagram, parseScene } from "./diagram.ts"

test("flow items split on -> and take a leading emoji as their icon", () => {
  const f = parseDiagram("flow: 🫖 Fill kettle -> 🔥 Boil -> Pour")
  assert.deepEqual(f.shapes, [
    {
      kind: "flow",
      items: [
        { id: "Fill kettle", icon: "🫖", label: "Fill kettle" },
        { id: "Boil", icon: "🔥", label: "Boil" },
        { id: "Pour", label: "Pour" },
      ],
    },
  ])
})

test("quotes keep commas and pipes inside one item", () => {
  const f = parseDiagram('list: "Hello, Mia", "a | b", c')
  assert.deepEqual(f.shapes[0], {
    kind: "list",
    items: [
      { id: '"Hello, Mia"', label: '"Hello, Mia"' },
      { id: '"a | b"', label: '"a | b"' },
      { id: "c", label: "c" },
    ],
  })
})

test("bind pairs split on | and the first = ", () => {
  const f = parseDiagram('bind: 🏷️ x = 5 | ok = x == 5\ncaption: two names')
  assert.deepEqual(f, {
    caption: "two names",
    shapes: [
      {
        kind: "bind",
        pairs: [
          { name: { id: "x", icon: "🏷️", label: "x" }, value: { id: "5", label: "5" } },
          { name: { id: "ok", label: "ok" }, value: { id: "x == 5", label: "x == 5" } },
        ],
      },
    ],
  })
})

test("tree children nest by indentation", () => {
  const f = parseDiagram("tree: 🎉 Party\n  🍰 Food\n    Buy cake\n  Music")
  const root = (f.shapes[0] as { root: { label: string; children: { label: string; children: { label: string }[] }[] } }).root
  assert.equal(root.label, "Party")
  assert.deepEqual(root.children.map((c) => c.label), ["Food", "Music"])
  assert.deepEqual(root.children[0].children.map((c) => c.label), ["Buy cake"])
})

test("duplicate labels in one shape get unique ids", () => {
  const f = parseDiagram("list: a, a")
  assert.deepEqual((f.shapes[0] as { items: { id: string }[] }).items.map((i) => i.id), ["a", "a#2"])
})

test("a scene is frames separated by ---", () => {
  const frames = parseScene("bind: x = 5\ncaption: one\n---\nbind: x = 5\nvalues: 6\ncaption: two")
  assert.equal(frames.length, 2)
  assert.equal(frames[1].caption, "two")
  assert.equal(frames[1].shapes[1].kind, "values")
})

test("errors name the line", () => {
  assert.throws(() => parseDiagram("flow: a\nboxes: b"), (e) => e instanceof DiagramError && /line 2/.test(e.message))
  assert.throws(() => parseDiagram("bind: x"), /line 1: bind needs name = value/)
  assert.throws(() => parseScene("flow: a"), /at least 2 frames/)
  assert.throws(() => parseDiagram("flow: a\n---\nflow: b"), /use a scene fence/)
})
