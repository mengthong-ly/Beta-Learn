---
title: Libraries, packages & tooling
section: Guide Book
summary: Imports and visibility, `pubspec.yaml` and version constraints, the analyser, and the core libraries worth knowing.
---
## Imports

```dart
import 'dart:math';
import 'dart:convert';

void main() {
  print(max(3, 7));
  print(sqrt(16));
  print(pi.toStringAsFixed(4));

  final random = Random(42);          // a seed makes it reproducible
  print(List.generate(5, (_) => random.nextInt(100)));

  final json = jsonEncode({'name': 'Ada', 'tags': ['a', 'b']});
  print(json);
  print(jsonDecode(json));
  print(base64Encode(utf8.encode('hello')));
}
```

| Prefix | Resolves to |
| --- | --- |
| `dart:` | a core library, built in |
| `package:` | a dependency from `pubspec.yaml` |
| relative path | another file in your own package |

```dart
import 'dart:math' as math;                    // prefixed
import 'dart:math' show max, min;              // only these
import 'dart:convert' hide base64;             // everything but this

void main() {
  print(math.pi.toStringAsFixed(2));
  print(max(1, 2));
  print(min(1, 2));
  print(jsonEncode([1, 2]));
}
```

> 💡 **Tip:** `as` is the fix for a name collision, and the convention when a library's names are generic — `import 'package:http/http.dart' as http;` makes `http.get(...)` read unambiguously at every call site.

## Privacy is per-library, not per-class

An identifier starting with `_` is private to its **library** — which normally means its file.

```dart
class Counter {
  int _count = 0;              // private to this file
  int get value => _count;

  void increment() => _count++;
  void _reset() => _count = 0;  // private method

  void resetIfLarge() {
    if (_count > 2) _reset();
  }
}

void main() {
  final c = Counter()
    ..increment()
    ..increment()
    ..increment()
    ..resetIfLarge();

  print(c.value);

  // Within the same file, _count is reachable — privacy is per-library:
  print(c._count);
}
```

This is why a test in the same file can reach private members, and why `part`/`part of` files share privacy. In another file, `c._count` does not compile.

## `pubspec.yaml`

```yaml
name: my_app
description: An example application.
version: 1.0.0

environment:
  sdk: ^3.9.0

dependencies:
  http: ^1.2.0
  collection: ^1.19.0

dev_dependencies:
  test: ^1.25.0
  lints: ^5.0.0
```

`dart pub get` resolves and writes `pubspec.lock`. Commit the lock file for an application; do not for a library.

### Version constraints

| Written | Means |
| --- | --- |
| `^1.2.3` | `>=1.2.3 <2.0.0` — the usual choice |
| `>=1.2.0 <1.5.0` | an explicit range |
| `1.2.3` | exactly that version |
| `any` | anything — avoid |

`^` relies on semantic versioning: a major bump is allowed to break you, so it is excluded.

## The analyser

`analysis_options.yaml` configures the same analysis the compiler and the IDE use.

```yaml
include: package:lints/recommended.yaml

analyzer:
  language:
    strict-casts: true
    strict-inference: true
    strict-raw-types: true
  errors:
    todo: ignore
    unused_import: error

linter:
  rules:
    - prefer_const_constructors
    - avoid_print
    - prefer_final_locals
```

> 🔍 **Behind the scenes: `strict-casts` closes the `dynamic` hole**
>
> By default, a `dynamic` value may be assigned to any type with an *implicit* cast the compiler inserts silently — so `dynamic json = …; String name = json['name'];` compiles and can throw at run time. `strict-casts: true` makes that implicit cast an error, forcing an explicit `as String` or, better, a pattern match. On a codebase that handles JSON it is the single highest-value option in the file.

## The core libraries

