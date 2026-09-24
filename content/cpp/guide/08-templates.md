---
title: Templates
section: Guide Book
summary: Compile-time code generation — function and class templates, deduction, specialisation, `constexpr if`, and C++20 concepts.
---
A template is not a generic type. It is a **recipe** the compiler uses to generate a separate, fully-typed function or class for each set of arguments you use.

## Function templates

```cpp
#include <iostream>
#include <string>

template <typename T>
T larger(T a, T b) {
  return a > b ? a : b;
}

int main() {
  std::cout << larger(3, 7) << "\n";                       // larger<int>
  std::cout << larger(2.5, 1.5) << "\n";                   // larger<double>
  std::cout << larger<std::string>("apple", "banana") << "\n";
  std::cout << larger('a', 'z') << "\n";
}
```

The compiler deduced `T` from the arguments and generated three separate functions. That is why a template error message is enormous: it reports a failure inside code that did not exist until you called it.

```cpp
#include <iostream>

template <typename T>
T larger(T a, T b) { return a > b ? a : b; }

int main() {
  // Both parameters are T, so mixing types has nothing to deduce.
  std::cout << larger(1, 2.5); // error! deduced conflicting types for parameter 'T'
}
```

```cpp
#include <iostream>

// Two parameters, and a deduced return type.
template <typename A, typename B>
auto larger(A a, B b) {
  return a > b ? a : b;
}

int main() {
  std::cout << larger(1, 2.5) << "\n";
  std::cout << larger(3.5, 2) << "\n";
}
```

## Class templates

```cpp-snippet
#include <iostream>
#include <stdexcept>
#include <vector>

template <typename T>
class Stack {
 public:
  void push(T value) { items_.push_back(std::move(value)); }

  T pop() {
    if (items_.empty()) throw std::out_of_range("empty stack");
    T top = std::move(items_.back());
    items_.pop_back();
    return top;
  }

  bool empty() const { return items_.empty(); }
  std::size_t size() const { return items_.size(); }

 private:
  std::vector<T> items_;
};

int main() {
  Stack<int> numbers;
  numbers.push(1);
  numbers.push(2);
  std::cout << numbers.pop() << ' ' << numbers.size() << "\n";

  Stack<std::string> words;          // class template argument deduction also works
  words.push("hello");
  std::cout << words.pop() << "\n";
}
```

## Non-type template parameters

```cpp
#include <iostream>
#include <array>

template <typename T, std::size_t N>
class FixedBuffer {
 public:
  constexpr std::size_t size() const { return N; }
  T& operator[](std::size_t i) { return data_[i]; }
  const T& operator[](std::size_t i) const { return data_[i]; }

 private:
  std::array<T, N> data_{};
};

template <int Exponent>
constexpr int powerOfTwo() {
  return 1 << Exponent;
}

int main() {
  FixedBuffer<int, 4> buffer;
  buffer[0] = 42;
  std::cout << buffer[0] << ", size " << buffer.size() << "\n";

  static_assert(powerOfTwo<10>() == 1024);
  std::cout << powerOfTwo<10>() << "\n";
}
```

The size is part of the *type*: `FixedBuffer<int, 4>` and `FixedBuffer<int, 8>` are unrelated types, and the size is known with no storage cost.

## Concepts

C++20's answer to unreadable template errors: state the requirement, and the compiler checks it at the call site.

```cpp
#include <iostream>
#include <concepts>
#include <string>

template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template <typename T>
concept Printable = requires(std::ostream& os, const T& value) {
  { os << value } -> std::same_as<std::ostream&>;
};

template <Numeric T>
T average(T a, T b) {
  return (a + b) / 2;
}

void show(const Printable auto& value) {
  std::cout << "  " << value << "\n";
}

int main() {
  std::cout << average(4, 8) << "\n";
  std::cout << average(1.0, 2.0) << "\n";

  show(42);
  show(std::string{"text"});
  show(3.14);
}
```

```cpp
#include <concepts>
#include <string>

template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template <Numeric T>
T average(T a, T b) { return (a + b) / 2; }

int main() {
  return average(std::string{"a"}, std::string{"b"}).size(); // error! constraints not satisfied
}
```

