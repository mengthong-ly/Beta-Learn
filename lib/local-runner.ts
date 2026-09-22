// Runs lesson code with the learner's own toolchains (dart, flutter, php, tsc/node).
// Used by app/api/run (opt-in, see docs/adr/0001-local-runner.md) and scripts/check-content.ts.
// Node stdlib only, no path aliases, erasable TypeScript only: Node runs this file directly.
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

export type Line = { kind: "out" | "err"; text: string }
export type LocalResult = {
  lines: Line[]
  ms: number
  error?: string
  errorLine?: number
  check?: { pass: boolean; message?: string }
  /** Flutter: the built web app, served by app/api/flutter */
  previewUrl?: string
}

export const LOCAL_COURSES = [
  "php",
  "laravel",
  "typescript",
  "dart",
  "flutter",
] as const
export type LocalCourse = (typeof LOCAL_COURSES)[number]

export const RUNTIMES = path.join(process.cwd(), "runtimes")
const SUPPORT = path.join(RUNTIMES, "_support")
const TSC = path.join(RUNTIMES, "typescript/node_modules/.bin/tsc")
const LARAVEL = path.join(RUNTIMES, "laravel")
const FLUTTER = path.join(RUNTIMES, "flutter")

/** Check wrappers report on stderr with this prefix, then JSON: {"pass": bool, "message"?: string}. */
export const CHECK_MARK = "@@thonglearn-check "
const MAX_OUTPUT = 256_000
const TIMEOUT: Record<LocalCourse, number> = {
  php: 15_000,
  laravel: 30_000,
  typescript: 20_000,
  dart: 30_000,
  flutter: 300_000,
}

type Proc = { code: number | null; stdout: string; stderr: string; timedOut: boolean }

function runProcess(
  cmd: string,
  args: string[],
  opts: { cwd: string; timeout: number; env?: Record<string, string>; signal?: AbortSignal }
): Promise<Proc> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      detached: true, // own process group, so a kill takes its children too
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    let timedOut = false
    const kill = () => {
      try {
        process.kill(-child.pid!, "SIGKILL")
      } catch {
        /* already gone */
      }
    }
    const timer = setTimeout(() => {
      timedOut = true
      kill()
    }, opts.timeout)
    opts.signal?.addEventListener("abort", kill)
    child.stdout.on("data", (d) => {
      stdout += d
      if (stdout.length > MAX_OUTPUT) kill()
    })
    child.stderr.on("data", (d) => {
      stderr += d
      if (stderr.length > MAX_OUTPUT) kill()
    })
    child.on("error", (e) => {
      stderr += String(e.message)
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      opts.signal?.removeEventListener("abort", kill)
      resolve({ code, stdout, stderr, timedOut })
    })
  })
}

const toLines = (text: string, kind: Line["kind"]): Line[] =>
  text
    .replace(/\n$/, "")
    .split("\n")
    .filter((t, i, a) => a.length > 1 || t)
    .map((t) => ({ kind, text: t }))

/** Turns a finished process into a result: strips temp paths, pulls out the check verdict. */
function settle(
  r: Proc,
  started: number,
  dir: string,
  file: string,
  lineRe: RegExp
): LocalResult {
  const clean = (s: string) => s.replaceAll(dir + path.sep, "").replaceAll(dir, "")
  let check: LocalResult["check"]
  const stderr = clean(r.stderr)
    .split("\n")
    .filter((l) => {
      if (!l.startsWith(CHECK_MARK)) return true
      check = JSON.parse(l.slice(CHECK_MARK.length))
      return false
    })
    .join("\n")
  const lines = [...toLines(clean(r.stdout), "out"), ...toLines(stderr, "err")]
  const ms = Date.now() - started
  if (r.timedOut)
    return { lines, ms, error: `Stopped after ${Math.round(ms / 1000)}s: is there an infinite loop?` }
  if (r.code !== 0 && !check) {
    const text = stderr.trim() || clean(r.stdout).trim() || `Exited with code ${r.code}`
    const m = text.match(lineRe)
    return {
      lines: lines.filter((l) => l.kind === "out"),
      ms,
      error: text,
      errorLine: m ? Number(m[1]) : undefined,
    }
  }
  return { lines, ms, check }
}

