---
title: Navigation
section: 4 · Flutter UI 102
---

In Flutter a screen is called a **route**, and a route is just a widget. The `Navigator` keeps routes on a **stack**: pushing a route shows it on top, popping it goes back to the one underneath.

## Push and pop

`Navigator.push` adds a route to the stack. `MaterialPageRoute` wraps your screen in a platform-appropriate transition and gives its `AppBar` a back button for free. `Navigator.pop` removes the top route.

To pass data **to** the new screen, give it a constructor field, the same way you pass data to any widget:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MaterialApp(home: FruitList()));
}

class FruitList extends StatelessWidget {
  const FruitList({super.key});

  static const fruits = ['Apple', 'Banana', 'Cherry'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fruit')),
      body: ListView(
        children: [
          for (final fruit in fruits)
            ListTile(
              title: Text(fruit),
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute<void>(
                    builder: (context) => FruitPage(fruit: fruit),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}

class FruitPage extends StatelessWidget {
  const FruitPage({super.key, required this.fruit});

  final String fruit;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(fruit)),
      body: Center(
        child: FilledButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Back'),
        ),
      ),
    );
  }
}
```

💡 **Tip:** Skip named routes (`Navigator.pushNamed`). The Flutter docs "don't recommend using named routes for most applications": use `MaterialPageRoute` or `go_router` instead.

## Returning data, Hero and PopScope

`push` returns a `Future` that completes when the new route pops. Pass a value as the second argument to `pop` and it becomes the result. The type argument on `MaterialPageRoute<String>` says what comes back; it's `null` if the user leaves with the system back button.

After an `await`, the widget might be gone, so check `context.mounted` before using `context` again.

Two more tools show up in this example:

- **`Hero`** flies a widget from one route to the next. Wrap it in a `Hero` on both screens with the **same `tag`**, and `push`/`pop` animates it automatically.
- **`PopScope`** controls the back button. With `canPop: false` the route won't pop by itself; `onPopInvokedWithResult(didPop, result)` still fires, so you can ask the user first. (It replaces the deprecated `WillPopScope`, which breaks Android's predictive back.)

```dart
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
  String _answer = 'No answer yet';

  Future<void> _ask() async {
    final answer = await Navigator.push(
      context,
      MaterialPageRoute<String>(builder: (context) => const QuestionPage()),
    );
    if (!mounted) return;
    setState(() => _answer = answer ?? 'You backed out');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          spacing: 16,
          children: [
            const Hero(tag: 'star', child: Icon(Icons.star, size: 48)),
            Text(_answer),
            FilledButton(onPressed: _ask, child: const Text('Ask')),
          ],
        ),
      ),
    );
  }
}

class QuestionPage extends StatelessWidget {
  const QuestionPage({super.key});

