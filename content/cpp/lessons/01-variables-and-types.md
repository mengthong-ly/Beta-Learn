---
title: Variables and types
section: 1 · Basics
---

C++ is **compiled** and **statically typed**: your compiler reads the whole file, checks every type, and turns it into a native program before anything runs. A mistake here is a *compile error*, not a surprise at runtime.

Every program starts at `main`. `#include <iostream>` brings in the input/output library, `std::cout` is the standard output stream, and `<<` pushes values into it:

```cpp
#include <iostream>

int main() {
  int age = 36;
  std::cout << "Ada is " << age << " years old\n";
}
```

`main` returns `int`, but you don't have to write `return 0;` — reaching the end of `main` means success. Everything from the standard library lives in the `std` namespace, which is why it's `std::cout` and not `cout`.

> 💡 **Tip:** `"\n"` is a newline. `std::endl` also flushes the stream, which is slower; prefer `"\n"` unless you really need the flush.

## Declaring a variable

A declaration is **type, then name, then an initial value**. The type is fixed forever — a variable can change its value, never its type:

```cpp
#include <iostream>
#include <string>

int main() {
  int score = 10;
  double ratio = 1.65;
  bool admin = true;
  char grade = 'A';
  std::string name = "Ada";

  score = score + 5;
  std::cout << name << " " << score << " " << ratio << " " << admin << " " << grade << "\n";
}
```

Note `admin` printed as `1`: `std::cout` shows a `bool` as `1` or `0` unless you ask for `std::boolalpha`. Also note the quotes: `'A'` is a single `char`, `"Ada"` is text. They are different types, and swapping them is an error.

### Fundamental types

| Type | Holds | Typical size |
| --- | --- | --- |
| `int` | whole numbers | 4 bytes, about ±2.1 billion |
| `long long` | bigger whole numbers | 8 bytes |
| `double` | real numbers | 8 bytes |
| `bool` | `true` / `false` | 1 byte |
| `char` | one character | 1 byte |
| `std::string` | text (from `<string>`) | grows as needed |

Sizes are minimums, not promises — `sizeof` reports what *your* compiler chose:

```cpp
#include <iostream>

int main() {
  std::cout << sizeof(int) << " " << sizeof(double) << " " << sizeof(bool) << "\n";
}
```

## Initialization: `=` versus `{}`

Braces are the safer form. Both initialize, but `{}` refuses a **narrowing** conversion — one that would silently lose information:

```cpp
#include <iostream>

int main() {
  int copied = 3.9;    // allowed, silently truncates to 3
  int braced{3};       // fine: 3 fits in an int
  std::cout << copied << " " << braced << "\n";
}
```

Writing `int braced{3.9};` instead is a compile error, which is exactly what you want: the compiler catches the lost `.9` for you.

> ⚠️ **Gotcha:** `int x;` on its own leaves `x` **uninitialized** — it holds whatever was in that memory. Reading it is undefined behaviour, and the program may print garbage or work fine by luck. `int x{};` gives you a guaranteed `0`.

## `auto`

`auto` asks the compiler to work out the type from the initializer. The type is still fixed and still checked — you just didn't have to spell it out:

```cpp
#include <iostream>
#include <string>

int main() {
  auto count = 42;          // int
  auto ratio = 1.5;         // double
  auto letter = 'x';        // char
  auto text = std::string{"hello"};

  std::cout << count << " " << ratio << " " << letter << " " << text << "\n";
}
```

> ⚠️ **Gotcha:** `auto text = "hello";` does *not* give you a `std::string`. A bare quoted literal is a `const char*`, so `text + "!"` won't compile. Write `std::string{"hello"}` or use the `s` suffix from `<string>`.

## `const` and `constexpr`

`const` means "this never changes after it's initialized". Reach for it by default: it documents intent and lets the compiler catch a mistaken assignment.

```cpp
#include <iostream>

int main() {
  const int max_users = 100;
  // max_users = 101;   // compile error: cannot assign to a const
  std::cout << max_users << "\n";
}
```

`constexpr` is stronger: the value must be known **at compile time**, so it can be used where a constant is required, such as an array size.

```cpp
#include <iostream>

constexpr int side = 4;

int main() {
  int board[side * side]{};   // needs a compile-time size
  board[0] = 7;
  std::cout << side << " " << sizeof(board) / sizeof(int) << " " << board[0] << "\n";
}
```

## References

A reference is a second **name for the same object**, not a copy. Change one, and you changed the other, because there is only one object:

```cpp
#include <iostream>

int main() {
  int original = 5;
  int& alias = original;   // alias *is* original
  alias = 9;

  int copy = original;     // a separate object
  copy = 100;

  std::cout << original << " " << alias << " " << copy << "\n";
}
```

