---
title: Functions
section: 3 · Functions & objects
---

A function is a named piece of work with a **return type**, a **name**, and a list of **typed parameters**. All three are checked at compile time, at the definition and at every call.

```cpp
#include <iostream>

int add(int a, int b) {
  return a + b;
}

int main() {
  std::cout << add(2, 3) << "\n";
}
```

A function must be **declared before it's used**. Defining it above `main` is the simplest way; the alternative is a declaration (a *prototype*) up top and the body further down:

```cpp
#include <iostream>

int square(int x);        // declaration: the compiler now knows the shape

int main() {
  std::cout << square(5) << "\n";
}

int square(int x) {       // definition
  return x * x;
}
```

## return and void

`return` hands a value back and leaves the function immediately — useful for handling the awkward case first and keeping the main path unindented:

```cpp
#include <iostream>

int safe_divide(int a, int b) {
  if (b == 0) {
    return 0;              // early return
  }
  return a / b;
}

void announce(int value) {   // void: returns nothing
  std::cout << "value is " << value << "\n";
}

int main() {
  announce(safe_divide(10, 2));
  announce(safe_divide(10, 0));
}
```

> ⚠️ **Gotcha:** falling off the end of a non-`void` function without returning is undefined behaviour. `main` is the one exception — reaching its closing brace means `return 0;`.

## How arguments are passed

By default C++ **copies** each argument. The function gets its own object, and changes stay inside:

```cpp
#include <iostream>

void bump_copy(int n) {
  n += 1;                  // a local copy
}

void bump_ref(int& n) {
  n += 1;                  // the caller's variable
}

int main() {
  int value = 5;
  bump_copy(value);
  std::cout << value << " ";
  bump_ref(value);
  std::cout << value << "\n";
}
```

Three choices, and the right one is usually obvious:

| Parameter | Use it when |
| --- | --- |
| `int x`, `double x` | the type is small and cheap to copy |
| `const std::string& x` | reading something big without copying it |
| `std::string& x` | the function is meant to modify the caller's object |

```cpp
#include <iostream>
#include <string>
#include <vector>

int total_length(const std::vector<std::string>& words) {   // read-only, no copy
  int n = 0;
  for (const std::string& w : words) {
    n += static_cast<int>(w.size());
  }
  return n;
}

void shout(std::string& text) {                              // modifies the caller's string
  text += "!";
}

int main() {
  std::vector<std::string> words{"ada", "lovelace"};
  std::string message = "hi";
  shout(message);
  std::cout << total_length(words) << " " << message << "\n";
}
```

## Default arguments

A parameter can have a default, which callers may leave out. Defaults go on the **declaration**, and only at the end of the list:

```cpp
#include <iostream>
#include <string>

std::string repeat(const std::string& text, int times = 2) {
  std::string out;
  for (int i = 0; i < times; ++i) {
    out += text;
  }
  return out;
}

int main() {
  std::cout << repeat("ab") << " " << repeat("ab", 3) << "\n";
}
```

## Overloading

Several functions can share a name as long as their parameter lists differ. The compiler picks the match at the call site — a return type alone is **not** enough to tell two overloads apart:

```cpp
#include <iostream>
#include <string>

int size_of(int n) {
  return n;
}

int size_of(const std::string& s) {
  return static_cast<int>(s.size());
}

int main() {
  std::cout << size_of(42) << " " << size_of(std::string{"hello"}) << "\n";
}
```

## Recursion

A function may call itself, as long as some case stops the chain:

```cpp
#include <iostream>

int factorial(int n) {
  if (n <= 1) {
    return 1;              // base case
  }
  return n * factorial(n - 1);
}

int main() {
  std::cout << factorial(5) << "\n";
}
```

> ⚠️ **Gotcha:** every call takes stack space. A missing or unreachable base case doesn't loop forever, it overflows the stack and crashes.

## Lambdas

