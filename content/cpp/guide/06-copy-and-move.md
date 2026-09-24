---
title: Copy, move & value semantics
section: Guide Book
summary: What the compiler generates for you, lvalues and rvalues, what `std::move` actually does, and the rule of five and zero.
---
## Copying is the default

```cpp
#include <iostream>
#include <string>
#include <vector>

struct Record {
  int id;
  std::string name;
  std::vector<int> scores;
};

int main() {
  Record a{1, "Ada", {10, 20}};
  Record b = a;                  // member-by-member copy

  b.id = 2;
  b.name = "Grace";
  b.scores.push_back(30);

  std::cout << a.id << ' ' << a.name << ' ' << a.scores.size() << "\n";
  std::cout << b.id << ' ' << b.name << ' ' << b.scores.size() << "\n";
}
```

The compiler wrote the copy constructor and copy assignment for you, and both are correct — because every member knows how to copy itself.

## lvalues and rvalues

```cpp
#include <iostream>
#include <string>

void takes(const std::string&) { std::cout << "  const lvalue ref\n"; }
void takes(std::string&&) { std::cout << "  rvalue ref\n"; }

std::string make() { return "temporary"; }

int main() {
  std::string named = "named";

  takes(named);              // an lvalue: it has a name and an address
  takes(make());             // an rvalue: a temporary, about to disappear
  takes("literal");          // an rvalue: a temporary std::string
  takes(std::move(named));   // an lvalue, cast to an rvalue reference
}
```

An **lvalue** has an identity you can take the address of. An **rvalue** is a temporary that is about to be destroyed anyway — which is why stealing from it is safe.

## What `std::move` does

Nothing. It is a cast.

```cpp
#include <iostream>
#include <string>
#include <utility>

int main() {
  std::string source = "a reasonably long string that will not fit in SSO";

  std::cout << "before: [" << source << "] size " << source.size() << "\n";

  std::string destination = std::move(source);

  std::cout << "after:  [" << source << "] size " << source.size() << "\n";
  std::cout << "moved:  [" << destination << "]\n";
}
```

`std::move(x)` produces an rvalue reference to `x`. The *move constructor* it selects is what steals the buffer. After a move, `source` is in a **valid but unspecified** state — you may assign to it or destroy it, but you should not assume what it contains.

> ⚠️ `std::move` on a `const` object silently does nothing: `const std::string&&` cannot bind to a move constructor, so the copy constructor is selected instead. A `const` member or a `const` local defeats every move you thought you were making.

```cpp
#include <iostream>
#include <string>
#include <utility>

struct Tracked {
  Tracked() = default;
  Tracked(const Tracked&) { std::cout << "  copy\n"; }
  Tracked(Tracked&&) noexcept { std::cout << "  move\n"; }
};

int main() {
  Tracked a;
  const Tracked b;

  std::cout << "moving a non-const:\n";
  Tracked c = std::move(a);

  std::cout << "moving a const:\n";
  Tracked d = std::move(b);      // silently copies
}
```

## The rule of five

If you write any one of these five, you probably need all five — because writing one means the compiler's generated versions are wrong.

```cpp
#include <iostream>
#include <utility>

class Owning {
 public:
  explicit Owning(std::size_t n) : size_(n), data_(new int[n]{}) {}

  ~Owning() { delete[] data_; }                                     // 1

  Owning(const Owning& other)                                       // 2
      : size_(other.size_), data_(new int[other.size_]) {
    for (std::size_t i = 0; i < size_; ++i) data_[i] = other.data_[i];
    std::cout << "  deep copy of " << size_ << "\n";
  }

  Owning& operator=(const Owning& other) {                          // 3
    if (this != &other) {
      Owning copy{other};        // copy-and-swap: exception-safe
      std::swap(size_, copy.size_);
      std::swap(data_, copy.data_);
    }
    return *this;
  }

  Owning(Owning&& other) noexcept                                   // 4
      : size_(std::exchange(other.size_, 0)),
        data_(std::exchange(other.data_, nullptr)) {
    std::cout << "  moved\n";
  }

  Owning& operator=(Owning&& other) noexcept {                      // 5
    if (this != &other) {
      delete[] data_;
      size_ = std::exchange(other.size_, 0);
      data_ = std::exchange(other.data_, nullptr);
    }
    return *this;
  }

  std::size_t size() const { return size_; }

 private:
  std::size_t size_;
  int* data_;
};

int main() {
  Owning a{3};
  Owning b = a;              // copy constructor
  Owning c = std::move(a);   // move constructor
  b = c;                     // copy assignment
  std::cout << "b.size() = " << b.size() << ", moved-from a.size() = " << a.size() << "\n";
}
```

