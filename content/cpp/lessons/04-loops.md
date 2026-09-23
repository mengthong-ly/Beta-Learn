---
title: Loops
section: 1 · Basics
---

C++ has three loops plus one shorthand. They do the same work; pick the one that makes the intent obvious.

## while

`while` tests **before** each pass, so a loop whose condition starts out false never runs:

```cpp
#include <iostream>

int main() {
  int countdown = 3;
  while (countdown > 0) {
    std::cout << countdown << " ";
    --countdown;
  }
  std::cout << "liftoff\n";
}
```

Something inside the body has to move the condition towards `false`. Forget the `--countdown` and the program loops forever — the runner stops it after a few seconds, but a real program would just hang.

## do–while

`do–while` tests **after** the body, so the body always runs at least once:

```cpp
#include <iostream>

int main() {
  int n = 0;
  do {
    std::cout << "ran once\n";
    ++n;
  } while (n < 0);   // false, but the body already ran
}
```

Note the semicolon after `while (...)` — it's part of the statement.

## for

A `for` gathers the three parts of a counting loop on one line: **init**, **condition**, **step**.

```cpp
#include <iostream>

int main() {
  for (int i = 0; i < 5; ++i) {
    std::cout << i << " ";
  }
  std::cout << "\n";
}
```

`i` is declared in the init-statement, so it exists only inside the loop. Counting from `0` while `i < n` is the C++ habit — it runs exactly `n` times and matches how containers are indexed.

> ⚠️ **Gotcha:** `i <= size` instead of `i < size` walks one step past the end. On a container that's an out-of-bounds read: undefined behaviour, not a guaranteed crash.

## The range-based for

To visit every element of a container, say that directly:

```cpp
#include <iostream>
#include <string>
#include <vector>

int main() {
  std::vector<std::string> names{"Ada", "Alan", "Grace"};

  for (const std::string& name : names) {
    std::cout << name << " ";
  }
  std::cout << "\n";
}
```

There's no index to get wrong and no end to overshoot. The three forms you'll write:

- `for (const auto& x : items)` — read only, no copies. The default.
- `for (auto& x : items)` — modify the elements in place.
- `for (auto x : items)` — a copy of each element; fine for `int` and other small types.

```cpp
#include <iostream>
#include <vector>

int main() {
  std::vector<int> scores{1, 2, 3};

  for (int& score : scores) {
    score *= 10;              // a reference: this changes the vector
  }
  for (int score : scores) {
    std::cout << score << " ";
  }
  std::cout << "\n";
}
```

A `std::string` is a container of `char`, so it works too:

```cpp
#include <iostream>
#include <string>

int main() {
  int vowels = 0;
  for (char c : std::string{"programming"}) {
    if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
      ++vowels;
    }
  }
  std::cout << vowels << "\n";
}
```

## break and continue

`break` leaves the loop immediately. `continue` skips the rest of *this* pass and goes on to the next one:

```cpp
#include <iostream>

int main() {
  for (int i = 1; i <= 10; ++i) {
    if (i % 2 != 0) {
      continue;          // odd: skip it
    }
    if (i > 6) {
      break;             // stop altogether
    }
    std::cout << i << " ";
  }
  std::cout << "\n";
}
```

> 💡 **Tip:** in a `for`, `continue` still runs the step (`++i`). In a `while`, it doesn't — if your increment sits at the bottom of a `while` body, a `continue` above it loops forever.

## Nested loops

A loop inside a loop runs the inner one from the top on every outer pass. `break` only leaves the **innermost** loop:

```cpp
#include <iostream>

int main() {
  for (int row = 1; row <= 3; ++row) {
    for (int col = 1; col <= 3; ++col) {
      std::cout << row * col << "\t";
    }
    std::cout << "\n";
  }
}
```

## Challenge

> 🎯 **Challenge:** Print the first five multiples of 3, separated by single spaces, on one line: `3 6 9 12 15`. (No trailing space.)

