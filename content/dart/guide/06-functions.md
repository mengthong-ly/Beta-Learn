---
title: Functions & closures
section: Guide Book
summary: Positional, named and optional parameters, functions as values, closures, cascades and the tear-off syntax.
---
## Declaring

```dart
int add(int a, int b) {
  return a + b;
}

int multiply(int a, int b) => a * b;   // => is sugar for { return …; }

void greet(String name) {
  print('Hello, $name');
}

void main() {
  print(add(2, 3));
  print(multiply(2, 3));
  greet('Ada');
}
```

The return type may be omitted, but `dart analyze` will ask for it on anything public — and inference on a long function body is easy to get wrong by accident.

## Parameters

Dart has three kinds, and they combine.

```dart
// Positional, required.
String join(String a, String b) => '$a$b';

// Positional, optional, with defaults — square brackets.
String tag(String name, [String type = 'div', bool closed = true]) =>
    '<$type class="$name"${closed ? ' /' : ''}>';

// Named — curly braces. Optional unless marked `required`.
String box({required String title, String body = '', int width = 20}) =>
    '${title.padRight(width, '.')}|$body';

void main() {
  print(join('a', 'b'));

  print(tag('card'));
  print(tag('card', 'section'));
  print(tag('card', 'section', false));

  print(box(title: 'Notes'));
  print(box(body: 'some text', title: 'Notes', width: 10));
}
```

> 💡 **Tip:** Named parameters are the default choice in Dart, and Flutter uses them almost exclusively. `Padding(padding: …, child: …)` reads at the call site; `Padding(…, …)` does not. The cost is verbosity; the benefit is that adding a parameter is never a breaking reorder.

```dart
String box({required String title, String body = ''}) => '$title: $body';

void main() {
  print(box(body: 'no title')); // error! The named parameter 'title' is required
}
```

## Functions are values

```dart
void main() {
  // A function stored in a variable.
  final double = (int n) => n * 2;
  print(double(21));

  // Passed as an argument.
  final nums = [1, 2, 3];
  print(nums.map(double).toList());

  // Returned from a function.
  final add5 = makeAdder(5);
  print(add5(10));

  // A typedef names the signature.
  Transform<int> square = (n) => n * n;
  print(square(7));
}

typedef Transform<T> = T Function(T value);

int Function(int) makeAdder(int amount) {
  return (int n) => n + amount;
}
```

The type of a function is written `ReturnType Function(ParamTypes)` — `int Function(int, String)`.

## Closures capture variables

```dart
void main() {
  final counter = makeCounter();
  print(counter());
  print(counter());
  print(counter());

  // A second counter has its own captured variable.
  final other = makeCounter();
  print(other());

  // Each loop iteration captures its own `i`.
  final fns = <String Function()>[];
  for (var i = 0; i < 3; i++) {
    fns.add(() => 'captured $i');
  }
  for (final f in fns) {
    print(f());
  }
}

int Function() makeCounter() {
  var count = 0;
  return () => ++count;
}
```

## Tear-offs

Referring to a function without calling it — the `(...)`-free form.

```dart
class Greeter {
  final String greeting;
  Greeter(this.greeting);

  String greet(String name) => '$greeting, $name';
}

void main() {
  final names = ['ada', 'grace'];

  print(names.map((n) => n.toUpperCase()).toList());   // a closure
  print(names.map(capitalise).toList());               // a tear-off

  final greeter = Greeter('Hello');
  print(names.map(greeter.greet).toList());            // a bound method tear-off

  final parse = int.parse;                             // a static tear-off
  print(['1', '2'].map(parse).toList());
}

String capitalise(String s) => s[0].toUpperCase() + s.substring(1);
```

Tear-offs are cheaper than a wrapping closure and, in Flutter, more `const`-friendly.

## Cascades

`..` calls a method and evaluates to the *receiver*, not the result — so you can chain operations on one object.

```dart
class Request {
  String url = '';
  final headers = <String, String>{};
  String method = 'GET';

  void addHeader(String k, String v) => headers[k] = v;

  @override
  String toString() => '$method $url $headers';
}

void main() {
  final request = Request()
    ..url = '/api/users'
    ..method = 'POST'
    ..addHeader('Accept', 'application/json')
    ..addHeader('X-Source', 'guide');

  print(request);

  final list = <int>[]
    ..add(3)
    ..add(1)
    ..add(2)
    ..sort();

  print(list);

  Request? maybe;
  maybe?..url = '/never'..method = 'PUT';   // null-aware cascade: does nothing
  print(maybe);
}
```

> 🔍 **Behind the scenes: `..` versus `.`**
>
> `list..sort()` evaluates to the list; `list.sort()` evaluates to `void`. That single difference is what makes cascades a builder syntax: every step hands the same object to the next, so a sequence of `void` methods becomes one expression. It is also why `..` is the fix for the `final sorted = list.sort()` mistake.

## Generators

```dart
Iterable<int> countTo(int n) sync* {
  for (var i = 1; i <= n; i++) {
    yield i;
  }
}

Iterable<int> naturals() sync* {
  var i = 0;
  while (true) {
    yield i++;     // infinite, but lazy
  }
}

Iterable<int> combined() sync* {
  yield 0;
  yield* countTo(3);   // yield* delegates to another generator
}

void main() {
  print(countTo(5).toList());
  print(naturals().take(5).toList());
  print(combined().toList());
}
```

`sync*` produces an `Iterable`; `async*` produces a `Stream` — see the [asynchrony](/dart/guide/async) chapter.

## Recursion and higher-order patterns

```dart
void main() {
  print(factorial(10));
  print(fib(20));

  final compose = <T>(T Function(T) f, T Function(T) g) => (T x) => f(g(x));
  final shoutTrimmed = compose<String>((s) => s.toUpperCase(), (s) => s.trim());
  print(shoutTrimmed('  hello  '));
}

int factorial(int n) => n <= 1 ? 1 : n * factorial(n - 1);

int fib(int n) {
  var (a, b) = (0, 1);
  for (var i = 0; i < n; i++) {
    (a, b) = (b, a + b);
  }
  return a;
}
```

That `(a, b) = (b, a + b)` is a **record pattern assignment** — the whole swap happens at once, with no temporary.

**Reference:** [Functions](https://dart.dev/language/functions) on dart.dev.