> 🔍 **Behind the scenes: why declaring a destructor disables the moves**
>
> A user-declared destructor suppresses the implicit move constructor and move assignment. The reasoning: if you needed a custom destructor, the class manages something by hand, and a member-wise move is unlikely to be right. The consequence surprises people — adding an empty `~Thing() {}` to a class silently turns every move in your program into a copy, and the only symptom is that things got slower.

## The rule of zero

The better answer: own nothing directly, and write none of the five.

```cpp
#include <iostream>
#include <string>
#include <vector>
#include <memory>

// No destructor, no copy, no move — and every one of them is correct.
struct Document {
  std::string title;
  std::vector<std::string> lines;
  std::unique_ptr<int> optionalId;     // makes the class move-only
};

struct Simple {
  std::string title;
  std::vector<std::string> lines;
};

int main() {
  Simple a{"Report", {"line one", "line two"}};
  Simple b = a;                        // copies, correctly
  b.lines.push_back("line three");

  std::cout << a.lines.size() << ' ' << b.lines.size() << "\n";

  Document d{"Owned", {"x"}, std::make_unique<int>(7)};
  Document moved = std::move(d);       // moves, correctly
  std::cout << moved.title << ' ' << *moved.optionalId << "\n";
}
```

Every member manages itself, so the generated special members compose correctly. This is the shape almost all application code should have.

## `= default` and `= delete`

```cpp
#include <iostream>

struct Explicit {
  Explicit() = default;
  Explicit(const Explicit&) = default;
  Explicit& operator=(const Explicit&) = default;
  Explicit(Explicit&&) = default;
  Explicit& operator=(Explicit&&) = default;
  ~Explicit() = default;
};

struct NonCopyable {
  NonCopyable() = default;
  NonCopyable(const NonCopyable&) = delete;
  NonCopyable& operator=(const NonCopyable&) = delete;
  NonCopyable(NonCopyable&&) = default;
  NonCopyable& operator=(NonCopyable&&) = default;
};

int main() {
  Explicit a;
  Explicit b = a;

  NonCopyable c;
  NonCopyable d = std::move(c);   // move is fine
  std::cout << "compiled: copy deleted, move defaulted\n";
}
```

Spelling all six out — the "rule of six" some codebases follow — documents the intent and prevents the destructor trap above.

## Copy elision

```cpp
#include <iostream>
#include <string>

struct Loud {
  Loud() { std::cout << "  construct\n"; }
  Loud(const Loud&) { std::cout << "  copy\n"; }
  Loud(Loud&&) noexcept { std::cout << "  move\n"; }
  ~Loud() { std::cout << "  destruct\n"; }
};

Loud makeDirect() {
  return Loud{};             // guaranteed elision since C++17: built in place
}

Loud makeNamed() {
  Loud local;
  return local;              // NRVO: usually elided, otherwise moved
}

int main() {
  std::cout << "makeDirect:\n";
  Loud a = makeDirect();
  std::cout << "makeNamed:\n";
  Loud b = makeNamed();
  std::cout << "done\n";
}
```

> 💡 **Tip:** Return by value and let the compiler elide. `return std::move(local);` actively **prevents** named return value optimisation — the move is then mandatory where nothing at all would have happened. The only time to write `std::move` in a return is when returning a member or a parameter, which NRVO cannot apply to.

## Passing by value and moving in

```cpp
#include <iostream>
#include <string>
#include <utility>

class Person {
 public:
  // One signature, optimal for both lvalues and rvalues.
  explicit Person(std::string name) : name_(std::move(name)) {}

  const std::string& name() const { return name_; }

 private:
  std::string name_;
};

int main() {
  std::string existing = "Ada";

  Person a{existing};              // copies into the parameter, then moves in
  Person b{std::string{"Grace"}};  // moves into the parameter, then moves in
  Person c{"Linus"};               // constructs in place, then moves in

  std::cout << a.name() << ' ' << b.name() << ' ' << c.name() << "\n";
  std::cout << "existing is still: " << existing << "\n";
}
```

The "sink parameter" idiom: take by value, `std::move` into the member. One overload, never worse than a reference pair by more than one move.

**Reference:** [Move semantics](https://en.cppreference.com/w/cpp/language/move_constructor) and [Copy elision](https://en.cppreference.com/w/cpp/language/copy_elision) on cppreference.
