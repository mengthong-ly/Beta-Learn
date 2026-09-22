---
title: User input
section: 1 · Introduction to Flutter UI
---

Apps react to people. Flutter's basic input widgets are the `TextField` for typing and buttons for tapping, and both talk back to your code through **callbacks**: functions you hand to the widget, which it calls when something happens.

## Buttons

Every button takes an `onPressed` callback and a child to show. In a Flutter web app, `print` writes to the browser's developer console, so open your browser's dev tools to watch the taps:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            spacing: 8,
            children: [
              ElevatedButton(
                onPressed: () => print('ElevatedButton'),
                child: const Text('Elevated'),
              ),
              TextButton(
                onPressed: () => print('TextButton'),
                child: const Text('Text'),
              ),
              IconButton(
                onPressed: () => print('IconButton'),
                icon: const Icon(Icons.thumb_up),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
```

## Text fields and controllers

A `TextField` keeps its own text. To read or change that text from code, give it a `TextEditingController`: `controller.text` reads it and `controller.clear()` empties the field.

```dart
import 'package:flutter/material.dart';

final controller = TextEditingController();

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: controller,
            maxLength: 5,
            decoration: const InputDecoration(
              labelText: 'Your guess',
              border: OutlineInputBorder(),
            ),
            onSubmitted: (_) => print('You typed ${controller.text}'),
          ),
        ),
      ),
    ),
  );
}
```

`onSubmitted` runs when the user presses Enter. Its argument is the text, but here we read the controller instead, so the parameter is named `_`: Dart's way of saying "not used".

## Callbacks make widgets reusable

A widget shouldn't decide what happens with the input; its parent should. So the input widget takes a callback of type `void Function(String)` and calls it. A `FocusNode` lets the field grab the keyboard focus again after each guess.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: GuessInput(onSubmitGuess: (guess) => print('Guess: $guess')),
      ),
    ),
  );
}

class GuessInput extends StatelessWidget {
  GuessInput({super.key, required this.onSubmitGuess});

  final void Function(String) onSubmitGuess;
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();

  void _onSubmit() {
    onSubmitGuess(_controller.text.trim());
    _controller.clear();
    _focusNode.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: TextField(
              controller: _controller,
              focusNode: _focusNode,
              autofocus: true,
              onSubmitted: (_) => _onSubmit(),
            ),
          ),
        ),
        IconButton(icon: const Icon(Icons.arrow_circle_up), onPressed: _onSubmit),
      ],
    );
  }
}
```

The `TextField` sits in an `Expanded`. A text field wants to be as wide as it's allowed, and a `Row` doesn't limit its children's width, so without `Expanded` you get an error about an unbounded width.

💡 **Tip:** creating a controller in a `StatelessWidget`'s field works for a demo, but it makes a new controller every time the widget is rebuilt. The next lesson shows the proper home for it: a `State` object.

## Challenge

> 🎯 **Challenge:** The send button prints the message but leaves it in the field. Make it also **clear** the field, using the controller.

```dart starter
import 'package:flutter/material.dart';

final controller = TextEditingController();

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Row(
          children: [
            Expanded(child: TextField(controller: controller)),
            IconButton(
              icon: const Icon(Icons.send),
              onPressed: () {
                print('Sent: ${controller.text}');
              },
            ),
          ],
        ),
      ),
    ),
  );
}
```

```dart solution
import 'package:flutter/material.dart';

final controller = TextEditingController();

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: Row(
          children: [
            Expanded(child: TextField(controller: controller)),
            IconButton(
              icon: const Icon(Icons.send),
              onPressed: () {
                print('Sent: ${controller.text}');
                controller.clear();
              },
            ),
          ],
        ),
      ),
    ),
  );
}
```

```dart check
    await tester.enterText(find.byType(TextField), 'hello');
    await tester.pump();
    expect(find.text('hello'), findsOneWidget);
    await tester.tap(find.byIcon(Icons.send));
    await tester.pump();
    expect(find.text('hello'), findsNothing, reason: 'Tapping send should clear the field');
```

**Reference:** [Handle user input](https://docs.flutter.dev/learn/pathway/tutorial/user-input) in the Flutter learning pathway.
