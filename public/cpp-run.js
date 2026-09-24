// Runs a C++ lesson: clang (LLVM 22, YoWASP's WebAssembly build) compiles the learner's code to
// wasm, and WASI runs it. Shared by public/cpp.worker.js (browser) and scripts/check-content.ts
// (Node), so both judge lessons the same way.
//
// `clang` is @yowasp/clang's `commands["clang++"]`; `wasi` is the @bjorn3/browser_wasi_shim
// module. Both are passed in: the worker loads them from a CDN, Node from node_modules.

export const CHECK_MARK = "@@thonglearn-check "

// The sysroot's libc++ is built without exceptions (no __cxa_throw), so every lesson compiles
// -fno-exceptions and the check wrapper reports a failure by exiting instead of throwing.
export const FLAGS = ["-std=c++23", "-fno-exceptions", "-Wall"]

// Renaming the lesson's `main` costs it main's implicit `return 0`, which would turn a lesson
// that just falls off the end into a trap. Only the check build needs the cure.
const CHECK_FLAGS = ["-fno-strict-return"]

const MAIN = "main.cpp"
const LESSON = "lesson.hpp"

/** The lesson as a header the check can include: same lines, so errors keep the learner's numbers. */
const asHeader = (code) => code.replace(/\bint(\s+)main(\s*)\(/, "int$1lesson_main$2(")

// The check runs in the same program, after the lesson's main: it sees `output`, `expect()` and
// everything the lesson defined at file scope.
const checkWrapper = (check) => `#include <cstdlib>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include "${LESSON}"

static std::vector<std::string> output;

static std::string escape(const std::string &s) {
  std::string out;
  for (char c : s) {
    if (c == '"' || c == '\\\\') out += '\\\\';
    else if (c == '\\n') { out += "\\\\n"; continue; }
    out += c;
  }
  return out;
}

static void verdict(bool pass, const std::string &message) {
  std::cout.flush();
  std::cerr << "${CHECK_MARK}" << "{\\"pass\\": " << (pass ? "true" : "false");
  if (!pass) std::cerr << ", \\"message\\": \\"" << escape(message) << "\\"";
  std::cerr << "}" << std::endl;
  std::exit(0);
}

static void expect(bool ok, const std::string &message = "Check failed") {
  if (!ok) verdict(false, message);
}

int main() {
  std::ostringstream captured;
  std::streambuf *saved = std::cout.rdbuf(captured.rdbuf());
  lesson_main();
  std::cout.rdbuf(saved);
  std::cout << captured.str();
  std::istringstream reader(captured.str());
  for (std::string line; std::getline(reader, line);) output.push_back(line);
${check}
  verdict(true, "");
}
`

const toLines = (text, kind) =>
  text
    .replace(/\n$/, "")
    .split("\n")
    .filter((t, i, a) => a.length > 1 || t)
    .map((t) => ({ kind, text: t }))

/** Compiler diagnostics name the file the learner sees, never the wrapper. */
const asMain = (s) => s.replaceAll(LESSON, MAIN)

/**
 * → { lines, error?, errorLine?, check? }
 * @param {(args: string[], files: any, opts?: any) => any} clang
 * @param {{ WASI: any, File: any, OpenFile: any, ConsoleStdout: any, PreopenDirectory: any }} wasi
 * @param {{ code: string, check?: string }} lesson
 * @param {() => void} [onRunning] called when compiling is done and the program is about to run
 */
export async function compileAndRun(clang, wasi, { code, check }, onRunning) {
  const files = { [MAIN]: code }
  if (check) {
    files[LESSON] = asHeader(code)
    files["check.cpp"] = checkWrapper(check)
  }
  const entry = check ? "check.cpp" : MAIN

  const decoder = new TextDecoder()
  let diagnostics = ""
  const compile = async (args) => {
    diagnostics = ""
    try {
      return await clang([...FLAGS, ...(check ? CHECK_FLAGS : []), ...args], files, {
        // clang writes its diagnostics as byte chunks, with a null at the end of the stream.
        stderr: (chunk) =>
          chunk && (diagnostics += typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true })),
      })
    } catch {
      return undefined // non-zero exit: the message is in `diagnostics`
    }
  }

  let built = await compile(["-o", "prog", entry])
  if (!built) {
    // Don't show the learner the wrapper's cascading errors: if their own file doesn't
    // compile, that's the error worth reporting.
    if (check) {
      const alone = diagnostics
      if (await compile(["-fsyntax-only", MAIN])) diagnostics = alone
    }
    const error = asMain(diagnostics).trim() || "The compiler failed"
    const m = error.match(/main\.cpp:(\d+)/)
    return { lines: [], error, errorLine: m ? Number(m[1]) : undefined }
  }

  onRunning?.() // the timeout that catches an infinite loop starts here, not during the compile
  // Collect the raw bytes rather than whole lines: a program that ends without a newline
  // ("std::cout << \"hi\";") still wrote a line, and lineBuffered() would swallow it.
  const text = { out: "", err: "" }
  const decoders = { out: new TextDecoder(), err: new TextDecoder() }
  const sink = (kind) =>
    new wasi.ConsoleStdout((bytes) => (text[kind] += decoders[kind].decode(bytes, { stream: true })))
  const instance = new wasi.WASI(
    ["lesson"],
    [],
    [new wasi.OpenFile(new wasi.File([])), sink("out"), sink("err"), new wasi.PreopenDirectory("/", new Map())]
  )
  const { instance: program } = await WebAssembly.instantiate(built.prog, {
    wasi_snapshot_preview1: instance.wasiImport,
  })

  let exit = 0
  let crashed
  try {
    exit = instance.start(program)
  } catch (e) {
    crashed = e instanceof Error ? e.message : String(e)
  }

  let verdict
  const stderr = text.err
    .split("\n")
    .filter((l) => {
      if (!l.startsWith(CHECK_MARK)) return true
      verdict = JSON.parse(l.slice(CHECK_MARK.length))
      return false
    })
    .join("\n")
  const lines = [...toLines(text.out, "out"), ...toLines(stderr, "err")]
  if (crashed !== undefined)
    return {
      lines,
      error: /unreachable/.test(crashed)
        ? "The program stopped: something failed at runtime (an out-of-range .at(), a failed assert, or undefined behaviour)."
        : crashed,
    }
  if (exit !== 0 && !verdict)
    return {
      lines: lines.filter((l) => l.kind === "out"),
      error: stderr.trim() || text.out.trim() || `Exited with code ${exit}`,
    }
  return { lines, check: verdict }
}
