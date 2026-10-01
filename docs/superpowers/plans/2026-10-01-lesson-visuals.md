# Lesson Visuals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show lessons visually: 3D emoji icons in prose, `diagram` fences that draw icon cards and arrows, and `scene` fences that animate step by step.

**Architecture:** Authors write plain markdown and real emoji. A build script vendors Fluent Emoji 3D WebPs into `public/emoji/` with a generated manifest. A rehype plugin swaps prose emoji for `<img>`. A tiny line parser (`lib/diagram.ts`) turns `diagram`/`scene` fences into frames. React components draw them with `motion` layout animations, and scenes reuse the existing `usePlayer` and `VizTimeline`.

**Tech Stack:** Next.js 16 / React 19.2, react-markdown and rehype, motion 13 (`layoutId`, `LayoutGroup`, `AnimatePresence`), Tailwind v4, and node `--test`.

**Spec:** `docs/superpowers/specs/2026-10-01-lesson-visuals-design.md`

## Global Constraints

- Icons come from `https://unpkg.com/@lobehub/fluent-emoji-3d@1.1.0/assets/<codepoints>.webp` (MIT). They are vendored to `public/emoji/<codepoints>.webp` and committed. No runtime CDN.
- `<codepoints>` is each code point of the emoji as typed, in lowercase hex, joined with `-`. For example `💡` → `1f4a1` and `⚠️` → `26a0-fe0f`.
- A character is an emoji only if it has `Emoji_Presentation`, or is `Extended_Pictographic` followed by U+FE0F. So `©`, `™` and `↔` stay text.
- Emoji inside `code` and `pre` are never replaced.
- Scenes in lessons use `VizTimeline keys={false}`, because `components/lesson-stepper.tsx` owns ←/→.
- No new npm dependencies.

## Review Focus

- **`©`, `™` and `↔` in prose:** they stay text and don't become images. Test in Task 1.
- **An emoji with no vendored icon:** it renders as the native emoji and never as a broken image. Tests in Task 3 (plugin) and Task 5 (component fallback).
- **The same label in two diagrams on one page, or on consecutive lesson steps:** it must not fly between them. Each `DiagramBody` scopes its `layoutId`s with its own `LayoutGroup id={useId()}`. Manual check in Task 8.
- **Pressing ← or → in a lesson that contains a scene:** this moves the lesson step and never jumps the scene. Achieved by `keys={false}`, checked manually in Task 8.
- **A label with a comma or a pipe inside quotes** (`"Hello, Mia"`): it stays one item. Test in Task 4.

---

### Task 1: Emoji matching (`lib/emoji.ts`)

**Files:**
- Create: `lib/emoji.ts`
- Test: `lib/emoji.test.ts`

**Interfaces:**
- Produces:
  - `EMOJI_RE: RegExp` (global, unicode)
  - `findEmoji(text: string): string[]`
  - `emojiCode(e: string): string`
  - `emojiSrc(e: string): string` (returns `"/emoji/<code>.webp"`)

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict"
import { test } from "node:test"

import { emojiCode, emojiSrc, findEmoji } from "./emoji.ts"

test("finds emoji, including ones with a variation selector", () => {
  assert.deepEqual(findEmoji("💡 Tip and ⚠️ Gotcha ☕"), ["💡", "⚠️", "☕"])
})

test("leaves text symbols alone unless they ask for emoji style", () => {
  assert.deepEqual(findEmoji("© 2026 ™ ↔ → ✓"), [])
  assert.deepEqual(findEmoji("©️"), ["©️"])
})

test("keeps ZWJ sequences and skin tones together", () => {
  assert.deepEqual(findEmoji("👩🏽‍💻!"), ["👩🏽‍💻"])
})

