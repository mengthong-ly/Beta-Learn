---
title: Subagents
section: 5 · Agentic Workflows
---

Some side tasks flood the conversation. Running a test suite, searching a big codebase or reading logs can produce thousands of lines you'll never look at again. A **subagent** does that work in **its own context window** and hands back only a summary. Your main conversation stays small and focused.

Each subagent has its own system prompt, its own set of tools and its own permissions. Claude reads each subagent's `description` and delegates a task when the description matches it.

## Defining a subagent

A subagent is a markdown file with YAML frontmatter. The frontmatter configures it, and the body becomes its system prompt. This is the example from the Claude Code docs:

```markdown
---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. When invoked, analyze the code and provide
specific, actionable feedback on quality, security, and best practices.
```

Only `name` and `description` are required. These are the fields you'll use most:

| Field | What it does |
| --- | --- |
| `name` | Unique id, lowercase letters and hyphens. The filename doesn't have to match |
| `description` | When Claude should delegate to this subagent. Add "use proactively" to encourage it |
| `tools` | Tools it may use, as a comma-separated string or a YAML list. Omit it to inherit every tool |
| `disallowedTools` | Tools to remove from the inherited or listed set |
| `model` | `sonnet`, `opus`, `haiku`, `fable`, a full model ID, or `inherit` |
| `permissionMode` | For example `default`, `acceptEdits`, `plan` |
| `maxTurns` | Maximum agentic turns before it stops |
| `skills` | Skills whose full content is preloaded at startup |
| `memory` | `user`, `project` or `local`: its own persistent memory |
| `isolation` | `worktree` runs it in a temporary git worktree |

Other documented fields include `mcpServers`, `hooks`, `background`, `effort`, `color`, `initialPrompt` and `omitClaudeMd`. Claude Code **skips** a file with no `name`, a `name` with no `description`, or YAML that doesn't parse.

Where the file lives decides who can use it. When two subagents share a name, the higher-priority location wins:

| Location | Scope | Priority |
| --- | --- | --- |
| Managed settings | Organization-wide | 1 (highest) |
| `--agents` CLI flag (JSON) | Current session | 2 |
| `.claude/agents/` | Current project (commit it to share with your team) | 3 |
| `~/.claude/agents/` | All your projects | 4 |
| A plugin's `agents/` directory | Where the plugin is enabled | 5 (lowest) |

> 💡 **Tip:** ask Claude to write the file for you, or edit `.claude/agents/` yourself. Claude Code notices new or edited files within a few seconds. (Since v2.1.198, `/agents` no longer opens a creation wizard.)

## What a subagent sees

A subagent starts **fresh**. It doesn't see your conversation history or the files Claude already read. It gets its own system prompt (not the Claude Code system prompt), the task message Claude writes when it hands off the work, your CLAUDE.md files, a git status snapshot and any preloaded skills. When it finishes, only its final result comes back to the main conversation.

Here's the saving in miniature. The stand-in worker reads a big log, but only its one-line summary lands in the main context:

```typescript
const mainContext: string[] = ["user: why is CI red?"]

function subagent(task: string): string {
  const ownContext: string[] = [`task: ${task}`]
  for (let i = 1; i <= 2000; i++) ownContext.push(`log line ${i}: ok`) // verbose work
  ownContext.push("log line 2001: FAIL auth.test.ts > rejects expired token")
  const failures = ownContext.filter((line) => line.includes("FAIL"))
  return `1 failing test: ${failures[0].split("FAIL ")[1]}`
}

mainContext.push(`subagent: ${subagent("run the tests, report only failures")}`)
console.log(mainContext)
console.log(`main context: ${mainContext.length} lines, the subagent read 2002`)
```

## Restricting tools

`tools` is an allowlist and `disallowedTools` is a denylist. A read-only reviewer can't edit anything, however it's prompted. Leave `Agent` out of its tools and it can't spawn subagents of its own either. The subagent ends up with the listed tools minus the denied ones:

```typescript
const inherited = ["Read", "Grep", "Glob", "Edit", "Write", "Bash", "Agent"]

function effectiveTools(tools: string[] | undefined, disallowed: string[] = []) {
  return (tools ?? inherited).filter((t) => !disallowed.includes(t))
}

console.log("reviewer:", effectiveTools(["Read", "Grep", "Glob"]))
console.log("no-edit helper:", effectiveTools(undefined, ["Edit", "Write"]))
```

## When to delegate

| Use the main conversation when | Use a subagent when |
| --- | --- |
| You go back and forth or refine as you go | The task produces verbose output you don't need |
| Several phases share a lot of context | You want to enforce tool restrictions or permissions |
| It's a quick, targeted change | The work is self-contained and can return a summary |
| Latency matters (a subagent starts fresh and has to gather context) | |

## Fan-out: orchestrator and workers

The docs show three ways to use subagents: isolate a high-volume task, **run research in parallel** ("research the authentication, database, and API modules in parallel using separate subagents"), or **chain** them one after another. The parallel version is the *orchestrator-workers* pattern. One agent splits the job, workers run at the same time, and the orchestrator combines what they report.

In code, "at the same time" means starting every worker before waiting for any of them. That's `Promise.all`:

```typescript
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function worker(area: string): Promise<string> {
  await sleep(50) // pretend to explore
  return `${area}: looks fine`
}

const start = Date.now()
const summaries = await Promise.all(["auth", "database", "api"].map(worker))
console.log(summaries)
console.log(Date.now() - start < 140 ? "ran in parallel (~50ms, not 150ms)" : "ran one by one")
```

