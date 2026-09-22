---
title: Patterns
section: 3 · Patterns
---

A **pattern** describes the shape of a value. Dart uses patterns to do two jobs, often at once:

- **Match**: does this value have the shape I expect (a certain type, constant, length…)?
- **Destructure**: pull the parts out into new variables.

The simplest place to see destructuring is a variable declaration. The pattern on the left mirrors the value on the right:

```dart
void main() {
  var numList = [1, 2, 3];
  var [a, b, c] = numList; // list pattern
  print(a + b + c); // 6

  var (name, [x, y]) = ('str', [1, 2]); // patterns nest
  print('$name $x $y');
}
```

A pattern declaration must start with `var` or `final`.

## Swapping without a temp variable

A pattern on the left of a plain assignment assigns to **existing** variables:

```dart
void main() {
  var (a, b) = ('left', 'right');
  (b, a) = (a, b); // swap
  print('$a $b'); // right left
}
```

## Matching in switch and if-case

In a `case`, a pattern may or may not match. If it doesn't, Dart simply moves on. Variables it binds live only inside that case, and a `when` **guard** adds an extra condition:

```dart
void check(Object obj) {
  switch (obj) {
    case 1:
      print('one');
    case int n when n >= 10 && n <= 20:
      print('in range');
    case (var a, var b):
      print('a record: a = $a, b = $b');
    default:
      print('something else');
  }
}

void main() {
  check(1);
  check(15);
  check((3, 4));
  check('hi');
}
```

## Validating data

Patterns shine at checking data from outside your program, like decoded JSON. Without patterns this takes a pile of `is` checks and casts. With an **if-case** statement it's one line:

```dart
void main() {
  Object data = {
    'user': ['Lily', 13],
  };
  if (data case {'user': [String name, int age]}) {
    print('User $name is $age years old.');
  }
}
```

That single pattern checks that `data` is a map, has a `'user'` key, that the value is a two-item list, and that the items are a `String` and an `int`. Only then does it bind `name` and `age`.

## Destructuring in loops

`for-in` loops accept patterns too. Here an object pattern pulls `key` and `value` out of each map entry. `:key` is short for `key: key`:

```dart
void main() {
  var hist = {'a': 23, 'b': 100};
  for (var MapEntry(:key, value: count) in hist.entries) {
    print('$key occurred $count times');
  }
}
```

> 💡 **Tip:** a function returning a record plus a destructuring declaration, `var (name, age) = userInfo();`, is the everyday way to return multiple values.

## Challenge

> 🎯 **Challenge:** Write `String? greet(Object? json)` that uses an if-case to check for the shape `{'user': [String name, int age]}`. If it matches, return `'Lily is 13'` (with the real values). Otherwise return `null`.

```dart starter
String? greet(Object? json) {
  return null;
}

void main() {
  print(greet({'user': ['Lily', 13]}));
}
```

```dart solution
String? greet(Object? json) {
  if (json case {'user': [String name, int age]}) {
    return '$name is $age';
  }
  return null;
}

void main() {
  print(greet({'user': ['Lily', 13]}));
}
```

```dart check
  expect(lesson.greet({'user': ['Lily', 13]}) == 'Lily is 13', "greet({'user': ['Lily', 13]}) should be 'Lily is 13'");
  expect(lesson.greet({'user': ['Bo', 7]}) == 'Bo is 7', "greet({'user': ['Bo', 7]}) should be 'Bo is 7'");
  expect(lesson.greet({'user': [13, 'Lily']}) == null, 'Wrong types should give null');
  expect(lesson.greet({'user': ['Lily']}) == null, 'A list of the wrong length should give null');
  expect(lesson.greet(null) == null, 'null should give null');
  expect(lesson.greet('user') == null, 'A non-map should give null');
```

**Reference:** [Patterns](https://dart.dev/language/patterns) in the Dart language docs.
