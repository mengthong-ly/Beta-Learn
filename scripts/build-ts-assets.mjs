// Writes public/generated/ts/ for the in-browser TypeScript runtime (public/ts.worker.js):
//   typescript.mjs   TypeScript 6 (typescript.js is CommonJS; this wraps it as an ES module)
//   libs.json        the lib .d.ts files that `lib: ["esnext", "dom"]` pulls in
//   mcp-types.json   the MCP SDK's and zod's types, for the Claude Code course
// Runs before `next dev`, `next build` and check:content. Plain JS so any Node 20+ runs it.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"

const out = path.join("public", "generated", "ts")
const lib = path.join("node_modules", "typescript-6", "lib")
mkdirSync(out, { recursive: true })

writeFileSync(
  path.join(out, "typescript.mjs"),
  `const module = { exports: {} }\n${readFileSync(path.join(lib, "typescript.js"), "utf8")}\nexport default module.exports\n`
)

const libs = {}
const addLib = (name) => {
  const file = `/lib.${name}.d.ts`
  if (libs[file]) return
  libs[file] = readFileSync(path.join(lib, file), "utf8")
  for (const m of libs[file].matchAll(/<reference lib="([^"]+)"/g)) addLib(m[1])
}
addLib("esnext")
addLib("dom")
writeFileSync(path.join(out, "libs.json"), JSON.stringify(libs))

// Only what type-checking needs: declaration files and the package.json files that map imports to them.
const types = {}
const walk = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (f === "package.json" || f.endsWith(".d.ts"))
      types["/" + p.split(path.sep).join("/")] = readFileSync(p, "utf8")
  }
}
walk(path.join("node_modules", "@modelcontextprotocol", "sdk"))
walk(path.join("node_modules", "zod"))
writeFileSync(path.join(out, "mcp-types.json"), JSON.stringify(types))

const kb = (f) => Math.round(statSync(path.join(out, f)).size / 1024)
console.log(
  `public/generated/ts: typescript.mjs ${kb("typescript.mjs")} KB, libs.json ${kb("libs.json")} KB (${Object.keys(libs).length} files), mcp-types.json ${kb("mcp-types.json")} KB`
)
