---
title: MVVM architecture
section: 5 · Architecture & quality
---

The Flutter team's architecture guide puts together everything from the last few lessons: `ChangeNotifier` view models, `ListenableBuilder` views, `Result` and fake data. This lesson walks through that setup and wires it up with `provider`, which is what the guide uses.

## Two layers, four roles

The guide's most important principle is **separation of concerns**: UI code and data code live in separate *layers*, and "each layer can only communicate with the layers directly below or above it."

- **View** (UI layer): widgets. No business logic, only simple `if`s on view-model flags, animation, layout by screen size and simple routing. Usually its only inputs are a `key` and its view model.
- **ViewModel** (UI layer): a `ChangeNotifier` that gets data from repositories, turns it into UI state, keeps that state and exposes **commands** the view calls. Views and view models are one-to-one.
- **Repository** (data layer): the **single source of truth** for one kind of data. It's the only class allowed to change that data, and it handles caching, errors and retries. Make it an `abstract class` so tests can swap in a fake.
- **Service** (data layer): a thin, stateless wrapper around one data source, such as a REST endpoint or a platform API. It returns `Future`s or `Stream`s.

Data only moves one way. **State flows down** (service → repository → view model → view) and **events flow up** (tap → command → repository). A view never touches a repository, which is why the view model keeps its repository in a *private* field. Apps with complex logic can add an optional **domain layer** of use-cases between the two, but the guide says to add them only when you need them.

In a real app, the UI is organized by feature and the data by type, since repositories are shared across features:

```
lib/
  ui/
    core/            shared widgets, themes
    todos/
      view_models/todos_view_model.dart
      widgets/todos_screen.dart
  data/
    repositories/todo_repository.dart
    services/todo_api_service.dart
  main.dart
test/
testing/fakes/       fake repositories shared by tests
```

A lesson is one `main.dart`, so the examples below put everything in one file, with a comment for each folder.

## Commands

A view model shouldn't hand the view a bare `Future` to await. The guide's **Command** wraps an action and exposes its state: `running`, `error` and `completed`. It ignores taps while it's still running, and it notifies at the start and at the end, so a `ListenableBuilder` on the command can show a spinner, an error or the content. `Command0` takes no argument and `Command1<T, A>` takes one. The action returns the `Result` you met in the last lesson.

The view model creates its commands in its constructor, and can start one straight away:

```dart-snippet
QuotesViewModel({required this._quoteRepository}) {
  load = Command0(_load)..execute(); // start loading as soon as the screen exists
}
```

## Wiring it up with provider

Something has to create the service, hand it to the repository, and hand the repository to each view model. That's **dependency injection**, and the guide strongly recommends it: "teams at Google recommend using `package:provider`". Put `Provider`s for services and repositories in a `MultiProvider` above the app, then build each view model with `context.read()`:

