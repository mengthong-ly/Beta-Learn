---
title: Asynchrony
section: Guide Book
summary: The event loop, Future and async/await, Stream and async*, error handling across await points, and isolates for real parallelism.
---
Dart is single-threaded per isolate, with an event loop. Nothing runs in parallel inside one isolate — asynchrony is about not *blocking*, not about doing two things at once.

```text
        ┌──────────────┐
        │  your code   │  runs to completion, never interrupted
        └──────┬───────┘
               │ awaits / schedules
        ┌──────▼───────┐
        │ microtasks   │  drained completely first
        └──────┬───────┘
        ┌──────▼───────┐
        │ event queue  │  timers, I/O, then back to microtasks
        └──────────────┘
```

## Future

A `Future` is a value that will exist later, or an error that will happen later.

```dart
Future<String> fetchGreeting() async {
  await Future<void>.delayed(const Duration(milliseconds: 10));
  return 'Hello from the future';
}

void main() async {
  print('before');
  final greeting = await fetchGreeting();
  print(greeting);
  print('after');
}
```

`async` makes a function return a `Future`; `await` suspends it until that future completes, without blocking the isolate.

```dart
void main() async {
  // A Future that is already done.
  print(await Future<int>.value(42));

  // .then() is the callback form — await is sugar over it.
  await Future<int>.value(1).then((v) => print('then: $v'));

  // A future that fails.
  try {
    await Future<int>.error(StateError('it broke'));
  } on StateError catch (e) {
    print('caught: ${e.message}');
  }

  // Cleanup regardless of outcome.
  await Future<int>.value(7)
      .then((v) => print('value $v'))
      .whenComplete(() => print('whenComplete always runs'));
}
```

## Ordering: the event loop in action

```dart
void main() {
  print('1 sync');

  Future<void>.delayed(Duration.zero, () => print('5 event queue (timer)'));

  Future<void>.microtask(() => print('3 microtask'));

  Future<void>.value().then((_) => print('4 microtask (then)'));

  print('2 sync');
}
```

> 🔍 **Behind the scenes: microtasks starve the event queue**
>
> The loop drains the **entire** microtask queue before touching a single event. A microtask that schedules another microtask therefore runs forever and the program never processes a timer, an I/O completion or a UI frame again. That is why `scheduleMicrotask` is rare in application code, and why `Future.delayed(Duration.zero)` — which uses the event queue — is the safe way to "run this after the current work".

## Running futures concurrently

```dart
Future<int> slow(int id, int ms) async {
  await Future<void>.delayed(Duration(milliseconds: ms));
  return id;
}

void main() async {
  // Sequential: total time is the sum.
  final a = await slow(1, 20);
  final b = await slow(2, 20);
  print('sequential: $a $b');

  // Concurrent: total time is the maximum.
  final results = await Future.wait([slow(3, 20), slow(4, 20), slow(5, 20)]);
  print('concurrent: $results');

  // First one wins.
  final fastest = await Future.any([slow(6, 50), slow(7, 5)]);
  print('any: $fastest');
}
```

> ⚠️ `await` inside a `for` loop is sequential. Ten requests that take 100 ms each take one second. `Future.wait(items.map(fetch))` takes 100 ms. This is the most common performance mistake in async Dart.

```dart
Future<String> fetch(String id) async {
  await Future<void>.delayed(const Duration(milliseconds: 5));
  return 'data-$id';
}

void main() async {
  final ids = ['a', 'b', 'c'];

  // Sequential — sometimes what you want (rate limits, ordering).
  final sequential = <String>[];
  for (final id in ids) {
    sequential.add(await fetch(id));
  }
  print(sequential);

  // Concurrent — usually what you want.
  final concurrent = await Future.wait(ids.map(fetch));
  print(concurrent);
}
```

## Errors across `await`