test("codes are lowercase hex code points joined by -", () => {
  assert.equal(emojiCode("💡"), "1f4a1")
  assert.equal(emojiCode("⚠️"), "26a0-fe0f")
  assert.equal(emojiSrc("💡"), "/emoji/1f4a1.webp")
})
```

- [ ] **Step 2: Run it.** `node --no-warnings --test lib/emoji.test.ts`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
/** One emoji: an emoji-style pictograph (plus optional skin tone), and any ZWJ-joined parts.
 *  Text-style symbols like © ™ ↔ only count when followed by U+FE0F. */
export const EMOJI_RE =
  /(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}️)[\u{1F3FB}-\u{1F3FF}]?(?:‍(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}️?)[\u{1F3FB}-\u{1F3FF}]?)*/gu

export const findEmoji = (text: string) => [...text.matchAll(EMOJI_RE)].map((m) => m[0])

/** "⚠️" → "26a0-fe0f": the file name of its 3D icon in public/emoji. */
export const emojiCode = (e: string) =>
  [...e].map((c) => c.codePointAt(0)!.toString(16)).join("-")

export const emojiSrc = (e: string) => `/emoji/${emojiCode(e)}.webp`
```

- [ ] **Step 4: Run it.** Expected: PASS (4 tests).
- [ ] **Step 5: Commit** `lib/emoji.ts lib/emoji.test.ts` with the message "Match emoji and name their 3D icons".

### Task 2: Vendor the icons (`scripts/build-emoji.ts`)

**Files:**
- Create: `scripts/build-emoji.ts`, `lib/emoji-manifest.ts` (generated), `public/emoji/*.webp` (downloaded)
- Modify: `package.json` (`"emoji": "node --no-warnings scripts/build-emoji.ts"`)

**Interfaces:**
- Consumes: `findEmoji` and `emojiCode` (Task 1)
- Produces: `EMOJI: ReadonlySet<string>` from `lib/emoji-manifest.ts`, holding the codes that have a file in `public/emoji/`

- [ ] **Step 1: Write the script**

```ts
// Vendors Fluent Emoji 3D (MIT, via @lobehub/fluent-emoji-3d) for every emoji used in content/.
// Run after adding a new emoji: npm run emoji. Files are committed; builds never download.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"

import { emojiCode, findEmoji } from "../lib/emoji.ts"

const CDN = "https://unpkg.com/@lobehub/fluent-emoji-3d@1.1.0/assets/"
const content = new URL("../content/", import.meta.url)
const out = new URL("../public/emoji/", import.meta.url)
mkdirSync(out, { recursive: true })

const used = new Set<string>()
for (const f of readdirSync(content, { recursive: true }) as string[])
  if (f.endsWith(".md"))
    for (const e of findEmoji(readFileSync(new URL(f, content), "utf8"))) used.add(e)

// The package names some files with U+FE0F and some without: try both.
const candidates = (code: string) => [
  code,
  code.replace(/-fe0f/g, ""),
  code.includes("-") ? code : `${code}-fe0f`,
]

const missing: string[] = []
for (const e of used) {
  const code = emojiCode(e)
  const file = new URL(`${code}.webp`, out)
  if (existsSync(file)) continue
  let ok = false
  for (const c of new Set(candidates(code))) {
    const res = await fetch(CDN + c + ".webp")
    if (!res.ok) continue
    writeFileSync(file, Buffer.from(await res.arrayBuffer()))
    console.log(`+ ${e} ${code}`)
    ok = true
    break
  }
  if (!ok) missing.push(`${e} (${code})`)
}

const codes = readdirSync(out).filter((f) => f.endsWith(".webp")).map((f) => f.slice(0, -5)).sort()
writeFileSync(
  new URL("../lib/emoji-manifest.ts", import.meta.url),
  `// Generated by scripts/build-emoji.ts: the emoji with a 3D icon in public/emoji.\n` +
    `export const EMOJI: ReadonlySet<string> = new Set(${JSON.stringify(codes, null, 2)})\n`
)
console.log(`${codes.length} icons in public/emoji`)
if (missing.length) console.log(`No 3D icon for: ${missing.join(", ")} (shown as plain emoji)`)
```

- [ ] **Step 2: Add the npm script** `"emoji": "node --no-warnings scripts/build-emoji.ts"` next to `check:runner` in `package.json`.
- [ ] **Step 3: Run it.** `npm run emoji`. Expected: one `+` line per emoji, then about 12 icons in `public/emoji` (the content uses about 11 distinct emoji today). It also writes `lib/emoji-manifest.ts`. Check with `ls public/emoji` and `head lib/emoji-manifest.ts`.
- [ ] **Step 4: Run it again.** Expected: no downloads, and the same count.
- [ ] **Step 5: Commit** the script, `package.json`, `lib/emoji-manifest.ts` and `public/emoji` with the message "Vendor Fluent Emoji 3D icons for content emoji".

### Task 3: 3D emoji in lesson prose (`lib/rehype-emoji.ts`)

**Files:**
- Create: `lib/rehype-emoji.ts`
- Test: `lib/rehype-emoji.test.ts`
- Modify:
  - `components/v1/doc.tsx`: `toText` reads the `img` alt, the `h2` id uses `toText(node)`, and Markdown gets `rehypePlugins`
  - `components/lesson-stepper.tsx`: Markdown gets `rehypePlugins`

**Interfaces:**
- Consumes: `EMOJI_RE` and `emojiCode` (Task 1); `EMOJI` (Task 2)
- Produces:
  - `rehypeEmoji(has: (code: string) => boolean)`, a rehype plugin factory
  - `rehypeEmoji3d`, i.e. `rehypeEmoji((c) => EMOJI.has(c))`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict"
import { test } from "node:test"

import { rehypeEmoji } from "./rehype-emoji.ts"

const p = (...children: object[]) => ({ type: "root", children: [{ type: "element", tagName: "p", children }] })
const run = (tree: object, has = (_: string) => true) => (rehypeEmoji(has)()(tree as never), tree)

test("swaps prose emoji for a 3D icon image whose alt is the emoji", () => {
  const tree = run(p({ type: "text", value: "💡 Tip" })) as any
  const [img, rest] = tree.children[0].children
  assert.equal(img.tagName, "img")
  assert.equal(img.properties.src, "/emoji/1f4a1.webp")
  assert.equal(img.properties.alt, "💡")
  assert.deepEqual(rest, { type: "text", value: " Tip" })
})

test("leaves emoji in code alone", () => {
  const code = { type: "element", tagName: "code", children: [{ type: "text", value: "💡" }] }
  const tree = run(p(code)) as any
  assert.deepEqual(tree.children[0].children[0].children, [{ type: "text", value: "💡" }])
})

test("keeps emoji without an icon as text", () => {
  const tree = run(p({ type: "text", value: "a 🦄 b" }), () => false) as any
  assert.deepEqual(tree.children[0].children, [{ type: "text", value: "a 🦄 b" }])
})
```

