---
title: Async builders and Result
section: 5 · Architecture & quality
---

Loading data takes time, and it can fail. Flutter has two widgets that rebuild as async work progresses, `FutureBuilder` and `StreamBuilder`, and the architecture guide has a small pattern, `Result`, that makes "it can fail" impossible to forget.

## FutureBuilder and AsyncSnapshot

A `FutureBuilder` takes a `future` and a `builder`. Every time the future's state changes, it calls the builder with an `AsyncSnapshot`:

- `connectionState`: `waiting` while the future runs, `done` when it has finished.
- `hasData` / `data`: the value, once there is one.
- `hasError` / `error`: what went wrong, if the future threw.

The one rule to remember, straight from the API docs: "The future must have been obtained earlier, e.g. during `State.initState`… It must not be created during the `State.build` or `StatelessWidget.build` method call." Flutter can call `build` many times (a theme change, a resize, a parent's `setState`), and if you write `future: fetch()` inside `build`, every one of those rebuilds starts the work again. So create the future once and keep it in a field:

```dart
import 'package:flutter/material.dart';

Future<String> fetchQuote() async {
  await Future.delayed(const Duration(seconds: 1)); // pretend network
  return 'Simple is better than complex.';
}

void main() {
  runApp(const MaterialApp(home: QuotePage()));
}

class QuotePage extends StatefulWidget {
  const QuotePage({super.key});

  @override
  State<QuotePage> createState() => _QuotePageState();
}

class _QuotePageState extends State<QuotePage> {
  late final Future<String> _quote;

  @override
  void initState() {
    super.initState();
    _quote = fetchQuote(); // started once, not on every build
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: FutureBuilder<String>(
          future: _quote,
          builder: (context, snapshot) {
            return switch (snapshot) {
              AsyncSnapshot(hasError: true) => Text('Error: ${snapshot.error}'),
              AsyncSnapshot(:final data?) => Text(data),
              _ => const CircularProgressIndicator(),
            };
          },
        ),
      ),
    );
  }
}
```

The `switch` uses Dart 3 patterns on the snapshot itself: `AsyncSnapshot(hasError: true)` matches a failed future, `AsyncSnapshot(:final data?)` matches when `data` isn't null and binds it to a non-nullable `data`, and `_` covers everything else, which here means "still waiting". Order matters: the first matching case wins.

## StreamBuilder: many values over time

A `Future` gives you one value. A `Stream` gives you many: chat messages, a download's progress, a timer. You can get one from a package, from `Stream.periodic`, or by writing an `async*` function that `yield`s values. `StreamBuilder` works the same way, but its builder runs again for each new event, and `connectionState` is `active` while events arrive and `done` when the stream closes. The same rule applies: create the stream once, not in `build`.

```dart
import 'package:flutter/material.dart';

// An async* function returns a Stream; each `yield` sends one event.
Stream<int> countdown() async* {
  for (var i = 3; i > 0; i--) {
    await Future.delayed(const Duration(seconds: 1));
    yield i;
  }
} // returning closes the stream

void main() {
  runApp(const MaterialApp(home: CountdownPage()));
}

class CountdownPage extends StatefulWidget {
  const CountdownPage({super.key});

  @override
  State<CountdownPage> createState() => _CountdownPageState();
}

class _CountdownPageState extends State<CountdownPage> {
  final Stream<int> _countdown = countdown(); // created once

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: StreamBuilder<int>(
          stream: _countdown,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.done) {
              return const Text('Liftoff!');
            }
            return Column(
              mainAxisSize: MainAxisSize.min,
              spacing: 16,
              children: [
                const CircularProgressIndicator(),
                Text(snapshot.hasData ? '${snapshot.data}' : 'Get ready…'),
              ],
            );
          },
        ),
      ),
    );
  }
}
```

A field initializer runs once, when the `State` is created, so it's as safe as `initState`.

💡 **Tip:** The builder is called "at the discretion of the Flutter pipeline", so a fast stream may skip snapshots. Show the *latest* value; don't count builder calls.

## Result: errors as values

`FutureBuilder`'s `hasError` only helps if you remember to check it, and nothing makes you. The architecture guide suggests a different contract for services and repositories: **return** the error instead of throwing it. Its `Result` type is a Dart 3 `sealed class` with exactly two subclasses, so a `switch` over it must handle both or it won't compile:

```dart
import 'package:flutter/material.dart';

sealed class Result<T> {
  const Result();
  const factory Result.ok(T value) = Ok._;
  const factory Result.error(Exception error) = Error._;
}

final class Ok<T> extends Result<T> {
  const Ok._(this.value);
  final T value;
}

final class Error<T> extends Result<T> {
  const Error._(this.error);
  final Exception error;
}

Result<int> parseAge(String input) {
  final age = int.tryParse(input);
  if (age == null || age < 0) {
    return Result.error(FormatException('"$input" is not an age'));
  }
  return Result.ok(age);
}

String describe(String input) {
  return switch (parseAge(input)) {
    Ok(:final value) => 'Next year you will be ${value + 1}',
    Error(:final error) => 'Error: $error',
  };
}

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [Text(describe('41')), Text(describe('forty'))],
          ),
        ),
      ),
    ),
  );
}
```

`parseAge`'s signature now says "this can fail", and `describe` handles both outcomes without a `try`/`catch`. Delete the `Error` case and the analyzer reports that the switch isn't exhaustive. You'll use this `Result` in the next lessons too: commands and repositories return `Future<Result<T>>`.

💡 **Tip:** The guide's class is named `Error`, which hides Dart's built-in `Error` in that file. That's fine in practice (you rarely need the built-in one), but it's why some projects call theirs `Failure` or `Err`.

## Challenge

> 🎯 **Challenge:** `GreetingService.fetchGreeting()` returns a `Future<Result<String>>`. Finish the `FutureBuilder` in `GreetingPage`: show a `CircularProgressIndicator` while waiting, the greeting when the result is `Ok`, and `Error: ` followed by the error when it's `Error`.

```dart starter
import 'package:flutter/material.dart';

sealed class Result<T> {
  const Result();
  const factory Result.ok(T value) = Ok._;
  const factory Result.error(Exception error) = Error._;
}

final class Ok<T> extends Result<T> {
  const Ok._(this.value);
  final T value;
}

final class Error<T> extends Result<T> {
  const Error._(this.error);
  final Exception error;
}

class GreetingService {
  GreetingService({this.fail = false});

  final bool fail;

  Future<Result<String>> fetchGreeting() async {
    await Future.delayed(const Duration(seconds: 1)); // pretend network
    if (fail) return Result.error(Exception('offline'));
    return const Result.ok('Hello, Flutter!');
  }
}

void main() {
  runApp(MaterialApp(home: GreetingPage(service: GreetingService())));
}

class GreetingPage extends StatefulWidget {
  const GreetingPage({super.key, required this.service});

  final GreetingService service;

  @override
  State<GreetingPage> createState() => _GreetingPageState();
}

class _GreetingPageState extends State<GreetingPage> {
  late final Future<Result<String>> _greeting;

  @override
  void initState() {
    super.initState();
    _greeting = widget.service.fetchGreeting();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: FutureBuilder<Result<String>>(
          future: _greeting,
          builder: (context, snapshot) {
            // TODO: spinner while waiting, the value on Ok, 'Error: …' on Error
            return const SizedBox();
          },
        ),
      ),
    );
  }
}
```

```dart solution
import 'package:flutter/material.dart';

sealed class Result<T> {
  const Result();
  const factory Result.ok(T value) = Ok._;
  const factory Result.error(Exception error) = Error._;
}

final class Ok<T> extends Result<T> {
  const Ok._(this.value);
  final T value;
}

final class Error<T> extends Result<T> {
  const Error._(this.error);
  final Exception error;
}

class GreetingService {
  GreetingService({this.fail = false});

  final bool fail;

  Future<Result<String>> fetchGreeting() async {
    await Future.delayed(const Duration(seconds: 1)); // pretend network
    if (fail) return Result.error(Exception('offline'));
    return const Result.ok('Hello, Flutter!');
  }
}

void main() {
  runApp(MaterialApp(home: GreetingPage(service: GreetingService())));
}

class GreetingPage extends StatefulWidget {
  const GreetingPage({super.key, required this.service});

  final GreetingService service;

  @override
  State<GreetingPage> createState() => _GreetingPageState();
}

class _GreetingPageState extends State<GreetingPage> {
  late final Future<Result<String>> _greeting;

  @override
  void initState() {
    super.initState();
    _greeting = widget.service.fetchGreeting();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: FutureBuilder<Result<String>>(
          future: _greeting,
          builder: (context, snapshot) {
            return switch (snapshot.data) {
              null => const CircularProgressIndicator(),
              Ok(:final value) => Text(value),
              Error(:final error) => Text('Error: $error'),
            };
          },
        ),
      ),
    );
  }
}
```

```dart check
    expect(find.text('Hello, Flutter!'), findsOneWidget,
        reason: 'an Ok result should show its value');

    // Start over with a fresh page so we can see the waiting state.
    await tester.pumpWidget(const SizedBox());
    await tester.pumpWidget(
        MaterialApp(home: app.GreetingPage(service: app.GreetingService())));
    expect(find.byType(CircularProgressIndicator), findsOneWidget,
        reason: 'show a CircularProgressIndicator while the future is waiting');
    await tester.pumpAndSettle();
    expect(find.byType(CircularProgressIndicator), findsNothing,
        reason: 'the spinner should go away once the result arrives');

    await tester.pumpWidget(const SizedBox());
    await tester.pumpWidget(MaterialApp(
        home: app.GreetingPage(service: app.GreetingService(fail: true))));
    await tester.pumpAndSettle();
    expect(find.textContaining('Error: '), findsOneWidget,
        reason: 'an Error result should show "Error: " and the error');
    expect(find.textContaining('offline'), findsOneWidget,
        reason: "the error text should include the exception's message");
```

**Reference:** The [`FutureBuilder`](https://api.flutter.dev/flutter/widgets/FutureBuilder-class.html), [`StreamBuilder`](https://api.flutter.dev/flutter/widgets/StreamBuilder-class.html) and [`AsyncSnapshot`](https://api.flutter.dev/flutter/widgets/AsyncSnapshot-class.html) APIs, and the architecture guide's [Result pattern](https://docs.flutter.dev/app-architecture/design-patterns/result).
