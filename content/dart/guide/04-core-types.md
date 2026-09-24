---
title: Numbers, strings & core types
section: Guide Book
summary: int and double and the one platform difference that matters, string interpolation and runes, and the core library types you will use daily.
---
## Numbers

`num` is the supertype; `int` and `double` are the concrete types.

```dart
void main() {
  int whole = 42;
  double fractional = 3.14;
  num either = 7;

  print(whole.runtimeType);
  print(fractional.runtimeType);
  print(either.runtimeType);

  print(7 / 2);        // 3.5   — always a double
  print(7 ~/ 2);       // 3     — integer division
  print(7 % 2);        // 1
  print(-7 % 2);       // 1     — Dart's % is always non-negative
  print(-7.remainder(2)); // -1 — this one keeps the sign
  print(2 * 3.0);      // 6.0   — int * double is a double
}
```

> ⚠️ `%` and `remainder()` differ on negative operands. `%` follows the *divisor*'s sign (always non-negative for a positive divisor); `remainder()` follows the *dividend*'s. For clock arithmetic and array wrapping you want `%`.

### Conversion and parsing

```dart
void main() {
  print(3.99.toInt());          // 3 — truncates
  print(3.99.round());          // 4
  print(3.99.floor());
  print((-3.2).ceil());
  print(3.14159.toStringAsFixed(2));
  print(255.toRadixString(16));
  print(42.toDouble());

  print(int.parse('42'));
  print(double.parse('3.14'));
  print(int.tryParse('nope'));       // null instead of throwing
  print(int.tryParse('ff', radix: 16));
}
```

`tryParse` returns `null` on failure; `parse` throws. For anything user-supplied, `tryParse` plus `??` is the safer pair.

### The web platform difference

```dart
void main() {
  print(0.1 + 0.2);                 // 0.30000000000000004 — IEEE-754, as everywhere
  print((0.1 + 0.2 - 0.3).abs() < 1e-10);

  print(9007199254740992 + 1);      // native: exact. On the web: doubles under the hood.
  print(BigInt.parse('123456789012345678901234567890') * BigInt.two);
}
```

> 🔍 **Behind the scenes: `int` is 64-bit native, but a double on the web**
>
> When Dart compiles to JavaScript there is no integer type to compile to — JavaScript has only doubles. So on the web an `int` is a double that happens to hold a whole number, and values above 2^53 lose precision. Native (VM and AOT) targets have real 64-bit integers that wrap on overflow. Code that must behave identically on both uses `BigInt`, or keeps large identifiers as `String`.

## Strings

```dart
void main() {
  var single = 'single quotes';
  var double = "double quotes";
  var withApostrophe = "it's fine";
  var escaped = 'it\'s also fine';

  var multiline = '''
line one
line two''';

  var raw = r'raw: \n is not a newline here';

  print('$single / $double / $withApostrophe / $escaped');
  print(multiline);
  print(raw);
}
```

### Interpolation

```dart
void main() {
  final name = 'Ada';
  final items = ['a', 'b', 'c'];
  final user = (first: 'Grace', last: 'Hopper');

  print('Hello, $name');                       // a simple identifier needs no braces
  print('${name.toUpperCase()} has ${name.length} letters');
  print('${items.length} items: ${items.join(', ')}');
  print('${user.first} ${user.last}');
  print('2 + 2 = ${2 + 2}');
  print('a literal \$ needs escaping');
}
```

`'$name'` is not string concatenation at run time — the compiler builds an efficient interpolation. There is no reason to prefer `+`.

### The methods

```dart
void main() {
  const s = '  The Quick Brown Fox  ';

  print('[${s.trim()}]');
  print(s.trim().toLowerCase());
  print(s.contains('Quick'));
  print(s.trim().startsWith('The'));
  print(s.trim().endsWith('Fox'));
  print(s.trim().replaceAll('Quick', 'Slow'));
  print(s.trim().split(' '));
  print(s.trim().substring(4, 9));
  print(s.indexOf('Brown'));
  print('ab' * 3);
  print('7'.padLeft(3, '0'));
  print(['a', 'b'].join('-'));
}
```

### Runes: strings are UTF-16 code units

```dart
void main() {
  const text = 'café';
  const emoji = '👋🏽 hi';

  print(text.length);                        // 4 — é fits in one UTF-16 unit
  print(emoji.length);                       // more than you expect
  print(emoji.runes.length);                 // code points, still not characters
  print(String.fromCharCodes(text.runes));
  print(text.codeUnits);
  print(text.split('').reversed.join());
}
```

> ⚠️ `length` counts UTF-16 code units, `runes` counts Unicode code points, and neither counts what a person calls a character — an emoji with a skin-tone modifier is several code points that render as one glyph. For user-facing character counts and truncation, use the `characters` package, which iterates grapheme clusters.

## `StringBuffer`

```dart
void main() {
  final buffer = StringBuffer();

  for (var i = 1; i <= 5; i++) {
    buffer.write(i);
    if (i < 5) buffer.write(', ');
  }
  buffer.writeln();
  buffer.writeAll(['x', 'y', 'z'], '-');

  print(buffer.toString());
  print('length: ${buffer.length}');
}
```

Strings are immutable, so `s += x` in a loop allocates a new string each time. `StringBuffer` appends into one growable buffer.

## Booleans

```dart
void main() {
  const yes = true;
  const no = false;

  print(yes && !no);
  print(yes || no);
  print(yes ^ no);

  // Dart has no truthiness: only a real bool works in a condition.
  final text = 'non-empty';
  print(text.isNotEmpty ? 'has content' : 'empty');

  final n = 0;
  print(n != 0 ? 'non-zero' : 'zero');
}
```

`if ('some string')` is a compile error. Every condition must be a `bool`, which removes a whole class of JavaScript-style surprises.

## DateTime and Duration

```dart
void main() {
  final moment = DateTime.utc(2026, 1, 15, 9, 30);

  print(moment);
  print(moment.toIso8601String());
  print('${moment.year}-${moment.month.toString().padLeft(2, '0')}');
  print(moment.weekday);         // 1 = Monday

  final later = moment.add(const Duration(days: 40, hours: 6));
  print(later);
  print(later.difference(moment).inDays);
  print(later.isAfter(moment));

  const d = Duration(hours: 1, minutes: 30);
  print('${d.inMinutes} minutes');
  print(d * 2);
}
```

`DateTime` is immutable — `add` returns a new one. Parsing uses `DateTime.parse` for ISO-8601 and the `intl` package for anything else.

**Reference:** [Built-in types](https://dart.dev/language/built-in-types) on dart.dev.
