---
title: RAII & smart pointers
section: Guide Book
summary: The idea that makes C++ safe without a garbage collector — tie every resource to an object's lifetime, and let the destructor do the rest.
---
**Resource Acquisition Is Initialisation**: acquire a resource in a constructor, release it in a destructor, and the language guarantees the release. It works for memory, files, locks, sockets, database handles — anything that must be given back.

## The problem RAII solves

```cpp
#include <iostream>
#include <stdexcept>

struct Resource {
  std::string name;
  explicit Resource(std::string n) : name(std::move(n)) {
    std::cout << "  acquired " << name << "\n";
  }
  ~Resource() { std::cout << "  released " << name << "\n"; }
};

void manual(bool fail) {
  Resource* r = new Resource{"manual"};
  if (fail) {
    // Every early exit must remember to clean up. Miss one and it leaks.
    delete r;
    std::cout << "  early return — remembered the delete this time\n";
    return;
  }
  delete r;
}

void automatic(bool fail) {
  Resource r{"automatic"};
  if (fail) {
    std::cout << "  early return — nothing to remember\n";
    return;                    // destructor runs here
  }
}                              // …or here

int main() {
  std::cout << "manual:\n";
  manual(true);
  std::cout << "automatic:\n";
  automatic(true);
}
```

The RAII version has no cleanup code at all, and it is correct on *every* path — including one that throws.

```cpp
#include <iostream>
#include <stdexcept>

struct Guard {
  explicit Guard(const char* n) : name(n) { std::cout << "  acquire " << name << "\n"; }
  ~Guard() { std::cout << "  release " << name << "\n"; }
  const char* name;
};

void risky() {
  Guard a{"first"};
  Guard b{"second"};
  throw std::runtime_error("something failed");
}

int main() {
  try {
    risky();
  } catch (const std::exception& e) {
    std::cout << "caught: " << e.what() << "\n";
  }
}
```

> 🔍 **Behind the scenes: stack unwinding**
>
> When an exception propagates, the runtime walks back through each stack frame and calls the destructor of every **fully constructed** object in it, in reverse order, before looking for a handler. That is the entire mechanism behind exception safety in C++. It is also why a destructor must not throw: an exception escaping a destructor *during* unwinding leaves the runtime with two exceptions and no way to choose, so it calls `std::terminate`.

## `std::unique_ptr`

Sole ownership, zero overhead, move-only.

```cpp
#include <iostream>
#include <memory>

struct Node {
  int value;
  explicit Node(int v) : value(v) { std::cout << "  Node(" << value << ")\n"; }
  ~Node() { std::cout << "  ~Node(" << value << ")\n"; }
};

std::unique_ptr<Node> makeNode(int v) {
  return std::make_unique<Node>(v);     // moved out, never copied
}

int main() {
  auto a = makeNode(1);
  std::cout << "a holds " << a->value << "\n";

  auto b = std::move(a);                // ownership transfers
  std::cout << "a is now null: " << std::boolalpha << (a == nullptr) << "\n";
  std::cout << "b holds " << b->value << "\n";

  b.reset();                            // destroy early, explicitly
  std::cout << "after reset, b is null: " << (b == nullptr) << "\n";

  {
    auto scoped = makeNode(2);
  }                                     // destroyed here
  std::cout << "left the scope\n";
}
```

```cpp
#include <memory>

int main() {
  auto a = std::make_unique<int>(1);
  auto b = a; // error! call to implicitly-deleted copy constructor of 'std::unique_ptr<int>'
  return *b;
}
```

`unique_ptr` is the same size as a raw pointer and compiles to the same code. There is no reason to use `new`/`delete` for single ownership.

## `std::shared_ptr`

Shared ownership via a reference count. The object dies when the last owner does.

```cpp
#include <iostream>
#include <memory>

struct Shared {
  int id;
  explicit Shared(int i) : id(i) { std::cout << "  Shared(" << id << ")\n"; }
  ~Shared() { std::cout << "  ~Shared(" << id << ")\n"; }
};

int main() {
  auto a = std::make_shared<Shared>(1);
  std::cout << "count: " << a.use_count() << "\n";

  {
    auto b = a;                       // a copy shares ownership
    std::cout << "count: " << a.use_count() << "\n";
  }                                   // b gone

  std::cout << "count: " << a.use_count() << "\n";
  std::cout << "leaving main\n";
}
```

> ⚠️ `shared_ptr` is not free: it allocates a control block, and every copy and destruction is an atomic increment or decrement. Reach for `unique_ptr` first and `shared_ptr` only when ownership genuinely *is* shared and you cannot say who the last owner will be.

