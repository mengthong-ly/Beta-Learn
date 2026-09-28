---
title: Accessibility
section: 5 · Architecture & quality
---

Many people use your app through a screen reader, with large text, or with shaky hands. Flutter's built-in widgets already do most of the work, and this lesson covers the rest, plus how to test it.

## The semantics tree

Next to the widget tree, Flutter builds a **semantics tree**: what each thing on screen *is* ("button"), what it's called ("Delete") and what it can do ("tap"). Screen readers like TalkBack on Android and VoiceOver on iOS read that tree aloud and let people act on it.

Standard widgets fill it in for you. `FilledButton`, `TextField`, `Checkbox` and `Text` all describe themselves. Two things need your help:

- **Icons and images have no words.** Give `IconButton` a `tooltip`, which screen readers announce and the tap-target checks accept as its label, and give a meaningful `Icon` or `Image` a `semanticLabel`.
- **`GestureDetector` is not a button.** It adds a tap action but no label and no button role. Prefer a real button, or wrap it in `Semantics(button: true, label: …)`.

`MergeSemantics` turns a group into one node, so a checkbox and its label are read together. `ExcludeSemantics` hides decoration that would only be noise.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: PlayerPage()));
}

class PlayerPage extends StatefulWidget {
  const PlayerPage({super.key});

  @override
  State<PlayerPage> createState() => _PlayerPageState();
}

class _PlayerPageState extends State<PlayerPage> {
  bool _shuffle = false;
  int _plays = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Player'),
        actions: [
          const Icon(Icons.wifi, semanticLabel: 'Online'),
          IconButton(
            tooltip: 'Delete', // read aloud, and shown on long press
            icon: const Icon(Icons.delete),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          Semantics(
            button: true,
            label: 'Play',
            child: GestureDetector(
              onTap: () => setState(() => _plays++),
              child: const SizedBox.square(
                dimension: 64,
                child: Icon(Icons.play_circle, size: 64),
              ),
            ),
          ),
          Text('Played $_plays times'),
          const ExcludeSemantics(child: Text('~ ~ ~')), // decoration only
          MergeSemantics(
            child: Row(
              children: [
                Checkbox(
                  value: _shuffle,
                  onChanged: (value) => setState(() => _shuffle = value!),
                ),
                const Text('Shuffle'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

With `MergeSemantics`, a screen reader announces the label and the checkbox state as one item, instead of an unnamed checkbox followed by a stray word.

## Size, contrast and text scaling

The accessibility design page gives three numbers to design for:

- **Tap targets** of at least **48×48** dp on Android and **44×44** pt on iOS. Material buttons already pad themselves to 48×48. A 24×24 icon in a `GestureDetector` does not.
- **Contrast** of at least **4.5:1** for small text and **3:1** for large text (18 pt and up, or 14 pt bold). Pale grey on white fails. Colors from your theme's `ColorScheme`, like `onSurface` and `onSurfaceVariant`, are picked to pass on their matching surfaces.
- **Large text.** Flutter scales text with the OS font size setting automatically. Your job is to leave room: don't put text in a box with a fixed height, and let rows wrap or scroll.

You can read the current scale with `MediaQuery.textScalerOf(context)`, and preview your layout at 200% by overriding it for the whole app:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(
          textScaler: const TextScaler.linear(2), // preview at 200%
        ),
        child: child!,
      ),
      home: const SizePage(),
    ),
  );
}

class SizePage extends StatelessWidget {
  const SizePage({super.key});

  @override
  Widget build(BuildContext context) {
    final scaler = MediaQuery.textScalerOf(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Big text')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('16 px text is drawn at ${scaler.scale(16)} px'),
          // No fixed height: the card grows with its text.
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('A long description wraps onto more lines instead of being cut off.'),
            ),
          ),
        ],
      ),
    );
  }
}
```

💡 **Tip:** If a design truly can't grow past a point, `MediaQuery.withClampedTextScaling(maxScaleFactor: …)` caps the scale for one subtree. Use it sparingly: people turn text up because they need it.

## Testing accessibility

`flutter_test` can check these rules for you with the Accessibility Guideline API. Turn the semantics tree on with `tester.ensureSemantics()`, check with `meetsGuideline`, and dispose the handle at the end:

```dart-snippet
testWidgets('follows a11y guidelines', (tester) async {
  final handle = tester.ensureSemantics();
  await tester.pumpWidget(const MaterialApp(home: PlayerPage()));

  await expectLater(tester, meetsGuideline(androidTapTargetGuideline)); // 48×48
  await expectLater(tester, meetsGuideline(iOSTapTargetGuideline)); // 44×44
  await expectLater(tester, meetsGuideline(labeledTapTargetGuideline)); // every tap target has a label
  await expectLater(tester, meetsGuideline(textContrastGuideline)); // 4.5:1, or 3:1 for large text
  handle.dispose();
});
```

💡 **Tip:** A `Card` merges everything inside it into one semantics node by default (`semanticContainer: true`). A tiny unlabeled `GestureDetector` inside a card becomes part of the card's node, so the guideline checks won't flag it. The problem is still there, though: the whole card now toggles the like.

These checks catch the mechanical mistakes. Also try the app with TalkBack or VoiceOver switched on: every control should be reachable, and what it says should make sense.

## Challenge

> 🎯 **Challenge:** The tip fails three accessibility checks. The like button is a 24×24 `GestureDetector` with no label, and the "Daily tip" heading is pale grey on a light background. Replace the `GestureDetector` with an `IconButton` whose `tooltip` is `'Like'` (it can use `isSelected` and `selectedIcon`), and give the heading a readable color such as `colorScheme.onSurfaceVariant`.

```dart starter
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Center(child: Tip()))));
}

