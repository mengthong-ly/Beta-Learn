---
title: The harness
section: Guide Book
summary: Everything around the model — CLAUDE.md, settings and permissions, hooks, and why a harness is mostly about what the agent is *not* allowed to do.
---
The model is one component. The **harness** is everything else: what is in the system prompt, which tools exist, what needs approval, what runs automatically, and where state lives. Most of the difference between agents is harness, not model.

## `CLAUDE.md`: standing instructions

```typescript
// CLAUDE.md is prepended to the system prompt on every request — so its cost is
// paid every turn, and its content applies to every task.
const files = [
  { path: "~/.claude/CLAUDE.md", scope: "every project you work on", example: "personal preferences" },
  { path: "<repo>/CLAUDE.md", scope: "this repository, checked in", example: "build commands, conventions" },
  { path: "<repo>/packages/api/CLAUDE.md", scope: "that subtree", example: "rules for one package" },
]

for (const f of files) {
  console.log(`${f.path.padEnd(32)} ${f.scope.padEnd(28)} ${f.example}`)
}
```

```typescript
const weak = `
This is a TypeScript project. We care about code quality. Please write clean,
maintainable code and follow best practices. Be careful with the database.
`

const strong = `
## Commands
- \`npm run dev\` — dev server on :3000
- \`npm run check\` — typecheck + lint + tests. Run before saying you are done.

## Conventions
- Tests live next to the file, as \`*.test.ts\`. Never in a \`__tests__\` folder.
- Use \`node:\` prefixes for builtins.
- Errors: throw \`AppError\` from \`lib/errors.ts\`, never a bare \`Error\`.

## Never
- Never edit \`db/schema.sql\` by hand — add a migration in \`db/migrations/\`.
- Never commit to \`main\`.
`

console.log(`weak:   ${weak.trim().split("\n").length} lines, 0 actionable rules`)
console.log(`strong: ${strong.trim().split("\n").length} lines, every one checkable`)
```

> ⚠️ Everything in `CLAUDE.md` is in context on every request, forever. That makes it the wrong place for anything task-specific — a long explanation of one subsystem belongs in a skill that loads on demand. Keep it to the rules that genuinely apply to *every* task: commands, conventions, and prohibitions.

## Permissions

```typescript
type Rule = { pattern: string; effect: "allow" | "ask" | "deny" }

const rules: Rule[] = [
  { pattern: "Read(**)", effect: "allow" },
  { pattern: "Bash(npm run test:*)", effect: "allow" },
  { pattern: "Bash(git commit:*)", effect: "ask" },
  { pattern: "Edit(src/**)", effect: "allow" },
  { pattern: "Edit(.env*)", effect: "deny" },
  { pattern: "Bash(rm -rf:*)", effect: "deny" },
  { pattern: "WebFetch(**)", effect: "ask" },
]

// deny wins, then allow, then ask — a deny rule cannot be overridden.
function decide(action: string): Rule["effect"] {
  const matches = (p: string) =>
    action.startsWith(p.replace(/:\*\)$/, "").replace(/\(\*\*\)$/, "("))

  if (rules.some((r) => r.effect === "deny" && matches(r.pattern))) return "deny"
  if (rules.some((r) => r.effect === "allow" && matches(r.pattern))) return "allow"
  return "ask"
}

for (const action of ["Read(src/index.ts)", "Bash(npm run test:unit)", "Edit(.env.local)", "Bash(curl example.com)"]) {
  console.log(`${action.padEnd(28)} → ${decide(action)}`)
}
```

The precedence is the important part: **deny always wins**. A deny rule is a guarantee, not a default, which is what makes it safe to broaden the allow list.

## Settings, layered

```typescript
type Settings = { permissions?: { allow?: string[]; deny?: string[] }; env?: Record<string, string> }

const layers: Array<[string, Settings]> = [
  ["enterprise managed", { permissions: { deny: ["Bash(curl:*)"] } }],
  ["user ~/.claude", { permissions: { allow: ["Read(**)"] }, env: { EDITOR: "vim" } }],
  ["project .claude", { permissions: { allow: ["Bash(npm run:*)"] } }],
  ["project .local (gitignored)", { permissions: { allow: ["Bash(docker:*)"] } }],
]

// Later layers add to earlier ones; enterprise deny rules cannot be removed.
const merged: Required<Settings> = { permissions: { allow: [], deny: [] }, env: {} }
for (const [name, layer] of layers) {
  merged.permissions.allow!.push(...(layer.permissions?.allow ?? []))
  merged.permissions.deny!.push(...(layer.permissions?.deny ?? []))
  Object.assign(merged.env, layer.env ?? {})
  console.log(`after ${name.padEnd(28)} allow=${merged.permissions.allow!.length} deny=${merged.permissions.deny!.length}`)
}

