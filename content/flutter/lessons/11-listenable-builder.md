---
title: ListenableBuilder
section: 3 · State in Flutter apps
---

The last lesson wired `addListener` and `removeListener` by hand. `ListenableBuilder` does that wiring for you: give it a `ChangeNotifier` and a `builder`, and it rebuilds that part of the screen every time `notifyListeners()` is called.

## Listen with a builder

`ListenableBuilder` takes a `listenable` (your view model) and a `builder` callback. It registers itself as a listener, calls the builder again on every notification, and removes the listener when it leaves the screen, so there's no `initState` or `dispose` for you to forget. This is the *builder* pattern: a callback instead of a `child`, so you can pick different widgets depending on the state.

Notice also where the view model comes from. The page no longer reads a global: it gets the view model through its **constructor**, and `main` creates it:

```dart
import 'package:flutter/material.dart';

class ArticleModel {
  Future<String> getRandomArticleSummary() async {
    await Future.delayed(const Duration(milliseconds: 500)); // pretend network
    return 'Flutter is an open-source UI toolkit.';
  }
}

class ArticleViewModel extends ChangeNotifier {
  ArticleViewModel(this.model) {
    fetchArticle();
  }

  final ArticleModel model;
  String? summary;
  Exception? error;
  bool isLoading = false;

  Future<void> fetchArticle() async {
    isLoading = true;
    notifyListeners();
    try {
      summary = await model.getRandomArticleSummary();
      error = null;
    } on Exception catch (e) {
      error = e;
      summary = null;
    }
    isLoading = false;
    notifyListeners();
  }
}

void main() {
  runApp(MaterialApp(home: ArticlePage(viewModel: ArticleViewModel(ArticleModel()))));
}

class ArticlePage extends StatelessWidget {
  const ArticlePage({super.key, required this.viewModel});

  final ArticleViewModel viewModel;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wikipedia Flutter')),
      body: Center(
        child: ListenableBuilder(
          listenable: viewModel,
          builder: (context, _) {
            if (viewModel.isLoading) return const CircularProgressIndicator();
            return Text(viewModel.summary ?? 'Error: ${viewModel.error}');
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: viewModel.fetchArticle,
        tooltip: 'Next article',
        child: const Icon(Icons.refresh),
      ),
    );
  }
}
```

`ArticlePage` is now a `StatelessWidget`: it holds no state of its own. Only the builder's subtree (the spinner or the text) rebuilds on a change; the `Scaffold`, `AppBar` and button are built once.

Why the constructor instead of a global? Flutter's architecture guide says a view's only inputs should be a `key` and its view model. A page that receives its view model can be shown with a different one, for example a fake in a test, and nothing else in the app can reach in and change it.

💡 **Tip:** Whoever creates a `ChangeNotifier` owns it and should call its `dispose()` when done. Here it lives as long as the app. If a `State` creates one in a field, dispose it in that `State`'s `dispose()`.

## Build the static part once with `child`

The builder's second parameter is the `child` you pass to `ListenableBuilder`. If part of the builder's output doesn't depend on the view model, build it once outside, pass it as `child`, and place it in the tree from inside the builder. It then isn't rebuilt on every change:

```dart
import 'package:flutter/material.dart';

class CounterViewModel extends ChangeNotifier {
  int count = 0;

  void increment() {
    count++;
    notifyListeners();
  }
}

void main() {
  runApp(MaterialApp(home: CounterPage(viewModel: CounterViewModel())));
}

class CounterPage extends StatelessWidget {
  const CounterPage({super.key, required this.viewModel});

  final CounterViewModel viewModel;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ListenableBuilder(
          listenable: viewModel,
          builder: (context, child) {
            return Column(
              mainAxisSize: MainAxisSize.min,
              spacing: 8,
              children: [
                Text('Count: ${viewModel.count}'),
                child!, // built once, reused on every rebuild
              ],
            );
          },
          child: FilledButton(
            onPressed: viewModel.increment,
            child: const Text('Add one'),
          ),
        ),
      ),
    );
  }
}
```

The button doesn't show the count, so it goes in `child`. The docs call this "entirely optional", but it can help a lot when the static subtree is big. A widget you can mark `const` mostly gets the same benefit for free: `const` lets Flutter short-circuit most of the rebuild work. So `child` matters most for subtrees that can't be `const`, like this button with its `onPressed` callback.

## One value: ValueNotifier

