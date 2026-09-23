// Runs a PHP lesson with php-wasm's CLI, the way the local runner ran `php`: the same ini
// settings, the same check wrapper, the same result shape. Shared by public/php.worker.js
// (browser) and scripts/check-content.ts (Node), so both judge lessons the same way.
// `php` is a fresh @php-wasm/universal PHP instance: the CLI runs once per instance.

export const CHECK_MARK = "@@thonglearn-check "
const INI = ["-d", "display_errors=stderr", "-d", "log_errors=0", "-d", "zend.assertions=1", "-d", "assert.exception=1"]
const DIR = "/lesson"

const stripPhpTag = (s) => s.replace(/^\s*<\?php\s*/, "")

// The check runs in the same process, after the lesson file: it sees $output, expect() and
// everything the lesson defined.
const checkWrapper = (file, check) => `<?php
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

const toLines = (text, kind) =>
  text
    .replace(/\n$/, "")
    .split("\n")
    .filter((t, i, a) => a.length > 1 || t)
    .map((t) => ({ kind, text: t }))

/**
 * → { lines, error?, errorLine?, check? }.
 * `boot` (Laravel) is a script that sets the app up and then requires the file it gets as argv[1].
 * @param {any} php
 * @param {{ code: string, check?: string, file?: string, boot?: string, env?: Record<string, string> }} lesson
 */
export async function runPhp(php, { code, check, file = "index.php", boot, env }) {
  await php.mkdir(DIR)
  await php.writeFile(`${DIR}/${file}`, code)
  const entry = `${DIR}/${check ? "check.php" : file}`
  if (check) await php.writeFile(entry, checkWrapper(file, check))
  const r = await php.cli(["php", ...INI, ...(boot ? [boot] : []), entry], { env })
  const [stdout, stderrRaw, exit] = await Promise.all([r.stdoutText, r.stderrText, r.exitCode])
  const clean = (s) => s.replaceAll(DIR + "/", "")
  let verdict
  const stderr = clean(stderrRaw)
    .split("\n")
    .filter((l) => {
      if (!l.startsWith(CHECK_MARK)) return true
      verdict = JSON.parse(l.slice(CHECK_MARK.length))
      return false
    })
    .join("\n")
  const lines = [...toLines(clean(stdout), "out"), ...toLines(stderr, "err")]
  if (exit !== 0 && !verdict) {
    const error = stderr.trim() || clean(stdout).trim() || `Exited with code ${exit}`
    const m = error.match(new RegExp(`${file.replace(".", "\\.")}(?: on line |:)(\\d+)`))
    return { lines: lines.filter((l) => l.kind === "out"), error, errorLine: m ? Number(m[1]) : undefined }
  }
  return { lines, check: verdict }
}
