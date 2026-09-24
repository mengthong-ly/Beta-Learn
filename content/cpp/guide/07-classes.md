---
title: Classes & inheritance
section: Guide Book
summary: Access control, constructors and member initialisation, virtual dispatch and the vtable, and when inheritance is the wrong tool.
---
## A class

```cpp-snippet
#include <iostream>
#include <string>
#include <stdexcept>

class Account {
 public:
  explicit Account(std::string owner, int initial = 0)
      : owner_(std::move(owner)), balance_(initial) {}

  void deposit(int amount) {
    if (amount <= 0) throw std::invalid_argument("deposit must be positive");
    balance_ += amount;
  }

  bool withdraw(int amount) {
    if (amount > balance_) return false;
    balance_ -= amount;
    return true;
  }

  int balance() const { return balance_; }            // const: does not modify
  const std::string& owner() const { return owner_; }

 private:
  std::string owner_;
  int balance_;
};

int main() {
  Account account{"Ada", 100};
  account.deposit(50);

  std::cout << account.owner() << " has " << account.balance() << "\n";
  std::cout << "withdraw 500: " << std::boolalpha << account.withdraw(500) << "\n";
  std::cout << "withdraw 50:  " << account.withdraw(50) << "\n";
  std::cout << "balance now " << account.balance() << "\n";
}
```

`struct` and `class` differ in exactly one way: `struct` members default to `public`, `class` members to `private`. Convention uses `struct` for plain data and `class` for anything with invariants.

## The member initialiser list

```cpp
#include <iostream>
#include <string>

class Widget {
 public:
  // Members are initialised HERE, before the body runs, in declaration order.
  Widget(std::string name, int size)
      : name_(std::move(name)), size_(size), area_(size * size) {
    std::cout << "  body runs after every member is built\n";
  }

  void describe() const {
    std::cout << name_ << ": size " << size_ << ", area " << area_ << "\n";
  }

 private:
  std::string name_;   // order here decides initialisation order…
  int size_;
  int area_;
};

int main() {
  Widget w{"square", 4};
  w.describe();
}
```

> ⚠️ Members are initialised in **declaration order**, not in the order you write them in the initialiser list. Writing `: area_(size * size), size_(size)` initialises `area_` first, using an uninitialised `size_`. Compile with `-Wall` and the compiler warns — which is one more reason to turn warnings into errors.

Assigning in the body is not initialisation: it default-constructs the member first, then overwrites it. For a `const` member or a reference member, the body is not even an option.

## `explicit`

```cpp
#include <iostream>

struct Implicit {
  Implicit(int n) : value(n) {}      // no explicit
  int value;
};

struct Explicit {
  explicit Explicit(int n) : value(n) {}
  int value;
};

void takesImplicit(Implicit i) { std::cout << "  implicit: " << i.value << "\n"; }
void takesExplicit(Explicit e) { std::cout << "  explicit: " << e.value << "\n"; }

int main() {
  takesImplicit(42);                 // compiles: 42 silently becomes an Implicit
  takesExplicit(Explicit{42});       // must be written out
  std::cout << "explicit stops surprising conversions at call sites\n";
}
```

Mark every single-argument constructor `explicit` unless the implicit conversion is genuinely wanted. `std::string s = 'x';` failing to compile is a feature.

## Static members

```cpp
#include <iostream>

class Counter {
 public:
  Counter() { ++liveCount_; }
  ~Counter() { --liveCount_; }

  static int liveCount() { return liveCount_; }
  static constexpr int limit = 10;

 private:
  inline static int liveCount_ = 0;   // inline: defined here, in the header
};

int main() {
  std::cout << "live: " << Counter::liveCount() << "\n";
  {
    Counter a, b, c;
    std::cout << "live: " << Counter::liveCount() << "\n";
  }
  std::cout << "live: " << Counter::liveCount() << "\n";
  std::cout << "limit: " << Counter::limit << "\n";
}
```

`inline static` (C++17) lets a static data member be initialised in the class definition, which removes the old requirement for a separate definition in a `.cpp`.

## Inheritance and virtual dispatch

