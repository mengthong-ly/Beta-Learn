---
title: Loops
section: 4 · Control flow
---

The classic `for` loop has three parts: start, condition, step.

```dart
void main() {
  var message = StringBuffer('Dart is fun');
  for (var i = 0; i < 5; i++) {
    message.write('!');
  }
  print(message);
}
```

Closures created inside a `for` loop capture the value of `i` **for that iteration**. That avoids a classic JavaScript trap where every callback sees the final value:

```dart
void main() {
  var callbacks = <void Function()>[];
  for (var i = 0; i < 2; i++) {
    callbacks.add(() => print(i));
  }
  for (final c in callbacks) {
    c(); // 0, then 1
  }
}
```

## for-in

When you don't need an index, `for-in` walks any `Iterable` (a list, a set, a map's `keys`…). It can destructure with a pattern, too:

```dart
void main() {
  var candidates = ['Ada', 'Grace', 'Linus'];
  for (var name in candidates) {
    print('Interviewing $name');
  }

  var scores = {'Ada': 9, 'Grace': 10};
  for (var MapEntry(:key, :value) in scores.entries) {
    print('$key scored $value');
  }

  [1, 2, 3].forEach(print); // the method version
}
```

## while and do-while

`while` checks its condition **before** each pass, so it may run zero times. `do-while` checks **after**, so it always runs at least once:

```dart
void main() {
  var n = 10;
  while (n > 1) {
    n ~/= 2;
    print('while: $n');
  }

  var tries = 0;
  do {
    tries++;
  } while (tries < 0); // false straight away, but the body already ran once
  print('do-while ran $tries time(s)');
}
```

## break, continue and labels

`break` stops the loop. `continue` skips to the next pass. To break out of an **outer** loop from inside a nested one, label it:

```dart
void main() {
  for (var i = 1; i <= 6; i++) {
    if (i == 2) continue; // skip 2
    if (i == 5) break; // stop at 5
    print(i); // 1, 3, 4
  }

  outerLoop:
  for (var i = 1; i <= 3; i++) {
    for (var j = 1; j <= 3; j++) {
      print('i = $i, j = $j');
      if (i == 2 && j == 2) break outerLoop;
    }
  }
  print('outerLoop exited');
}
```

> 💡 **Tip:** many loops are really "filter then act". `candidates.where((c) => c.length > 3).forEach(print)` often reads better than a loop with `continue`.

## Challenge

> 🎯 **Challenge:** Write `Map<String, int> countWords(String text)` that counts how often each word appears. Words are separated by single spaces. `countWords('the cat and the hat')` returns `{the: 2, cat: 1, and: 1, hat: 1}`.

```dart starter
Map<String, int> countWords(String text) {
  var counts = <String, int>{};
  // loop over the words and count them
  return counts;
}

void main() {
  print(countWords('the cat and the hat'));
}
```

```dart solution
Map<String, int> countWords(String text) {
  var counts = <String, int>{};
  for (var word in text.split(' ')) {
    counts[word] = (counts[word] ?? 0) + 1;
  }
  return counts;
}

void main() {
  print(countWords('the cat and the hat'));
}
```

```dart check
  final got = lesson.countWords('the cat and the hat');
  expect(got.length == 4, 'Expected 4 different words, got ${got.length}: $got');
  expect(got['the'] == 2 && got['cat'] == 1 && got['and'] == 1 && got['hat'] == 1, 'Expected {the: 2, cat: 1, and: 1, hat: 1}, got $got');
  final again = lesson.countWords('a a a');
  expect(again.length == 1 && again['a'] == 3, "countWords('a a a') should be {a: 3}, got $again");
```

**Reference:** [Loops](https://dart.dev/language/loops) in the Dart language docs.
