---
title: Navigation
section: Guide Book
summary: The navigator stack, pushing and popping with results, named and declarative routing, and passing data between screens.
---
## The stack

`Navigator` is a stack of routes. `push` adds a screen on top; `pop` removes it.

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: HomeScreen()));

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: Center(
        child: FilledButton(
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const DetailScreen(id: 42)),
          ),
          child: const Text('Open detail'),
        ),
      ),
    );
  }
}

class DetailScreen extends StatelessWidget {
  const DetailScreen({required this.id, super.key});

  final int id;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // The AppBar adds a back button automatically when it can pop.
      appBar: AppBar(title: Text('Detail $id')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Showing item $id'),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Back'),
            ),
          ],
        ),
      ),
    );
  }
}
```

Data goes to the next screen through the widget's **constructor** — there is no special mechanism, because a route is just a widget.

## Returning a result

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: PickerHome()));

class PickerHome extends StatefulWidget {
  const PickerHome({super.key});

  @override
  State<PickerHome> createState() => _PickerHomeState();
}

class _PickerHomeState extends State<PickerHome> {
  String _chosen = 'nothing yet';

  Future<void> _pick() async {
    final result = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (context) => const PickerScreen()),
    );

    if (!mounted) return;
    setState(() => _chosen = result ?? 'cancelled');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Picker')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('chosen: $_chosen'),
            FilledButton(onPressed: _pick, child: const Text('Choose a colour')),
          ],
        ),
      ),
    );
  }
}

class PickerScreen extends StatelessWidget {
  const PickerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pick one')),
      body: ListView(
        children: [
          for (final colour in ['red', 'green', 'blue'])
            ListTile(
              title: Text(colour),
              onTap: () => Navigator.pop(context, colour),   // the result
            ),
        ],
      ),
    );
  }
}
```

`Navigator.push` returns a `Future` that completes when the route is popped — with whatever `pop` was given, or `null` if the user pressed back.

> ⚠️ The result is nullable, always. The system back gesture, the back button and a swipe all pop without a value, so `result ?? fallback` is not optional defensiveness — it is the common path.

## Named routes

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      initialRoute: '/',
      routes: {
        '/': (context) => const MenuScreen(),
        '/about': (context) => const AboutScreen(),
        '/settings': (context) => const SettingsScreen(),
      },
    ),
  );
}

class MenuScreen extends StatelessWidget {
  const MenuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Menu')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('About'),
            onTap: () => Navigator.pushNamed(context, '/about'),
          ),
          ListTile(
            title: const Text('Settings'),
            onTap: () => Navigator.pushNamed(context, '/settings'),
          ),
        ],
      ),
    );
  }
}

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('About')),
        body: const Center(child: Text('About this app')),
      );
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Settings')),
        body: const Center(child: Text('Settings')),
      );
}
```

## Manipulating the stack

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: StackDemo()));

class StackDemo extends StatelessWidget {
  const StackDemo({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Stack operations')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          _Operation('push', 'add a route on top'),
          _Operation('pop', 'remove the top route'),
          _Operation('pushReplacement', 'swap the top route — no back button'),
          _Operation('pushAndRemoveUntil', 'push, then clear everything below a predicate'),
          _Operation('popUntil', 'pop repeatedly until a predicate matches'),
          _Operation('maybePop', 'pop only if there is something to pop'),
          _Operation('canPop', 'ask whether a pop is possible'),
        ],
      ),
    );
  }
}

class _Operation extends StatelessWidget {
  const _Operation(this.name, this.description);
  final String name;
  final String description;

  @override
  Widget build(BuildContext context) => ListTile(
        title: Text(name, style: const TextStyle(fontFamily: 'monospace')),
        subtitle: Text(description),
      );
}
```

The two that matter most:

- `pushReplacement` for a login screen that should not be returnable to.
- `pushAndRemoveUntil(route, (r) => false)` to clear the whole stack — the standard "log out" move.

## Dialogs, sheets and snackbars

These are routes too, which is why they are dismissed with `pop`.

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Overlays()));

class Overlays extends StatefulWidget {
  const Overlays({super.key});

  @override
  State<Overlays> createState() => _OverlaysState();
}

class _OverlaysState extends State<Overlays> {
  String _result = '';

  Future<void> _confirm() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete this item?'),
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

    if (!mounted) return;
    setState(() => _result = confirmed == true ? 'deleted' : 'cancelled');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Overlays')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('result: $_result'),
            FilledButton(onPressed: _confirm, child: const Text('Show dialog')),
            TextButton(
              onPressed: () => showModalBottomSheet<void>(
                context: context,
                builder: (context) => const SizedBox(
                  height: 200,
                  child: Center(child: Text('A bottom sheet')),
                ),
              ),
              child: const Text('Show bottom sheet'),
            ),
            TextButton(
              onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('A snackbar')),
              ),
              child: const Text('Show snackbar'),
            ),
          ],
        ),
      ),
    );
  }
}
```

> 🔍 **Behind the scenes: why a snackbar needs `ScaffoldMessenger`**
>
> A `SnackBar` shown through the `Scaffold` alone disappears when that `Scaffold` is replaced — so a message shown just before navigating away vanishes immediately. `ScaffoldMessenger` sits *above* the navigator and owns the queue, so the snackbar survives the route change and appears over whatever screen comes next. It also explains the common error "No ScaffoldMessenger widget found": you used a `context` from above `MaterialApp`, where no messenger exists yet.

## Declarative routing

For anything with deep links, nested navigation or web URLs, the imperative API stops scaling. `Navigator 2.0` and the `go_router` package describe the whole stack as a function of app state:

```text
app state  ──►  the list of pages  ──►  Navigator
```

The same shift React Router and SwiftUI made: instead of "push this screen", you change state and the navigator's contents follow.

**Reference:** [Navigation and routing](https://docs.flutter.dev/ui/navigation) on docs.flutter.dev.