```cpp
#include <iostream>
#include <memory>
#include <vector>
#include <numbers>

class Shape {
 public:
  virtual ~Shape() = default;              // essential — see below
  virtual double area() const = 0;         // pure virtual: no body, abstract class
  virtual std::string name() const { return "shape"; }

  void describe() const {                  // non-virtual: shared behaviour
    std::cout << name() << " with area " << area() << "\n";
  }
};

class Square : public Shape {
 public:
  explicit Square(double side) : side_(side) {}
  double area() const override { return side_ * side_; }
  std::string name() const override { return "square"; }

 private:
  double side_;
};

class Circle : public Shape {
 public:
  explicit Circle(double radius) : radius_(radius) {}
  double area() const override { return std::numbers::pi * radius_ * radius_; }
  std::string name() const override { return "circle"; }

 private:
  double radius_;
};

int main() {
  std::vector<std::unique_ptr<Shape>> shapes;
  shapes.push_back(std::make_unique<Square>(3));
  shapes.push_back(std::make_unique<Circle>(1));

  for (const auto& shape : shapes) {
    shape->describe();                     // dispatches to the real type
  }
}
```

> 🔍 **Behind the scenes: the vtable**
>
> A class with any virtual function gains a hidden pointer to a **vtable** — a per-class array of function addresses. A virtual call reads that pointer, indexes the table and jumps, which costs an indirection and blocks inlining. That is the price of runtime polymorphism, and it is why C++ makes it opt-in: a non-virtual call is a direct jump the optimiser can inline away entirely.

## The virtual destructor rule

```cpp
#include <iostream>
#include <memory>

struct BaseNoVirtual {
  ~BaseNoVirtual() { std::cout << "  ~BaseNoVirtual\n"; }
};

struct DerivedNoVirtual : BaseNoVirtual {
  ~DerivedNoVirtual() { std::cout << "  ~DerivedNoVirtual\n"; }
};

struct Base {
  virtual ~Base() { std::cout << "  ~Base\n"; }
};

struct Derived : Base {
  ~Derived() override { std::cout << "  ~Derived\n"; }
};

int main() {
  std::cout << "with a virtual destructor:\n";
  { std::unique_ptr<Base> p = std::make_unique<Derived>(); }

  std::cout << "deleting a Derived through a Base* WITHOUT a virtual "
               "destructor is undefined behaviour\n";

  std::cout << "concrete type, no polymorphism needed:\n";
  { DerivedNoVirtual d; }
}
```

The rule: **if a class has any virtual function, give it a virtual destructor** — or make the destructor `protected` so nobody can delete through the base pointer.

## `override` and `final`

```cpp
#include <iostream>

struct Base {
  virtual ~Base() = default;
  virtual void doWork(int) { std::cout << "  Base::doWork\n"; }
  virtual void locked() { std::cout << "  Base::locked\n"; }
};

struct Derived : Base {
  void doWork(int) override { std::cout << "  Derived::doWork\n"; }
  void locked() final { std::cout << "  Derived::locked\n"; }   // no further overrides
};

int main() {
  Derived d;
  Base& b = d;
  b.doWork(1);
  b.locked();
}
```

`override` is not decoration: without it, `void doWork(long)` in the derived class silently *hides* the base's method instead of overriding it, and calls through a base reference go to the base version. Always write it.

## Composition over inheritance

```cpp
#include <iostream>
#include <string>
#include <functional>
#include <vector>

// Inheritance: an Engine IS-A thing you extend. Rigid.
// Composition: a Car HAS-A Engine. Swappable, testable.
class Engine {
 public:
  explicit Engine(int power) : power_(power) {}
  int power() const { return power_; }

 private:
  int power_;
};

class Car {
 public:
  Car(std::string model, Engine engine)
      : model_(std::move(model)), engine_(engine) {}

  void describe() const {
    std::cout << model_ << " with " << engine_.power() << "hp\n";
  }

 private:
  std::string model_;
  Engine engine_;
};

int main() {
  Car{"Hatchback", Engine{90}}.describe();
  Car{"Saloon", Engine{190}}.describe();

  // For behaviour that varies, std::function beats a class hierarchy:
  std::vector<std::function<int(int)>> transforms{
      [](int n) { return n * 2; },
      [](int n) { return n + 10; },
  };
  for (const auto& f : transforms) std::cout << f(5) << ' ';
  std::cout << "\n";
}
```

> 💡 **Tip:** Public inheritance means "is substitutable for". If a `Derived` cannot be used everywhere a `Base` can — the Liskov substitution principle — you wanted composition, a member, or a template. Inheritance for code reuse alone is the most common design mistake in C++.

**Reference:** [Classes](https://en.cppreference.com/w/cpp/language/classes) and [Virtual functions](https://en.cppreference.com/w/cpp/language/virtual) on cppreference.
