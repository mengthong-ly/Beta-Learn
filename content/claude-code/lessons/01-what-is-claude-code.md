---
title: What is Claude Code?
section: 1 · Claude Code Basics
---

**Claude Code** is an agentic coding tool. You describe a task in plain words, and it reads your codebase, edits files, runs commands and checks its own work. A chat assistant only answers you. Claude Code acts on your project.

It runs in several places. The agentic loop is the same in all of them. What changes is where the code runs and how you talk to it:

| Surface | What it's like |
| --- | --- |
| Terminal (CLI) | The full-featured tool. Run `claude` inside a project folder |
| IDE extensions | VS Code, Cursor and JetBrains, with inline diffs and plan review |
| Desktop app | A standalone app with visual diffs and several sessions side by side |
| Web | [claude.ai/code](https://claude.ai/code): long tasks on repos you don't have locally, run in the cloud |

```bash
cd your-project
claude
```

## The agentic loop

When you give Claude a task, it works in three phases: **gather context**, **take action**, and **verify results**. It repeats them until the task is done. A question about the code may only need the first phase. A bug fix cycles through all three several times.

The loop has two parts: the **model**, which reasons, and the **tools**, which act. Claude Code is the layer around the model (the *agentic harness*). It provides the tools and manages what the model sees. Every tool result goes back to the model and shapes its next step.

Here is the loop for "fix the failing tests", as a script of steps:

```typescript
type Phase = "gather" | "act" | "verify"
const steps: [Phase, string][] = [
  ["verify", "Run the test suite to see what's failing"],
  ["gather", "Read the error output"],
  ["gather", "Search for the relevant source files"],
  ["gather", "Read those files"],
  ["act", "Edit the files to fix the issue"],
  ["verify", "Run the tests again"],
]
for (const [phase, step] of steps) console.log(`${phase.padEnd(6)} ${step}`)
```

You're part of the loop too. Press `Esc` to stop Claude, or type a correction while it works, and it adjusts before its next step.

## Built-in tools

Tools are what make Claude Code agentic. Without them, the model can only reply with text. The built-in tools fall into five groups:

| Group | Examples | What they do |
| --- | --- | --- |
| File operations | `Read`, `Edit`, `Write` | Read, change and create files |
| Search | `Grep`, `Glob` | Find files by pattern, search content |
| Execution | `Bash` | Run shell commands, tests, git |
| Web | `WebFetch`, `WebSearch` | Fetch docs, look up errors |
| Code intelligence | `LSP` | Type errors, go to definition, find references |

There are also tools for orchestration, such as `Agent` (starts a subagent) and `AskUserQuestion`. The tools reference lists which ones need your permission. Reading and searching don't. Editing, running commands and fetching from the web do:

```typescript
const needsPermission: Record<string, boolean> = {
  Read: false, Grep: false, Glob: false,
  Edit: true, Write: true, Bash: true, WebFetch: true, WebSearch: true,
}
const safe = Object.keys(needsPermission).filter((t) => !needsPermission[t])
console.log("Runs without asking:", safe.join(", "))
```

## Permission modes

A **permission mode** decides what Claude may do without asking you. Press `Shift+Tab` in the CLI to cycle through the modes:

| Mode | Runs without asking | Best for |
| --- | --- | --- |
| `default` (Manual) | Reads only | Reviewing every action yourself |
| `acceptEdits` | Reads, file edits, common filesystem commands like `mkdir` and `mv` | Iterating on code you're reviewing |
| `plan` | Reads (Claude proposes a plan and doesn't edit your source) | Exploring before changing anything |
| `auto` | Everything, with background safety checks by a classifier | Long tasks, fewer prompts |
| `dontAsk` | Reads and pre-approved tools; anything else is denied | Locked-down CI and scripts |
| `bypassPermissions` | Everything | Isolated containers and VMs only |

> 💡 **Tip:** file edits can be undone. Claude snapshots a file before editing it, and pressing `Esc` twice lets you rewind. Actions on remote systems (a database, a deployment) can't be undone, so control those with permissions.

## Challenge

In the real tool, the model answers with `content` blocks. A `tool_use` block asks the harness to run a tool. `stop_reason: "tool_use"` means "run it and send me the result". `"end_turn"` means the model is done. The harness sends each result back as a `tool_result` block. Here the model is a **scripted fake**: it returns canned replies, so you don't need an API key. The real call looks like this:

```typescript-snippet
import Anthropic from "@anthropic-ai/sdk"
const client = new Anthropic()
const reply = await client.messages.create({ model: "claude-opus-5", max_tokens: 1024, tools, messages })
```

> 🎯 **Challenge:** Finish `runLoop`. Call `model(messages)`, push its reply onto `messages`, and run every `tool_use` block with `tools[name](input)`. Send the results back as a `user` message of `tool_result` blocks, record each tool name in `used`, and stop at `end_turn`. Return the final text and `used`.

```typescript starter
type Block =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, string> }
  | { type: "tool_result"; tool_use_id: string; content: string }
type Message = { role: "user" | "assistant"; content: string | Block[] }
type Reply = { content: Block[]; stop_reason: "tool_use" | "end_turn" }
type Model = (messages: Message[]) => Reply
type Tools = Record<string, (input: Record<string, string>) => string>

export function runLoop(model: Model, tools: Tools, prompt: string) {
  const messages: Message[] = [{ role: "user", content: prompt }]
  const used: string[] = []
  // your loop here
  return { text: "", used }
}

// A scripted stand-in for the real model: one canned reply per call.
export function fakeModel(): Model {
  const script: Reply[] = [
    { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t1", name: "Bash", input: { command: "npm test" } }] },
    { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t2", name: "Read", input: { file_path: "sum.ts" } }] },
    { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t3", name: "Edit", input: { file_path: "sum.ts" } }] },
    { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t4", name: "Bash", input: { command: "npm test" } }] },
    { stop_reason: "end_turn", content: [{ type: "text", text: "Fixed: sum() now adds." }] },
  ]
  let turn = 0
  return () => script[turn++]!
}

let fixed = false
export const tools: Tools = {
  Bash: () => (fixed ? "1 passed" : "1 failed: sum(2, 3) returned -1"),
  Read: () => "export const sum = (a, b) => a - b",
  Edit: () => ((fixed = true), "edited sum.ts"),
}

const result = runLoop(fakeModel(), tools, "Fix the failing tests")
console.log(result.used.join(" → "))
console.log(result.text)
```

```typescript solution
type Block =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, string> }
  | { type: "tool_result"; tool_use_id: string; content: string }
type Message = { role: "user" | "assistant"; content: string | Block[] }
type Reply = { content: Block[]; stop_reason: "tool_use" | "end_turn" }
type Model = (messages: Message[]) => Reply
type Tools = Record<string, (input: Record<string, string>) => string>

export function runLoop(model: Model, tools: Tools, prompt: string) {
  const messages: Message[] = [{ role: "user", content: prompt }]
  const used: string[] = []
  while (true) {
    const reply = model(messages)
    messages.push({ role: "assistant", content: reply.content })
    if (reply.stop_reason === "end_turn") {
      const text = reply.content.map((b) => (b.type === "text" ? b.text : "")).join("")
      return { text, used }
    }
    const results: Block[] = []
    for (const block of reply.content) {
      if (block.type !== "tool_use") continue
      used.push(block.name)
      results.push({ type: "tool_result", tool_use_id: block.id, content: tools[block.name]!(block.input) })
    }
    messages.push({ role: "user", content: results })
  }
}

// A scripted stand-in for the real model: one canned reply per call.
export function fakeModel(): Model {
  const script: Reply[] = [
    { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t1", name: "Bash", input: { command: "npm test" } }] },
    { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t2", name: "Read", input: { file_path: "sum.ts" } }] },
    { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t3", name: "Edit", input: { file_path: "sum.ts" } }] },
    { stop_reason: "tool_use", content: [{ type: "tool_use", id: "t4", name: "Bash", input: { command: "npm test" } }] },
    { stop_reason: "end_turn", content: [{ type: "text", text: "Fixed: sum() now adds." }] },
  ]
  let turn = 0
  return () => script[turn++]!
}

let fixed = false
export const tools: Tools = {
  Bash: () => (fixed ? "1 passed" : "1 failed: sum(2, 3) returned -1"),
  Read: () => "export const sum = (a, b) => a - b",
  Edit: () => ((fixed = true), "edited sum.ts"),
}

const result = runLoop(fakeModel(), tools, "Fix the failing tests")
console.log(result.used.join(" → "))
console.log(result.text)
```

```typescript check
expect(output[0] === "Bash → Read → Edit → Bash", `Expected the tools in order "Bash → Read → Edit → Bash", got "${output[0]}"`)
expect(output[1] === "Fixed: sum() now adds.", `Expected the final text "Fixed: sum() now adds.", got "${output[1]}"`)
const seen: unknown[][] = []
const spy = (messages: unknown[]) => {
  seen.push(structuredClone(messages))
  return seen.length === 1
    ? { stop_reason: "tool_use" as const, content: [{ type: "tool_use" as const, id: "x", name: "Grep", input: { pattern: "sum" } }] }
    : { stop_reason: "end_turn" as const, content: [{ type: "text" as const, text: "done" }] }
}
const r = lesson.runLoop(spy, { Grep: () => "sum.ts:1" }, "find sum")
expect(r.text === "done" && r.used.join() === "Grep", "With a one-tool script, runLoop should return text 'done' and used ['Grep']")
const last = JSON.stringify(seen[1]?.at(-1))
expect(last.includes('"tool_result"') && last.includes('"tool_use_id":"x"') && last.includes("sum.ts:1"), "The tool's output must go back to the model as a tool_result block with the matching tool_use_id")
```

**Reference:** [How Claude Code works](https://code.claude.com/docs/en/how-claude-code-works) in the Claude Code docs.
