---
title: Operators
section: 1 · Basics
---

Dart has the arithmetic operators you'd expect, plus one you might not: `~/` divides and returns an **int**. Plain `/` always gives a `double`.

```dart
void main() {
  print(2 + 3); // 5
  print(5 / 2); // 2.5, a double
  print(5 ~/ 2); // 2, an int
  print(5 % 2); // 1, the remainder
  print('5/2 = ${5 ~/ 2} r ${5 % 2}');
}
```

`++` and `--` come in two flavours. Prefix (`++a`) changes the variable, then gives the new value. Postfix (`a++`) gives the old value, then changes it:

```dart
void main() {
  var a = 0;
  var b = ++a; // a becomes 1, b gets 1
  print('$a $b');

  a = 0;
  b = a++; // b gets 0, then a becomes 1
  print('$a $b');
}
```

## Comparing and testing types

`==` asks "do these represent the same thing?". It's really a method call on the left operand. To check for the *exact same object*, use `identical()`. `is` and `is!` test a type at runtime:

```dart
void main() {
  Object value = 'hello';
  print(2 == 2); // true
  print(value is String); // true
  print(value is! int); // true
  if (value is String) {
    print(value.toUpperCase()); // Dart knows it's a String here
  }
}
```

`as` casts to a type. Only use it when you're *sure*, because a wrong cast throws.

## Assignment shortcuts

Compound operators like `+=` and `*=` combine math with assignment. `??=` assigns only if the variable is currently `null`:

```dart
void main() {
  var a = 2;
  a *= 3; // a = a * 3
  print(a); // 6

  String? b;
  b ??= 'first';
  b ??= 'second'; // b isn't null, so nothing happens
  print(b); // first
}
```

## Conditional expressions

`condition ? a : b` picks one of two values. `a ?? b` gives `a` unless it's `null`, then `b`:

```dart
String playerName(String? name) => name ?? 'Guest';

void main() {
  var isPublic = false;
  var visibility = isPublic ? 'public' : 'private';
  print(visibility);
  print(playerName(null));
  print(playerName('Ada'));
}
```

## Cascades

`..` runs a sequence of operations on the **same object**, so you don't need a temporary variable. The whole expression evaluates to that object:

```dart
void main() {
  var sb = StringBuffer()
    ..write('Hello')
    ..write(', ')
    ..write('Dart');
  print(sb.toString());
}
```

> 💡 **Tip:** `?.` reads a member only if the left side isn't null (`name?.length`), and `!` asserts "this isn't null" and throws if it is. You'll use both a lot in the null safety lesson.

## Challenge

> 🎯 **Challenge:** Write `String formatDuration(int totalMinutes)` that returns hours and minutes like `'2h 5m'`. Use `~/` and `%`. For example, `formatDuration(125)` returns `'2h 5m'` and `formatDuration(45)` returns `'0h 45m'`.

```dart starter
String formatDuration(int totalMinutes) {
  return '';
}

void main() {
  print(formatDuration(125));
}
```

```dart solution
String formatDuration(int totalMinutes) {
  final hours = totalMinutes ~/ 60;
  final minutes = totalMinutes % 60;
  return '${hours}h ${minutes}m';
}

void main() {
  print(formatDuration(125));
}
```

```dart check
  final cases = {125: '2h 5m', 45: '0h 45m', 60: '1h 0m', 0: '0h 0m', 601: '10h 1m'};
  cases.forEach((input, want) {
    final got = lesson.formatDuration(input);
    expect(got == want, 'formatDuration($input) should be "$want", got "$got"');
  });
```

**Reference:** [Operators](https://dart.dev/language/operators) in the Dart language docs.
