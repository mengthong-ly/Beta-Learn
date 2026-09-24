---
title: Widgets & composition
section: Guide Book
summary: Stateless versus stateful, the constructor-and-final-fields pattern, and why composition replaces inheritance and configuration.
---
## `StatelessWidget`

A widget whose appearance depends only on its constructor arguments.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    const MaterialApp(
      home: Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CountBadge(label: 'Inbox', count: 4),
              CountBadge(label: 'Archive', count: 0),
              CountBadge(label: 'Errors', count: 12, tone: Colors.red),
            ],
          ),
        ),
      ),
    ),
  );
}

class CountBadge extends StatelessWidget {
  const CountBadge({
    required this.label,
    this.count = 0,
    this.tone = Colors.blue,
    super.key,
  });

  final String label;
  final int count;
  final Color tone;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label),
          const SizedBox(width: 8),
          if (count > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: tone,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text('$count', style: const TextStyle(color: Colors.white)),
            ),
        ],
      ),
    );
  }
}
```

The shape every Flutter widget follows: a `const` constructor, named parameters, `required` where there is no sensible default, `final` fields, and `super.key`.

> 💡 **Tip:** Make the constructor `const` whenever every field is `final` and the values can be compile-time constants. It is the single cheapest performance improvement available, and the linter's `prefer_const_constructors` rule exists to nag you into it.

## `StatefulWidget`

Two classes: the widget (immutable configuration) and the `State` (mutable, and it survives rebuilds).

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: Center(child: CounterStepper()))));

class CounterStepper extends StatefulWidget {
  const CounterStepper({this.initial = 0, this.step = 1, super.key});

  final int initial;
  final int step;

  @override
  State<CounterStepper> createState() => _CounterStepperState();
}

class _CounterStepperState extends State<CounterStepper> {
  late int _value = widget.initial;     // read the widget's config here

  void _change(int delta) => setState(() => _value += delta);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          onPressed: () => _change(-widget.step),
          icon: const Icon(Icons.remove),
        ),
        Text('$_value', style: Theme.of(context).textTheme.headlineMedium),
        IconButton(
          onPressed: () => _change(widget.step),
          icon: const Icon(Icons.add),
        ),
      ],
    );
  }
}
```

The `State` reaches its configuration through `widget.*`. That indirection is why the widget can be rebuilt with new values while the state carries on.

## The `State` lifecycle

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: LifecycleDemo())));

class LifecycleDemo extends StatefulWidget {
  const LifecycleDemo({super.key});

  @override
  State<LifecycleDemo> createState() => _LifecycleDemoState();
}

class _LifecycleDemoState extends State<LifecycleDemo> {
  final List<String> _log = [];

  @override
  void initState() {
    super.initState();
    _log.add('initState — once, before the first build');
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _log.add('didChangeDependencies — after initState, and when an inherited widget changes');
  }

  @override
  void didUpdateWidget(LifecycleDemo oldWidget) {
    super.didUpdateWidget(oldWidget);
    _log.add('didUpdateWidget — the parent rebuilt with new configuration');
  }

  @override
  void dispose() {
    // Controllers, subscriptions and animations are cancelled here.
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        for (final entry in _log)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Text('• $entry'),
          ),
      ],
    );
  }
}
```

| Method | Called |
| --- | --- |
| `createState` | once, when the element is created |
| `initState` | once, before the first `build` |
| `didChangeDependencies` | after `initState`, and when an inherited widget it depends on changes |
| `build` | often |
| `didUpdateWidget` | when the parent rebuilds this widget |
| `setState` | by you, to mark the element dirty |
| `deactivate` / `dispose` | when it leaves the tree |

> ⚠️ Anything created in `initState` that holds a resource — a `TextEditingController`, an `AnimationController`, a stream subscription, a timer — **must** be released in `dispose`. Flutter will not do it for you, and the leak keeps the whole `State` alive.

## Composition over configuration

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Composition: the caller decides what goes inside.
              Panel(
                title: 'Composed',
                child: Column(
                  children: const [
                    Text('anything at all'),
                    Icon(Icons.star),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Panel(
                title: 'Also composed',
                trailing: IconButton(onPressed: () {}, icon: const Icon(Icons.close)),
                child: const Text('with a named slot too'),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class Panel extends StatelessWidget {
  const Panel({required this.title, required this.child, this.trailing, super.key});

  final String title;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleMedium),
                if (trailing != null) ...[const SizedBox(width: 8), trailing!],
              ],
            ),
            const SizedBox(height: 8),
            child,
          ],
        ),
      ),
    );
  }
}
```

A `Widget child` parameter is Flutter's answer to a slot. It is why `Padding`, `Center` and `Container` are separate widgets rather than properties on everything.

## Extract widgets, not methods

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: Parent())));

class Parent extends StatefulWidget {
  const Parent({super.key});

  @override
  State<Parent> createState() => _ParentState();
}

class _ParentState extends State<Parent> {
  int _count = 0;

  // A method: rebuilt every time Parent rebuilds, always.
  Widget _buildHeaderMethod() => const Text('header (a method)');

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildHeaderMethod(),
          // A const widget: skipped entirely on rebuild.
          const _HeaderWidget(),
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

class _HeaderWidget extends StatelessWidget {
  const _HeaderWidget();

  @override
  Widget build(BuildContext context) => const Text('header (a const widget)');
}
```

> 🔍 **Behind the scenes: why a helper method is not the same as a widget**
>
> A `_buildX()` method produces widgets that belong to the *caller's* element. They are rebuilt whenever the caller rebuilds, they cannot be `const`, and they get no element of their own — so Flutter has nothing to skip. A separate `StatelessWidget` gets its own element, can be `const`, and can be skipped when its configuration is unchanged. Extracting widgets rather than methods is the most effective structural optimisation in Flutter.

## Keys

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: KeyDemo())));

class KeyDemo extends StatefulWidget {
  const KeyDemo({super.key});

  @override
  State<KeyDemo> createState() => _KeyDemoState();
}

class _KeyDemoState extends State<KeyDemo> {
  List<String> _items = ['alpha', 'beta', 'gamma'];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (final item in _items)
          // ValueKey ties the element to the DATA, not the position.
          _Counter(key: ValueKey(item), label: item),
        ElevatedButton(
          onPressed: () => setState(() => _items = _items.reversed.toList()),
          child: const Text('reverse'),
        ),
      ],
    );
  }
}

class _Counter extends StatefulWidget {
  const _Counter({required this.label, super.key});
  final String label;

  @override
  State<_Counter> createState() => _CounterState();
}

class _CounterState extends State<_Counter> {
  int _taps = 0;

  @override
  Widget build(BuildContext context) => TextButton(
        onPressed: () => setState(() => _taps++),
        child: Text('${widget.label}: $_taps'),
      );
}
```

| Key | Use for |
| --- | --- |
| `ValueKey(x)` | identity from a value — an id, a slug |
| `ObjectKey(obj)` | identity from an object's identity |
| `UniqueKey()` | force a rebuild — a *new* key every build |
| `GlobalKey` | reach a widget's state from elsewhere — use sparingly |

**Reference:** [Introduction to widgets](https://docs.flutter.dev/ui/widgets-intro) and [When to use keys](https://docs.flutter.dev/resources/architectural-overview#keys) on docs.flutter.dev.