console.log("\nfinal:", JSON.stringify(merged))
```

## Hooks

A hook is a shell command the harness runs at a defined point. It is the part of the harness *you* control without asking the model to cooperate.

```typescript
const events = [
  ["SessionStart", "session begins", "inject branch, ticket, environment into context"],
  ["UserPromptSubmit", "before the prompt is sent", "add context, or block on a policy"],
  ["PreToolUse", "before a tool runs", "veto it — exit 2 blocks and explains why"],
  ["PostToolUse", "after a tool runs", "format, lint, run the affected test"],
  ["Stop", "the agent finished", "run the full check suite"],
  ["SessionEnd", "session ends", "clean up, archive the transcript"],
] as const

for (const [event, when, use] of events) {
  console.log(`${event.padEnd(18)} ${when.padEnd(28)} ${use}`)
}
```

```typescript
// A PreToolUse hook is a program: stdin is JSON, the exit code is the verdict.
type HookInput = { tool_name: string; tool_input: { command?: string; file_path?: string } }

function preToolUse(input: HookInput): { exitCode: number; message: string } {
  const { tool_name, tool_input } = input

  if (tool_name === "Bash" && /\bgit\s+push\b.*\bmain\b/.test(tool_input.command ?? "")) {
    return { exitCode: 2, message: "Blocked: pushing to main is not allowed. Open a PR." }
  }

  if (tool_name === "Edit" && (tool_input.file_path ?? "").includes("/generated/")) {
    return { exitCode: 2, message: "Blocked: generated/ is built by `npm run codegen`. Edit the source." }
  }

  return { exitCode: 0, message: "" }
}

const cases: HookInput[] = [
  { tool_name: "Bash", tool_input: { command: "git push origin main" } },
  { tool_name: "Edit", tool_input: { file_path: "src/generated/api.ts" } },
  { tool_name: "Edit", tool_input: { file_path: "src/app.ts" } },
]

for (const c of cases) {
  const r = preToolUse(c)
  console.log(`${r.exitCode === 2 ? "BLOCK" : "allow"}  ${JSON.stringify(c.tool_input)}`)
  if (r.message) console.log(`       ${r.message}`)
}
```

> 🔍 **Behind the scenes: a hook is a guarantee, a prompt is a request**
>
> "Never push to main" in `CLAUDE.md` is an instruction the model will usually follow. A `PreToolUse` hook that exits 2 on `git push … main` is a rule that *cannot* be not-followed, because the harness never runs the command. Anything where the cost of a miss is real — secrets, production, destructive commands, compliance — belongs in a hook or a deny rule, not in prose. Prompts shape behaviour; hooks enforce it.

## Feeding results back

```typescript
// exit 2 on PreToolUse blocks and sends stderr to the model, so it can adapt.
function postToolUse(file: string): { exitCode: number; stderr: string } {
  const problems = file.endsWith(".ts") ? ["src/app.ts:12:3 — 'foo' is declared but never used"] : []
  return problems.length
    ? { exitCode: 2, stderr: `Lint failed:\n${problems.join("\n")}\nFix before continuing.` }
    : { exitCode: 0, stderr: "" }
}

const result = postToolUse("src/app.ts")
console.log(`exit ${result.exitCode}`)
console.log(result.stderr)
console.log("\nThe model reads that and fixes it on the next turn — no human in the loop.")
```

That is the highest-value hook pattern: run the check that a human would have run, and hand the failure back to the model as a tool result. The agent gets a feedback loop it cannot skip.

## What a good harness looks like

```typescript
const principles = [
  ["Deny what must never happen", "a deny rule or a hook, never a sentence in a prompt"],
  ["Allow the boring 95%", "every unnecessary approval trains the user to click yes"],
  ["Automate the checks", "PostToolUse lint/test beats asking the model to remember"],
  ["Keep standing context small", "CLAUDE.md for universal rules, skills for the rest"],
  ["Make failure legible", "a blocked action should explain what to do instead"],
  ["Bound the loop", "iteration caps and budgets, in the harness not the prompt"],
] as const

for (const [principle, how] of principles) {
  console.log(`• ${principle}\n    ${how}`)
}
```

**Reference:** [Claude Code settings](https://docs.claude.com/en/docs/claude-code/settings) and [Hooks](https://docs.claude.com/en/docs/claude-code/hooks).
