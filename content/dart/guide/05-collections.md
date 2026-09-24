---
title: Collections
section: Guide Book
summary: List, Set and Map, the Iterable methods that do most of the work, laziness, and the collection-if/for literals that make Dart's literals unusual.
---
## The three types

```dart
void main() {
  final list = <String>['a', 'b', 'c'];       // ordered, duplicates allowed
  final set = <String>{'a', 'b', 'a'};        // unordered-ish, unique
  final map = <String, int>{'a': 1, 'b': 2};  // keys to values

  print(list);
  print(set);            // {a, b} — the duplicate is gone
  print(map);

  print(list[0]);
  print(set.contains('b'));
  print(map['a']);
  print(map['missing']);  // null, not an error
}
```

`Set` preserves insertion order in Dart's default `LinkedHashSet`, and so does `Map`. That is an implementation guarantee you can rely on.

## Lists

```dart
void main() {
  final growable = <int>[1, 2, 3];
  final fixed = List<int>.filled(3, 0);
  final generated = List<int>.generate(5, (i) => i * i);
  final unmodifiable = List<int>.unmodifiable([1, 2, 3]);

  growable.add(4);
  growable.addAll([5, 6]);
  growable.insert(0, 0);
  growable.remove(3);
  growable.removeAt(0);

  print(growable);
  print(fixed);
  print(generated);
  print(unmodifiable);
  print(growable.first);
  print(growable.last);
  print(growable.sublist(1, 3));
  print(growable.indexOf(5));
  print(growable.reversed.toList());
}
```

```dart
void main() {
  final fixed = List<int>.filled(3, 0);
  fixed.add(1); // error! Unsupported operation: Cannot add to a fixed-length list
}
```

## Sets and set algebra

```dart
void main() {
  final a = {1, 2, 3, 4};
  final b = {3, 4, 5, 6};

  print(a.union(b));
  print(a.intersection(b));
  print(a.difference(b));
  print(a.containsAll({1, 2}));

  final seen = <String>{};
  for (final word in ['a', 'b', 'a', 'c', 'b']) {
    if (!seen.add(word)) {
      print('duplicate: $word');
    }
  }
  print(seen);
}
```

`Set.add` returns `false` when the element was already there — a one-line duplicate detector.

## Maps

```dart
void main() {
  final scores = <String, int>{'ada': 10, 'grace': 12};

  scores['linus'] = 8;
  scores.putIfAbsent('ada', () => 999);    // already present, not called
  scores.update('grace', (v) => v + 1);
  scores.update('nobody', (v) => v, ifAbsent: () => 0);

  print(scores);
  print(scores.keys.toList());
  print(scores.values.reduce((a, b) => a + b));
  print(scores.containsKey('ada'));
  print(scores.entries.map((e) => '${e.key}=${e.value}').join(', '));

  scores.removeWhere((key, value) => value < 9);
  print(scores);

  final byLength = <int, List<String>>{};
  for (final word in ['one', 'two', 'three', 'four']) {
    byLength.putIfAbsent(word.length, () => []).add(word);
  }
  print(byLength);
}
```

`putIfAbsent` with a list default is the standard grouping idiom — the closure only runs when the key is missing.

## Iterable: where the real work happens

`List`, `Set` and `Map.entries` are all `Iterable`, and that is where the useful methods live.

```dart
void main() {
  final nums = [5, 3, 9, 1, 7];

  print(nums.map((n) => n * 2).toList());
  print(nums.where((n) => n > 4).toList());
  print(nums.fold<int>(0, (sum, n) => sum + n));
  print(nums.reduce((a, b) => a > b ? a : b));
  print(nums.any((n) => n > 8));
  print(nums.every((n) => n > 0));
  print(nums.take(2).toList());
  print(nums.skip(3).toList());
  print(nums.expand((n) => [n, -n]).toList());
  print(nums.followedBy([100]).toList());
  print(nums.firstWhere((n) => n.isEven, orElse: () => -1));
  print(nums.toList()..sort());
  print((nums.toList()..sort((a, b) => b.compareTo(a))));
}
```

