---
title: Stateful widgets
section: 1 · Introduction to Flutter UI
---

A `StatelessWidget` looks the same for its whole life. When a widget's appearance or data needs to **change**, you need a `StatefulWidget` and a companion `State` object.

The widget itself is still immutable. The `State` object is the long-lived part: it holds the mutable data and builds the UI.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Center(child: Counter()))));
}

class Counter extends StatefulWidget {
  const Counter({super.key});

  @override
  State<Counter> createState() => _CounterState();
}

class _CounterState extends State<Counter> {
  int _count = 0;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: () {
        setState(() {
          _count++;
        });
      },
      child: Text('Tapped $_count times'),
    );
  }
}
```

Three pieces make it work:

1. `Counter` extends `StatefulWidget` and its `createState` returns the state object.
2. `_CounterState` extends `State<Counter>` and holds `_count` and the `build` method.
3. `setState` wraps the change.

## Why setState?

`setState` tells the framework that the state changed, so it calls `build` again. If you change `_count` **without** `setState`, the number changes in memory, but Flutter doesn't know it has to repaint, and the user sees nothing happen.

## Widget fields and cleaning up

Constructor data still lives on the widget. Inside the `State`, reach it through `widget.`, for example `widget.onSubmit`.

Objects like a `TextEditingController` or `FocusNode` belong in the `State`, so they survive when the parent rebuilds. Release them in `dispose`, which runs when the widget leaves the tree:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Guesses())));
}

class Guesses extends StatefulWidget {
  const Guesses({super.key});

  @override
  State<Guesses> createState() => _GuessesState();
}

class _GuessesState extends State<Guesses> {
  final List<String> _guesses = [];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        GuessInput(onSubmit: (guess) => setState(() => _guesses.add(guess))),
        for (final guess in _guesses) Text(guess),
      ],
    );
  }
}

class GuessInput extends StatefulWidget {
  const GuessInput({super.key, required this.onSubmit});

  final void Function(String) onSubmit;

  @override
  State<GuessInput> createState() => _GuessInputState();
}

class _GuessInputState extends State<GuessInput> {
  final TextEditingController _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    widget.onSubmit(_controller.text.trim());
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: TextField(controller: _controller, onSubmitted: (_) => _submit()),
        ),
        IconButton(icon: const Icon(Icons.add), onPressed: _submit),
      ],
    );
  }
}
```

The list lives in `_GuessesState`, the parent. `GuessInput` only reports each guess through its callback, and the parent adds it inside `setState`.

## Challenge

> 🎯 **Challenge:** Tapping **Like** changes `_likes`, but the screen never updates. Fix it so each tap shows the new count (`Likes: 1`, `Likes: 2`, …).

```dart starter
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Center(child: LikeButton()))));
}

class LikeButton extends StatefulWidget {
  const LikeButton({super.key});

  @override
  State<LikeButton> createState() => _LikeButtonState();
}

class _LikeButtonState extends State<LikeButton> {
  int _likes = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('Likes: $_likes'),
        ElevatedButton(
          onPressed: () {
            _likes++;
          },
          child: const Text('Like'),
        ),
      ],
    );
  }
}
```

```dart solution
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Center(child: LikeButton()))));
}

class LikeButton extends StatefulWidget {
  const LikeButton({super.key});

  @override
  State<LikeButton> createState() => _LikeButtonState();
}

class _LikeButtonState extends State<LikeButton> {
  int _likes = 0;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('Likes: $_likes'),
        ElevatedButton(
          onPressed: () {
            setState(() {
              _likes++;
            });
          },
          child: const Text('Like'),
        ),
      ],
    );
  }
}
```

```dart check
    expect(find.text('Likes: 0'), findsOneWidget);
    await tester.tap(find.text('Like'));
    await tester.pump();
    expect(find.text('Likes: 1'), findsOneWidget, reason: 'One tap should show Likes: 1');
    await tester.tap(find.text('Like'));
    await tester.pump();
    expect(find.text('Likes: 2'), findsOneWidget, reason: 'Two taps should show Likes: 2');
```

**Reference:** [Learn about stateful widgets](https://docs.flutter.dev/learn/pathway/tutorial/stateful-widget) in the Flutter learning pathway.
