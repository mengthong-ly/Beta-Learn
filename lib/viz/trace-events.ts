// Real Python runs → VizEvents. The tracer (__trace__ in public/inspect.py) records a
// snapshot at every line; this turns each change between two snapshots into one event,
// so a learner's own code steps one semantic operation at a time, like the demos.

import {
  argLabel,
  formatVal,
  type Arg,
  type Step,
  type Val,
  type VizEvent,
} from "./events.ts"
import { apply, EMPTY, listId, type Program } from "./program.ts"

/** A traced value: plain values and cards as in events.ts, or a list by id(). */
export type TValue = Val | { ref: string }

export type Snap = {
  line: number
  event: "line" | "call" | "return" | "exception"
  /** outermost (<module>) first */
  frames: { fn: string; vars: [string, TValue][] }[]
  /** id(list) as hex → its items (nested lists arrive as cards) */
  lists: Record<string, { items: Val[]; more: number }>
  /** stdout characters written so far */
  out: number
  ret?: TValue
}

export type Trace = { snaps: Snap[]; truncated: boolean; stdout: string }

/** Which language the trace came from: it decides how notes and lists are worded. */
export type Lang = "python" | "cpp"

type Remove = Extract<VizEvent, { type: "array.remove" }>
type SetVar = Extract<VizEvent, { type: "var.set" }>

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const isRef = (v: unknown): v is { ref: string } =>
  typeof v === "object" && v !== null && "ref" in v

/** A list the event model can't point at (a returned list, say) becomes a card. */
function asVal(v: TValue, s: Snap, lang: Lang): Val {
  if (!isRef(v)) return v
  const items = (s.lists[v.ref]?.items ?? []).map(formatVal).join(", ")
  return lang === "cpp"
    ? { repr: `{${items}}`, type: "vector" }
    : { repr: `[${items}]`, type: "list" }
}

const isVoid = (v: Val) =>
  typeof v === "object" && v !== null && v.type === "void"

/** A name the code in frame d can use for list `id`: its own variables first, then globals it doesn't shadow. */
function holder(s: Snap, id: string, d: number): string | undefined {
  const own = s.frames[d]?.vars ?? []
  const hit = own.find(([, v]) => isRef(v) && v.ref === id)
  if (hit) return hit[0]
  if (d === 0) return undefined
  const names = new Set(own.map(([n]) => n))
  return s.frames[0].vars.find(
    ([n, v]) => isRef(v) && v.ref === id && !names.has(n)
  )?.[0]
}

/** The fewest insert/remove/set events that turn list a into list b (an LCS script, or in-place sets when that's no longer). */
export function listOps(name: string, a: Val[], b: Val[]): VizEvent[] {
  const n = a.length
  const m = b.length
  const eq = (i: number, j: number) => same(a[i], b[j])
  // ponytail: O(n·m) LCS per list per step, fine at the 50-item cap.
  const L = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0)
  )
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      L[i][j] = eq(i, j)
        ? L[i + 1][j + 1] + 1
        : Math.max(L[i + 1][j], L[i][j + 1])

  const ops: VizEvent[] = []
  let k = 0 // index in the list as the ops so far have left it
  let dels = 0
  let ins: Val[] = []
  const flush = () => {
    const sets = Math.min(dels, ins.length)
    for (let s = 0; s < sets; s++)
      ops.push({ type: "array.set", name, index: k++, value: ins[s] })
    for (let d = sets; d < dels; d++)
      ops.push({ type: "array.remove", name, index: k })
    for (const value of ins.slice(sets))
      ops.push({ type: "array.insert", name, index: k++, value })
    dels = 0
    ins = []
  }
  for (let i = 0, j = 0; i < n || j < m;) {
    if (i < n && j < m && eq(i, j)) {
      flush()
      i++
      j++
      k++
    } else if (j < m && (i === n || L[i][j + 1] >= L[i + 1][j]))
      ins.push(b[j++])
    else {
      dels++
      i++
    }
  }
  flush()
  // Same length and no more in-place changes than the script: it was an update (a[i] = x, a swap).
  if (n === m) {
    const sets = a.flatMap((v, i): VizEvent[] =>
      same(v, b[i]) ? [] : [{ type: "array.set", name, index: i, value: b[i] }]
    )
    if (sets.length <= ops.length) return sets
  }
  return ops
}

