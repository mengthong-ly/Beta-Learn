---
title: ChangeNotifier
section: 3 · State in Flutter apps
---

So far the state lived inside `State` objects. That works for one widget, but app data (the loaded article, the cart, the logged-in user) is easier to test and reuse when it lives in a plain class **outside** the widgets. That's the core idea of MVVM: *separation of concerns*.

In MVVM, the **view model** sits between the UI and the model. It holds the state, and when the state changes it tells the UI. Flutter's tool for "telling" is `ChangeNotifier`.

## notifyListeners

Extend `ChangeNotifier` and you get `notifyListeners()`, which calls every registered listener. Anyone interested registers a callback with `addListener`:

```dart
import 'package:flutter/material.dart';

class CounterViewModel extends ChangeNotifier {
  int count = 0;

  void increment() {
    count++;
    notifyListeners();
  }
}

final counter = CounterViewModel();

void main() {
  runApp(const MaterialApp(home: CounterPage()));
}

class CounterPage extends StatefulWidget {
  const CounterPage({super.key});

  @override
  State<CounterPage> createState() => _CounterPageState();
}

class _CounterPageState extends State<CounterPage> {
  void _changed() => setState(() {});

  @override
  void initState() {
    super.initState();
    counter.addListener(_changed);
  }

  @override
  void dispose() {
    counter.removeListener(_changed);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(child: Text('Count: ${counter.count}')),
      floatingActionButton: FloatingActionButton(
        onPressed: counter.increment,
        child: const Icon(Icons.add),
      ),
    );
  }
}
```

The button never calls `setState` itself. It asks the view model to change, the view model notifies, and the page's listener rebuilds it. Wiring listeners by hand like this works, but it's easy to forget `removeListener`. The next lesson shows the widget that does it for you.

## A view model for loading data

The tutorial's `ArticleViewModel` tracks three pieces of state: the `summary`, an `error`, and an `isLoading` flag. It calls `notifyListeners()` twice: once after setting `isLoading = true`, so the UI can show a spinner, and once when the work is done.

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
      error = null; // clear any previous error
    } on Exception catch (e) {
      error = e;
      summary = null;
    }
    isLoading = false;
    notifyListeners();
  }
}

final viewModel = ArticleViewModel(ArticleModel());

void main() {
  runApp(const MaterialApp(home: ArticlePage()));
}

class ArticlePage extends StatefulWidget {
  const ArticlePage({super.key});

  @override
  State<ArticlePage> createState() => _ArticlePageState();
}

class _ArticlePageState extends State<ArticlePage> {
  void _changed() => setState(() {});

  @override
  void initState() {
    super.initState();
    viewModel.addListener(_changed);
  }

  @override
  void dispose() {
    viewModel.removeListener(_changed);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: viewModel.isLoading
            ? const CircularProgressIndicator()
            : Text(viewModel.summary ?? 'Error: ${viewModel.error}'),
      ),
    );
  }
}
```

Constructors can't be `async`, so the constructor just *starts* `fetchArticle()` and lets it run. The `try`/`catch` stores the error for the UI to show, and each branch clears the other field so the state is never half old, half new.

## Challenge

> 🎯 **Challenge:** `TodoViewModel.add` changes the list but nobody hears about it. Make `add` and `clear` notify their listeners.

```dart starter
import 'package:flutter/material.dart';

class TodoViewModel extends ChangeNotifier {
  final List<String> todos = [];

  void add(String todo) {
    todos.add(todo);
  }

  void clear() {
    todos.clear();
  }
}

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Text('Todos'))));
}
```

```dart solution
import 'package:flutter/material.dart';

class TodoViewModel extends ChangeNotifier {
  final List<String> todos = [];

  void add(String todo) {
    todos.add(todo);
    notifyListeners();
  }

  void clear() {
    todos.clear();
    notifyListeners();
  }
}

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Text('Todos'))));
}
```

```dart check
    final todos = app.TodoViewModel();
    var calls = 0;
    todos.addListener(() => calls++);
    todos.add('Buy milk');
    expect(todos.todos, ['Buy milk']);
    expect(calls, 1, reason: 'add() should call notifyListeners() once');
    todos.clear();
    expect(todos.todos, isEmpty);
    expect(calls, 2, reason: 'clear() should call notifyListeners() once');
```

**Reference:** [Use ChangeNotifier to update app state](https://docs.flutter.dev/learn/pathway/tutorial/change-notifier) in the Flutter learning pathway, and the [`ChangeNotifier` API](https://api.flutter.dev/flutter/foundation/ChangeNotifier-class.html).
