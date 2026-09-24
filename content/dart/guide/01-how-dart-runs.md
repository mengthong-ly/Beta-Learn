---
title: How Dart runs your code
section: Guide Book
summary: Two compilers, one language — JIT for development, AOT for production, and what that means for everything you write.
---
Dart is compiled twice, by two different compilers, for two different purposes. Almost every "why does Dart work like that?" answer traces back to this.

```text
                  ┌─► JIT  ──► Dart VM        development: hot reload, fast iteration
your .dart file ──┤
                  ├─► AOT  ──► native binary  production: fast startup, no VM
                  └─► dart2js / dartdevc ──► JavaScript   the web
```

## JIT: the development path

`dart run` compiles as it goes and keeps the compiler resident. That is what makes Flutter's **hot reload** possible: a changed function is recompiled and swapped into the running program without restarting it.

```dart
void main() {
  print('This ran through the JIT compiler in the Dart VM.');

  // Compile-time environment flags: the compiler can see these and
  // delete whole branches that can never be taken.
  const isWeb = bool.fromEnvironment('dart.library.js_interop');
  const isNative = bool.fromEnvironment('dart.library.io');
  print('compiled for the web:    $isWeb');
  print('compiled for native I/O: $isNative');
}
```

## AOT: the production path

`dart compile exe` produces a self-contained native executable with no VM and no warm-up. Startup is immediate, which matters for a CLI tool and matters enormously for a mobile app.

> 🔍 **Behind the scenes: why AOT needs sound null safety**
>
> An AOT compiler must decide, at compile time, how every value is laid out and which checks are needed. Because Dart's null safety is **sound** — a `String` genuinely cannot hold `null`, with no escape hatch — the compiler can omit null checks on non-nullable values entirely, and can devirtualise calls it has proved are monomorphic. Languages with unsound or optional null checking must keep those runtime checks. Soundness is not a purity argument here; it buys measurable speed.

## Everything is an object

There are no primitives. `int`, `double`, `bool`, `null` and functions are all objects with a class.

```dart
void main() {
  print(42.runtimeType);
  print(3.14.runtimeType);
  print(true.runtimeType);
  print('text'.runtimeType);
  print([1, 2].runtimeType);
  print({'a': 1}.runtimeType);
  print(null.runtimeType);

  // Even integers have methods:
  print(42.isEven);
  print((-7).abs());
  print(255.toRadixString(16));
}
```

`Object?` sits at the top of the hierarchy and `Never` at the bottom. Everything else fits between them.

## `main()` is the entry point

```dart
void main(List<String> args) {
  print('arguments: $args');
  print('the program starts here');
}
```

`main` may take a `List<String>` of command-line arguments, and may be `Future<void>` when it needs to `await`.

## Sound null safety, in one example

This is the feature that defines modern Dart. A type is non-nullable unless you write `?`.

```dart
void main() {
  String name = 'Ada';
  String? maybe = null;

  print(name.length); // always safe — the compiler knows it is not null
  print(maybe?.length); // null-aware: prints null rather than throwing
  print(maybe?.length ?? 0); // with a fallback

  maybe = 'Grace';
  print(maybe.length); // flow analysis: it has been assigned, so it is safe
}
```

The compiler tracks assignment through your control flow, so you rarely need an explicit check.

## The tooling is part of the language

```dart
void main() {
  // Dart ships one formatter, one analyser and one package manager.
  // Everyone's code looks the same, which removes an entire category of argument.
  final commands = <String, String>{
    'dart run': 'JIT-compile and run',
    'dart compile exe': 'AOT-compile to a native binary',
    'dart analyze': 'static analysis, configured by analysis_options.yaml',
    'dart format': 'the one true formatter — no options to argue about',
    'dart test': 'run the tests',
    'dart pub get': 'resolve dependencies from pub.dev',
    'dart fix --apply': 'apply automated migrations and lint fixes',
  };

  commands.forEach((command, what) {
    print('${command.padRight(18)} $what');
  });
}
```

> 💡 **Tip:** `dart analyze` is not a linter you bolt on — it is the same analysis the IDE and the compiler use. Turning on stricter rules in `analysis_options.yaml` (`strict-casts`, `strict-raw-types`) catches at build time what would otherwise be a runtime cast error.

## In this course

Dart lessons run on **your own** Dart SDK through a local runner, so what you see is exactly what `dart run` produces on your machine. On the website the same lessons are read-only, with the real recorded output shown under each example.

**Reference:** [Introduction to Dart](https://dart.dev/language) and [Dart overview](https://dart.dev/overview) on dart.dev.
