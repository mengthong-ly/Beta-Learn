---
title: Generics & the type system
section: Guide Book
summary: Type parameters and bounds, why Dart's generics are reified, variance, and the casts that can still fail at run time.
---
## Type parameters

```dart
class Box<T> {
  final T value;
  const Box(this.value);

  Box<R> map<R>(R Function(T) transform) => Box(transform(value));

  @override
  String toString() => 'Box<$T>($value)';
}

T firstOr<T>(List<T> items, T fallback) => items.isEmpty ? fallback : items.first;

void main() {
  const a = Box<int>(42);
  final b = Box('text');            // inferred Box<String>

  print(a);
  print(b);
  print(a.map((n) => n.toString()));

  print(firstOr<int>([], -1));
  print(firstOr(['x', 'y'], 'none'));
}
```

## Generics are reified

Unlike Java, Dart keeps type arguments at run time. `List<int>` and `List<String>` are genuinely different types, and you can ask.

```dart
void main() {
  final ints = <int>[1, 2, 3];
  final strings = <String>['a', 'b'];

  print(ints.runtimeType);
  print(strings.runtimeType);
  print(ints is List<int>);
  print(ints is List<String>);

  final objects = <Object>[1, 'two'];
  print(objects is List<int>);

  // The type argument is available inside a generic function:
  print(nameOf<int>());
  print(nameOf<List<String>>());
}

String nameOf<T>() => '$T';
```

> 🔍 **Behind the scenes: reification is what makes null safety sound**
>
> If type arguments were erased, a `List<String>` could be handed to code expecting `List<int>` and the mistake would only surface as a confusing failure much later. Dart keeps them, so the cast fails at the boundary with an accurate message — and the compiler can trust that a `List<String>` really only contains strings, which is exactly the guarantee AOT compilation needs to omit checks.

```dart
void main() {
  final objects = <Object>[1, 2, 3];
  final ints = objects as List<int>; // error! type 'List<Object>' is not a subtype of type 'List<int>'
  print(ints);
}
```

## Bounds

`extends` on a type parameter constrains what may fill it — and gives you access to that type's members.

```dart
class Pair<T extends Comparable<T>> {
  final T a, b;
  const Pair(this.a, this.b);

  T get larger => a.compareTo(b) >= 0 ? a : b;
  T get smaller => a.compareTo(b) >= 0 ? b : a;
}

T maxOf<T extends num>(List<T> values) =>
    values.reduce((a, b) => a > b ? a : b);

void main() {
  print(const Pair(3, 7).larger);
  print(const Pair('apple', 'banana').smaller);
  print(maxOf([3, 1, 4]));
  print(maxOf([1.5, 2.5]));
}
```

```dart
class Pair<T extends Comparable<T>> {
  final T a, b;
  const Pair(this.a, this.b);
}

void main() {
  final p = Pair(Object(), Object()); // error! 'Object' doesn't conform to the bound 'Comparable<Object>'
  print(p);
}
```

## Generic methods and inference

```dart
void main() {
  final people = [
    (name: 'Ada', age: 36),
    (name: 'Grace', age: 85),
    (name: 'Linus', age: 54),
  ];

  print(groupBy(people, (p) => p.age > 50).keys.toList());
  print(groupBy(people, (p) => p.name[0]));

  print(pluck(people, (p) => p.name));
  print(pluck(people, (p) => p.age));
}

Map<K, List<T>> groupBy<T, K>(Iterable<T> items, K Function(T) key) {
  final out = <K, List<T>>{};
  for (final item in items) {
    out.putIfAbsent(key(item), () => []).add(item);
  }
  return out;
}

List<R> pluck<T, R>(Iterable<T> items, R Function(T) select) =>
    items.map(select).toList();
```

Both type parameters are inferred from the arguments. Writing `groupBy<Person, bool>(…)` is legal and almost never necessary.

## Variance: `List<Dog>` is a `List<Animal>`

Dart's generics are **covariant**, which is convenient and unsound in one specific direction.

