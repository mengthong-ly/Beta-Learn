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
// TypeScript
// Dart
await t("dart run", runLocal("dart", "void main() {\n  print('hi');\n}"), (r) => { assert.equal(r.error, undefined, r.error); assert.deepEqual(r.lines, [{ kind: "out", text: "hi" }]) })
await t("dart compile error", runLocal("dart", "void main() {\n  int x = 'a';\n}"), (r) => { assert.ok(r.error); assert.equal(r.errorLine, 2) })
await t("dart check", runLocal("dart", "int twice(int x) => x * 2;\nvoid main() {\n  print(twice(2));\n}", "  expect(lesson.twice(3) == 6);\n  expect(output.first == '4', 'prints 4');"), (r) => assert.deepEqual(r.check, { pass: true }))
await t("dart check fail", runLocal("dart", "int twice(int x) => x;\nvoid main() {}", "  expect(lesson.twice(3) == 6, 'twice(3) should be 6');"), (r) => assert.deepEqual(r.check, { pass: false, message: "twice(3) should be 6" }))
// Rust
await t("rust run", runLocal("rust", 'fn main() {\n    let unused = 1;\n    println!("hi");\n}'), (r) => { assert.equal(r.error, undefined, r.error); assert.deepEqual(r.lines, [{ kind: "out", text: "hi" }]) })
await t("rust compile error", runLocal("rust", 'fn main() {\n    let x: i32 = "a";\n}'), (r) => { assert.match(r.error ?? "", /E0308/); assert.equal(r.errorLine, 2) })
await t("rust panic", runLocal("rust", 'fn main() {\n    let v = vec![1];\n    println!("{}", v[5]);\n}'), (r) => { assert.match(r.error ?? "", /^thread 'main' panicked at main\.rs:3/m); assert.equal(r.errorLine, 3) })
await t("rust tests", runLocal("rust", "fn add(a: i32, b: i32) -> i32 { a + b }\n#[test]\nfn adds() {\n    assert_eq!(add(1, 2), 3);\n}"), (r) => { assert.equal(r.error, undefined, r.error); assert.ok(r.lines.some((l) => l.text === "test adds ... ok"), JSON.stringify(r.lines)); assert.ok(r.lines.every((l) => !/finished in/.test(l.text))) })
await t("rust check", runLocal("rust", 'struct P { x: i32 }\nfn twice(x: i32) -> i32 { x * 2 }\nfn main() {\n    println!("{}", twice(P { x: 2 }.x));\n}', '        expect(lesson::twice(lesson::P { x: 3 }.x) == 6, "twice(3)");\n        expect(output == ["4"], format!("printed {output:?}"));'), (r) => { assert.deepEqual(r.check, { pass: true }); assert.deepEqual(r.lines, [{ kind: "out", text: "4" }]) })
await t("rust check fail", runLocal("rust", "fn twice(x: i32) -> i32 { x }\nfn main() {}", '        expect(lesson::twice(3) == 6, "twice(3) should be 6");'), (r) => assert.deepEqual(r.check, { pass: false, message: "twice(3) should be 6" }))
await t("rust check panics", runLocal("rust", "fn first(v: &[i32]) -> i32 { v[0] }\nfn main() {}", "        expect(lesson::first(&[]) == 0, \"never\");"), (r) => { assert.equal(r.check?.pass, false); assert.match(r.check?.message ?? "", /index out of bounds/) })

// Sandbox (lib/sandbox.ts): lesson code can't read the learner's files or secrets, write outside
// its scratch dir, or reach the network. Output goes back to the page, so a read is a leak.
const blocked = (r: LocalResult) => {
  const text = [r.error ?? "", ...r.lines.map((l) => l.text)].join("\n")
  assert.doesNotMatch(text, /LEAKED/, "sandbox let the secret through")
}
process.env.THONGLEARN_ESCAPE_TEST = "LEAKED"
await t("sandbox: dart can't read ~", runLocal("dart", "import 'dart:io';\nvoid main() {\n  try { File('${Platform.environment['HOME']}/.zshrc').readAsStringSync(); print('LEAKED'); } catch (_) { print('ok'); }\n}"), blocked)
await t("sandbox: rust can't read ~", runLocal("rust", 'fn main() {\n    let home = std::env::var("HOME").unwrap();\n    match std::fs::read_to_string(format!("{home}/.zshrc")) {\n        Ok(_) => println!("LEAKED"),\n        Err(_) => println!("{}", std::env::var("THONGLEARN_ESCAPE_TEST").unwrap_or("ok".into())),\n    }\n}'), blocked)
// Flutter's HOME is private (runtimes/.flutter-home), so aim at the real one.
await t("sandbox: flutter test can't read ~", runLocal("flutter", `import 'dart:io';\nimport 'package:flutter/material.dart';\nString leak() { try { return File('${homedir()}/.zshrc').readAsStringSync(); } catch (_) { return Platform.environment['THONGLEARN_ESCAPE_TEST'] ?? 'ok'; } }\nvoid main() => runApp(const SizedBox());`, "    expect(app.leak(), 'ok');", { flutterMode: "test" }), (r) => assert.equal(r.check?.pass, true, JSON.stringify(r)))
