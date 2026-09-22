---
title: Records
section: 2 · Built-in types
---

A **record** bundles a few values into one, without declaring a class. Records are fixed-size, can mix types, and are immutable. Write one with parentheses and commas:

```dart
void main() {
  var record = ('first', a: 2, b: true, 'last');
  print(record.$1); // first
  print(record.a); // 2
  print(record.b); // true
  print(record.$2); // last
}
```

Positional fields are read with `$1`, `$2`, … (named fields don't count toward the numbering). Named fields are read by name. There are no setters: once made, a record never changes.

## Record types

A record's type is its **shape**: the types of its positional fields, plus the names and types of its named fields. Write it the same way, with named fields in braces:

```dart
void main() {
  (String, int) person = ('Ada', 36);
  ({int x, int y}) point = (x: 3, y: 4);
  print('${person.$1} is ${person.$2}');
  print(point.x + point.y);
}
```

Names on *positional* fields, like `(int a, int b)`, are just documentation. Names on *named* fields are part of the type, so `({int a, int b})` and `({int x, int y})` are different types.

## Multiple return values

Records shine when a function needs to return more than one thing. Pull the values back out with a destructuring pattern:

```dart
(String, int) userInfo() {
  return ('Dash', 10);
}

({double min, double max}) range(double a, double b) =>
    a < b ? (min: a, max: b) : (min: b, max: a);

void main() {
  var (name, age) = userInfo();
  print('$name is $age');

  final (:min, :max) = range(9, 2); // :min means "the field named min"
  print('from $min to $max');
}
```

## Equality

Records compare by value. Two records are equal if they have the same shape and equal fields. Named field order doesn't matter:

```dart
void main() {
  print((1, 2) == (1, 2)); // true
  print((x: 1, y: 2) == (y: 2, x: 1)); // true
  print((1, 2) == (2, 1)); // false
}
```

> 💡 **Tip:** records are perfect for small, throwaway groupings. If the data needs methods or a name everyone knows, reach for a class, or give the record type a name with a `typedef`.

## Challenge

> 🎯 **Challenge:** Write `divide(int a, int b)` that returns a record with named fields `quotient` and `remainder`. `divide(17, 5)` returns `(quotient: 3, remainder: 2)`.

```dart starter
({int quotient, int remainder}) divide(int a, int b) {
  return (quotient: 0, remainder: 0);
}

void main() {
  print(divide(17, 5));
}
```

```dart solution
({int quotient, int remainder}) divide(int a, int b) {
  return (quotient: a ~/ b, remainder: a % b);
}

void main() {
  print(divide(17, 5));
}
```

```dart check
  final r = lesson.divide(17, 5);
  expect(r == (quotient: 3, remainder: 2), 'divide(17, 5) should be (quotient: 3, remainder: 2), got $r');
  expect(lesson.divide(20, 4) == (quotient: 5, remainder: 0), 'divide(20, 4) should be (quotient: 5, remainder: 0)');
  expect(lesson.divide(7, 10).remainder == 7, 'divide(7, 10).remainder should be 7');
```

**Reference:** [Records](https://dart.dev/language/records) in the Dart language docs.
