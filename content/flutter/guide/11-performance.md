---
title: Performance & testing
section: Guide Book
summary: What actually costs a frame, the structural fixes that beat micro-optimisation, and the three kinds of Flutter test.
---
## The frame budget

At 60 fps you have 16 ms per frame; at 120 fps, 8. Miss it and the user sees jank.

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: Budget())));

class Budget extends StatelessWidget {
  const Budget({super.key});

  @override
  Widget build(BuildContext context) {
    const phases = [
      ('Animate', 'tick every running animation'),
      ('Build', 'run build() on dirty elements — usually the cheap part'),
      ('Layout', 'constraints down, sizes up'),
      ('Paint', 'produce the layer tree'),
      ('Composite', 'hand layers to the GPU'),
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('16 ms, five phases', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        for (final (name, what) in phases)
          ListTile(dense: true, title: Text(name), subtitle: Text(what)),
      ],
    );
  }
}
```

## Fix 1: build lazily

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: LazyList())));

class LazyList extends StatelessWidget {
  const LazyList({super.key});

  @override
  Widget build(BuildContext context) {
    // ListView.builder constructs only the visible rows plus a small cache.
    // ListView(children: [...10_000 items]) would construct all of them,
    // on every rebuild, whether or not they are on screen.
    return ListView.builder(
      itemCount: 10000,
      itemExtent: 56,          // telling Flutter the height skips measuring
      itemBuilder: (context, index) => ListTile(
        title: Text('row $index'),
        subtitle: const Text('built only when visible'),
      ),
    );
  }
}
```

`itemExtent` (or `prototypeItem`) lets the viewport compute scroll offsets arithmetically instead of laying out children to find them — a large win on long lists.

## Fix 2: shrink the rebuild

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: ScopedRebuild())));

class ScopedRebuild extends StatefulWidget {
  const ScopedRebuild({super.key});

  @override
  State<ScopedRebuild> createState() => _ScopedRebuildState();
}

class _ScopedRebuildState extends State<ScopedRebuild> {
  final _counter = ValueNotifier<int>(0);

  @override
  void dispose() {
    _counter.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // This build runs ONCE — incrementing does not rebuild it.
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const _ExpensiveHeader(),
          ValueListenableBuilder<int>(
            valueListenable: _counter,
            builder: (context, value, child) => Text('$value'),
          ),
          FilledButton(
            onPressed: () => _counter.value++,
            child: const Text('increment'),
          ),
        ],
      ),
    );
  }
}

class _ExpensiveHeader extends StatelessWidget {
  const _ExpensiveHeader();

  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.all(16),
        child: Text('pretend this subtree is expensive'),
      );
}
```

Three techniques, in order of value:

1. **`const` widgets** — skipped entirely, for free.
2. **Extract widgets** rather than `_buildX()` methods — each gets its own element to skip.
3. **Scope the listener** — `ValueListenableBuilder` / `ListenableBuilder` around only what displays the value.

## Fix 3: keep expensive work out of `build`

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: CachedWork())));

class CachedWork extends StatefulWidget {
  const CachedWork({super.key});

  @override
  State<CachedWork> createState() => _CachedWorkState();
}

class _CachedWorkState extends State<CachedWork> {
  static const _source = ['delta', 'alpha', 'charlie', 'bravo'];

  // Computed once, not on every build.
  late final List<String> _sorted = _source.toList()..sort();

  int _rebuilds = 0;

  @override
  Widget build(BuildContext context) {
    _rebuilds++;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Text('rebuilds: $_rebuilds — the sort ran once'),
        ),
        for (final item in _sorted) ListTile(title: Text(item)),
        FilledButton(onPressed: () => setState(() {}), child: const Text('rebuild')),
      ],
    );
  }
}
```

> ⚠️ `build` may run 60 times a second. Parsing, sorting, formatting dates, compiling a regex or decoding JSON inside it is the most common source of jank in a Flutter app — and the easiest to fix, because the work almost always belongs in `initState` or in a `late final`.

## `RepaintBoundary`

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: BoundaryDemo())));

class BoundaryDemo extends StatefulWidget {
  const BoundaryDemo({super.key});

  @override
  State<BoundaryDemo> createState() => _BoundaryDemoState();
}

