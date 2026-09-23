---
title: Conditions
section: 1 · Basics
---

`if` runs a block only when its condition is `true`. The condition goes in parentheses, the body in braces:

```cpp
#include <iostream>

int main() {
  int temperature = 31;

  if (temperature > 30) {
    std::cout << "hot\n";
  }

  std::cout << "done\n";
}
```

The braces are optional for a single statement, but write them anyway — adding a second line to a brace-less `if` is one of the oldest bugs in the language.

## else and else if

```cpp
#include <iostream>

int main() {
  int score = 74;

  if (score >= 90) {
    std::cout << "A\n";
  } else if (score >= 70) {
    std::cout << "B\n";
  } else if (score >= 50) {
    std::cout << "C\n";
  } else {
    std::cout << "F\n";
  }
}
```

The chain stops at the **first** branch that matches, so order matters: put the narrowest test first. Swapping the `>= 90` and `>= 70` lines above would print `B` for every score of 70 or more, including 95.

## What counts as true

A condition doesn't have to be a comparison. Any value that converts to `bool` works: a number is `true` when it isn't zero.

```cpp
#include <iostream>

int main() {
  int count = 3;
  if (count) {                 // true, because count != 0
    std::cout << "some\n";
  }
  if (!count) {
    std::cout << "none\n";     // skipped
  }
}
```

> 💡 **Tip:** `if (count > 0)` says what you mean, and it also survives `count` becoming a `double` or a `std::string` later. Prefer the explicit comparison.

## An init-statement

An `if` can declare a variable first, separated by `;`. The variable lives only inside the `if` and its `else` — it can't leak into the rest of the function:

```cpp
#include <iostream>
#include <string>

int main() {
  std::string text = "hello world";

  if (std::size_t space = text.find(' '); space != std::string::npos) {
    std::cout << "space at " << space << "\n";
  } else {
    std::cout << "one word\n";
  }
}
```

## switch

When you're comparing **one** integer or `char` against several constant values, `switch` says it more clearly than a chain of `else if`:

```cpp
#include <iostream>

int main() {
  char grade = 'B';

  switch (grade) {
    case 'A':
      std::cout << "excellent\n";
      break;
    case 'B':
      std::cout << "good\n";
      break;
    case 'C':
      std::cout << "passed\n";
      break;
    default:
      std::cout << "unknown grade\n";
      break;
  }
}
```

> ⚠️ **Gotcha:** without `break`, execution **falls through** into the next case. That's occasionally what you want — and a bug the rest of the time.

Deliberate fall-through is how you give several values the same body. Say so with `[[fallthrough]];` when a case does real work first, so the compiler (and the next reader) knows it was on purpose:

```cpp
#include <iostream>

int main() {
  int month = 4;

  switch (month) {
    case 12:
    case 1:
    case 2:
      std::cout << "winter\n";
      break;
    case 3:
    case 4:
    case 5:
      std::cout << "spring\n";
      break;
    default:
      std::cout << "later in the year\n";
      break;
  }
}
```

`switch` only works on integral types — `int`, `char`, `enum`, `bool`. You can't switch on a `std::string` or a `double`; use `if`/`else if` there.

## Nesting and combining

Two nested `if`s and one `&&` do the same job. The flat version is usually easier to read:

```cpp
#include <iostream>

int main() {
  int age = 22;
  bool has_ticket = true;

  if (age >= 18 && has_ticket) {
    std::cout << "welcome\n";
  } else {
    std::cout << "sorry\n";
  }
}
```

## Challenge

> 🎯 **Challenge:** `score` is 74. Print the grade on one line: `A` for 90 and above, `B` for 70–89, `C` for 50–69, otherwise `F`. With `score = 74` that's `B`.

```cpp starter
#include <iostream>

int main() {
  int score = 74;
  // print A, B, C or F
}
```

```cpp solution
#include <iostream>

int main() {
  int score = 74;

  if (score >= 90) {
    std::cout << "A\n";
  } else if (score >= 70) {
    std::cout << "B\n";
  } else if (score >= 50) {
    std::cout << "C\n";
  } else {
    std::cout << "F\n";
  }
}
```

```cpp check
    expect(output.size() == 1, "Print one line");
    expect(output[0] == "B", "A score of 74 should print exactly: B");
```

```quiz
? easy: What does this print?
~~~cpp
#include <iostream>

int main() {
  int n = 5;
  if (n > 3) {
    std::cout << "big\n";
  } else {
    std::cout << "small\n";
  }
}
~~~
+ big
- small
- big small
- nothing
> The condition is true, so only the `if` body runs; `else` is the alternative, never both.
? easy: Which type can you **not** use in a `switch`?
+ `std::string`
- `int`
- `char`
- `enum`
> `switch` needs an integral or enumeration value. Compare strings with `if`/`else if`, or `==` on `std::string`.
? easy: What does this print?
~~~cpp
#include <iostream>

int main() {
  int count = 0;
  if (count) {
    std::cout << "some\n";
  }
  std::cout << "end\n";
}
~~~
+ end
- some
- some\nend
- nothing
> Zero converts to `false`, so the body is skipped. Any non-zero number would be `true`.
? medium: What does this print?
~~~cpp
#include <iostream>

int main() {
  int score = 95;
  if (score >= 70) {
    std::cout << "B\n";
  } else if (score >= 90) {
    std::cout << "A\n";
  }
}
~~~
+ B
- A
- B and A
- nothing
> The chain stops at the first true branch. `>= 90` is unreachable here — order your tests from narrowest to widest.
? medium: What does this print?
~~~cpp
#include <iostream>

int main() {
  int n = 2;
  switch (n) {
    case 1:
      std::cout << "one ";
    case 2:
      std::cout << "two ";
    case 3:
      std::cout << "three ";
  }
  std::cout << "\n";
}
~~~
+ two three
- two
- one two three
- three
> Without `break`, control falls through from `case 2` into `case 3`. Only `case 1` is skipped, because the switch jumps straight to the matching label.
? medium: In `if (int n = f(); n > 0) { ... }`, where can `n` be used?
+ Inside the `if` body and its `else`, and nowhere else
- Anywhere in the enclosing function
- Only inside the `if` body, not the `else`
- Only in the condition
> The init-statement scopes the variable to the whole `if` statement, which keeps short-lived names out of the surrounding function.
? hard: What does this print?
~~~cpp
#include <iostream>

int main() {
  int a = 4;
  if (a > 10 || a % 2 == 0) {
    std::cout << "yes\n";
  } else {
    std::cout << "no\n";
  }
}
~~~
+ yes
- no
- nothing
- It doesn't compile
> The first test is false, so `||` evaluates the second: 4 is even, so the whole condition is true.
? hard: Why write braces even for a one-line `if` body?
+ Adding a second line later would silently fall outside the `if`
- Braces are required by the compiler
- Braces make the program faster
- Without braces the `else` binds to the wrong `if`
> Only the next single statement belongs to a brace-less `if`; the second line runs unconditionally, and the indentation hides it.
```

**Reference:** [if statement](https://en.cppreference.com/w/cpp/language/if) and [switch statement](https://en.cppreference.com/w/cpp/language/switch) on cppreference.