A lambda is a function written where it's needed, often to tell an algorithm what to do:

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{5, 2, 9, 1};

  std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; });   // descending

  int threshold = 4;
  auto big = std::count_if(v.begin(), v.end(), [threshold](int x) { return x > threshold; });

  for (int x : v) {
    std::cout << x << " ";
  }
  std::cout << "| " << big << "\n";
}
```

The `[]` is the **capture list**: names from the surrounding scope that the lambda may use. `[threshold]` captures a copy; `[&threshold]` captures a reference to it.

## Challenge

> 🎯 **Challenge:** Write `int factorial(int n)` that returns `1` for `n <= 1` and `n * factorial(n - 1)` otherwise, then print `factorial(5)` — that's `120`.

```cpp starter
#include <iostream>

int factorial(int n) {
  // return 1 for n <= 1, otherwise n * factorial(n - 1)
  return 0;
}

int main() {
  std::cout << factorial(5) << "\n";
}
```

```cpp solution
#include <iostream>

int factorial(int n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

int main() {
  std::cout << factorial(5) << "\n";
}
```

```cpp check
    expect(factorial(0) == 1 && factorial(1) == 1, "factorial(0) and factorial(1) should both be 1");
    expect(factorial(6) == 720, "factorial(6) should be 720");
    expect(output.size() == 1 && output[0] == "120", "Print exactly: 120");
```

```quiz
? easy: What does this print?
~~~cpp
#include <iostream>

int twice(int x) {
  return x * 2;
}

int main() {
  std::cout << twice(twice(3)) << "\n";
}
~~~
+ 12
- 6
- 9
- 36
> The inner call gives 6, and the outer one doubles that.
? easy: What does a `void` function return?
+ Nothing
- 0
- `void`
- Whatever the last statement produced
> `void` means there's no result. A bare `return;` may still be used to leave early.
? easy: Where must a function be declared?
+ Before the first place it's called
- Anywhere in the file
- After `main`
- In a separate header, always
> The compiler reads top to bottom. Define it above the caller, or put a declaration there and the body lower down.
? medium: What does this print?
~~~cpp
#include <iostream>

void bump(int n) {
  n += 1;
}

int main() {
  int value = 5;
  bump(value);
  std::cout << value << "\n";
}
~~~
+ 5
- 6
- 1
- 0
> `n` is a copy, so the increment dies with the call. `void bump(int& n)` would change the caller's variable.
? medium: What does this print?
~~~cpp
#include <iostream>
#include <string>

std::string repeat(const std::string& text, int times = 2) {
  std::string out;
  for (int i = 0; i < times; ++i) {
    out += text;
  }
  return out;
}

int main() {
  std::cout << repeat("ab") << "\n";
}
~~~
+ abab
- ab
- ababab
- It doesn't compile
> The call leaves out `times`, so the default of 2 applies.
? medium: Can `int f(int)` and `double f(int)` coexist as overloads?
+ No — overloads must differ in their parameters, not just the return type
- Yes, the compiler picks by the type you assign to
- Yes, but only inside a class
- Yes, if one of them is `const`
> Overload resolution looks at the arguments at the call site. The return type isn't part of that decision.
? hard: What does this print?
~~~cpp
#include <iostream>

int f(int n) {
  if (n <= 1) {
    return 1;
  }
  return n * f(n - 1);
}

int main() {
  std::cout << f(4) << "\n";
}
~~~
+ 24
- 10
- 4
- 1
> 4 × 3 × 2 × 1. The base case at `n <= 1` is what stops the recursion.
? hard: What does `[threshold]` mean in `[threshold](int x) { return x > threshold; }`?
+ The lambda captures a copy of `threshold` from the enclosing scope
- It's the lambda's parameter list
- It declares a new variable called `threshold`
- It captures `threshold` by reference
> The `[]` is the capture list; a bare name copies, and `[&threshold]` would capture by reference instead.
? hard: What does this print?
~~~cpp
#include <iostream>
#include <string>

void shout(std::string& text) {
  text += "!";
}

int main() {
  std::string message = "hi";
  shout(message);
  shout(message);
  std::cout << message << "\n";
}
~~~
+ hi!!
- hi!
- hi
- It doesn't compile
> The parameter is a reference, so each call appends to the caller's own string.
```

**Reference:** [Functions](https://en.cppreference.com/w/cpp/language/functions) on cppreference.
