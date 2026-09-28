---
title: Testing
section: 5 · Architecture & quality
---

Tests let you change code without being afraid of breaking it. The architecture from the last lesson pays off here: a view model with an abstract repository can be tested with a fake repository, with no network and no waiting.

## Unit tests with a fake

Flutter has three kinds of automated tests. A **unit test** checks one function or class, a **widget test** builds one widget in a test environment and taps it, and an **integration test** runs the whole app on a device or emulator. The testing overview recommends "many unit and widget tests … plus enough integration tests to cover all the important use cases", because unit and widget tests are quick to run and cheap to keep up.

Tests live in the `test/` folder, and each file name must end in `_test.dart`. The `flutter_test` package ships with the SDK and is already a dev dependency in every new project. Run the tests with `flutter test`.

```
lib/
  main.dart
test/
  score_view_model_test.dart
  score_page_test.dart
```

Here's the app under test. The view model saves every new score through a `ScoreRepository`, and the real repository takes a second:

```dart
import 'package:flutter/material.dart';

abstract class ScoreRepository {
  Future<void> save(int score);
}

class SlowScoreRepository implements ScoreRepository {
  @override
  Future<void> save(int score) =>
      Future<void>.delayed(const Duration(seconds: 1)); // pretend network
}

class ScoreViewModel extends ChangeNotifier {
  ScoreViewModel({required this._repository});

  final ScoreRepository _repository;
  int _score = 0;
  bool _saving = false;
  int get score => _score;
  bool get saving => _saving;

  Future<void> add(int points) async {
    _score += points;
    _saving = true;
    notifyListeners();
    await _repository.save(_score);
    _saving = false;
    notifyListeners();
  }
}

class ScorePage extends StatelessWidget {
  const ScorePage({super.key, required this.viewModel});

  final ScoreViewModel viewModel;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Score')),
      body: ListenableBuilder(
        listenable: viewModel,
        builder: (context, _) => Column(
          children: [
            TextField(
              decoration: const InputDecoration(labelText: 'Points'),
              onSubmitted: (text) => viewModel.add(int.tryParse(text) ?? 0),
            ),
            Text('Score: ${viewModel.score}'),
            if (viewModel.saving) const Text('Saving…'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        tooltip: 'Add 1',
        onPressed: () => viewModel.add(1),
        child: const Icon(Icons.add),
      ),
    );
  }
}

void main() {
  runApp(
    MaterialApp(
      home: ScorePage(viewModel: ScoreViewModel(repository: SlowScoreRepository())),
    ),
  );
}
```

A unit test for the view model needs only a fake repository: a small class that `implements` the real interface and records what happened. The architecture guide strongly recommends fakes, and says "view and view model tests only require mocking repositories if your architecture is sound." `group` bundles related tests, and `expect(actual, matcher)` fails the test when they don't match:

```dart-snippet
// test/score_view_model_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/main.dart';

class FakeScoreRepository implements ScoreRepository {
  final saved = <int>[];

  @override
  Future<void> save(int score) async => saved.add(score);
}

void main() {
  group('ScoreViewModel', () {
    test('starts at zero', () {
      expect(ScoreViewModel(repository: FakeScoreRepository()).score, 0);
    });

    test('add raises the score and saves it', () async {
      final repository = FakeScoreRepository();
      final viewModel = ScoreViewModel(repository: repository);
      await viewModel.add(3);
      expect(viewModel.score, 3);
      expect(repository.saved, [3]);
      expect(viewModel.saving, isFalse);
    });
  });
}
```

The fake answers at once, so the test never waits a second and never touches a network.

## Widget tests

`testWidgets` gives you a `WidgetTester`. `tester.pumpWidget` builds a widget, a **finder** locates widgets in the tree, and a **matcher** says how many it should find:

- Finders: `find.text('Score: 0')`, `find.byType(TextField)`, `find.byKey(const Key('total'))`, `find.byIcon(Icons.add)`, `find.byTooltip('Add 1')`.
- Matchers: `findsOneWidget`, `findsNothing`, `findsWidgets` (one or more), `findsNWidgets(3)`.
- Actions: `tester.tap(finder)`, `tester.enterText(finder, '5')`, `tester.drag(finder, offset)`.

The test environment doesn't rebuild on its own after a tap, so call `tester.pump()` to draw the next frame:

```dart-snippet
// test/score_page_test.dart
testWidgets('tapping + adds a point', (tester) async {
  final repository = FakeScoreRepository();
  await tester.pumpWidget(
    MaterialApp(home: ScorePage(viewModel: ScoreViewModel(repository: repository))),
  );
  expect(find.text('Score: 0'), findsOneWidget);

  await tester.tap(find.byIcon(Icons.add));
  await tester.pump(); // rebuild once
  expect(find.text('Score: 1'), findsOneWidget);
  expect(repository.saved, [1]);
});

testWidgets('typing points adds them', (tester) async {
  await tester.pumpWidget(
    MaterialApp(home: ScorePage(viewModel: ScoreViewModel(repository: FakeScoreRepository()))),
  );
  await tester.enterText(find.byType(TextField), '5');
  await tester.testTextInput.receiveAction(TextInputAction.done); // press Enter
  await tester.pump();
  expect(find.text('Score: 5'), findsOneWidget);
});
```

The widget tests reuse the same fake as the unit tests. That's the guide's point: once the view model tests have fakes, the view tests come almost for free.

## pump, pumpAndSettle and timers

Time in a widget test is fake. It only moves when you pump:

