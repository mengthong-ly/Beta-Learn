---
title: Hooks
section: 5 · Agentic Workflows
---

CLAUDE.md is advice. Claude reads it as context, and it usually follows it, but nothing *forces* it to. When a rule must hold every time, like "never touch `.env`" or "run the formatter after every edit", use a **hook**. A hook is a command (or HTTP endpoint, MCP tool, prompt or agent) that Claude Code runs automatically at a fixed point in its lifecycle. Your code runs, not the model's judgment.

## Events

Each hook listens for one **event**. These are the ones you'll reach for first:

| Event | When it fires | Can it block? |
| --- | --- | --- |
| `SessionStart` | A session begins or resumes | No |
| `UserPromptSubmit` | You submit a prompt, before Claude processes it | Yes: rejects the prompt |
| `PreToolUse` | Before a tool call runs | Yes: blocks the tool call |
| `PermissionRequest` | A tool call needs a permission decision | Through JSON only |
| `PostToolUse` | After a tool call succeeds | No, the tool already ran. It can give Claude feedback |
| `Notification` | Claude Code sends a notification | No |
| `SubagentStart` / `SubagentStop` | A subagent is spawned / finishes | `SubagentStop` can |
| `Stop` | Claude finishes responding | Yes: Claude keeps going |
| `PreCompact` | Before context compaction | Yes |
| `SessionEnd` | The session ends | No |

The hooks reference lists more, such as `PostToolUseFailure`, `InstructionsLoaded`, `ConfigChange` and `FileChanged`.

## Configuring a hook

Hooks live in settings files: `~/.claude/settings.json` (all your projects), `.claude/settings.json` (the project, committed), `.claude/settings.local.json` (the project, just you), managed policy settings, plugins, and skill or subagent frontmatter. The config has three levels: the **event**, a **matcher group** that filters when it fires, and the **hook handlers** that run.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/guard.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

For tool events, the matcher is tested against the tool name. How it's read depends on its characters:

| Matcher | Read as | Example |
| --- | --- | --- |
| `"*"`, `""` or omitted | Match everything | Every tool |
| Only letters, digits, `_`, `-`, spaces, `,` and `\|` | Exact names, separated by `\|` or `,` | `Edit\|Write` matches exactly those two |
| Anything else | An unanchored JavaScript regex | `mcp__memory__.*`; `Edit.*` also matches `NotebookEdit` |

Here are the same rules as code:

```typescript
function matches(matcher: string | undefined, toolName: string): boolean {
  if (matcher === undefined || matcher === "" || matcher === "*") return true
  if (/^[A-Za-z0-9_\- ,|]+$/.test(matcher)) {
    return matcher.split(/[|,]/).map((s) => s.trim()).includes(toolName)
  }
  return new RegExp(matcher).test(toolName) // unanchored
}

console.log(matches("Edit|Write", "Write"))      // true
console.log(matches("Edit|Write", "NotebookEdit")) // false: exact names
console.log(matches("Edit.*", "NotebookEdit"))    // true: regex, unanchored
console.log(matches("^Edit$", "NotebookEdit"))    // false: anchored
```

## What a command hook receives

A command hook gets the event as **JSON on stdin**. Every event has common fields like `session_id`, `cwd`, `permission_mode` and `hook_event_name`. `PreToolUse` adds `tool_name`, `tool_input` and `tool_use_id`. For a Bash call, it looks like this (trimmed):

```json
{
  "session_id": "abc123",
  "cwd": "/home/user/my-project",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": { "command": "npm test", "description": "Run test suite" },
  "tool_use_id": "toolu_01ABC123..."
}
```

For `Edit`, `Write` and `Read`, `tool_input.file_path` is always **absolute**. Claude Code expands `~` and relative paths first, so a hook can't be bypassed with a different spelling of the same path. On Windows the path uses backslashes, so normalize them before you compare.

## Answering: exit codes or JSON

A hook answers in one of two ways:

