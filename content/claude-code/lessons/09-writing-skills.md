---
title: Writing good skills
section: 2 · Skills
---

Anthropic's skill authoring guide opens with one line worth remembering: good skills are **concise, well-structured, and tested with real usage**. This lesson walks through the practices that matter most, then you'll turn the description rules into a linter.

## Be concise

The context window is shared with the system prompt, the conversation and every other skill's metadata. Once `SKILL.md` loads, every token in it competes with all of that. The guide's default assumption is that **Claude is already very smart**, so only add what it doesn't know. For each paragraph, ask: does Claude really need this? Does it justify its token cost?

Explaining what a PDF is before showing the one library call to use is the guide's example of what *not* to do. Show the call; skip the lecture.

## Write the description for discovery

Claude may choose from 100+ skills using nothing but their descriptions, so the description carries the most weight. The guide's rules:

| Rule | Good | Avoid |
| --- | --- | --- |
| Third person | "Processes Excel files and generates reports" | "I can help you…", "You can use this to…" |
| Say **what** and **when** | "…Use when working with PDF files or when the user mentions PDFs, forms, or document extraction." | A description with no trigger context |
| Be specific, with key terms | "Analyze Excel spreadsheets, create pivot tables, generate charts" | "Helps with documents", "Processes data", "Does stuff with files" |

Why third person? The description is injected into the system prompt, and a mixed point of view can cause discovery problems.

For names, the guide suggests gerunds like `processing-pdfs` or `testing-code`, and warns against vague names like `helper`, `utils` or `tools`.

## Progressive disclosure

Treat `SKILL.md` as a table of contents. Keep the body **under 500 lines** and move detail into files Claude opens only when needed. Keep references **one level deep**: `SKILL.md` links to `reference.md`, but `reference.md` shouldn't send Claude on to a third file, because Claude may only preview nested files and miss information.

```typescript
const files: Record<string, string> = {
  "SKILL.md": "Basics here. See [advanced.md](advanced.md) and [reference.md](reference.md).",
  "advanced.md": "More detail. See [details.md](details.md).",
  "reference.md": "All the methods.",
  "details.md": "The actual information.",
}

const links = (text: string) => [...text.matchAll(/\]\(([^)]+\.md)\)/g)].map((m) => m[1])
const direct = new Set(links(files["SKILL.md"]))

for (const file of direct) {
  for (const nested of links(files[file] ?? "")) {
    if (!direct.has(nested)) console.log(`${nested} is two levels deep (via ${file})`)
  }
}
```

## Pick the right degree of freedom

Match how specific you are to how fragile the task is:

| Freedom | Looks like | Use when |
| --- | --- | --- |
| High | Plain text steps | Several approaches are valid; context decides |
| Medium | Pseudocode or a script with parameters | A preferred pattern exists, some variation is fine |
| Low | One exact script, "run exactly this" | Operations are fragile, consistency is critical |

The guide's analogy: a code review is an open field (give direction, trust Claude), a database migration is a narrow bridge with cliffs on both sides (exact steps, no improvising).

## Test with evaluations

The guide says to **build evaluations first**, before writing lots of documentation:

1. Run Claude on real tasks *without* the skill and note where it fails.
2. Write three scenarios that test those gaps.
3. Measure the baseline without the skill.
4. Write just enough instructions to pass.
5. Run the evals, compare with the baseline, refine.

```typescript
type Result = { scenario: string; withSkill: boolean; baseline: boolean }

const results: Result[] = [
  { scenario: "extract text from a 3-page PDF", withSkill: true, baseline: true },
  { scenario: "fill a PDF form", withSkill: true, baseline: false },
  { scenario: "merge two PDFs", withSkill: false, baseline: false },
]

const rate = (key: "withSkill" | "baseline") => results.filter((r) => r[key]).length / results.length
console.log(`baseline ${rate("baseline") * 100}% → with skill ${Math.round(rate("withSkill") * 100)}%`)
```

Test with every model you plan to use. What works for Opus may need more detail for Haiku. In Claude Code, the `skill-creator` plugin automates this with-and-without comparison.

> 💡 **Tip:** the guide also warns against time-sensitive text ("before August 2025, use the old API"), Windows-style paths (`scripts\helper.py`), and offering many alternative approaches when one default would do.

## Challenge

> 🎯 **Challenge:** Write `lintDescription(desc)` that returns a list of problem codes for a skill description: `empty` (blank), `too-long` (over 1,024 characters), `xml` (contains a tag like `<b>`), `first-person` (the word "I" or "my"), `second-person` (the word "you" or "your"), `no-when` (doesn't contain "use when", any case) and `vague` (fewer than 6 words). Return only `["empty"]` for a blank description.

```typescript starter
export function lintDescription(desc: string): string[] {
  const problems: string[] = []
  if (desc.length > 1024) problems.push("too-long")
  return problems
}

console.log(lintDescription("Extracts text and tables from PDF files. Use when working with PDFs."))
console.log(lintDescription("I can help you with documents"))
```

```typescript solution
export function lintDescription(desc: string): string[] {
  const text = desc.trim()
  if (!text) return ["empty"]
  const problems: string[] = []
  if (text.length > 1024) problems.push("too-long")
  if (/<[^>]+>/.test(text)) problems.push("xml")
  if (/\bI\b/.test(text) || /\bmy\b/i.test(text)) problems.push("first-person")
  if (/\b(you|your)\b/i.test(text)) problems.push("second-person")
  if (!/use when/i.test(text)) problems.push("no-when")
  if (text.split(/\s+/).length < 6) problems.push("vague")
  return problems
}

console.log(lintDescription("Extracts text and tables from PDF files. Use when working with PDFs."))
console.log(lintDescription("I can help you with documents"))
```

```typescript check
const lint = lesson.lintDescription as (d: string) => string[]
const has = (d: string, code: string) => lint(d).includes(code)
const good = "Extracts text and tables from PDF files, fills forms, and merges documents. Use when working with PDF files or when the user mentions PDFs."

expect(lint(good).length === 0, `The guide's PDF description should pass, got ${JSON.stringify(lint(good))}`)
expect(JSON.stringify(lint("   ")) === '["empty"]', `A blank description should give only ["empty"], got ${JSON.stringify(lint("   "))}`)
expect(has("Processes files. Use when asked. " + "x".repeat(1024), "too-long"), "Over 1,024 characters should report too-long")
expect(has("Formats <b>bold</b> text in reports. Use when asked to format.", "xml"), "A tag like <b> should report xml")
expect(has("I can help process Excel files. Use when the user has spreadsheets.", "first-person"), "'I can help' should report first-person")
expect(has("Process files in my favourite way. Use when the user asks for it.", "first-person"), "'my' should report first-person")
expect(has("You can use this to process Excel files. Use when needed.", "second-person"), "'You can use this' should report second-person")
expect(!has("Processes Excel files and generates reports. Use when analysing .xlsx files.", "second-person"), "Third person shouldn't report second-person")
expect(has("Processes Excel files and generates pivot tables and charts", "no-when"), "A description without 'use when' should report no-when")
expect(has("Helps with documents", "vague"), "'Helps with documents' should report vague")
expect(has("Processes data", "vague"), "'Processes data' should report vague")
expect(!has("Images are processed with care. Use when resizing photos.", "first-person"), "Words containing 'i' (like 'Images') aren't first person")
```

**Reference:** [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) in the Claude Platform docs.