```dart
import 'dart:collection';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// ---- utils/: Result and Command, as in the guide's Compass sample
sealed class Result<T> {
  const Result();
  const factory Result.ok(T value) = Ok._;
  const factory Result.error(Exception error) = Error._;
}

final class Ok<T> extends Result<T> {
  const Ok._(this.value);
  final T value;
}

final class Error<T> extends Result<T> {
  const Error._(this.error);
  final Exception error;
}

abstract class Command<T> extends ChangeNotifier {
  bool _running = false;
  bool get running => _running;

  Result<T>? _result;
  bool get error => _result is Error;
  bool get completed => _result is Ok;

  Future<void> _execute(Future<Result<T>> Function() action) async {
    if (_running) return; // ignore a second tap while it runs
    _running = true;
    _result = null;
    notifyListeners();
    try {
      _result = await action();
    } finally {
      _running = false;
      notifyListeners();
    }
  }
}

final class Command0<T> extends Command<T> {
  Command0(this._action);
  final Future<Result<T>> Function() _action;
  Future<void> execute() => _execute(_action);
}

// ---- data/services/
class QuoteService {
  Future<List<String>> fetchQuotes() async {
    await Future<void>.delayed(const Duration(milliseconds: 300)); // pretend network
    return ['Keep widgets lean.', 'State flows down, events flow up.'];
  }
}

// ---- data/repositories/
abstract class QuoteRepository {
  Future<Result<List<String>>> getQuotes();
}

class QuoteRepositoryRemote implements QuoteRepository {
  QuoteRepositoryRemote({required this._service});

  final QuoteService _service;

  @override
  Future<Result<List<String>>> getQuotes() async {
    try {
      return Result.ok(await _service.fetchQuotes());
    } on Exception catch (e) {
      return Result.error(e);
    }
  }
}

// ---- ui/quotes/view_models/
class QuotesViewModel extends ChangeNotifier {
  QuotesViewModel({required this._quoteRepository}) {
    load = Command0(_load)..execute();
  }

  final QuoteRepository _quoteRepository;
  late final Command0<void> load;

  List<String> _quotes = [];
  UnmodifiableListView<String> get quotes => UnmodifiableListView(_quotes);

  Future<Result<void>> _load() async {
    final result = await _quoteRepository.getQuotes();
    if (result case Ok(:final value)) _quotes = value;
    notifyListeners();
    return result;
  }
}

// ---- ui/quotes/widgets/
class QuotesScreen extends StatelessWidget {
  const QuotesScreen({super.key, required this.viewModel});

  final QuotesViewModel viewModel;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Quotes')),
      body: ListenableBuilder(
        listenable: viewModel.load,
        builder: (context, child) {
          if (viewModel.load.running) {
            return const Center(child: CircularProgressIndicator());
          }
          if (viewModel.load.error) {
            return Center(
              child: FilledButton(
                onPressed: viewModel.load.execute,
                child: const Text('Try again'),
              ),
            );
          }
          return child!;
        },
        child: ListenableBuilder(
          listenable: viewModel,
          builder: (context, _) => ListView(
            children: [
              for (final quote in viewModel.quotes) ListTile(title: Text(quote)),
            ],
          ),
        ),
      ),
    );
  }
}

// ---- main.dart: dependency injection
void main() {
  runApp(
    MultiProvider(
      providers: [
        Provider(create: (context) => QuoteService()),
        Provider<QuoteRepository>(
          create: (context) => QuoteRepositoryRemote(service: context.read()),
        ),
      ],
      child: const MainApp(),
    ),
  );
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: QuotesScreen(
        viewModel: QuotesViewModel(quoteRepository: context.read()),
      ),
    );
  }
}
```

`context.read()` looks up the nearest provider of the type the parameter expects, here `QuoteService` and then `QuoteRepository`, without subscribing to changes. The provider is typed as the *abstract* `QuoteRepository`, so a test or a staging build can provide a different implementation and nothing else changes. The guide's Compass app builds its view models the same way, inside its `go_router` route builders.

💡 **Tip:** Use `ChangeNotifierProvider` instead of `Provider` when the object itself is a `ChangeNotifier`, for example a repository that notifies when the user logs out. It also disposes the notifier when the provider leaves the tree.

💡 **Tip:** `required this._service` is a private named parameter (Dart 3.12). Callers still write `service:`, but the field stays private, so the view can't reach past the view model into the data layer.

That's the recommended setup. On the guide's recommendations page, separate data and UI layers, the repository pattern, MVVM, no logic in widgets, unidirectional data flow, immutable models, dependency injection, abstract repositories and fakes for testing are all **strongly recommended**. Commands and `go_router` are **recommended**, and a domain layer is **conditional**.

## Challenge

> 🎯 **Challenge:** Adding a todo saves it in the repository, but the view model's list never changes and no view would ever rebuild. Fix `TodoViewModel._add`: save through the repository, keep the todo in `_todos` only when the result is `Ok`, notify listeners, and return the result.

```dart starter
import 'dart:collection';

import 'package:flutter/material.dart';

sealed class Result<T> {
  const Result();
  const factory Result.ok(T value) = Ok._;
  const factory Result.error(Exception error) = Error._;
}

final class Ok<T> extends Result<T> {
  const Ok._(this.value);
  final T value;
}

final class Error<T> extends Result<T> {
  const Error._(this.error);
  final Exception error;
}

abstract class Command<T> extends ChangeNotifier {
  bool _running = false;
  bool get running => _running;

  Result<T>? _result;
  bool get error => _result is Error;
  bool get completed => _result is Ok;

  Future<void> _execute(Future<Result<T>> Function() action) async {
    if (_running) return;
    _running = true;
    _result = null;
    notifyListeners();
    try {
      _result = await action();
    } finally {
      _running = false;
      notifyListeners();
    }
  }
}

final class Command1<T, A> extends Command<T> {
  Command1(this._action);
  final Future<Result<T>> Function(A) _action;
  Future<void> execute(A argument) => _execute(() => _action(argument));
}

abstract class TodoRepository {
  Future<Result<void>> addTodo(String title);
}

class InMemoryTodoRepository implements TodoRepository {
  final List<String> todos = [];

  @override
  Future<Result<void>> addTodo(String title) async {
    if (title.trim().isEmpty) return Result.error(Exception('Empty todo'));
    todos.add(title);
    return const Result.ok(null);
  }
}

class TodoViewModel extends ChangeNotifier {
  TodoViewModel({required this._repository}) {
    add = Command1(_add);
  }

  final TodoRepository _repository;
  late final Command1<void, String> add;

  final List<String> _todos = [];
  UnmodifiableListView<String> get todos => UnmodifiableListView(_todos);

  Future<Result<void>> _add(String title) async {
    return _repository.addTodo(title); // saved, but the view model never updates
  }
}

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Center(child: Text('Todos')))));
}
```

