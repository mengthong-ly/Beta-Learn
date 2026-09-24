---
title: Skills
section: Guide Book
summary: Instructions that load on demand — the frontmatter contract, how one gets picked, and what makes a skill worth writing.
---
A **skill** is a folder with a `SKILL.md`. Its frontmatter is always in context; its body loads only when the skill is invoked. That split is the whole design: you can ship fifty skills and pay for fifty one-line descriptions, not fifty full documents.

```text
.claude/skills/
└── release-notes/
    ├── SKILL.md          ← frontmatter always loaded, body on demand
    ├── references/
    │   └── format.md     ← loaded only if SKILL.md points at it
    └── scripts/
        └── collect.sh
```

## The frontmatter is the whole interface

```typescript
type SkillFrontmatter = { name: string; description: string }

// This — and only this — is what the model sees until the skill is invoked.
const skills: SkillFrontmatter[] = [
  {
    name: "release-notes",
    description:
      "Use when the user asks to write, draft or update release notes, a changelog " +
      "entry, or a 'what's new' post from merged pull requests. Not for commit " +
      "messages or PR descriptions.",
  },
  {
    name: "db-migration",
    description:
      "Use when adding, altering or dropping a database column or table in this " +
      "repo. Covers writing the migration, the rollback, and the backfill.",
  },
  {
    name: "helper",
    description: "Helps with various tasks.", // useless — see below
  },
]

for (const skill of skills) {
  console.log(`${skill.name.padEnd(16)} ${skill.description.length} chars`)
}
```

> 🔍 **Behind the scenes: how a skill gets picked**
>
> There is no classifier and no embedding search deciding this. Every skill's `name` and `description` sits in context as a short list, and the model picks the way it picks a tool — by reading them against the user's request. So a description written as a *trigger* ("use when the user asks to …") outperforms one written as a *summary* ("helps with release notes"), and a description that never names the words a user would actually type will never fire. The third skill above is invisible: nothing in "helps with various tasks" matches any request.

## A description that triggers

```typescript
function score(description: string): { length: boolean; trigger: boolean; negative: boolean } {
  return {
    length: description.length >= 60 && description.length <= 500,
    trigger: /use (this )?when|triggers? on|for (requests|tasks) (that|about)/i.test(description),
    negative: /\bnot for\b|\bdo not use\b|\bdoes not cover\b/i.test(description),
  }
}

const candidates = [
  "Helps with database stuff.",
  "Use when the user asks to add, alter or drop a database column or table.",
  "Use when the user asks to add, alter or drop a database column or table in this " +
    "repo, including the migration, the rollback and any backfill. Not for querying " +
    "data or for changes to the ORM models alone.",
]

for (const c of candidates) {
  const s = score(c)
  console.log(`${s.length ? "✓" : "✗"} length  ${s.trigger ? "✓" : "✗"} trigger  ${s.negative ? "✓" : "✗"} scope   ${c.slice(0, 50)}…`)
}
```

Three things make a description fire reliably: the **words a user would actually use**, an explicit *use when*, and a boundary saying what it does not cover.

## Progressive disclosure

```typescript
// Token cost of a skill, by stage.
const stages = [
  { stage: "frontmatter only", tokens: 40, when: "always, for every skill installed" },
  { stage: "SKILL.md body", tokens: 900, when: "when the skill is invoked" },
  { stage: "references/*.md", tokens: 3500, when: "only if the body points at them" },
  { stage: "scripts/*", tokens: 0, when: "executed, never read into context" },
]

let running = 0
for (const s of stages) {
  running += s.tokens
  console.log(`${s.stage.padEnd(20)} +${s.tokens.toString().padStart(5)}  (${s.when})`)
}
console.log(`\nfull load: ${running} tokens — but 40 of them are the standing cost`)

const installed = 30
console.log(`30 skills installed = ${installed * 40} tokens always in context`)
```

That is the argument for putting detail in `references/` rather than in `SKILL.md`: the body is paid for on every invocation, a reference only when it is needed.

## The body: instructions, not prose

```typescript
const weak = `
This skill helps you write release notes. Release notes are important because
they tell users what changed. There are many approaches to writing them, and
you should consider your audience carefully.
`

const strong = `
## Steps

1. Run \`git log --oneline <last-tag>..HEAD\` to list merged work.
2. Group commits into Added / Changed / Fixed / Removed. Drop chores and CI.
3. Write each entry as user-visible impact, not implementation:
   - Good: "Exports now include the order reference."
   - Bad:  "Refactored CsvExporter to inject OrderRef."
4. Put breaking changes first, under a **Breaking** heading, with migration steps.
5. Check every entry against references/format.md before finishing.

## Never

- Never invent an entry that has no commit behind it.
- Never include internal ticket numbers.
`

console.log(`weak:   ${weak.trim().split("\n").length} lines of explanation`)
console.log(`strong: ${strong.trim().split("\n").length} lines of instruction`)
console.log("\nThe body is read by a model that will act on it. Write steps, not essays.")
```

> 💡 **Tip:** Write the body for a competent colleague who has never seen this repository: concrete steps, real commands, a worked example of good and bad output, and an explicit "never" list. Background and motivation belong in a reference file, if anywhere — the body is the part that costs tokens every time.

## When a skill is the wrong shape

```typescript
const decisions = [
  ["a repeatable procedure with judgement in it", "skill", "release notes, a review checklist, a migration"],
  ["a deterministic transformation", "script", "formatting, codegen, a lint fix"],
  ["something the model must call to get data", "tool / MCP", "reading a file, querying an API"],
  ["a rule that applies to everything, always", "CLAUDE.md", "'this project uses tabs'"],
  ["one-off context for this conversation", "just say it", "'ignore the vendored directory'"],
] as const

for (const [need, answer, example] of decisions) {
  console.log(`${answer.padEnd(12)} ${need.padEnd(44)} e.g. ${example}`)
}
```

A skill earns its place when the *procedure* is the valuable part — when there is a right order, known pitfalls, and a standard the output should meet. If the whole thing could be a shell script, write the shell script and let the skill call it.

## Composition

```typescript
// Skills chain: a process skill sets the approach, an implementation skill carries it out.
type Skill = { name: string; kind: "process" | "implementation" }

const available: Skill[] = [
  { name: "brainstorming", kind: "process" },
  { name: "writing-plans", kind: "process" },
  { name: "systematic-debugging", kind: "process" },
  { name: "frontend-design", kind: "implementation" },
  { name: "database-migration", kind: "implementation" },
]

function order(picked: Skill[]): string[] {
  return [...picked]
    .sort((a, b) => (a.kind === "process" ? -1 : 1) - (b.kind === "process" ? -1 : 1))
    .map((s) => s.name)
}

console.log("build a feature →", order([
  available[3]!,
  available[0]!,
  available[1]!,
]).join(" → "))

console.log("fix a bug      →", order([available[4]!, available[2]!]).join(" → "))
```

Process first, implementation second: the process skill decides *how to approach* the work, the implementation skill decides *how to do* it.

## A checklist for a skill worth installing

```typescript
const checklist = [
  "The description names the words a user would actually type.",
  "The description says 'use when …' and also what it is NOT for.",
  "The body is steps and rules, not background.",
  "Long reference material lives in references/, loaded on demand.",
  "Deterministic work is a script the skill calls, not prose the model follows.",
  "There is at least one worked example of a good and a bad output.",
  "There is an explicit 'never' list.",
]

checklist.forEach((item, i) => console.log(`${i + 1}. ${item}`))
```

**Reference:** [Agent Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview) in the Claude documentation.
