---
title: Where skills live
section: 2 · Skills
---

Where you save a skill decides which sessions load it. Put it in your home folder and you get it in every project. Commit it to a repo and everyone who works there gets it. Ship it in a plugin and anyone who installs the plugin gets it.

## The locations

| Location | Path | Loads in |
| --- | --- | --- |
| Enterprise | `.claude/skills/<skill-name>/SKILL.md` in the managed settings directory | Every user on machines where your organization deploys it |
| Personal | `~/.claude/skills/<skill-name>/SKILL.md` | All your projects on this machine |
| Project | `.claude/skills/<skill-name>/SKILL.md` | Sessions in this repository |
| Nested | `<subdir>/.claude/skills/<skill-name>/SKILL.md` | Sessions started in or below `<subdir>`, or once Claude works on files there |
| Additional directory | `.claude/skills/...` inside a folder passed with `--add-dir` | That session |
| Plugin | `<plugin>/skills/<skill-name>/SKILL.md` | Wherever the plugin is enabled, as `/plugin-name:skill-name` |
| claude.ai account | Skills enabled for your claude.ai account | Cowork and cloud sessions, and terminal sessions signed in with that account |

In a monorepo, Claude Code loads `.claude/skills/` from the folder you start in **and every parent** up to the repository root. So starting in `packages/frontend/` still picks up the root skills.

The older format still works too: a file at `.claude/commands/deploy.md` creates `/deploy` just like `.claude/skills/deploy/SKILL.md` does. Prefer the skill folder for new work, because it can hold supporting files.

## The command name

The command you type comes from **where the file is**, not from the `name` field (except in plugins):

```typescript
function commandFor(path: string): string {
  const skill = path.match(/\.claude\/skills\/([^/]+)\/SKILL\.md$/)
  if (skill) return `/${skill[1]}` // the folder name
  const cmd = path.match(/\.claude\/commands\/(.+)\.md$/)
  if (cmd) return "/" + cmd[1].replaceAll("/", ":") // subfolders become ":"
  const plugin = path.match(/^([^/]+)\/skills\/([^/]+)\/SKILL\.md$/)
  if (plugin) return `/${plugin[1]}:${plugin[2]}` // namespaced by plugin
  return "(not a skill)"
}

for (const p of [
  ".claude/skills/deploy-staging/SKILL.md",
  "~/.claude/skills/summarize-changes/SKILL.md",
  ".claude/commands/frontend/component.md",
  "my-plugin/skills/review/SKILL.md",
]) {
  console.log(p.padEnd(45), "→", commandFor(p))
}
```

## Seeing what you have

- Run **`/skills`** to open the skills menu. It lists your skills, and you can highlight one and press `Space` to change its visibility.
- Type **`/`** to see everything you can invoke by name.
- Ask Claude **"What skills are available?"**. The docs suggest this to check a skill actually loaded.
- Plugins show their skills in `/plugin` → **Installed**, in each plugin's detail view.

## Installing from a plugin marketplace

A **marketplace** is a catalog of plugins. Using one is two steps: add the catalog, then install the plugins you want. Claude Code adds the official Anthropic marketplace, `claude-plugins-official`, the first time you start it interactively.

```bash
# browse: run /plugin and open the Discover tab
/plugin marketplace add anthropics/claude-code      # add a marketplace from GitHub
/plugin install skill-creator@claude-plugins-official
/plugin list                                         # what's installed
/plugin disable plugin-name@marketplace-name
/plugin uninstall plugin-name@marketplace-name
```

When you install, you pick a scope: **user** (you, every project), **project** (everyone on this repo, written to `.claude/settings.json`) or **local** (you, this repo only).

> 💡 **Tip:** a plugin can bundle MCP servers, hooks and scripts as well as skills. Anthropic doesn't check what third-party plugins contain, so only install ones you trust.

## When two skills share a name

The docs spell out which one `/name` runs:

| Same name in | Which one runs |
| --- | --- |
| Two of enterprise, personal, project | Enterprise beats personal, personal beats project |
| One of those and a bundled skill (like `/code-review`) | Your skill replaces the bundled one |
| A skill and a `.claude/commands/` file | The skill |
| A project-root skill and a nested skill | Both load; the nested one is `/apps/web:deploy` |
| A plugin skill and any of the above | Both load, because plugin skills are namespaced |
| A synced claude.ai skill and any of the above | The other one; the synced skill is still `/anthropic-skills:<name>` |