async function withTemp<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(tmpdir(), "thonglearn-"))
  try {
    return await fn(dir)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

const stripPhpTag = (s: string) => s.replace(/^\s*<\?php\s*/, "")

// --- PHP and Laravel: the check runs in the same process, after the lesson file. ---
function phpCheckWrapper(file: string, check: string) {
  return `<?php
function expect(bool $ok, string $message = 'Check failed'): void { if (!$ok) throw new \\Exception($message); }
ob_start();
require __DIR__ . '/${file}';
$output = ob_get_clean();
echo $output;
try {
${stripPhpTag(check)}
  fwrite(STDERR, "${CHECK_MARK}" . json_encode(['pass' => true]) . "\\n");
} catch (\\Throwable $e) {
  fwrite(STDERR, "${CHECK_MARK}" . json_encode(['pass' => false, 'message' => $e->getMessage()]) . "\\n");
}
`
}

async function runPhp(course: "php" | "laravel", code: string, check: string | undefined, signal?: AbortSignal) {
  const file = course === "php" ? "index.php" : "lesson.php"
  return withTemp(async (dir) => {
    await writeFile(path.join(dir, file), code)
    const entry = check ? "check.php" : file
    if (check) await writeFile(path.join(dir, entry), phpCheckWrapper(file, check))
    const ini = ["-d", "display_errors=stderr", "-d", "log_errors=0", "-d", "zend.assertions=1", "-d", "assert.exception=1"]
    const args =
      course === "php"
        ? [...ini, entry]
        : [...ini, path.join(LARAVEL, "thonglearn-run.php"), path.join(dir, entry)]
    const started = Date.now()
    const r = await runProcess("php", args, {
      cwd: dir,
      timeout: TIMEOUT[course],
      signal,
      env:
        course === "laravel"
          ? {
              APP_ENV: "local",
              DB_CONNECTION: "sqlite",
              DB_DATABASE: ":memory:",
              CACHE_STORE: "array",
              SESSION_DRIVER: "array",
              QUEUE_CONNECTION: "sync",
              MAIL_MAILER: "log",
              LOG_CHANNEL: "stderr",
            }
          : undefined,
    })
    return settle(r, started, dir, file, new RegExp(`${file.replace(".", "\\.")}(?: on line |:)(\\d+)`))
  })
}

// --- TypeScript: tsc 7 type-checks and emits ESM, node runs it. ---
const TS_CHECK = (check: string) => `const output: string[] = []
const __log = console.log
console.log = (...a: unknown[]) => {
  output.push(a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "))
  __log(...a)
}
function expect(ok: boolean, message = "Check failed"): asserts ok {
  if (!ok) throw new Error(message)
}
const lesson = await import("./main.js")
try {
${check}
  console.error("${CHECK_MARK}" + JSON.stringify({ pass: true }))
} catch (e) {
  console.error("${CHECK_MARK}" + JSON.stringify({ pass: false, message: e instanceof Error ? e.message : String(e) }))
}
export {}
`

async function runTypeScript(code: string, check: string | undefined, signal?: AbortSignal) {
  return withTemp(async (dir) => {
    await writeFile(path.join(dir, "main.ts"), code)
    await writeFile(path.join(dir, "package.json"), '{ "type": "module" }\n')
    const files = ["main.ts"]
    if (check) {
      await writeFile(path.join(dir, "check.ts"), TS_CHECK(check))
      files.push("check.ts")
    }
    await writeFile(
      path.join(dir, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          target: "esnext",
          module: "nodenext",
          moduleResolution: "nodenext",
          lib: ["esnext", "dom"],
          rootDir: ".",
          outDir: "out",
          skipLibCheck: true,
          noEmitOnError: true,
        },
        files,
      })
    )
    const started = Date.now()
    const lineRe = /main\.ts[(:](\d+)/
    const tsc = await runProcess(TSC, ["-p", ".", "--pretty", "false"], { cwd: dir, timeout: TIMEOUT.typescript, signal })
    if (tsc.code !== 0)
      return settle({ ...tsc, stderr: tsc.stdout + tsc.stderr, stdout: "" }, started, dir, "main.ts", lineRe)
    const r = await runProcess("node", [check ? "out/check.js" : "out/main.js"], {
      cwd: dir,
      timeout: TIMEOUT.typescript,
      signal,
    })
    // Runtime errors point at the emitted .js; its lines match main.ts closely enough for a hint.
    return settle(r, started, dir, "main.ts", /main\.[jt]s:(\d+)/)
  })
}

// --- Dart: `dart run`; the check imports the lesson as a library. ---
const DART_CHECK = (check: string) => `import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'main.dart' as lesson;

void expect(bool ok, [String message = 'Check failed']) {
  if (!ok) throw message;
}

Future<void> _run(List<String> output) => runZoned(
      () => Future.sync(() => lesson.main()),
      zoneSpecification: ZoneSpecification(print: (self, parent, zone, line) {
        output.add(line);
        parent.print(zone, line);
      }),
    );

Future<void> _check(List<String> output) async {
${check}
}

Future<void> main() async {
  final output = <String>[];
  await _run(output);
  try {
    await _check(output);
    stderr.writeln('${CHECK_MARK}' + jsonEncode({'pass': true}));
  } catch (e) {
    stderr.writeln('${CHECK_MARK}' + jsonEncode({'pass': false, 'message': e.toString()}));
  }
}
`