When the state is a single value, you don't need a whole class. A `ValueNotifier<T>` is a `ChangeNotifier` that holds one `value` and notifies whenever you assign a different one. `ValueListenableBuilder` listens to it and hands the current value to its builder as `(context, value, child)`:

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(MaterialApp(home: RecipePage(favorite: ValueNotifier(false))));
}

class RecipePage extends StatelessWidget {
  const RecipePage({super.key, required this.favorite});

  final ValueNotifier<bool> favorite;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pad Thai'),
        actions: [
          ValueListenableBuilder<bool>(
            valueListenable: favorite,
            builder: (context, isFavorite, child) {
              return IconButton(
                icon: Icon(isFavorite ? Icons.favorite : Icons.favorite_border),
                tooltip: isFavorite ? 'Remove from favorites' : 'Add to favorites',
                onPressed: () => favorite.value = !isFavorite,
              );
            },
          ),
        ],
      ),
      body: const Center(child: Text('Ready in 20 minutes')),
    );
  }
}
```

A `ValueNotifier` compares with `==`. Assigning the value it already has does nothing, and **changing the inside of a mutable value doesn't notify at all**: `notifier.value.add(x)` on a `ValueNotifier<List>` is silent. Assign a new list instead, or use a `ChangeNotifier` and call `notifyListeners()` yourself. The docs say `ValueNotifier` is best used with immutable data.

## Challenge

> 🎯 **Challenge:** Tapping **+** increments the view model, but the text is stuck at `Count: 0` because `build` reads the count only once. Wrap the text in a `ListenableBuilder` so it rebuilds whenever the view model passed to `CounterPage` changes.

```dart starter
import 'package:flutter/material.dart';

class CounterViewModel extends ChangeNotifier {
  int count = 0;

  void increment() {
    count++;
    notifyListeners();
  }
}

void main() {
  runApp(MaterialApp(home: CounterPage(viewModel: CounterViewModel())));
}

class CounterPage extends StatelessWidget {
  const CounterPage({super.key, required this.viewModel});

  final CounterViewModel viewModel;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Counter')),
      body: Center(child: Text('Count: ${viewModel.count}')),
      floatingActionButton: FloatingActionButton(
        onPressed: viewModel.increment,
        child: const Icon(Icons.add),
      ),
    );
  }
}
```

```dart solution
import 'package:flutter/material.dart';

class CounterViewModel extends ChangeNotifier {
  int count = 0;

  void increment() {
    count++;
    notifyListeners();
  }
}

void main() {
  runApp(MaterialApp(home: CounterPage(viewModel: CounterViewModel())));
}

class CounterPage extends StatelessWidget {
  const CounterPage({super.key, required this.viewModel});

  final CounterViewModel viewModel;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Counter')),
      body: Center(
        child: ListenableBuilder(
          listenable: viewModel,
          builder: (context, _) => Text('Count: ${viewModel.count}'),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: viewModel.increment,
        child: const Icon(Icons.add),
      ),
    );
  }
}
```

```dart check
    expect(find.text('Count: 0'), findsOneWidget, reason: 'The page should start at Count: 0');
    await tester.tap(find.byType(FloatingActionButton));
    await tester.pump();
    expect(find.text('Count: 1'), findsOneWidget, reason: 'Tapping + should rebuild the text. Wrap it in a ListenableBuilder that listens to viewModel');
    final viewModel = app.CounterViewModel();
    await tester.pumpWidget(MaterialApp(home: app.CounterPage(viewModel: viewModel)));
    viewModel.increment();
    viewModel.increment();
    await tester.pump();
    expect(find.text('Count: 2'), findsOneWidget, reason: 'CounterPage should listen to the view model passed to its constructor');
```

**Reference:** [Rebuild UI when state changes](https://docs.flutter.dev/learn/pathway/tutorial/listenable-builder) in the Flutter learning pathway, the [UI layer case study](https://docs.flutter.dev/app-architecture/case-study/ui-layer), [Performance best practices](https://docs.flutter.dev/perf/best-practices), and the [`ListenableBuilder`](https://api.flutter.dev/flutter/widgets/ListenableBuilder-class.html), [`ValueListenableBuilder`](https://api.flutter.dev/flutter/widgets/ValueListenableBuilder-class.html) and [`ValueNotifier`](https://api.flutter.dev/flutter/foundation/ValueNotifier-class.html) APIs.
