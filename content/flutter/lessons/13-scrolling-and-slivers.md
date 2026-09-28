---
title: Scrolling and slivers
section: 4 · Flutter UI 102
---

A `ListView` scrolls one list. Real screens often scroll several things together: an app bar that shrinks, a header, a grid, then a list. Flutter builds those out of **slivers**, pieces of one scrollable area that each lay out their own part.

## Small content: SingleChildScrollView

When a page is *usually* short but might not fit (a settings page, a form, a small screen with big text), wrap it in a `SingleChildScrollView`. It builds its whole child at once and lets it scroll:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(
    MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('Terms')),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: 16,
            children: [
              for (var i = 1; i <= 12; i++)
                Text('$i. Please read this section carefully before you continue.'),
            ],
          ),
        ),
      ),
    ),
  );
}
```

Because it builds everything, it's the wrong tool for long lists. The API docs say a `ListView` is "vastly more efficient" than a `SingleChildScrollView` holding a `Column` with many children, since the list builds only what's on screen.

## CustomScrollView and slivers

A `CustomScrollView` takes a list of `slivers` instead of `children`. Each sliver contributes a portion of the scrollable content, and they all scroll as one. Slivers can only go in a scroll view like this, and a scroll view's `slivers` list only accepts slivers, not ordinary widgets.

`SliverAppBar` is an app bar that lives *inside* the scroll. `SliverList.builder` is the sliver version of `ListView.builder`, just as lazy. To put an ordinary widget between them, wrap it in `SliverToBoxAdapter`:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: InboxPage()));
}

class InboxPage extends StatelessWidget {
  const InboxPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          const SliverAppBar(
            pinned: true,
            expandedHeight: 160,
            flexibleSpace: FlexibleSpaceBar(title: Text('Inbox')),
          ),
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('You have 50 messages'),
            ),
          ),
          SliverList.builder(
            itemCount: 50,
            itemBuilder: (context, index) => ListTile(
              leading: const Icon(Icons.mail_outline),
              title: Text('Message ${index + 1}'),
            ),
          ),
        ],
      ),
    );
  }
}
```

Scroll it: the app bar starts 160 pixels tall and shrinks to a normal toolbar. Two flags decide what happens next:

- `pinned: true` keeps the app bar visible at the top once it has shrunk.
- `floating: true` brings it back as soon as the user scrolls *up* a little, without going all the way to the top. Add `snap: true` to make a floating bar snap fully into view.

💡 **Tip:** Don't put a `ListView` in a `SliverToBoxAdapter`. The adapter holds one box, so the whole list gets built at once and nothing is lazy anymore. Use `SliverList.builder` instead.

## Grids and filling the rest

`SliverGrid.builder` is the lazy grid. Its `gridDelegate` decides the columns. `SliverGridDelegateWithMaxCrossAxisExtent` says "tiles at most this wide", so a narrow phone gets a few columns and a wide window gets more, without you hard-coding the count. `SliverPadding` adds padding around a sliver, since a plain `Padding` can't wrap one.

`SliverFillRemaining` holds one ordinary widget and stretches it over whatever space is left in the viewport. With `hasScrollBody: false` it's good for a footer or an empty state:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: PhotosPage()));
}

class PhotosPage extends StatelessWidget {
  const PhotosPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          const SliverAppBar(title: Text('Photos'), floating: true),
          SliverPadding(
            padding: const EdgeInsets.all(8),
            sliver: SliverGrid.builder(
              gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                maxCrossAxisExtent: 150,
                mainAxisSpacing: 8,
                crossAxisSpacing: 8,
              ),
              itemCount: 6,
              itemBuilder: (context, index) => Card(
                child: Center(child: Text('Photo ${index + 1}')),
              ),
            ),
          ),
          const SliverFillRemaining(
            hasScrollBody: false,
            child: Center(child: Text("That's all your photos")),
          ),
        ],
      ),
    );
  }
}
```

The app bar, the grid and the footer scroll as one surface. Nesting a `GridView` inside a `ListView` would give you two scroll views to coordinate; slivers keep it to one.

## Challenge

> 🎯 **Challenge:** Rebuild `ListPage` as a `CustomScrollView`. It should have a **pinned** `SliverAppBar` titled `My list`, followed by a `SliverList.builder` of 100 rows reading `Item 0` to `Item 99`.

```dart starter
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: ListPage()));
}

class ListPage extends StatelessWidget {
  const ListPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My list')),
      body: ListView.builder(
        itemCount: 100,
        itemBuilder: (context, index) => ListTile(title: Text('Item $index')),
      ),
    );
  }
}
```

```dart solution
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: ListPage()));
}

class ListPage extends StatelessWidget {
  const ListPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          const SliverAppBar(title: Text('My list'), pinned: true),
          SliverList.builder(
            itemCount: 100,
            itemBuilder: (context, index) => ListTile(title: Text('Item $index')),
          ),
        ],
      ),
    );
  }
}
```

```dart check
    expect(find.byType(CustomScrollView), findsOneWidget, reason: 'The page should be a CustomScrollView');
    expect(find.byType(SliverAppBar), findsOneWidget, reason: 'Put a SliverAppBar at the top of the slivers');
    expect(tester.widget<SliverAppBar>(find.byType(SliverAppBar)).pinned, isTrue, reason: 'The SliverAppBar should be pinned: true');
    expect(find.text('Item 50'), findsNothing, reason: 'Item 50 should not be built until you scroll to it (use SliverList.builder)');
    await tester.scrollUntilVisible(find.text('Item 50'), 500, scrollable: find.byType(Scrollable).first);
    expect(find.text('Item 50'), findsOneWidget, reason: 'Scrolling down should reach Item 50');
    expect(find.text('Item 99'), findsNothing, reason: 'The list should build rows lazily, not all 100 at once');
    expect(find.text('My list'), findsOneWidget, reason: 'A pinned app bar should still show My list after scrolling');
```

**Reference:** [Slivers](https://docs.flutter.dev/learn/pathway/tutorial/slivers) in the Flutter learning pathway, [Using slivers to achieve fancy scrolling](https://docs.flutter.dev/ui/layout/scrolling/slivers), [Handle scrolling in a widget test](https://docs.flutter.dev/cookbook/testing/widget/scrolling), and the [`SingleChildScrollView`](https://api.flutter.dev/flutter/widgets/SingleChildScrollView-class.html), [`CustomScrollView`](https://api.flutter.dev/flutter/widgets/CustomScrollView-class.html), [`SliverAppBar`](https://api.flutter.dev/flutter/material/SliverAppBar-class.html), [`SliverGrid`](https://api.flutter.dev/flutter/widgets/SliverGrid-class.html) and [`SliverFillRemaining`](https://api.flutter.dev/flutter/widgets/SliverFillRemaining-class.html) APIs.
