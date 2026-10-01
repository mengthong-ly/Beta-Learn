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