- [ ] **Step 2: Run it.** `node --no-warnings --test lib/rehype-emoji.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
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
```

- [ ] **Step 4: Run it.** Expected: PASS (3 tests).

- [ ] **Step 5: Wire it into both layouts.** In `components/v1/doc.tsx`:
  - Extend `HastNode` with `tagName?: string` and `properties?: { className?: string[]; alt?: string }`.
  - Replace `toText` with:
    ```ts
    const toText = (n?: HastNode): string =>
      (n?.value ?? "") +
      (n?.tagName === "img" ? (n.properties?.alt ?? "") : "") +
      (n?.children ?? []).map(toText).join("")
    ```
  - Change the `h2` renderer to `h2: ({ node, children }) => (<h2 id={slug(toText(node as HastNode))} …>{children}</h2>)`.
  - Add `rehypePlugins={[rehypeEmoji3d]}` to the `<Markdown>` in `Doc`.
  
  In `components/lesson-stepper.tsx`, add the same `rehypePlugins` prop to its `<Markdown>`. Import with `import { rehypeEmoji3d } from "@/lib/rehype-emoji"`.

- [ ] **Step 6: Verify in the browser.** Open `/python/lesson/print#step-3` and check that the 💡 Tip callout shows a 3D bulb in a sky tint. Then open `/python/guide/how-python-runs` and check that the 🔍 collapsible still collapses.
- [ ] **Step 7: Commit** with the message "Show prose emoji as Fluent 3D icons".

### Task 4: Diagram and scene parser (`lib/diagram.ts`)

**Files:**
- Create: `lib/diagram.ts`
- Test: `lib/diagram.test.ts`

**Interfaces:**
- Consumes: `EMOJI_RE` (Task 1)
- Produces:
  ```ts
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
  export function parseDiagram(src: string): Frame
  export function parseScene(src: string): Frame[]
  ```

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run it.** `node --no-warnings --test lib/diagram.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
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
```

