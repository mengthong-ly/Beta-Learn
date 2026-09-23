import assert from "node:assert/strict"
import { test } from "node:test"

import { checkItems } from "./check-items.ts"

test("PHP: the message of each expect(), in order", () => {
  const check = `expect(addScore(["Ada" => 10], "Ada", 5) === ["Ada" => 15], "Adding 5 to Ada's 10 should give 15.");
expect(addScore([], "Linus", 3) === ["Linus" => 3], "A new name should start at 0.");
$orig = ["Ada" => 1];
addScore($orig, "Ada", 1);
expect($orig === ["Ada" => 1], "The original array should not change.");`
  assert.deepEqual(checkItems(check), [
    "Adding 5 to Ada's 10 should give 15.",
    "A new name should start at 0.",
    "The original array should not change.",
  ])
})

test("Dart: drops the interpolated 'got …' tail and nested calls in the condition", () => {
  const check = `  expect(lesson.badge('  ada ', 3) == 'ADA (level 3)', "badge('  ada ', 3) should be 'ADA (level 3)', got '\${lesson.badge('  ada ', 3)}'");
  expect(lesson.badge(' bo', 1) == 'BO (level 1)', "Trim spaces on both sides");`
  assert.deepEqual(checkItems(check), [
    "badge('  ada ', 3) should be 'ADA (level 3)'",
    "Trim spaces on both sides",
  ])
})

test("C++ and TypeScript: plain and template-literal messages; duplicates once", () => {
  assert.deepEqual(
    checkItems(`    expect(output.size() == 1, "Print one line");
    expect(output[0] == "C++ 23", "Print exactly: C++ 23");
    expect(output.size() == 1, "Print one line");`),
    ["Print one line", "Print exactly: C++ 23"]
  )
  assert.deepEqual(checkItems("expect(lesson.total([]) === 0, `total([]) should be 0, got ${lesson.total([])}`)"), [
    "total([]) should be 0",
  ])
})

test("Flutter: reason: arguments, across lines; no message means no item", () => {
  const check = `    expect(find.byType(Expanded), findsNWidgets(2), reason: 'Wrap each panel in an Expanded');
    final left = panel('Left');
    expect(left.width + right.width, moreOrLessEquals(800),
        reason: 'The two panels should fill the whole width');
    expect(find.text('Hi'), findsOneWidget);`
  assert.deepEqual(checkItems(check), [
    "Wrap each panel in an Expanded",
    "The two panels should fill the whole width",
  ])
})

test("skips messages that are templates over loop data", () => {
  const check = `  cases.forEach((input, want) {
    expect(got == want, "total('\${input.$1}', \${input.$2}) should be '$want', got '$got'");
    expect(got == want, 'formatDuration($input) should be "$want", got "$got"');
  });`
  assert.deepEqual(checkItems(check), [])
})

test("no check, no items", () => {
  assert.deepEqual(checkItems(undefined), [])
})
