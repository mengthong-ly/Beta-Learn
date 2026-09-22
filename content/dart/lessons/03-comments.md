---
title: Comments
section: 1 · Basics
---

Dart has three kinds of comments. A single-line comment starts with `//` and runs to the end of the line:

```dart
void main() {
  // TODO: refactor into an AbstractLlamaGreetingFactory?
  print('Welcome to my Llama farm!'); // comments can follow code too
}
```

## Multi-line comments

`/*` starts a comment and `*/` ends it. Unlike many languages, Dart's multi-line comments **nest**, so you can comment out a block that already contains one:

```dart
void main() {
  /*
  print('this is ignored');
  /* even this inner comment is fine */
  print('so is this');
  */
  print('Only this line runs');
}
```

## Documentation comments

A comment that starts with `///` (or `/**`) is a **doc comment**. Tools like your editor and `dart doc` show it as the documentation for whatever comes next. Put a name in square brackets to link to it:

```dart
/// A domesticated South American camelid.
///
/// Don't forget to [feed] your llama.
class Llama {
  String? name;

  /// Feeds your llama [food].
  void feed(String food) {
    print('${name ?? 'The llama'} eats $food');
  }
}

void main() {
  Llama()
    ..name = 'Larry'
    ..feed('hay');
}
```

> 💡 **Tip:** use `//` to explain *why* inside code, and `///` to describe *what* a class, function or field is for. Hover a name in the editor to see its doc comment.

## Challenge

> 🎯 **Challenge:** The debug line is printing noise. Comment it out with `//`, then add a `///` doc comment line directly above `area` that describes what it returns.

```dart starter
double area(double width, double height) => width * height;

void main() {
  print('DEBUG: starting');
  print(area(3, 4));
}
```

```dart solution
/// Returns the area of a [width] by [height] rectangle.
double area(double width, double height) => width * height;

void main() {
  // print('DEBUG: starting');
  print(area(3, 4));
}
```

```dart check
  expect(!output.any((l) => l.contains('DEBUG')), 'The DEBUG line should not print: comment it out with //');
  expect(output.contains('12.0'), 'Keep printing area(3, 4), which is 12.0');
  final lines = File('main.dart').readAsLinesSync();
  final i = lines.indexWhere((l) => l.startsWith('double area'));
  expect(i > 0 && lines[i - 1].trim().startsWith('///'), 'Put a /// doc comment on the line just above area');
```

**Reference:** [Comments](https://dart.dev/language/comments) in the Dart language docs.
