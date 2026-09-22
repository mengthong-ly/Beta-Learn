---
title: How a skill gets picked
section: 2 · Skills
---

A skill runs in one of two ways: **Claude picks it** because your request matches its description, or **you invoke it** by typing `/skill-name`. Knowing how each works tells you why a skill fires, why it doesn't, and when to take the wheel.

## Claude picks from the description

At the start of a session, Claude Code puts a **listing** of every skill's name and description into Claude's context. The full `SKILL.md` body stays on disk. When you ask for something, Claude compares your request with those descriptions and loads the skill that fits.

So the description is the whole signal. The docs show one skill working both ways:

```markdown
---
description: Summarizes uncommitted changes and flags anything risky. Use when the user asks what changed, wants a commit message, or asks to review their diff.
---
```

Ask "What did I change?" and Claude loads it on its own. Type `/summarize-changes` and it runs directly.

The listing has a budget. The docs say each skill's `description` plus `when_to_use` text is cut at **1,536 characters**, and when you have many skills Claude Code shortens descriptions further, starting with the ones you use least. That's why you **put the key use case first**:

```typescript
const CAP = 1536
const description = "Use when the user asks for a changelog. " + "Background detail. ".repeat(100)
const listed = description.slice(0, CAP)

console.log(`${description.length} chars written, ${listed.length} listed`)
console.log("trigger still visible:", listed.includes("changelog"))
```

## You invoke it yourself

Typing `/` followed by the name always works for skills you're allowed to invoke. Anything after the name becomes the skill's arguments: `/fix-issue 123` passes `123` as `$ARGUMENTS`.

Two frontmatter fields decide who may start a skill:

| Frontmatter | You can invoke | Claude can invoke | Description in context? |
| --- | --- | --- | --- |
| (default) | Yes | Yes | Yes |
| `disable-model-invocation: true` | Yes | No | No |
| `user-invocable: false` | No | Yes | Yes |

Use `disable-model-invocation: true` for anything with side effects, like `/deploy` or `/commit`. In the docs' words, you don't want Claude deciding to deploy because your code looks ready. Use `user-invocable: false` for background knowledge, like how a legacy system works, that isn't a sensible command to type.

A third field, `paths`, narrows automatic loading: with `paths: "src/**/*.ts"` Claude only loads the skill on its own while working with matching files.

## Picking the right skill for the job

Most setups have a handful of skills for recurring kinds of work. This course's own repo, for example, maps tasks to skills like this:

| Task | Skill to reach for | Why |
| --- | --- | --- |
| Something is broken or a test fails | a debugging skill (`systematic-debugging`) | Find the root cause before changing code |
| A new feature or behavior change | brainstorming, then a planning skill | Agree on what to build before building it |
| Building or polishing UI | a design skill (`frontend-design`) | Brings design rules Claude wouldn't apply by default |
| "How does library X do Y?" | a docs lookup skill (`context7-mcp`) | Fetches current docs instead of guessing from memory |
| About to say "done" | a verification skill | Runs the checks before claiming success |

When it matters which one runs, don't leave it to chance: name it. `/systematic-debugging the login test fails` is unambiguous.

> 💡 **Tip:** if a skill never fires, the docs' checklist is: make sure the description has the words people naturally say, check it shows up when you ask "What skills are available?", try rephrasing, or invoke it with `/skill-name`. If it fires too often, make the description more specific or add `disable-model-invocation: true`.

## A toy model of matching

Claude's choice is a judgment call by the model, not a keyword count. Still, a keyword overlap score is a useful mental model for *why* description wording matters:

```typescript
const words = (s: string) => new Set(s.toLowerCase().match(/[a-z0-9]+/g) ?? [])

const task = words("the login test is failing with an error")
const debugging = words("Finds the root cause of a bug, error or failing test")
const design = words("Builds polished UI components and pages")

const overlap = (d: Set<string>) => [...task].filter((w) => d.has(w)).length
console.log("debugging:", overlap(debugging), "design:", overlap(design))
```

