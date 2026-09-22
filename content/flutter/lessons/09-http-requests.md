---
title: Fetching data
section: 3 · State in Flutter apps
---

Real apps load data from a server. The official tutorial builds a Wikipedia reader that fetches a random article summary. Talking to a server takes time, so the fetch returns a `Future`: a value that arrives later.

ThongLearn's examples don't touch the network, so here a small `fakeGet` function stands in for the server. In your own app you'd add the `http` package and make the real request:

```dart-snippet
final uri = Uri.https('en.wikipedia.org', '/api/rest_v1/page/random/summary');
final response = await get(uri); // get() comes from package:http
```

`Uri.https` builds the URL for you and handles the encoding, which is safer than gluing strings together.

## A model that fetches

In the tutorial's MVVM structure, the **model** is the layer that talks to the outside world. Mark the method `async`, and `await` pauses it until the `Future` completes. Check the status code (200 means success), throw if it failed, then decode the JSON:

```dart
import 'dart:convert';

import 'package:flutter/material.dart';

// Stands in for package:http, so the example runs without a network.
Future<({int statusCode, String body})> fakeGet(Uri uri) async {
  await Future.delayed(const Duration(milliseconds: 500));
  return (statusCode: 200, body: '{"title": "Flutter", "extract": "An open-source UI toolkit."}');
}

class Summary {
  Summary({required this.title, required this.extract});

  final String title;
  final String extract;

  factory Summary.fromJson(Map<String, Object?> json) {
    return switch (json) {
      {'title': String title, 'extract': String extract} =>
        Summary(title: title, extract: extract),
      _ => throw const FormatException('Could not read the summary'),
    };
  }
}

class ArticleModel {
  Future<Summary> getRandomArticleSummary() async {
    final uri = Uri.https('en.wikipedia.org', '/api/rest_v1/page/random/summary');
    final response = await fakeGet(uri);
    if (response.statusCode != 200) {
      throw Exception('Failed to load the article');
    }
    return Summary.fromJson(jsonDecode(response.body) as Map<String, Object?>);
  }
}

void main() {
  runApp(const MaterialApp(home: ArticlePage()));
}

class ArticlePage extends StatefulWidget {
  const ArticlePage({super.key});

  @override
  State<ArticlePage> createState() => _ArticlePageState();
}

class _ArticlePageState extends State<ArticlePage> {
  late Future<Summary> _summary;

  @override
  void initState() {
    super.initState();
    _summary = ArticleModel().getRandomArticleSummary();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wikipedia Flutter')),
      body: Center(
        child: FutureBuilder<Summary>(
          future: _summary,
          builder: (context, snapshot) {
            if (snapshot.hasData) {
              return ListTile(
                title: Text(snapshot.data!.title),
                subtitle: Text(snapshot.data!.extract),
              );
            } else if (snapshot.hasError) {
              return Text('${snapshot.error}');
            }
            return const CircularProgressIndicator();
          },
        ),
      ),
    );
  }
}
```

`jsonDecode` (from `dart:convert`) turns the JSON text into a `Map`, and `Summary.fromJson` uses a `switch` pattern to pull out typed fields, throwing if the shape is wrong.

## FutureBuilder

`FutureBuilder` takes a `future` and a `builder`, and rebuilds as the future moves along. `snapshot.hasData` is `true` once a value arrived, `snapshot.hasError` once it threw; before that, show a spinner.

> ⚠️ **Gotcha:** start the fetch in `initState`, not in `build`. Flutter calls `build` every time anything in the view changes, and that happens surprisingly often. A fetch inside `build` would run again on every rebuild.

Throw an exception when the request fails, even for a "404 Not Found", instead of returning `null`. That's what sets `snapshot.hasError`, so the UI can tell the user.

## Challenge

> 🎯 **Challenge:** The fake server answers `404`, so the model throws, but the page shows `Loading...` forever. Add a `snapshot.hasError` branch that shows the error with `Text('${snapshot.error}')`.

```dart starter
import 'package:flutter/material.dart';

Future<({int statusCode, String body})> fakeGet(Uri uri) async {
  await Future.delayed(const Duration(milliseconds: 500));
  return (statusCode: 404, body: '');
}

class ArticleModel {
  Future<String> getTitle() async {
    final response = await fakeGet(Uri.https('example.com', '/article'));
    if (response.statusCode != 200) {
      throw Exception('Article not found');
    }
    return response.body;
  }
}

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Center(child: TitleView()))));
}

class TitleView extends StatefulWidget {
  const TitleView({super.key});

  @override
  State<TitleView> createState() => _TitleViewState();
}

class _TitleViewState extends State<TitleView> {
  late Future<String> _title;

  @override
  void initState() {
    super.initState();
    _title = ArticleModel().getTitle();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String>(
      future: _title,
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          return Text(snapshot.data!);
        }
        return const Text('Loading...');
      },
    );
  }
}
```

```dart solution
import 'package:flutter/material.dart';

Future<({int statusCode, String body})> fakeGet(Uri uri) async {
  await Future.delayed(const Duration(milliseconds: 500));
  return (statusCode: 404, body: '');
}

class ArticleModel {
  Future<String> getTitle() async {
    final response = await fakeGet(Uri.https('example.com', '/article'));
    if (response.statusCode != 200) {
      throw Exception('Article not found');
    }
    return response.body;
  }
}

void main() {
  runApp(const MaterialApp(home: Scaffold(body: Center(child: TitleView()))));
}

class TitleView extends StatefulWidget {
  const TitleView({super.key});

  @override
  State<TitleView> createState() => _TitleViewState();
}

class _TitleViewState extends State<TitleView> {
  late Future<String> _title;

  @override
  void initState() {
    super.initState();
    _title = ArticleModel().getTitle();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String>(
      future: _title,
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          return Text(snapshot.data!);
        } else if (snapshot.hasError) {
          return Text('${snapshot.error}');
        }
        return const Text('Loading...');
      },
    );
  }
}
```

```dart check
    await tester.pump(const Duration(seconds: 1));
    await tester.pump();
    expect(find.text('Loading...'), findsNothing, reason: 'After the request fails, stop showing Loading...');
    expect(find.textContaining('Article not found'), findsOneWidget,
        reason: 'Show the error message');
```

**Reference:** [Make HTTP requests](https://docs.flutter.dev/learn/pathway/tutorial/http-requests) in the Flutter learning pathway, and [Fetch data from the internet](https://docs.flutter.dev/cookbook/networking/fetch-data).
