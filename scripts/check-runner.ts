// Self-check for lib/local-runner.ts: output, error lines and check verdicts per toolchain.
// Usage: npm run check:runner   (needs npm run setup:runtimes first)
import assert from "node:assert/strict"
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
await t("php run", runLocal("php", '<?php\necho "hi\\n";'), (r) => { assert.equal(r.error, undefined); assert.deepEqual(r.lines, [{ kind: "out", text: "hi" }]) })
await t("php syntax error line", runLocal("php", '<?php\n\necho "hi"\necho 2;'), (r) => { assert.ok(r.error); assert.equal(r.errorLine, 4) })
await t("php check pass", runLocal("php", '<?php\n$x = 2;\necho $x;', 'expect($x === 2);\nexpect($output === "2");'), (r) => assert.deepEqual(r.check, { pass: true }))
await t("php check fail", runLocal("php", '<?php\n$x = 3;', 'expect($x === 2, "x should be 2");'), (r) => assert.deepEqual(r.check, { pass: false, message: "x should be 2" }))
// Laravel
await t("laravel str + db", runLocal("laravel", "<?php\nuse Illuminate\\Support\\Facades\\DB;\nuse Illuminate\\Support\\Facades\\Route;\necho Illuminate\\Support\\Str::of('hello world')->title(), PHP_EOL;\necho DB::table('users')->count(), PHP_EOL;\nRoute::get('/hi', fn () => 'Hi there');\necho visit('/hi')->getContent();"), (r) => { assert.equal(r.error, undefined, r.error); assert.deepEqual(r.lines.map((l) => l.text), ["Hello World", "0", "Hi there"]) })
// TypeScript
await t("ts run", runLocal("typescript", 'const n: number = 2\nconsole.log(n * 21)'), (r) => { assert.equal(r.error, undefined, r.error); assert.deepEqual(r.lines, [{ kind: "out", text: "42" }]) })
await t("ts type error", runLocal("typescript", 'const n: number = 2\nconst s: string = n'), (r) => { assert.match(r.error ?? "", /TS2322/); assert.equal(r.errorLine, 2) })
await t("ts check", runLocal("typescript", 'export const add = (a: number, b: number) => a + b\nconsole.log(add(1, 2))', 'expect(lesson.add(2, 2) === 4)\nexpect(output[0] === "3", "prints 3")'), (r) => assert.deepEqual(r.check, { pass: true }))
// Dart
await t("dart run", runLocal("dart", "void main() {\n  print('hi');\n}"), (r) => { assert.equal(r.error, undefined, r.error); assert.deepEqual(r.lines, [{ kind: "out", text: "hi" }]) })
await t("dart compile error", runLocal("dart", "void main() {\n  int x = 'a';\n}"), (r) => { assert.ok(r.error); assert.equal(r.errorLine, 2) })
await t("dart check", runLocal("dart", "int twice(int x) => x * 2;\nvoid main() {\n  print(twice(2));\n}", "  expect(lesson.twice(3) == 6);\n  expect(output.first == '4', 'prints 4');"), (r) => assert.deepEqual(r.check, { pass: true }))
await t("dart check fail", runLocal("dart", "int twice(int x) => x;\nvoid main() {}", "  expect(lesson.twice(3) == 6, 'twice(3) should be 6');"), (r) => assert.deepEqual(r.check, { pass: false, message: "twice(3) should be 6" }))
