---
title: Subagents & delegation
section: Guide Book
summary: When a second agent earns its cost, what it can and cannot pass back, and the orchestration patterns that actually hold up.
---
A subagent is a separate agent with its own context window, its own tools and its own loop. The parent sends a task and receives a result. Nothing else crosses the boundary.

```text
┌── parent agent ─────────────────────────────┐
│  context: the conversation, the plan        │
│                                             │
│   spawn ──► ┌── subagent ──────────────┐    │
│             │ fresh context            │    │
│             │ reads 40 files           │    │
│             │ returns 200 tokens ──────┼────┤
│             └──────────────────────────┘    │
│  context: +200 tokens, not +40 files        │
└─────────────────────────────────────────────┘
```

## The real reason: context isolation

```typescript
// What a search costs in the parent's window vs. in a subagent's.
const filesRead = 40
const tokensPerFile = 1200
const summaryTokens = 250

const inline = filesRead * tokensPerFile
console.log(`inline:   ${inline} tokens of file contents, in the parent's context forever`)
console.log(`subagent: ${summaryTokens} tokens of findings — the reading happened elsewhere`)
console.log(`saved:    ${inline - summaryTokens} tokens, on every subsequent turn`)
```

> 🔍 **Behind the scenes: a subagent is a context firewall**
>
> The parent pays for its context on *every* turn for the rest of the conversation. A search that reads forty files to find three relevant ones leaves thirty-seven irrelevant files in the window permanently. Delegating it means the reading happens in a window that is discarded, and only the conclusion survives. That is the whole economic argument — parallelism is a bonus, not the point.

## What crosses the boundary

```typescript
type Spawn = { task: string; context: string }
type Report = { summary: string }

// The parent sends text. The subagent returns text. That is all.
function subagent(spawn: Spawn): Report {
  // Fresh window: it knows only what the spawn message said.
  const knows = [spawn.task, spawn.context]
  return { summary: `Found 3 call sites. Knew ${knows.length} things at the start.` }
}

const report = subagent({
  task: "Find every call site of `legacyAuth()` and report the file and line of each.",
  context: "TypeScript monorepo. Source under packages/*/src. Ignore tests and dist.",
})

console.log(report.summary)
console.log("\nThe subagent could NOT see:")
for (const missing of [
  "the conversation so far",
  "why the parent wants this",
  "files the parent already read",
  "decisions made earlier in the session",
]) {
  console.log(`  • ${missing}`)
}
```

> ⚠️ A subagent starts cold. Everything it needs must be in the spawn message: the task, the constraints, the conventions, the definition of done. "Look into that thing we discussed" produces a report about nothing — the subagent has never seen the discussion.

## Writing a spawn message

```typescript
const poor = "Check the auth code."

const good = `
Find every place in this repo where a session is created or invalidated.

Repository: TypeScript monorepo, source under packages/*/src. Ignore dist/ and *.test.ts.
Relevant names: createSession, destroySession, SessionStore, req.session.

Report, and nothing else:
- a table of file:line → which operation
- any place that creates a session without a matching invalidation path
- any place that touches the session cookie directly

Do not modify any file. Do not fix anything you find.
`

console.log(`poor: ${poor.length} chars — the subagent must guess almost everything`)
console.log(`good: ${good.trim().length} chars — task, scope, vocabulary, output shape, limits`)
console.log(good.trim())
```

Five things a spawn message needs: the task, the scope, the vocabulary to search for, the exact shape of the report, and the prohibitions.

## When delegation pays

```typescript
type Task = { name: string; reads: number; writes: boolean; independent: boolean }

function shouldDelegate(t: Task): { verdict: string; why: string } {
  if (t.writes) return { verdict: "no", why: "coordinating writes across agents invites conflicts" }
  if (t.reads < 5) return { verdict: "no", why: "a cold start costs more than the reading saves" }
  if (!t.independent) return { verdict: "no", why: "it needs the parent's context to make sense" }
  return { verdict: "yes", why: "broad reading, no writes, self-contained" }
}

