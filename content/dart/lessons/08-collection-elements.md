---
title: Spread, if & for in collections
section: 2 · Built-in types
---

A collection literal isn't just a fixed list of values. Inside `[...]`, `{...}` you can use **control flow elements** that add zero, one or many items as the collection is built. They're Dart's answer to list comprehensions.

## Spread: `...`

`...` unpacks another collection into this one. `...?` does the same but skips a collection that is `null`:

```dart
void main() {
  var a = [1, 2, 3];
  List<int>? missing;
  var items = [0, ...a, ...?missing, 4];
  print(items); // [0, 1, 2, 3, 4]
}
```

Plain `...` on a nullable list is a compile error, so null safety pushes you to `...?`.

## Collection if

`if` includes an item only when a condition holds, with an optional `else`:

```dart
void main() {
  var loggedIn = true;
  var name = 'apple';
  var nav = ['Home', if (loggedIn) 'Profile' else 'Log in', 'Help'];
  var items = [0, if (name == 'orange') 1 else 10, 2];
  print(nav); // [Home, Profile, Help]
  print(items); // [0, 10, 2]
}
```

## Collection for

`for` repeats an element for each value:

```dart
void main() {
  var numbers = [2, 3, 4];
  var squares = [1, for (var n in numbers) n * n, 7];
  print(squares); // [1, 4, 9, 16, 7]
  var countdown = [for (var x = 5; x > 2; x--) x];
  print(countdown); // [5, 4, 3]
}
```

## Nesting

Elements nest freely. A `for` with an `if` inside is a filter-and-transform in one line. Wrap several items in `...[ ]` to add them together:

```dart
void main() {
  var numbers = [1, 2, 3, 4, 5, 6, 7];
  var evens = [0, for (var n in numbers) if (n.isEven) n, 8];
  print(evens); // [0, 2, 4, 6, 8]

  var admin = true;
  var menu = ['Open', if (admin) ...['Settings', 'Users']];
  print(menu); // [Open, Settings, Users]
}
```

## Null-aware elements

A `?` in front of an element adds it only if it isn't `null`. In a map, `?` can guard the key, the value, or both:

```dart
void main() {
  int? absent;
  int? present = 3;
  print([1, ?absent, ?present, 5]); // [1, 3, 5]

  String? nickname;
  var profile = {'name': 'Ada', 'nickname': ?nickname};
  print(profile); // {name: Ada}
}
```

> 💡 **Tip:** these elements work in maps and sets too: `{for (var w in words) w: w.length}` builds a map in one expression.

## Challenge

> 🎯 **Challenge:** Write `List<int> evenSquares(List<int> numbers)` that returns the square of every **even** number, in order, using a collection `for` and `if`. `evenSquares([1, 2, 3, 4])` returns `[4, 16]`.

```dart starter
List<int> evenSquares(List<int> numbers) {
  return numbers;
}

void main() {
  print(evenSquares([1, 2, 3, 4]));
}
```

```dart solution
List<int> evenSquares(List<int> numbers) {
  return [for (var n in numbers) if (n.isEven) n * n];
}

void main() {
  print(evenSquares([1, 2, 3, 4]));
}
```

```dart check
  String show(List<int> l) => l.toString();
  expect(show(lesson.evenSquares([1, 2, 3, 4])) == '[4, 16]', 'evenSquares([1, 2, 3, 4]) should be [4, 16], got ${lesson.evenSquares([1, 2, 3, 4])}');
  expect(show(lesson.evenSquares([6, 5, 0])) == '[36, 0]', 'evenSquares([6, 5, 0]) should be [36, 0]');
  expect(lesson.evenSquares([1, 3, 5]).isEmpty, 'No even numbers gives an empty list');
```

**Reference:** [Collections: collection elements](https://dart.dev/language/collections#collection-elements) in the Dart language docs.
