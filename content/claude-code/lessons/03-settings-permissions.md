---
title: Settings & permissions
section: 1 · Claude Code Basics
---

CLAUDE.md tells Claude what you *want*. **Settings** tell Claude Code what is *allowed*. Settings are enforced by Claude Code itself, not by the model, so a permission rule holds even if Claude "forgets" an instruction.

The most common use is permissions: letting `npm test` run without a prompt every time, or making sure Claude never reads your `.env` file.

## The four settings scopes

Settings are JSON files. Each one has a scope, which is who it affects:

| Scope | File | Affects | Use it for |
| --- | --- | --- | --- |
| User | `~/.claude/settings.json` | You, in every project | Personal preferences, your own permission rules |
| Shared project | `.claude/settings.json` | Everyone in the project (commit it) | Team permissions, hooks, plugins |
| Project local | `.claude/settings.local.json` | You, in this project only (kept out of git) | Personal overrides, trying things out |
| Managed | `managed-settings.json` and other managed sources | Everyone your organization deploys it to | Security policy that nobody can override |

When the same key is set in several places, the **highest** level wins. From highest to lowest:

1. Managed settings
2. Command line arguments (for one session)
3. Project local (`.claude/settings.local.json`)
4. Shared project (`.claude/settings.json`)
5. User (`~/.claude/settings.json`)

There's one important exception: **lists merge**. If `permissions.allow` appears in two files, Claude Code combines the two lists instead of picking one. Each file adds rules without removing another file's rules.

```typescript
type Settings = { model?: string; allow?: string[] }
// Highest precedence first.
const layers: [string, Settings][] = [
  ["local", { allow: ["Bash(npm run *)"] }],
  ["project", { model: "opus", allow: ["Bash(git commit *)"] }],
  ["user", { model: "sonnet", allow: ["Read"] }],
]
const model = layers.find(([, s]) => s.model)?.[1].model
const allow = layers.flatMap(([, s]) => s.allow ?? [])
console.log("model:", model)
console.log("allow:", allow.join(", "))
```

The project's `model` beats the user's, but all three `allow` lists survive.

> 💡 **Tip:** you don't need to write rules by hand. Answer a prompt with "Yes, and don't ask again" and Claude Code saves the rule to `.claude/settings.local.json`. Run `/permissions` to see every rule and which file it came from.

## Allow, ask and deny

Permission rules live under `permissions` in three lists:

- **allow**: Claude Code uses the tool without asking.
- **ask**: Claude Code asks you every time.
- **deny**: Claude Code blocks the tool.

```json
{
  "permissions": {
    "allow": ["Bash(npm run *)", "Bash(git commit *)"],
    "ask": ["Bash(git push *)"],
    "deny": ["Read(./.env)", "Read(./secrets/**)"]
  }
}
```

Rules are evaluated in a fixed order: **deny, then ask, then allow**. The first match in that order decides. How specific a rule is doesn't matter, so a broad deny like `Bash(aws *)` blocks `aws s3 ls` even when `Bash(aws s3 ls)` is in `allow`. An allow rule can't carve an exception out of a deny rule. If no rule matches, the current permission mode decides.

## Rule syntax

A rule is `Tool` or `Tool(specifier)`. A bare tool name matches every use of the tool, and `Bash(*)` means the same as `Bash`.

| Rule | Matches |
| --- | --- |
| `Bash` | Every Bash command |
| `Bash(npm run build)` | Exactly `npm run build` |
| `Read(./.env)` | Reading the `.env` file in the current directory |
| `WebFetch(domain:example.com)` | Fetches to example.com |

In a Bash rule, `*` matches any text, spaces included. Three details from the docs matter:

| You write | Matches | Doesn't match |
| --- | --- | --- |
| `Bash(npm run *)` | `npm run build`, `npm run test --watch`, `npm run` | `npm install` |
| `Bash(ls *)` | `ls -la`, `ls` | `lsof` |
| `Bash(ls*)` | `ls -la`, `lsof` | |

- A trailing ` *` (space, then star) also matches the bare command, but only when it's the rule's only wildcard.
- The space before a trailing `*` is part of the rule. That's why `Bash(ls *)` doesn't match `lsof`.
- `Bash(ls:*)` is the same as `Bash(ls *)`. The `:*` form only works at the end.

Put the `*` after the subcommand: `Bash(git log *)` allows only `git log`, but `Bash(git *)` allows every git command, `git push` included.

Turning a pattern into a regular expression is the core of a matcher. Escape everything, then let `*` become `.*`:

```typescript
const toRegex = (pattern: string) =>
  new RegExp("^" + pattern.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$")

console.log(toRegex("npm run *").test("npm run test --watch"))
console.log(toRegex("npm run *").test("npm install"))
console.log(toRegex("ls*").test("lsof"))
```

