---
title: Branches
section: 4 · Control flow
---

`if` works as you'd expect, with optional `else if` and `else`. The condition must be a real `bool`: Dart won't treat `0` or `''` as false.

```dart
void main() {
  var temperature = 12;
  if (temperature > 25) {
    print('Shorts');
  } else if (temperature > 10) {
    print('Jacket');
  } else {
    print('Coat');
  }
}
```

## if-case

`if (value case pattern)` runs the branch only when the pattern matches, with the pattern's variables in scope. Use it to test one pattern:

```dart
void main() {
  Object pair = [3, 4];
  if (pair case [int x, int y]) {
    print('Coordinate $x,$y');
  } else {
    print('Invalid coordinates');
  }
}
```

## switch statements

A `switch` statement tries each `case` pattern in order. A non-empty case ends by itself: **no `break` needed**. An empty case falls through to the next one, so cases can share a body. `default` (or `_`) catches everything else:

```dart
void handle(String command) {
  switch (command) {
    case 'OPEN':
      print('opening');
    case 'DENIED': // empty: falls through
    case 'CLOSED':
      print('closing');
    default:
      print('unknown: $command');
  }
}

void main() {
  handle('OPEN');
  handle('DENIED');
  handle('RESET');
}
```

## switch expressions

A switch **expression** produces a value. The syntax is tighter: no `case` keyword, `=>` between pattern and result, commas between cases, and `_` for the default:

```dart
String describe(int n) => switch (n) {
  0 => 'zero',
  1 || 2 || 3 => 'a few',
  < 0 => 'negative',
  _ => 'many',
};

void main() {
  for (var n in [0, 2, -4, 99]) {
    print('$n: ${describe(n)}');
  }
}
```

## Guards

`when` adds a condition after the pattern matches. If the guard is false, Dart moves on to the **next case** rather than leaving the switch:

```dart
String classify((int, int) pair) => switch (pair) {
  (var a, var b) when a > b => 'first is bigger',
  (var a, var b) when a < b => 'second is bigger',
  _ => 'equal',
};

void main() {
  print(classify((5, 2)));
  print(classify((1, 9)));
  print(classify((4, 4)));
}
```

## Exhaustiveness

Dart checks that a switch covers every possible value. For types like `bool`, enums and sealed classes it knows all the options, so a missing one is a **compile error**:

```dart
void main() {
  bool? answer = null;
  switch (answer) { // error! the null case isn't handled
    case true:
      print('yes');
    case false:
      print('no');
  }
}
```

That's a feature: add a new enum value or subclass later and the compiler points at every switch you need to update.

## Challenge

> 🎯 **Challenge:** Write `String grade(int score)` using a switch expression. Return `'invalid'` for scores below 0 or above 100, then `'A'` for 90 and up, `'B'` for 80 and up, `'C'` for 70 and up, and `'F'` otherwise.

```dart starter
String grade(int score) {
  return 'F';
}

void main() {
  print(grade(95));
}
```

```dart solution
String grade(int score) => switch (score) {
  < 0 || > 100 => 'invalid',
  >= 90 => 'A',
  >= 80 => 'B',
  >= 70 => 'C',
  _ => 'F',
};

void main() {
  print(grade(95));
}
```

```dart check
  final cases = {95: 'A', 90: 'A', 100: 'A', 85: 'B', 80: 'B', 72: 'C', 69: 'F', 0: 'F', -5: 'invalid', 101: 'invalid'};
  cases.forEach((score, want) {
    final got = lesson.grade(score);
    expect(got == want, 'grade($score) should be "$want", got "$got"');
  });
```

**Reference:** [Branches](https://dart.dev/language/branches) in the Dart language docs.