```cpp starter
#include <iostream>

int main() {
  // loop five times and print 3, 6, 9, 12, 15
}
```

```cpp solution
#include <iostream>

int main() {
  for (int i = 1; i <= 5; ++i) {
    std::cout << i * 3;
    if (i < 5) {
      std::cout << " ";
    }
  }
  std::cout << "\n";
}
```

```cpp check
    expect(output.size() == 1, "Print one line");
    expect(output[0] == "3 6 9 12 15", "Print exactly: 3 6 9 12 15");
```

```quiz
? easy: What does this print?
~~~cpp
#include <iostream>

int main() {
  for (int i = 0; i < 3; ++i) {
    std::cout << i << " ";
  }
  std::cout << "\n";
}
~~~
+ 0 1 2
- 1 2 3
- 0 1 2 3
- 0 1 2 3 4
> The loop starts at 0 and stops as soon as `i < 3` is false, so it runs three times: 0, 1 and 2.
? easy: How many times does the body of a `do–while` run when the condition is false from the start?
+ Once
- Never
- Forever
- It doesn't compile
> `do–while` tests after the body, so the first pass always happens. `while` tests first and would skip it.
? easy: What does `break` do inside a loop?
+ Leaves the loop immediately
- Skips to the next pass
- Restarts the loop
- Ends the program
> `break` exits; `continue` is the one that skips the rest of the current pass.
? medium: What does this print?
~~~cpp
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{1, 2, 3};
  for (int x : v) {
    x *= 2;
  }
  for (int x : v) {
    std::cout << x << " ";
  }
  std::cout << "\n";
}
~~~
+ 1 2 3
- 2 4 6
- 1 2 3 2 4 6
- 0 0 0
> `int x` copies each element, so doubling the copy leaves the vector untouched. Write `int& x` to modify it in place.
? medium: What does this print?
~~~cpp
#include <iostream>

int main() {
  for (int i = 1; i <= 6; ++i) {
    if (i % 2 != 0) {
      continue;
    }
    std::cout << i << " ";
  }
  std::cout << "\n";
}
~~~
+ 2 4 6
- 1 3 5
- 1 2 3 4 5 6
- 2 4
> `continue` skips the printing for odd values and carries on with the next pass.
? medium: Which range-for form should you reach for by default when reading a container of strings?
+ `for (const auto& s : items)`
- `for (auto s : items)`
- `for (auto& s : items)`
- `for (auto* s : items)`
> A `const` reference avoids copying every element and says you won't change them. Use a plain reference only when you mean to modify.
? hard: What does this print?
~~~cpp
#include <iostream>

int main() {
  int total = 0;
  for (int i = 1; i <= 4; ++i) {
    for (int j = 1; j <= 4; ++j) {
      if (j == 3) {
        break;
      }
      ++total;
    }
  }
  std::cout << total << "\n";
}
~~~
+ 8
- 16
- 4
- 12
> The inner loop counts 1 and 2 and then breaks, so it adds 2 per outer pass. `break` leaves only the innermost loop, and the outer one runs 4 times.
? hard: Why is `for (int i = 0; i <= v.size(); ++i)` wrong?
+ It runs one pass too many and reads past the last element
- `size()` can't be used in a condition
- It never runs
- It skips the first element
> Valid indexes run from `0` to `size() - 1`. Reading `v[v.size()]` is undefined behaviour — it may look fine and corrupt something else.
? hard: What does this print?
~~~cpp
#include <iostream>
#include <string>

int main() {
  int n = 0;
  for (char c : std::string{"banana"}) {
    if (c == 'a') {
      ++n;
    }
  }
  std::cout << n << "\n";
}
~~~
+ 3
- 2
- 6
- 1
> A `std::string` is a range of `char`, so the loop visits every letter of "banana" — three of them are 'a'.
```

**Reference:** [for statement](https://en.cppreference.com/w/cpp/language/for) and [range-for statement](https://en.cppreference.com/w/cpp/language/range-for) on cppreference.
