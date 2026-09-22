---
title: Numbers & booleans
section: 2 · Built-in types
---

Every value in Dart is an object, even numbers. Dart numbers come in two flavours: `int` (whole numbers) and `double` (64-bit floating point). Both are subtypes of `num`.

```dart
void main() {
  var x = 1;
  var hex = 0xDEADBEEF;
  var y = 1.1;
  var exponents = 1.42e5;
  print('$x $hex $y $exponents');
  print(x.runtimeType); // int
  print(y.runtimeType); // double
}
```

If a literal has a decimal point, it's a `double`. A `num` variable can hold either kind, and an integer literal becomes a double automatically when a double is expected:

```dart
void main() {
  num n = 1;
  n += 2.5; // fine: num holds ints and doubles
  double z = 1; // same as 1.0
  print('$n $z');
}
```

## Readable literals

Underscores work as digit separators, which makes long numbers easier to read:

```dart
void main() {
  var million = 1_000_000;
  var mac = 0x00_14_22_01_23_45;
  print(million + 1);
  print(mac);
}
```

## Converting to and from strings

`int.parse` and `double.parse` turn text into numbers. `toString()` goes the other way, and `toStringAsFixed(n)` rounds to `n` decimal places:

```dart
void main() {
  var one = int.parse('1');
  var onePointOne = double.parse('1.1');
  print(one + onePointOne); // 2.1
  print(1.toString() + '!'); // 1!
  print(3.14159.toStringAsFixed(2)); // 3.14
}
```

Handy methods such as `abs()`, `ceil()` and `floor()` live on `num`. Bitwise operators like `<<` and `&` live on `int`:

```dart
void main() {
  print((-7).abs()); // 7
  print(2.3.ceil()); // 3
  print(2.7.floor()); // 2
  print(3 << 1); // 6
}
```

## Booleans

The `bool` type has exactly two values, `true` and `false`. Dart has **no "truthy" values**: `if (0)` or `if ('')` doesn't compile. Check explicitly instead:

```dart
void main() {
  var fullName = '';
  var hitPoints = 0;
  var result = 0 / 0;
  print(fullName.isEmpty); // true
  print(hitPoints == 0); // true
  print(result.isNaN); // true
}
```

> 💡 **Tip:** on the web, Dart `int`s are JavaScript numbers, so they're exact only up to 2⁵³. On native platforms (like this runner) they're full 64-bit integers.

## Challenge

> 🎯 **Challenge:** Write `String total(String price, int quantity)` that parses `price`, multiplies it by `quantity`, and returns the result with exactly two decimal places. `total('2.5', 3)` returns `'7.50'`.

```dart starter
String total(String price, int quantity) {
  return price;
}

void main() {
  print(total('2.5', 3));
}
```

```dart solution
String total(String price, int quantity) {
  final each = double.parse(price);
  return (each * quantity).toStringAsFixed(2);
}

void main() {
  print(total('2.5', 3));
}
```

```dart check
  final cases = {('2.5', 3): '7.50', ('10', 1): '10.00', ('0.1', 3): '0.30', ('19.99', 2): '39.98'};
  cases.forEach((input, want) {
    final got = lesson.total(input.$1, input.$2);
    expect(got == want, "total('${input.$1}', ${input.$2}) should be '$want', got '$got'");
  });
```

**Reference:** [Built-in types](https://dart.dev/language/built-in-types) in the Dart language docs.