Note on the bind name: `split(p, "=")` only checks that an `=` exists outside quotes. The value is everything after the first `=`, which keeps `x == 5` whole.

- [ ] **Step 4: Run it.** Expected: PASS (7 tests). If the "first =" case fails because `p.indexOf("=")` lands inside quotes, replace it with an index-outside-quotes helper built like `split`.
- [ ] **Step 5: Commit** with the message "Parse diagram and scene fences".

### Task 5: Drawing diagrams (`components/emoji.tsx`, `components/diagram.tsx`)

**Files:**
- Create: `components/emoji.tsx`, `components/diagram.tsx`
- Modify: `components/v1/doc.tsx` (the `pre` renderer handles `diagram`)

**Interfaces:**
- Consumes: `Frame`, `Item`, `TreeNode`, `parseDiagram` and `DiagramError` (Task 4); `emojiCode` (Task 1); `EMOJI` (Task 2)
- Produces:
  - `Emoji({ char, className, label })`, where `label` is the alt text and defaults to `""` (decorative)
  - `DiagramBody({ frame })`, which draws one frame with layout animation scoped to itself
  - `DiagramBlock({ src })`, which parses and draws, falling back to a plain `<pre>` on a parse error

- [ ] **Step 1: `components/emoji.tsx`**

```tsx
import { emojiCode } from "@/lib/emoji"
import { EMOJI } from "@/lib/emoji-manifest"
import { cn } from "@/lib/utils"

/** A Fluent 3D icon for `char`, or the plain emoji when there's no vendored icon. */
export function Emoji({ char, className, label = "" }: { char: string; className?: string; label?: string }) {
  const code = emojiCode(char)
  if (!EMOJI.has(code))
    return <span role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={!label || undefined} className={cn("leading-none", className)}>{char}</span>
  return <img src={`/emoji/${code}.webp`} alt={label} draggable={false} className={cn("select-none", className)} />
}
```

- [ ] **Step 2: `components/diagram.tsx`**

