---
title: Modern C++ & tooling
section: Guide Book
summary: Lambdas, `std::optional`/`variant`/`any`, structured bindings, the features that changed how C++ is written — and the tools that keep it honest.
---
## Lambdas

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <functional>

int main() {
  auto square = [](int n) { return n * n; };
  std::cout << square(7) << "\n";

  int factor = 3;
  auto byValue = [factor](int n) { return n * factor; };     // copies factor
  auto byRef = [&factor](int n) { return n * factor; };      // refers to factor

  factor = 10;
  std::cout << "captured by value: " << byValue(2) << "\n";  // still 3
  std::cout << "captured by ref:   " << byRef(2) << "\n";    // now 10

  auto mutableCounter = [count = 0]() mutable { return ++count; };
  std::cout << mutableCounter() << mutableCounter() << mutableCounter() << "\n";

  auto generic = [](const auto& a, const auto& b) { return a + b; };
  std::cout << generic(1, 2) << ' ' << generic(std::string{"a"}, std::string{"b"}) << "\n";

  std::function<int(int)> stored = square;                   // type-erased, has overhead
  std::cout << stored(5) << "\n";
}
```

| Capture | Means |
| --- | --- |
| `[]` | capture nothing |
| `[x]` | a copy of `x` |
| `[&x]` | a reference to `x` |
| `[=]` | a copy of everything used — avoid, it hides what is captured |
| `[&]` | a reference to everything used — avoid, and dangerous if the lambda outlives the scope |
| `[x = expr]` | an init-capture; the only way to capture a move |
| `[this]` / `[*this]` | the enclosing object by pointer / by copy |

> ⚠️ `[&]` in a lambda that is stored, queued or returned is a dangling reference waiting to happen. Capture explicitly — the list is documentation of exactly what the lambda depends on.

```cpp
#include <iostream>
#include <memory>
#include <utility>

int main() {
  auto owned = std::make_unique<int>(42);

  // Init-capture is how a move-only type gets into a lambda.
  auto consume = [p = std::move(owned)]() { return *p; };

  std::cout << consume() << "\n";
  std::cout << "original is null: " << std::boolalpha << (owned == nullptr) << "\n";
}
```

## Structured bindings

```cpp
#include <iostream>
#include <map>
#include <tuple>
#include <string>

struct Point { int x; int y; };

std::tuple<std::string, int, double> makeRecord() {
  return {"Ada", 36, 1.65};
}

int main() {
  auto [name, age, height] = makeRecord();
  std::cout << name << ' ' << age << ' ' << height << "\n";

  Point p{3, 4};
  auto [x, y] = p;
  std::cout << x << ',' << y << "\n";

  std::map<std::string, int> scores{{"ada", 10}, {"grace", 12}};
  for (const auto& [key, value] : scores) {
    std::cout << key << '=' << value << ' ';
  }
  std::cout << "\n";

  // Binding by reference modifies in place.
  for (auto& [key, value] : scores) value *= 2;
  std::cout << scores["ada"] << ' ' << scores["grace"] << "\n";

  if (auto [it, inserted] = scores.emplace("linus", 8); inserted) {
    std::cout << "inserted " << it->first << "\n";
  }
}
```

## `variant` and `any`

```cpp
#include <iostream>
#include <variant>
#include <string>

using Value = std::variant<int, double, std::string>;

std::string describe(const Value& v) {
  return std::visit(
      [](const auto& x) -> std::string {
        using T = std::decay_t<decltype(x)>;
        if constexpr (std::is_same_v<T, int>) return "int " + std::to_string(x);
        else if constexpr (std::is_same_v<T, double>) return "double " + std::to_string(x);
        else return "string \"" + x + "\"";
      },
      v);
}

