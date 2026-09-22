---
title: Layout
section: 1 · Introduction to Flutter UI
---

In Flutter, layout is widgets too. There's no separate stylesheet: you position things by wrapping them in layout widgets such as `Padding`, `Center`, `Row` and `Column`.

`Scaffold` gives a Material page its slots: an `appBar` on top and a `body` below. A `Column` stacks its children **vertically**, a `Row` lines them up **horizontally**, and `spacing` puts a gap between the children.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('Birdle')),
        body: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            spacing: 5.0,
            children: [
              for (final word in ['HELLO', 'WORLD'])
                Row(
                  spacing: 5.0,
                  children: [for (final letter in word.split('')) Box(letter)],
                ),
            ],
          ),
        ),
      ),
    ),
  );
}

class Box extends StatelessWidget {
  const Box(this.letter, {super.key});

  final String letter;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      color: Colors.green.shade200,
      child: Center(child: Text(letter)),
    );
  }
}
```

The `for` inside the `children` list is Dart's **collection for**: it builds one widget per item, so the layout follows the data. A `Column` of `Row`s gives you a grid.

## Main axis and cross axis

A `Row`'s **main axis** runs horizontally and its cross axis vertically. A `Column` is the other way round. `mainAxisAlignment` and `crossAxisAlignment` place the children along each axis.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    const MaterialApp(
      home: Scaffold(
        body: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text('Main axis: vertical, centered'),
            Text('Cross axis: horizontal, at the end'),
          ],
        ),
      ),
    ),
  );
}
```

By default a row or column takes as much space along its main axis as it can. Set `mainAxisSize: MainAxisSize.min` to pack the children tightly instead.

## Expanded shares the space

When a layout is too big for the screen, Flutter paints a yellow and black striped bar along the edge that overflows. This row asks for 1000 pixels:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    const MaterialApp(
      home: Scaffold(
        body: Row(
          children: [
            SizedBox(width: 500, child: Text('Too')),
            SizedBox(width: 500, child: Text('wide')), // error! overflows
          ],
        ),
      ),
    ),
  );
}
```

Wrap children in `Expanded` and they share whatever space there is. The `flex` factor (default `1`) sets each child's share, so `flex: 2` gets twice as much as its siblings:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Row(
          children: [
            Expanded(child: Container(height: 80, color: Colors.red)),
            Expanded(flex: 2, child: Container(height: 80, color: Colors.green)),
            Expanded(child: Container(height: 80, color: Colors.blue)),
          ],
        ),
      ),
    ),
  );
}
```

💡 **Tip:** since Dart 3.10 you can write `.center` instead of `MainAxisAlignment.center` when the type is already known. These are called dot shorthands.

## Challenge

> 🎯 **Challenge:** Split the screen width so the `Left` panel gets one third and the `Right` panel two thirds. Wrap each panel in an `Expanded` and give them the right `flex`.

```dart starter
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Row(
          children: [
            Container(width: 100, color: Colors.amber, child: const Text('Left')),
            Container(width: 100, color: Colors.teal, child: const Text('Right')),
          ],
        ),
      ),
    ),
  );
}
```

```dart solution
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Row(
          children: [
            Expanded(child: Container(color: Colors.amber, child: const Text('Left'))),
            Expanded(
              flex: 2,
              child: Container(color: Colors.teal, child: const Text('Right')),
            ),
          ],
        ),
      ),
    ),
  );
}
```

```dart check
    expect(find.byType(Expanded), findsNWidgets(2), reason: 'Wrap each panel in an Expanded');
    Size panel(String label) => tester.getSize(
        find.ancestor(of: find.text(label), matching: find.byType(Expanded)).first);
    final left = panel('Left');
    final right = panel('Right');
    expect(left.width + right.width, moreOrLessEquals(800),
        reason: 'The two panels should fill the whole width');
    expect(right.width, moreOrLessEquals(left.width * 2),
        reason: 'Right should be twice as wide as Left');
```

**Reference:** [Layout widgets on a screen](https://docs.flutter.dev/learn/pathway/tutorial/layout) in the Flutter learning pathway, and [Layouts in Flutter](https://docs.flutter.dev/ui/layout).