/** One or two plain sentences about an event, from the state just before it. */
export function noteFor(
  ev: VizEvent,
  p: Program,
  lang: Lang = "python"
): string {
  const cpp = lang === "cpp"
  const items = (name: string) => {
    try {
      return p.lists[listId(p, name)]
    } catch {
      return []
    }
  }
  switch (ev.type) {
    case "var.set": {
      const scope = p.frames.length
        ? p.frames[p.frames.length - 1].locals
        : p.globals
      const old = scope[ev.name]
      if (old && "val" in old)
        return `${ev.name} changes from ${formatVal(old.val)} to ${formatVal(ev.value)}.`
      return cpp
        ? `A new variable ${ev.name} is declared, holding ${formatVal(ev.value)}.`
        : `A new name ${ev.name} appears, bound to ${formatVal(ev.value)}.`
    }
    case "array.create":
      return cpp
        ? `A new vector ${ev.name} is created, holding {${ev.values.map(formatVal).join(", ")}}.`
        : `A new list [${ev.values.map(formatVal).join(", ")}] is created, and ${ev.name} refers to it.`
    case "array.insert":
      return ev.index === items(ev.name).length
        ? `${formatVal(ev.value)} is added to the end of ${ev.name}, at index ${ev.index}.`
        : `${formatVal(ev.value)} is inserted at index ${ev.index} of ${ev.name}; the items after it shift right.`
    case "array.remove": {
      const gone = items(ev.name)[ev.index]
      const into = ev.into ? ` It goes into ${ev.into}.` : ""
      return `${gone === undefined ? "An item" : formatVal(gone)} is removed from index ${ev.index} of ${ev.name}; the items after it shift left.${into}`
    }
    case "array.set": {
      const old = items(ev.name)[ev.index]
      return `${ev.name}[${ev.index}] changes from ${old === undefined ? "?" : formatVal(old)} to ${formatVal(ev.value)}.`
    }
    case "ref.set":
      return `${ev.name} now refers to the same ${cpp ? "vector" : "list"} as ${ev.to}: a change through either name changes both.`
    case "var.del":
      return cpp
        ? `${ev.name} goes out of scope.`
        : `del removes the name ${ev.name}.`
    case "call":
      return `${ev.fn}(${ev.args.map(([k, a]) => argLabel(k, a)).join(", ")}) is called: a new frame opens for its variables.`
    case "return":
      return isVoid(ev.value)
        ? `${ev.fn} finishes, and its frame is removed.`
        : `${ev.fn} returns ${formatVal(ev.value)}, and its frame is removed.`
    case "print":
      return `${cpp ? "cout" : "print()"} writes ${JSON.stringify(ev.text)} to the output.`
    case "error":
      return "The program stopped with an error."
    default:
      return ""
  }
}

