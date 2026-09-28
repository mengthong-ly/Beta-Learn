---
title: Adaptive layouts
section: 4 · Flutter UI 102
---

The same Flutter app runs on a phone, a tablet, a resizable desktop window and a browser tab. Flutter's docs split the job in two: **responsive** design fits the UI *into* the space (a row wraps, a picture shrinks), and **adaptive** design keeps the UI *usable* in that space (a phone gets a bottom bar, a wide window gets a side rail).

## Measure: MediaQuery.sizeOf and LayoutBuilder

There are two questions you can ask, and each has its own tool:

- **How big is the app window?** `MediaQuery.sizeOf(context)` returns its `Size` in logical pixels. Use it for decisions about the whole screen.
- **How much room does *this* widget get?** `LayoutBuilder` calls its `builder` with the `BoxConstraints` its parent passed down. A card in a side panel may get 300 px even in a 1400 px window, so for a reusable widget this is the honest answer.

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: SizePage()));
}

class SizePage extends StatelessWidget {
  const SizePage({super.key});

  @override
  Widget build(BuildContext context) {
    final window = MediaQuery.sizeOf(context);
    return Scaffold(
      body: SafeArea(
        child: Row(
          children: [
            SizedBox(
              width: 200,
              child: Text('Window: ${window.width.round()} × ${window.height.round()}'),
            ),
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final wide = constraints.maxWidth >= 400;
                  return ColoredBox(
                    color: wide ? Colors.teal.shade100 : Colors.orange.shade100,
                    child: Center(
                      child: Text('I get ${constraints.maxWidth.round()} px: '
                          '${wide ? 'wide' : 'narrow'} layout'),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

The two numbers differ: the window is the whole width, but the `LayoutBuilder` only gets what's left after the 200 px column.

Why `sizeOf` and not the older `MediaQuery.of(context).size`? `MediaQuery` carries a lot of data: size, padding, text scaling, brightness and more. `MediaQuery.of` makes your widget rebuild when **any** of it changes (say the keyboard opens and the insets change). `MediaQuery.sizeOf` rebuilds it only when the **size** changes. There's a matching `paddingOf`, `textScalerOf` and so on.

`SafeArea` uses `MediaQuery` too: it pads its child away from notches, rounded corners and the status bar. Wrap the `Scaffold`'s **body** in it, not the whole `Scaffold`, because the `AppBar` already knows how to sit under the status bar.

## Branch: bottom bar or side rail

Material's guidelines use **600** logical pixels as the first breakpoint: under 600 wide, put navigation in a `NavigationBar` at the bottom; at 600 or more, use a `NavigationRail` down the side, where there's room and thumbs don't have to reach.

The two widgets take the same three things: the `destinations`, the `selectedIndex`, and an `onDestinationSelected` callback. A rail sits in a `Row` next to the content:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: RailPage()));
}

class RailPage extends StatefulWidget {
  const RailPage({super.key});

  @override
  State<RailPage> createState() => _RailPageState();
}

class _RailPageState extends State<RailPage> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Row(
          children: [
            NavigationRail(
              selectedIndex: _index,
              onDestinationSelected: (i) => setState(() => _index = i),
              labelType: NavigationRailLabelType.all,
              destinations: const [
                NavigationRailDestination(icon: Icon(Icons.inbox), label: Text('Inbox')),
                NavigationRailDestination(icon: Icon(Icons.star), label: Text('Starred')),
              ],
            ),
            const VerticalDivider(width: 1),
            Expanded(child: Center(child: Text(['Inbox', 'Starred'][_index]))),
          ],
        ),
      ),
    );
  }
}
```

`NavigationBar` goes in the `Scaffold`'s `bottomNavigationBar` slot and uses `NavigationDestination(icon: …, label: 'Inbox')` (the label is a `String` there, a `Text` widget in the rail).

💡 **Tip:** Keep `_index` in the `State` above both widgets. Then resizing the window swaps bar for rail without losing which tab is selected.

## Grids that count their own columns

A `ListView` of cards stretched across a 1400 px window looks odd, and "3 columns on tablets, 1 on phones" breaks in split-screen. Instead, give the grid a **maximum tile width** and let it work out how many columns fit. `GridView.extent` does that with `maxCrossAxisExtent` (same idea as `SliverGridDelegateWithMaxCrossAxisExtent`):

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        body: SafeArea(
          child: GridView.extent(
            maxCrossAxisExtent: 160, // tiles are at most 160 px wide
            padding: const EdgeInsets.all(8),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            children: [
              for (var i = 1; i <= 12; i++)
                Card(child: Center(child: Text('Photo $i'))),
            ],
          ),
        ),
      ),
    ),
  );
}
```

At 400 px wide that's 3 columns; at 1000 px it's 6. No device check in sight.

Two habits from the adaptive **best practices** page:

- **Don't check the device type.** "Phone" or "tablet" doesn't tell you the window size: your app might be in split-screen, a resizable ChromeOS window, or picture-in-picture. Branch on `sizeOf` or `LayoutBuilder` instead.
- **Don't lock the orientation, and don't branch on it.** Locking to portrait can be an accessibility problem, and Android's large-screen quality tiers require both orientations. Orientation doesn't tell you the width either.

## Challenge

> 🎯 **Challenge:** `HomePage` always shows a `NavigationBar`. Make it show the `NavigationBar` when the window is under 600 wide, and a `NavigationRail` (beside the content, with the same destinations) at 600 or wider.

```dart starter
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: HomePage()));
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _index = 0;

  static const _labels = ['Home', 'Search', 'Profile'];
  static const _icons = [Icons.home, Icons.search, Icons.person];

  @override
  Widget build(BuildContext context) {
    final content = Center(child: Text(_labels[_index]));
    return Scaffold(
      body: SafeArea(child: content),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          for (var i = 0; i < 3; i++)
            NavigationDestination(icon: Icon(_icons[i]), label: _labels[i]),
        ],
      ),
    );
  }
}
```

```dart solution
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: HomePage()));
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _index = 0;

  static const _labels = ['Home', 'Search', 'Profile'];
  static const _icons = [Icons.home, Icons.search, Icons.person];

  @override
  Widget build(BuildContext context) {
    final content = Center(child: Text(_labels[_index]));

    if (MediaQuery.sizeOf(context).width >= 600) {
      return Scaffold(
        body: SafeArea(
          child: Row(
            children: [
              NavigationRail(
                selectedIndex: _index,
                onDestinationSelected: (i) => setState(() => _index = i),
                labelType: NavigationRailLabelType.all,
                destinations: [
                  for (var i = 0; i < 3; i++)
                    NavigationRailDestination(
                      icon: Icon(_icons[i]),
                      label: Text(_labels[i]),
                    ),
                ],
              ),
              const VerticalDivider(width: 1),
              Expanded(child: content),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: SafeArea(child: content),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          for (var i = 0; i < 3; i++)
            NavigationDestination(icon: Icon(_icons[i]), label: _labels[i]),
        ],
      ),
    );
  }
}
```

```dart check
    addTearDown(tester.view.reset);
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(400, 800);
    await tester.pumpAndSettle();
    expect(find.byType(NavigationBar), findsOneWidget,
        reason: 'a 400 px wide window should use a NavigationBar');
    expect(find.byType(NavigationRail), findsNothing,
        reason: 'a 400 px wide window should not show a NavigationRail');

    tester.view.physicalSize = const Size(1000, 800);
    await tester.pumpAndSettle();
    expect(find.byType(NavigationRail), findsOneWidget,
        reason: 'a 1000 px wide window should use a NavigationRail');
    expect(find.byType(NavigationBar), findsNothing,
        reason: 'a 1000 px wide window should not also show a NavigationBar');
```

**Reference:** [Adaptive and responsive design](https://docs.flutter.dev/ui/adaptive-responsive), [General approach](https://docs.flutter.dev/ui/adaptive-responsive/general), [Best practices](https://docs.flutter.dev/ui/adaptive-responsive/best-practices), [SafeArea & MediaQuery](https://docs.flutter.dev/ui/adaptive-responsive/safearea-mediaquery), [Large screens](https://docs.flutter.dev/ui/adaptive-responsive/large-screens), [Adaptive layouts](https://docs.flutter.dev/learn/pathway/tutorial/adaptive-layout) in the learning pathway, and the [`MediaQuery`](https://api.flutter.dev/flutter/widgets/MediaQuery-class.html), [`NavigationBar`](https://api.flutter.dev/flutter/material/NavigationBar-class.html) and [`NavigationRail`](https://api.flutter.dev/flutter/material/NavigationRail-class.html) APIs.