```dart
class Animal {
  String get name => 'animal';
  @override
  String toString() => name;
}

class Dog extends Animal {
  @override
  String get name => 'dog';
}

class Cat extends Animal {
  @override
  String get name => 'cat';
}

void describe(List<Animal> animals) {
  for (final a in animals) {
    print(a.name);
  }
}

void main() {
  final dogs = <Dog>[Dog(), Dog()];
  describe(dogs);              // allowed: List<Dog> is a List<Animal>
  print(dogs is List<Animal>);
}
```

The unsound part: because the list really is a `List<Dog>`, writing a `Cat` into it through the `List<Animal>` view fails at run time.

```dart
class Animal {}
class Dog extends Animal {}
class Cat extends Animal {}

void addACat(List<Animal> animals) => animals.add(Cat());

void main() {
  final dogs = <Dog>[Dog()];
  addACat(dogs); // error! type 'Cat' is not a subtype of type 'Dog'
  print(dogs);
}
```

> ⚠️ Dart chose covariance because the sound alternative makes everyday code painful, and it inserts a run-time check on the write instead. The practical rule: a function that only **reads** a collection can safely take the supertype; a function that **writes** to one should take the exact type, or take an `Iterable` to make "read-only" explicit in the signature.

## `Iterable` in signatures

```dart
int total(Iterable<int> values) => values.fold(0, (a, b) => a + b);

void main() {
  print(total([1, 2, 3]));
  print(total({4, 5}));
  print(total(Iterable<int>.generate(5, (i) => i)));
  print(total(<String, int>{'a': 1, 'b': 2}.values));
}
```

Taking `Iterable<T>` rather than `List<T>` accepts lists, sets, map views and lazy sequences, and documents that the function does not modify the input.

## `covariant` and overriding

```dart
class Animal {
  void interactWith(Animal other) => print('animal meets ${other.runtimeType}');
}

class Dog extends Animal {
  // Narrowing a parameter type requires an explicit opt-in.
  @override
  void interactWith(covariant Dog other) => print('dog sniffs another dog');
}

void main() {
  final dog = Dog();
  dog.interactWith(Dog());

  final asAnimal = dog as Animal;
  try {
    asAnimal.interactWith(Animal());   // fails the covariant check
  } on TypeError catch (_) {
    print('TypeError: the runtime check caught the unsound call');
  }
}
```

`covariant` says "I accept the run-time check". Without it, narrowing an override's parameter is a compile error.

## `is`, `as` and promotion

```dart
void main() {
  final values = <Object?>[1, 'two', 3.0, [4], null];

  for (final v in values) {
    if (v is int) {
      print('int, doubled: ${v * 2}');          // promoted to int
    } else if (v is String) {
      print('string, upper: ${v.toUpperCase()}');
    } else if (v is List) {
      print('list of ${v.length}');
    } else if (v == null) {
      print('null');
    } else {
      print('${v.runtimeType}: $v');
    }
  }
}
```

`is` promotes the local variable's type for the rest of the block. `as` asserts without checking first and throws `TypeError` when wrong — so `is` plus a branch is nearly always better.

## `Object`, `dynamic` and `Never`

```dart
void main() {
  Object anything = 'a string';
  Object? nullable = null;
  dynamic unchecked = 'a string';

  print(anything.toString());
  print(nullable?.toString());
  print(unchecked.toUpperCase());   // compiles; would throw if it were not a String

  // The type hierarchy, top to bottom:
  //   Object?  →  Object  →  …your classes…  →  Never
  print(<Object?>[1, null, 'x'].length);
}
```

| Type | Means |
| --- | --- |
| `Object?` | the top type — anything at all, including null |
| `Object` | anything except null |
| `dynamic` | anything, **and no static checking** |
| `Never` | no values; a function returning it cannot complete |

Prefer `Object?` over `dynamic` by default. They accept the same values; only one of them keeps the compiler working for you.

**Reference:** [Generics](https://dart.dev/language/generics) and [The Dart type system](https://dart.dev/language/type-system) on dart.dev.
