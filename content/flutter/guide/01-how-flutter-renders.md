---
title: How Flutter renders
section: Guide Book
summary: Three trees — widgets, elements and render objects — and why rebuilding a widget is cheap.
---
Flutter draws every pixel itself. There are no platform views behind a `Text`; there is a rendering engine, and your widgets describe what it should draw.

```text
Widget tree          Element tree           RenderObject tree
(your build output)  (the instances)        (layout and painting)

Text('hi')     ──►   TextElement      ──►   RenderParagraph
  configuration        identity, state        size, position, paint

rebuilt often        rebuilt rarely         rebuilt rarely
cheap to create      reused where possible  expensive, so reused
```

## Widgets are immutable descriptions

A widget is a configuration object, not the thing on screen. Building one is as cheap as building any small object, and Flutter throws thousands away per second without concern.

```dart
import 'package:flutter/material.dart';

void main() {
  // Widgets are just objects — you can build them anywhere.
  const widget = Text('a widget is a description, not a view');

  runApp(
    const MaterialApp(
      home: Scaffold(
        body: Center(child: widget),
      ),
    ),
  );
}
```

## `build()` runs a lot

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
  int _builds = 0;

  @override
  Widget build(BuildContext context) {
    _builds++;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('count: $_count'),
          Text('build() has run $_builds times'),
          ElevatedButton(
            onPressed: () => setState(() => _count++),
            child: const Text('increment'),
          ),
        ],
      ),
    );
  }
}
```

`setState` does not redraw anything. It marks the element **dirty**, and Flutter rebuilds that subtree on the next frame — then compares the result with the previous widgets and updates only the render objects that actually changed.

> 🔍 **Behind the scenes: why three trees instead of one**
>
> If widgets *were* the render objects, every rebuild would mean re-laying-out and repainting everything. Instead the **element** tree persists: it holds the `State` objects and the link to the render objects. On a rebuild, Flutter walks the new widget tree against the existing elements and asks, for each position, "is this the same `runtimeType` and `key`?" If yes, the element is reused and merely handed the new configuration; if no, the element and its render object are thrown away and rebuilt. That is the whole reconciliation algorithm, and it is why `build()` being called often is normal rather than alarming.

## Same type and key means the same element

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: Swapper())));

class Swapper extends StatefulWidget {
  const Swapper({super.key});

  @override
  State<Swapper> createState() => _SwapperState();
}

class _SwapperState extends State<Swapper> {
  bool _swapped = false;

  @override
  Widget build(BuildContext context) {
    final tiles = [
      const _Tile(label: 'first', key: ValueKey('first')),
      const _Tile(label: 'second', key: ValueKey('second')),
    ];

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // With keys, swapping the list moves the STATE with the widget.
        ...(_swapped ? tiles.reversed : tiles),
        ElevatedButton(
          onPressed: () => setState(() => _swapped = !_swapped),
          child: const Text('swap'),
        ),
      ],
    );
  }
}

class _Tile extends StatefulWidget {
  const _Tile({required this.label, super.key});
  final String label;

  @override
  State<_Tile> createState() => _TileState();
}

class _TileState extends State<_Tile> {
  int _taps = 0;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: () => setState(() => _taps++),
      child: Text('${widget.label}: $_taps taps'),
    );
  }
}
```

Without the `ValueKey`s, swapping the two tiles would keep the state in position — the tap counts would stay put while the labels moved.

## The frame

```text
1. Animate     tick every active animation
2. Build       run build() on dirty elements
3. Layout      constraints down, sizes up
4. Paint       produce a layer tree
5. Composite   hand it to the GPU
```

All of it must fit in 16 ms for 60 fps, or 8 ms at 120. The [performance](/flutter/guide/performance) chapter is about keeping each step small.

## `const` skips the work entirely

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: ConstDemo())));

class ConstDemo extends StatefulWidget {
  const ConstDemo({super.key});

  @override
  State<ConstDemo> createState() => _ConstDemoState();
}

class _ConstDemoState extends State<ConstDemo> {
  int _count = 0;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // This widget is created ONCE for the whole program. On every
          // rebuild it is the identical object, so Flutter skips its subtree.
          const Padding(
            padding: EdgeInsets.all(8),
            child: Text('const: never rebuilt'),
          ),
          Text('count: $_count'),
          ElevatedButton(
            onPressed: () => setState(() => _count++),
            child: const Text('rebuild'),
          ),
        ],
      ),
    );
  }
}
```

Two `const` widgets with the same arguments are the *same object* in Dart, so the "is this the same widget?" check short-circuits immediately and the subtree is skipped. That is why the linter asks for `const` so insistently — it is a rebuild-skipping mechanism, not a style rule.

## Everything is a widget

Layout, padding, gestures, theming and even the app itself are widgets. There is no separate layout language and no styling system — just more composition.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.indigo),
      home: Scaffold(
        appBar: AppBar(title: const Text('Everything is a widget')),
        body: Center(
          child: Padding(                       // padding: a widget
            padding: const EdgeInsets.all(16),
            child: DecoratedBox(                // decoration: a widget
              decoration: BoxDecoration(
                color: Colors.indigo.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Padding(
                padding: EdgeInsets.all(24),
                child: Text('composed from small pieces'),
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
```

**Reference:** [Introduction to widgets](https://docs.flutter.dev/ui/widgets-intro) and [Inside Flutter](https://docs.flutter.dev/resources/inside-flutter) on docs.flutter.dev.
