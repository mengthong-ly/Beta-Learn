---
title: Async UI
section: Guide Book
summary: `FutureBuilder` and `StreamBuilder`, handling loading and error states properly, and the mistakes that make them refetch forever.
---
## `FutureBuilder`

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: FutureDemo())));

Future<String> fetchGreeting() async {
  await Future<void>.delayed(const Duration(milliseconds: 300));
  return 'Hello from the network';
}

class FutureDemo extends StatefulWidget {
  const FutureDemo({super.key});

  @override
  State<FutureDemo> createState() => _FutureDemoState();
}

class _FutureDemoState extends State<FutureDemo> {
  // Created ONCE, in initState — not in build. See below.
  late Future<String> _future = fetchGreeting();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          FutureBuilder<String>(
            future: _future,
            builder: (context, snapshot) {
              return switch (snapshot.connectionState) {
                ConnectionState.waiting => const CircularProgressIndicator(),
                _ when snapshot.hasError => Text('Error: ${snapshot.error}'),
                _ when snapshot.hasData => Text(snapshot.data!),
                _ => const Text('no data'),
              };
            },
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () => setState(() => _future = fetchGreeting()),
            child: const Text('reload'),
          ),
        ],
      ),
    );
  }
}
```

> ⚠️ `future: fetchGreeting()` written **inside** `build` starts a new request on every rebuild — and since the result triggers a rebuild, some versions of this loop forever. Create the future in `initState` (or in a `late` field, as above) and replace it deliberately with `setState` when you want a refresh.

## Every state, handled

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: AllStates())));

Future<List<String>> load(bool shouldFail) async {
  await Future<void>.delayed(const Duration(milliseconds: 200));
  if (shouldFail) throw Exception('the server said no');
  return ['first', 'second', 'third'];
}

class AllStates extends StatefulWidget {
  const AllStates({super.key});

  @override
  State<AllStates> createState() => _AllStatesState();
}

class _AllStatesState extends State<AllStates> {
  late Future<List<String>> _future = load(false);
  bool _fail = false;

  void _reload() {
    setState(() {
      _fail = !_fail;
      _future = load(_fail);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: FutureBuilder<List<String>>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48),
                      Text('${snapshot.error}'),
                      TextButton(onPressed: _reload, child: const Text('Retry')),
                    ],
                  ),
                );
              }
              final items = snapshot.data ?? const <String>[];
              if (items.isEmpty) {
                return const Center(child: Text('Nothing here yet'));
              }
              return ListView(
                children: [for (final item in items) ListTile(title: Text(item))],
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(8),
          child: FilledButton(onPressed: _reload, child: const Text('toggle success / failure')),
        ),
      ],
    );
  }
}
```

Four states — loading, error, empty and data — and a real screen needs all four. The empty state is the one most often forgotten, and it is the one users see first.

## `StreamBuilder`

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: StreamDemo())));

class StreamDemo extends StatefulWidget {
  const StreamDemo({super.key});

  @override
  State<StreamDemo> createState() => _StreamDemoState();
}

class _StreamDemoState extends State<StreamDemo> {
  late final Stream<int> _ticks = Stream<int>.periodic(
    const Duration(milliseconds: 200),
    (count) => count,
  ).take(10);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: StreamBuilder<int>(
        stream: _ticks,
        initialData: 0,
        builder: (context, snapshot) {
          return switch (snapshot.connectionState) {
            ConnectionState.done => const Text('stream finished'),
            _ when snapshot.hasError => Text('error: ${snapshot.error}'),
            _ => Text(
                'tick ${snapshot.data}',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
          };
        },
      ),
    );
  }
}
```

The same rule applies: create the stream once. A stream built in `build` is resubscribed on every rebuild, and a `Stream.periodic` created that way leaks a timer each time.

> 🔍 **Behind the scenes: why `StreamBuilder` needs a single-subscription stream to be created once**
>
> A single-subscription stream may only be listened to once. `StreamBuilder` subscribes in `initState` and unsubscribes in `dispose`; if the `stream` property changes identity on rebuild, it unsubscribes from the old one and subscribes to the new. Handing it a freshly-built stream every frame therefore means a new subscription every frame — and for a stream backed by a socket or a timer, a new *resource* every frame. `late final` on a `State` field is the fix, and it is why so much Flutter async code has that shape.

## Not everything needs a builder

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: PlainAsync())));

class PlainAsync extends StatefulWidget {
  const PlainAsync({super.key});

  @override
  State<PlainAsync> createState() => _PlainAsyncState();
}

class _PlainAsyncState extends State<PlainAsync> {
  String? _data;
  Object? _error;
  bool _loading = false;

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await Future.delayed(
        const Duration(milliseconds: 200),
        () => 'loaded at last',
      );
      if (!mounted) return;
      setState(() => _data = result);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (_loading) const CircularProgressIndicator(),
          if (_error != null) Text('error: $_error'),
          if (_data != null) Text(_data!),
          FilledButton(onPressed: _loading ? null : _load, child: const Text('load')),
        ],
      ),
    );
  }
}
```

Explicit state fields are often clearer than a `FutureBuilder`, especially when the result must survive a retry, be combined with other state, or be triggered by a button rather than by appearing on screen.

## Pull to refresh

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: Refreshable())));

class Refreshable extends StatefulWidget {
  const Refreshable({super.key});

  @override
  State<Refreshable> createState() => _RefreshableState();
}

class _RefreshableState extends State<Refreshable> {
  List<String> _items = List.generate(10, (i) => 'item $i');

  Future<void> _refresh() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    if (!mounted) return;
    setState(() {
      _items = List.generate(10, (i) => 'refreshed $i');
    });
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView.builder(
        itemCount: _items.length,
        itemBuilder: (context, i) => ListTile(title: Text(_items[i])),
      ),
    );
  }
}
```

`RefreshIndicator` needs a scrollable child that always scrolls — which is why a short list may need `physics: const AlwaysScrollableScrollPhysics()`.

**Reference:** [FutureBuilder](https://api.flutter.dev/flutter/widgets/FutureBuilder-class.html) and [Networking](https://docs.flutter.dev/data-and-backend/networking) on docs.flutter.dev.
