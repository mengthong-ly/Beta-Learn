// Packs the Laravel app the browser runs Laravel lessons in (public/php.worker.js) into
// public/laravel-app.json.gz: { "<path>": "<text>" } for every text file of a production-only
// install of runtimes/laravel, plus our boot script. Vercel has no PHP or Composer, so the file is
// committed; re-run this to upgrade Laravel (needs php and composer; delete runtimes/laravel first
// to start from a fresh `composer create-project`).
// Usage: node --no-warnings scripts/build-laravel-snapshot.ts
import { spawnSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { gzipSync } from "node:zlib"

const source = path.join("runtimes", "laravel")
const dir = path.join(mkdtempSync(path.join(tmpdir(), "thonglearn-laravel-")), "app")
const sh = (cmd: string, args: string[], cwd = dir) => {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit" })
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")} failed`)
}

if (!existsSync(path.join(source, "artisan"))) {
  mkdirSync("runtimes", { recursive: true })
  sh("composer", ["create-project", "laravel/laravel", "laravel", "^13.0", "--no-interaction", "--prefer-dist"], "runtimes")
}

const skip = new Set(["vendor", "node_modules", "tests", ".git", "database.sqlite", ".env"])
cpSync(source, dir, { recursive: true, filter: (src) => !skip.has(path.basename(src)) })
cpSync(path.join("runtimes", "_support", "laravel", "thonglearn-run.php"), path.join(dir, "thonglearn-run.php"))
sh("composer", ["install", "--no-dev", "--optimize-autoloader", "--no-interaction", "--no-scripts", "--quiet"])
rmSync(path.join(dir, "bootstrap", "cache"), { recursive: true, force: true })
cpSync(path.join(source, "bootstrap", "cache", ".gitignore"), path.join(dir, "bootstrap", "cache", ".gitignore"))
// A sandbox app: the key only signs the in-memory sessions of one lesson run.
writeFileSync(path.join(dir, ".env"), `APP_KEY=base64:${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64")}\nAPP_DEBUG=true\n`)
sh("php", ["artisan", "package:discover", "--quiet"]) // the package list without dev packages

const files: Record<string, string> = {}
const unneeded = /(^|\/)(tests?|Tests|docs)(\/|$)|^vendor\/nesbot\/carbon\/src\/Carbon\/Lang\/|^storage\/(logs|framework\/views)\/[^.]/
const utf8 = new TextDecoder("utf-8", { fatal: true })
const walk = (d: string) => {
  for (const f of readdirSync(d)) {
    const p = path.join(d, f)
    const rel = path.relative(dir, p).split(path.sep).join("/")
    if (unneeded.test(rel)) continue
    if (statSync(p).isDirectory()) walk(p)
    else
      try {
        files[rel] = utf8.decode(readFileSync(p))
      } catch {
        // binary (terminfo files, a Windows helper): nothing a lesson needs
      }
  }
}
walk(dir)
const out = path.join("public", "laravel-app.json.gz")
writeFileSync(out, gzipSync(JSON.stringify(files), { level: 9 }))
rmSync(path.dirname(dir), { recursive: true, force: true })
console.log(`${out}: ${Object.keys(files).length} files, ${Math.round(statSync(out).size / 1024)} KB`)
