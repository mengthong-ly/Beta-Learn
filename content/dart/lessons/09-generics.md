---
title: Generics
section: 2 · Built-in types
---

`List` is really `List<E>`: a **generic** type with a type parameter `E`. When you write `List<String>` you tell Dart, your teammates and your tools that only strings belong inside, and mistakes get caught before the program runs.

```dart
void main() {
  var names = <String>['Seth', 'Kathy', 'Lars'];
  var uniqueNames = <String>{'Seth', 'Kathy', 'Lars'};
  var pages = <String, String>{'index.html': 'Homepage'};
  var nameSet = Set<String>.of(names); // type argument on a constructor
  print('$names $uniqueNames $pages $nameSet');
  // names.add(42); would not compile
}
```

## Write once, use for any type

Generics also cut duplication. Instead of an `IntBox` and a `StringBox`, write one `Box<T>`. `T` is a placeholder that gets filled in by whoever uses it:

```dart
class Box<T> {
  T value;
  Box(this.value);
  T get() => value;
}

void main() {
  var a = Box<int>(3);
  var b = Box('hi'); // T is inferred as String
  print(a.get() + 1);
  print(b.get().toUpperCase());
}
```

## Generic functions

Functions and methods can take type parameters too. Here `T` appears in the return type, the parameter type and a local variable:

```dart
T first<T>(List<T> ts) {
  T tmp = ts[0];
  return tmp;
}

void main() {
  print(first([10, 20, 30]) + 1); // 11: Dart knows it's an int
  print(first(['x', 'y']).length); // 1: Dart knows it's a String
}
```

## Types are kept at runtime

Dart generics are **reified**: the type argument is still there while the program runs, so you can test for it. (Java, by contrast, erases it.)

```dart
void main() {
  var names = <String>['Seth'];
  Object thing = names;
  print(thing is List<String>); // true
  print(thing is List<int>); // false
}
```

## Bounds

`extends` restricts which types are allowed. Then you can use that type's members on `T`:

```dart
T largest<T extends num>(T a, T b) => a > b ? a : b;

void main() {
  print(largest(3, 7)); // 7
  print(largest(2.5, 1.5)); // 2.5
  // largest('a', 'b'); would not compile: String isn't a num
}
```

> 💡 **Tip:** `T extends Object` is a common bound: it means "any type except nullable ones", since the default bound is `Object?`.

## Challenge

> 🎯 **Challenge:** Write a generic function `List<T> repeat<T>(T value, int times)` that returns a list containing `value` exactly `times` times. `repeat('ha', 3)` returns `['ha', 'ha', 'ha']`, and its type must be `List<String>`.

```dart starter
List<T> repeat<T>(T value, int times) {
  return [];
}

void main() {
  print(repeat('ha', 3));
}
```

```dart solution
List<T> repeat<T>(T value, int times) {
  return [for (var i = 0; i < times; i++) value];
}

void main() {
  print(repeat('ha', 3));
}
```

```dart check
  final words = lesson.repeat('ha', 3);
  expect(words.join(',') == 'ha,ha,ha', "repeat('ha', 3) should be [ha, ha, ha], got $words");
  expect(words is List<String>, 'repeat should return a List<T>, here List<String>');
  final nums = lesson.repeat(7, 2);
  expect(nums is List<int> && nums.length == 2 && nums.every((n) => n == 7), 'repeat(7, 2) should be [7, 7]');
  expect(lesson.repeat(true, 0).isEmpty, 'repeat(x, 0) should be empty');
```

**Reference:** [Generics](https://dart.dev/language/generics) in the Dart language docs.