The words "the" and "is" would match almost anything, so a real scorer should ignore them. You'll do that in the challenge.

## Challenge

> 🎯 **Challenge:** Write `pickSkill(task, skills)` that returns the `name` of the skill whose description shares the most distinct keywords with the task (use the `keywords` helper). Skip skills with `disableModelInvocation: true`, since Claude can't pick those. Return `null` when no skill shares a keyword. On a tie, keep the one listed first.

```typescript starter
export type SkillInfo = { name: string; description: string; disableModelInvocation?: boolean }

const STOP = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "is", "it", "for", "with", "on", "when", "use", "my", "this", "that"])

export function keywords(text: string): Set<string> {
  const all = text.toLowerCase().match(/[a-z0-9]+/g) ?? []
  return new Set(all.filter((w) => !STOP.has(w)))
}

export function pickSkill(task: string, skills: SkillInfo[]): string | null {
  return skills[0]?.name ?? null
}

console.log(pickSkill("fix the failing login test", [
  { name: "frontend-design", description: "Builds UI components and pages" },
  { name: "debugging", description: "Finds the root cause of a bug or failing test" },
]))
```

```typescript solution
export type SkillInfo = { name: string; description: string; disableModelInvocation?: boolean }

const STOP = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "is", "it", "for", "with", "on", "when", "use", "my", "this", "that"])

export function keywords(text: string): Set<string> {
  const all = text.toLowerCase().match(/[a-z0-9]+/g) ?? []
  return new Set(all.filter((w) => !STOP.has(w)))
}

export function pickSkill(task: string, skills: SkillInfo[]): string | null {
  const wanted = keywords(task)
  let best: string | null = null
  let bestScore = 0
  for (const s of skills) {
    if (s.disableModelInvocation) continue
    const have = keywords(s.description)
    const score = [...wanted].filter((w) => have.has(w)).length
    if (score > bestScore) {
      best = s.name
      bestScore = score
    }
  }
  return best
}

console.log(pickSkill("fix the failing login test", [
  { name: "frontend-design", description: "Builds UI components and pages" },
  { name: "debugging", description: "Finds the root cause of a bug or failing test" },
]))
```

```typescript check
const pick = lesson.pickSkill as (task: string, skills: unknown[]) => string | null
const skills = [
  { name: "frontend-design", description: "Builds polished UI components, pages and layouts. Use when building or styling UI." },
  { name: "debugging", description: "Finds the root cause of a bug, error or failing test before any fix." },
  { name: "docs-lookup", description: "Fetches current library documentation. Use when asked how a library or API works." },
  { name: "deploy", description: "Deploys the app to production after a bug fix or feature", disableModelInvocation: true },
]

expect(pick("the checkout test is failing with an error", skills) === "debugging", `A failing test should pick debugging, got ${pick("the checkout test is failing with an error", skills)}`)
expect(pick("style the settings pages UI", skills) === "frontend-design", `UI work should pick frontend-design, got ${pick("style the settings pages UI", skills)}`)
expect(pick("how does the zod library parse dates", skills) === "docs-lookup", `A library question should pick docs-lookup, got ${pick("how does the zod library parse dates", skills)}`)
expect(pick("deploy to production", skills) === null, `deploy has disableModelInvocation, and nothing else matches: expected null, got ${pick("deploy to production", skills)}`)
expect(pick("bake a cake", skills) === null, `Nothing matches a cake: expected null, got ${pick("bake a cake", skills)}`)
expect(pick("the the the", skills) === null, `Stop words alone shouldn't match anything: expected null, got ${pick("the the the", skills)}`)
const tie = [
  { name: "first", description: "handles bug reports" },
  { name: "second", description: "handles bug triage" },
]
expect(pick("bug", tie) === "first", `On a tie keep the first skill, got ${pick("bug", tie)}`)
```

**Reference:** [Extend Claude with skills](https://code.claude.com/docs/en/skills#control-who-invokes-a-skill) in the Claude Code docs.
