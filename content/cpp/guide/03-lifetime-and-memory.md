---
title: Objects, lifetime & memory
section: Guide Book
summary: Stack versus heap, scope and destruction order, dangling references, and the deterministic destruction that makes RAII possible.
---
C++'s defining feature is that **you know exactly when an object is destroyed**. No garbage collector decides later; destruction happens at a point you can point to in the source.

## Storage duration

```cpp
#include <iostream>
#include <string>

std::string global = "static storage — lives for the whole program";

void demo() {
  static int callCount = 0;     // static: initialised once, survives calls
  int local = 0;                // automatic: created and destroyed each call

  ++callCount;
  ++local;
  std::cout << "  call " << callCount << ", local is " << local << "\n";
}

int main() {
  std::cout << global << "\n";
  demo();
  demo();
  demo();
}
```

| Duration | Created | Destroyed |
| --- | --- | --- |
| automatic (local) | at the declaration | at the end of the enclosing scope |
| static / global | before `main` (or on first use) | after `main` returns |
| dynamic (`new`) | when you say | when you say — or never, if you forget |
| thread-local | per thread | when the thread ends |

## Scope and destruction order

Objects are destroyed in **reverse order of construction**, deterministically.

```cpp
#include <iostream>
#include <string>

struct Noisy {
  std::string name;
  explicit Noisy(std::string n) : name(std::move(n)) {
    std::cout << "  construct " << name << "\n";
  }
  ~Noisy() { std::cout << "  destruct  " << name << "\n"; }
};

int main() {
  std::cout << "entering main\n";
  Noisy first{"first"};
  {
    std::cout << "entering inner scope\n";
    Noisy inner{"inner"};
    std::cout << "leaving inner scope\n";
  }
  Noisy second{"second"};
  std::cout << "leaving main\n";
}
```

> 🔍 **Behind the scenes: reverse order is a correctness requirement**
>
> An object constructed later may depend on one constructed earlier — a connection built from a config, a lock guard taken after the mutex exists. Destroying in reverse order guarantees a dependency is still alive while its dependent is being torn down. This is also why it holds when an exception unwinds the stack: every fully-constructed object between the throw and the catch is destroyed, in reverse, before the handler runs.

## The stack

Locals live on the stack: allocation is moving a pointer, so it is essentially free.

```cpp
#include <iostream>
#include <array>

void frame(int depth) {
  std::array<int, 4> buffer{};   // on the stack
  buffer[0] = depth;
  std::cout << "depth " << depth << ", buffer[0] = " << buffer[0] << "\n";
  if (depth < 3) frame(depth + 1);
}

int main() {
  frame(1);
  std::cout << "every frame's buffer is gone now\n";
}
```

The stack is small — typically 1–8 MB — and it is why a large array should be a `std::vector` (heap) rather than a local `int data[1'000'000]` (stack overflow).

## The heap

```cpp
#include <iostream>
#include <memory>
#include <vector>

int main() {
  // Raw new/delete: you are responsible for every path out of the function.
  int* raw = new int{42};
  std::cout << "raw: " << *raw << "\n";
  delete raw;                     // forget this and it leaks

  // Almost always better:
  auto owned = std::make_unique<int>(42);
  std::cout << "unique_ptr: " << *owned << "\n";

  std::vector<int> v{1, 2, 3};    // manages its own heap buffer
  v.push_back(4);
  std::cout << "vector size " << v.size() << ", capacity " << v.capacity() << "\n";
}
```

> ⚠️ Modern C++ code should contain almost no `new` and essentially no `delete`. `std::vector`, `std::string`, `std::unique_ptr` and `std::shared_ptr` own their memory and release it in a destructor — which runs even when an exception unwinds past them. A bare `delete` is skipped by an early `return` or a `throw`; a destructor is not.

## Dangling: the mistake to internalise

```cpp
#include <iostream>
#include <string>

// Returns a reference to a local — the object is destroyed before the caller sees it.
const std::string& broken() {
  std::string local = "destroyed at the closing brace";
  return local;                      // the reference dangles immediately
}

std::string fixed() {
  std::string local = "returned by value — moved, not copied";
  return local;
}

int main() {
  std::cout << fixed() << "\n";
  std::cout << "returning a reference to a local is undefined behaviour;\n"
               "return by value instead — the move makes it free\n";
}
```

Four shapes of the same bug, worth recognising on sight:

```cpp
#include <iostream>
#include <string_view>
#include <vector>

int main() {
  // 1. A view outliving its owner.
  std::string_view view;
  {
    std::string owner = "temporary";
    view = owner;                    // view points into owner's buffer
  }                                  // owner destroyed — view now dangles
  std::cout << "a string_view must not outlive the string it views\n";

  // 2. Iterator invalidation.
  std::vector<int> v{1, 2, 3};
  auto it = v.begin();
  v.push_back(4);                    // may reallocate — `it` may now be invalid
  std::cout << "push_back can invalidate every iterator and reference\n";

  // 3. A pointer to a freed object.
  // 4. A lambda capturing a local by reference and outliving it.
  std::cout << "all four are the same mistake: a handle outliving its object\n";
}
```

> 🧭 **Scenario:** A function takes `const std::string&` and stores it in a member for later. It compiles, the tests pass — because the tests pass a long-lived string. In production a caller passes a temporary, the temporary dies at the end of the full expression, and the member references freed memory. The fix is to store a `std::string` by value: one copy, and no lifetime question at all.

## Temporaries and lifetime extension

```cpp
#include <iostream>
#include <string>

std::string make() { return "a temporary"; }

int main() {
  // Binding a temporary to a const reference extends its lifetime
  // to the lifetime of the reference.
  const std::string& extended = make();
  std::cout << extended << " — still alive\n";

  // But only for the temporary ITSELF, not for something it owns:
  // const char* c = make().c_str();   // dangles: the string dies at the semicolon
  std::string kept = make();
  const char* safe = kept.c_str();
  std::cout << safe << "\n";
}
```

## Value semantics

C++ variables *are* objects, not references to them. Assignment copies.

```cpp
#include <iostream>
#include <vector>

struct Point { int x, y; };

int main() {
  Point a{1, 2};
  Point b = a;        // a genuine copy
  b.x = 99;
  std::cout << "a.x = " << a.x << ", b.x = " << b.x << "\n";

  std::vector<int> v1{1, 2, 3};
  std::vector<int> v2 = v1;       // copies the whole buffer
  v2.push_back(4);
  std::cout << "v1 size " << v1.size() << ", v2 size " << v2.size() << "\n";

  std::vector<int>& alias = v1;   // a reference — another name, no copy
  alias.push_back(99);
  std::cout << "v1 size after modifying the alias: " << v1.size() << "\n";
}
```

This is the opposite of Java, Python and JavaScript, where a variable holds a handle. It is why C++ needs copy constructors, move constructors and the rule of five — all of which exist to make "assignment copies" affordable.

**Reference:** [Object lifetime](https://en.cppreference.com/w/cpp/language/lifetime) and [Storage duration](https://en.cppreference.com/w/cpp/language/storage_duration) on cppreference.
