// Creates the local toolchain sandboxes the local runner uses (see docs/adr/0001-local-runner.md).
// Usage: npm run setup:runtimes   (safe to re-run: existing sandboxes are kept)
//   runtimes/laravel     a Laravel 13 app              composer
//   runtimes/flutter     a Flutter web app             flutter
// C++, Dart and PHP need nothing but the c++, dart and php commands on your PATH.
import { spawnSync } from "node:child_process"
import { copyFileSync, existsSync } from "node:fs"
import path from "node:path"

import { RUNTIMES, toolStatus } from "../lib/local-runner.ts"

function sh(cmd: string, args: string[], cwd = RUNTIMES) {
  console.log(`\n$ ${cmd} ${args.join(" ")}`)
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit" })
  if (r.status !== 0) throw new Error(`${cmd} failed (exit ${r.status})`)
}

const laravel = path.join(RUNTIMES, "laravel")
if (!existsSync(path.join(laravel, "artisan")))
  sh("composer", ["create-project", "laravel/laravel", "laravel", "^13.0", "--no-interaction", "--prefer-dist"])
copyFileSync(
  path.join(RUNTIMES, "_support/laravel/thonglearn-run.php"),
  path.join(laravel, "thonglearn-run.php")
)

const flutter = path.join(RUNTIMES, "flutter")
if (!existsSync(path.join(flutter, "pubspec.yaml"))) {
  sh("flutter", ["create", "--project-name", "thonglearn_flutter", "--platforms", "web", "flutter"])
  sh("flutter", ["pub", "get"], flutter)
}

console.log("\nToolchains:", await toolStatus())
