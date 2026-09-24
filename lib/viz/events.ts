// The semantic event model: what a program did, one operation per step.
// The visualizer only ever sees these events, never source code, so any runtime
// (hand-written demos now, the Python tracer later) can drive the same world.

/** A value drawn as a card: anything the visualizer doesn't animate (dict, set, tuple, object, nan). */
export type Opaque = { repr: string; type: string }

export type Val = number | string | boolean | null | Opaque

/** A call argument: a value, or "the same list as the caller's variable `alias`". */
export type Arg = Val | { alias: string }

export type PipelineStage = "source" | "tokens" | "ast" | "bytecode" | "run"

export type VizEvent =
  /** create or rebind a variable; the previous value comes from state */
  | { type: "var.set"; name: string; value: Val }
  | { type: "array.create"; name: string; values: Val[] }
  /** append is an insert at len(list) */
  | { type: "array.insert"; name: string; index: number; value: Val }
  /** into: the variable that receives the removed value (x = list.pop(i)) */
  | { type: "array.remove"; name: string; index: number; into?: string }
  | { type: "array.set"; name: string; index: number; value: Val }
  | { type: "array.access"; name: string; index: number; into?: string }
  /** one pass of `for variable in array` */
  | { type: "loop.iter"; array: string; index: number; variable: string }
  | { type: "loop.end"; array: string }
  /** then/otherwise: the code each branch runs, shown on the branch outlets */
  | {
      type: "cond.eval"
      id: string
      expr: string
      result: boolean
      then: string
      otherwise: string
    }
  /** pushes a frame */
  | { type: "call"; fn: string; args: [string, Arg][] }
  /** pops a frame; the value lands in the caller */
  | { type: "return"; fn: string; value: Val }
  | { type: "pipeline.stage"; stage: PipelineStage; payload: string[] }
  | { type: "print"; text: string }
  /** bind name to the list another variable already refers to (b = a) */
  | { type: "ref.set"; name: string; to: string }
  | { type: "var.del"; name: string }
  /** the program stopped with an exception; text is the cleaned traceback */
  | { type: "error"; text: string }

export type Step = {
  event: VizEvent
  /** 1-based line in the demo code that caused this event */
  line: number
  /** one or two sentences: what the computer is doing right now */
  note: string
}

export type Demo = {
  id: string
  title: string
  summary: string
  code: string
  steps: Step[]
  reference: { label: string; href: string }
}

/** A value the way Python's repr() shows it inside a list: 'a', True, None. */
export function formatVal(v: Val): string {
  if (v === null) return "None"
  if (v === true) return "True"
  if (v === false) return "False"
  if (typeof v === "object") return v.repr
  if (typeof v === "string") return `'${v}'`
  return String(v)
}

export const isAlias = (a: Arg): a is { alias: string } =>
  typeof a === "object" && a !== null && "alias" in a

/** `n=3`, or `nums → data` for a list shared with the caller. */
export const argLabel = (name: string, a: Arg) =>
  isAlias(a) ? `${name} → ${a.alias}` : `${name}=${formatVal(a)}`
