---
title: Errors & exceptions
section: Guide Book
summary: The Error/Exception split, `on` versus `catch`, rethrow, stack traces, assertions, and where `Result`-style returns beat throwing.
---
## Two families

Dart has `Error` and `Exception`, and the distinction is about **whose fault it is**.

| | `Error` | `Exception` |
| --- | --- | --- |
| Means | a programming mistake | a condition the program should handle |
| Examples | `TypeError`, `RangeError`, `StateError`, `AssertionError` | `FormatException`, `TimeoutException`, `IOException` |
| You should | fix the code | catch it |

```dart
void main() {
  final cases = <void Function()>[
    () => [1, 2, 3][99],
    () => int.parse('not a number'),
    () => <int>[].first,
    () => 1 ~/ 0,
  ];

  for (final run in cases) {
    try {
      run();
    } catch (e) {
      print('${e.runtimeType}: $e');
    }
  }
}
```

> ⚠️ Neither family is checked, and nothing in a signature tells you what a function throws. That is a real weakness of the language — and the reason the `Result` pattern at the end of this chapter is worth knowing.

## Throwing and catching

```dart
class InsufficientFunds implements Exception {
  final int shortfall;
  InsufficientFunds(this.shortfall);

  @override
  String toString() => 'InsufficientFunds: need $shortfall more';
}

void withdraw(int balance, int amount) {
  if (amount <= 0) {
    throw ArgumentError.value(amount, 'amount', 'must be positive');
  }
  if (amount > balance) {
    throw InsufficientFunds(amount - balance);
  }
  print('withdrew $amount, leaving ${balance - amount}');
}

void main() {
  for (final amount in [30, 300, -5]) {
    try {
      withdraw(100, amount);
    } on InsufficientFunds catch (e) {
      print('declined — ${e.shortfall} short');
    } on ArgumentError catch (e) {
      print('bad input: ${e.message}');
    }
  }
}
```

`on Type catch (e)` filters by type; a bare `catch (e)` catches everything. List the specific clauses first — the first match wins.

```dart
void main() {
  try {
    throw FormatException('bad input');
  } on FormatException catch (e, stack) {
    print('message: ${e.message}');
    print('first frame: ${stack.toString().split('\n').first}');
  } on Exception {
    print('some other exception — no variable needed');
  } catch (e) {
    print('anything at all: $e');
  } finally {
    print('finally always runs');
  }
}
```

`catch` takes an optional second parameter: the `StackTrace`.

## `rethrow`

Handle part of a failure and let the rest travel on — keeping the original stack trace.

```dart
void inner() => throw StateError('the real problem');

void middle() {
  try {
    inner();
  } catch (e) {
    print('middle: logging, then passing it on');
    rethrow;        // NOT `throw e` — that would reset the stack trace
  }
}

void main() {
  try {
    middle();
  } on StateError catch (e) {
    print('main caught: ${e.message}');
  }
}
```

> 🔍 **Behind the scenes: `throw e` loses the scene of the crime**
>
> `rethrow` continues the original throw, so the stack trace still points at `inner()`. `throw e` starts a *new* throw from the catch block, and the trace now begins at `middle()` — the line that logged it, not the line that broke. When a production stack trace points only at your own error handling, this is almost always why.

## `finally`

```dart
String process(bool fail) {
  try {
    if (fail) throw StateError('failed');
    return 'ok';
  } catch (e) {
    return 'recovered';
  } finally {
    print('  cleanup');
  }
}

void main() {
  print(process(false));
  print(process(true));
}
```

`finally` runs on the success path, the exception path and the `return` path. It is where you close files, cancel subscriptions and release locks.

## Errors in async code

```dart
Future<int> risky(bool fail) async {
  await Future<void>.delayed(const Duration(milliseconds: 1));
  if (fail) throw StateError('async failure');
  return 42;
}

void main() async {
  try {
    print(await risky(false));
    print(await risky(true));
  } on StateError catch (e) {
    print('caught across await: ${e.message}');
  }

  // Future.wait fails as soon as any one fails.
  try {
    await Future.wait([risky(false), risky(true)]);
  } on StateError catch (e) {
    print('Future.wait: ${e.message}');
  }

  // eagerError: false still waits for the rest before reporting.
  final settled = await Future.wait(
    [risky(false), risky(true)].map((f) => f.then<Object>((v) => v).catchError((Object e) => e)),
  );
  print(settled.map((r) => r is StateError ? 'error' : 'ok').toList());
}
```

> ⚠️ A `Future` that fails with nobody awaiting it produces an *unhandled* asynchronous error, which by default crashes the isolate. Never fire a future and walk away: `await` it, attach `.catchError`, or hand it to something that will.

## Assertions

```dart
class Percentage {
  final int value;

  Percentage(this.value) : assert(value >= 0 && value <= 100, 'must be 0-100');
}

void main() {
  print(Percentage(50).value);

  // In development (JIT), this throws AssertionError.
  // In a release AOT build, asserts are stripped entirely.
  assert(1 + 1 == 2, 'arithmetic still works');
  print('assertions are on in this run');
}
```

Assertions document invariants and cost nothing in production — which also means they must never contain logic the program depends on.

## Returning failure instead of throwing

For expected failures, a value beats an exception: the type system forces the caller to deal with it.

```dart
sealed class Result<T> {
  const Result();
}

class Ok<T> extends Result<T> {
  final T value;
  const Ok(this.value);
}

class Err<T> extends Result<T> {
  final String message;
  const Err(this.message);
}

Result<int> parsePort(String input) {
  final n = int.tryParse(input);
  if (n == null) return Err('not a number: $input');
  if (n < 1 || n > 65535) return Err('out of range: $n');
  return Ok(n);
}

void main() {
  for (final input in ['8080', 'abc', '99999']) {
    final message = switch (parsePort(input)) {
      Ok(:final value) => 'port $value',
      Err(:final message) => 'rejected — $message',
    };
    print(message);
  }
}
```

Because `Result` is `sealed`, the `switch` is exhaustive and the error case cannot be forgotten. The core library already uses the lightweight version of this idea: `int.tryParse` returns `null` rather than throwing, and `firstWhere` takes an `orElse`.

> 💡 **Tip:** A rough rule: throw for things that mean the program is wrong or the environment failed; return a value for things that are a normal part of the domain. A malformed user input is not exceptional — it is Tuesday.

**Reference:** [Error handling](https://dart.dev/language/error-handling) on dart.dev.
