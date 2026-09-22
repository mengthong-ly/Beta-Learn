---
title: Anatomy of a skill
section: 2 · Skills
---

A **skill** is a folder with a `SKILL.md` file in it. The file holds instructions, and Claude adds them to its toolkit. Claude uses a skill on its own when it looks relevant, or you run it yourself by typing `/skill-name`.

When should you write one? The Claude Code docs give a simple test: you keep pasting the same instructions, checklist or multi-step procedure into chat, or a section of `CLAUDE.md` has turned into a procedure rather than a fact. Unlike `CLAUDE.md`, a skill's body only loads when it's used, so a long skill costs almost nothing until you need it.

## The SKILL.md file

`SKILL.md` has two parts: **YAML frontmatter** between `---` markers, then **markdown** with the instructions Claude follows.

```markdown
---
name: summarize-changes
description: Summarizes uncommitted changes and flags anything risky. Use when the user asks what changed, wants a commit message, or asks to review their diff.
---

## Instructions

Summarize the changes in two or three bullet points, then list any risks
you notice, such as missing error handling or tests that need updating.
```

Claude Code only reads frontmatter when the opening `---` is the **first line** of the file. Anything else and the whole file, markers included, is treated as plain skill content.

Here's that split done by hand, the same way a loader would see it:

```typescript
const md = `---
name: summarize-changes
description: Summarizes uncommitted changes. Use when the user asks what changed.
---

## Instructions
Summarize the diff in two or three bullets.`

const lines = md.split("\n")
const end = lines.indexOf("---", 1) // the closing marker
const meta = lines.slice(1, end)
const body = lines.slice(end + 1).join("\n").trim()

console.log(meta)
console.log(body.split("\n")[0])
```

## The frontmatter fields

In Claude Code **every field is optional**, and only `description` is recommended: without it, Claude Code uses the first non-empty line of the body. The most common fields:

| Field | What it does |
| --- | --- |
| `name` | Display name in skill listings. Defaults to the folder name. The command you type still comes from the folder name. |
| `description` | What the skill does and when to use it. Claude reads this to decide when to load the skill. |
| `when_to_use` | Extra trigger phrases, appended to `description` in the listing. |
| `disable-model-invocation` | `true` means only you can run it with `/name`. |
| `user-invocable` | `false` hides it from the `/` menu, so only Claude can use it. |
| `allowed-tools` | Tools Claude may use without asking, for the turn that runs the skill. |
| `context` / `agent` | `context: fork` runs the skill in a subagent of the type named in `agent`. |

Claude Code documents more (`argument-hint`, `arguments`, `model`, `effort`, `paths`, `hooks`, and others), but those are Claude Code extensions.

### Stricter rules outside Claude Code