## Reference cycles and `weak_ptr`

```cpp
#include <iostream>
#include <memory>

struct Child;

struct Parent {
  std::shared_ptr<Child> child;
  ~Parent() { std::cout << "  ~Parent\n"; }
};

struct Child {
  std::weak_ptr<Parent> parent;      // weak: does NOT keep the parent alive
  ~Child() { std::cout << "  ~Child\n"; }
};

int main() {
  {
    auto parent = std::make_shared<Parent>();
    auto child = std::make_shared<Child>();
    parent->child = child;
    child->parent = parent;

    std::cout << "parent use_count: " << parent.use_count() << "\n";

    if (auto locked = child->parent.lock()) {
      std::cout << "locked the weak_ptr successfully\n";
    }
  }
  std::cout << "both destroyed — no cycle, because the back-pointer is weak\n";
}
```

Two `shared_ptr`s pointing at each other keep each other's count at 1 forever — a leak that a reference count cannot detect. Make one direction `weak_ptr` and the cycle is broken.

## Custom deleters

RAII is not only about memory.

```cpp
#include <iostream>
#include <memory>

struct Connection {
  int id;
};

void closeConnection(Connection* c) {
  std::cout << "  closing connection " << c->id << "\n";
  delete c;
}

int main() {
  {
    std::unique_ptr<Connection, decltype(&closeConnection)> conn{
        new Connection{7}, &closeConnection};
    std::cout << "using connection " << conn->id << "\n";
  }
  std::cout << "connection closed automatically\n";
}
```

The standard library ships RAII wrappers for the common cases: `std::lock_guard` and `std::scoped_lock` for mutexes, `std::fstream` for files, `std::jthread` for threads.

## Writing your own RAII type

```cpp
#include <iostream>
#include <utility>

class Buffer {
 public:
  explicit Buffer(std::size_t size) : size_(size), data_(new int[size]{}) {
    std::cout << "  allocated " << size_ << " ints\n";
  }

  ~Buffer() {
    delete[] data_;
    std::cout << "  freed " << size_ << " ints\n";
  }

  // Move: steal the pointer, leave the source empty but destructible.
  Buffer(Buffer&& other) noexcept
      : size_(std::exchange(other.size_, 0)), data_(std::exchange(other.data_, nullptr)) {}

  Buffer& operator=(Buffer&& other) noexcept {
    if (this != &other) {
      delete[] data_;
      size_ = std::exchange(other.size_, 0);
      data_ = std::exchange(other.data_, nullptr);
    }
    return *this;
  }

  // Copying a raw owning pointer would double-free. Forbid it explicitly.
  Buffer(const Buffer&) = delete;
  Buffer& operator=(const Buffer&) = delete;

  std::size_t size() const { return size_; }
  int& operator[](std::size_t i) { return data_[i]; }

 private:
  std::size_t size_;
  int* data_;
};

int main() {
  Buffer a{4};
  a[0] = 42;
  std::cout << "a[0] = " << a[0] << ", size " << a.size() << "\n";

  Buffer b = std::move(a);
  std::cout << "after move: a.size() = " << a.size() << ", b[0] = " << b[0] << "\n";
}
```

> 💡 **Tip:** The **rule of zero**: if you can express your class in terms of types that already manage themselves — `std::vector`, `std::string`, `std::unique_ptr` — then write no destructor, no copy and no move, and the compiler generates correct ones. The class above exists to show the mechanics; in real code it would hold a `std::vector<int>` and need none of it.

## `noexcept` on moves

```cpp
#include <iostream>
#include <vector>
#include <type_traits>

struct Movable {
  Movable() = default;
  Movable(Movable&&) noexcept {}
  Movable& operator=(Movable&&) noexcept { return *this; }
};

struct Throwing {
  Throwing() = default;
  Throwing(Throwing&&) {}                 // not noexcept
  Throwing& operator=(Throwing&&) { return *this; }
  Throwing(const Throwing&) = default;
};

int main() {
  std::cout << std::boolalpha;
  std::cout << "Movable move is noexcept:  "
            << std::is_nothrow_move_constructible_v<Movable> << "\n";
  std::cout << "Throwing move is noexcept: "
            << std::is_nothrow_move_constructible_v<Throwing> << "\n";
}
```

When a `std::vector` grows it must move its elements to the new buffer. If the move can throw, the vector cannot guarantee it could recover — so it **copies** instead. Marking a move constructor `noexcept` is what lets your type keep the fast path.

**Reference:** [RAII](https://en.cppreference.com/w/cpp/language/raii) and [Smart pointers](https://en.cppreference.com/w/cpp/memory) on cppreference.
