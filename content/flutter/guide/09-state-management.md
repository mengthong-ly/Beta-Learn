---
title: State management
section: Guide Book
summary: Beyond `setState` — `InheritedWidget`, `ChangeNotifier` and `ValueNotifier`, and how to choose an approach that fits the app.
---
`setState` is enough until state needs to be read far from where it lives. Then the question becomes how to share it without threading it through ten constructors.

## `InheritedWidget`

The mechanism underneath `Theme.of`, `MediaQuery.of` and every `*.of(context)` in Flutter.

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: AppRoot())));

class AppConfig extends InheritedWidget {
  const AppConfig({
    required this.appName,
    required this.compact,
    required super.child,
    super.key,
  });

  final String appName;
  final bool compact;

  static AppConfig of(BuildContext context) {
    final config = context.dependOnInheritedWidgetOfExactType<AppConfig>();
    assert(config != null, 'No AppConfig found in the widget tree');
    return config!;
  }

  @override
  bool updateShouldNotify(AppConfig oldWidget) =>
      appName != oldWidget.appName || compact != oldWidget.compact;
}

class AppRoot extends StatefulWidget {
  const AppRoot({super.key});

  @override
  State<AppRoot> createState() => _AppRootState();
}

class _AppRootState extends State<AppRoot> {
  bool _compact = false;

  @override
  Widget build(BuildContext context) {
    return AppConfig(
      appName: 'ThongLearn',
      compact: _compact,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const DeeplyNested(),
          FilledButton(
            onPressed: () => setState(() => _compact = !_compact),
            child: const Text('toggle compact'),
          ),
        ],
      ),
    );
  }
}

class DeeplyNested extends StatelessWidget {
  const DeeplyNested({super.key});

  @override
  Widget build(BuildContext context) {
    // No props were threaded down to get here.
    final config = AppConfig.of(context);

    return Padding(
      padding: EdgeInsets.all(config.compact ? 4 : 24),
      child: Text('${config.appName} — compact: ${config.compact}'),
    );
  }
}
```

> 🔍 **Behind the scenes: `dependOnInheritedWidgetOfExactType` registers a dependency**
>
> It does not merely look the value up — it records that *this element* depends on *that* inherited widget. When the inherited widget is rebuilt and `updateShouldNotify` returns true, Flutter rebuilds exactly the dependent elements, wherever they are in the tree. The lookup itself is O(1): each element keeps a map of inherited widgets by type, inherited from its parent. That is why `Theme.of(context)` is cheap enough to call in every `build`.

`getInheritedWidgetOfExactType` reads without registering a dependency — useful in a callback, where you want the current value but no rebuild.

## `ChangeNotifier`

A model that announces changes. `ListenableBuilder` rebuilds when it does.

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: CartScreen())));

class Cart extends ChangeNotifier {
  final List<String> _items = [];

  List<String> get items => List.unmodifiable(_items);
  int get count => _items.length;

  void add(String item) {
    _items.add(item);
    notifyListeners();          // tells every listener to rebuild
  }

  void clear() {
    _items.clear();
    notifyListeners();
  }
}

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _cart = Cart();

  @override
  void dispose() {
    _cart.dispose();            // a ChangeNotifier must be disposed
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Only this subtree rebuilds when the cart changes.
        ListenableBuilder(
          listenable: _cart,
          builder: (context, child) => Padding(
            padding: const EdgeInsets.all(16),
            child: Text('${_cart.count} items'),
          ),
        ),
        Expanded(
          child: ListenableBuilder(
            listenable: _cart,
            builder: (context, child) => ListView(
              children: [for (final item in _cart.items) ListTile(title: Text(item))],
            ),
          ),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            FilledButton(
              onPressed: () => _cart.add('item ${_cart.count + 1}'),
              child: const Text('add'),
            ),
            TextButton(onPressed: _cart.clear, child: const Text('clear')),
          ],
        ),
      ],
    );
  }
}
```