/** One step per change between consecutive snapshots, each tagged with the line that caused it. */
export function toSteps(
  trace: Trace,
  error?: { text: string; line?: number },
  lang: Lang = "python"
): Step[] {
  const { snaps, stdout } = trace
  const steps: Step[] = []
  let p: Program = EMPTY
  // ponytail: a change the event model can't express is skipped rather than drawn wrong.
  const emit = (event: VizEvent, line: number) => {
    try {
      const next = apply(p, event)
      steps.push({ event, line, note: noteFor(event, p, lang) })
      p = next
    } catch {
      /* skipped */
    }
  }

  let printed = 0
  const prints = (upTo: number, line: number, final = false) => {
    const end = final ? upTo : stdout.lastIndexOf("\n", upTo - 1) + 1
    if (end <= printed) return
    const text = stdout.slice(printed, end).replace(/\n$/, "")
    printed = end
    for (const t of text.split("\n")) emit({ type: "print", text: t }, line)
  }

  /** Changes inside frame d, which both snapshots share: list edits first, then names. */
  const changes = (a: Snap, b: Snap, d: number, line: number) => {
    const listEvents: VizEvent[] = []
    for (const [id, now] of Object.entries(b.lists)) {
      if (!a.lists[id]) continue
      const name = holder(a, id, d)
      if (!name) continue
      let cur: Val[]
      try {
        cur = p.lists[listId(p, name)]
      } catch {
        continue
      }
      listEvents.push(...listOps(name, cur, now.items))
    }

    const nameEvents: VizEvent[] = []
    const before = new Map(a.frames[d].vars)
    const after = b.frames[d].vars
    const known = new Map<string, string>() // list id → a name bound to it earlier in this step
    for (const [name, v] of after) {
      const old = before.get(name)
      if (isRef(v)) {
        if (isRef(old) && old.ref === v.ref) continue
        const other = known.get(v.ref) ?? holder(a, v.ref, d)
        nameEvents.push(
          other && other !== name
            ? { type: "ref.set", name, to: other }
            : {
                type: "array.create",
                name,
                values: b.lists[v.ref]?.items ?? [],
              }
        )
        known.set(v.ref, name)
      } else if (old === undefined || isRef(old) || !same(old, v))
        nameEvents.push({ type: "var.set", name, value: v })
    }
    for (const name of before.keys())
      if (!after.some(([n]) => n === name))
        nameEvents.push({ type: "var.del", name })

    // x = a.pop(i): one removal and one new value equal to it read as a single "pop into x".
    const rm = listEvents.filter((e): e is Remove => e.type === "array.remove")
    const sets = nameEvents.filter((e): e is SetVar => e.type === "var.set")
    if (rm.length === 1 && sets.length === 1) {
      let q = p
      let gone: Val | undefined
      try {
        for (const ev of listEvents) {
          if (ev === rm[0]) gone = q.lists[listId(q, rm[0].name)][rm[0].index]
          q = apply(q, ev)
        }
      } catch {
        gone = undefined
      }
      if (gone !== undefined && same(gone, sets[0].value)) {
        rm[0].into = sets[0].name
        nameEvents.splice(nameEvents.indexOf(sets[0]), 1)
      }
    }
    for (const ev of [...listEvents, ...nameEvents]) emit(ev, line)
  }

  const lastLine: number[] = [] // the latest line each frame depth was on
  // The snapshot each frame depth was last diffed against. A caller's variables can change while
  // a callee runs (a method changing *this, a dict passed in), so it's diffed from there.
  const base: Snap[] = []
  snaps.forEach((b, k) => {
    const a = snaps[k - 1]
    // How many frames a and b share. A return snapshot's own frame is always gone, even when the
    // next call lands at the same depth (f() + g(), or fib(n - 1) + fib(n - 2)).
    let keep = 0
    if (a) {
      const la = a.frames.length
      const lb = b.frames.length
      keep = Math.min(la - (a.event === "return" ? 1 : 0), lb)
      while (keep > 0 && a.frames[keep - 1].fn !== b.frames[keep - 1].fn) keep--
      const lineIn = (d: number) => lastLine[d] ?? a.line
      // 1. calls that ended, innermost first
      for (let d = la - 1; d >= keep; d--) {
        const value =
          d === la - 1 && a.event === "return" && a.ret !== undefined
            ? asVal(a.ret, a, lang)
            : null
        emit({ type: "return", fn: a.frames[d].fn, value }, lineIn(d))
      }
      // 2. the frame both snapshots share
      const d = keep - 1
      if (d >= 0) changes(base[d] ?? a, b, d, lineIn(d))
      // 3. output written meanwhile: after a return, by the caller
      prints(b.out, lineIn(a.event === "return" ? keep - 1 : la - 1))
      // 4. calls that started, outermost first
      for (let d = keep; d < lb; d++) {
        const args = b.frames[d].vars.map(([n, v]): [string, Arg] => {
          if (!isRef(v)) return [n, v]
          const alias = holder(b, v.ref, d - 1)
          return [n, alias ? { alias } : asVal(v, b, lang)]
        })
        emit({ type: "call", fn: b.frames[d].fn, args }, lineIn(d - 1))
      }
    }
    lastLine.length = keep
    lastLine[b.frames.length - 1] = b.line
    base.length = keep && keep - 1
    for (let d = Math.max(keep - 1, 0); d < b.frames.length; d++) base[d] = b
  })
  prints(stdout.length, lastLine.at(-1) ?? 1, true)
  if (error)
    emit(
      { type: "error", text: error.text },
      error.line ?? lastLine.at(-1) ?? 1
    )
  return steps
}
