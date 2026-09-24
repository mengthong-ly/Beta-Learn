---
title: Types & initialisation
section: Guide Book
summary: The fundamental types, `auto`, the four initialisation syntaxes and why braces are the safe default.
---
## The fundamental types

```cpp
#include <iostream>
#include <cstdint>
#include <limits>

int main() {
  int i = 42;
  long long big = 9'000'000'000LL;     // digit separators are legal
  double d = 3.14;
  float f = 3.14f;
  bool b = true;
  char c = 'A';
  std::int32_t exact = 100;            // exactly 32 bits, from <cstdint>

  std::cout << std::boolalpha;
  std::cout << i << ' ' << big << ' ' << d << ' ' << f << ' ' << b << ' ' << c << ' ' << exact << "\n";
  std::cout << "int range: " << std::numeric_limits<int>::min()
            << " … " << std::numeric_limits<int>::max() << "\n";
  std::cout << "double digits: " << std::numeric_limits<double>::digits10 << "\n";
}
```

`std::boolalpha` makes a `bool` print as `true`/`false` instead of `1`/`0` — a stream *manipulator*, sticky until you change it back.

> 💡 **Tip:** When the exact width matters — a file format, a network protocol, a hash — use `<cstdint>`. `int` is 32 bits everywhere you are likely to run, but `long` is 32 on Windows and 64 elsewhere, and that difference has broken real code.

## Four ways to initialise

```cpp
#include <iostream>
#include <string>
#include <vector>

int main() {
  int a = 5;          // copy initialisation
  int b(5);           // direct initialisation
  int c{5};           // direct-list (brace) initialisation
  int d = {5};        // copy-list initialisation

  auto e = 5;         // deduced: int

  std::cout << a << b << c << d << e << "\n";

  std::string s1 = "text";
  std::string s2{"text"};
  std::vector<int> v1{1, 2, 3};        // three elements
  std::vector<int> v2(3, 0);           // three zeros — parentheses mean something else!

  std::cout << s1 << ' ' << s2 << ' ' << v1.size() << ' ' << v2.size() << "\n";
  for (int x : v2) std::cout << x << ' ';
  std::cout << "\n";
}
```

> ⚠️ `std::vector<int> v(3, 0)` makes three zeros; `std::vector<int> v{3, 0}` makes the two elements `3` and `0`. Braces prefer an initialiser-list constructor whenever one exists. It is the one place braces are *not* the safe choice, and it catches everyone once.

## Why braces are the default anyway

Braces refuse narrowing conversions. The other forms accept them silently.

```cpp
#include <iostream>

int main() {
  double precise = 3.99;

  int truncated = precise;    // allowed, silently loses .99
  std::cout << truncated << "\n";

  int explicitCast = static_cast<int>(precise);   // say it on purpose
  std::cout << explicitCast << "\n";
}
```

```cpp
#include <iostream>

int main() {
  double precise = 3.99;
  int narrowed{precise}; // error! type 'double' cannot be narrowed to 'int' in initializer list
  std::cout << narrowed << "\n";
}
```

## Uninitialised variables

```cpp
#include <iostream>

int main() {
  int initialised{};       // zero-initialised: 0
  int alsoZero = 0;
  static int staticVar;    // statics ARE zero-initialised

  std::cout << initialised << ' ' << alsoZero << ' ' << staticVar << "\n";

  // A local `int x;` with no initialiser holds whatever was in that memory.
  // Reading it is undefined behaviour — not "some random number", but a
  // program the compiler may transform in any way it likes.
  std::cout << "always initialise locals; `int x{};` costs nothing\n";
}
```

> 🔍 **Behind the scenes: undefined behaviour is not "unpredictable output"**
>
> When a program has UB, the standard places *no* requirements on it at all — and optimisers exploit that. A compiler may prove that a branch would read an uninitialised value, conclude the branch is unreachable, and delete it along with the code around it. That is why UB bugs are so strange: the symptom often appears in a function nowhere near the mistake, and it changes when you add a `printf`. `int x{};` is the whole fix.