| Exit code | Meaning |
| --- | --- |
| `0` | Success. Claude Code parses stdout as JSON if it looks like a JSON object |
| `2` | **Blocking error**. For `PreToolUse` the tool call is blocked, and Claude sees your stderr as the reason |
| Anything else, `1` included | A non-blocking error. The action **still proceeds** |

> 💡 **Tip:** a policy hook must `exit 2`, not `exit 1`. Exit 1 is the usual Unix failure code, but to Claude Code it's a non-blocking error, so the tool call runs anyway.

For finer control, exit 0 and print JSON. `PreToolUse` puts its decision inside `hookSpecificOutput`:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Editing .env is not allowed"
  }
}
```

`permissionDecision` is one of `"allow"` (skip the prompt), `"deny"` (block, and Claude sees the reason), `"ask"` (prompt the user) or `"defer"`. When several hooks disagree, the precedence is `deny` > `defer` > `ask` > `allow`. The old top-level `decision: "approve" | "block"` is deprecated for `PreToolUse`. Other events, like `PostToolUse` and `Stop`, still use top-level `decision` and `reason`.

```typescript
type Decision = "allow" | "deny" | "ask" | "defer"
const rank: Record<Decision, number> = { deny: 4, defer: 3, ask: 2, allow: 1 }

function combine(decisions: Decision[]): Decision {
  return decisions.reduce((a, b) => (rank[b] > rank[a] ? b : a))
}

console.log(combine(["allow", "ask"]))          // ask
console.log(combine(["allow", "deny", "ask"]))  // deny
```

A real hook script is a small program that reads stdin, decides, then writes JSON or exits 2. In TypeScript it looks like this:

```typescript-snippet
const input = JSON.parse(await new Response(process.stdin as any).text())
if (input.tool_name === "Bash" && /\brm\s+-rf\b/.test(input.tool_input.command)) {
  console.error("Blocked: rm -rf is not allowed") // exit 2 sends stderr to Claude
  process.exit(2)
}
process.exit(0) // no decision: the normal permission flow applies
```

## Challenge

> 🎯 **Challenge:** Write `preToolUse(input)`. It gets the documented `PreToolUse` input. For a `Bash` command that runs `rm` with both the `-r` and `-f` flags (like `rm -rf` or `rm -fr`), or that force-pushes with `git push --force` or `git push -f`, return a `"deny"` decision in the documented `hookSpecificOutput` shape with a reason. Do the same for an `Edit` or `Write` whose file is named `.env` or starts with `.env.` (for example `.env.local`), on any platform. Return `undefined` for everything else.

```typescript starter
export type PreToolUseInput = {
  session_id: string
  cwd: string
  hook_event_name: "PreToolUse"
  tool_name: string
  tool_input: Record<string, unknown>
  tool_use_id: string
}
export type HookOutput = {
  hookSpecificOutput: {
    hookEventName: "PreToolUse"
    permissionDecision: "allow" | "deny" | "ask" | "defer"
    permissionDecisionReason?: string
  }
}

export function preToolUse(input: PreToolUseInput): HookOutput | undefined {
  // look at input.tool_name and input.tool_input
  return undefined
}

const base = { session_id: "abc123", cwd: "/home/user/app", hook_event_name: "PreToolUse" as const, tool_use_id: "toolu_1" }
console.log(JSON.stringify(preToolUse({ ...base, tool_name: "Bash", tool_input: { command: "rm -rf /" } })))
console.log(JSON.stringify(preToolUse({ ...base, tool_name: "Bash", tool_input: { command: "npm test" } })))
```

```typescript solution
export type PreToolUseInput = {
  session_id: string
  cwd: string
  hook_event_name: "PreToolUse"
  tool_name: string
  tool_input: Record<string, unknown>
  tool_use_id: string
}
export type HookOutput = {
  hookSpecificOutput: {
    hookEventName: "PreToolUse"
    permissionDecision: "allow" | "deny" | "ask" | "defer"
    permissionDecisionReason?: string
  }
}

const deny = (reason: string): HookOutput => ({
  hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
})

