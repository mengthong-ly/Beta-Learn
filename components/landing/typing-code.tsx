"use client"

import { useEffect, useState } from "react"
import { CheckIcon } from "lucide-react"

/**
 * The hero's editor, in three beats: it types a snippet out once per page load,
 * runs it, then the run turns into a passing check — the shape every lesson
 * has. Highlighting is a hand-written token list; a fixed three-line snippet
 * does not earn a tokenizer. The window is dark in both themes on purpose.
 */
const TOKENS: [text: string, className: string][] = [
  ["name", "text-sky-300"],
  [" = ", ""],
  ['"you"', "text-emerald-300"],
  ["\n", ""],
  ["for", "text-violet-300"],
  [" i ", ""],
  ["in", "text-violet-300"],
  [" ", ""],
  ["range", "text-amber-300"],
  ["(3):", ""],
  ["\n    ", ""],
  ["print", "text-amber-300"],
  ["(", ""],
  ['f"hello, {name}"', "text-emerald-300"],
  [")", ""],
]

const CODE = TOKENS.map(([t]) => t).join("")

// Character index each token starts at, computed once so render stays pure.
let cursor = 0
const STARTS = TOKENS.map(([t]) => {
  const start = cursor
  cursor += t.length
  return start
})
const OUTPUT = ["hello, you", "hello, you", "hello, you"]

// A person types unevenly: a beat at the end of a line, a hitch before punctuation.
function delay(ch: string) {
  if (ch === "\n") return 300
  if (`=:()"{}`.includes(ch)) return 85
  return 30 + Math.random() * 55
}

export function TypingCode() {
  const [typed, setTyped] = useState(0)
  const [ran, setRan] = useState(false)
  const [checked, setChecked] = useState(false)
  const done = typed >= CODE.length

  // Reduced motion jumps to the finished snippet instead of typing it slower.
  useEffect(() => {
    if (done) return
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    const id = setTimeout(
      () => setTyped((n) => (reduced ? CODE.length : n + 1)),
      reduced ? 0 : delay(CODE[typed])
    )
    return () => clearTimeout(id)
  }, [typed, done])

  useEffect(() => {
    if (!done || ran) return
    const id = setTimeout(() => setRan(true), 550)
    return () => clearTimeout(id)
  }, [done, ran])

  // The third beat: the output it just printed is what the lesson checks for.
  useEffect(() => {
    if (!ran || checked) return
    const id = setTimeout(() => setChecked(true), 900)
    return () => clearTimeout(id)
  }, [ran, checked])

  return (
    <div
      data-checked={checked || undefined}
      className="w-full overflow-hidden rounded-t-xl border border-b-0 border-white/10 bg-[#0b1511] text-left shadow-[0_-8px_60px_-12px_rgb(0_0_0/0.45)] transition-colors duration-700 ease-glide motion-reduce:transition-none sm:rounded-t-2xl data-checked:border-emerald-400/40"
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-xs text-white/40">main.py</span>
        <span
          className={`ml-auto font-mono text-[11px] transition-colors duration-300 ${ran ? "text-emerald-400" : "text-white/30"}`}
        >
          {ran ? "ran in your browser" : "typing…"}
        </span>
      </div>

      <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] leading-relaxed text-white/85 sm:px-6 sm:text-sm">
        <code>
          {TOKENS.map(([text, className], i) => (
            <span key={i} className={className}>
              {text.slice(0, Math.max(0, typed - STARTS[i]))}
            </span>
          ))}
          <span
            aria-hidden
            className="caret ml-px inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-emerald-400"
          />
        </code>
      </pre>

      <div
        data-checked={checked || undefined}
        className="border-t border-white/10 px-4 py-3 font-mono text-[13px] transition-colors duration-700 ease-glide motion-reduce:transition-none sm:px-6 data-checked:border-emerald-400/30"
      >
        {ran ? (
          OUTPUT.map((line, i) => (
            <div
              key={i}
              className="animate-in text-white/70 duration-300 fill-mode-both fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
              style={{ animationDelay: `${i * 110}ms` }}
            >
              {line}
            </div>
          ))
        ) : (
          <div className="text-white/25">output</div>
        )}

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-glide motion-reduce:transition-none ${checked ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
        >
          <div className="overflow-hidden">
            <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-emerald-400">
              <CheckIcon className="size-3.5 shrink-0" strokeWidth={3} />
              <span className="text-[12px]">
                Check passed — printed three times
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
