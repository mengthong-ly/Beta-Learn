---
title: Lists and keys
section: 4 · Flutter UI 102
---

Almost every app shows a list: messages, products, todos. `ListView` scrolls them, and **keys** make sure each row keeps its own state when the list changes underneath it.

## Short lists and long lists

The plain `ListView(children: [...])` constructor is fine for a handful of rows, but it creates every child up front. For a long or endless list, use `ListView.builder`: it calls `itemBuilder` only for the rows that are scrolled onto the screen, so 10,000 items cost about the same as 10:

```dart
import 'package:flutter/material.dart';

void main() {
  final items = List<String>.generate(10000, (i) => 'Item $i');
  runApp(MaterialApp(home: LongListPage(items: items)));
}

class LongListPage extends StatelessWidget {
  const LongListPage({super.key, required this.items});

  final List<String> items;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Long list')),
      body: ListView.builder(
        itemCount: items.length,
        prototypeItem: ListTile(title: Text(items.first)),
        itemBuilder: (context, index) {
          return ListTile(
            leading: CircleAvatar(child: Text('${index % 100}')),
            title: Text(items[index]),
          );
        },
      ),
    );
  }
}
```

`itemCount` tells the list where it ends; leave it out and the list is infinite. `prototypeItem` is optional: it tells the list that every row is as tall as this one, so it can jump far down without measuring every row on the way.

Need a line between rows? `ListView.separated` takes a second builder. Separators only go *between* items, so 3 items get 2 dividers:

```dart
import 'package:flutter/material.dart';

void main() {
  const planets = ['Mercury', 'Venus', 'Earth'];
  runApp(
    MaterialApp(
      home: Scaffold(
        body: ListView.separated(
          itemCount: planets.length,
          itemBuilder: (context, index) => ListTile(title: Text(planets[index])),
          separatorBuilder: (context, index) => const Divider(),
        ),
      ),
    ),
  );
}
```

## Why keys matter

When a list rebuilds, Flutter matches the new widgets to the old ones by **type and position**. A `State` object belongs to a position, not to your data. Remove the first row, and the `State` that was at position 0 is now paired with what used to be the second row.

A **key** changes the matching: a widget with a key is only matched to an old widget with the same key. Give each row a `ValueKey` built from something unique about the item, such as its id:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: TodoPage()));
}

class TodoPage extends StatefulWidget {
  const TodoPage({super.key});

  @override
  State<TodoPage> createState() => _TodoPageState();
}

class _TodoPageState extends State<TodoPage> {
  final _todos = ['Buy milk', 'Walk the dog', 'Call mom'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Todos')),
      body: ListView(
        children: [
          for (final todo in _todos) TodoTile(key: ValueKey(todo), label: todo),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _todos.isEmpty ? null : () => setState(() => _todos.removeAt(0)),
        label: const Text('Remove first'),
      ),
    );
  }
}

class TodoTile extends StatefulWidget {
  const TodoTile({super.key, required this.label});

  final String label;

  @override
  State<TodoTile> createState() => _TodoTileState();
}

class _TodoTileState extends State<TodoTile> {
  bool _done = false; // lives in the State, not in the data

  @override
  Widget build(BuildContext context) {
    return CheckboxListTile(
      title: Text(widget.label),
      value: _done,
      onChanged: (value) => setState(() => _done = value ?? false),
    );
  }
}
```

Tick **Buy milk**, then tap **Remove first**: the tick goes away with it. Now delete `key: ValueKey(todo),` and try again. **Walk the dog** shows up ticked, because it inherited the `State` of position 0.

💡 **Tip:** Keys only need to be unique among siblings. Build them from a stable id, never from the index: after a removal, the index of every later row changes.

## Swipe to delete with Dismissible

Wrap a row in `Dismissible` and the user can swipe it away. It **requires** a key, and its `onDismissed` callback **must** remove the item from your data. Otherwise the next build puts the dismissed row back and Flutter throws. `background` is what shows behind the row as it slides:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: InboxPage()));
}

class InboxPage extends StatefulWidget {
  const InboxPage({super.key});

  @override
  State<InboxPage> createState() => _InboxPageState();
}

class _InboxPageState extends State<InboxPage> {
  final _emails = List<String>.generate(20, (i) => 'Email ${i + 1}');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Inbox')),
      body: ListView.builder(
        itemCount: _emails.length,
        itemBuilder: (context, index) {
          final email = _emails[index];
          return Dismissible(
            key: ValueKey(email),
            background: const ColoredBox(color: Colors.red),
            onDismissed: (direction) => setState(() => _emails.removeAt(index)),
            child: ListTile(title: Text(email)),
          );
        },
      ),
    );
  }
}
```