int main() {
  for (const Value& v : {Value{42}, Value{3.14}, Value{std::string{"text"}}}) {
    std::cout << describe(v) << "\n";
  }

  Value v = 42;
  std::cout << "index: " << v.index() << "\n";
  std::cout << "holds int: " << std::boolalpha << std::holds_alternative<int>(v) << "\n";
  std::cout << "get: " << std::get<int>(v) << "\n";

  if (const int* p = std::get_if<int>(&v)) std::cout << "get_if: " << *p << "\n";
}
```

A `variant` is a type-safe union: it holds exactly one of its alternatives and knows which. `std::visit` is exhaustive — forget an alternative and it does not compile.

## Designated initialisers and `[[nodiscard]]`

```cpp
#include <iostream>
#include <string>

struct Config {
  std::string host = "localhost";
  int port = 8080;
  bool secure = false;
};

[[nodiscard]] int compute(int n) { return n * 2; }

int main() {
  Config a{};
  Config b{.host = "example.com", .port = 443, .secure = true};
  Config c{.port = 9000};            // the rest keep their defaults

  std::cout << a.host << ':' << a.port << "\n";
  std::cout << b.host << ':' << b.port << ' ' << std::boolalpha << b.secure << "\n";
  std::cout << c.host << ':' << c.port << "\n";

  std::cout << compute(21) << "\n";
  // compute(21);   ← would warn: ignoring return value of function
                    //   declared with 'nodiscard'
}
```

Designated initialisers must appear in **declaration order** in C++ — unlike C, you cannot reorder them.

## `<chrono>`

```cpp
#include <iostream>
#include <chrono>
#include <thread>

int main() {
  using namespace std::chrono_literals;

  constexpr auto timeout = 250ms;
  constexpr auto interval = 2s;

  std::cout << "timeout in ms: " << timeout.count() << "\n";
  std::cout << "interval in ms: "
            << std::chrono::duration_cast<std::chrono::milliseconds>(interval).count() << "\n";

  const auto start = std::chrono::steady_clock::now();
  std::this_thread::sleep_for(5ms);
  const auto elapsed = std::chrono::steady_clock::now() - start;

  std::cout << "slept at least 5ms: " << std::boolalpha << (elapsed >= 5ms) << "\n";
}
```

Durations are strongly typed: adding `250ms` to `2s` works and produces milliseconds; adding a bare `250` does not compile. That is the point.

## The tooling

```cpp
#include <iostream>

int main() {
  std::cout << "-Wall -Wextra -Wpedantic      every warning worth having\n";
  std::cout << "-Werror                       make them build failures\n";
  std::cout << "-fsanitize=address,undefined  catch UB and memory bugs at run time\n";
  std::cout << "-fsanitize=thread             catch data races\n";
  std::cout << "clang-tidy                    static analysis and modernisation\n";
  std::cout << "clang-format                  one style, no arguments\n";
  std::cout << "valgrind                      leaks and invalid accesses\n";
  std::cout << "CMake + vcpkg/Conan           build and dependencies\n";
}
```

> 🔍 **Behind the scenes: sanitizers are the closest thing to a safety net**
>
> AddressSanitizer instruments every memory access, placing poisoned "redzones" around allocations and keeping freed memory quarantined. A buffer overrun or use-after-free that would otherwise corrupt something far away and crash later becomes an immediate, precise report with the allocation and free stacks. It costs roughly 2× run time — negligible for a test suite, and it finds the bugs that are otherwise found in production.

## A checklist for modern C++

```cpp
#include <iostream>
#include <vector>
#include <string>

int main() {
  const std::vector<std::pair<std::string, std::string>> guidance{
      {"owning memory", "std::vector / std::string / std::unique_ptr, never new/delete"},
      {"parameters", "const T& to read, T by value to store, T& to modify"},
      {"loops", "range-based for, with const auto&"},
      {"initialisation", "braces, and always initialise"},
      {"null", "std::optional, not a sentinel or a pointer"},
      {"failure", "std::expected or an exception — never an error code nobody checks"},
      {"casts", "static_cast, never a C-style cast"},
      {"the rule", "rule of zero: let members manage themselves"},
  };

  for (const auto& [topic, advice] : guidance) {
    std::cout << topic << ":\n  " << advice << "\n";
  }
}
```

**Reference:** [Lambda expressions](https://en.cppreference.com/w/cpp/language/lambda) and the [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines).
