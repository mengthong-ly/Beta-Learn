// Creates the local toolchain sandboxes the local runner uses (see docs/adr/0001-local-runner.md).
// Usage: npm run setup:runtimes   (safe to re-run: existing sandboxes are kept)
//   runtimes/flutter     a Flutter web app             flutter
// C++ and Dart need nothing but the c++ and dart commands on your PATH. PHP, Laravel and
// TypeScript run in the browser (docs/adr/0002-browser-runtimes.md).
import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import path from "node:path"

import { RUNTIMES, toolStatus } from "../lib/local-runner.ts"

function sh(cmd: string, args: string[], cwd = RUNTIMES) {
  console.log(`\n$ ${cmd} ${args.join(" ")}`)
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit" })
  if (r.status !== 0) throw new Error(`${cmd} failed (exit ${r.status})`)
}

const flutter = path.join(RUNTIMES, "flutter")
if (!existsSync(path.join(flutter, "pubspec.yaml"))) {
  sh("flutter", ["create", "--project-name", "thonglearn_flutter", "--platforms", "web", "flutter"])
  sh("flutter", ["pub", "get"], flutter)
}

console.log("\nToolchains:", await toolStatus())