const tasks: Task[] = [
  { name: "find all call sites of X", reads: 40, writes: false, independent: true },
  { name: "read one config file", reads: 1, writes: false, independent: true },
  { name: "refactor the auth module", reads: 12, writes: true, independent: false },
  { name: "audit 30 files for a pattern", reads: 30, writes: false, independent: true },
  { name: "continue the fix we were discussing", reads: 8, writes: true, independent: false },
]

for (const t of tasks) {
  const r = shouldDelegate(t)
  console.log(`${r.verdict.padEnd(4)} ${t.name.padEnd(36)} ${r.why}`)
}
```

## Parallel fan-out

```typescript
type Finding = { area: string; issues: string[] }

async function audit(area: string): Promise<Finding> {
  await new Promise((r) => setTimeout(r, 10))
  return { area, issues: [`${area}: one thing worth a look`] }
}

const areas = ["auth", "billing", "notifications", "search"]

const started = Date.now()
const findings = await Promise.all(areas.map(audit)) // concurrent, not sequential
const elapsed = Date.now() - started

console.log(`${findings.length} areas audited in ${elapsed < 50 ? "one round" : "several rounds"}`)
for (const f of findings) console.log(`  ${f.area.padEnd(14)} ${f.issues[0]}`)

// The parent's job: synthesise, not re-read.
console.log(`\nparent receives ${findings.length} summaries, not ${areas.length * 30} files`)
```

Independent, read-only, similarly-shaped tasks are the ideal fan-out. Anything with shared state or ordering between the parts is not.

## Cheaper models for cheap work

```typescript
const assignments = [
  { work: "orchestrating, deciding, writing code", model: "claude-opus-5", effort: "high / xhigh" },
  { work: "reading many files for a pattern", model: "claude-haiku-4-5", effort: "low" },
  { work: "summarising a long document", model: "claude-sonnet-5", effort: "low" },
  { work: "judging outputs against a rubric", model: "claude-sonnet-5", effort: "medium" },
] as const

for (const a of assignments) {
  console.log(`${a.model.padEnd(20)} ${a.effort.padEnd(12)} ${a.work}`)
}

console.log("\nCaveat: caches are model-scoped, so a mixed fleet forfeits cache reuse between them.")
console.log("Measure the one-model-at-lower-effort option before building a cascade.")
```

## Orchestration patterns

```typescript
const patterns = [
  {
    name: "fan-out / gather",
    shape: "parent → N independent subagents → parent synthesises",
    fits: "audits, multi-source research, per-file analysis",
  },
  {
    name: "pipeline",
    shape: "research → plan → implement → review, each with its own context",
    fits: "work where each stage's output is small and the input is large",
  },
  {
    name: "explorer / worker",
    shape: "a cheap subagent finds the relevant 3 files; the parent does the work",
    fits: "large repos where locating is expensive and editing is not",
  },
  {
    name: "critic",
    shape: "a fresh subagent reviews the parent's diff with no memory of writing it",
    fits: "catching what the author cannot see — the value IS the lack of context",
  },
]

for (const p of patterns) {
  console.log(`${p.name}\n  ${p.shape}\n  fits: ${p.fits}\n`)
}
```

The **critic** pattern is worth singling out: a reviewer with no memory of having written the code has no attachment to it, and catches the things the author's context makes invisible.

## When not to delegate

```typescript
const antipatterns = [
  ["delegating a two-file edit", "the cold start costs more than the work"],
  ["delegating without a report shape", "you get prose you then have to parse"],
  ["several subagents writing to the same files", "conflicts nobody is watching for"],
  ["a subagent that needs the conversation", "it cannot have it — it starts cold"],
  ["delegating because it feels thorough", "a fan-out is not a substitute for thinking"],
] as const

for (const [what, why] of antipatterns) {
  console.log(`✗ ${what.padEnd(42)} ${why}`)
}
```

> 💡 **Tip:** Default to doing the work inline. Delegate when there is a specific, nameable saving — this reading would otherwise sit in my context forever, or these four things are genuinely independent. "It seems like a big task" is not a reason; a big task usually needs *one* agent with the whole picture.

**Reference:** [Subagents](https://docs.claude.com/en/docs/claude-code/sub-agents) in the Claude Code documentation.
