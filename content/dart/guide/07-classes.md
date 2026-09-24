---
title: Classes, mixins & extensions
section: Guide Book
summary: Constructors and their many forms, inheritance versus mixins versus interfaces, the class modifiers, and extending types you do not own.
---
## A class

```dart
class Rectangle {
  final double width;
  final double height;

  Rectangle(this.width, this.height);

  double get area => width * height;
  double get perimeter => 2 * (width + height);
  bool get isSquare => width == height;

  Rectangle scaled(double factor) => Rectangle(width * factor, height * factor);

  @override
  String toString() => 'Rectangle(${width}×$height)';
}

void main() {
  final r = Rectangle(3, 4);
  print(r);
  print(r.area);
  print(r.isSquare);
  print(r.scaled(2));
}
```

`Rectangle(this.width, this.height)` is **initialising formal** syntax — the parameter assigns the field directly, with no body needed.

## Constructors

```dart
class Temperature {
  final double celsius;

  // Primary constructor.
  Temperature(this.celsius);

  // Named constructors.
  Temperature.fahrenheit(double f) : celsius = (f - 32) / 1.8;
  Temperature.absoluteZero() : celsius = -273.15;

  // Const constructor — needs all-final fields.
  const Temperature.freezing() : celsius = 0;

  // Factory: may return a cached or subclass instance.
  static final _cache = <double, Temperature>{};
  factory Temperature.cached(double celsius) =>
      _cache.putIfAbsent(celsius, () => Temperature(celsius));

  // Redirecting constructor.
  Temperature.boiling() : this(100);

  double get fahrenheit => celsius * 1.8 + 32;

  @override
  String toString() => '${celsius.toStringAsFixed(1)}°C';
}

void main() {
  print(Temperature(21.5));
  print(Temperature.fahrenheit(98.6));
  print(Temperature.absoluteZero());
  print(const Temperature.freezing());
  print(Temperature.boiling());
  print(identical(Temperature.cached(20), Temperature.cached(20)));
}
```

| Form | For |
| --- | --- |
| `Class(this.field)` | the common case |
| `Class.named(...)` | an alternative way to build one |
| `const Class(...)` | compile-time constant instances |
| `factory Class(...)` | caching, returning a subtype, or failing |
| `Class.x() : this(...)` | redirecting to another constructor |

> 🔍 **Behind the scenes: why `factory` exists**
>
> A normal constructor *must* return a new instance of exactly that class. A `factory` is an ordinary static method wearing constructor syntax — it may return a cached instance, an instance of a subclass, or throw. That is how `int.parse` can be a constructor-like API on an abstract type, and how singletons are written without a separate `getInstance()`.

## The initialiser list

Runs before the constructor body, and is the only place `final` fields can be assigned.

```dart
class Circle {
  final double radius;
  final double area;

  Circle(this.radius)
      : area = 3.141592653589793 * radius * radius,
        assert(radius > 0, 'radius must be positive') {
    print('  body runs last: radius $radius');
  }
}

void main() {
  final c = Circle(2);
  print(c.area.toStringAsFixed(2));
}
```

## Inheritance

```dart
abstract class Shape {
  const Shape();

  double get area;            // abstract — subclasses must provide it

  String describe() => '$runtimeType with area ${area.toStringAsFixed(2)}';
}

class Square extends Shape {
  final double side;
  const Square(this.side);

  @override
  double get area => side * side;
}

class Circle extends Shape {
  final double radius;
  const Circle(this.radius);

  @override
  double get area => 3.141592653589793 * radius * radius;

  @override
  String describe() => 'A round ${super.describe()}';
}

void main() {
  const shapes = <Shape>[Square(3), Circle(1)];
  for (final s in shapes) {
    print(s.describe());
  }
}
```

## Interfaces are implicit

Every class defines an interface. `implements` takes the interface without the implementation.

```dart
class Logger {
  void log(String message) => print('[log] $message');
}

// No `extends`, so nothing is inherited — every member must be provided.
class SilentLogger implements Logger {
  @override
  void log(String message) {}
}

class PrefixLogger implements Logger {
  final String prefix;
  PrefixLogger(this.prefix);

  @override
  void log(String message) => print('$prefix $message');
}

void main() {
  final loggers = <Logger>[Logger(), SilentLogger(), PrefixLogger('>>')];
  for (final l in loggers) {
    l.log('hello');
  }
  print('(the silent one printed nothing)');
}
```

## Mixins

A mixin adds behaviour to a class without inheritance, and a class may mix in many.