The buttons are not inside a builder, so they never rebuild. That is the win over `setState`: the rebuild is scoped to what actually displays the data.

## `ValueNotifier`

A `ChangeNotifier` holding one value — the lightest option there is.

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: ValueDemo())));

class ValueDemo extends StatefulWidget {
  const ValueDemo({super.key});

  @override
  State<ValueDemo> createState() => _ValueDemoState();
}

class _ValueDemoState extends State<ValueDemo> {
  final _count = ValueNotifier<int>(0);
  final _name = ValueNotifier<String>('Ada');

  @override
  void dispose() {
    _count.dispose();
    _name.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ValueListenableBuilder<int>(
            valueListenable: _count,
            builder: (context, count, child) => Text(
              'count: $count',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
          ),
          ValueListenableBuilder<String>(
            valueListenable: _name,
            builder: (context, name, child) => Text('name: $name'),
          ),
          // Bumping the count does not rebuild the name, and vice versa.
          FilledButton(
            onPressed: () => _count.value++,
            child: const Text('increment'),
          ),
          TextButton(
            onPressed: () => _name.value = _name.value == 'Ada' ? 'Grace' : 'Ada',
            child: const Text('swap name'),
          ),
        ],
      ),
    );
  }
}
```

> 💡 **Tip:** The `child` parameter in these builders is the escape hatch for an expensive subtree that does *not* depend on the value: pass it as `child:` and the builder receives it unchanged rather than rebuilding it. It is the cheapest optimisation in the whole API and almost nobody uses it.

## Combining them: a scoped model

```dart
import 'package:flutter/material.dart';

void main() => runApp(const MaterialApp(home: Scaffold(body: CounterApp())));

class CounterModel extends ChangeNotifier {
  int _value = 0;
  int get value => _value;

  void increment() {
    _value++;
    notifyListeners();
  }
}

class CounterScope extends InheritedNotifier<CounterModel> {
  const CounterScope({required CounterModel super.notifier, required super.child, super.key});

  static CounterModel of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<CounterScope>();
    assert(scope != null, 'No CounterScope found');
    return scope!.notifier!;
  }
}

class CounterApp extends StatefulWidget {
  const CounterApp({super.key});

  @override
  State<CounterApp> createState() => _CounterAppState();
}

class _CounterAppState extends State<CounterApp> {
  final _model = CounterModel();

  @override
  void dispose() {
    _model.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return CounterScope(
      notifier: _model,
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [_Display(), _IncrementButton()],
        ),
      ),
    );
  }
}

class _Display extends StatelessWidget {
  const _Display();

  @override
  Widget build(BuildContext context) =>
      Text('${CounterScope.of(context).value}',
          style: Theme.of(context).textTheme.displaySmall);
}

class _IncrementButton extends StatelessWidget {
  const _IncrementButton();

  @override
  Widget build(BuildContext context) => FilledButton(
        onPressed: CounterScope.of(context).increment,
        child: const Text('increment'),
      );
}
```

`InheritedNotifier` combines the two: it provides the model *and* rebuilds dependents when it notifies. It is roughly what `provider` gives you, in twenty lines and with no dependency.

## Choosing

| Scope | Reach for |
| --- | --- |
| One widget | `setState` |
| One value, one subtree | `ValueNotifier` + `ValueListenableBuilder` |
| A model with several fields | `ChangeNotifier` + `ListenableBuilder` |
| Shared across the tree | `InheritedWidget` / `InheritedNotifier` |
| Large app, many models | `provider`, `riverpod`, `bloc` |
| Server data | a data library with caching — not a state manager |

> ⚠️ Do not start with a state management package. `setState` and `ValueNotifier` carry a surprising amount of app, and the packages make more sense once you have felt the specific problem each one solves. Adopting `bloc` on day one usually means writing three files per screen to manage a boolean.

**Reference:** [State management](https://docs.flutter.dev/data-and-backend/state-mgmt/options) and [InheritedWidget](https://api.flutter.dev/flutter/widgets/InheritedWidget-class.html) on docs.flutter.dev.