class Tip extends StatefulWidget {
  const Tip({super.key});

  @override
  State<Tip> createState() => _TipState();
}

class _TipState extends State<Tip> {
  bool _liked = false;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      spacing: 16,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Daily tip', style: TextStyle(color: Colors.grey.shade300)),
            const Text('Drink a glass of water.'),
          ],
        ),
        GestureDetector(
          onTap: () => setState(() => _liked = !_liked),
          child: Icon(_liked ? Icons.favorite : Icons.favorite_border, size: 24),
        ),
      ],
    );
  }
}
```

```dart solution
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Center(child: Tip()))));
}

class Tip extends StatefulWidget {
  const Tip({super.key});

  @override
  State<Tip> createState() => _TipState();
}

class _TipState extends State<Tip> {
  bool _liked = false;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      spacing: 16,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Daily tip', style: TextStyle(color: colors.onSurfaceVariant)),
            const Text('Drink a glass of water.'),
          ],
        ),
        IconButton(
          tooltip: 'Like',
          isSelected: _liked,
          icon: const Icon(Icons.favorite_border),
          selectedIcon: const Icon(Icons.favorite),
          onPressed: () => setState(() => _liked = !_liked),
        ),
      ],
    );
  }
}
```

```dart check
    final handle = tester.ensureSemantics();
    await tester.pump();
    await expectLater(tester, meetsGuideline(androidTapTargetGuideline),
        reason: 'the like button should be at least 48×48: use an IconButton');
    await expectLater(tester, meetsGuideline(labeledTapTargetGuideline),
        reason: 'the like button needs a label: give the IconButton a tooltip');
    await expectLater(tester, meetsGuideline(textContrastGuideline),
        reason: '"Daily tip" needs a text color with at least 4.5:1 contrast');
    handle.dispose();

    expect(find.byTooltip('Like'), findsOneWidget,
        reason: 'the like button should have the tooltip "Like"');
    await tester.tap(find.byTooltip('Like'));
    await tester.pump();
    expect(find.byIcon(Icons.favorite), findsOneWidget,
        reason: 'tapping Like should still fill the heart');
```

**Reference:** [Accessibility](https://docs.flutter.dev/ui/accessibility), [UI design and styling](https://docs.flutter.dev/ui/accessibility/ui-design-and-styling), [Assistive technologies](https://docs.flutter.dev/ui/accessibility/assistive-technologies) and [Accessibility testing](https://docs.flutter.dev/ui/accessibility/accessibility-testing) on docs.flutter.dev, and the [`Semantics`](https://api.flutter.dev/flutter/widgets/Semantics-class.html), [`MergeSemantics`](https://api.flutter.dev/flutter/widgets/MergeSemantics-class.html) and [`MediaQuery.textScalerOf`](https://api.flutter.dev/flutter/widgets/MediaQuery/textScalerOf.html) API pages.
