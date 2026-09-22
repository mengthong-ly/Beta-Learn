---
title: Memory across sessions
section: 5 · Agentic Workflows
---

Every Claude Code session starts with a fresh context window. Anything you explained yesterday is gone unless it was written down. That's how agents remember: **in files**. A later session reads the files back. This lesson covers the two places Claude Code keeps them, and the **memory tool** that gives your own API agents the same ability.

## CLAUDE.md and auto memory

Claude Code has two memory systems, and both load at the start of every session:

| | CLAUDE.md files | Auto memory |
| --- | --- | --- |
| Who writes it | You | Claude |
| What it holds | Instructions and rules | Learnings and patterns |
| Scope | Project, user or organization | Per repository, shared across worktrees |
| Loaded | Every session | Every session (the first 200 lines or 25KB of `MEMORY.md`) |
| Use it for | Build commands, conventions, architecture | Your preferences, your corrections, context Claude can't get from the code |

CLAUDE.md files can live in several places. They're **concatenated**, not overridden, from the broadest scope to the most specific:

| Scope | Location |
| --- | --- |
| Managed policy | e.g. `/Library/Application Support/ClaudeCode/CLAUDE.md` on macOS |
| User | `~/.claude/CLAUDE.md` |
| Project | `./CLAUDE.md` or `./.claude/CLAUDE.md` (committed, shared with your team) |
| Local | `./CLAUDE.local.md` (personal, add it to `.gitignore`) |

Claude Code also loads CLAUDE.md files from every directory above the one you start in, ordered from the root down. So the instructions closest to your working directory are read **last**:

```typescript
function loadOrder(cwd: string, existing: Set<string>): string[] {
  const parts = cwd.split("/").filter(Boolean)
  const files: string[] = []
  for (let i = 0; i <= parts.length; i++) {
    const dir = "/" + parts.slice(0, i).join("/")
    for (const name of ["CLAUDE.md", "CLAUDE.local.md"]) {
      const file = (dir === "/" ? "" : dir) + "/" + name
      if (existing.has(file)) files.push(file)
    }
  }
  return files
}

const onDisk = new Set(["/repo/CLAUDE.md", "/repo/CLAUDE.local.md", "/repo/api/CLAUDE.md"])
console.log(loadOrder("/repo/api", onDisk))
```

A few more facts from the docs:

- `@path/to/file` inside a CLAUDE.md imports another file, up to four hops deep.
- Aim for under 200 lines per file. Longer files use more context and are followed less reliably.
- CLAUDE.md is context, not enforced configuration. To block an action whatever Claude decides, use a `PreToolUse` hook.
- **Auto memory** lives in `~/.claude/projects/<project>/memory/`. `MEMORY.md` is an index that's loaded every session. Topic files are read only when needed. Run `/memory` to browse or edit it all, or to switch auto memory off.

## The memory tool (Claude API)

Your own agents can remember things too. Add the **memory tool** to a Messages API request. Its `tools` entry is the whole configuration:

```typescript-snippet
const message = await anthropic.messages.create({
  model: "claude-opus-5",
  max_tokens: 2048,
  messages: [{ role: "user", content: "Help me respond to this customer service ticket." }],
  tools: [{ type: "memory_20250818", name: "memory" }],
})
```

The memory tool is **client-side**. Claude only *asks* for file operations, and your code carries them out on storage you control and returns a `tool_result`. It's the same agent loop from lesson 19. The paths all start with `/memories`, a prefix your handler maps onto real storage, such as a folder per user or keys in a database. When the tool is present, the API tells Claude to view its memory directory before doing anything else, and to assume its context could be reset at any moment.

The commands your handler must support:

| Command | Input | Does |
| --- | --- | --- |
| `view` | `path`, optional `view_range` | Lists a directory, or shows a file with line numbers |
| `create` | `path`, `file_text` | Creates a file |
| `str_replace` | `path`, `old_str`, `new_str` | Replaces text that appears exactly once |
| `insert` | `path`, `insert_line`, `insert_text` | Inserts after line `insert_line` (`0` = at the top) |
| `delete` | `path` | Deletes a file or directory (never `/memories` itself) |
| `rename` | `old_path`, `new_path` | Renames or moves; fails if the destination exists |

A call and your reply look like this:

```json
{ "type": "tool_use", "id": "toolu_01C4...", "name": "memory", "input": { "command": "view", "path": "/memories/notes.txt" } }
```

```json
{ "type": "tool_result", "tool_use_id": "toolu_01C4...", "content": "Here's the content of /memories/notes.txt with line numbers:\n     1\tHello World" }
```

A file view numbers lines from 1, right-aligned in 6 characters, with a tab before the text:

```typescript
function viewFile(path: string, text: string): string {
  const lines = text.split("\n").map((line, i) => `${String(i + 1).padStart(6)}\t${line}`)
  return `Here's the content of ${path} with line numbers:\n${lines.join("\n")}`
}

console.log(viewFile("/memories/notes.txt", "Hello World\nThis is line two"))
```

## Why files?

Files keep the context window small. The agent writes down what it learns and reads it back only when it needs it, instead of carrying everything all the time. The docs call this *just-in-time* context retrieval. Files also survive the end of a session and compaction, and you can open, edit, review and delete them like any other file.

That also makes them an attack surface. Your handler runs every path Claude sends, and the docs warn that `/memories/../../secrets.env` could reach files outside the memory directory. Validate every path in every command: it must stay inside `/memories`, contain no `..`, and not sneak `..` in through URL encoding such as `%2e%2e%2f`.

```typescript
function safePath(path: string): boolean {
  let decoded: string
  try {
    decoded = decodeURIComponent(path)
  } catch {
    return false
  }
  if (decoded.includes("\\") || decoded.split("/").includes("..")) return false
  return decoded === "/memories" || decoded.startsWith("/memories/")
}

for (const p of ["/memories/notes.txt", "/memories/../../secrets.env", "/memories/%2e%2e/x", "/memoriesX/a", "/etc/passwd"]) {
  console.log(p.padEnd(30), safePath(p) ? "ok" : "REJECTED")
}
```

> 💡 **Tip:** to report an error, return a `tool_result` with `is_error: true` and the message in `content`. Claude reads it and can try again.

## Challenge

> 🎯 **Challenge:** Implement `createMemory()`. It returns a handler that keeps files in a `Map` and answers each memory command with `{ content, is_error? }`. Use the documented messages: `File created successfully at: {path}`, `Error: File {path} already exists`, the numbered `view` output, `The memory file has been edited.` for `str_replace`, `The file {path} has been edited.` for `insert`, `Successfully deleted {path}` and `Successfully renamed {old_path} to {new_path}`. Reject any path outside `/memories` (including `..` and URL-encoded tricks) with `is_error: true`. Also reject deleting or renaming `/memories` itself.

```typescript starter
export type MemoryCommand =
  | { command: "view"; path: string }
  | { command: "create"; path: string; file_text: string }
  | { command: "str_replace"; path: string; old_str: string; new_str?: string }
  | { command: "insert"; path: string; insert_line: number; insert_text: string }
  | { command: "delete"; path: string }
  | { command: "rename"; old_path: string; new_path: string }
export type ToolResult = { content: string; is_error?: boolean }

export function createMemory(): (cmd: MemoryCommand) => ToolResult {
  const files = new Map<string, string>()
  return (cmd) => {
    // check paths, then handle each command
    return { content: "not implemented", is_error: true }
  }
}

const memory = createMemory()
console.log(memory({ command: "create", path: "/memories/notes.txt", file_text: "Acme prefers email" }))
console.log(memory({ command: "view", path: "/memories/notes.txt" }))
console.log(memory({ command: "view", path: "/memories/../../secrets.env" }))
```

```typescript solution
export type MemoryCommand =
  | { command: "view"; path: string }
  | { command: "create"; path: string; file_text: string }
  | { command: "str_replace"; path: string; old_str: string; new_str?: string }
  | { command: "insert"; path: string; insert_line: number; insert_text: string }
  | { command: "delete"; path: string }
  | { command: "rename"; old_path: string; new_path: string }
export type ToolResult = { content: string; is_error?: boolean }

const ROOT = "/memories"

function safePath(path: string): boolean {
  let decoded: string
  try {
    decoded = decodeURIComponent(path)
  } catch {
    return false
  }
  if (decoded.includes("\\") || decoded.split("/").includes("..")) return false
  return decoded === ROOT || decoded.startsWith(ROOT + "/")
}