`Read` and `Edit` rules use gitignore-style path patterns: `Read(./secrets/**)` covers a whole folder, `~/path` starts at your home folder, and `//path` is an absolute path.

## Challenge

> 🎯 **Challenge:** Write `matches(rule, call)` using the documented wildcard rules. Then write `decide(scopes, call)`: merge the rule lists from every scope, check `deny`, then `ask`, then `allow`, and return the first kind that matches, or `"default"` when none do. (Paths are compared as plain text here, a simplification of the real gitignore matching.)

```typescript starter
export type Call = { tool: string; arg?: string }
export type Rules = { allow?: string[]; ask?: string[]; deny?: string[] }

export function matches(rule: string, call: Call): boolean {
  return rule === call.tool || rule === `${call.tool}(${call.arg})`
}

export function decide(scopes: Rules[], call: Call): "allow" | "ask" | "deny" | "default" {
  for (const kind of ["allow", "ask", "deny"] as const) {
    if (scopes.some((s) => (s[kind] ?? []).some((r) => matches(r, call)))) return kind
  }
  return "default"
}

const user: Rules = { allow: ["Bash(aws s3 ls)"] }
const project: Rules = { deny: ["Bash(aws *)"] }
console.log(decide([user, project], { tool: "Bash", arg: "aws s3 ls" }))
```

```typescript solution
export type Call = { tool: string; arg?: string }
export type Rules = { allow?: string[]; ask?: string[]; deny?: string[] }

const escape = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")

export function matches(rule: string, call: Call): boolean {
  const m = /^([^(]+)(?:\((.*)\))?$/.exec(rule)
  if (!m || m[1] !== call.tool) return false
  let spec = m[2]
  if (spec === undefined || spec === "*") return true
  if (spec.endsWith(":*")) spec = spec.slice(0, -2) + " *"
  const arg = call.arg ?? ""
  // "ls *" also matches a bare "ls", when that trailing * is the only wildcard.
  if (spec.endsWith(" *") && spec.indexOf("*") === spec.length - 1 && arg === spec.slice(0, -2)) return true
  return new RegExp("^" + spec.split("*").map(escape).join(".*") + "$").test(arg)
}

export function decide(scopes: Rules[], call: Call): "allow" | "ask" | "deny" | "default" {
  for (const kind of ["deny", "ask", "allow"] as const) {
    if (scopes.some((s) => (s[kind] ?? []).some((r) => matches(r, call)))) return kind
  }
  return "default"
}

const user: Rules = { allow: ["Bash(aws s3 ls)"] }
const project: Rules = { deny: ["Bash(aws *)"] }
console.log(decide([user, project], { tool: "Bash", arg: "aws s3 ls" }))
```

```typescript check
const m = lesson.matches
const bash = (arg: string) => ({ tool: "Bash", arg })
expect(m("Bash(npm run *)", bash("npm run test --watch")), "Bash(npm run *) should match 'npm run test --watch'")
expect(!m("Bash(npm run *)", bash("npm install")), "Bash(npm run *) should NOT match 'npm install'")
expect(m("Bash(ls *)", bash("ls")), "Bash(ls *) should match the bare command 'ls'")
expect(!m("Bash(ls *)", bash("lsof")), "Bash(ls *) should NOT match 'lsof' (the space is part of the rule)")
expect(m("Bash(ls*)", bash("lsof")), "Bash(ls*) should match 'lsof'")
expect(m("Bash(git log:*)", bash("git log --oneline")), "Bash(git log:*) should work like Bash(git log *)")
expect(!m("Bash(* --help *)", bash("npm --help")), "Bash(* --help *) should NOT match 'npm --help' (the trailing * isn't the only wildcard)")
expect(m("Bash", bash("rm -rf dist")) && m("Bash(*)", bash("rm -rf dist")), "Bash and Bash(*) should match every Bash command")
expect(!m("Read", bash("ls")), "A Read rule should never match a Bash call")

const d = lesson.decide
const user = { allow: ["Bash(aws s3 ls)", "Bash(git *)"] }
const project = { deny: ["Bash(aws *)", "Read(./.env)"], ask: ["Bash(git push *)"] }
expect(d([user, project], bash("aws s3 ls")) === "deny", "deny beats allow: Bash(aws *) should block 'aws s3 ls'")
expect(d([user, project], bash("git push origin main")) === "ask", "ask beats allow: 'git push origin main' should be 'ask'")
expect(d([user, project], bash("git status")) === "allow", "'git status' should be allowed by Bash(git *) from the user scope")
expect(d([user, project], { tool: "Read", arg: "./.env" }) === "deny", "Read(./.env) should be denied")
expect(d([user, project], { tool: "Edit", arg: "src/a.ts" }) === "default", "With no matching rule, return 'default'")
```

**Reference:** [Configure permissions](https://code.claude.com/docs/en/permissions) and [Settings files and precedence](https://code.claude.com/docs/en/settings) in the Claude Code docs.