  @override
  Widget build(BuildContext context) {
    return PopScope<String>(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return; // a button already popped with an answer
        Navigator.pop(context, 'Maybe'); // back button: answer for them
      },
      child: Scaffold(
        appBar: AppBar(title: const Text('Do you like Flutter?')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Hero(tag: 'star', child: Icon(Icons.star, size: 120)),
              FilledButton(
                onPressed: () => Navigator.pop(context, 'Yes!'),
                child: const Text('Yes'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context, 'No.'),
                child: const Text('No'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

A call to `Navigator.pop` from your own code isn't blocked by `canPop: false`: it only stops *system* back gestures and the app bar's back button. That's why the buttons still work, and why `didPop` tells you which case you're in.

## go_router: routes as URLs

`Navigator.push` is fine for small apps, but it has no idea what a URL is. When the app runs on the web, the address bar doesn't change, and a deep link (someone opening `myapp.com/item/3` from an email) can't land on the right screen. Flutter's architecture guide therefore recommends [`go_router`](https://pub.dev/packages/go_router): it's "the preferred way to write 90% of Flutter applications".

With go_router you describe every screen as a `GoRoute` with a `path`, and nested `routes:` stack on top of their parent. A path segment that starts with `:` is a **path parameter**, read from `state.pathParameters`. Hand the router to `MaterialApp.router(routerConfig: …)` instead of passing a `home:`.

```dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

final router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomeScreen(),
      routes: [
        GoRoute(
          path: 'user/:name', // matches /user/ada, /user/linus, …
          builder: (context, state) =>
              UserScreen(name: state.pathParameters['name']!),
        ),
      ],
    ),
  ],
);

void main() {
  runApp(MaterialApp.router(routerConfig: router));
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: Center(
        child: FilledButton(
          onPressed: () => context.go('/user/ada'),
          child: const Text('Open Ada'),
        ),
      ),
    );
  }
}

class UserScreen extends StatelessWidget {
  const UserScreen({super.key, required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('User $name')),
      body: Center(child: Text('Hello, $name')),
    );
  }
}
```

Two ways to navigate, both extension methods on `BuildContext`:

- **`context.go('/user/ada')`** jumps to that URL and *replaces* the stack with the screens the route config says belong there: Home, then User. The back button works because `user/:name` is nested under `/`.
- **`context.push('/user/ada')`** puts the screen on top of whatever is showing now, like `Navigator.push`, and returns a `Future` for a result. The go_router docs warn that imperative pushing "is known to cause issues with the browser history", so prefer `go` unless you need a result.

💡 **Tip:** `PopScope` still works inside a go_router page. The old `WillPopScope` doesn't: it's incompatible with Router-based APIs.

## Challenge

> 🎯 **Challenge:** The list at `/` has three items, but tapping one does nothing. Add a `GoRoute` for `item/:id` under `/` whose page shows `Item <id>` (for example `Item 2`), and make each tile call `context.push('/item/<id>')`.

```dart starter
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

final router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const ItemList(),
      // TODO: add a child route for item/:id
    ),
  ],
);

void main() {
  runApp(MaterialApp.router(routerConfig: router));
}

class ItemList extends StatelessWidget {
  const ItemList({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Items')),
      body: ListView(
        children: [
          for (final id in [1, 2, 3])
            ListTile(
              title: Text('Tile $id'),
              onTap: () {
                // TODO: push /item/<id>
              },
            ),
        ],
      ),
    );
  }
}

class ItemPage extends StatelessWidget {
  const ItemPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detail')),
      body: Center(child: Text('Item $id')),
    );
  }
}
```

```dart solution
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

final router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const ItemList(),
      routes: [
        GoRoute(
          path: 'item/:id',
          builder: (context, state) => ItemPage(id: state.pathParameters['id']!),
        ),
      ],
    ),
  ],
);

void main() {
  runApp(MaterialApp.router(routerConfig: router));
}

class ItemList extends StatelessWidget {
  const ItemList({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Items')),
      body: ListView(
        children: [
          for (final id in [1, 2, 3])
            ListTile(
              title: Text('Tile $id'),
              onTap: () => context.push('/item/$id'),
            ),
        ],
      ),
    );
  }
}

class ItemPage extends StatelessWidget {
  const ItemPage({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detail')),
      body: Center(child: Text('Item $id')),
    );
  }
}
```

```dart check
    await tester.tap(find.text('Tile 2'));
    await tester.pumpAndSettle();
    expect(find.text('Item 2'), findsOneWidget,
        reason: 'tapping "Tile 2" should push /item/2, whose page shows "Item 2"');
    await tester.pageBack();
    await tester.pumpAndSettle();
    expect(find.text('Tile 2'), findsOneWidget,
        reason: 'the back button should return to the list');
    expect(find.text('Item 2'), findsNothing,
        reason: 'the item page should be gone after going back');
```

**Reference:** [Navigation and routing](https://docs.flutter.dev/ui/navigation), [Stack-based navigation](https://docs.flutter.dev/learn/pathway/tutorial/navigation), the cookbook's [navigation basics](https://docs.flutter.dev/cookbook/navigation/navigation-basics), [passing data](https://docs.flutter.dev/cookbook/navigation/passing-data) and [returning data](https://docs.flutter.dev/cookbook/navigation/returning-data), [Hero animations](https://docs.flutter.dev/ui/animations/hero-animations), the [`PopScope` API](https://api.flutter.dev/flutter/widgets/PopScope-class.html), the architecture [recommendations](https://docs.flutter.dev/app-architecture/recommendations), and [go_router](https://pub.dev/documentation/go_router/latest/) (Configuration and Navigation topics).
