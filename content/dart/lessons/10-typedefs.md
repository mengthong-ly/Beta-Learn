---
title: Typedefs
section: 2 · Built-in types
---

A **type alias**, usually called a typedef after its keyword, gives a type a shorter or clearer name. It doesn't create a new type: the alias and the original are interchangeable.

```dart
typedef IntList = List<int>;

void main() {
  IntList il = [1, 2, 3];
  List<int> same = il; // same type, no conversion needed
  print(same);
}
```

An alias can take type parameters, which helps with long nested types:

```dart
typedef ListMapper<X> = Map<X, List<X>>;

void main() {
  Map<String, List<String>> m1 = {}; // verbose
  ListMapper<String> m2 = {}; // same thing, shorter
  m2['fruit'] = ['apple', 'pear'];
  print('$m1 $m2');
}
```

## Naming record types

Records have no declared name, so a typedef is the natural way to give a record shape one:

```dart
typedef Coordinates = ({double lat, double lng});

String describe(Coordinates c) => '${c.lat}, ${c.lng}';

void main() {
  Coordinates lisbon = (lat: 38.7, lng: -9.1);
  print(describe(lisbon));
}
```

## Function types

A typedef can name a function type too. The docs recommend inline function types in most cases, but a named one reads well when it shows up often:

```dart
typedef Compare<T> = int Function(T a, T b);

int byValue(int a, int b) => a - b;

void main() {
  print(byValue is Compare<int>); // true
  Compare<String> byLength = (a, b) => a.length - b.length;
  var words = ['kiwi', 'fig', 'banana'];
  words.sort(byLength);
  print(words); // [fig, kiwi, banana]
}
```

> 💡 **Tip:** because an alias is just another name, changing what `Coordinates` means later updates every place that uses it.

## Challenge

> 🎯 **Challenge:** Declare `typedef Point = ({int x, int y});`, then write `Point move(Point p, int dx, int dy)` that returns a new point shifted by `dx` and `dy`. `move((x: 1, y: 2), 3, 4)` returns `(x: 4, y: 6)`.

```dart starter
// declare the Point typedef and the move function here

void main() {
  // print(move((x: 1, y: 2), 3, 4));
}
```

```dart solution
typedef Point = ({int x, int y});

Point move(Point p, int dx, int dy) => (x: p.x + dx, y: p.y + dy);

void main() {
  print(move((x: 1, y: 2), 3, 4));
}
```

```dart check
  lesson.Point start = (x: 1, y: 2);
  final got = lesson.move(start, 3, 4);
  expect(got == (x: 4, y: 6), 'move((x: 1, y: 2), 3, 4) should be (x: 4, y: 6), got $got');
  expect(lesson.move((x: 0, y: 0), -1, 0) == (x: -1, y: 0), 'move((x: 0, y: 0), -1, 0) should be (x: -1, y: 0)');
```

**Reference:** [Typedefs](https://dart.dev/language/typedefs) in the Dart language docs.