So if you have `deploy` in both `~/.claude/skills/` and the project's `.claude/skills/`, `/deploy` runs **your personal one**. That surprises people: your own copy wins over the team's.

```typescript
const rank = { enterprise: 0, personal: 1, project: 2 } as const
type Level = keyof typeof rank

const found: { name: string; level: Level }[] = [
  { name: "deploy", level: "project" },
  { name: "deploy", level: "personal" },
]
const winner = found.sort((a, b) => rank[a.level] - rank[b.level])[0]
console.log(`/deploy runs the ${winner.level} skill`)
```

## Challenge

> 🎯 **Challenge:** Write `resolveSkills(found)` that returns the effective commands as an object mapping each command name (without the `/`) to the `from` of the skill it runs. Follow the table: enterprise over personal over project, any of those over a `command` file, any of those over a `bundled` skill, and plugin skills always load as `<plugin>:<name>`.

```typescript starter
export type Found =
  | { name: string; from: "enterprise" | "personal" | "project" | "command" | "bundled" }
  | { name: string; from: "plugin"; plugin: string }

export function resolveSkills(found: Found[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const f of found) result[f.name] = f.from // last one wins: not what the docs say!
  return result
}

console.log(
  resolveSkills([
    { name: "deploy", from: "personal" },
    { name: "deploy", from: "project" },
    { name: "review", from: "plugin", plugin: "pr-tools" },
  ])
)
```

```typescript solution
export type Found =
  | { name: string; from: "enterprise" | "personal" | "project" | "command" | "bundled" }
  | { name: string; from: "plugin"; plugin: string }

// Lower wins. The check never pits a command file against a bundled skill.
const rank: Record<string, number> = { enterprise: 0, personal: 1, project: 2, command: 3, bundled: 4 }

export function resolveSkills(found: Found[]): Record<string, string> {
  const result: Record<string, string> = {}
  for (const f of found) {
    if (f.from === "plugin") {
      result[`${f.plugin}:${f.name}`] = "plugin"
      continue
    }
    const current = result[f.name]
    if (current === undefined || rank[f.from] < rank[current]) result[f.name] = f.from
  }
  return result
}

console.log(
  resolveSkills([
    { name: "deploy", from: "personal" },
    { name: "deploy", from: "project" },
    { name: "review", from: "plugin", plugin: "pr-tools" },
  ])
)
```

```typescript check
const r = lesson.resolveSkills as (found: unknown[]) => Record<string, string>

const a = r([
  { name: "deploy", from: "project" },
  { name: "deploy", from: "personal" },
])
expect(a.deploy === "personal", `Personal beats project, whatever order they come in; got ${a.deploy}`)

const b = r([
  { name: "deploy", from: "personal" },
  { name: "deploy", from: "enterprise" },
  { name: "deploy", from: "project" },
])
expect(b.deploy === "enterprise", `Enterprise beats personal and project; got ${b.deploy}`)

const c = r([
  { name: "code-review", from: "bundled" },
  { name: "code-review", from: "project" },
])
expect(c["code-review"] === "project", `Your skill replaces a bundled one; got ${c["code-review"]}`)

const d = r([
  { name: "ship", from: "project" },
  { name: "ship", from: "command" },
])
expect(d.ship === "project", `A skill beats a .claude/commands file; got ${d.ship}`)

const e = r([
  { name: "review", from: "project" },
  { name: "review", from: "plugin", plugin: "pr-tools" },
])
expect(e.review === "project" && e["pr-tools:review"] === "plugin", `A plugin skill loads alongside as pr-tools:review; got ${JSON.stringify(e)}`)
expect(Object.keys(e).length === 2, `Expected exactly 2 commands, got ${JSON.stringify(Object.keys(e))}`)
```

**Reference:** [Extend Claude with skills](https://code.claude.com/docs/en/skills#where-skills-live) and [Discover and install prebuilt plugins](https://code.claude.com/docs/en/discover-plugins) in the Claude Code docs.
