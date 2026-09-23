---
title: Operators
section: 1 · Basics
---

Operators combine values into **expressions**. Every expression has a type, worked out at compile time, and that type decides what the operator actually does.

## Arithmetic

`+ - * /` do what you expect, and `%` is the remainder of an integer division:

```cpp
#include <iostream>

int main() {
  int total = 47;
  int per_box = 6;
  std::cout << total + per_box << " " << total - per_box << " " << total * per_box << "\n";
  std::cout << total / per_box << " " << total % per_box << "\n";
}
```

> ⚠️ **Gotcha:** `47 / 6` is `7`, not `7.833`. When **both** operands are integers, `/` is integer division and the remainder is thrown away. Make one side a `double` to get a real division.

```cpp
#include <iostream>

int main() {
  int total = 47;
  int per_box = 6;
  std::cout << total / per_box << "\n";                              // 7
  std::cout << static_cast<double>(total) / per_box << "\n";         // 7.83333
  std::cout << total / 6.0 << "\n";                                  // 7.83333
}
```

`static_cast<double>(total)` is the explicit, searchable way to convert. Prefer it to the old C-style `(double)total`.

> ⚠️ **Gotcha:** `%` only works on integers, and dividing by zero is undefined behaviour — your program may crash or do something worse. Check the divisor before you use it.

## Compound assignment and increment

```cpp
#include <iostream>

int main() {
  int score = 10;
  score += 5;    // score = score + 5
  score *= 2;    // 30
  score -= 4;    // 26
  score /= 2;    // 13
  ++score;       // 14
  score--;       // 13
  std::cout << score << "\n";
}
```

`++x` increments and gives the **new** value; `x++` gives the **old** one and increments afterwards. In a statement of its own they're identical, so prefer `++x` and never write both forms for the same variable in one expression.

## Comparison

Comparisons produce a `bool`. `std::boolalpha` prints `true`/`false` instead of `1`/`0`:

```cpp
#include <iostream>

int main() {
  int a = 3;
  int b = 7;
  std::cout << std::boolalpha
            << (a == b) << " " << (a != b) << " " << (a < b) << " " << (a >= b) << "\n";
}
```

> ⚠️ **Gotcha:** `=` assigns, `==` compares. `if (x = 5)` assigns 5 and is always true — a classic bug. Compilers warn about it; turn warnings on and read them.

## Logical operators

`&&` (and), `||` (or) and `!` (not) combine `bool`s, and they **short-circuit**: the right side is skipped when the left side already decides the answer.

```cpp
#include <iostream>

int say(int value) {
  std::cout << "checked ";
  return value;
}

int main() {
  bool result = (say(0) > 0) && (say(1) > 0);   // the second call never happens
  std::cout << std::boolalpha << result << "\n";
}
```

That's not just a speed trick — it's how you guard a test: `if (count > 0 && total / count > 10)` never divides by zero.

## Precedence

`*`, `/` and `%` bind tighter than `+` and `-`, which bind tighter than comparisons, which bind tighter than `&&`, which binds tighter than `||`.

```cpp
#include <iostream>

int main() {
  std::cout << 2 + 3 * 4 << " " << (2 + 3) * 4 << "\n";
}
```

> 💡 **Tip:** nobody remembers the full table, and nobody should have to read your code with it open. Add parentheses when the grouping isn't obvious.

## The conditional operator

`condition ? a : b` is an expression that picks one of two values — useful where a whole `if` statement won't fit, such as in an initializer:

```cpp
#include <iostream>
#include <string>

int main() {
  int stock = 0;
  std::string label = stock > 0 ? "in stock" : "sold out";
  std::cout << label << "\n";
}
```

## Mixing types

When the two sides of an operator have different types, the compiler converts them to a common one before doing the work. Integers become `double`s, and small integer types get promoted to `int`:

