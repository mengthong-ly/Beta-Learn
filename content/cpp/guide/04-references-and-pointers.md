---
title: References & pointers
section: Guide Book
summary: The difference between a second name and an address, `const` in all its positions, and how to choose a parameter type.
---
## A reference is another name

```cpp
#include <iostream>

int main() {
  int value = 10;
  int& alias = value;      // alias IS value, under a different name

  alias = 20;
  std::cout << value << ' ' << alias << "\n";

  ++value;
  std::cout << value << ' ' << alias << "\n";

  std::cout << "same address: " << std::boolalpha
            << (&value == &alias) << "\n";
}
```

A reference must be initialised, can never be reseated, and can never be null. There is no "reference arithmetic" and nothing to dereference.

## A pointer is an address

```cpp
#include <iostream>

int main() {
  int a = 10;
  int b = 20;

  int* p = &a;             // p holds a's address
  std::cout << *p << "\n"; // dereference to reach the value

  *p = 15;                 // write through the pointer
  std::cout << a << "\n";

  p = &b;                  // reseat: pointers can change target
  std::cout << *p << "\n";

  p = nullptr;             // and can point at nothing
  std::cout << "null: " << std::boolalpha << (p == nullptr) << "\n";
}
```

| | Reference | Pointer |
| --- | --- | --- |
| Must be initialised | yes | no |
| Can be reseated | no | yes |
| Can be null | no | yes |
| Syntax to use | just the name | `*p`, `p->member` |
| Use for | "this must exist" | "this may be absent", or ownership |

> 💡 **Tip:** Default to a reference. Reach for a pointer only when you need one of the two things a reference cannot do: represent absence, or be reseated. For "may be absent" on a *value*, `std::optional` says it better than a pointer does.

## `const` in every position

```cpp
#include <iostream>

int main() {
  int a = 1;
  int b = 2;

  const int constant = 5;          // cannot change
  const int& readOnly = a;         // cannot change a THROUGH this name

  const int* pointerToConst = &a;  // cannot write *p
  int* const constPointer = &a;    // cannot reseat p
  const int* const both = &a;      // neither

  a = 10;                          // fine — a itself is not const
  std::cout << readOnly << ' ' << *pointerToConst << ' ' << *constPointer
            << ' ' << *both << ' ' << constant << ' ' << b << "\n";
}
```

Read the declaration **right to left**: `const int* p` is "p is a pointer to an int that is const"; `int* const p` is "p is a const pointer to an int".

```cpp
#include <iostream>

int main() {
  int a = 1;
  const int* pointerToConst = &a;
  *pointerToConst = 5; // error! read-only variable is not assignable
  std::cout << a << "\n";
}
```

## Choosing a parameter type

This is the decision you make most often in C++.

```cpp
#include <iostream>
#include <string>
#include <vector>

// Read-only, cheap to copy (int, double, a small struct): by value.
int doubled(int n) { return n * 2; }

// Read-only, expensive to copy: by const reference.
std::size_t countWords(const std::string& text) {
  std::size_t count = text.empty() ? 0 : 1;
  for (char c : text) {
    if (c == ' ') ++count;
  }
  return count;
}

// The function modifies the caller's object: by non-const reference.
void appendExclamation(std::string& text) { text += '!'; }

// The function takes ownership: by value, and move into place.
struct Holder {
  std::string owned;
  explicit Holder(std::string s) : owned(std::move(s)) {}
};

int main() {
  std::cout << doubled(21) << "\n";

  const std::string sentence = "the quick brown fox";
  std::cout << countWords(sentence) << " words\n";

  std::string greeting = "hello";
  appendExclamation(greeting);
  std::cout << greeting << "\n";

  Holder h{std::move(greeting)};
  std::cout << h.owned << " (moved in)\n";
}
```

| The function… | Take it as |
| --- | --- |
| reads a small value | by value: `int n` |
| reads a large object | `const T&` |
| modifies the caller's object | `T&` |
| stores a copy | `T` by value, then `std::move` |
| may or may not receive one | `const T*` or `std::optional<T>` |

## Arrays decay to pointers

```cpp
#include <iostream>
#include <array>
#include <span>

void takesPointer(const int* data, std::size_t size) {
  std::cout << "  pointer version, size passed separately: " << size << "\n";
  for (std::size_t i = 0; i < size; ++i) std::cout << "  " << data[i];
  std::cout << "\n";
}

void takesSpan(std::span<const int> values) {
  std::cout << "  span knows its own size: " << values.size() << "\n";
  for (int v : values) std::cout << "  " << v;
  std::cout << "\n";
}

int main() {
  int raw[4]{1, 2, 3, 4};
  std::array<int, 4> modern{1, 2, 3, 4};

  std::cout << "sizeof(raw) here: " << sizeof(raw) << " bytes\n";
  takesPointer(raw, 4);
  takesSpan(raw);
  takesSpan(modern);
}
```

> 🔍 **Behind the scenes: why `sizeof` lies inside a function**
>
> A C array passed to a function is not passed — it **decays** to a pointer to its first element, losing the length entirely. `sizeof(param)` then reports the size of a pointer, not of the array, which is the source of a long tradition of buffer bugs. `std::span` (C++20) is a pointer and a length travelling together: no copy, no decay, and range-based `for` works on it.

## Pointer arithmetic

```cpp
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{10, 20, 30, 40, 50};

  const int* begin = v.data();
  const int* end = begin + v.size();

  for (const int* p = begin; p != end; ++p) {
    std::cout << *p << ' ';
  }
  std::cout << "\n";

  std::cout << "distance: " << (end - begin) << "\n";
  std::cout << "third element: " << *(begin + 2) << "\n";
  std::cout << "same as: " << begin[2] << "\n";
}
```

`p + 1` advances by `sizeof(*p)` bytes, not one byte. Going past the end — even without dereferencing — is undefined behaviour; the one-past-the-end pointer is the only exception, and it exists so loops like the above can terminate.

## Reference members and dangling

```cpp
#include <iostream>
#include <string>

struct Borrower {
  const std::string& text;      // borrows — does NOT own
  explicit Borrower(const std::string& t) : text(t) {}
};

struct Owner {
  std::string text;             // owns — no lifetime question
  explicit Owner(std::string t) : text(std::move(t)) {}
};

int main() {
  const std::string source = "a long-lived string";

  Borrower borrower{source};
  std::cout << borrower.text << "\n";

  Owner owner{"an owned string"};
  std::cout << owner.text << "\n";

  std::cout << "Borrower is only safe while `source` outlives it;\n"
               "Owner is always safe, at the cost of one copy.\n";
}
```

> ⚠️ A reference member makes the class non-assignable and ties its lifetime to something outside it. Store by value unless you have measured that the copy matters and can prove the referent outlives the object.

**Reference:** [References](https://en.cppreference.com/w/cpp/language/reference) and [Pointers](https://en.cppreference.com/w/cpp/language/pointer) on cppreference.