By default you can swipe either way (`DismissDirection.horizontal`). Add `confirmDismiss` if you want to ask "Are you sure?" first.

## Drag to reorder

`ReorderableListView` lets the user drag rows into a new order: long-press on a phone, or use the drag handle it adds on desktop. Every row needs a key. When a row is dropped, `onReorderItem(oldIndex, newIndex)` tells you where it went, and you move the item in your data:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: PlaylistPage()));
}

class PlaylistPage extends StatefulWidget {
  const PlaylistPage({super.key});

  @override
  State<PlaylistPage> createState() => _PlaylistPageState();
}

class _PlaylistPageState extends State<PlaylistPage> {
  final _songs = ['Intro', 'Sunrise', 'Midnight', 'Outro'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Playlist')),
      body: ReorderableListView(
        onReorderItem: (oldIndex, newIndex) {
          setState(() {
            final song = _songs.removeAt(oldIndex);
            _songs.insert(newIndex, song);
          });
        },
        children: [
          for (final song in _songs) ListTile(key: ValueKey(song), title: Text(song)),
        ],
      ),
    );
  }
}
```

💡 **Tip:** Older tutorials use `onReorder` with an `if (oldIndex < newIndex) newIndex -= 1;` fix-up. `onReorder` is deprecated since Flutter 3.44. `onReorderItem` has the same `(oldIndex, newIndex)` signature but already accounts for the removed row, so `removeAt` then `insert` just works.

## Challenge

> 🎯 **Challenge:** Let the user swipe a fruit away. Wrap each row in a `Dismissible` with a `ValueKey` made from the fruit, and remove the fruit from `_fruits` when it's dismissed.

```dart starter
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: FruitPage()));
}

class FruitPage extends StatefulWidget {
  const FruitPage({super.key});

  @override
  State<FruitPage> createState() => _FruitPageState();
}

class _FruitPageState extends State<FruitPage> {
  final _fruits = ['Apple', 'Banana', 'Cherry', 'Date'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fruit')),
      body: ListView.builder(
        itemCount: _fruits.length,
        itemBuilder: (context, index) {
          final fruit = _fruits[index];
          return ListTile(title: Text(fruit));
        },
      ),
    );
  }
}
```

```dart solution
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: FruitPage()));
}

class FruitPage extends StatefulWidget {
  const FruitPage({super.key});

  @override
  State<FruitPage> createState() => _FruitPageState();
}

class _FruitPageState extends State<FruitPage> {
  final _fruits = ['Apple', 'Banana', 'Cherry', 'Date'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fruit')),
      body: ListView.builder(
        itemCount: _fruits.length,
        itemBuilder: (context, index) {
          final fruit = _fruits[index];
          return Dismissible(
            key: ValueKey(fruit),
            background: const ColoredBox(color: Colors.red),
            onDismissed: (direction) => setState(() => _fruits.removeAt(index)),
            child: ListTile(title: Text(fruit)),
          );
        },
      ),
    );
  }
}
```

```dart check
    expect(find.text('Banana'), findsOneWidget, reason: 'The list should start with Banana in it');
    await tester.drag(find.text('Banana'), const Offset(-500, 0));
    await tester.pumpAndSettle();
    expect(find.text('Banana'), findsNothing, reason: 'Swiping Banana to the left should remove it. Wrap each row in a Dismissible and remove the fruit in onDismissed');
    await tester.drag(find.text('Apple'), const Offset(-500, 0));
    await tester.pumpAndSettle();
    expect(find.text('Apple'), findsNothing, reason: 'Swiping Apple away should remove it too');
    expect(find.text('Cherry'), findsOneWidget, reason: 'Cherry was not swiped, so it should still be there');
    expect(find.text('Date'), findsOneWidget, reason: 'Date was not swiped, so it should still be there');
```

**Reference:** [Use lists](https://docs.flutter.dev/cookbook/lists/basic-list), [Work with long lists](https://docs.flutter.dev/cookbook/lists/long-lists), [Implement swipe to dismiss](https://docs.flutter.dev/cookbook/gestures/dismissible), [Deprecate `onReorder`](https://docs.flutter.dev/release/breaking-changes/deprecate-onreorder-callback), and the [`Key`](https://api.flutter.dev/flutter/foundation/Key-class.html), [`ListView.separated`](https://api.flutter.dev/flutter/widgets/ListView/ListView.separated.html), [`Dismissible`](https://api.flutter.dev/flutter/widgets/Dismissible-class.html) and [`ReorderableListView`](https://api.flutter.dev/flutter/material/ReorderableListView-class.html) APIs.
