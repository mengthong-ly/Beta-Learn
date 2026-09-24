---
title: Error handling
section: Guide Book
summary: Exceptions and the guarantees they come with, `std::optional` and `std::expected`, assertions, and when each is the right tool.
---
C++ gives you several error mechanisms and an opinion about none of them. Choosing well is most of the work.

## Exceptions

```cpp-snippet
#include <iostream>
#include <stdexcept>
#include <string>

int parsePort(const std::string& text) {
  if (text.empty()) throw std::invalid_argument("port is empty");

  int value = 0;
  try {
    value = std::stoi(text);
  } catch (const std::invalid_argument&) {
    throw std::invalid_argument("not a number: " + text);
  }

  if (value < 1 || value > 65535) {
    throw std::out_of_range("port out of range: " + std::to_string(value));
  }
  return value;
}

int main() {
  for (const std::string input : {"8080", "abc", "99999", ""}) {
    try {
      std::cout << "port " << parsePort(input) << "\n";
    } catch (const std::out_of_range& e) {
      std::cout << "range error: " << e.what() << "\n";
    } catch (const std::invalid_argument& e) {
      std::cout << "bad input: " << e.what() << "\n";
    }
  }
}
```

Catch by **`const` reference**. Catching by value slices a derived exception down to the base type and loses the real message.

## The standard hierarchy

```cpp-snippet
#include <iostream>
#include <stdexcept>
#include <vector>
#include <string>

int main() {
  std::vector<int> v{1, 2, 3};

  try {
    [[maybe_unused]] int x = v.at(99);
  } catch (const std::exception& e) {
    std::cout << "std::exception caught: " << e.what() << "\n";
  }

  try {
    throw std::logic_error("a bug in the program");
  } catch (const std::runtime_error&) {
    std::cout << "not reached — logic_error is not a runtime_error\n";
  } catch (const std::logic_error& e) {
    std::cout << "logic_error: " << e.what() << "\n";
  }
}
```

```text
std::exception
├── std::logic_error          a bug: the caller broke a precondition
│   ├── std::invalid_argument
│   ├── std::domain_error
│   ├── std::length_error
│   └── std::out_of_range
├── std::runtime_error        something outside the program failed
│   ├── std::range_error
│   ├── std::overflow_error
│   └── std::system_error
└── std::bad_alloc, std::bad_cast, std::bad_optional_access, …
```

## Exception safety guarantees

```cpp-snippet
#include <iostream>
#include <vector>
#include <string>
#include <stdexcept>

class Settings {
 public:
  // Strong guarantee: either it fully succeeds, or nothing changed.
  void replaceAll(std::vector<std::string> incoming) {
    validate(incoming);          // may throw — before any mutation
    values_ = std::move(incoming);
  }

  // Basic guarantee: still valid afterwards, but partially updated.
  void appendEach(const std::vector<std::string>& incoming) {
    for (const auto& v : incoming) {
      if (v.empty()) throw std::invalid_argument("empty value");
      values_.push_back(v);
    }
  }

  std::size_t size() const noexcept { return values_.size(); }   // no-throw

 private:
  static void validate(const std::vector<std::string>& items) {
    for (const auto& item : items) {
      if (item.empty()) throw std::invalid_argument("empty value");
    }
  }

  std::vector<std::string> values_;
};

int main() {
  Settings s;

  try {
    s.replaceAll({"a", "", "c"});
  } catch (const std::exception& e) {
    std::cout << "replaceAll threw: " << e.what() << ", size still " << s.size() << "\n";
  }

  try {
    s.appendEach({"a", "", "c"});
  } catch (const std::exception& e) {
    std::cout << "appendEach threw: " << e.what() << ", size now " << s.size() << "\n";
  }
}
```

| Guarantee | Means |
| --- | --- |
| **no-throw** (`noexcept`) | never throws — required for destructors, swap, moves |
| **strong** | the operation either completes or leaves everything unchanged |
| **basic** | no leaks, everything still valid, but state may have changed |
| **none** | avoid |

> 🔍 **Behind the scenes: validate first, then mutate**
>
> The strong guarantee is usually achieved the way `replaceAll` does it: do everything that can fail *before* anything that changes state, then finish with operations that cannot throw (a move, a swap). This is the whole idea behind copy-and-swap in assignment operators — build a complete copy, which may throw, then swap it in, which cannot.

## `std::optional`

For "there might be no value", where absence is normal rather than exceptional.

