---
title: Implicit animations
section: 1 · Introduction to Flutter UI
---

When a property changes, a plain `Container` jumps straight to the new value. **Implicit animations** are widgets that animate those changes for you: you say what the new value is, and the widget handles the "how".

## AnimatedContainer

Swap `Container` for `AnimatedContainer` and add a `duration`. Now any change to its `color`, `width`, `height`, `decoration` or `alignment` animates from the old value to the new one. Tap the box:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Center(child: GrowingBox()))));
}

class GrowingBox extends StatefulWidget {
  const GrowingBox({super.key});

  @override
  State<GrowingBox> createState() => _GrowingBoxState();
}

class _GrowingBoxState extends State<GrowingBox> {
  bool _big = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => setState(() => _big = !_big),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 500),
        width: _big ? 200 : 100,
        height: _big ? 200 : 100,
        color: _big ? Colors.green : Colors.grey,
      ),
    );
  }
}
```

`GestureDetector` listens for gestures on its child; its `onTap` callback fires on a tap. The tap calls `setState`, `build` runs with the new values, and `AnimatedContainer` fills in the frames in between.

## Curves

A `curve` controls the *feel*: how the speed changes over the animation. The default is `Curves.linear`, a constant speed. `Curves.easeIn` starts slow, and `Curves.bounceOut` bounces at the end:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Mover())));
}

class Mover extends StatefulWidget {
  const Mover({super.key});

  @override
  State<Mover> createState() => _MoverState();
}

class _MoverState extends State<Mover> {
  bool _right = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => setState(() => _right = !_right),
      child: AnimatedContainer(
        duration: const Duration(seconds: 1),
        curve: Curves.bounceOut,
        alignment: _right ? Alignment.centerRight : Alignment.centerLeft,
        color: Colors.blue.shade50,
        child: const FlutterLogo(size: 80),
      ),
    );
  }
}
```

## More implicit animations

`AnimatedContainer` is one of a family. `AnimatedOpacity` fades its child between `0.0` (invisible) and `1.0` (fully visible), and `AnimatedPadding`, `AnimatedPositioned` and `AnimatedSwitcher` follow the same idea.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: FadeDemo()));
}

class FadeDemo extends StatefulWidget {
  const FadeDemo({super.key});

  @override
  State<FadeDemo> createState() => _FadeDemoState();
}

class _FadeDemoState extends State<FadeDemo> {
  bool _visible = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: AnimatedOpacity(
          opacity: _visible ? 1.0 : 0.0,
          duration: const Duration(milliseconds: 500),
          child: Container(width: 200, height: 200, color: Colors.green),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => setState(() => _visible = !_visible),
        tooltip: 'Toggle opacity',
        child: const Icon(Icons.flip),
      ),
    );
  }
}
```

## Challenge

> 🎯 **Challenge:** Tapping the bar makes it jump from 100 to 300 pixels wide. Make it **animate** the change over 500 milliseconds instead.

```dart starter
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Center(child: Bar()))));
}

class Bar extends StatefulWidget {
  const Bar({super.key});

  @override
  State<Bar> createState() => _BarState();
}

class _BarState extends State<Bar> {
  bool _wide = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => setState(() => _wide = !_wide),
      child: Container(
        width: _wide ? 300 : 100,
        height: 40,
        color: Colors.orange,
      ),
    );
  }
}
```

```dart solution
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Center(child: Bar()))));
}

class Bar extends StatefulWidget {
  const Bar({super.key});

  @override
  State<Bar> createState() => _BarState();
}

class _BarState extends State<Bar> {
  bool _wide = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => setState(() => _wide = !_wide),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 500),
        width: _wide ? 300 : 100,
        height: 40,
        color: Colors.orange,
      ),
    );
  }
}
```

```dart check
    final bar = find.byWidgetPredicate((w) => w is Container || w is AnimatedContainer).first;
    expect(tester.getSize(bar).width, 100);
    await tester.tap(bar);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 250));
    expect(tester.getSize(bar).width, inExclusiveRange(100, 300),
        reason: 'Halfway through the animation, the bar should be between 100 and 300 wide');
    await tester.pumpAndSettle();
    expect(tester.getSize(bar).width, 300, reason: 'The bar should end up 300 wide');
    expect(find.byType(AnimatedContainer), findsOneWidget);
```

**Reference:** [Add implicit animations](https://docs.flutter.dev/learn/pathway/tutorial/implicit-animations) in the Flutter learning pathway, and [Implicit animations](https://docs.flutter.dev/ui/animations/implicit-animations).
