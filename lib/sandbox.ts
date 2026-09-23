// OS sandbox around every local-runner process (docs/adr/0001-local-runner.md, check 5).
// Lesson code may come from a hosted page we don't control, and its output goes straight back
// to that page, so a readable file is a leaked file. Each run gets no network, no reads under
// $HOME except the toolchains, writes only to the paths its runner names, and a scrubbed env.
// Uses @anthropic-ai/sandbox-runtime: sandbox-exec on macOS, bubblewrap on Linux.
// Erasable TypeScript, no path aliases: Node runs this file directly (scripts/check-runner.ts).
import { execFile } from "node:child_process"
import { existsSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import path from "node:path"
import { promisify } from "node:util"

import { SandboxManager } from "@anthropic-ai/sandbox-runtime"

/** Only these reach a run; the server's own env (auth secrets, database URLs) never does. */
const ENV_KEYS = /^(PATH|HOME|USER|LOGNAME|LANG|LC_\w+|TERM|TMPDIR|ASDF_\w+|MISE_\w+|NVM_\w+|FLUTTER_ROOT|PUB_CACHE|JAVA_HOME)$/

export function cleanEnv(extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const env: Record<string, string> = {}
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined && ENV_KEYS.test(k)) env[k] = v
  // The Flutter SDK's dart/flutter wrappers call git; keep it off ~/.gitconfig, which is outside the sandbox.
  return { ...env, GIT_CONFIG_GLOBAL: "/dev/null", ...extra } as unknown as NodeJS.ProcessEnv
}

/** THONGLEARN_UNSANDBOXED=1 turns the sandbox off, but never while a hosted site may call us. */
export function sandboxDisabled() {
  if (process.env.THONGLEARN_UNSANDBOXED !== "1") return false
  if (process.env.RUNNER_ORIGINS)
    throw new Error("THONGLEARN_UNSANDBOXED=1 can't be combined with RUNNER_ORIGINS: a hosted site would run code unsandboxed.")
  return true
}

const which = (cmd: string) =>
  (process.env.PATH ?? "")
    .split(path.delimiter)
    .map((dir) => path.join(dir, cmd))
    .find((p) => existsSync(p))

const run = (cmd: string, args: string[]) =>
  promisify(execFile)(cmd, args, { env: cleanEnv(), timeout: 120_000 }).then((r) => r.stdout, () => "")

/**
 * The Flutter SDK's `dart` and `flutter` are shell scripts that write stamps into the SDK on
 * every call, and the SDK must stay read-only. So we ask them once, outside the sandbox (which
 * also runs their update step), for what they'd finally exec, and call that directly inside.
 */
const launchers: Record<string, string[]> = {}
let flutterRoot: string | undefined

async function findLaunchers() {
  flutterRoot = /"flutterRoot"\s*:\s*"([^"]+)"/.exec(await run("flutter", ["--version", "--machine"]))?.[1]
  if (flutterRoot)
    launchers.flutter = [
      "env",
      `FLUTTER_ROOT=${flutterRoot}`,
      path.join(flutterRoot, "bin/cache/dart-sdk/bin/dart"),
      `--packages=${path.join(flutterRoot, "packages/flutter_tools/.dart_tool/package_config.json")}`,
      path.join(flutterRoot, "bin/cache/flutter_tools.snapshot"),
    ]
  const dir = mkdtempSync(path.join(tmpdir(), "thonglearn-"))
  writeFileSync(path.join(dir, "where.dart"), "import 'dart:io';\nvoid main() => print(Platform.resolvedExecutable);\n")
  const dart = (await run("dart", [path.join(dir, "where.dart")])).trim()
  rmSync(dir, { recursive: true, force: true })
  if (dart) launchers.dart = [dart]
}

/**
 * Where each toolchain lives, so the sandbox can read it under a denied $HOME: the parent of
 * the tool's bin/ (~/.asdf for asdf shims, ~/.config/herd-lite, ~/.nvm/versions/node/vX…),
 * the Flutter SDK, and the Dart SDK behind the dart launcher.
 */
function toolchainRoots(): string[] {
  const bins = ["php", "dart", "flutter", "node", "composer"].map(which).filter((p): p is string => !!p)
  return [
    ...[...bins.map((p) => realpathSync(p)), ...(launchers.dart ?? [])].map((p) => path.dirname(path.dirname(p))),
    ...(flutterRoot ? [flutterRoot] : []),
  ]
}

/** Why this machine can't sandbox runs, or undefined when it can. */
export function sandboxProblem(): string | undefined {
  if (!SandboxManager.isSupportedPlatform() || process.platform === "win32")
    return `The local runner needs an OS sandbox, which isn't available on ${process.platform}.`
  const { errors } = SandboxManager.checkDependencies()
  if (errors.length) return `The local runner's sandbox is missing: ${errors.join("; ")}. On Linux: sudo apt install bubblewrap socat`
}

let ready: Promise<void> | undefined

/** Starts the sandbox once. Throws (so nothing runs) when this machine can't sandbox; the next run retries. */
export function initSandbox(runtimes: string): Promise<void> {
  ready ??= (async () => {
    const problem = sandboxProblem()
    if (problem) throw new Error(problem)
    const home = homedir()
    await findLaunchers()
    await SandboxManager.initialize({
      network: { allowedDomains: [], deniedDomains: [] },
      filesystem: {
        denyRead: [home],
        allowRead: [
          runtimes,
          tmpdir(),
          ...toolchainRoots(),
          path.join(home, ".pub-cache"), // Dart and Flutter packages
          path.join(home, ".tool-versions"), // asdf picks versions from here
          ...(process.env.THONGLEARN_SANDBOX_READ ?? "").split(path.delimiter).filter(Boolean),
        ],
        allowWrite: [],
        denyWrite: [],
      },
    })
  })().catch((e) => {
    ready = undefined
    throw e
  })
  return ready
}

const quote = (s: string) => `'${s.replaceAll("'", `'\\''`)}'`

let wrapping: Promise<unknown> = Promise.resolve()

/**
 * The argv that runs `cmd args` inside the sandbox, writable only at `write`. The first write
 * path doubles as TMPDIR (srt's default, /tmp/claude, is shared and may not exist).
 * `localNetwork` lets it listen on and connect to localhost: `flutter test` talks to its test
 * device over a loopback socket. srt only has that as a global switch, so wraps take turns.
 */
export function sandboxed(cmd: string, args: string[], write: string[], localNetwork = false): Promise<string[]> {
  const wrap = async () => {
    const config = SandboxManager.getConfig()!
    const command = ["env", `TMPDIR=${write[0]}`, ...(launchers[cmd] ?? [cmd]), ...args].map(quote).join(" ")
    if (localNetwork) SandboxManager.updateConfig({ ...config, network: { ...config.network, allowLocalBinding: true } })
    try {
      const { argv } = await SandboxManager.wrapWithSandboxArgv(command, undefined, {
        filesystem: { ...config.filesystem, allowWrite: write },
      })
      return argv
    } finally {
      if (localNetwork) SandboxManager.updateConfig(config)
    }
  }
  const next = wrapping.then(wrap, wrap)
  wrapping = next.catch(() => undefined)
  return next
}
