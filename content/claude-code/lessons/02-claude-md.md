---
title: CLAUDE.md memory
section: 1 · Claude Code Basics
---

Every Claude Code session starts with a fresh context window. It doesn't remember yesterday's chat. To give Claude facts it should know in **every** session, write them in a `CLAUDE.md` file. Claude Code loads it at the start of each session.

Add something to CLAUDE.md when you'd otherwise have to explain it again:

- Claude makes the same mistake a second time
- A code review catches something Claude should have known about this codebase
- You type the same correction you typed last session
- A new teammate would need the same context

Keep it to facts that matter in every session: build commands, conventions, project layout, "always do X" rules. A multi-step procedure, or a rule that only matters for one part of the codebase, belongs in a skill or a path-scoped rule instead.

## Where CLAUDE.md files live

There are four scopes. This table lists them in load order, from broadest to most specific:

| Scope | Location | Shared with |
| --- | --- | --- |
| Managed policy | macOS `/Library/Application Support/ClaudeCode/CLAUDE.md`, Linux `/etc/claude-code/CLAUDE.md` | Everyone in the organization |
| User | `~/.claude/CLAUDE.md` | Just you, in all projects |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Your team, through git |
| Local | `./CLAUDE.local.md` (add it to `.gitignore`) | Just you, in this project |

The files don't override each other. Claude Code **concatenates** them all into context. It walks from the filesystem root down to the folder you launched in, so the file closest to you is read last. In each folder, `CLAUDE.local.md` comes after `CLAUDE.md`:

```typescript
const cwd = "/home/you/repo/app"
const dirs = cwd.split("/").map((_, i, parts) => parts.slice(0, i + 1).join("/") || "/")
const order = dirs.flatMap((d) => [`${d}/CLAUDE.md`, `${d}/CLAUDE.local.md`])
const present = new Set(["/home/you/repo/CLAUDE.md", "/home/you/repo/app/CLAUDE.md", "/home/you/repo/app/CLAUDE.local.md"])
console.log(order.filter((f) => present.has(f)).join("\n"))
```

CLAUDE.md files in **subfolders** below where you launched don't load at the start. They load when Claude reads a file in that subfolder.

> 💡 **Tip:** CLAUDE.md is context, not enforced configuration. Claude reads it and tries to follow it. To *block* an action no matter what, use a permission rule or a hook (next lesson).

## Get started with `/init`

Run `/init` in a session and Claude analyzes your codebase and writes a starter CLAUDE.md with the build commands, test instructions and conventions it finds. If a CLAUDE.md already exists, `/init` suggests improvements instead of overwriting it. Then add what Claude can't discover on its own.

## Write instructions Claude follows

CLAUDE.md is loaded into the context window every session, so it costs tokens. The docs suggest staying **under 200 lines** per file. Write instructions that are concrete enough to verify:

| Vague | Concrete |
| --- | --- |
| Format code properly | Use 2-space indentation |
| Test your changes | Run `npm test` before committing |
| Keep files organized | API handlers live in `src/api/handlers/` |

If two rules contradict each other, Claude may pick either one, so review your files now and then. Block-level HTML comments (`<!-- note for humans -->`) are stripped before the file reaches Claude, so they cost no context.

## Import other files with `@path`

A CLAUDE.md can pull in other files with `@path/to/file`. The imported file is expanded in place at launch:

```markdown
See @README for the project overview and @package.json for the npm commands.

# Git workflow
- @docs/git-instructions.md
```

The rules for imports:

- Relative paths resolve from the **file that contains the import**, not from your working directory.
- Imported files can import other files, up to a **maximum depth of four hops**.
- Imports inside a Markdown code span or a fenced code block are skipped. Writing `` `@README` `` keeps the text literal.
- An import that points outside your project asks for your approval the first time.

Resolving a relative import means starting from the importing file's folder and walking the path segments:

```typescript
function resolvePath(from: string, target: string): string {
  const parts = from.split("/").slice(0, -1) // the importing file's folder
  for (const seg of target.split("/")) {
    if (seg === "..") parts.pop()
    else if (seg !== ".") parts.push(seg)
  }
  return parts.join("/")
}

console.log(resolvePath("docs/guide.md", "style.md"))
console.log(resolvePath("docs/guide.md", "../README.md"))
```

