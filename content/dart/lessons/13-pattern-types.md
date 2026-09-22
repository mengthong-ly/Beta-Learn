---
title: Pattern types
section: 3 · Patterns
---

Dart has a small set of pattern kinds that snap together. This lesson uses **switch expressions** to try them: `switch (value) { pattern => result, ... }` returns the result of the first pattern that matches, and `_` matches anything. (The Branches lesson covers `switch` in full.)

## Logical-or, relational and logical-and

`||` matches if any branch matches. Relational patterns (`<`, `>=`, `==` …) compare against a constant, and `&&` combines them into ranges:

```dart
String asciiCharType(int char) {
  const space = 32;
  const zero = 48;
  const nine = 57;
  return switch (char) {
    < space => 'control',
    == space => 'space',
    > space && < zero => 'punctuation',
    >= zero && <= nine => 'digit',
    _ => 'other',
  };
}

String kind(String day) => switch (day) {
  'Sat' || 'Sun' => 'weekend',
  _ => 'weekday',
};

void main() {
  print(asciiCharType(32)); // space
  print(asciiCharType(53)); // digit
  print(kind('Sun')); // weekend
}
```

## List patterns and rest elements

A list pattern must match the whole list, unless it has a **rest element** `...`, which soaks up any number of items. Give it a name to collect them:

```dart
void main() {
  var [a, b, ..., c, d] = [1, 2, 3, 4, 5, 6, 7];
  print('$a $b $c $d'); // 1 2 6 7

  var [first, ...rest] = ['x', 'y', 'z'];
  print('$first $rest'); // x [y, z]

  var [_, two, _] = [1, 2, 3]; // _ is a wildcard: match, don't bind
  print(two);
}
```

## Typed variables, null-check and constants

A typed variable pattern like `int n` only matches values of that type. `var s?` matches only non-null values and gives you a non-nullable variable. A literal like `null` or `0` is a constant pattern:

```dart
String describe(Object? value) => switch (value) {
  null => 'nothing',
  0 => 'zero',
  int n => 'the int $n',
  String s => 'the string "$s"',
  _ => 'something else',
};

void main() {
  print(describe(null));
  print(describe(0));
  print(describe(42));
  print(describe('hi'));

  String? maybe = 'hello';
  if (maybe case var s?) {
    print(s.length); // s is a non-nullable String here
  }
}
```

## Record and object patterns

Record patterns take a record apart by position or name. Object patterns match a type and read its getters. In both, `:name` is short for `name: name`:

```dart
class Point {
  final int x, y;
  Point(this.x, this.y);
}

void main() {
  var (myString: s, myNumber: n) = (myString: 'string', myNumber: 1);
  print('$s $n');

  var Point(:x, :y) = Point(1, 2);
  print('x=$x y=$y');

  Object shape = Point(0, 5);
  if (shape case Point(x: 0, :var y)) {
    print('on the y axis at $y');
  }
}
```

Object patterns don't need to mention every field. Record patterns, like list patterns without a rest element, must match the whole shape.

> ⚠️ **Gotcha:** in a `case`, a bare name like `c` is a **constant** pattern that compares against the constant `c`. To bind a new variable, write `var c` (or a type, `int c`).

## Challenge

> 🎯 **Challenge:** Write `String summarize(List<int> xs)` with a switch expression and list patterns. Return `'empty'` for `[]`, `'just 5'` for a one-item list like `[5]`, and `'1 to 9'` for a longer list that starts with `1` and ends with `9`.

```dart starter
String summarize(List<int> xs) {
  return 'empty';
}

void main() {
  print(summarize([1, 4, 9]));
}
```

```dart solution
String summarize(List<int> xs) => switch (xs) {
  [] => 'empty',
  [var only] => 'just $only',
  [var first, ..., var last] => '$first to $last',
};

void main() {
  print(summarize([1, 4, 9]));
}
```

```dart check
  final cases = {'[]': (<int>[], 'empty'), '[5]': ([5], 'just 5'), '[1, 4, 9]': ([1, 4, 9], '1 to 9'), '[3, 8]': ([3, 8], '3 to 8')};
  cases.forEach((label, c) {
    final got = lesson.summarize(c.$1);
    expect(got == c.$2, 'summarize($label) should be "${c.$2}", got "$got"');
  });
```

**Reference:** [Pattern types](https://dart.dev/language/pattern-types) in the Dart language docs.