async function runDart(code: string, check: string | undefined, signal?: AbortSignal) {
  return withTemp(async (dir) => {
    await writeFile(path.join(dir, "main.dart"), code)
    if (check) await writeFile(path.join(dir, "check.dart"), DART_CHECK(check))
    const started = Date.now()
    const r = await runProcess("dart", ["run", "--enable-asserts", check ? "check.dart" : "main.dart"], {
      cwd: dir,
      timeout: TIMEOUT.dart,
      signal,
    })
    return settle(r, started, dir, "main.dart", /main\.dart:(\d+)/)
  })
}

// --- Flutter: one shared project, so one run at a time. ---
let flutterQueue: Promise<unknown> = Promise.resolve()
function serially<T>(fn: () => Promise<T>): Promise<T> {
  const next = flutterQueue.then(fn, fn)
  flutterQueue = next.catch(() => undefined)
  return next
}

/** A check is a widget-test body; without one, a smoke test just pumps the app. */
const FLUTTER_TEST = (check: string | undefined) => `import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:thonglearn_flutter/main.dart' as app;

void main() {
  testWidgets('lesson check', (tester) async {
    app.main();
    await tester.pumpAndSettle();
${check ?? "    // smoke test: the app builds without throwing"}
  });
}
`

async function runFlutter(
  code: string,
  check: string | undefined,
  mode: "run" | "test",
  signal?: AbortSignal
): Promise<LocalResult> {
  return serially(async () => {
    const main = path.join(FLUTTER, "lib/main.dart")
    const previous = existsSync(main) ? await readFile(main, "utf8") : ""
    await writeFile(main, code)
    const started = Date.now()
    const lineRe = /lib\/main\.dart:(\d+)/
    if (mode === "test") {
      await writeFile(path.join(FLUTTER, "test/check_test.dart"), FLUTTER_TEST(check))
      const r = await runProcess("flutter", ["test", "--no-pub", "-r", "expanded", "test/check_test.dart"], {
        cwd: FLUTTER,
        timeout: TIMEOUT.flutter,
        signal,
      })
      const res = settle(r, started, FLUTTER, "lib/main.dart", lineRe)
      if (!check || /lib\/main\.dart:\d+:\d+: Error/.test(r.stdout + r.stderr)) return res
      // flutter test exits non-zero on a failed expectation: that's a failed check, not a crash.
      const failed = r.code !== 0
      const message = failed
        ? (r.stdout.match(/Expected: [^\n]*\n\s*Actual: [^\n]*/)?.[0] ??
          r.stdout.match(/Error: [^\n]*/)?.[0] ??
          "The widget test failed")
        : undefined
      return { ...res, error: undefined, errorLine: undefined, check: { pass: !failed, message } }
    }
    const r = await runProcess(
      "flutter",
      ["build", "web", "--no-pub", "--debug", "--base-href", "/api/flutter/"],
      { cwd: FLUTTER, timeout: TIMEOUT.flutter, signal }
    )
    const res = settle(r, started, FLUTTER, "lib/main.dart", lineRe)
    if (res.error) {
      await writeFile(main, previous) // keep the last working app in the preview
      // Skip the build chatter ("Wasm dry run succeeded…") that comes before the compiler error.
      const at = res.error.indexOf("lib/main.dart:")
      return at > 0 ? { ...res, error: res.error.slice(at) } : res
    }
    // Build chatter isn't the learner's output; keep only warnings.
    return {
      ...res,
      lines: res.lines.filter((l) => /warning|error/i.test(l.text)),
      previewUrl: `/api/flutter/?v=${started}`,
    }
  })
}

export function runLocal(
  course: LocalCourse,
  code: string,
  check?: string,
  opts: { signal?: AbortSignal; flutterMode?: "run" | "test" } = {}
): Promise<LocalResult> {
  switch (course) {
    case "php":
    case "laravel":
      return runPhp(course, code, check, opts.signal)
    case "typescript":
      return runTypeScript(code, check, opts.signal)
    case "dart":
      return runDart(code, check, opts.signal)
    case "flutter":
      return runFlutter(code, check, opts.flutterMode ?? (check ? "test" : "run"), opts.signal)
  }
}

/** Which toolchains are ready (for the status endpoint and the setup script). */
export async function toolStatus() {
  const version = async (cmd: string, args: string[]) => {
    const r = await runProcess(cmd, args, { cwd: process.cwd(), timeout: 60_000 })
    return r.code === 0 ? (r.stdout + r.stderr).trim().split("\n")[0] : undefined
  }
  const [php, dart, flutter, node, tsc] = await Promise.all([
    version("php", ["-r", "echo PHP_VERSION;"]),
    version("dart", ["--version"]),
    version("flutter", ["--version"]),
    version("node", ["--version"]),
    existsSync(TSC) ? version(TSC, ["--version"]) : undefined,
  ])
  return {
    php,
    dart,
    flutter,
    node,
    tsc,
    laravel: existsSync(path.join(LARAVEL, "thonglearn-run.php")),
    flutterProject: existsSync(path.join(FLUTTER, "pubspec.yaml")),
    support: existsSync(SUPPORT),
  }
}