```dart
mixin Timestamped {
  DateTime? _createdAt;

  void touch() => _createdAt = DateTime.utc(2026, 1, 15);
  String get created => _createdAt?.toIso8601String() ?? 'never';
}

mixin Describable {
  String get name;                  // a requirement on the using class

  String describe() => 'This is $name';
}

class Document with Timestamped, Describable {
  @override
  final String name;

  Document(this.name);
}

void main() {
  final doc = Document('report.pdf')..touch();
  print(doc.describe());
  print(doc.created);
  print(doc is Timestamped);
  print(doc is Describable);
}
```

`on` restricts which classes may use a mixin, which lets the mixin call the host's members safely.

```dart
class Animal {
  String get species => 'unknown';
}

mixin Loud on Animal {
  String shout() => '${species.toUpperCase()}!!!';
}

class Dog extends Animal with Loud {
  @override
  String get species => 'dog';
}

void main() {
  print(Dog().shout());
}
```

> 💡 **Tip:** The order matters. `class C extends B with M1, M2` linearises to `B → M1 → M2 → C`, so a later mixin overrides an earlier one, and `super` inside a mixin reaches the one before it. When two mixins define the same member, the last one wins.

## Class modifiers

Dart 3 added modifiers that let a library control how its types may be used.

```dart
// sealed: all subtypes are in this library, so switches can be exhaustive.
sealed class Result {}

class Ok extends Result {
  final String value;
  Ok(this.value);
}

class Err extends Result {
  final String message;
  Err(this.message);
}

String render(Result r) => switch (r) {
      Ok(:final value) => 'ok: $value',
      Err(:final message) => 'error: $message',
    };

void main() {
  print(render(Ok('all good')));
  print(render(Err('offline')));
}
```

| Modifier | Means |
| --- | --- |
| `abstract` | cannot be instantiated |
| `base` | may be extended, not implemented |
| `interface` | may be implemented, not extended |
| `final` | neither extended nor implemented outside the library |
| `sealed` | implicitly abstract and final; all subtypes known, enabling exhaustive switches |
| `mixin class` | usable both as a class and as a mixin |

Because `Result` is `sealed`, the `switch` above needs no `default` — and adding a third subtype turns every such switch into a compile error until it is handled.

## Extensions

Adding methods to a type you do not own.

```dart
extension StringExtras on String {
  String get capitalised => isEmpty ? this : this[0].toUpperCase() + substring(1);

  bool get isEmail => contains('@') && contains('.');

  String truncate(int max) => length <= max ? this : '${substring(0, max)}…';
}

extension NumExtras on int {
  bool get isPerfectSquare {
    for (var i = 0; i * i <= this; i++) {
      if (i * i == this) return true;
    }
    return false;
  }

  String get ordinal => switch (this % 10) {
        1 when this % 100 != 11 => '${this}st',
        2 when this % 100 != 12 => '${this}nd',
        3 when this % 100 != 13 => '${this}rd',
        _ => '${this}th',
      };
}

void main() {
  print('dart'.capitalised);
  print('ada@example.com'.isEmail);
  print('a rather long sentence'.truncate(10));
  print(16.isPerfectSquare);
  print([1, 2, 3, 11, 21].map((n) => n.ordinal).join(', '));
}
```

> ⚠️ Extensions are resolved **statically**, from the type the compiler sees. An extension on `String` is invisible to a variable typed `Object`, and two extensions defining the same member on the same type is an ambiguity error at the call site. They are syntax, not dynamic dispatch.

## Operator overloading

```dart
class Vector {
  final double x, y;
  const Vector(this.x, this.y);

  Vector operator +(Vector other) => Vector(x + other.x, y + other.y);
  Vector operator -(Vector other) => Vector(x - other.x, y - other.y);
  Vector operator *(double s) => Vector(x * s, y * s);
  bool operator <(Vector other) => lengthSquared < other.lengthSquared;

  double get lengthSquared => x * x + y * y;

  @override
  bool operator ==(Object other) =>
      other is Vector && other.x == x && other.y == y;

  @override
  int get hashCode => Object.hash(x, y);

  @override
  String toString() => '($x, $y)';
}

void main() {
  const a = Vector(1, 2);
  const b = Vector(3, 4);

  print(a + b);
  print(b - a);
  print(a * 3);
  print(a < b);
  print(a == const Vector(1, 2));
  print({a, const Vector(1, 2)}.length);   // 1 — == and hashCode agree
}
```

Overriding `==` without `hashCode` breaks `Set` and `Map`. Always do both, and `Object.hash` builds the hash for you.

**Reference:** [Classes](https://dart.dev/language/classes), [Mixins](https://dart.dev/language/mixins) and [Class modifiers](https://dart.dev/language/class-modifiers) on dart.dev.
