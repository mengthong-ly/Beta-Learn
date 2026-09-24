---
title: Layout
section: Guide Book
summary: Constraints go down, sizes go up, the parent sets the position — one sentence that explains every layout in Flutter.
---
Flutter's layout algorithm is one pass and one rule:

```text
Constraints go DOWN.   "you may be between 0 and 400 wide, 0 and 800 tall"
Sizes go UP.           "I will be 320 by 48"
The parent sets the POSITION.
```

A widget cannot know its own position, and it can never be larger than its constraints allow. Every "why is my widget the wrong size?" question is answered by finding which ancestor imposed which constraint.

## Seeing the constraints

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Column(
          children: [
            SizedBox(
              height: 80,
              child: LayoutBuilder(
                builder: (context, constraints) => Center(
                  child: Text('max: ${constraints.maxWidth.toStringAsFixed(0)}'
                      ' × ${constraints.maxHeight.toStringAsFixed(0)}'),
                ),
              ),
            ),
            SizedBox(
              width: 200,
              height: 80,
              child: LayoutBuilder(
                builder: (context, constraints) => Center(
                  child: Text('max: ${constraints.maxWidth.toStringAsFixed(0)}'
                      ' × ${constraints.maxHeight.toStringAsFixed(0)}'),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
```

`LayoutBuilder` hands you the constraints your parent gave you — the single most useful debugging tool in Flutter layout.

## Row and Column

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Column(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,   // vertical, for a Column
          crossAxisAlignment: CrossAxisAlignment.stretch,     // horizontal
          children: [
            Container(color: Colors.red.shade100, height: 60, child: const Center(child: Text('stretched'))),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,  // horizontal, for a Row
              children: const [Text('left'), Text('middle'), Text('right')],
            ),
            Row(
              mainAxisSize: MainAxisSize.min,                 // only as wide as the children
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [Icon(Icons.star), Text('compact row')],
            ),
          ],
        ),
      ),
    ),
  );
}
```

| Property | Controls |
| --- | --- |
| `mainAxisAlignment` | along the axis: horizontal for `Row`, vertical for `Column` |
| `crossAxisAlignment` | across it |
| `mainAxisSize` | `max` (fill the axis) or `min` (hug the children) |

## `Expanded` and `Flexible`

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Column(
          children: [
            SizedBox(
              height: 60,
              child: Row(
                children: [
                  Expanded(flex: 2, child: Container(color: Colors.red.shade200, child: const Center(child: Text('flex 2')))),
                  Expanded(child: Container(color: Colors.green.shade200, child: const Center(child: Text('flex 1')))),
                  Container(width: 80, color: Colors.blue.shade200, child: const Center(child: Text('fixed'))),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 60,
              child: Row(
                children: [
                  // Flexible: may be smaller than its share; Expanded must fill it.
                  Flexible(child: Container(color: Colors.amber.shade200, child: const Text('flexible'))),
                  Flexible(child: Container(color: Colors.purple.shade100, child: const Text('flexible'))),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
```

> ⚠️ `Expanded` and `Flexible` only work directly inside a `Row`, `Column` or `Flex`. Putting one inside a `Container` or a `Stack` throws `Incorrect use of ParentDataWidget` at run time.

## The unbounded constraint errors

The two most common layout crashes, and why they happen.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Column(
          children: [
            const Text('A ListView inside a Column needs a bounded height.'),
            // Without Expanded (or a SizedBox height) this throws:
            // "Vertical viewport was given unbounded height".
            Expanded(
              child: ListView(
                children: [
                  for (var i = 1; i <= 20; i++) ListTile(title: Text('row $i')),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
```

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Center(
          child: Row(
            children: [
              // A Row gives its children unbounded width, so a long Text
              // overflows. Expanded bounds it, and the text can then wrap.
              Expanded(
                child: Text(
                  'A very long line of text that would otherwise overflow the '
                  'right-hand edge of the row and paint the yellow stripes.',
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
```

> 🔍 **Behind the scenes: "unbounded" is not "infinite screen"**
>
> A `Column` offers its children unbounded *height* so that each one can say how tall it wants to be — that is how a `Column` measures. A `ListView` responds "however tall you like", and the two together have no answer, so Flutter throws rather than guessing. `Expanded` resolves it by saying "take exactly the space left over", which converts the unbounded constraint into a tight one. The same reasoning explains the `Row` and long-`Text` case.

## `Stack`

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Center(
          child: SizedBox(
            width: 200,
            height: 200,
            child: Stack(
              children: [
                Container(color: Colors.indigo.shade100),
                const Positioned(top: 8, left: 8, child: Text('top left')),
                const Positioned(bottom: 8, right: 8, child: Text('bottom right')),
                const Align(alignment: Alignment.center, child: Icon(Icons.layers, size: 48)),
                Positioned.fill(
                  child: IgnorePointer(
                    child: Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.indigo, width: 2),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
```

Non-positioned children are sized by the stack and aligned by its `alignment`; `Positioned` children are placed relative to its edges.

## Sizing widgets

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(width: 160, height: 40, child: Container(color: Colors.red.shade100)),
              const SizedBox(height: 8),                       // pure spacing
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 120, minHeight: 30),
                child: Container(color: Colors.green.shade100, child: const Text('constrained')),
              ),
              const SizedBox(height: 8),
              AspectRatio(
                aspectRatio: 16 / 9,
                child: Container(width: 160, color: Colors.blue.shade100),
              ),
              const SizedBox(height: 8),
              FractionallySizedBox(
                widthFactor: 0.5,
                child: Container(height: 24, color: Colors.amber.shade200),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
```

## Scrolling and lists

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: ListView.builder(
          itemCount: 100,
          itemBuilder: (context, index) => ListTile(
            leading: CircleAvatar(child: Text('$index')),
            title: Text('Item $index'),
            subtitle: const Text('built lazily, only when visible'),
          ),
        ),
      ),
    ),
  );
}
```

> 💡 **Tip:** `ListView(children: [...])` builds every child immediately; `ListView.builder` builds only what is on screen plus a small cache. For anything longer than a screenful — and certainly for anything from a network — use `.builder`. `ListView.separated` adds dividers, and `GridView.builder` does the same for grids.

## Padding, margin and `Container`

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Center(
          child: Container(
            margin: const EdgeInsets.all(16),      // outside the decoration
            padding: const EdgeInsets.all(24),     // inside it
            decoration: BoxDecoration(
              color: Colors.teal.shade50,
              border: Border.all(color: Colors.teal),
              borderRadius: BorderRadius.circular(12),
              boxShadow: const [BoxShadow(blurRadius: 8, color: Colors.black12)],
            ),
            child: const Text('margin outside, padding inside'),
          ),
        ),
      ),
    ),
  );
}
```

`Container` is a convenience that composes `Padding`, `Align`, `DecoratedBox`, `ConstrainedBox` and `Transform`. When you only need one of them, using that widget directly is clearer and marginally cheaper.

**Reference:** [Layouts in Flutter](https://docs.flutter.dev/ui/layout) and [Understanding constraints](https://docs.flutter.dev/ui/layout/constraints) on docs.flutter.dev.
