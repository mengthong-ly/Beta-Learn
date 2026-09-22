---
title: Strings
section: 2 · Built-in types
---

A Dart `String` is an immutable sequence of UTF-16 code units. Single and double quotes work the same, so pick whichever saves you an escape:

```dart
void main() {
  var s1 = 'Single quotes work well.';
  var s2 = "Double quotes work just as well.";
  var s3 = 'It\'s easy to escape the delimiter.';
  var s4 = "It's even easier to use the other delimiter.";
  print(s1);
  print(s2);
  print(s3);
  print(s4);
}
```

## Interpolation

Put any expression inside a string with `${expression}`. If it's just a name, drop the braces: `$name`. Dart calls the value's `toString()` for you.

```dart
void main() {
  var name = 'Ada';
  var items = 3;
  print('Hi $name, you have $items items.');
  print('Shouting: ${name.toUpperCase()}!');
  print('Next year: ${items + 1}');
}
```

## Joining and multi-line strings

Adjacent string literals are joined automatically, even across lines. `+` works too. Triple quotes make a multi-line string, and an `r` prefix makes a **raw** string where `\n` is just two characters:

```dart
void main() {
  var joined = 'String '
      'concatenation'
      " works over line breaks.";
  print(joined);
  print('The + operator ' + 'works too.');

  var poem = '''
Roses are red,
Dart is too.''';
  print(poem);
  print(r'In a raw string, \n is not special.');
}
```

## Useful methods

Strings never change, so every method returns a **new** string:

```dart
void main() {
  var s = 'Never odd or even';
  print(s.contains('odd')); // true
  print(s.startsWith('Never')); // true
  print(s.indexOf('odd')); // 6
  print(s.substring(6, 9)); // odd
  print(s[0]); // N
  print('  hello  '.trim()); // hello
  print('progressive web apps'.split(' ')); // [progressive, web, apps]
  print(s.replaceAll('e', '3'));
  print(s); // unchanged
}
```

When you build a string piece by piece, use a `StringBuffer`. It only creates the final `String` when you call `toString()`:

```dart
void main() {
  var sb = StringBuffer();
  sb
    ..write('Use a StringBuffer for ')
    ..writeAll(['efficient', 'string', 'creation'], ' ')
    ..write('.');
  print(sb.toString());
}
```

> ⚠️ **Gotcha:** `length` counts UTF-16 code units, not what a person sees as characters. An emoji like 😆 (`'\u{1f606}'`) has a length of 2.

## Challenge

> 🎯 **Challenge:** Write `String badge(String name, int level)` that trims the name, upper-cases it and returns it with the level, like `'ADA (level 3)'` for `badge('  ada ', 3)`.

```dart starter
String badge(String name, int level) {
  return name;
}

void main() {
  print(badge('  ada ', 3));
}
```

```dart solution
String badge(String name, int level) {
  return '${name.trim().toUpperCase()} (level $level)';
}

void main() {
  print(badge('  ada ', 3));
}
```

```dart check
  expect(lesson.badge('  ada ', 3) == 'ADA (level 3)', "badge('  ada ', 3) should be 'ADA (level 3)', got '${lesson.badge('  ada ', 3)}'");
  expect(lesson.badge('Grace', 10) == 'GRACE (level 10)', "badge('Grace', 10) should be 'GRACE (level 10)'");
  expect(lesson.badge(' bo', 1) == 'BO (level 1)', "Trim spaces on both sides");
```

**Reference:** [Built-in types: Strings](https://dart.dev/language/built-in-types#strings) in the Dart language docs.
