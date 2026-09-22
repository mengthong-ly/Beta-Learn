---
title: Widgets
section: 1 · Introduction to Flutter UI
---

A Flutter UI is built from **widgets**. A widget is a Dart class that extends one of Flutter's widget classes, such as `StatelessWidget`, and every widget has a `build` method that returns another widget.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Greeting())));
}

class Greeting extends StatelessWidget {
  const Greeting({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(child: Text('Hello, Flutter!'));
  }
}
```

`runApp` shows the widget you give it. `MaterialApp` and `Scaffold` provide the app frame, `Center` positions its child, and `Text` draws the words. Press **Try it**, then **Run**: Flutter builds a web app on your computer and the Preview tab shows it (the first build takes a while).

## Composing widgets

Widgets nest: most have a `child` or `children`. A `Column` lays its children out top to bottom.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    const MaterialApp(
      home: Scaffold(
        body: Column(
          children: [Text('One'), Text('Two'), Text('Three')],
        ),
      ),
    ),
  );
}
```

## Passing data in

A widget gets its data through its **constructor**, and keeps it in `final` fields. The docs put it plainly: passing data into widget constructors is at the core of making widgets reusable. Here one `Tile` class draws two different tiles:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    const MaterialApp(
      home: Scaffold(
        body: Center(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [Tile('A', Colors.green), Tile('B', Colors.yellow)],
          ),
        ),
      ),
    ),
  );
}

class Tile extends StatelessWidget {
  const Tile(this.letter, this.color, {super.key});

  final String letter;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 60,
      height: 60,
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        color: color,
      ),
      child: Center(
        child: Text(letter, style: Theme.of(context).textTheme.titleLarge),
      ),
    );
  }
}
```

`Container` bundles several styling widgets (padding, size, color, decoration) into one. `BoxDecoration` adds borders, a background color or shadows.

💡 **Tip:** mark constructors and widget instances `const` when their values never change. Flutter can then reuse them instead of rebuilding them.

## Challenge

> 🎯 **Challenge:** Make a `StatelessWidget` called `Tile` that takes a `String letter` in its constructor and shows it in a `Text`. Show three tiles, `A`, `B` and `C`, side by side in a `Row`.

```dart starter
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Text('Change me'))));
}
```

```dart solution
import 'package:flutter/material.dart';

void main() {
  runApp(
    const MaterialApp(
      home: Scaffold(
        body: Row(children: [Tile('A'), Tile('B'), Tile('C')]),
      ),
    ),
  );
}

class Tile extends StatelessWidget {
  const Tile(this.letter, {super.key});

  final String letter;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 60,
      height: 60,
      color: Colors.green,
      child: Center(child: Text(letter)),
    );
  }
}
```

```dart check
    final tiles = find.byWidgetPredicate((w) => w.runtimeType.toString() == 'Tile');
    expect(tiles, findsNWidgets(3), reason: 'Show three Tile widgets');
    for (final letter in ['A', 'B', 'C']) {
      expect(find.descendant(of: tiles, matching: find.text(letter)), findsOneWidget,
          reason: 'A Tile should show $letter');
    }
    expect(find.byType(Row), findsOneWidget, reason: 'Put the tiles in a Row');
```

**Reference:** [Widget fundamentals](https://docs.flutter.dev/learn/pathway/tutorial/widget-fundamentals) in the Flutter learning pathway.
