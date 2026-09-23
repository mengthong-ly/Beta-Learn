// Self-check for lib/local-runner.ts: output, error lines and check verdicts per toolchain.
// Usage: npm run check:runner   (needs npm run setup:runtimes first)
import assert from "node:assert/strict"
import { homedir } from "node:os"
import { runLocal, type LocalResult } from "../lib/local-runner.ts"
import { atLeast } from "../lib/runner-status.ts"

// Version gate used by the /setup page
assert.ok(atLeast("PHP 8.5.0", "8.5") && atLeast("v23.7.0", "20.9") && atLeast("Version 7.0.2", "7", "8"))
assert.ok(!atLeast("8.2.9", "8.3") && !atLeast("8.6.0", "8.3", "8.6") && !atLeast(undefined, "1") && !atLeast("Flutter 3.9.1", "3.47"))
console.log("✓ atLeast")

const t = async (name: string, p: Promise<LocalResult>, f: (r: LocalResult) => void) => {
  const r = await p
  try { f(r); console.log("✓", name, `${r.ms}ms`) } catch (e) { console.log("✗", name, JSON.stringify(r, null, 1)); throw e }
}
// PHP
// Laravel
await t("laravel str + db", runLocal("laravel", "<?php\nuse Illuminate\\Support\\Facades\\DB;\nuse Illuminate\\Support\\Facades\\Route;\necho Illuminate\\Support\\Str::of('hello world')->title(), PHP_EOL;\necho DB::table('users')->count(), PHP_EOL;\nRoute::get('/hi', fn () => 'Hi there');\necho visit('/hi')->getContent();"), (r) => { assert.equal(r.error, undefined, r.error); assert.deepEqual(r.lines.map((l) => l.text), ["Hello World", "0", "Hi there"]) })
// TypeScript
// C++
await t("cpp run", runLocal("cpp", '#include <iostream>\nint main() {\n  std::cout << "hi\\n";\n}'), (r) => { assert.equal(r.error, undefined, r.error); assert.deepEqual(r.lines, [{ kind: "out", text: "hi" }]) })
await t("cpp compile error", runLocal("cpp", '#include <iostream>\nint main() {\n  std::cout << "oops"\n}'), (r) => { assert.ok(r.error); assert.equal(r.errorLine, 3) })
await t("cpp check", runLocal("cpp", '#include <iostream>\nint twice(int x) { return x * 2; }\nint main() {\n  std::cout << twice(2) << "\\n";\n}', '    expect(twice(3) == 6);\n    expect(output[0] == "4", "prints 4");'), (r) => assert.deepEqual(r.check, { pass: true }))
await t("cpp check fail", runLocal("cpp", '#include <iostream>\nint twice(int x) { return x; }\nint main() {}', '    expect(twice(3) == 6, "twice(3) should be 6");'), (r) => assert.deepEqual(r.check, { pass: false, message: "twice(3) should be 6" }))
// Dart
await t("dart run", runLocal("dart", "void main() {\n  print('hi');\n}"), (r) => { assert.equal(r.error, undefined, r.error); assert.deepEqual(r.lines, [{ kind: "out", text: "hi" }]) })
await t("dart compile error", runLocal("dart", "void main() {\n  int x = 'a';\n}"), (r) => { assert.ok(r.error); assert.equal(r.errorLine, 2) })
await t("dart check", runLocal("dart", "int twice(int x) => x * 2;\nvoid main() {\n  print(twice(2));\n}", "  expect(lesson.twice(3) == 6);\n  expect(output.first == '4', 'prints 4');"), (r) => assert.deepEqual(r.check, { pass: true }))
await t("dart check fail", runLocal("dart", "int twice(int x) => x;\nvoid main() {}", "  expect(lesson.twice(3) == 6, 'twice(3) should be 6');"), (r) => assert.deepEqual(r.check, { pass: false, message: "twice(3) should be 6" }))

// Sandbox (lib/sandbox.ts): lesson code can't read the learner's files or secrets, write outside
// its scratch dir, or reach the network. Output goes back to the page, so a read is a leak.
const blocked = (r: LocalResult) => {
  const text = [r.error ?? "", ...r.lines.map((l) => l.text)].join("\n")
  assert.doesNotMatch(text, /LEAKED/, "sandbox let the secret through")
}
process.env.THONGLEARN_ESCAPE_TEST = "LEAKED"
await t("sandbox: laravel can't read .env.local", runLocal("laravel", "<?php\necho @file_get_contents(base_path('../../.env.local')) !== false ? 'LEAKED' : 'ok';"), blocked)
await t("sandbox: dart can't read ~", runLocal("dart", "import 'dart:io';\nvoid main() {\n  try { File('${Platform.environment['HOME']}/.zshrc').readAsStringSync(); print('LEAKED'); } catch (_) { print('ok'); }\n}"), blocked)
// Flutter's HOME is private (runtimes/.flutter-home), so aim at the real one.
await t("sandbox: flutter test can't read ~", runLocal("flutter", `import 'dart:io';\nimport 'package:flutter/material.dart';\nString leak() { try { return File('${homedir()}/.zshrc').readAsStringSync(); } catch (_) { return Platform.environment['THONGLEARN_ESCAPE_TEST'] ?? 'ok'; } }\nvoid main() => runApp(const SizedBox());`, "    expect(app.leak(), 'ok');", { flutterMode: "test" }), (r) => assert.equal(r.check?.pass, true, JSON.stringify(r)))
