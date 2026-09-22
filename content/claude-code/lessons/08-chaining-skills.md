---
title: Chaining skills into a workflow
section: 2 · Skills
---

One skill handles one kind of work. Real tasks usually need several: understand the problem, make the change, then prove it works. Chaining skills in a fixed order turns that into a repeatable workflow instead of something you remember to do.

## Process, then implementation, then verification

A common convention, and the one this repo's `CLAUDE.md` uses, sorts skills into stages:

| Stage | What it decides | Examples |
| --- | --- | --- |
| 1 · Process | *How* to approach the work | brainstorming, writing a plan, systematic debugging |
| 2 · Implementation | *What* to build and how it should look | a design skill, a framework skill |
| 3 · Verification | *Whether* it actually works | tests, verification, code review |

The order matters. A debugging skill that runs after you've already patched the code can only tell you the patch was a guess. A review skill that runs before implementation has nothing to review. This ordering is a team convention, not a Claude Code rule: Claude Code runs whatever you invoke.

## Stacking skills in one message

Claude Code lets you start a message with several skills. The docs' example:

```bash
/write-tests /fix-issue 123
```

This loads **both** skills and passes the trailing `123` as `$ARGUMENTS` to each. Claude Code expands the first skill **plus up to five more** stacked after it. Expansion stops at the first token that isn't an inline, user-invocable skill, and everything from there on becomes the argument text.

```typescript
function expandStack(message: string, inline: Set<string>) {
  const tokens = message.split(" ")
  const skills: string[] = []
  while (skills.length < 6 && tokens[0]?.startsWith("/") && inline.has(tokens[0].slice(1))) {
    skills.push(tokens.shift()!.slice(1))
  }
  return { skills, args: tokens.join(" ") }
}

const inline = new Set(["write-tests", "fix-issue"])
console.log(expandStack("/write-tests /fix-issue 123", inline))
console.log(expandStack("/fix-issue /unknown 123", inline))
```

## Writing the chain into a skill

Stacking is handy for one-off combos. For a workflow you run every week, write the chain down as its own skill, and keep it for yourself with `disable-model-invocation: true`:

```markdown
---
name: ship-fix
description: Fix a reported bug end to end, from root cause to a verified change
disable-model-invocation: true
---

Fix $ARGUMENTS:

1. Find the root cause before changing code. Reproduce the failure first.
2. Make the smallest change that fixes the cause.
3. Run the test suite and the type checker. Report the actual output.
4. Do not say the fix is done until step 3 passes.
```

Because Claude Code keeps an invoked skill's content in the conversation across later turns, write steps like these as standing instructions rather than one-time notes.

## Controlling who starts each step

The frontmatter fields from the last lesson let you shape a chain:

| Field | Use in a workflow |
| --- | --- |
| `disable-model-invocation: true` | Steps with side effects (commit, deploy). Only you start them. |
| `user-invocable: false` | Background knowledge Claude should pull in mid-chain, never typed as a command. |
| `context: fork` + `agent` | Run a step in an isolated subagent, such as research with `agent: Explore`. The subagent doesn't see your conversation, so the step's instructions must stand alone. |
| `allowed-tools` | Pre-approve the tools one step needs, for the turn that runs it. |

> 💡 **Tip:** `context: fork` only makes sense for a skill with an actual task. A skill that's just guidelines ("use these API conventions") gives the subagent nothing to do, and it returns without useful output.

Subagents can also go the other way: a subagent's `skills` field preloads the full content of those skills when it starts. That's how you build a "reviewer" agent that always has your review checklist loaded.

## Challenge

> 🎯 **Challenge:** Write `orderPipeline(chosen)` that returns the skill names in a valid pipeline order: every `process` skill, then every `implementation` skill, then every `verification` skill. Keep the original order within each stage, and throw an `Error` if a skill has any other stage.

```typescript starter
export type Stage = "process" | "implementation" | "verification"
export type Chosen = { name: string; stage: string }

export function orderPipeline(chosen: Chosen[]): string[] {
  return chosen.map((c) => c.name)
}

console.log(orderPipeline([
  { name: "code-review", stage: "verification" },
  { name: "frontend-design", stage: "implementation" },
  { name: "brainstorming", stage: "process" },
]))
```

```typescript solution
export type Stage = "process" | "implementation" | "verification"
export type Chosen = { name: string; stage: string }

const ORDER: string[] = ["process", "implementation", "verification"]

export function orderPipeline(chosen: Chosen[]): string[] {
  for (const c of chosen) {
    if (!ORDER.includes(c.stage)) throw new Error(`Unknown stage "${c.stage}" for ${c.name}`)
  }
  // Array.prototype.sort is stable, so ties keep their original order.
  return [...chosen].sort((a, b) => ORDER.indexOf(a.stage) - ORDER.indexOf(b.stage)).map((c) => c.name)
}

console.log(orderPipeline([
  { name: "code-review", stage: "verification" },
  { name: "frontend-design", stage: "implementation" },
  { name: "brainstorming", stage: "process" },
]))
```

```typescript check
const order = lesson.orderPipeline as (c: { name: string; stage: string }[]) => string[]

const got = order([
  { name: "code-review", stage: "verification" },
  { name: "frontend-design", stage: "implementation" },
  { name: "brainstorming", stage: "process" },
  { name: "verify", stage: "verification" },
  { name: "writing-plans", stage: "process" },
])
const want = ["brainstorming", "writing-plans", "frontend-design", "code-review", "verify"]
expect(JSON.stringify(got) === JSON.stringify(want), `Expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`)

expect(order([]).length === 0, "An empty choice gives an empty pipeline")

const input = [{ name: "tdd", stage: "verification" }, { name: "debugging", stage: "process" }]
order(input)
expect(input[0].name === "tdd", "Don't reorder the caller's array in place; return a new one")

let threw = false
try {
  order([{ name: "mystery", stage: "vibes" }])
} catch (e) {
  threw = e instanceof Error
}
expect(threw, "A skill with an unknown stage should throw an Error")
```

**Reference:** [Extend Claude with skills](https://code.claude.com/docs/en/skills#pass-arguments-to-skills) in the Claude Code docs (stacking, invocation control and `context: fork`).
