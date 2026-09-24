---
title: Records & patterns
section: Guide Book
summary: Anonymous tuples with named fields, and the pattern language that destructures them — plus exhaustive switch expressions.
---
## Records

A record is a lightweight, immutable, anonymous aggregate. It needs no class.

```dart
void main() {
  // Positional fields.
  var point = (3, 4);
  print(point);
  print(point.$1);
  print(point.$2);

  // Named fields.
  var user = (name: 'Ada', age: 36);
  print(user);
  print(user.name);

  // Mixed.
  var mixed = ('first', count: 2, 'third');
  print(mixed.$1);
  print(mixed.$2);
  print(mixed.count);
}
```

The type is structural: `(int, int)` and `({String name, int age})` are types you can write down.

```dart
(String, int) parse(String input) {
  final parts = input.split(':');
  return (parts[0], int.parse(parts[1]));
}

({double min, double max}) range(List<double> values) {
  var lo = values.first, hi = values.first;
  for (final v in values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return (min: lo, max: hi);
}

void main() {
  final (name, port) = parse('localhost:8080');
  print('$name on $port');

  final r = range([3, 1, 4, 1, 5]);
  print('${r.min} … ${r.max}');
}
```

Multiple return values, with names, and no `Result` class to define.

## Record equality

Records compare by **value**, unlike classes.

```dart
void main() {
  print((1, 2) == (1, 2));
  print((name: 'Ada') == (name: 'Ada'));
  print((1, 2) == (2, 1));

  // Field order does not matter for named fields:
  print((a: 1, b: 2) == (b: 2, a: 1));

  // They work as map keys and set elements:
  final seen = <(int, int)>{(0, 0), (1, 1), (0, 0)};
  print(seen.length);

  final grid = <(int, int), String>{(0, 0): 'origin', (1, 2): 'somewhere'};
  print(grid[(0, 0)]);
}
```

> 🔍 **Behind the scenes: why records are not just tuples**
>
> A record's type includes its field *names*, so `(name: 'Ada')` and `(title: 'Ada')` are different types — the compiler catches a swapped field where a positional tuple would not. Records are also allocated without a class header and compare structurally, which is what makes them cheap enough to return from a hot function instead of allocating a one-off class.

## Patterns: match and destructure

```dart
void main() {
  // Destructuring declarations.
  final (a, b, c) = (1, 2, 3);
  print(a + b + c);

  final [first, second, ...rest] = [10, 20, 30, 40];
  print('$first $second $rest');

  final {'name': name, 'age': age} = {'name': 'Ada', 'age': 36};
  print('$name is $age');

  final (name: n, age: _) = (name: 'Grace', age: 85);
  print(n);

  // Assignment to existing variables — including a swap.
  var x = 1, y = 2;
  (x, y) = (y, x);
  print('$x $y');
}
```

## Patterns in `switch`

`switch` is both a statement and an **expression**, and it checks exhaustiveness.

```dart
sealed class Shape {}

class Circle extends Shape {
  final double radius;
  Circle(this.radius);
}

class Rect extends Shape {
  final double w, h;
  Rect(this.w, this.h);
}

class Square extends Shape {
  final double side;
  Square(this.side);
}

double area(Shape shape) => switch (shape) {
      Circle(:final radius) => 3.141592653589793 * radius * radius,
      Rect(:final w, :final h) => w * h,
      Square(:final side) => side * side,
    };

String describe(Shape shape) => switch (shape) {
      Circle(radius: 0) => 'a point',
      Circle(:final radius) when radius > 100 => 'an enormous circle',
      Circle() => 'a circle',
      Rect(:final w, :final h) when w == h => 'a rectangle that is really a square',
      Rect() => 'a rectangle',
      Square() => 'a square',
    };

void main() {
  final shapes = <Shape>[Circle(1), Circle(0), Circle(200), Rect(2, 3), Rect(4, 4), Square(5)];
  for (final s in shapes) {
    print('${describe(s).padRight(38)} area ${area(s).toStringAsFixed(2)}');
  }
}
```

Because `Shape` is `sealed`, omitting `Square` from `area` is a compile error rather than a runtime surprise.

## The pattern kinds

```dart
void main() {
  for (final value in <Object?>[1, 'two', 3.0, true, null, [1, 2], (1, 2)]) {
    print(classify(value));
  }
}

String classify(Object? value) => switch (value) {
      null => 'null',
      int n when n > 100 => 'a big int',
      int() => 'an int',
      String(length: 0) => 'an empty string',
      String(:final length) => 'a string of $length characters',
      double() || bool() => 'a double or a bool',
      [_, _] => 'a two-element list',
      (int _, int _) => 'a pair of ints',
      _ => 'something else',
    };
```

| Pattern | Matches |
| --- | --- |
| `42`, `'text'`, `null` | that exact constant |
| `var x`, `final x` | anything, binding it to `x` |
| `_` | anything, binding nothing |
| `int x` | a value of that type |
| `[a, b, ...rest]` | a list of that shape |
| `(a, b)`, `(name: n)` | a record |
| `Circle(:final radius)` | an object, pulling out a getter |
| `{'key': v}` | a map containing that key |
| `a \|\| b` | either pattern |
| `pattern when cond` | with an extra guard |

## `if-case`

A single pattern test without a whole `switch`.

```dart
void main() {
  final responses = <Object>[
    {'status': 200, 'body': 'ok'},
    {'status': 404},
    'not a map',
  ];

  for (final response in responses) {
    if (response case {'status': 200, 'body': final String body}) {
      print('success: $body');
    } else if (response case {'status': final int code}) {
      print('http $code');
    } else {
      print('unrecognised: $response');
    }
  }
}
```

This is the idiomatic way to work with decoded JSON: one pattern checks the shape, the types *and* extracts the values.

```dart
void main() {
  final json = <String, Object?>{
    'user': {'name': 'Ada', 'roles': ['admin', 'editor']},
  };

  if (json case {'user': {'name': final String name, 'roles': final List<Object?> roles}}) {
    print('$name has ${roles.length} roles: ${roles.join(', ')}');
  } else {
    print('unexpected shape');
  }
}
```

> 💡 **Tip:** Compare that with the alternative — a chain of `containsKey`, `is` checks and casts, each of which can be forgotten. The pattern fails as a whole if any part does not match, so there is no half-validated state.

## Patterns in `for`

```dart
void main() {
  final pairs = [(1, 'one'), (2, 'two'), (3, 'three')];
  for (final (number, word) in pairs) {
    print('$number = $word');
  }

  final scores = {'ada': 10, 'grace': 12};
  for (final MapEntry(key: name, value: score) in scores.entries) {
    print('$name scored $score');
  }
}
```

## Exhaustiveness with enums

```dart
enum Status { draft, published, archived }

String label(Status s) => switch (s) {
      Status.draft => 'Work in progress',
      Status.published => 'Live',
      Status.archived => 'Hidden',
    };

void main() {
  for (final s in Status.values) {
    print('${s.name}: ${label(s)}');
  }
}
```

Add `Status.deleted` and every `switch` without a `default` stops compiling — which is the point. Adding a `default` to silence it throws that guarantee away.

**Reference:** [Records](https://dart.dev/language/records) and [Patterns](https://dart.dev/language/patterns) on dart.dev.
