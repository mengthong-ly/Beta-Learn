---
title: Material widgets
section: 2 · Material, themes & forms
---

Flutter ships a library of ready-made widgets that follow Google's Material Design, and Material 3 is the default look. You've already used a few: `MaterialApp`, `Scaffold`, `AppBar` and the buttons. Using them saves you from drawing every piece yourself.

## Scaffold slots

A `Scaffold` is a Material page with named slots: an `appBar`, the `body`, a `floatingActionButton`, a `drawer` and more. An `AppBar` can hold `actions`, usually icon buttons on the right:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Inbox'),
          actions: [IconButton(icon: const Icon(Icons.search), onPressed: () {})],
        ),
        body: const Center(child: Text('No messages')),
        floatingActionButton: FloatingActionButton(
          onPressed: () {},
          tooltip: 'Write',
          child: const Icon(Icons.edit),
        ),
      ),
    ),
  );
}
```

## Cards and list tiles

A `Card` presents a related nugget of information, with rounded corners and a drop shadow. A `ListTile` is a specialized row with up to three lines of text and optional icons at the start and end. They go well together:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    const MaterialApp(
      home: Scaffold(
        body: Padding(
          padding: EdgeInsets.all(16),
          child: Card(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: Icon(Icons.restaurant_menu),
                  title: Text('Pad Thai'),
                  subtitle: Text('Ready in 20 minutes'),
                ),
                ListTile(
                  leading: Icon(Icons.local_cafe),
                  title: Text('Iced coffee'),
                  trailing: Icon(Icons.chevron_right),
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

## SnackBars

A `SnackBar` briefly tells the user that something happened, at the bottom of the screen. You show one through the `ScaffoldMessenger`, found from a `BuildContext` that sits inside the app:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('SnackBar demo')),
        body: const SnackBarPage(),
      ),
    ),
  );
}

class SnackBarPage extends StatelessWidget {
  const SnackBarPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ElevatedButton(
        onPressed: () {
          final snackBar = SnackBar(
            content: const Text('Yay! A SnackBar!'),
            action: SnackBarAction(label: 'Undo', onPressed: () {}),
          );
          ScaffoldMessenger.of(context).showSnackBar(snackBar);
        },
        child: const Text('Show SnackBar'),
      ),
    );
  }
}
```

`SnackBarPage` is its own widget on purpose: its `context` is *below* the `MaterialApp`, so `ScaffoldMessenger.of(context)` can find the messenger above it.

## Challenge

> 🎯 **Challenge:** The floating action button does nothing yet. Make it show a `SnackBar` that says `Saved`.

```dart starter
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: NotesPage()));
}

class NotesPage extends StatelessWidget {
  const NotesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notes')),
      body: const Center(child: Text('Nothing here yet')),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.save),
      ),
    );
  }
}
```

```dart solution
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: NotesPage()));
}

class NotesPage extends StatelessWidget {
  const NotesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notes')),
      body: const Center(child: Text('Nothing here yet')),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Saved')),
          );
        },
        child: const Icon(Icons.save),
      ),
    );
  }
}
```

```dart check
    expect(find.text('Saved'), findsNothing);
    await tester.tap(find.byType(FloatingActionButton));
    await tester.pump();
    expect(find.byType(SnackBar), findsOneWidget, reason: 'Tapping the button should show a SnackBar');
    expect(find.text('Saved'), findsOneWidget, reason: 'The SnackBar should say Saved');
```

**Reference:** [Display a snackbar](https://docs.flutter.dev/cookbook/design/snackbars), [Layouts in Flutter](https://docs.flutter.dev/ui/layout) and [Material Design for Flutter](https://docs.flutter.dev/ui/design/material).
