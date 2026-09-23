// What the /setup page shows: whether each local course can run here, and the caches runs leave behind.
// Used by app/api/runtime. Node stdlib only, erasable TypeScript only (scripts/check-runner.ts imports it).
import { existsSync } from "node:fs"
import { readdir, rm, truncate } from "node:fs/promises"
import { homedir, tmpdir } from "node:os"
import path from "node:path"

import { RUNTIMES, runProcess, serially, toolStatus, type LocalCourse } from "./local-runner.ts"

/** True when the first x.y.z in `version` is ≥ min (and < below, if given). */
export function atLeast(version: string | undefined, min: string, below?: string) {
  const m = version?.match(/(\d+)\.(\d+)(?:\.(\d+))?/)
  if (!m) return false
  const v = [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)]
  const cmp = (to: string) => {
    const t = to.split(".").map(Number)
    for (let i = 0; i < 3; i++) if (v[i] !== (t[i] ?? 0)) return v[i] - (t[i] ?? 0)
    return 0
  }
  return cmp(min) >= 0 && (below === undefined || cmp(below) < 0)
}

export type Item = { name: string; found?: string; need: string; ok: boolean; sandbox?: boolean }
export type Requirement = { course: LocalCourse; ready: boolean; items: Item[] }

const has = (...p: string[]) => existsSync(path.join(RUNTIMES, ...p))
const version = (s: string | undefined) => s?.match(/\d+\.\d+(?:\.\d+)?/)?.[0]

export async function requirements(): Promise<Requirement[]> {
  const t = await toolStatus()
  const tool = (name: string, raw: string | undefined, need: string, min: string, below?: string): Item => ({
    name,
    found: version(raw),
    need,
    ok: atLeast(raw, min, below),
  })
  const sandbox = (name: string, ok: boolean): Item => ({
    name,
    found: ok ? "installed" : undefined,
    need: "npm run setup:runtimes",
    ok,
    sandbox: true,
  })
  const rows: [LocalCourse, Item[]][] = [
    // The PHP course teaches 8.5 features (the pipe operator).
    ["php", [tool("PHP", t.php, "≥ 8.5", "8.5")]],
    [
      "laravel",
      [
        tool("PHP", t.php, "8.3 – 8.5", "8.3", "8.6"),
        sandbox("Laravel 13 sandbox", t.laravel && has("laravel/vendor")),
      ],
    ],
    [
      "typescript",
      [tool("Node.js", t.node, "≥ 20.9", "20.9"), tool("TypeScript (tsc)", t.tsc, "7.x", "7", "8")],
    ],
    [
      "claude-code",
      [
        tool("Node.js", t.node, "≥ 20.9", "20.9"),
        tool("TypeScript (tsc)", t.tsc, "7.x", "7", "8"),
        sandbox("MCP SDK in the TypeScript sandbox", has("typescript/node_modules/@modelcontextprotocol/sdk")),
      ],
    ],
    // Any compiler with C++23 support: Apple clang 15+, clang 16+ or g++ 13+.
    ["cpp", [{ name: "C++ compiler (c++)", found: version(t.cpp), need: "clang 15+ / g++ 13+", ok: !!t.cpp }]],
    ["dart", [tool("Dart", t.dart, "≥ 3.13", "3.13")]],
    [
      "flutter",
      [
        tool("Flutter", t.flutter, "≥ 3.47", "3.47"),
        sandbox("Flutter sandbox", t.flutterProject && has("flutter/.dart_tool")),
      ],
    ],
  ]
  // Every local course runs inside the OS sandbox (lib/sandbox.ts), so none runs without it.
  const isolation: Item = {
    name: "OS sandbox",
    found: t.isolation ? undefined : process.platform === "darwin" ? "sandbox-exec" : "bubblewrap",
    need: t.isolation ?? "macOS, or Linux with bubblewrap",
    ok: !t.isolation,
  }
  return rows.map(([course, items]) => ({ course, ready: [...items, isolation].every((i) => i.ok), items: [...items, isolation] }))
}

// --- Caches -------------------------------------------------------------------

export const CACHE_IDS = [
  "flutter-build",
  "laravel-cache",
  "temp",
  "sandbox-typescript",
  "sandbox-laravel",
  "sandbox-flutter",
  "pub-cache",
  "composer-cache",
] as const
export type CacheId = (typeof CACHE_IDS)[number]
export type Cache = {
  id: CacheId
  label: string
  detail: string
  paths: string[]
  bytes: number
  scope: "project" | "sandbox" | "global"
}