const numbered = (text: string) =>
  text.split("\n").map((line, i) => `${String(i + 1).padStart(6)}\t${line}`).join("\n")

export function createMemory(): (cmd: MemoryCommand) => ToolResult {
  const files = new Map<string, string>()
  const fail = (content: string): ToolResult => ({ content, is_error: true })
  const under = (dir: string) => [...files.keys()].filter((f) => f.startsWith(dir + "/"))
  const exists = (p: string) => p === ROOT || files.has(p) || under(p).length > 0

  return (cmd) => {
    const paths = cmd.command === "rename" ? [cmd.old_path, cmd.new_path] : [cmd.path]
    const bad = paths.find((p) => !safePath(p))
    if (bad !== undefined) return fail(`Error: The path ${bad} is outside ${ROOT}`)

    switch (cmd.command) {
      case "view": {
        const text = files.get(cmd.path)
        if (text !== undefined) return { content: `Here's the content of ${cmd.path} with line numbers:\n${numbered(text)}` }
        if (!exists(cmd.path)) return fail(`The path ${cmd.path} does not exist. Please provide a valid path.`)
        const listing = under(cmd.path).map((f) => `${files.get(f)!.length}\t${f}`)
        return {
          content: `Here're the files and directories up to 2 levels deep in ${cmd.path}, excluding hidden items and node_modules:\n${listing.join("\n")}`,
        }
      }
      case "create":
        if (files.has(cmd.path)) return fail(`Error: File ${cmd.path} already exists`)
        files.set(cmd.path, cmd.file_text)
        return { content: `File created successfully at: ${cmd.path}` }
      case "str_replace": {
        const text = files.get(cmd.path)
        if (text === undefined) return fail(`Error: The path ${cmd.path} does not exist. Please provide a valid path.`)
        const count = text.split(cmd.old_str).length - 1
        if (count === 0)
          return fail(`No replacement was performed, old_str \`${cmd.old_str}\` did not appear verbatim in ${cmd.path}.`)
        if (count > 1) return fail(`No replacement was performed. Multiple occurrences of old_str \`${cmd.old_str}\`. Please ensure it is unique`)
        const edited = text.replace(cmd.old_str, () => cmd.new_str ?? "")
        files.set(cmd.path, edited)
        return { content: `The memory file has been edited.\n${numbered(edited)}` }
      }
      case "insert": {
        const text = files.get(cmd.path)
        if (text === undefined) return fail(`Error: The path ${cmd.path} does not exist`)
        const lines = text.split("\n")
        if (cmd.insert_line < 0 || cmd.insert_line > lines.length)
          return fail(`Error: Invalid \`insert_line\` parameter: ${cmd.insert_line}. It should be within the range of lines of the file: [0, ${lines.length}]`)
        lines.splice(cmd.insert_line, 0, cmd.insert_text.replace(/\n$/, ""))
        files.set(cmd.path, lines.join("\n"))
        return { content: `The file ${cmd.path} has been edited.` }
      }
      case "delete":
        if (cmd.path === ROOT) return fail(`Error: Cannot delete the ${ROOT} directory itself`)
        if (!exists(cmd.path)) return fail(`Error: The path ${cmd.path} does not exist`)
        files.delete(cmd.path)
        for (const f of under(cmd.path)) files.delete(f)
        return { content: `Successfully deleted ${cmd.path}` }
      case "rename": {
        if (cmd.old_path === ROOT) return fail(`Error: Cannot rename the ${ROOT} directory itself`)
        if (!exists(cmd.old_path)) return fail(`Error: The path ${cmd.old_path} does not exist`)
        if (exists(cmd.new_path)) return fail(`Error: The destination ${cmd.new_path} already exists`)
        for (const f of [cmd.old_path, ...under(cmd.old_path)]) {
          const text = files.get(f)
          if (text === undefined) continue
          files.delete(f)
          files.set(cmd.new_path + f.slice(cmd.old_path.length), text)
        }
        return { content: `Successfully renamed ${cmd.old_path} to ${cmd.new_path}` }
      }
    }
  }
}