- `pump()` draws one frame, which is enough after a tap that calls `setState` or `notifyListeners`.
- `pump(const Duration(seconds: 1))` moves the clock forward one second first, so pending `Future.delayed` timers fire.
- `pumpAndSettle()` keeps pumping until no more frames are scheduled. Use it after an animation: a page transition, a `drag`, a dialog opening. It stops as soon as the screen is still, so it doesn't wait for a timer that has no animation running. And it times out if something animates forever, like a `CircularProgressIndicator` that never goes away.

Here the real, slow repository is fine, because the test moves the clock itself:

```dart-snippet
testWidgets('shows Saving… until the save ends', (tester) async {
  await tester.pumpWidget(
    MaterialApp(home: ScorePage(viewModel: ScoreViewModel(repository: SlowScoreRepository()))),
  );
  await tester.tap(find.byTooltip('Add 1'));
  await tester.pump();
  expect(find.text('Saving…'), findsOneWidget);

  await tester.pump(const Duration(seconds: 1)); // the save finishes
  expect(find.text('Saving…'), findsNothing);
});
```

💡 **Tip:** Leave out that last `pump(Duration)` and the test fails with "A Timer is still pending even after the widget tree was disposed". Flutter won't let a test end with work still scheduled.

## Every Check button is a widget test

The **Check** button in this course runs exactly this kind of test. Your code is imported as `app`, and the lesson's check block is pasted in as the body:

```dart-snippet
testWidgets('lesson check', (tester) async {
  app.main();
  await tester.pumpAndSettle();
  // the lesson's check goes here, for example:
  expect(find.text('Score: 0'), findsOneWidget);
});
```

Checks that need a fake do what you did above: they call `tester.pumpWidget` again with the fake injected. That only works when the widget *takes* its dependencies, which is the challenge below.

## Challenge

> 🎯 **Challenge:** `WeatherPage` creates its own `RemoteWeatherRepository`, so a test can't swap in a fake and has to wait two seconds. Make it testable: give `WeatherPage` a required `repository` parameter of type `WeatherRepository`, use it in `initState`, and pass a `RemoteWeatherRepository()` from `main`.

```dart starter
import 'package:flutter/material.dart';

abstract class WeatherRepository {
  Future<String> getForecast();
}

class RemoteWeatherRepository implements WeatherRepository {
  @override
  Future<String> getForecast() async {
    await Future<void>.delayed(const Duration(seconds: 2)); // pretend network
    return 'Rainy';
  }
}

class FakeWeatherRepository implements WeatherRepository {
  @override
  Future<String> getForecast() async => 'Sunny';
}

class WeatherPage extends StatefulWidget {
  const WeatherPage({super.key});

  @override
  State<WeatherPage> createState() => _WeatherPageState();
}

class _WeatherPageState extends State<WeatherPage> {
  final _repository = RemoteWeatherRepository(); // hardwired
  late final Future<String> _forecast;

  @override
  void initState() {
    super.initState();
    _forecast = _repository.getForecast();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Weather')),
      body: Center(
        child: FutureBuilder(
          future: _forecast,
          builder: (context, snapshot) => snapshot.hasData
              ? Text(snapshot.data!)
              : const CircularProgressIndicator(),
        ),
      ),
    );
  }
}

void main() {
  runApp(const MaterialApp(home: WeatherPage()));
}
```

```dart solution
import 'package:flutter/material.dart';

abstract class WeatherRepository {
  Future<String> getForecast();
}

class RemoteWeatherRepository implements WeatherRepository {
  @override
  Future<String> getForecast() async {
    await Future<void>.delayed(const Duration(seconds: 2)); // pretend network
    return 'Rainy';
  }
}

class FakeWeatherRepository implements WeatherRepository {
  @override
  Future<String> getForecast() async => 'Sunny';
}

class WeatherPage extends StatefulWidget {
  const WeatherPage({super.key, required this.repository});

  final WeatherRepository repository;

  @override
  State<WeatherPage> createState() => _WeatherPageState();
}

class _WeatherPageState extends State<WeatherPage> {
  late final Future<String> _forecast;

  @override
  void initState() {
    super.initState();
    _forecast = widget.repository.getForecast();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Weather')),
      body: Center(
        child: FutureBuilder(
          future: _forecast,
          builder: (context, snapshot) => snapshot.hasData
              ? Text(snapshot.data!)
              : const CircularProgressIndicator(),
        ),
      ),
    );
  }
}

void main() {
  runApp(MaterialApp(home: WeatherPage(repository: RemoteWeatherRepository())));
}
```

```dart check
    expect(find.text('Rainy'), findsOneWidget,
        reason: 'main() should still show the real forecast from RemoteWeatherRepository');

    await tester.pumpWidget(const SizedBox()); // start from an empty screen
    await tester.pumpWidget(
      MaterialApp(home: app.WeatherPage(repository: app.FakeWeatherRepository())),
    );
    await tester.pump();
    expect(find.text('Sunny'), findsOneWidget,
        reason: 'WeatherPage should load the forecast from the repository it is given');
    expect(find.text('Rainy'), findsNothing,
        reason: 'WeatherPage should not create its own RemoteWeatherRepository');
```

**Reference:** [Testing Flutter apps](https://docs.flutter.dev/testing/overview), [An introduction to unit testing](https://docs.flutter.dev/cookbook/testing/unit/introduction), [An introduction to widget testing](https://docs.flutter.dev/cookbook/testing/widget/introduction), [Find widgets](https://docs.flutter.dev/cookbook/testing/widget/finders), [Tap, drag, and enter text](https://docs.flutter.dev/cookbook/testing/widget/tap-drag), and [Testing each layer](https://docs.flutter.dev/app-architecture/case-study/testing) in the architecture case study.