```dart
Future<int> risky(bool fail) async {
  if (fail) throw StateError('failed');
  return 1;
}

void main() async {
  try {
    await risky(true);
  } on StateError catch (e, stack) {
    print('caught ${e.message}');
    print('stack has ${stack.toString().split('\n').length} frames');
  } finally {
    print('finally still runs across await');
  }

  // Timeouts.
  try {
    await Future<void>.delayed(const Duration(seconds: 5))
        .timeout(const Duration(milliseconds: 10));
  } on Object catch (e) {
    print('timed out: ${e.runtimeType}');
  }

  // A future whose error nobody awaits becomes an unhandled error —
  // catchError keeps it contained.
  await risky(true).catchError((Object e) {
    print('catchError: $e');
    return 0;
  });
}
```

## Streams

A `Stream` is many values over time — the asynchronous `Iterable`.

```dart
Stream<int> countTo(int n) async* {
  for (var i = 1; i <= n; i++) {
    await Future<void>.delayed(const Duration(milliseconds: 1));
    yield i;
  }
}

void main() async {
  await for (final value in countTo(5)) {
    print('got $value');
  }

  print(await countTo(5).toList());
  print(await countTo(5).where((n) => n.isEven).toList());
  print(await countTo(5).map((n) => n * 10).toList());
  print(await countTo(5).fold<int>(0, (a, b) => a + b));
  print(await countTo(5).take(2).toList());
  print(await countTo(5).first);
  print(await countTo(5).length);
}
```

### Controllers, and single versus broadcast

```dart
import 'dart:async';

void main() async {
  final controller = StreamController<int>();

  controller.stream.listen(
    (value) => print('listener: $value'),
    onDone: () => print('done'),
  );

  controller.add(1);
  controller.add(2);
  await controller.close();

  // A single-subscription stream allows exactly one listener.
  // A broadcast stream allows many — but drops events with no listeners.
  final broadcast = StreamController<String>.broadcast();
  broadcast.stream.listen((v) => print('A: $v'));
  broadcast.stream.listen((v) => print('B: $v'));
  broadcast.add('to both');
  await broadcast.close();
}
```

```dart
import 'dart:async';

void main() async {
  final controller = StreamController<int>();
  controller.stream.listen((_) {});
  controller.stream.listen((_) {}); // error! Bad state: Stream has already been listened to.
  await controller.close();
}
```

> 💡 **Tip:** Every `listen()` returns a `StreamSubscription` that must be cancelled when you are finished — that is what a Flutter `State.dispose()` is usually cleaning up. A subscription left open keeps its source alive and leaks.

## Isolates: actual parallelism

Isolates do not share memory. They pass messages, which is why Dart has no data races.

```dart
import 'dart:isolate';

int expensive(int n) {
  var total = 0;
  for (var i = 0; i < n; i++) {
    total += i;
  }
  return total;
}

void main() async {
  // Isolate.run moves the work to another isolate and awaits the result.
  final result = await Isolate.run(() => expensive(1000000));
  print('computed in another isolate: $result');

  final results = await Future.wait([
    Isolate.run(() => expensive(100000)),
    Isolate.run(() => expensive(200000)),
  ]);
  print(results);
}
```

> 🔍 **Behind the scenes: no shared memory means no locks**
>
> Each isolate has its own heap and its own event loop. Sending a message copies it (or transfers it, for a `TransferableTypedData`), so two isolates can never observe each other's half-written object. The cost is that you cannot share a large structure for free; the benefit is that Dart needs no mutexes, no volatile, and no memory model to reason about. In Flutter this is what keeps the UI isolate responsive while a heavy parse runs elsewhere.

## Async in `main`

```dart
Future<String> loadConfig() async {
  await Future<void>.delayed(const Duration(milliseconds: 5));
  return 'config loaded';
}

Future<void> main() async {
  print(await loadConfig());
  print('the program ends when main\'s future completes');
}
```

**Reference:** [Asynchronous programming](https://dart.dev/language/async) and [Concurrency in Dart](https://dart.dev/language/concurrency) on dart.dev.
