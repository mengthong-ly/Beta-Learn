---
title: The type system
section: 2 · Built-in types
---

Dart is **sound**: an expression's value always matches its static type. If the type says `String`, you get a string at runtime, guaranteed. Dart enforces this with compile-time checks, plus runtime checks for the few things (like casts) that can't be known in advance.

Types are required, but writing them isn't, because Dart **infers** them:

```dart
void main() {
  var arguments = {'argA': 'hello', 'argB': 42};
  print(arguments is Map<String, Object>); // true
  var listOfDouble = [3.0];
  var ints = listOfDouble.map((x) => x.toInt()); // Iterable<int>
  print(ints.first + 1);
}
```

The values are a `String` and an `int`, so the map's value type becomes their shared supertype, `Object`.

## Inference happens once

A local variable's type comes from its initializer. Later assignments don't widen it, so this fails to compile:

```dart
void main() {
  var x = 3; // inferred as int
  x = 4.0; // error! a double isn't an int
  print(x);
}
```

If you need more room, say so with an annotation:

```dart
void main() {
  num y = 3; // a num can be an int or a double
  y = 4.0;
  print(y);
}
```

## Empty literals need a type

`[]` on its own has nothing to infer from, so it becomes `List<dynamic>`, and a `List<dynamic>` isn't accepted where a `List<int>` is expected. Add the type argument:

```dart
void printInts(List<int> a) => print(a);

void main() {
  final list = <int>[];
  list.add(1);
  list.add(2);
  printInts(list);
}
```

## Runtime checks

`is` tests a type while the program runs, and inside the `if` Dart **promotes** the variable to that type. `as` casts, and throws if you're wrong:

```dart
void main() {
  Object value = 'hello';
  if (value is String) {
    print(value.length); // promoted: value is a String here
  }
  try {
    var n = value as int;
    print(n);
  } catch (e) {
    print('bad cast: $e');
  }
}
```

> ⚠️ **Gotcha:** `dynamic` turns static checking off. `String s = someDynamic;` compiles, but throws at runtime if the value isn't a string. Prefer `Object?` and an `is` check.

## Challenge

> 🎯 **Challenge:** Write `String describe(Object value)` that uses `is` checks to return `'int 3'` for the int `3`, `'String hi (2 chars)'` for `'hi'`, `'double 2.5'` for `2.5`, and `'something else'` for anything else.

```dart starter
String describe(Object value) {
  return 'something else';
}

void main() {
  print(describe(3));
  print(describe('hi'));
}
```

```dart solution
String describe(Object value) {
  if (value is int) return 'int $value';
  if (value is String) return 'String $value (${value.length} chars)';
  if (value is double) return 'double $value';
  return 'something else';
}

void main() {
  print(describe(3));
  print(describe('hi'));
}
```

```dart check
  final cases = <Object, String>{3: 'int 3', 'hi': 'String hi (2 chars)', 2.5: 'double 2.5', true: 'something else', 'dart': 'String dart (4 chars)'};
  cases.forEach((input, want) {
    final got = lesson.describe(input);
    expect(got == want, 'describe($input) should be "$want", got "$got"');
  });
```

**Reference:** [The Dart type system](https://dart.dev/language/type-system) in the Dart language docs.
