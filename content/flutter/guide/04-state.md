---
title: State
section: Guide Book
summary: `setState` and what it really does, where state should live, lifting it up, and the controllers that must be disposed.
---
## `setState`

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: Center(child: Counter()))));

class Counter extends StatefulWidget {
  const Counter({super.key});

  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int _count = 0;

  void _increment() {
    setState(() {
      _count++;        // mutate INSIDE the callback
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text('$_count', style: Theme.of(context).textTheme.displayMedium),
        ElevatedButton(onPressed: _increment, child: const Text('increment')),
      ],
    );
  }
}
```

`setState` does two things: it runs your callback, and it marks the element dirty so `build` runs again on the next frame. Mutating without it changes the value and never repaints; calling it with an empty callback works but hides what changed.

> ⚠️ Never call `setState` from `build`, and never `await` inside the callback. `setState(() async { … })` runs the body, returns a `Future` immediately, and rebuilds before the work is done. Do the async work first, then call `setState` with the result.

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: Center(child: Loader()))));

class Loader extends StatefulWidget {
  const Loader({super.key});

  @override
  State<Loader> createState() => _LoaderState();
}

class _LoaderState extends State<Loader> {
  String _status = 'idle';

  Future<void> _load() async {
    setState(() => _status = 'loading…');

    final result = await Future.delayed(
      const Duration(milliseconds: 300),
      () => 'loaded',
    );

    if (!mounted) return;              // the widget may be gone by now
    setState(() => _status = result);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(_status),
        ElevatedButton(onPressed: _load, child: const Text('load')),
      ],
    );
  }
}
```

> 🔍 **Behind the scenes: why `mounted` matters**
>
> Between starting an async operation and its completion, the user may have navigated away — and the `State` is then disposed. Calling `setState` on a disposed `State` throws. `if (!mounted) return;` after every `await` is the standard guard, and the `use_build_context_synchronously` lint exists to catch the version of this bug where you use a stale `BuildContext` instead.

## Where state should live

Put a piece of state in the **lowest common ancestor** of everything that reads it.

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: ShoppingList())));

class ShoppingList extends StatefulWidget {
  const ShoppingList({super.key});

  @override
  State<ShoppingList> createState() => _ShoppingListState();
}

class _ShoppingListState extends State<ShoppingList> {
  // Owned here, because both the list and the summary need it.
  final Set<String> _selected = {};
  static const _items = ['Apples', 'Bread', 'Coffee', 'Eggs'];

  void _toggle(String item) {
    setState(() {
      _selected.contains(item) ? _selected.remove(item) : _selected.add(item);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _Summary(count: _selected.length, total: _items.length),
        Expanded(
          child: ListView(
            children: [
              for (final item in _items)
                _Row(
                  label: item,
                  selected: _selected.contains(item),
                  onChanged: () => _toggle(item),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Summary extends StatelessWidget {
  const _Summary({required this.count, required this.total});
  final int count;
  final int total;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.all(16),
        child: Text('$count of $total selected'),
      );
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.selected, required this.onChanged});
  final String label;
  final bool selected;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) => CheckboxListTile(
        title: Text(label),
        value: selected,
        onChanged: (_) => onChanged(),
      );
}
```

Both children are `StatelessWidget`s that take what they need and report back through a callback — data down, events up. They are trivially testable, because they hold nothing.

## Controllers

Controllers are state that Flutter widgets share with you, and every one must be disposed.

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: ControllerDemo())));

class ControllerDemo extends StatefulWidget {
  const ControllerDemo({super.key});

  @override
  State<ControllerDemo> createState() => _ControllerDemoState();
}

class _ControllerDemoState extends State<ControllerDemo> {
  final _textController = TextEditingController(text: 'initial');
  final _scrollController = ScrollController();
  final _focusNode = FocusNode();
  String _typed = 'initial';

  @override
  void initState() {
    super.initState();
    _textController.addListener(() {
      setState(() => _typed = _textController.text);
    });
  }

  @override
  void dispose() {
    _textController.dispose();       // every one of them
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            controller: _textController,
            focusNode: _focusNode,
            decoration: const InputDecoration(labelText: 'Type something'),
          ),
          Text('you typed: $_typed'),
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              itemCount: 30,
              itemBuilder: (context, i) => ListTile(title: Text('row $i')),
            ),
          ),
        ],
      ),
    );
  }
}
```

## Derive, do not duplicate

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: Filtering())));

class Filtering extends StatefulWidget {
  const Filtering({super.key});

  @override
  State<Filtering> createState() => _FilteringState();
}

class _FilteringState extends State<Filtering> {
  static const _all = ['banana', 'apple', 'cherry', 'apricot'];
  String _query = '';

  // NOT stored in state — computed from _query during build.
  List<String> get _visible =>
      _all.where((item) => item.contains(_query)).toList()..sort();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            decoration: const InputDecoration(labelText: 'Filter'),
            onChanged: (value) => setState(() => _query = value),
          ),
          Text('${_visible.length} of ${_all.length}'),
          Expanded(
            child: ListView(
              children: [for (final item in _visible) ListTile(title: Text(item))],
            ),
          ),
        ],
      ),
    );
  }
}
```

Storing `_visible` in state would mean keeping it in sync with `_query` by hand — and the first time someone updates one without the other, the UI lies.

## `didUpdateWidget`

When state is derived from a prop, react to the prop changing.

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: Parent())));

class Parent extends StatefulWidget {
  const Parent({super.key});

  @override
  State<Parent> createState() => _ParentState();
}

class _ParentState extends State<Parent> {
  String _userId = 'u1';

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Profile(userId: _userId),
        ElevatedButton(
          onPressed: () => setState(() => _userId = _userId == 'u1' ? 'u2' : 'u1'),
          child: const Text('switch user'),
        ),
      ],
    );
  }
}

class Profile extends StatefulWidget {
  const Profile({required this.userId, super.key});
  final String userId;

  @override
  State<Profile> createState() => _ProfileState();
}

class _ProfileState extends State<Profile> {
  late String _loaded = 'data for ${widget.userId}';

  @override
  void didUpdateWidget(Profile oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.userId != widget.userId) {
      _loaded = 'data for ${widget.userId}';   // reload when the id changes
    }
  }

  @override
  Widget build(BuildContext context) => Text(_loaded);
}
```

> 💡 **Tip:** The alternative is a `key` on the child: `Profile(key: ValueKey(_userId), userId: _userId)` makes Flutter discard the old `State` and create a fresh one, so `initState` runs again and no `didUpdateWidget` is needed. Use a key when *everything* should reset, and `didUpdateWidget` when only part of it should.

**Reference:** [Adding interactivity](https://docs.flutter.dev/ui/interactivity) and [State management](https://docs.flutter.dev/data-and-backend/state-mgmt/intro) on docs.flutter.dev.
