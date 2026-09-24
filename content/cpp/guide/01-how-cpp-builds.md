---
title: How C++ builds and runs
section: Guide Book
summary: Preprocess, compile, assemble, link — four steps, and why an error in each one looks completely different.
---
C++ does not have an interpreter or a virtual machine. Your source becomes machine code before anything runs, in four distinct stages, and knowing which stage failed is half of reading an error message.

```text
main.cpp
   │  1. PREPROCESS   #include pasted in, macros expanded
   ▼
main.i (a huge single file)
   │  2. COMPILE      parse, type-check, optimise
   ▼
main.s (assembly) ──► 3. ASSEMBLE ──► main.o (object file)
   │
   │  4. LINK         join object files and libraries, resolve every symbol
   ▼
a.out  ──► the operating system loads and runs it
```

## 1. The preprocessor

`#include` is literal text substitution. The preprocessor pastes the entire contents of the header into your file before the compiler ever sees it.

```cpp
#include <iostream>

#define SQUARE(x) ((x) * (x))

int main() {
  std::cout << "This is line " << __LINE__ << " of " << __FILE__ << "\n";
  std::cout << "C++ standard: " << __cplusplus << "\n";
  std::cout << "SQUARE(3 + 1) = " << SQUARE(3 + 1) << "\n";
}
```

> ⚠️ Those parentheses in `SQUARE` are not decoration. Written as `#define SQUARE(x) x * x`, the call `SQUARE(3 + 1)` expands to `3 + 1 * 3 + 1`, which is `7`. Macros substitute text, not values — which is why `constexpr` functions replaced almost every use of them.

```cpp
#include <iostream>

constexpr int square(int x) { return x * x; }

int main() {
  // A real function: type-checked, respects precedence, debuggable.
  std::cout << square(3 + 1) << "\n";

  // …and still evaluated at compile time when it can be.
  constexpr int computed = square(12);
  static_assert(computed == 144, "computed at compile time");
  std::cout << computed << "\n";
}
```

## 2. Compilation: one translation unit at a time

Each `.cpp` file plus everything it includes is a **translation unit**, compiled in complete isolation. The compiler sees nothing of your other files.

```cpp
#include <iostream>

// A declaration: "this exists somewhere, here is its type."
int helper(int n);

// A definition: the actual code.
int helper(int n) { return n * 2; }

int main() {
  std::cout << helper(21) << "\n";
}
```

This is why headers exist: they carry *declarations* so each translation unit can type-check calls into code it cannot see.

> 🔍 **Behind the scenes: the One Definition Rule**
>
> A program may declare something many times but must **define** it exactly once. Headers are included into many translation units, so anything in a header that would produce a definition — a free function body, a global variable — must be marked `inline` or `constexpr`, which tells the linker "several identical copies are expected; keep one". Class definitions and templates are exempt, which is why they live happily in headers. Break the rule and you get a *linker* error about duplicate symbols, long after the compiler was happy.

## 3. Assembly and 4. linking

The compiler emits an object file full of symbols, some defined and some still missing. The linker joins them up.

```cpp
#include <iostream>
#include <string>

// The linker resolves `std::string`'s functions from the standard library.
int main() {
  std::string message = "linked against libstdc++ or libc++";
  std::cout << message << "\n";
  std::cout << "message length: " << message.size() << "\n";
}
```

A missing definition is an "undefined reference" — the compiler was satisfied by the declaration, and only the linker discovered nothing implements it. Typical causes: a forgotten `.cpp` in the build, a missing `-l` library flag, or a member function declared in a class and never defined.

## Where the errors come from

```cpp
#include <iostream>

int main() {
  int x = "not a number"; // error! cannot initialize a variable of type 'int'
  std::cout << x << "\n";
}
```

| Stage | Looks like |
| --- | --- |
| Preprocessor | `fatal error: 'foo.h' file not found` |
| Compiler | `error: no matching function for call to …`, type mismatches |
| Linker | `undefined reference to …`, `duplicate symbol …` |
| Run time | a crash, wrong output, or nothing at all |

That last row is the one C++ is notorious for, and the next chapters are largely about keeping things out of it.

## `main`

```cpp
#include <iostream>

int main(int argc, char* argv[]) {
  std::cout << "argument count: " << argc << "\n";
  for (int i = 0; i < argc; ++i) {
    std::cout << "  argv[" << i << "] = " << argv[i] << "\n";
  }
  // Reaching the end of main implies `return 0;`
}
```

`main` returns `int` — `0` means success, anything else is an error code the shell can test. It is the only function allowed to omit its `return`.

## What the standard guarantees

```cpp
#include <iostream>
#include <climits>

int main() {
  std::cout << "sizeof(int):       " << sizeof(int) << " bytes\n";
  std::cout << "sizeof(long):      " << sizeof(long) << " bytes\n";
  std::cout << "sizeof(void*):     " << sizeof(void*) << " bytes\n";
  std::cout << "INT_MAX:           " << INT_MAX << "\n";
  std::cout << "chars in a byte:   " << CHAR_BIT << "\n";
}
```

The standard specifies *minimum* ranges, not exact sizes. `int` is at least 16 bits, is 32 on every mainstream platform, and `long` is 32 bits on Windows but 64 on Linux and macOS. When the width matters, use `<cstdint>`: `std::int32_t`, `std::uint64_t`.

> 💡 **Tip:** Compile with `-Wall -Wextra` and treat warnings as errors in CI. C++'s most dangerous mistakes — an uninitialised read, a narrowing conversion, a missing return — are warnings by default, and turning them into build failures is the cheapest safety improvement available.

## In this course

C++ runs on **your own** compiler through a local runner, built with `-std=c++23 -Wall`. On the website these lessons are read-only, with the real recorded output shown beneath each example.

**Reference:** [Translation units](https://en.cppreference.com/w/cpp/language/translation_phases) and [the One Definition Rule](https://en.cppreference.com/w/cpp/language/definition) on cppreference.
