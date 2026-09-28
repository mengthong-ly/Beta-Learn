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

## Buttons

Material 3 has a button for each level of emphasis. Pick by how important the action is, not by looks:

- `FilledButton` has the most impact after the floating action button. Use it for the important, final action that completes a flow, like **Save**, **Join now** or **Confirm**. `FilledButton.tonal` is a softer version of it.
- `ElevatedButton` is a filled button that lifts when pressed.
- `OutlinedButton` has a border and no fill, for secondary actions.
- `TextButton` has neither, for the least important actions, such as **Cancel** in a dialog.

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
              FilledButton(onPressed: () {}, child: const Text('Save')),
              FilledButton.tonal(onPressed: () {}, child: const Text('Save draft')),
              ElevatedButton(onPressed: () {}, child: const Text('Elevated')),
              OutlinedButton(onPressed: () {}, child: const Text('Preview')),
              TextButton(onPressed: () {}, child: const Text('Cancel')),
              const FilledButton(onPressed: null, child: Text('Disabled')),
            ],
          ),
        ),
      ),
    ),
  );
}
```

Passing `onPressed: null` disables any of them, and Flutter greys it out for you.

## SnackBars

A `SnackBar` tells the user that something happened, at the bottom of the screen. You show one through the `ScaffoldMessenger`, found from a `BuildContext` that sits inside the app:

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

A plain SnackBar goes away on its own after a few seconds. **One with an action stays until the user dismisses it** (since Flutter 3.38), so they have time to tap **Undo**. Set `persist: false` if you want it to time out anyway, or `persist: true` to keep a SnackBar without an action on screen.

## Dialogs

A dialog interrupts the user to ask for a decision. `showDialog` shows one above the page, and an `AlertDialog` gives it a title, content and a row of `actions`. Each action closes the dialog with `Navigator.pop`, passing a value back. `showDialog` returns a `Future` of that value, so you can `await` the answer:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: DeletePage())));
}

class DeletePage extends StatefulWidget {
  const DeletePage({super.key});

  @override
  State<DeletePage> createState() => _DeletePageState();
}

class _DeletePageState extends State<DeletePage> {
  String _status = 'Nothing deleted';

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete note?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true) setState(() => _status = 'Deleted');
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        spacing: 8,
        children: [
          Text(_status),
          OutlinedButton(onPressed: _confirmDelete, child: const Text('Delete note')),
        ],
      ),
    );
  }
}
```

Tapping outside the dialog also closes it (`barrierDismissible` is `true` by default), and then the `Future` completes with `null`. That's why the code checks `confirmed == true` rather than just `confirmed`.

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

**Reference:** [Display a snackbar](https://docs.flutter.dev/cookbook/design/snackbars), [SnackBar with action behavior update](https://docs.flutter.dev/release/breaking-changes/snackbar-with-action-behavior-update), [`FilledButton`](https://api.flutter.dev/flutter/material/FilledButton-class.html), [`showDialog`](https://api.flutter.dev/flutter/material/showDialog.html), [Layouts in Flutter](https://docs.flutter.dev/ui/layout) and [Material Design for Flutter](https://docs.flutter.dev/ui/design/material).
