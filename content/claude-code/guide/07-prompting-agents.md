---
title: Prompting an agent
section: Guide Book
summary: Why prompting an agent differs from prompting a chatbot — goals over procedures, verification loops, and the patterns that stopped working on newer models.
---
A chatbot prompt asks for one output. An agent prompt sets up a *process* that will run for many turns, reading its own output as it goes. The failure modes are different, and so are the fixes.

## State the goal and the finish line

```typescript
const vague = `Fix the failing tests.`

const clear = `
Fix the failing tests in packages/api.

Done means:
- \`npm run test -w packages/api\` exits 0
- No test is skipped, deleted or marked .todo
- No production code change beyond what the failures require

Start by running the suite to see what actually fails.
`

console.log("vague:", vague)
console.log("\nclear:", clear.trim())
console.log("\nThe second one is checkable. The agent can tell when it is finished.")
```

> 💡 **Tip:** An agent needs a *termination condition* it can evaluate. "Fix the tests" has no end — the agent has to guess whether it is done. "`npm run test` exits 0, with no test deleted" is something it can run and read. Give it a command whose output decides.

## Describe the outcome, not the keystrokes

```typescript
const procedural = `
1. Open src/auth.ts
2. Find the login function
3. Add a try/catch around the database call
4. Add a console.error in the catch
5. Return a 500
`

const outcome = `
Login currently returns a 200 with an empty body when the database is down.
It should return a 503 with { error: "service_unavailable" }, and the failure
should be logged with the request id.

The error conventions are in lib/errors.ts — follow them.
`

console.log("procedural: brittle — step 2 fails if the function moved")
console.log("outcome:    the agent finds the code, and may find a better fix than yours")
```

A model that is given steps follows the steps, including past the point where they stopped making sense. A model given the goal and the constraints can notice that the real bug is two frames up.

## Give it a way to check its work

```typescript
// The single highest-leverage thing in an agent prompt.
const loops = [
  ["a test suite", "npm run test", "the agent runs it, sees the failure, iterates"],
  ["a type checker", "npm run typecheck", "catches its own mistakes before you do"],
  ["a linter", "npm run lint", "enforces conventions it would otherwise guess at"],
  ["a real run", "node dist/cli.js --dry-run", "proves the thing actually works"],
  ["a diff review", "git diff", "lets it notice what it changed by accident"],
] as const

for (const [what, command, why] of loops) {
  console.log(`${what.padEnd(16)} ${command.padEnd(26)} ${why}`)
}

console.log("\nWithout a loop, the agent's last output IS the answer — right or wrong.")
console.log("With one, it can be wrong several times and still finish correct.")
```

> 🔍 **Behind the scenes: verification changes the shape of the problem**
>
> A model asked to write correct code in one pass is doing a hard task with no feedback. The same model, given a command that reports what is wrong, is doing a much easier task repeatedly. This is why agents outperform single calls on engineering work by more than the raw capability difference suggests — and why an agent with no way to check its work often does *worse* than a single careful call, because it compounds its own errors across turns.

## Tell it what not to do

```typescript
const constraints = [
  "Do not modify files outside packages/api.",
  "Do not add a dependency — use what is in package.json.",
  "Do not change the public API in src/index.ts.",
  "If a test looks wrong, say so and stop. Do not delete it.",
  "If you need a decision I have not given you, ask instead of guessing.",
]

console.log("Constraints an agent can actually check:")
for (const c of constraints) console.log(`  • ${c}`)

console.log("\nThe last one matters most: it converts a silent wrong guess into a question.")
```

## Patterns that no longer earn their place

The models these were written for are gone. On current models they cost tokens and sometimes hurt.

```typescript
const dated = [
  [
    "Let's think step by step.",
    "Thinking is adaptive and on by default. Raise output_config.effort instead.",
  ],
  [
    "You are an expert senior engineer with 20 years of experience…",
    "Persona padding does not improve correctness. State the task and the constraints.",
  ],
  [
    "Think inside <thinking> tags before answering.",
    "Reasoning is handled by the model. Asking for tags can leak them into the output.",
  ],
  [
    "Respond ONLY with JSON. Do not include any other text. I repeat, ONLY JSON.",
    "Use structured outputs (output_config.format), which is enforced rather than requested.",
  ],
  [
    "Take a deep breath and work through this carefully.",
    "No measurable effect on current models.",
  ],
  [
    "Prefill the assistant turn with '{' to force JSON.",
    "Assistant prefill returns a 400 on current models. Use structured outputs.",
  ],
] as const

for (const [pattern, why] of dated) {
  console.log(`✗ ${pattern}\n  → ${why}\n`)
}
```

> ⚠️ These are worth grepping for in an existing codebase. A prompt written for a 2024 model and never revisited is usually over-specified: it tells a capable model how to think, which reduces the quality of its answer. Deleting the scaffolding is often the single biggest improvement available.

## Give the whole task up front

```typescript
// Drip-feeding a long-horizon task wastes turns and context.
const dripped = [
  "Read the auth module.",
  "Now find the bug.",
  "Now fix it.",
  "Now add a test.",
  "Now run the suite.",
]

const upfront = `
There is a bug in the auth module: sessions are not invalidated on password
change. Find it, fix it, add a regression test, and confirm \`npm run test\`
passes. Follow the error conventions in lib/errors.ts. Do not change the
public API.
`

console.log(`dripped: ${dripped.length} round trips, each re-sending the whole context`)
console.log(`upfront: 1 round trip, and the agent can plan the whole thing`)
console.log(upfront.trim())
```

For long-horizon work, the whole specification in the first message — with a high `effort` setting — beats a sequence of small instructions. The agent plans against the full picture rather than discovering the scope one message at a time.

## A prompt template

```typescript
const template = `
## Task
<one sentence: what should be true when this is finished>

## Context
<where the relevant code is, what you already know, what was already tried>

## Done means
- <a command whose exit code decides it>
- <an observable property>

## Constraints
- <what not to touch>
- <what to ask about instead of deciding>

## Start by
<the first thing to look at — usually "run X and read the output">
`

console.log(template.trim())
console.log("\nFive headings. The two that most prompts are missing are 'Done means' and 'Constraints'.")
```

## Asking beats guessing

```typescript
type Situation = { description: string; shouldAsk: boolean }

const situations: Situation[] = [
  { description: "Two libraries could do this; both are already dependencies", shouldAsk: false },
  { description: "The fix requires a database migration on a live table", shouldAsk: true },
  { description: "A test asserts behaviour that looks like a bug", shouldAsk: true },
  { description: "Formatting is inconsistent; the linter has an opinion", shouldAsk: false },
  { description: "The task could mean two very different features", shouldAsk: true },
]

for (const s of situations) {
  console.log(`${s.shouldAsk ? "ASK  " : "DECIDE"} ${s.description}`)
}

console.log("\nRule: ask when the two readings lead to materially different work.")
console.log("Otherwise pick the sensible default, say which, and keep going.")
```

**Reference:** [Prompt engineering overview](https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview) and [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents).