const memory = createMemory()
console.log(memory({ command: "create", path: "/memories/notes.txt", file_text: "Acme prefers email" }))
console.log(memory({ command: "view", path: "/memories/notes.txt" }))
console.log(memory({ command: "view", path: "/memories/../../secrets.env" }))
```

```typescript check
const m = lesson.createMemory()
const ok = (r: { content: string; is_error?: boolean }, expected: string, what: string) =>
  expect(!r.is_error && r.content.startsWith(expected), `${what}: expected content starting with ${JSON.stringify(expected)}, got ${JSON.stringify(r)}`)
const err = (r: { content: string; is_error?: boolean }, what: string) =>
  expect(r.is_error === true, `${what} should return is_error: true, got ${JSON.stringify(r)}`)

ok(m({ command: "create", path: "/memories/prefs.txt", file_text: "Favorite color: blue\nEditor: vim" }), "File created successfully at: /memories/prefs.txt", "create")
err(m({ command: "create", path: "/memories/prefs.txt", file_text: "again" }), "Creating a file that already exists")

const view = m({ command: "view", path: "/memories/prefs.txt" })
expect(
  view.content === "Here's the content of /memories/prefs.txt with line numbers:\n     1\tFavorite color: blue\n     2\tEditor: vim",
  `view should number lines (6-wide, right-aligned, then a tab), got ${JSON.stringify(view.content)}`
)
const dir = m({ command: "view", path: "/memories" })
expect(!dir.is_error && dir.content.includes("/memories/prefs.txt"), `Viewing /memories should list /memories/prefs.txt, got ${JSON.stringify(dir)}`)
err(m({ command: "view", path: "/memories/missing.txt" }), "Viewing a missing file")

ok(m({ command: "str_replace", path: "/memories/prefs.txt", old_str: "blue", new_str: "green" }), "The memory file has been edited.", "str_replace")
expect(m({ command: "view", path: "/memories/prefs.txt" }).content.includes("Favorite color: green"), "After str_replace the file should say \"Favorite color: green\"")
err(m({ command: "str_replace", path: "/memories/prefs.txt", old_str: "purple", new_str: "x" }), "str_replace with text that isn't in the file")

ok(m({ command: "insert", path: "/memories/prefs.txt", insert_line: 0, insert_text: "# Preferences" }), "The file /memories/prefs.txt has been edited.", "insert")
expect(
  m({ command: "view", path: "/memories/prefs.txt" }).content.endsWith("     1\t# Preferences\n     2\tFavorite color: green\n     3\tEditor: vim"),
  "insert_line 0 should put the text before the first line"
)
err(m({ command: "insert", path: "/memories/prefs.txt", insert_line: 99, insert_text: "x" }), "insert_line past the end of the file")

ok(m({ command: "rename", old_path: "/memories/prefs.txt", new_path: "/memories/user/prefs.txt" }), "Successfully renamed /memories/prefs.txt to /memories/user/prefs.txt", "rename")
err(m({ command: "view", path: "/memories/prefs.txt" }), "The old path after a rename")
m({ command: "create", path: "/memories/other.txt", file_text: "x" })
err(m({ command: "rename", old_path: "/memories/other.txt", new_path: "/memories/user/prefs.txt" }), "Renaming onto an existing file")

ok(m({ command: "delete", path: "/memories/other.txt" }), "Successfully deleted /memories/other.txt", "delete")
err(m({ command: "delete", path: "/memories/other.txt" }), "Deleting a file that's already gone")
err(m({ command: "delete", path: "/memories" }), "Deleting the /memories directory itself")
err(m({ command: "rename", old_path: "/memories", new_path: "/memories2" }), "Renaming the /memories directory itself")

for (const p of ["/memories/../../secrets.env", "/etc/passwd", "/memoriesX/a.txt", "/memories/%2e%2e/%2e%2e/secrets.env", "memories/a.txt"]) {
  err(m({ command: "create", path: p, file_text: "x" }), `create at ${p}`)
  err(m({ command: "view", path: p }), `view at ${p}`)
}
err(m({ command: "rename", old_path: "/memories/user/prefs.txt", new_path: "/memories/../stolen.txt" }), "rename to a path outside /memories")
expect(m({ command: "view", path: "/memories/user/prefs.txt" }).content.includes("Editor: vim"), "A rejected rename must leave the file where it was")
```

**Reference:** [How Claude remembers your project](https://code.claude.com/docs/en/memory) in the Claude Code docs, and [Memory tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool) in the Claude Developer Platform docs.