class _BoundaryDemoState extends State<BoundaryDemo> with SingleTickerProviderStateMixin {
  late final AnimationController _controller =
      AnimationController(duration: const Duration(seconds: 1), vsync: this);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // The animation repaints inside its own layer, so the static
          // content around it is not repainted with it.
          RepaintBoundary(
            child: RotationTransition(
              turns: _controller,
              child: const Icon(Icons.autorenew, size: 64),
            ),
          ),
          const Padding(
            padding: EdgeInsets.all(16),
            child: Text('this text is never repainted by the animation'),
          ),
          FilledButton(
            onPressed: () => _controller.forward(from: 0),
            child: const Text('spin once'),
          ),
        ],
      ),
    );
  }
}
```

A `RepaintBoundary` puts its subtree in a separate layer. It costs memory, so use it where something repaints frequently next to something that does not — not everywhere.

> 🔍 **Behind the scenes: the tools that tell you where the time went**
>
> Guessing is the main way performance work is wasted. **DevTools' Performance view** shows a flame chart per frame, split by phase, so you can see whether you are build-bound or raster-bound. `debugProfileBuildsEnabled` names the widgets being rebuilt; the **repaint rainbow** overlay tints layers as they repaint, which makes an over-repainting subtree obvious at a glance. Always profile in **profile mode** — debug mode's assertions and unoptimised code make every measurement meaningless.

## Widget tests

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: Counter())));

class Counter extends StatefulWidget {
  const Counter({super.key});

  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int _count = 0;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('$_count', key: const ValueKey('count')),
          FilledButton(
            onPressed: () => setState(() => _count++),
            child: const Text('increment'),
          ),
        ],
      ),
    );
  }
}
```

The test for that widget, for reference:

```dart-snippet
testWidgets('increments the counter', (tester) async {
  await tester.pumpWidget(const MaterialApp(home: Scaffold(body: Counter())));

  expect(find.text('0'), findsOneWidget);

  await tester.tap(find.text('increment'));
  await tester.pump();                      // rebuild after setState

  expect(find.text('1'), findsOneWidget);
  expect(find.byKey(const ValueKey('count')), findsOneWidget);
});
```

| Call | Does |
| --- | --- |
| `pumpWidget` | mount a widget tree |
| `pump()` | advance one frame |
| `pump(duration)` | advance by that much |
| `pumpAndSettle()` | pump until no animation is running |
| `find.text` / `.byType` / `.byKey` / `.byIcon` | locate widgets |
| `tester.tap` / `.enterText` / `.drag` / `.fling` | interact |
| `expect(finder, findsOneWidget)` | assert |

> ⚠️ `pumpAndSettle` throws if the tree never settles — an indefinitely repeating animation, a spinner that is always visible, or a stream that keeps producing. Use `pump(duration)` for those, and reserve `pumpAndSettle` for animations that end.

## The three kinds of test

| Kind | Runs | Use for |
| --- | --- | --- |
| **Unit** | no Flutter binding | pure logic, models, parsing |
| **Widget** | a headless test binding, milliseconds | a widget's behaviour — the workhorse |
| **Integration** | a real device or emulator | whole flows, platform channels, performance |

Widget tests are where most of the value is: they exercise real rendering, real gestures and real state, and they run in milliseconds with no device.

## A checklist

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: Checklist())));

class Checklist extends StatelessWidget {
  const Checklist({super.key});

  @override
  Widget build(BuildContext context) {
    const items = [
      'const everywhere the linter suggests it',
      'extract widgets, not _build methods',
      'ListView.builder for anything longer than a screen',
      'no parsing, sorting or formatting inside build()',
      'dispose every controller, notifier and subscription',
      'scope rebuilds with ValueListenableBuilder',
      'profile in profile mode, never in debug',
      'measure before optimising — then measure again',
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        for (final item in items)
          ListTile(
            dense: true,
            leading: const Icon(Icons.check, size: 18),
            title: Text(item),
          ),
      ],
    );
  }
}```

**Reference:** [Performance best practices](https://docs.flutter.dev/perf/best-practices) and [Testing Flutter apps](https://docs.flutter.dev/testing/overview) on docs.flutter.dev.
