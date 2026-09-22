---
title: Error handling
section: 4 · Control flow
---

When something unexpected happens, Dart code **throws** an exception. If nothing catches it, the program stops. All Dart exceptions are *unchecked*: functions don't declare what they throw, and you're never forced to catch.

```dart
void main() {
  try {
    int.parse('forty-two');
  } on FormatException catch (e) {
    print('Not a number: ${e.message}');
  }
  print('still running');
}
```

## throw

`throw` raises an exception. Dart ships `Exception` and `Error` types with many subtypes, like `FormatException` and `ArgumentError`. Because `throw` is an expression, it fits in an arrow function:

```dart
double divide(int a, int b) =>
    b == 0 ? throw ArgumentError('b must not be zero') : a / b;

void main() {
  print(divide(6, 4));
  try {
    divide(1, 0);
  } on ArgumentError catch (e) {
    print(e.message);
  }
}
```

> 💡 **Tip:** you *can* throw any non-null object (`throw 'Out of llamas!'`), but real code usually throws something that implements `Exception` or `Error`.

## Catching by type

`on Type` picks which exceptions a clause handles. `catch (e)` gives you the exception object, and `catch (e, s)` also gives the stack trace. The first matching clause wins, so put specific types first:

```dart
void risky(int n) {
  if (n == 1) throw FormatException('bad format');
  if (n == 2) throw StateError('bad state');
  throw 'a plain string';
}

void main() {
  for (var n in [1, 2, 3]) {
    try {
      risky(n);
    } on FormatException {
      print('format problem');
    } on Error catch (e) {
      print('an Error: $e');
    } catch (e) {
      print('anything else: $e');
    }
  }
}
```

## rethrow and finally

`rethrow` handles part of a problem, then passes it on to the caller. `finally` runs no matter what, which makes it the place for cleanup:

```dart
void misbehave() {
  try {
    throw StateError('oops');
  } catch (e) {
    print('misbehave() partially handled ${e.runtimeType}.');
    rethrow;
  } finally {
    print('cleanup always runs');
  }
}

void main() {
  try {
    misbehave();
  } catch (e) {
    print('main() finished handling ${e.runtimeType}.');
  }
}
```

## assert

`assert(condition, message)` throws an `AssertionError` when the condition is false, but **only during development**. Production builds skip asserts entirely. `dart run` enables them with `--enable-asserts`, which this runner uses:

```dart
void main() {
  var url = 'http://example.com';
  try {
    assert(url.startsWith('https'), 'URL ($url) should start with "https".');
  } on AssertionError catch (e) {
    print('Assert failed: ${e.message}');
  }
}
```

## Challenge

> 🎯 **Challenge:** Write `int parseQuantity(String input)`. Parse `input` with `int.parse`. If that throws a `FormatException`, return `0`. If the number is negative, throw an `ArgumentError`.

```dart starter
int parseQuantity(String input) {
  return int.parse(input);
}

void main() {
  print(parseQuantity('5'));
}
```

```dart solution
int parseQuantity(String input) {
  int value;
  try {
    value = int.parse(input);
  } on FormatException {
    return 0;
  }
  if (value < 0) throw ArgumentError('quantity must not be negative');
  return value;
}

void main() {
  print(parseQuantity('5'));
}
```

```dart check
  expect(lesson.parseQuantity('5') == 5, "parseQuantity('5') should be 5");
  int? bad;
  try {
    bad = lesson.parseQuantity('abc');
  } on FormatException {
    throw "parseQuantity('abc') should catch the FormatException and return 0";
  }
  expect(bad == 0, "parseQuantity('abc') should return 0, got $bad");
  var threw = false;
  try {
    lesson.parseQuantity('-3');
  } on ArgumentError {
    threw = true;
  }
  expect(threw, "parseQuantity('-3') should throw an ArgumentError");
```

**Reference:** [Error handling](https://dart.dev/language/error-handling) in the Dart language docs.