## Challenge

> 🎯 **Challenge:** Write `resolveImports(files, entry)`. Replace each `@path` (at the start of a line or after whitespace) with that file's own resolved content. Resolve paths relative to the importing file, follow at most **four** hops, leave missing files and imports inside `` `code spans` `` or fenced blocks untouched.

```typescript starter
function resolvePath(from: string, target: string): string {
  const parts = from.split("/").slice(0, -1)
  for (const seg of target.split("/")) {
    if (seg === "..") parts.pop()
    else if (seg !== ".") parts.push(seg)
  }
  return parts.join("/")
}

export function resolveImports(files: Record<string, string>, entry: string, depth = 0): string {
  return files[entry] ?? ""
}

const files = {
  "CLAUDE.md": "# Project\nRules: @docs/rules.md",
  "docs/rules.md": "Use 2 spaces. @style.md",
  "docs/style.md": "Semicolons: never.",
}
console.log(resolveImports(files, "CLAUDE.md"))
```

```typescript solution
function resolvePath(from: string, target: string): string {
  const parts = from.split("/").slice(0, -1)
  for (const seg of target.split("/")) {
    if (seg === "..") parts.pop()
    else if (seg !== ".") parts.push(seg)
  }
  return parts.join("/")
}

export function resolveImports(files: Record<string, string>, entry: string, depth = 0): string {
  const fence = "`".repeat(3)
  let inFence = false
  return (files[entry] ?? "")
    .split("\n")
    .map((line) => {
      if (line.trimStart().startsWith(fence)) {
        inFence = !inFence
        return line
      }
      if (inFence) return line
      // Odd parts of this split are `code spans`, so only even parts are scanned.
      return line
        .split(/(`[^`]*`)/)
        .map((part, i) =>
          i % 2
            ? part
            : part.replace(/(^|\s)@(\S+)/g, (match, before: string, p: string) => {
                const target = resolvePath(entry, p)
                if (depth >= 4 || !(target in files)) return match
                return before + resolveImports(files, target, depth + 1)
              })
        )
        .join("")
    })
    .join("\n")
}

const files = {
  "CLAUDE.md": "# Project\nRules: @docs/rules.md",
  "docs/rules.md": "Use 2 spaces. @style.md",
  "docs/style.md": "Semicolons: never.",
}
console.log(resolveImports(files, "CLAUDE.md"))
```

```typescript check
const r = lesson.resolveImports
const out = r({ "CLAUDE.md": "# Project\nRules: @docs/rules.md", "docs/rules.md": "Use 2 spaces. @style.md", "docs/style.md": "Semicolons: never." }, "CLAUDE.md")
expect(out === "# Project\nRules: Use 2 spaces. Semicolons: never.", `Imports should nest, with @style.md resolved next to docs/rules.md. Got: ${JSON.stringify(out)}`)

const chain: Record<string, string> = { "f0.md": "0 @f1.md", "f1.md": "1 @f2.md", "f2.md": "2 @f3.md", "f3.md": "3 @f4.md", "f4.md": "4 @f5.md", "f5.md": "5" }
const deep = r(chain, "f0.md")
expect(deep === "0 1 2 3 4 @f5.md", `Follow at most four hops: expected "0 1 2 3 4 @f5.md", got ${JSON.stringify(deep)}`)

const f = "`".repeat(3)
const lit = r({ "CLAUDE.md": `Keep \`@README\` literal\n${f}\n@README\n${f}\n@README`, "README": "Hi" }, "CLAUDE.md")
expect(lit === `Keep \`@README\` literal\n${f}\n@README\n${f}\nHi`, `Skip code spans and fenced blocks, import the rest. Got: ${JSON.stringify(lit)}`)

const miss = r({ "CLAUDE.md": "Mail me at me@example.com or see @missing.md" }, "CLAUDE.md")
expect(miss === "Mail me at me@example.com or see @missing.md", "Leave emails and imports of missing files unchanged")
```

**Reference:** [How Claude remembers your project](https://code.claude.com/docs/en/memory) in the Claude Code docs.
