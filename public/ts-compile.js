// Type-checks and emits a TypeScript lesson in memory, with the options tsc used in the local
// runner. Shared by public/ts.worker.js (browser) and scripts/check-content.ts (Node), so both
// judge lessons the same way. `files` holds the lib .d.ts files and package types
// (public/generated/ts, from scripts/build-ts-assets.ts), keyed by absolute path.

export const CHECK_MARK = "@@thonglearn-check "

// Wraps a lesson's check: captures console.log into `output`, runs main.js, reports the verdict.
const checkSource = (check) => `const output: string[] = []
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

// Declaration files never change, so parse each once per process.
const parsed = new Map()

/** → { main, check? } (emitted JavaScript), or { error, errorLine? } like `tsc --pretty false`. */
export function compile(ts, files, code, check) {
  const src = { ...files, "/package.json": '{ "type": "module" }', "/main.ts": code }
  if (check) src["/check.ts"] = checkSource(check)
  const dirs = new Set(Object.keys(src).flatMap((f) => f.split("/").slice(1, -1).map((_, i, a) => "/" + a.slice(0, i + 1).join("/"))))
  const out = {}
  const host = {
    getSourceFile(name, target) {
      const text = src[name]
      if (text === undefined) return undefined
      if (name.endsWith(".d.ts") && name !== "/main.ts") {
        const key = `${name}\0${JSON.stringify(target)}`
        if (!parsed.has(key)) parsed.set(key, ts.createSourceFile(name, text, target))
        return parsed.get(key)
      }
      return ts.createSourceFile(name, text, target)
    },
    getDefaultLibFileName: () => "/lib.esnext.d.ts",
    getDefaultLibLocation: () => "/",
    writeFile: (name, text) => (out[name] = text),
    getCurrentDirectory: () => "/",
    getCanonicalFileName: (f) => f,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
    fileExists: (f) => f in src,
    readFile: (f) => src[f],
    directoryExists: (d) => d === "/" || dirs.has(d.replace(/\/$/, "")),
    getDirectories: () => [],
    realpath: (p) => p,
  }
  const program = ts.createProgram(check ? ["/main.ts", "/check.ts"] : ["/main.ts"], {
    strict: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    lib: ["lib.esnext.d.ts", "lib.dom.d.ts"],
    types: [],
    rootDir: "/",
    outDir: "/out",
    skipLibCheck: true,
    noEmitOnError: true,
    stableTypeOrdering: true, // print unions the way TypeScript 7 does
  }, host)
  const diagnostics = ts.getPreEmitDiagnostics(program)
  if (diagnostics.length) {
    const error = ts
      .formatDiagnostics(diagnostics, { getCurrentDirectory: () => "/", getCanonicalFileName: (f) => f, getNewLine: () => "\n" })
      .trim()
    return { error, errorLine: Number(error.match(/main\.ts[(:](\d+)/)?.[1]) || undefined }
  }
  program.emit()
  return { main: out["/out/main.js"], check: out["/out/check.js"] }
}
