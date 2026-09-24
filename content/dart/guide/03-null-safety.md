---
title: Null safety
section: Guide Book
summary: Sound null safety — what the compiler proves, the operators for working with nullable values, and why `!` should make you uncomfortable.
---
Dart's null safety is **sound**: if a variable's type is `String`, it cannot hold `null`, and the compiler relies on that rather than merely hoping for it.

## Nullable and non-nullable

```dart
void main() {
  String definitely = 'always a String';
  String? maybe;

  print(definitely.length);
  print(maybe);
  print(maybe?.length);

  maybe = 'now assigned';
  print(maybe.length);   // flow analysis proved it is not null here
}
```

```dart
void main() {
  String definitely = 'text';
  definitely = null; // error! A value of type 'Null' can't be assigned to a variable of type 'String'.
  print(definitely);
}
```

## The operators

```dart
void main() {
  String? name;

  print(name ?? 'anonymous');          // ?? fallback when null
  print(name?.toUpperCase());          // ?. call only when not null
  print(name?.length ?? 0);            // chain them

  name ??= 'assigned by ??=';          // assign only if currently null
  print(name);

  name ??= 'ignored';                  // no longer null, so skipped
  print(name);

  final list = <String>['a', 'b'];
  print(list.firstWhere((s) => s == 'z', orElse: () => 'not found'));
}
```

| Operator | Means |
| --- | --- |
| `?` | this type may be null |
| `?.` | call only if not null, otherwise evaluate to null |
| `??` | use the right side if the left is null |
| `??=` | assign only if currently null |
| `!` | "I promise this is not null" — throws if it is |
| `?..` | null-aware cascade |

## Flow analysis

The compiler tracks nullability through your control flow, so explicit checks promote the type for the rest of the block.

```dart
int lengthOf(String? text) {
  if (text == null) {
    return 0;
  }
  // text is String from here — no ! and no ? needed
  return text.length;
}

String describe(String? text) {
  if (text == null) return 'nothing';
  if (text.isEmpty) return 'empty';
  return 'a string of ${text.length} characters';
}

void main() {
  print(lengthOf(null));
  print(lengthOf('hello'));
  print(describe(null));
  print(describe(''));
  print(describe('Dart'));
}
```

```dart
void main() {
  String? text = 'hello';

  if (text != null) {
    print(text.length);   // promoted: no ? needed
  }

  // Early return is the idiomatic shape:
  final result = text == null ? 0 : text.length;
  print(result);
}
```

> 🔍 **Behind the scenes: why promotion sometimes refuses**
>
> Flow analysis only promotes **local variables**. A non-final field cannot be promoted, because any method call between the check and the use could reassign it — and the compiler cannot prove otherwise. The fix is the same as in most languages with flow typing: copy the field into a local first.

```dart
class Message {
  String? body;

  int lengthWithLocal() {
    final b = body;              // copy to a local
    if (b == null) return 0;
    return b.length;             // promoted
  }
}

void main() {
  final m = Message()..body = 'hello';
  print(m.lengthWithLocal());
  print(Message().lengthWithLocal());
}
```

## `!` — the assertion you should justify

```dart
void main() {
  String? name = 'Ada';

  print(name!.length);   // works, because it is not null

  final map = <String, int>{'a': 1};
  print(map['a']!);      // map lookup returns int?, and we know 'a' exists
}
```

```dart
void main() {
  String? name;
  print(name!.length); // error! Null check operator used on a null value
}
```

> ⚠️ Every `!` is a promise the compiler cannot verify, and a crash if you are wrong. Before writing one, try: an `if` check, `??` with a default, `?.` with a null-aware chain, or fixing the type so it was never nullable. A `!` on data that came from outside your program — JSON, a query result, a form — is almost always a bug waiting for the right input.

## Nullable collections

There are three different things here, and they are worth separating.

```dart
void main() {
  List<String>? maybeList;        // the list itself may be null
  List<String?> listOfMaybe = ['a', null, 'c'];   // the items may be null
  List<String?>? both;            // either

  print(maybeList?.length);
  print(listOfMaybe);
  print(listOfMaybe.whereType<String>().toList());   // drops the nulls, and the type
  print(both?.length ?? -1);

  final lengths = listOfMaybe.map((s) => s?.length ?? 0).toList();
  print(lengths);
}
```

`whereType<String>()` is the clean way to go from `List<String?>` to `List<String>` — it filters and narrows the type in one step.

## `late` and null safety

```dart
class Repository {
  late final List<String> items;   // non-nullable, assigned later

  void initialise() {
    items = ['first', 'second'];
  }
}

void main() {
  final repo = Repository();
  repo.initialise();
  print(repo.items);

  // The alternative without `late`:
  //   List<String>? items;
  // …which forces every reader to handle a null that never actually happens.
}
```

The trade: `late` gives every reader a clean non-nullable type at the cost of a possible `LateInitializationError`; a nullable field gives compile-time safety at the cost of a check at every use. Choose `late` when the initialisation is genuinely guaranteed by a lifecycle you control.

## `required` versus nullable

```dart
class User {
  final String name;        // required, never null
  final String? nickname;   // optional, may be null
  final int age;            // required, has a default at the call site

  User({required this.name, this.nickname, this.age = 0});

  @override
  String toString() => '$name (${nickname ?? 'no nickname'}), age $age';
}

void main() {
  print(User(name: 'Ada'));
  print(User(name: 'Grace', nickname: 'Amazing Grace', age: 85));
}
```

`required` is about the *call site* — the argument must be passed. `?` is about the *type* — the value may be null. A parameter can be required and nullable (`required String? x`): you must pass something, and that something may be null.

## `Never`

```dart
Never fail(String message) {
  throw StateError(message);
}

int parsePort(String value) {
  final n = int.tryParse(value);
  if (n == null) fail('Not a number: $value');
  return n;      // the compiler knows fail() cannot return
}

void main() {
  print(parsePort('8080'));

  try {
    parsePort('abc');
  } on StateError catch (e) {
    print('caught: ${e.message}');
  }
}
```

`Never` is the bottom type: a function returning it cannot complete normally. That is what lets `parsePort` return `int` rather than `int?` without any further check.

**Reference:** [Sound null safety](https://dart.dev/null-safety) and [Understanding null safety](https://dart.dev/null-safety/understanding-null-safety) on dart.dev.