```dart solution
import 'dart:collection';

import 'package:flutter/material.dart';

sealed class Result<T> {
  const Result();
  const factory Result.ok(T value) = Ok._;
  const factory Result.error(Exception error) = Error._;
}

final class Ok<T> extends Result<T> {
  const Ok._(this.value);
  final T value;
}

final class Error<T> extends Result<T> {
  const Error._(this.error);
  final Exception error;
}

abstract class Command<T> extends ChangeNotifier {
  bool _running = false;
  bool get running => _running;

  Result<T>? _result;
  bool get error => _result is Error;
  bool get completed => _result is Ok;

  Future<void> _execute(Future<Result<T>> Function() action) async {
    if (_running) return;
    _running = true;
    _result = null;
    notifyListeners();
    try {
      _result = await action();
    } finally {
      _running = false;
      notifyListeners();
    }
  }
}

final class Command1<T, A> extends Command<T> {
  Command1(this._action);
  final Future<Result<T>> Function(A) _action;
  Future<void> execute(A argument) => _execute(() => _action(argument));
}

abstract class TodoRepository {
  Future<Result<void>> addTodo(String title);
}

class InMemoryTodoRepository implements TodoRepository {
  final List<String> todos = [];

  @override
  Future<Result<void>> addTodo(String title) async {
    if (title.trim().isEmpty) return Result.error(Exception('Empty todo'));
    todos.add(title);
    return const Result.ok(null);
  }
}

class TodoViewModel extends ChangeNotifier {
  TodoViewModel({required this._repository}) {
    add = Command1(_add);
  }

  final TodoRepository _repository;
  late final Command1<void, String> add;

  final List<String> _todos = [];
  UnmodifiableListView<String> get todos => UnmodifiableListView(_todos);

  Future<Result<void>> _add(String title) async {
    final result = await _repository.addTodo(title);
    if (result case Ok()) _todos.add(title);
    notifyListeners();
    return result;
  }
}

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Center(child: Text('Todos')))));
}
```

```dart check
    final repository = app.InMemoryTodoRepository();
    final viewModel = app.TodoViewModel(repository: repository);
    var notified = 0;
    viewModel.addListener(() => notified++);

    await viewModel.add.execute('Write tests');
    expect(repository.todos, ['Write tests'],
        reason: '_add should save the todo through the repository');
    expect(viewModel.todos, ['Write tests'],
        reason: 'after an Ok result, _add should keep the todo in _todos');
    expect(notified, greaterThan(0),
        reason: '_add should call notifyListeners() so the view rebuilds');

    await viewModel.add.execute('   ');
    expect(viewModel.add.error, isTrue,
        reason: '_add should return the repository\'s Error result for an empty todo');
    expect(viewModel.todos, ['Write tests'],
        reason: 'an Error result should leave the list unchanged');
```

**Reference:** [Guide to app architecture](https://docs.flutter.dev/app-architecture/guide), [Common architecture concepts](https://docs.flutter.dev/app-architecture/concepts), [Architecture recommendations](https://docs.flutter.dev/app-architecture/recommendations), the case study's [UI layer](https://docs.flutter.dev/app-architecture/case-study/ui-layer), [Data layer](https://docs.flutter.dev/app-architecture/case-study/data-layer) and [Dependency injection](https://docs.flutter.dev/app-architecture/case-study/dependency-injection) pages, [The Command pattern](https://docs.flutter.dev/app-architecture/design-patterns/command), and the [provider package](https://pub.dev/packages/provider).
