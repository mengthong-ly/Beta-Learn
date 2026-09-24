---
title: Variables, final & const
section: Guide Book
summary: `var`, `final`, `const` and `late` — four ways to bind a name, and the compile-time versus run-time line that separates them.
---
## Declaring

```dart
void main() {
  var inferred = 'a String';        // type inferred, reassignable
  String explicit = 'also a String';
  final once = 'set once at run time';
  const always = 'set once at compile time';

  print('$inferred / $explicit / $once / $always');

  inferred = 'changed';
  print(inferred);
}
```

`var` is not "dynamic" — the type is inferred and then fixed. Assigning an `int` to a `var` that was inferred as `String` is a compile error.

```dart
void main() {
  var n = 1;
  n = 2;            // fine
  print(n);

  dynamic anything = 1;
  anything = 'now a String';   // dynamic really does turn checking off
  print(anything);
  print(anything.runtimeType);
}
```

> ⚠️ `dynamic` disables static checking, so `anything.nonsense()` compiles and throws `NoSuchMethodError` at run time. `Object?` is almost always what you actually want: it accepts everything but forces a check before use.

## `final` versus `const`

`final` means "assigned once". `const` means "known at compile time" — a much stronger claim.

```dart
void main() {
  final now = DateTime.now();       // fine: computed at run time
  const answer = 42;                // fine: a literal

  print('$now is after the program started');
  print('$answer was baked into the binary');

  // const list contents are deeply immutable
  const fixed = [1, 2, 3];
  final growable = [1, 2, 3];

  growable.add(4);
  print(growable);
  print(fixed);
}
```

```dart
void main() {
  const fixed = [1, 2, 3];
  fixed.add(4); // error! Unsupported operation: Cannot add to an unmodifiable list
}
```

### Canonicalisation

Identical `const` values are the *same object*. The compiler creates one and shares it.

```dart
void main() {
  const a = [1, 2, 3];
  const b = [1, 2, 3];
  final c = [1, 2, 3];
  final d = [1, 2, 3];

  print(identical(a, b));   // true  — one shared instance
  print(identical(c, d));   // false — two separate lists
  print(a == b);
}
```

> 🔍 **Behind the scenes: why `const` matters so much in Flutter**
>
> A `const` widget is created once, for the whole life of the program. When Flutter rebuilds a subtree it compares the new widget with the old one; two `const` widgets with the same arguments are `identical`, so the comparison short-circuits and the entire subtree is skipped. That is why `const` appears everywhere in Flutter code and why the linter nags about it: it is not style, it is the rebuild-skipping mechanism.

## `const` constructors

```dart
class Point {
  final int x;
  final int y;

  const Point(this.x, this.y);

  @override
  String toString() => 'Point($x, $y)';
}

void main() {
  const a = Point(1, 2);
  const b = Point(1, 2);
  final c = Point(1, 2);

  print(identical(a, b));  // true
  print(identical(a, c));  // false — `final` builds a new one
  print('$a $b $c');
}
```

A class can have a `const` constructor only if every field is `final`. That is the contract: the compiler must be able to build the whole object before the program runs.

## `late`

`late` postpones initialisation while keeping the type non-nullable.

```dart
class Config {
  late final String url;   // assigned later, still non-nullable

  void load() {
    url = 'https://example.com';
  }
}

void main() {
  final config = Config();
  config.load();
  print(config.url);

  // `late` also makes initialisation lazy: the expression runs on first read.
  late final expensive = compute();
  print('not computed yet');
  print(expensive);
  print(expensive);   // computed once, reused
}

String compute() {
  print('  …computing');
  return 'the result';
}
```

```dart
class Config {
  late final String url;
}

void main() {
  final config = Config();
  print(config.url); // error! LateInitializationError: Field 'url' has not been initialized.
}
```

> ⚠️ `late` moves a compile-time guarantee to a run-time one. It is right when a framework assigns the field after construction, or when the initialiser is genuinely expensive and might not be needed. It is wrong as a way to avoid thinking about nullability — `String?` and an explicit check are honest; a `LateInitializationError` in production is not.

## Type inference in practice

```dart
void main() {
  var list = [1, 2, 3];              // List<int>
  var mixed = [1, 'two', true];      // List<Object>
  var empty = [];                    // List<dynamic> — usually not what you want
  var typed = <String>[];            // List<String>
  var map = {'a': 1};                // Map<String, int>
  var set = <int>{};                 // Set<int>
  var emptyMapNotSet = {};           // Map<dynamic, dynamic>!

  print(list.runtimeType);
  print(mixed.runtimeType);
  print(empty.runtimeType);
  print(typed.runtimeType);
  print(map.runtimeType);
  print(set.runtimeType);
  print(emptyMapNotSet.runtimeType);
}
```

`{}` is an empty **map**, not an empty set — the literal is ambiguous and Dart resolves it in favour of `Map`. Write `<int>{}` when you want a set.

## Scope and shadowing

```dart
String top = 'library level';

void main() {
  print(top);

  var x = 'outer';
  {
    var x = 'inner';   // shadows the outer one
    print(x);
  }
  print(x);

  for (var i = 0; i < 3; i++) {
    // each iteration gets its OWN i — closures capture the right one
  }

  final callbacks = <void Function()>[];
  for (var i = 0; i < 3; i++) {
    callbacks.add(() => print('captured $i'));
  }
  for (final c in callbacks) {
    c();
  }
}
```

Dart's `for` loop gives each iteration a fresh variable, so closures created inside it capture distinct values — the behaviour JavaScript only gets with `let`.

**Reference:** [Variables](https://dart.dev/language/variables) on dart.dev.