```tsx
"use client"

import { useId } from "react"
import { ArrowRightIcon } from "lucide-react"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"

import { Emoji } from "@/components/emoji"
import { DiagramError, parseDiagram, type Frame, type Item, type Shape, type TreeNode } from "@/lib/diagram"
import { cn } from "@/lib/utils"

const pop = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { type: "spring", bounce: 0.15, duration: 0.45 },
} as const

/** One icon card. `k` is its layoutId: the same k in the next scene frame animates into place. */
function Card({ item, k, dim, row }: { item: Item; k: string; dim?: boolean; row?: boolean }) {
  return (
    <motion.div
      layout
      layoutId={k}
      {...pop}
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-xs",
        row ? "flex-row" : "min-w-20 flex-col text-center",
        dim && "border-dashed bg-transparent text-muted-foreground"
      )}
    >
      {item.icon && <Emoji char={item.icon} label={item.label ? "" : item.icon} className={row ? "size-6" : "size-10"} />}
      {item.label && <span className="[overflow-wrap:anywhere]">{item.label}</span>}
    </motion.div>
  )
}

const Arrow = ({ down }: { down?: boolean }) => (
  <ArrowRightIcon aria-hidden className={cn("size-4 shrink-0 text-muted-foreground", down && "rotate-90 sm:rotate-0")} />
)

function Tree({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  return (
    <li className="flex flex-col gap-2">
      <Card item={node} k={`tree:${depth}:${node.id}`} row />
      {node.children.length > 0 && (
        <ul className="ml-4 flex flex-col gap-2 border-l pl-4">
          {node.children.map((c) => <Tree key={c.id} node={c} depth={depth + 1} />)}
        </ul>
      )}
    </li>
  )
}

function ShapeView({ shape }: { shape: Shape }) {
  switch (shape.kind) {
    case "flow":
      return (
        <ol className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          <AnimatePresence initial={false} mode="popLayout">
            {shape.items.map((it, n) => (
              <motion.li layout key={it.id} className="flex flex-col items-center gap-2 sm:flex-row">
                {n > 0 && <Arrow down />}
                <Card item={it} k={`flow:${it.id}`} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )
    case "list":
      return (
        <ol className="flex flex-wrap justify-center gap-1.5">
          <AnimatePresence initial={false} mode="popLayout">
            {shape.items.map((it, n) => (
              <motion.li layout key={it.id} className="flex flex-col items-center gap-1">
                <Card item={it} k={`list:${it.id}`} />
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{n}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )
    case "values":
      return (
        <ul className="flex flex-wrap justify-center gap-2" aria-label="values">
          <AnimatePresence initial={false} mode="popLayout">
            {shape.items.map((it) => <li key={it.id}><Card item={it} k={`v:${it.id}`} dim /></li>)}
          </AnimatePresence>
        </ul>
      )
    case "bind":
      return (
        <ul className="flex flex-col items-center gap-2">
          <AnimatePresence initial={false} mode="popLayout">
            {shape.pairs.map(({ name, value }) => (
              <motion.li layout key={name.id} className="flex items-center gap-2">
                <motion.span layout layoutId={`n:${name.id}`} className="flex items-center gap-1.5 rounded-full bg-tint-lavender px-3 py-1 font-mono text-sm text-tag-purple-fg">
                  {name.icon && <Emoji char={name.icon} className="size-5" />}
                  {name.label}
                </motion.span>
                <Arrow />
                <Card item={value} k={`v:${value.id}`} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )
    case "tree":
      return <ul className="flex flex-col gap-2"><Tree node={shape.root} /></ul>
  }
}

/** Draws one frame. The LayoutGroup id keeps layoutIds from flying between different diagrams. */
export function DiagramBody({ frame }: { frame: Frame }) {
  const id = useId()
  return (
    <LayoutGroup id={id}>
      <div className="flex flex-col items-center gap-5">
        {frame.shapes.map((s, n) => <ShapeView key={`${n}-${s.kind}`} shape={s} />)}
      </div>
    </LayoutGroup>
  )
}

/** A ```diagram fence. A parse error shows the source as text (check:content reports it). */
export function DiagramBlock({ src }: { src: string }) {
  let frame: Frame
  try {
    frame = parseDiagram(src)
  } catch (e) {
    if (!(e instanceof DiagramError)) throw e
    return <pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-[13px]">{src}</pre>
  }
  return (
    <figure className="my-4 rounded-lg bg-muted/50 px-4 py-5">
      <DiagramBody frame={frame} />
      {frame.caption && <figcaption className="mt-4 text-center text-sm text-muted-foreground">{frame.caption}</figcaption>}
    </figure>
  )
}
```

- [ ] **Step 3: Hook it into `pre`.** In `components/v1/doc.tsx`, inside the `pre` renderer right after `lang` is computed, add:
  ```tsx
  if (lang === "diagram") return <DiagramBlock src={code} />
  ```
  Then import `DiagramBlock` from `@/components/diagram`.

- [ ] **Step 4: Verify in the browser.** Temporarily add each of these fences to a scratch copy of `content/fundamentals/lessons/01-what-is-a-program.md` (revert afterwards), restart the dev server, and check that they render at desktop and at 375px:
  - `flow: 🫖 Fill kettle -> 🔥 Boil -> ☕ Pour`
  - `bind: 🏷️ age = 12 | 🏷️ name = "Mia"`
  - `list: 🍎 apple, 🍌 banana`
  - a three-level tree
  
  Also check:
  - On mobile the flow stacks vertically with down arrows.
  - There is no horizontal scroll.
  - Dark mode reads well.
- [ ] **Step 5: Run** `npm run typecheck` and lint the changed files. **Commit** with the message "Draw diagram fences as 3D icon cards".

### Task 6: Animated scenes (`components/scene-player.tsx`)

**Files:**
- Create: `components/scene-player.tsx`
- Modify: `components/v1/doc.tsx` (the `pre` renderer handles `scene`)

**Interfaces:**
- Consumes: `parseScene` and `DiagramError` (Task 4); `DiagramBody` (Task 5); `usePlayer` (`lib/viz/use-player.ts`); `VizTimeline` (`components/viz/viz-timeline.tsx`)
- Produces: `ScenePlayer({ src })`

- [ ] **Step 1: Implement**

```tsx
"use client"