References are how you pass something large to a function without copying it. `const std::string&` says "let me read your string, I won't copy it and I won't change it":

```cpp
#include <iostream>
#include <string>

int length_of(const std::string& text) {   // no copy, read-only
  return static_cast<int>(text.size());
}

int main() {
  std::string word = "compiler";
  std::cout << length_of(word) << "\n";
}
```

> 💡 **Tip:** a reference must be bound when it's declared and can never be re-seated onto a different object. That's what makes it safer than a pointer.

## Scope

A variable lives from its declaration to the closing `}` of its block, then it's destroyed. An inner block can shadow an outer name:

```cpp
#include <iostream>

int main() {
  int value = 1;
  {
    int value = 2;   // a different variable, shadowing the outer one
    std::cout << value << "\n";
  }
  std::cout << value << "\n";
}
```

## Naming

- Letters, digits and `_`, never starting with a digit
- Case-sensitive: `Age` and `age` are two different variables
- Don't start a name with `_` followed by a capital, or use `__` anywhere: those are reserved for the implementation
- `snake_case` is the standard library's convention, and a common house style

## Challenge

> 🎯 **Challenge:** Declare `const std::string language` holding `"C++"` and `constexpr int version` holding `23`, then print exactly `C++ 23`.

```cpp starter
#include <iostream>
#include <string>

int main() {
  // declare language and version, then print them
}
```

```cpp solution
#include <iostream>
#include <string>

int main() {
  const std::string language = "C++";
  constexpr int version = 23;
  std::cout << language << " " << version << "\n";
}
```

```cpp check
    expect(output.size() == 1, "Print one line");
    expect(output[0] == "C++ 23", "Print exactly: C++ 23");
```

```quiz
? easy: What does this print?
~~~cpp
#include <iostream>

int main() {
  int score = 10;
  score = score + 5;
  std::cout << score << "\n";
}
~~~
+ 15
- 10
- 5
- score + 5
> `score = score + 5` reads the old value, adds 5 and stores the result back.
? easy: Which declaration is a compile error?
+ `int count = "seven";`
- `int count = 7;`
- `auto count = 7;`
- `const int count = 7;`
> C++ is statically typed: text can't be stored in an `int`, and the compiler says so before the program ever runs.
? easy: What does this print?
~~~cpp
#include <iostream>

int main() {
  std::cout << "a" << 1 << "b" << '\n';
}
~~~
+ a1b
- a 1 b
- ab1
- a1b with a space
> `<<` writes each value one after another with nothing in between; you add any spacing yourself.
? medium: What does this print?
~~~cpp
#include <iostream>

int main() {
  int x = 7;
  int& r = x;
  r = 2;
  std::cout << x << "\n";
}
~~~
+ 2
- 7
- 9
- 0
> `r` is another name for `x`, not a copy, so assigning through `r` changes `x`.
? medium: What does `int n{3.9};` do?
+ It fails to compile, because `{}` rejects narrowing
- It stores 3
- It stores 4
- It stores 3.9
> Brace initialization refuses conversions that lose information. `int n = 3.9;` compiles and silently truncates to 3.
? medium: What is the type of `auto text = "hello";`?
+ `const char*`
- `std::string`
- `char`
- `auto`
> A quoted literal is an array of characters that decays to `const char*`. Use `std::string{"hello"}` when you want a string object.
? hard: What does this print?
~~~cpp
#include <iostream>

int main() {
  int value = 1;
  {
    int value = 2;
    std::cout << value << " ";
  }
  std::cout << value << "\n";
}
~~~
+ 2 1
- 1 1
- 2 2
- 1 2
> The inner `value` shadows the outer one inside the block. At the closing brace it's destroyed, and the outer `value` is visible again.
? hard: Why is `int x;` inside a function risky?
+ It's left uninitialized, so reading it is undefined behaviour
- It's always zero, which is rarely what you want
- It doesn't compile without a value
- It makes `x` a constant
> Local fundamental types get no default value. `int x{};` initializes to 0; prefer that, or give it a real value straight away.
? hard: What does this print?
~~~cpp
#include <iostream>

int main() {
  const int a = 4;
  int b = a;
  b = 10;
  std::cout << a << " " << b << "\n";
}
~~~
+ 4 10
- 10 10
- 4 4
- It doesn't compile
> `int b = a;` copies the value. `b` is its own, non-const object, so assigning to it leaves `a` untouched.
```

**Reference:** [Declarations](https://en.cppreference.com/w/cpp/language/declarations) and [Initialization](https://en.cppreference.com/w/cpp/language/initialization) on cppreference.