Keep in mind that every summary lands in the main context. Many subagents that each return long reports can use up a lot of context. By default a subagent can nest up to three layers below the main conversation, and a session can have up to 20 subagents running at once.

## Challenge

> 🎯 **Challenge:** Write `parseAgent(file)`. It reads a subagent file's frontmatter and returns `{ name, description, tools, model, prompt }`. `tools` accepts a comma-separated string or a YAML list, and is `undefined` when omitted. `prompt` is the trimmed body. Throw an error that mentions the missing field when `name` or `description` is missing. Then write `orchestrate(tasks, worker)`. It must start every worker at once with `Promise.all` and return one line per task, in task order: `- <task>: <summary>`.

```typescript starter
export type AgentDef = { name: string; description: string; tools?: string[]; model?: string; prompt: string }

export function parseAgent(file: string): AgentDef {
  // split the frontmatter from the body, then read the fields
  return { name: "", description: "", prompt: file }
}

export async function orchestrate(tasks: string[], worker: (task: string) => Promise<string>): Promise<string> {
  const lines: string[] = []
  for (const task of tasks) lines.push(`- ${task}: ${await worker(task)}`) // one at a time!
  return lines.join("\n")
}

const reviewer = `---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer.`

console.log(parseAgent(reviewer))
console.log(await orchestrate(["auth", "db"], async (t) => `${t} is fine`))
```

```typescript solution
export type AgentDef = { name: string; description: string; tools?: string[]; model?: string; prompt: string }

export function parseAgent(file: string): AgentDef {
  const match = file.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) throw new Error("A subagent file must start with --- frontmatter")
  const [, front, body] = match
  const fields: Record<string, string | string[]> = {}
  let listKey = ""
  for (const line of front.split("\n")) {
    const item = line.match(/^\s+-\s*(.+)$/)
    if (item && listKey) {
      ;(fields[listKey] as string[]).push(item[1].trim())
      continue
    }
    const pair = line.match(/^([A-Za-z]+):\s*(.*)$/)
    if (!pair) continue
    const [, key, value] = pair
    if (value === "") {
      fields[key] = []
      listKey = key
    } else {
      fields[key] = value.trim()
      listKey = ""
    }
  }
  for (const key of ["name", "description"]) {
    if (typeof fields[key] !== "string") throw new Error(`Missing required field: ${key}`)
  }
  const tools = fields.tools
  return {
    name: fields.name as string,
    description: fields.description as string,
    tools: tools === undefined ? undefined : Array.isArray(tools) ? tools : tools.split(",").map((t) => t.trim()),
    model: typeof fields.model === "string" ? fields.model : undefined,
    prompt: body.trim(),
  }
}

export async function orchestrate(tasks: string[], worker: (task: string) => Promise<string>): Promise<string> {
  const summaries = await Promise.all(tasks.map(worker))
  return tasks.map((task, i) => `- ${task}: ${summaries[i]}`).join("\n")
}

const reviewer = `---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer.`

console.log(parseAgent(reviewer))
console.log(await orchestrate(["auth", "db"], async (t) => `${t} is fine`))
```

```typescript check
const a = lesson.parseAgent(`---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer.
Be specific.`)
expect(a.name === "code-reviewer", `name should be "code-reviewer", got ${JSON.stringify(a.name)}`)
expect(a.description === "Reviews code for quality and best practices", `description was ${JSON.stringify(a.description)}`)
expect(JSON.stringify(a.tools) === '["Read","Glob","Grep"]', `"tools: Read, Glob, Grep" should give ["Read","Glob","Grep"], got ${JSON.stringify(a.tools)}`)
expect(a.model === "sonnet", `model should be "sonnet", got ${JSON.stringify(a.model)}`)
expect(a.prompt === "You are a code reviewer.\nBe specific.", `prompt should be the trimmed body, got ${JSON.stringify(a.prompt)}`)

const b = lesson.parseAgent(`---
name: researcher
description: Explores a module and reports back
tools:
  - Read
  - Grep
---
Summarize what you find.`)
expect(JSON.stringify(b.tools) === '["Read","Grep"]', `A YAML list of tools should give ["Read","Grep"], got ${JSON.stringify(b.tools)}`)
expect(b.model === undefined, "model should be undefined when the frontmatter doesn't set it")

const c = lesson.parseAgent(`---\nname: helper\ndescription: Does anything\n---\nHelp.`)
expect(c.tools === undefined, "tools should be undefined when omitted (the subagent inherits every tool)")

let threw = ""
try {
  lesson.parseAgent(`---\nname: no-description\n---\nBody`)
} catch (e) {
  threw = String(e)
}
expect(threw.includes("description"), "A file without a description should throw an error that mentions \"description\"")

let running = 0
let peak = 0
const worker = async (task: string) => {
  running++
  peak = Math.max(peak, running)
  await new Promise((r) => setTimeout(r, task === "slow" ? 60 : 10))
  running--
  return `${task} done`
}
const merged = await lesson.orchestrate(["slow", "fast", "medium"], worker)
expect(peak === 3, `All 3 workers should run at the same time (use Promise.all), but at most ${peak} ran at once`)
expect(merged === "- slow: slow done\n- fast: fast done\n- medium: medium done", `Expected one "- task: summary" line per task in task order, got ${JSON.stringify(merged)}`)
```

**Reference:** [Create custom subagents](https://code.claude.com/docs/en/sub-agents) in the Claude Code docs, and [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) on Anthropic's engineering blog.
