// Runs lesson code with the learner's own toolchains (rustc, dart, flutter).
// Used by app/api/run (opt-in, see docs/adr/0001-local-runner.md) and scripts/check-content.ts.
// Every lesson process runs in the OS sandbox (lib/sandbox.ts) with a scrubbed env.
// No path aliases, erasable TypeScript only: Node runs this file directly.
import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { homedir, tmpdir } from "node:os"
import path from "node:path"

import { cleanEnv, initSandbox, sandboxDisabled, sandboxed, sandboxProblem } from "./sandbox.ts"

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
  "rust",
  "dart",
  "flutter",
] as const
export type LocalCourse = (typeof LOCAL_COURSES)[number]

export const RUNTIMES = path.join(process.cwd(), "runtimes")
const SUPPORT = path.join(RUNTIMES, "_support")
const FLUTTER = path.join(RUNTIMES, "flutter")
/** Packages the Flutter sandbox has on top of the SDK (added by scripts/setup-runtimes.ts). */
const FLUTTER_PACKAGES = ["provider", "go_router"]

/** Check wrappers report on stderr with this prefix, then JSON: {"pass": bool, "message"?: string}. */
export const CHECK_MARK = "@@thonglearn-check "
const MAX_OUTPUT = 256_000
const TIMEOUT: Record<LocalCourse, number> = {
  rust: 30_000,
  dart: 30_000,
  flutter: 300_000,
}

type Proc = { code: number | null; stdout: string; stderr: string; timedOut: boolean }

/**
 * Runs a process with a scrubbed env. With `sandbox` (the only paths it may write), it runs
 * inside the OS sandbox (lib/sandbox.ts); if that can't start, nothing runs.
 */
export async function runProcess(
  cmd: string,
  args: string[],
  opts: {
    cwd: string
    timeout: number
    env?: Record<string, string>
    signal?: AbortSignal
    sandbox?: string[]
    localNetwork?: boolean
  }
): Promise<Proc> {
  if (opts.sandbox) {
    try {
      if (!sandboxDisabled()) {
        await initSandbox(RUNTIMES)
        ;[cmd, ...args] = await sandboxed(cmd, args, opts.sandbox, opts.localNetwork)
      }
    } catch (e) {
      return { code: 1, stdout: "", stderr: e instanceof Error ? e.message : String(e), timedOut: false }
    }
  }
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: opts.cwd,
      env: cleanEnv(opts.env),
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

// --- Dart: the VM runs the file directly (no `dart run`, whose telemetry writes to ~/.dart-tool);
// the check imports the lesson as a library. ---
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
    const r = await runProcess("dart", ["--enable-asserts", check ? "check.dart" : "main.dart"], {
      cwd: dir,
      timeout: TIMEOUT.dart,
      signal,
      sandbox: [dir],
    })
    return settle(r, started, dir, "main.dart", /main\.dart:(\d+)/)
  })
}

// --- Rust: plain rustc on the 2024 edition; no cargo, so no crates and no network. A check is a
// #[test] in a child module appended after the learner's code: their line numbers hold, it sees
// their private items as `lesson::`, and it reads what a normal run printed as `output`. ---
const RUST_CHECK_MOD = '\n#[cfg(test)]\n#[path = "check.rs"]\nmod __thonglearn_check;\n'
const RUST_CHECK = (check: string) => `#![allow(unused)]
use super as lesson;

fn expect(ok: bool, message: impl std::fmt::Display) {
    if !ok {
        panic!("{message}")
    }
}

fn json(s: &str) -> String {
    let mut out = String::from("\\"");
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\\\\""),
            '\\\\' => out.push_str("\\\\\\\\"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out + "\\""
}

#[test]
fn check() {
    std::panic::set_hook(Box::new(|_| {}));
    let verdict = std::panic::catch_unwind(|| {
        let output: Vec<String> = include_str!("output.txt").lines().map(String::from).collect();
${check}
    });
    let json = match verdict {
        Ok(()) => String::from(r#"{"pass":true}"#),
        Err(e) => {
            let message = (e.downcast_ref::<String>().cloned())
                .or_else(|| e.downcast_ref::<&str>().map(|s| s.to_string()))
                .unwrap_or_else(|| String::from("Check failed"));
            format!(r#"{{"pass":false,"message":{}}}"#, json(&message))
        }
    };
    eprintln!("${CHECK_MARK}{json}");
}
`

/** Panics name the thread with an id that changes every run; tests report their timing. */
const tidyRust = (r: Proc): Proc => ({
  ...r,
  stdout: r.stdout.replace(/; finished in [\d.]+s/g, ""),
  stderr: r.stderr.replace(/thread '([^']*)' \(\d+\) panicked/g, "thread '$1' panicked"),
})