```dart
import 'dart:math';
import 'dart:convert';

void main() {
  // dart:core — always imported: int, String, List, Map, DateTime, Duration, Uri…
  print(Uri.parse('https://example.com/a/b?q=1').pathSegments);
  print(Uri.parse('https://example.com?q=hello world').queryParameters);

  // dart:math
  print(const Point(3, 4).distanceTo(const Point(0, 0)));
  print(const Rectangle(0, 0, 10, 5).containsPoint(const Point(5, 2)));

  // dart:convert
  const payload = '{"users":[{"name":"Ada"},{"name":"Grace"}]}';
  final decoded = jsonDecode(payload) as Map<String, Object?>;
  final users = decoded['users'] as List<Object?>;
  print(users.map((u) => (u as Map<String, Object?>)['name']).toList());

  print(const JsonEncoder.withIndent('  ').convert({'a': 1, 'b': [2, 3]}));
}
```

| Library | For |
| --- | --- |
| `dart:core` | the built-in types — imported automatically |
| `dart:async` | `Future`, `Stream`, `StreamController`, `Timer` |
| `dart:math` | maths, `Random`, `Point`, `Rectangle` |
| `dart:convert` | JSON, UTF-8, base64 |
| `dart:collection` | `Queue`, `LinkedHashMap`, unmodifiable views |
| `dart:io` | files, sockets, processes — **not available on the web** |
| `dart:isolate` | isolates and ports |
| `dart:typed_data` | `Uint8List` and friends, for binary data |

## Decoding JSON safely

The pattern worth internalising: decode to `Object?`, then match the shape.

```dart
import 'dart:convert';

sealed class ParseResult {}

class ParsedUser extends ParseResult {
  final String name;
  final int age;
  ParsedUser(this.name, this.age);
}

class ParseFailed extends ParseResult {
  final String reason;
  ParseFailed(this.reason);
}

ParseResult parseUser(String raw) {
  final Object? decoded;
  try {
    decoded = jsonDecode(raw);
  } on FormatException catch (e) {
    return ParseFailed('not JSON: ${e.message}');
  }

  if (decoded case {'name': final String name, 'age': final int age}) {
    return ParsedUser(name, age);
  }
  return ParseFailed('unexpected shape');
}

void main() {
  const inputs = [
    '{"name":"Ada","age":36}',
    '{"name":"Ada","age":"36"}',
    'not json at all',
  ];

  for (final input in inputs) {
    final message = switch (parseUser(input)) {
      ParsedUser(:final name, :final age) => '$name, $age',
      ParseFailed(:final reason) => 'failed — $reason',
    };
    print(message);
  }
}
```

No `!`, no unchecked `as`, and every failure mode is a value the caller must handle.

## Library files and `part`

```dart
// In a real package these would be separate files:
//
//   lib/my_library.dart          → library my_library; part 'src/helpers.dart';
//   lib/src/helpers.dart         → part of 'my_library.dart';
//
// `part` files share the parent's imports and privacy. Use them only for
// generated code (json_serializable, freezed) — for everything else,
// separate libraries with explicit imports are clearer.

void main() {
  print('A `lib/src/` directory marks code as internal by convention;');
  print('anything directly under `lib/` is your public API.');
}
```

## The commands worth memorising

```dart
void main() {
  const commands = {
    'dart create -t console my_app': 'scaffold a project',
    'dart pub get': 'resolve dependencies',
    'dart pub upgrade --major-versions': 'move constraints forward',
    'dart pub outdated': 'what is behind, and by how much',
    'dart analyze': 'static analysis',
    'dart format .': 'format everything',
    'dart fix --apply': 'apply automated fixes',
    'dart test': 'run tests',
    'dart compile exe bin/main.dart': 'native executable',
    'dart doc': 'generate API docs from /// comments',
  };

  commands.forEach((c, what) => print('${c.padRight(34)} $what'));
}
```

**Reference:** [Libraries & imports](https://dart.dev/language/libraries) and [The pubspec file](https://dart.dev/tools/pub/pubspec) on dart.dev.
