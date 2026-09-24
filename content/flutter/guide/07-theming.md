---
title: Theming & Material
section: Guide Book
summary: `ThemeData` and colour schemes, reading the theme instead of hard-coding, dark mode, and where component themes belong.
---
## One theme, read everywhere

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: Colors.teal,
      ),
      home: const ThemeDemo(),
    ),
  );
}

class ThemeDemo extends StatelessWidget {
  const ThemeDemo({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colours = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(title: const Text('Theming')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('headlineSmall', style: theme.textTheme.headlineSmall),
          Text('titleMedium', style: theme.textTheme.titleMedium),
          Text('bodyMedium', style: theme.textTheme.bodyMedium),
          Text('labelSmall', style: theme.textTheme.labelSmall),
          const SizedBox(height: 16),
          for (final entry in {
            'primary': colours.primary,
            'secondary': colours.secondary,
            'surface': colours.surface,
            'error': colours.error,
          }.entries)
            Container(
              margin: const EdgeInsets.symmetric(vertical: 4),
              padding: const EdgeInsets.all(12),
              color: entry.value,
              child: Text(entry.key),
            ),
        ],
      ),
    );
  }
}
```

`Theme.of(context)` walks up the tree to the nearest `Theme` — an inherited widget — and returns its data. A widget that reads it is automatically rebuilt when the theme changes.

> 💡 **Tip:** Never hard-code a colour or a font size in a widget. `Theme.of(context).colorScheme.primary` means dark mode, high-contrast mode and a rebrand all work without touching the widget. A literal `Color(0xFF00695C)` means none of them do.

## A seeded colour scheme

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6750A4),
          brightness: Brightness.light,
        ),
      ),
      home: const SeedDemo(),
    ),
  );
}

class SeedDemo extends StatelessWidget {
  const SeedDemo({super.key});

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;

    Widget swatch(String label, Color background, Color foreground) => Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          color: background,
          child: Text(label, style: TextStyle(color: foreground)),
        );

    return Scaffold(
      appBar: AppBar(title: const Text('Seeded scheme')),
      body: ListView(
        children: [
          swatch('primary / onPrimary', c.primary, c.onPrimary),
          swatch('primaryContainer', c.primaryContainer, c.onPrimaryContainer),
          swatch('secondaryContainer', c.secondaryContainer, c.onSecondaryContainer),
          swatch('tertiaryContainer', c.tertiaryContainer, c.onTertiaryContainer),
          swatch('surfaceContainerHighest', c.surfaceContainerHighest, c.onSurface),
          swatch('errorContainer', c.errorContainer, c.onErrorContainer),
        ],
      ),
    );
  }
}
```

> 🔍 **Behind the scenes: what `fromSeed` actually does**
>
> Material 3 derives an entire accessible palette from one colour. The seed is converted into a perceptual colour space, then tonal palettes are generated at fixed lightness steps, and roles — `primary`, `onPrimary`, `primaryContainer` — are assigned tones chosen so that every `on*` pair meets contrast requirements. That is why you should pick colours by **role**, not by shade: the role guarantees the contrast, a hand-picked shade does not.

## Light and dark

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.indigo),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: Colors.indigo,
        brightness: Brightness.dark,
      ),
      themeMode: ThemeMode.system,      // follow the device setting
      home: const BrightnessDemo(),
    ),
  );
}

class BrightnessDemo extends StatelessWidget {
  const BrightnessDemo({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(title: const Text('Brightness')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(isDark ? Icons.dark_mode : Icons.light_mode, size: 48),
            Text(isDark ? 'dark theme' : 'light theme'),
            const Padding(
              padding: EdgeInsets.all(24),
              child: Text(
                'Because every colour comes from the scheme, nothing below '
                'this line needed changing to support both.',
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

Switching `themeMode` at run time is how an in-app toggle works — it lives in state above `MaterialApp`.

## Component themes

Style a widget type once instead of at every use site.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: Colors.deepOrange,
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          ),
        ),
        cardTheme: CardThemeData(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Colors.black12),
          ),
        ),
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
          filled: true,
        ),
      ),
      home: const ComponentThemeDemo(),
    ),
  );
}

class ComponentThemeDemo extends StatelessWidget {
  const ComponentThemeDemo({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Component themes')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('Every Card gets this shape'),
              ),
            ),
            const SizedBox(height: 16),
            const TextField(decoration: InputDecoration(labelText: 'Every field, filled')),
            const SizedBox(height: 16),
            FilledButton(onPressed: () {}, child: const Text('Every button, squared')),
          ],
        ),
      ),
    );
  }
}
```

## Overriding for a subtree

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.blue),
      home: const SubtreeTheme(),
    ),
  );
}

class SubtreeTheme extends StatelessWidget {
  const SubtreeTheme({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scoped theme')),
      body: Column(
        children: [
          const Padding(
            padding: EdgeInsets.all(16),
            child: FilledButtonRow(label: 'app theme'),
          ),
          Theme(
            // A different theme for this subtree only.
            data: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.pink),
            child: const Padding(
              padding: EdgeInsets.all(16),
              child: FilledButtonRow(label: 'scoped theme'),
            ),
          ),
        ],
      ),
    );
  }
}

class FilledButtonRow extends StatelessWidget {
  const FilledButtonRow({required this.label, super.key});
  final String label;

  @override
  Widget build(BuildContext context) => Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [FilledButton(onPressed: () {}, child: Text(label))],
      );
}
```

## Text styles

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      theme: ThemeData(useMaterial3: true),
      home: const TextStyles(),
    ),
  );
}

class TextStyles extends StatelessWidget {
  const TextStyles({super.key});

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;

    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('displayLarge', style: text.displayLarge),
          Text('headlineMedium', style: text.headlineMedium),
          Text('titleLarge', style: text.titleLarge),
          Text('bodyLarge', style: text.bodyLarge),
          Text('labelMedium', style: text.labelMedium),
          const SizedBox(height: 16),
          // copyWith for a one-off variation, keeping everything else.
          Text(
            'bodyLarge, but bold and coloured',
            style: text.bodyLarge?.copyWith(
              fontWeight: FontWeight.bold,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }
}
```

`copyWith` is the pattern throughout Flutter: take the theme's style, change the one thing you need, keep everything else consistent.

**Reference:** [Use themes to share colors and font styles](https://docs.flutter.dev/cookbook/design/themes) and [Material 3](https://docs.flutter.dev/ui/design/material) on docs.flutter.dev.
