---
title: Themes
section: 2 · Material, themes & forms
---

Hard-coding `Colors.red` on every widget makes an app hard to restyle. A **theme** keeps colors and text styles in one place: set it once on `MaterialApp`, and every Material widget below picks it up. If you don't give one, Flutter creates a default theme for you.

## An app theme

Pass a `ThemeData` to `MaterialApp.theme`. Most themes set two things: a `colorScheme` for colors and a `textTheme` for text. `ColorScheme.fromSeed` builds a whole matching palette from one seed color:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.purple),
        textTheme: const TextTheme(
          displayLarge: TextStyle(fontSize: 72, fontWeight: FontWeight.bold),
        ),
      ),
      home: Scaffold(
        appBar: AppBar(title: const Text('Themes')),
        body: const Center(child: Text('Hi', style: TextStyle(fontSize: 40))),
        floatingActionButton: FloatingActionButton(
          onPressed: () {},
          child: const Icon(Icons.add),
        ),
      ),
    ),
  );
}
```

The button takes its color from the purple scheme without being told. Try `brightness: Brightness.dark` inside `ColorScheme.fromSeed` to get a dark palette.

## Reading the theme

Your own widgets read the theme with `Theme.of(context)`, which looks up the widget tree and returns the nearest `Theme`:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal)),
      home: const Scaffold(body: Center(child: Callout())),
    ),
  );
}

class Callout extends StatelessWidget {
  const Callout({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      color: theme.colorScheme.primary,
      child: Text(
        'Text with a background color',
        style: theme.textTheme.titleLarge!.copyWith(color: theme.colorScheme.onPrimary),
      ),
    );
  }
}
```

`onPrimary` is the scheme's color for content drawn *on* `primary`, so the text stays readable. `copyWith` returns a copy of the style with just the color changed.

## Overriding part of the app

Wrap a subtree in a `Theme` widget to restyle only that part. `Theme.of(context).copyWith(...)` extends the parent theme instead of replacing it:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Center(child: Buttons()))));
}

class Buttons extends StatelessWidget {
  const Buttons({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      spacing: 16,
      children: [
        FloatingActionButton(onPressed: () {}, child: const Icon(Icons.add)),
        Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.fromSeed(seedColor: Colors.pink),
          ),
          child: FloatingActionButton(
            onPressed: () {},
            child: const Icon(Icons.favorite),
          ),
        ),
      ],
    );
  }
}
```

Flutter applies styles in this order: a style set on the widget itself wins, then the nearest overriding `Theme`, then the app's main theme.

## Challenge

> 🎯 **Challenge:** Give the app a theme whose color scheme comes from the seed color `Colors.teal`. Then make the `Header` use the theme's `primary` color instead of the hard-coded `Colors.red`.

```dart starter
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Header())));
}

class Header extends StatelessWidget {
  const Header({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      color: Colors.red,
      child: const Text('Welcome'),
    );
  }
}
```

```dart solution
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal)),
      home: const Scaffold(body: Header()),
    ),
  );
}

class Header extends StatelessWidget {
  const Header({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      color: Theme.of(context).colorScheme.primary,
      child: const Text('Welcome'),
    );
  }
}
```

```dart check
    final teal = ColorScheme.fromSeed(seedColor: Colors.teal);
    final context = tester.element(find.text('Welcome'));
    expect(Theme.of(context).colorScheme.primary, teal.primary,
        reason: 'The app theme should use ColorScheme.fromSeed(seedColor: Colors.teal)');
    final header = tester.widget<Container>(
        find.ancestor(of: find.text('Welcome'), matching: find.byType(Container)).first);
    expect(header.color, teal.primary, reason: 'Header should use colorScheme.primary');
```

**Reference:** [Use themes to share colors and font styles](https://docs.flutter.dev/cookbook/design/themes).