> 🔍 **Behind the scenes: why concepts shortened the error messages**
>
> Before concepts, a template failed *inside* its body — the compiler dutifully reported that `operator>` was missing on line 400 of a header, after twelve lines of instantiation backtrace. A concept is checked at the **call site** before instantiation, so the error is "constraints not satisfied" at the line you wrote. The generated code is identical; only the diagnostics changed, and that turned out to matter enormously.

## `if constexpr`

Branches discarded at compile time — the untaken branch is not even compiled.

```cpp
#include <iostream>
#include <string>
#include <type_traits>

template <typename T>
std::string describe(const T& value) {
  if constexpr (std::is_integral_v<T>) {
    return "integer: " + std::to_string(value);
  } else if constexpr (std::is_floating_point_v<T>) {
    return "float: " + std::to_string(value);
  } else if constexpr (std::is_same_v<T, std::string>) {
    return "string of length " + std::to_string(value.size());
  } else {
    return "something else";
  }
}

int main() {
  std::cout << describe(42) << "\n";
  std::cout << describe(3.14) << "\n";
  std::cout << describe(std::string{"hello"}) << "\n";
  std::cout << describe('c') << "\n";
}
```

A plain `if` would require every branch to compile for every `T` — `value.size()` on an `int` would be an error even though it never runs.

## Specialisation

```cpp
#include <iostream>
#include <string>

template <typename T>
struct Describe {
  static std::string text() { return "some type"; }
};

template <>
struct Describe<bool> {
  static std::string text() { return "a bool"; }
};

template <>
struct Describe<std::string> {
  static std::string text() { return "a string"; }
};

template <typename T>
struct Describe<T*> {                 // partial specialisation: any pointer
  static std::string text() { return "a pointer to " + Describe<T>::text(); }
};

int main() {
  std::cout << Describe<int>::text() << "\n";
  std::cout << Describe<bool>::text() << "\n";
  std::cout << Describe<std::string>::text() << "\n";
  std::cout << Describe<int*>::text() << "\n";
  std::cout << Describe<std::string*>::text() << "\n";
}
```

## Variadic templates

```cpp
#include <iostream>
#include <string>

// A fold expression: the whole pack in one line.
template <typename... Args>
auto sum(Args... values) {
  return (values + ...);
}

template <typename... Args>
void printAll(const Args&... values) {
  ((std::cout << values << ' '), ...);
  std::cout << "\n";
}

template <typename... Args>
bool allTrue(Args... values) {
  return (values && ...);
}

template <typename... Args>
std::size_t howMany(const Args&...) {
  return sizeof...(Args);       // the pack's size, at compile time
}

int main() {
  std::cout << sum(1, 2, 3, 4, 5) << "\n";
  std::cout << sum(1.5, 2.5) << "\n";
  printAll(1, "two", 3.0, 'f');
  std::cout << std::boolalpha << allTrue(true, true, false) << "\n";
  std::cout << howMany(1, 'a', 2.0, "four") << " arguments\n";
}
```

Fold expressions (C++17) replaced the old recursive "head plus tail" pattern that variadic templates used to require.

## Templates live in headers

A template is only compiled when instantiated, so the compiler needs its full definition at every use. That is why template code lives in headers — and why a heavily templated codebase compiles slowly.

```cpp
#include <iostream>

// In a header, this is fine: templates are exempt from the One Definition Rule.
template <typename T>
constexpr T square(T value) { return value * value; }

int main() {
  std::cout << square(7) << ' ' << square(1.5) << "\n";
  static_assert(square(4) == 16);
}
```

> 💡 **Tip:** When a template is used with only a handful of types, an *explicit instantiation* in one `.cpp` (`template class Stack<int>;`) moves the compilation cost out of every translation unit. For a widely-included header this can cut build times substantially.

**Reference:** [Templates](https://en.cppreference.com/w/cpp/language/templates) and [Constraints and concepts](https://en.cppreference.com/w/cpp/language/constraints) on cppreference.