const TEMP_PREFIX = "thonglearn-"
const tempDirs = async () =>
  (await readdir(tmpdir()).catch(() => [] as string[]))
    .filter((n) => n.startsWith(TEMP_PREFIX))
    .map((n) => path.join(tmpdir(), n))

const pubCache = () => process.env.PUB_CACHE || path.join(homedir(), ".pub-cache")
async function composerCache() {
  const r = await runProcess("composer", ["config", "--global", "cache-dir"], { cwd: RUNTIMES, timeout: 15_000 })
  return r.code === 0 ? r.stdout.trim().split("\n").pop() : undefined
}

async function du(paths: string[]) {
  const there = paths.filter((p) => existsSync(p))
  if (!there.length) return 0
  const r = await runProcess("du", ["-sk", ...there], { cwd: RUNTIMES, timeout: 60_000 })
  return r.stdout.split("\n").reduce((sum, l) => sum + (parseInt(l) || 0), 0) * 1024
}

async function locate(): Promise<Omit<Cache, "bytes">[]> {
  const composer = await composerCache()
  const rt = (...p: string[]) => path.join(RUNTIMES, ...p)
  return [
    { id: "flutter-build", label: "Flutter build output", detail: "The last flutter build web and the test cache. Rebuilt on the next Flutter run.", paths: [rt("flutter/build")], scope: "project" },
    { id: "laravel-cache", label: "Laravel caches and logs", detail: "Runs php artisan optimize:clear and empties storage/logs.", paths: [rt("laravel/storage")], scope: "project" },
    { id: "temp", label: "Leftover run folders", detail: `${TEMP_PREFIX}* folders in the temp directory, left by runs that were killed.`, paths: await tempDirs(), scope: "project" },
    { id: "sandbox-typescript", label: "TypeScript sandbox", detail: "runtimes/typescript. Run npm run setup:runtimes to get it back.", paths: [rt("typescript")], scope: "sandbox" },
    { id: "sandbox-laravel", label: "Laravel sandbox", detail: "runtimes/laravel. Run npm run setup:runtimes to get it back.", paths: [rt("laravel")], scope: "sandbox" },
    { id: "sandbox-flutter", label: "Flutter sandbox", detail: "runtimes/flutter. Run npm run setup:runtimes to get it back.", paths: [rt("flutter")], scope: "sandbox" },
    { id: "pub-cache", label: "Dart / Flutter package cache", detail: "dart pub cache clean. Every Dart and Flutter project on this machine downloads its packages again.", paths: [pubCache()], scope: "global" },
    { id: "composer-cache", label: "Composer cache", detail: "composer clear-cache. Every PHP project on this machine downloads its packages again.", paths: composer ? [composer] : [], scope: "global" },
  ]
}

export async function caches(): Promise<Cache[]> {
  const list = await locate()
  return Promise.all(list.map(async (c) => ({ ...c, bytes: await du(c.paths) })))
}

async function must(cmd: string, args: string[], cwd: string) {
  const r = await runProcess(cmd, args, { cwd, timeout: 300_000 })
  if (r.code !== 0) throw new Error((r.stderr || r.stdout).trim() || `${cmd} exited with ${r.code}`)
}

/** Cleans one cache. Only these fixed targets exist; nothing path-like comes from the client. */
export async function clean(id: CacheId): Promise<void> {
  const rt = (...p: string[]) => path.join(RUNTIMES, ...p)
  const rmrf = (p: string) => rm(p, { recursive: true, force: true })
  switch (id) {
    case "flutter-build":
      return serially(() => rmrf(rt("flutter/build")))
    case "laravel-cache": {
      if (!existsSync(rt("laravel/artisan"))) return
      await must("php", ["artisan", "optimize:clear"], rt("laravel"))
      const logs = rt("laravel/storage/logs")
      for (const f of await readdir(logs).catch(() => [] as string[]))
        if (f.endsWith(".log")) await truncate(path.join(logs, f))
      return
    }
    case "temp":
      // ponytail: also removes the folder of a run in progress; that run then fails and can be re-run.
      for (const d of await tempDirs()) await rmrf(d)
      return
    case "sandbox-typescript":
      return rmrf(rt("typescript"))
    case "sandbox-laravel":
      return rmrf(rt("laravel"))
    case "sandbox-flutter":
      return serially(() => rmrf(rt("flutter")))
    case "pub-cache":
      return serially(async () => {
        await must("dart", ["pub", "cache", "clean", "--force"], RUNTIMES)
        // Runs use --no-pub, so the sandbox needs its packages back straight away.
        if (existsSync(rt("flutter/pubspec.yaml"))) await must("flutter", ["pub", "get"], rt("flutter"))
      })
    case "composer-cache":
      return must("composer", ["clear-cache"], RUNTIMES)
  }
}