import { useMemo } from "react"
import { MotionConfig } from "motion/react"

import { DiagramBody } from "@/components/diagram"
import { VizTimeline } from "@/components/viz/viz-timeline"
import { DiagramError, parseScene, type Frame } from "@/lib/diagram"
import { usePlayer } from "@/lib/viz/use-player"

/** A ```scene fence: diagram frames played step by step. Lessons own ←/→, so keys are off. */
export function ScenePlayer({ src }: { src: string }) {
  const frames = useMemo<Frame[] | null>(() => {
    try {
      return parseScene(src)
    } catch (e) {
      if (e instanceof DiagramError) return null
      throw e
    }
  }, [src])
  if (!frames) return <pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-[13px]">{src}</pre>
  return <Scene frames={frames} />
}

function Scene({ frames }: { frames: Frame[] }) {
  const player = usePlayer(frames.length - 1)
  const frame = frames[player.index]
  return (
    <MotionConfig reducedMotion="user">
      <figure className="my-4 flex flex-col gap-4 rounded-lg bg-muted/50 px-4 py-5">
        <div className="min-h-32">
          <DiagramBody frame={frame} />
        </div>
        <p aria-live="polite" className="min-h-11 rounded-md bg-background px-3 py-2 text-sm text-foreground">
          {frame.caption}
        </p>
        <VizTimeline player={player} keys={false} />
      </figure>
    </MotionConfig>
  )
}
```

- [ ] **Step 2: Hook it into `pre`.** Next to the diagram line, add `if (lang === "scene") return <ScenePlayer src={code} />`.
- [ ] **Step 3: Verify in the browser** with a scratch scene in a lesson:
  ```
  bind: 🏷️ x = 5
  caption: x points at 5
  ---
  bind: 🏷️ x = 5
  values: 6
  caption: x + 1 makes a new value, 6
  ---
  bind: 🏷️ x = 6
  values: 5
  caption: = moves the tag. Now x points at 6
  ```
  Check:
  - Step makes 6 appear, and the next step flies 6 into x's row.
  - Play runs through to the end.
  - ←/→ moves the lesson step, not the scene.
  - With `prefers-reduced-motion` emulated, frames swap without moving.
  
  Revert the scratch content.
- [ ] **Step 4: Commit** with the message "Play scene fences as animated diagrams".

### Task 7: Checks and docs

**Files:**
- Modify: `scripts/check-content.ts`, `docs/content-authoring.md`, `docs/adding-a-lesson.md`

**Interfaces:**
- Consumes: `parseDiagram` and `parseScene` (Task 4); `findEmoji` and `emojiCode` (Task 1); `EMOJI` (Task 2)

- [ ] **Step 1: Add to the per-file loop in `scripts/check-content.ts`.** It goes right after the `const problems: string[] = []` line and applies to both lessons and guides:

```ts
      for (const [, kind, src] of l.body.matchAll(/```(diagram|scene)\n([\s\S]*?)```/g)) {
        try {
          if (kind === "scene") parseScene(src)
          else parseDiagram(src)
        } catch (e) {
          problems.push(`${kind}: ${(e as Error).message}`)
        }
      }
      const prose = l.body.replace(/```(?!diagram|scene)[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "")
      for (const e of new Set(findEmoji(prose)))
        if (!EMOJI.has(emojiCode(e))) problems.push(`no 3D icon for ${e}: run npm run emoji`)
```

  Imports:
  ```ts
  import { parseDiagram, parseScene } from "../lib/diagram.ts"
  import { emojiCode, findEmoji } from "../lib/emoji.ts"
  import { EMOJI } from "../lib/emoji-manifest.ts"
  ```

- [ ] **Step 2: Confirm it catches problems.** Put `flow: a\nboxes: b` in a scratch diagram fence and run `node --no-warnings scripts/check-content.ts fundamentals`. Expected: `✗ … diagram: line 2: unknown "boxes:"`. Revert.
- [ ] **Step 3: Docs.** In `docs/content-authoring.md`, add a "Diagrams and scenes" section after "Callouts". It shows the five shapes, `caption:`, and quoting, plus a scene example. It should also say:
  - Emoji in prose render as Fluent 3D icons.
  - Run `npm run emoji` after adding a new emoji, then commit `public/emoji` and `lib/emoji-manifest.ts`.
  - Use `diagram` and `scene` instead of `text` for anything that is a picture. Keep `text` for terminal sessions and program output.
  
  In `docs/adding-a-lesson.md` under 3c, add one line pointing to that section.
- [ ] **Step 4: Run the full checks.** `npm test`, `npm run typecheck`, and `node --no-warnings scripts/check-content.ts` (all courses). Expected: everything passes.
- [ ] **Step 5: Commit** with the message "Check diagram fences and emoji icons; document them".

### Task 8: Phase B, converting existing text diagrams (all courses)

**Files:**
- Modify: the diagram-like ` ```text ` fences in `content/*/lessons/*.md` and `content/*/guide/*.md`. There are about 37, mostly in each course's `guide/01-*.md`, plus Fundamentals lessons 09, 10, 12, 18 and 22, react guide 07, and react lesson 11.

- [ ] **Step 1: List the candidates.** Run `grep -rn -A15 '^```text' content` and keep only the fences that draw flows, name→value maps, lists, trees or timelines. **Leave alone** terminal sessions, program output, error messages, git command output and side-by-side code comparisons.
- [ ] **Step 2: Convert each one** to a ` ```diagram ` fence using the shapes in `docs/content-authoring.md`:
  - **Flow and box-and-arrow diagrams** become `flow:`. Long loops can be a `flow:` plus a `caption:` that explains the loop-back.
  - **Variable maps** become `bind:`.
  - **Indexed rows** become `list:`.
  - **Indented or `├──` trees** become `tree:`.
  - **Timelines** become `flow:`.
  
  Add one fitting emoji per item where it helps (🖥️ CPU, 💾 memory, 📄 file, 🌐 browser, 🗄️ database, ⚙️ compiler…). Keep the labels' words. If the content leans on a picture that the shapes can't express (for example a 2D flowchart with a decision diamond), use a `scene` that walks through it, or keep `text`.
- [ ] **Step 3: Run** `npm run emoji` (it fetches the new emoji), then `node --no-warnings scripts/check-content.ts`. Expected: all pass.
- [ ] **Step 4: Verify in the browser.** Open each changed page at desktop and at 375px: Fundamentals 09, 10, 12, 18 and 22, `/react/lesson/your-ui-as-a-tree`, and one guide 01 per course. Also check that two diagrams on the same step don't animate into each other.
- [ ] **Step 5: Commit** with the message "Draw lesson diagrams with 3D icon cards".

### Task 9: Phase C, scenes for key ideas

**Files:**
- Modify: Fundamentals lessons 03 (how code runs), 10 (tracing), 12 (variables, using the `x = x + 1` scene from Task 6), 15 (decisions), 16 (loops), 17 (functions), 18 (lists), 20 (debugging) and 22 (git). Also each course's `guide/01-*.md` "how X runs" flow, as a scene.

- [ ] **Step 1: Write the scenes.** For each of these ideas, add one ` ```scene ` of 3–6 frames next to the prose it illustrates, each frame with a one-sentence caption. Lesson prose can then drop sentences the scene now shows. Facts are unchanged, so no new research is needed, and every frame must match the lesson's own text and examples.
  - **Loops:** a `list:` of iterations, with a `bind: i = …` tag moving along it.
  - **Functions:** `flow: 📥 arguments -> ⚙️ greet -> 📤 return value`, with values flying from frame to frame.
  - **Lists:** `append` makes a new card appear at the end, and an index lookup lights up one card.
  - **Git:** a `flow:` of commits growing one snapshot per frame.
  - **How code runs:** `📄 source -> ⚙️ interpreter -> 🖥️ CPU -> 📺 output`, with the active stage shown by moving a `🔵` marker item along the flow.
- [ ] **Step 2: Run** `npm run emoji` and `node --no-warnings scripts/check-content.ts`. Expected: all pass.
- [ ] **Step 3: Verify in the browser.** Play each scene once at desktop and at 375px, and check the captions read correctly.
- [ ] **Step 4: Commit** with the message "Animate key ideas as scenes".