Skills follow the open [Agent Skills](https://agentskills.io) standard. If you upload a skill to claude.ai or send it through the Skills API, only six fields are allowed: `name`, `description`, `license`, `compatibility`, `metadata` and `allowed-tools`. Any other key is a hard error:

```
Unexpected key(s) in SKILL.md frontmatter: argument-hint. Allowed properties are: allowed-tools, compatibility, description, license, metadata, name
```

On those paths `name` and `description` are **required**, with these limits:

| Field | Rules |
| --- | --- |
| `name` | At most 64 characters. Only lowercase letters, numbers and hyphens. No XML tags. Can't contain the reserved words `anthropic` or `claude`. |
| `description` | Must be non-empty. At most 1,024 characters. No XML tags. |

> 💡 **Tip:** write frontmatter that follows these rules even for local skills. It loads in Claude Code unchanged, and you can share it anywhere later.

## Supporting files

A skill folder can hold more than `SKILL.md`: reference docs, examples, scripts. This keeps `SKILL.md` short and lets Claude open the details only when it needs them.

```
my-skill/
├── SKILL.md        (required: overview and navigation)
├── reference.md    (detailed API docs, loaded when needed)
├── examples.md     (usage examples, loaded when needed)
└── scripts/
    └── helper.py   (executed, not loaded)
```

Link each file from `SKILL.md` and say what's in it, so Claude knows when to open it. The docs suggest keeping `SKILL.md` under 500 lines.

## Progressive disclosure

Skills load in three levels. That's why you can install many of them without filling the context window:

| Level | When it loads | Cost | What |
| --- | --- | --- | --- |
| 1 · Metadata | Always, at startup | ~100 tokens per skill | `name` and `description` |
| 2 · Instructions | When the skill is triggered | Under 5k tokens | The `SKILL.md` body |
| 3 · Resources | As needed | None until accessed | Bundled files; scripts run and only their output enters context |

A quick model of what that means for twenty installed skills when one of them is used:

```typescript
type Skill = { name: string; metaTokens: number; bodyTokens: number }

const skills: Skill[] = Array.from({ length: 20 }, (_, i) => ({
  name: `skill-${i}`,
  metaTokens: 100,
  bodyTokens: 3000,
}))

const eager = skills.reduce((sum, s) => sum + s.metaTokens + s.bodyTokens, 0)
const lazy = skills.reduce((sum, s) => sum + s.metaTokens, 0) + skills[0].bodyTokens

console.log(`load everything: ${eager} tokens`)
console.log(`progressive:     ${lazy} tokens`)
```

## Challenge

> 🎯 **Challenge:** Write `validateSkill(md)` that checks a `SKILL.md` against the upload rules above and returns a list of problem codes (empty when it's valid). Use exactly these codes: `no-frontmatter`, `name-missing`, `name-too-long`, `name-format`, `name-xml`, `name-reserved`, `description-missing`, `description-too-long`, `description-xml`, and `unknown-key:<key>` for a key outside the six allowed ones.

```typescript starter
const ALLOWED = ["name", "description", "license", "compatibility", "metadata", "allowed-tools"]

/** Reads simple `key: value` frontmatter. Returns null when there is none. */
function parseFrontmatter(md: string): Record<string, string> | null {
  const lines = md.split("\n")
  if (lines[0] !== "---") return null
  const end = lines.indexOf("---", 1)
  if (end === -1) return null
  const meta: Record<string, string> = {}
  for (const line of lines.slice(1, end)) {
    const i = line.indexOf(":")
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return meta
}

export function validateSkill(md: string): string[] {
  const problems: string[] = []
  // your checks here
  return problems
}

console.log(validateSkill("---\nname: pdf-processing\ndescription: Extracts text from PDFs. Use when working with PDF files.\n---\n# PDF"))
console.log(validateSkill("---\nname: Claude_Helper\n---\n"))
```

```typescript solution
const ALLOWED = ["name", "description", "license", "compatibility", "metadata", "allowed-tools"]

/** Reads simple `key: value` frontmatter. Returns null when there is none. */
function parseFrontmatter(md: string): Record<string, string> | null {
  const lines = md.split("\n")
  if (lines[0] !== "---") return null
  const end = lines.indexOf("---", 1)
  if (end === -1) return null
  const meta: Record<string, string> = {}
  for (const line of lines.slice(1, end)) {
    const i = line.indexOf(":")
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return meta
}

const XML = /<[^>]+>/

export function validateSkill(md: string): string[] {
  const meta = parseFrontmatter(md)
  if (!meta) return ["no-frontmatter"]
  const problems: string[] = []

  const name = meta.name ?? ""
  if (!name) problems.push("name-missing")
  else {
    if (name.length > 64) problems.push("name-too-long")
    if (!/^[a-z0-9-]+$/.test(name)) problems.push("name-format")
    if (XML.test(name)) problems.push("name-xml")
    if (/anthropic|claude/i.test(name)) problems.push("name-reserved")
  }

  const description = meta.description ?? ""
  if (!description) problems.push("description-missing")
  else {
    if (description.length > 1024) problems.push("description-too-long")
    if (XML.test(description)) problems.push("description-xml")
  }

  for (const key of Object.keys(meta)) {
    if (!ALLOWED.includes(key)) problems.push(`unknown-key:${key}`)
  }
  return problems
}

console.log(validateSkill("---\nname: pdf-processing\ndescription: Extracts text from PDFs. Use when working with PDF files.\n---\n# PDF"))
console.log(validateSkill("---\nname: Claude_Helper\n---\n"))
```

```typescript check
const v = lesson.validateSkill as (md: string) => string[]
const skill = (front: string) => `---\n${front}\n---\n\n# Body`
const good = skill("name: pdf-processing\ndescription: Extracts text from PDFs. Use when working with PDF files.")

expect(v(good).length === 0, `A valid skill should have no problems, got ${JSON.stringify(v(good))}`)
expect(v("# Just markdown").includes("no-frontmatter"), "A file that doesn't start with --- should report no-frontmatter")
expect(v(skill("description: Does a thing. Use when asked.")).includes("name-missing"), "A missing name should report name-missing")
expect(v(skill("name: " + "a".repeat(65) + "\ndescription: x")).includes("name-too-long"), "A 65-character name should report name-too-long")
expect(v(skill("name: " + "a".repeat(64) + "\ndescription: x")).length === 0, "A 64-character name is still allowed")
expect(v(skill("name: PDF_Tools\ndescription: x")).includes("name-format"), "Uppercase or underscores should report name-format")
expect(v(skill("name: <b>pdf</b>\ndescription: x")).includes("name-xml"), "An XML tag in the name should report name-xml")
expect(v(skill("name: claude-tools\ndescription: x")).includes("name-reserved"), "A name containing 'claude' should report name-reserved")
expect(v(skill("name: anthropic-helper\ndescription: x")).includes("name-reserved"), "A name containing 'anthropic' should report name-reserved")
expect(v(skill("name: pdf\ndescription:")).includes("description-missing"), "An empty description should report description-missing")
expect(v(skill("name: pdf\ndescription: " + "x".repeat(1025))).includes("description-too-long"), "A 1,025-character description should report description-too-long")
expect(v(skill("name: pdf\ndescription: Use <tool> for PDFs")).includes("description-xml"), "An XML tag in the description should report description-xml")
expect(v(skill("name: pdf\ndescription: x\nargument-hint: [file]")).includes("unknown-key:argument-hint"), "argument-hint isn't allowed for upload: report unknown-key:argument-hint")
expect(v(skill("name: pdf\ndescription: x\nlicense: MIT")).length === 0, "license is one of the six allowed keys")
```

**Reference:** [Extend Claude with skills](https://code.claude.com/docs/en/skills) in the Claude Code docs, and [Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview#skill-structure) in the Claude Platform docs.
