---
title: Lists, sets & maps
section: 2 · Built-in types
---

Dart has three built-in collections, each with its own literal syntax.

## Lists

A `List` is an ordered group of objects, written in square brackets. Indexes start at 0:

```dart
void main() {
  var fruits = ['apples', 'oranges'];
  fruits.add('kiwis');
  fruits.addAll(['grapes', 'bananas']);
  print(fruits.length); // 5
  print(fruits[1]); // oranges
  fruits[0] = 'pears';
  fruits.removeAt(fruits.indexOf('kiwis'));
  print(fruits);
  fruits.sort((a, b) => a.compareTo(b));
  print(fruits);
}
```

Dart infers that `fruits` is a `List<String>`, so `fruits.add(5)` won't compile. For an empty list, give the type yourself: `<String>[]`.

> 💡 **Tip:** a trailing comma after the last item is allowed, and handy when each item sits on its own line.

## Sets

A `Set` is an unordered collection of **unique** items, written in curly braces. Adding a duplicate does nothing:

```dart
void main() {
  var ingredients = {'gold', 'titanium', 'xenon'};
  ingredients.add('gold'); // already there
  print(ingredients.length); // 3
  print(ingredients.contains('titanium')); // true

  var nobleGases = {'xenon', 'argon'};
  print(ingredients.intersection(nobleGases)); // {xenon}
}
```

> ⚠️ **Gotcha:** `{}` on its own is an empty **map**, because map literals came first. For an empty set write `<String>{}` or `Set<String> names = {};`.

## Maps

A `Map` links keys to values. Each key appears once. Looking up a missing key gives `null`:

```dart
void main() {
  var gifts = {'first': 'partridge', 'second': 'turtledoves'};
  gifts['fifth'] = 'golden rings'; // add a pair
  print(gifts['first']); // partridge
  print(gifts['tenth']); // null
  print(gifts.containsKey('second')); // true
  gifts.remove('second');
  print(gifts.keys.toList()); // [first, fifth]
  print(gifts.length); // 2
}
```

Because a value itself might be `null`, use `containsKey()` to ask whether a key exists.

## Working with any collection

Lists and sets are both `Iterable`s, so they share methods like `forEach`, `map`, `where`, `any` and `every`. `map` is **lazy**: call `.toList()` to get a real list.

```dart
void main() {
  var teas = ['green', 'black', 'chamomile', 'earl grey'];
  var loud = teas.map((tea) => tea.toUpperCase()).toList();
  print(loud);
  print(teas.where((tea) => tea.length > 5).toList()); // [chamomile, earl grey]
  print(teas.any((tea) => tea == 'chamomile')); // true
  print(teas.every((tea) => tea.isNotEmpty)); // true
}
```

## const collections

Put `const` before a literal to make a compile-time constant collection. It can't be changed at all:

```dart
void main() {
  var primes = const [2, 3, 5];
  try {
    primes.add(7);
  } catch (e) {
    print('Cannot change a const list');
  }
}
```

## Challenge

> 🎯 **Challenge:** Write `Set<String> common(List<String> a, List<String> b)` that returns the items that appear in **both** lists, with no duplicates. `common(['a', 'b', 'b', 'c'], ['b', 'c', 'd'])` returns `{'b', 'c'}`.

```dart starter
Set<String> common(List<String> a, List<String> b) {
  return {};
}

void main() {
  print(common(['a', 'b', 'b', 'c'], ['b', 'c', 'd']));
}
```

```dart solution
Set<String> common(List<String> a, List<String> b) {
  return a.toSet().intersection(b.toSet());
}

void main() {
  print(common(['a', 'b', 'b', 'c'], ['b', 'c', 'd']));
}
```

```dart check
  final got = lesson.common(['a', 'b', 'b', 'c'], ['b', 'c', 'd']);
  expect(got.length == 2 && got.containsAll(['b', 'c']), "Expected {b, c}, got $got");
  expect(lesson.common(['x'], ['y']).isEmpty, 'No shared items should give an empty set');
  expect(lesson.common(['tea', 'tea'], ['tea']).length == 1, 'Each shared item appears once');
```

**Reference:** [Collections](https://dart.dev/language/collections) in the Dart language docs, and [Collections in dart:core](https://dart.dev/libraries/dart-core#collections).