```cpp-snippet
#include <iostream>
#include <optional>
#include <string>
#include <vector>

std::optional<int> parseInt(const std::string& text) {
  try {
    return std::stoi(text);
  } catch (...) {
    return std::nullopt;
  }
}

std::optional<std::string> findUser(const std::vector<std::string>& users, char initial) {
  for (const auto& u : users) {
    if (!u.empty() && u.front() == initial) return u;
  }
  return std::nullopt;
}

int main() {
  for (const std::string input : {"42", "abc"}) {
    if (auto n = parseInt(input)) {
      std::cout << input << " → " << *n << "\n";
    } else {
      std::cout << input << " → no value\n";
    }
  }

  const std::vector<std::string> users{"Ada", "Grace"};
  std::cout << findUser(users, 'A').value_or("(none)") << "\n";
  std::cout << findUser(users, 'Z').value_or("(none)") << "\n";

  auto missing = findUser(users, 'Z');
  std::cout << "has_value: " << std::boolalpha << missing.has_value() << "\n";
}
```

```cpp
#include <iostream>
#include <optional>

int main() {
  std::optional<int> empty;
  std::cout << empty.value(); // error! bad_optional_access
}
```

`*opt` and `opt->x` do **not** check — they are undefined behaviour when empty. `.value()` throws. Test first, or use `value_or`.

## `std::expected`

C++23's answer for "failed, and here is why", without exceptions.

```cpp-snippet
#include <iostream>
#include <expected>
#include <string>

enum class ParseError { Empty, NotANumber, OutOfRange };

std::string describe(ParseError e) {
  switch (e) {
    case ParseError::Empty: return "empty input";
    case ParseError::NotANumber: return "not a number";
    case ParseError::OutOfRange: return "out of range";
  }
  return "unknown";
}

std::expected<int, ParseError> parsePort(const std::string& text) {
  if (text.empty()) return std::unexpected(ParseError::Empty);

  int value = 0;
  try {
    value = std::stoi(text);
  } catch (...) {
    return std::unexpected(ParseError::NotANumber);
  }

  if (value < 1 || value > 65535) return std::unexpected(ParseError::OutOfRange);
  return value;
}

int main() {
  for (const std::string input : {"8080", "abc", "99999", ""}) {
    auto result = parsePort(input);
    if (result) {
      std::cout << "[" << input << "] port " << *result << "\n";
    } else {
      std::cout << "[" << input << "] failed: " << describe(result.error()) << "\n";
    }
  }

  std::cout << parsePort("abc").value_or(-1) << "\n";
}
```

The failure is in the **return type**, so the caller cannot ignore it by accident — the win that exceptions give up.

## Choosing

| Situation | Reach for |
| --- | --- |
| A precondition was violated — the caller has a bug | `throw std::logic_error` (or assert) |
| Something outside the program failed | `throw std::runtime_error` |
| Absence is a normal outcome | `std::optional` |
| Failure is normal and the reason matters | `std::expected` |
| An invariant the program depends on | `assert` in debug builds |
| Unrecoverable | `std::terminate` / `std::abort` |

## Assertions and contracts

```cpp
#include <iostream>
#include <cassert>
#include <vector>
#include <algorithm>

int median(std::vector<int> values) {
  assert(!values.empty() && "median of an empty range is undefined");
  std::sort(values.begin(), values.end());
  return values[values.size() / 2];
}

int main() {
  std::cout << median({5, 1, 3}) << "\n";

  // static_assert is checked at compile time and costs nothing at run time.
  static_assert(sizeof(int) >= 4, "this code assumes a 32-bit int");
  std::cout << "static_assert passed at compile time\n";
}
```

`assert` is compiled out when `NDEBUG` is defined, which is the default for release builds. It documents a programmer-error invariant — never a condition that could occur from valid input.

## `noexcept`

```cpp
#include <iostream>
#include <vector>
#include <utility>

struct Fast {
  Fast() = default;
  Fast(Fast&&) noexcept = default;
  Fast& operator=(Fast&&) noexcept = default;
  Fast(const Fast&) = default;
};

int main() {
  std::cout << std::boolalpha;
  std::cout << "move is noexcept: " << noexcept(Fast{std::declval<Fast>()}) << "\n";
  std::cout << "a noexcept function that throws calls std::terminate\n";
  std::cout << "so mark it only where you can genuinely guarantee it\n";
}
```

> ⚠️ `noexcept` is a promise enforced by `std::terminate`, not by the type system. Mark destructors, swaps and move operations `noexcept` — the library checks for it and takes faster paths. Do not scatter it hopefully across functions that call things which might throw.

**Reference:** [Exceptions](https://en.cppreference.com/w/cpp/language/exceptions), [std::optional](https://en.cppreference.com/w/cpp/utility/optional) and [std::expected](https://en.cppreference.com/w/cpp/utility/expected) on cppreference.
