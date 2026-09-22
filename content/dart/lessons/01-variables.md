---
title: Variables
section: 1 · Basics
---

`var` declares a variable, and Dart infers its type from the value. Here `name` is a `String`:

```dart
void main() {
  var name = 'Bob';
  print(name);
  print(name.runtimeType); // String
}
```

Every Dart program starts at `main()`. A variable stores a *reference* to an object. You can also write the type yourself instead of `var`: `String name = 'Bob';`. If a variable isn't restricted to one type, use `Object`.

```dart
void main() {
  String city = 'Lisbon';
  Object anything = 'text';
  anything = 42; // fine: an int is an Object too
  print('$city $anything');
}
```

## Null safety

A variable can only hold `null` if its type says so with a `?`. An uninitialized variable with a nullable type starts as `null`, even a number, because numbers are objects too:

```dart
void main() {
  int? lineCount;
  print(lineCount); // null
  lineCount = 3;
  print(lineCount + 1);
}
```

A non-nullable variable has no default. Dart makes you assign it before you read it, but not necessarily on the same line:

```dart
void main() {
  var weLikeToCount = true;
  int lineCount;
  if (weLikeToCount) {
    lineCount = 42;
  } else {
    lineCount = 0;
  }
  print(lineCount); // Dart can see it's always set by now
}
```

## late

`late` says "trust me, this will be set before it's read". If you initialize a `late` variable where you declare it, the initializer runs lazily, the first time the variable is used:

```dart
String readThermometer() {
  print('reading...');
  return '21°C';
}

late String temperature = readThermometer();

void main() {
  print('start');
  print(temperature); // readThermometer() runs now, not before
}
```

> ⚠️ **Gotcha:** reading a `late` variable that was never set is a runtime error, not a compile error.

## final and const

A `final` variable can be set only once. A `const` variable is a compile-time constant, fixed before the program runs. (`const` variables are implicitly final.)

```dart
void main() {
  final nickname = 'Bobby';
  const bar = 1000000;
  const double atm = 1.01325 * bar; // arithmetic on constants is constant
  print('$nickname $bar $atm');
  // nickname = 'Alice'; would be a compile error
}
```

> 💡 **Tip:** a `final` list can still have its items changed. A `const` list can't: it's immutable all the way down.

## Challenge

> 🎯 **Challenge:** Declare a `final` variable `language` set to `'Dart'` and a `const` variable `version` set to `3`, then print `Dart 3`.

```dart starter
void main() {
  // declare language and version, then print them
}
```

```dart solution
void main() {
  final language = 'Dart';
  const version = 3;
  print('$language $version');
}
```

```dart check
  expect(output.isNotEmpty && output.first == 'Dart 3', 'Print exactly: Dart 3');
```

**Reference:** [Variables](https://dart.dev/language/variables) in the Dart language docs.