function isRecursiveForceRm(command: string): boolean {
  for (const match of command.matchAll(/\brm((?:\s+-[A-Za-z]+)+)/g)) {
    const flags = match[1].replace(/[\s-]/g, "")
    if (flags.includes("r") && flags.includes("f")) return true
  }
  return false
}

export function preToolUse(input: PreToolUseInput): HookOutput | undefined {
  if (input.tool_name === "Bash") {
    const command = String(input.tool_input.command ?? "")
    if (isRecursiveForceRm(command)) return deny(`Blocked: recursive force delete (${command})`)
    if (/\bgit\s+push\b.*\s(--force|-f)\b/.test(command)) return deny(`Blocked: force push (${command})`)
  }
  if (input.tool_name === "Edit" || input.tool_name === "Write") {
    const path = String(input.tool_input.file_path ?? "").replace(/\\/g, "/")
    const name = path.split("/").pop() ?? ""
    if (name === ".env" || name.startsWith(".env.")) return deny(`Blocked: ${name} holds secrets and must not be edited`)
  }
  return undefined
}

const base = { session_id: "abc123", cwd: "/home/user/app", hook_event_name: "PreToolUse" as const, tool_use_id: "toolu_1" }
console.log(JSON.stringify(preToolUse({ ...base, tool_name: "Bash", tool_input: { command: "rm -rf /" } })))
console.log(JSON.stringify(preToolUse({ ...base, tool_name: "Bash", tool_input: { command: "npm test" } })))
```

```typescript check
const base = { session_id: "abc123", cwd: "/home/user/app", hook_event_name: "PreToolUse" as const, tool_use_id: "toolu_1" }
const bash = (command: string) => lesson.preToolUse({ ...base, tool_name: "Bash", tool_input: { command, description: "x" } })
const edit = (tool_name: string, file_path: string) => lesson.preToolUse({ ...base, tool_name, tool_input: { file_path, content: "x" } })

function expectDeny(out: ReturnType<typeof lesson.preToolUse>, what: string) {
  expect(out !== undefined, `${what} should be denied, but preToolUse returned undefined`)
  const h = out!.hookSpecificOutput
  expect(h !== undefined && h.hookEventName === "PreToolUse", `${what}: return { hookSpecificOutput: { hookEventName: "PreToolUse", ... } }`)
  expect(h.permissionDecision === "deny", `${what}: permissionDecision should be "deny", got ${JSON.stringify(h.permissionDecision)}`)
  expect(typeof h.permissionDecisionReason === "string" && h.permissionDecisionReason.length > 0, `${what}: give a permissionDecisionReason so Claude knows why`)
}

expectDeny(bash("rm -rf /"), "rm -rf /")
expectDeny(bash("rm -fr build"), "rm -fr build")
expectDeny(bash("npm test && rm -r -f dist"), "rm -r -f after &&")
expectDeny(bash("git push --force origin main"), "git push --force")
expectDeny(bash("git push -f"), "git push -f")
expectDeny(edit("Edit", "/home/user/app/.env"), "Edit on .env")
expectDeny(edit("Write", "/home/user/app/.env.local"), "Write to .env.local")
expectDeny(edit("Write", "C:\\project\\.env"), "Write to a Windows .env path")

expect(bash("npm test") === undefined, "npm test is safe: return undefined")
expect(bash("rm notes.txt") === undefined, "Plain rm (no -r and -f) should be left to the normal permission flow")
expect(bash("git push origin main") === undefined, "A normal git push should not be denied")
expect(edit("Edit", "/home/user/app/.envrc") === undefined, ".envrc is not .env: return undefined")
expect(edit("Edit", "/home/user/app/src/env.ts") === undefined, "src/env.ts is a normal file: return undefined")
expect(lesson.preToolUse({ ...base, tool_name: "Read", tool_input: { file_path: "/home/user/app/README.md" } }) === undefined, "Read calls aren't part of this rule")
```

**Reference:** [Hooks reference](https://code.claude.com/docs/en/hooks) in the Claude Code docs.