async function runRust(code: string, check: string | undefined, signal?: AbortSignal) {
  return withTemp(async (dir) => {
    const opts = { cwd: dir, timeout: TIMEOUT.rust, signal, sandbox: [dir] }
    const rustc = (args: string[]) => runProcess("rustc", ["--edition", "2024", ...args, "main.rs"], opts)
    const started = Date.now()
    const done = (r: Proc) => settle(tidyRust(r), started, dir, "main.rs", /main\.rs:(\d+)/)
    // Like the Playground: a file of #[test]s and no main runs its tests.
    const tests = !/\bfn\s+main\s*\(/.test(code) && /#\[test\]/.test(code)
    await writeFile(path.join(dir, "main.rs"), code)
    // Compiler warnings only show when the build fails; a clean build's output is the program's.
    const built = await rustc(tests ? ["--test", "-o", "main"] : ["-o", "main"])
    if (built.code !== 0) return done(built)
    const ran = await runProcess(path.join(dir, "main"), tests ? ["--test-threads=1"] : [], opts)
    if (!check || ran.code !== 0 || ran.timedOut) return done(ran)
    await writeFile(path.join(dir, "main.rs"), code + RUST_CHECK_MOD)
    await writeFile(path.join(dir, "check.rs"), RUST_CHECK(check))
    await writeFile(path.join(dir, "output.txt"), ran.stdout)
    const checkBuilt = await rustc(["--test", "-o", "check"])
    if (checkBuilt.code !== 0) return done(checkBuilt)
    const checked = await runProcess(path.join(dir, "check"), ["--exact", "__thonglearn_check::check", "--nocapture"], opts)
    // The harness's own chatter isn't the learner's output: keep the normal run's.
    return done({ ...checked, stdout: ran.stdout, stderr: ran.stderr + checked.stderr })
  })
}

// --- Flutter: one shared project, so one run at a time. ---
let flutterQueue: Promise<unknown> = Promise.resolve()
export function serially<T>(fn: () => Promise<T>): Promise<T> {
  const next = flutterQueue.then(fn, fn)
  flutterQueue = next.catch(() => undefined)
  return next
}

// Writes only to the shared project and a private HOME for the tool's own state (~/.config/flutter,
// ~/.dart-tool…); the lock env var keeps the SDK's bin/cache read-only.
const FLUTTER_HOME = path.join(RUNTIMES, ".flutter-home")
const FLUTTER_SANDBOX = {
  sandbox: [FLUTTER_HOME, FLUTTER],
  env: {
    FLUTTER_ALREADY_LOCKED: "true",
    HOME: FLUTTER_HOME,
    PUB_CACHE: process.env.PUB_CACHE ?? path.join(homedir(), ".pub-cache"),
  },
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
    await mkdir(FLUTTER_HOME, { recursive: true })
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
        ...FLUTTER_SANDBOX,
        localNetwork: true, // the test device listens on localhost
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
      { cwd: FLUTTER, timeout: TIMEOUT.flutter, signal, ...FLUTTER_SANDBOX }
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
    case "rust":
      return runRust(code, check, opts.signal)
    case "dart":
      return runDart(code, check, opts.signal)
    case "flutter":
      return runFlutter(code, check, opts.flutterMode ?? (check ? "test" : "run"), opts.signal)
  }
}

function isolationProblem() {
  try {
    return sandboxDisabled() ? undefined : sandboxProblem()
  } catch (e) {
    return e instanceof Error ? e.message : String(e)
  }
}

/** FLUTTER_PACKAGES the sandbox's pubspec doesn't list yet (all of them if there's no sandbox). */
export function missingFlutterPackages() {
  const pubspec = path.join(FLUTTER, "pubspec.yaml")
  const text = existsSync(pubspec) ? readFileSync(pubspec, "utf8") : ""
  return FLUTTER_PACKAGES.filter((p) => !text.includes(`\n  ${p}:`))
}

/** Which toolchains are ready (for the status endpoint and the setup script). */
export async function toolStatus() {
  const version = async (cmd: string, args: string[]) => {
    const r = await runProcess(cmd, args, { cwd: process.cwd(), timeout: 60_000 })
    return r.code === 0 ? (r.stdout + r.stderr).trim().split("\n")[0] : undefined
  }
  const [rust, dart, flutter] = await Promise.all([
    version("rustc", ["--version"]),
    version("dart", ["--version"]),
    version("flutter", ["--version"]),
  ])
  return {
    rust,
    dart,
    flutter,
    flutterProject: existsSync(path.join(FLUTTER, "pubspec.yaml")) && missingFlutterPackages().length === 0,
    support: existsSync(SUPPORT),
    /** Why runs can't be sandboxed here (lib/sandbox.ts), if they can't */
    isolation: isolationProblem(),
  }
}