## `auto`

```cpp
#include <iostream>
#include <map>
#include <string>
#include <vector>

int main() {
  auto n = 42;                     // int
  auto pi = 3.14;                  // double
  auto text = "literal";           // const char* — NOT std::string
  auto real = std::string{"text"}; // std::string

  std::vector<int> nums{3, 1, 2};
  std::map<std::string, int> scores{{"ada", 10}, {"grace", 12}};

  for (auto value : nums) std::cout << value << ' ';   // a copy of each
  std::cout << "\n";

  for (const auto& [name, score] : scores) {           // structured binding, no copy
    std::cout << name << '=' << score << ' ';
  }
  std::cout << "\n";

  auto it = nums.begin();          // saves writing std::vector<int>::iterator
  std::cout << *it << "\n";
}
```

| Form | Means |
| --- | --- |
| `auto x` | a copy, top-level `const` and references stripped |
| `auto& x` | a reference — modifies the original |
| `const auto& x` | a read-only reference — the default for loops over containers |
| `auto&& x` | a forwarding reference — binds to anything |

> ⚠️ `for (auto x : container)` **copies every element**. For a `std::vector<std::string>` of a thousand items that is a thousand string allocations per loop. `const auto&` is the right default; use `auto` deliberately when you want a copy to modify.

## `const` and `constexpr`

```cpp
#include <iostream>
#include <array>

constexpr int factorial(int n) { return n <= 1 ? 1 : n * factorial(n - 1); }

int main() {
  const int runtime_const = 5;       // cannot change after initialisation
  constexpr int compile_const = 10;  // known at compile time

  constexpr int f = factorial(5);
  static_assert(f == 120);

  std::array<int, factorial(4)> fixed{};   // usable as an array size
  std::cout << f << ' ' << fixed.size() << ' '
            << runtime_const + compile_const << "\n";

  // constexpr functions still work at run time:
  int input = 6;
  std::cout << factorial(input) << "\n";
}
```

`const` means "I will not modify this". `constexpr` means "this can be computed before the program runs". Every `constexpr` is `const`; the reverse is not true.

## Type conversions

```cpp
#include <iostream>

int main() {
  int i = 7;
  double d = i;              // widening: exact
  int back = static_cast<int>(3.99);
  unsigned u = 3;

  std::cout << d << ' ' << back << "\n";

  // The trap: mixing signed and unsigned.
  int negative = -1;
  std::cout << "(-1 < 3u) is " << std::boolalpha << (negative < static_cast<int>(u)) << "\n";
  std::cout << "as unsigned, -1 becomes " << static_cast<unsigned>(negative) << "\n";
}
```

> ⚠️ In `x < y` where one side is signed and the other unsigned, the signed value is converted to unsigned — so `-1 < 3u` is **false**. This is why `for (int i = 0; i < v.size(); ++i)` warns: `size()` returns an unsigned type. Use `std::ssize(v)`, a range-based `for`, or `std::size_t` consistently.

## `sizeof` and alignment

```cpp
#include <iostream>

struct Padded {
  char a;      // 1 byte
  int b;       // 4 bytes, but must start on a 4-byte boundary
  char c;      // 1 byte
};

struct Packed {
  int b;
  char a;
  char c;
};

int main() {
  std::cout << "Padded: " << sizeof(Padded) << " bytes, align " << alignof(Padded) << "\n";
  std::cout << "Packed: " << sizeof(Packed) << " bytes, align " << alignof(Packed) << "\n";
  std::cout << "sum of members: " << sizeof(char) * 2 + sizeof(int) << "\n";
}
```

The compiler inserts padding so every member sits on its natural alignment. Ordering members from largest to smallest often shrinks a struct for free — which matters when you have millions of them.

**Reference:** [Initialization](https://en.cppreference.com/w/cpp/language/initialization) and [Fundamental types](https://en.cppreference.com/w/cpp/language/types) on cppreference.