> ⚠️ `sort()` sorts **in place** and returns `void`, so `final sorted = list.sort()` assigns `null`. Use the cascade — `list.toList()..sort()` — which copies, sorts and evaluates to the list.

## Iterables are lazy

`map` and `where` do no work until something asks for the elements.

```dart
void main() {
  final nums = [1, 2, 3];

  final lazy = nums.map((n) {
    print('  mapping $n');
    return n * 2;
  });

  print('nothing has run yet');
  print(lazy.first);        // maps only the first element
  print('---');
  print(lazy.toList());     // now it maps all of them
  print('---');
  print(lazy.toList());     // and again — the work is repeated
}
```

> 🔍 **Behind the scenes: laziness is a feature and a trap**
>
> Laziness means `hugeList.map(expensive).first` does one `expensive` call rather than a million. It also means the iterable is re-evaluated every time you iterate it, so a `map` with a side effect runs its side effect repeatedly, and a `map` over a list you then mutate throws `ConcurrentModificationError`. The rule: call `.toList()` at the point where you want the work done once, and treat everything before it as a recipe rather than a result.

## Collection literals with `if` and `for`

Dart's most distinctive collection feature: control flow inside a literal.

```dart
void main() {
  const isAdmin = true;
  const extras = ['x', 'y'];

  final menu = [
    'home',
    'profile',
    if (isAdmin) 'admin panel',
    if (isAdmin) ...['users', 'settings'],
    for (final e in extras) 'extra: $e',
    for (var i = 0; i < 2; i++) 'generated $i',
  ];

  print(menu);

  final config = <String, Object>{
    'name': 'app',
    if (isAdmin) 'debug': true,
    for (final e in extras) 'flag_$e': true,
  };

  print(config);
}
```

```dart
void main() {
  final base = [1, 2, 3];
  List<int>? maybe;

  print([0, ...base, 4]);
  print([0, ...?maybe, 4]);      // ...? spreads only if not null
  print({...base, ...base});     // a set: duplicates collapse
}
```

This replaces the builder-function-and-a-loop pattern entirely, and it is why Flutter widget trees can stay declarative.

## Grouping, sorting and transforming together

```dart
void main() {
  final people = [
    (name: 'Ada', role: 'engineer', age: 36),
    (name: 'Grace', role: 'admiral', age: 85),
    (name: 'Linus', role: 'engineer', age: 54),
  ];

  final byRole = <String, List<String>>{};
  for (final p in people) {
    byRole.putIfAbsent(p.role, () => []).add(p.name);
  }
  print(byRole);

  final sorted = people.toList()..sort((a, b) => b.age.compareTo(a.age));
  print(sorted.map((p) => '${p.name} (${p.age})').join(', '));

  final totalAge = people.fold<int>(0, (sum, p) => sum + p.age);
  print('average age: ${totalAge ~/ people.length}');

  final names = {for (final p in people) p.name: p.age};
  print(names);
}
```

That last line is a **map literal with a `for`** — the idiomatic way to build a lookup from a list.

## Equality

```dart
void main() {
  print([1, 2] == [1, 2]);        // false — identity, not contents
  print({1, 2} == {1, 2});        // false too

  const a = [1, 2];
  const b = [1, 2];
  print(a == b);                   // true — const values are canonicalised

  // For contents, use the collection package's equality helpers, or compare manually:
  bool listEquals(List<int> x, List<int> y) =>
      x.length == y.length && Iterable.generate(x.length).every((i) => x[i] == y[i]);

  print(listEquals([1, 2], [1, 2]));
}
```

Collections use identity equality by default. This surprises people coming from Python or JavaScript's `JSON.stringify` comparisons, and it is why `package:collection` exists.

**Reference:** [Collections](https://dart.dev/language/collections) and [Iterable](https://dart.dev/libraries/dart-core#collections) on dart.dev.