```cpp
#include <iostream>

int main() {
  int count = 3;
  double price = 2.5;
  std::cout << count * price << "\n";   // 7.5: count becomes a double
  std::cout << 7 / 2 << " " << 7 / 2.0 << "\n";
}
```

## Challenge

> 🎯 **Challenge:** 47 items go into boxes of 6. Using `/` and `%`, print exactly `7 boxes, 5 left`.

```cpp starter
#include <iostream>

int main() {
  int total = 47;
  int per_box = 6;
  // print how many full boxes, and how many items are left over
}
```

```cpp solution
#include <iostream>

int main() {
  int total = 47;
  int per_box = 6;
  std::cout << total / per_box << " boxes, " << total % per_box << " left\n";
}
```

```cpp check
    expect(output.size() == 1, "Print one line");
    expect(output[0] == "7 boxes, 5 left", "Print exactly: 7 boxes, 5 left");
```

```quiz
? easy: What does this print?
~~~cpp
#include <iostream>

int main() {
  std::cout << 7 / 2 << "\n";
}
~~~
+ 3
- 3.5
- 4
- 3.0
> Both operands are `int`, so `/` is integer division: the fractional part is discarded, never rounded.
? easy: What does this print?
~~~cpp
#include <iostream>

int main() {
  std::cout << 17 % 5 << "\n";
}
~~~
+ 2
- 3
- 3.4
- 5
> `%` is the remainder: 17 is 3 fives with 2 left over.
? easy: What does `score += 5;` mean?
+ `score = score + 5;`
- `score = 5;`
- It compares `score` with 5
- It creates a new variable called `score`
> Compound assignment reads the variable, applies the operator and stores the result back.
? medium: What does this print?
~~~cpp
#include <iostream>

int main() {
  std::cout << 2 + 3 * 4 << "\n";
}
~~~
+ 14
- 20
- 24
- 9
> `*` binds tighter than `+`, so it's `2 + (3 * 4)`. Parentheses make it explicit when it matters.
? medium: What does this print?
~~~cpp
#include <iostream>

int main() {
  int x = 5;
  int y = x++;
  std::cout << x << " " << y << "\n";
}
~~~
+ 6 5
- 6 6
- 5 5
- 5 6
> Postfix `x++` yields the old value (5) and then increments, so `y` is 5 and `x` is 6.
? medium: Why does `count > 0 && total / count > 10` never divide by zero?
+ `&&` short-circuits: when the left side is false the right side isn't evaluated
- The compiler reorders the test
- Division by zero is automatically 0 in C++
- It does divide by zero, but the result is ignored
> Short-circuiting is what makes a guard on the left of `&&` actually protect the right.
? hard: What does this print?
~~~cpp
#include <iostream>

int main() {
  int a = 7;
  double b = 2;
  std::cout << a / b << " " << a / 2 << "\n";
}
~~~
+ 3.5 3
- 3.5 3.5
- 3 3
- 3.5 4
> `a / b` mixes `int` and `double`, so `a` converts to `double` and you get 3.5. `a / 2` is int-only division.
? hard: What is wrong with `if (x = 5)`?
+ It assigns 5 to `x` and is always true
- It compares `x` with 5, which is fine
- It doesn't compile
- It compares addresses instead of values
> `=` is assignment; the value of the assignment (5) is then converted to `true`. Write `x == 5`, and keep compiler warnings on.
? hard: What does this print?
~~~cpp
#include <iostream>

int main() {
  int total = 10;
  int count = 4;
  std::cout << total / count << " " << static_cast<double>(total) / count << "\n";
}
~~~
+ 2 2.5
- 2.5 2.5
- 2 2
- 2.5 2
> The cast changes the type of the left operand before the division, so the second one is a real division.
```

**Reference:** [Expressions](https://en.cppreference.com/w/cpp/language/expressions) and [Operator precedence](https://en.cppreference.com/w/cpp/language/operator_precedence) on cppreference.
