---
title: Structs and classes
section: 3 · Functions & objects
---

A `struct` groups related values into one type, so you can pass them around together instead of juggling parallel variables.

```cpp
#include <iostream>
#include <string>

struct Book {
  std::string title;
  int pages;
};

int main() {
  Book dune{"Dune", 412};

  std::cout << dune.title << " has " << dune.pages << " pages\n";
  dune.pages = 500;
  std::cout << dune.pages << "\n";
}
```

The braces fill the members **in declaration order** — that's *aggregate initialization*. You can name them too, which survives a reordering of the struct and reads better at the call site:

```cpp
#include <iostream>
#include <string>

struct Book {
  std::string title;
  int pages = 0;          // a default for members that are left out
};

int main() {
  Book a{.title = "Dune", .pages = 412};
  Book b{.title = "Untitled"};          // pages falls back to 0

  std::cout << a.pages << " " << b.pages << "\n";
}
```

A struct is a value: assigning one copies every member, and passing one by value copies it too. Take a `const Book&` when a function only needs to read it.

```cpp
#include <iostream>
#include <string>

struct Book {
  std::string title;
  int pages = 0;
};

void describe(const Book& b) {
  std::cout << b.title << " (" << b.pages << ")\n";
}

int main() {
  Book original{"Dune", 412};
  Book copy = original;       // a full copy, not a reference
  copy.title = "Messiah";

  describe(original);
  describe(copy);
}
```

## Member functions

A type can carry the operations that belong to it. Inside a member function the members are in scope by name:

```cpp
#include <iostream>
#include <string>

struct Book {
  std::string title;
  int pages = 0;

  bool is_long() const {          // const: doesn't modify the book
    return pages > 300;
  }

  void add_chapter(int length) {  // not const: it changes pages
    pages += length;
  }
};

int main() {
  Book b{"Dune", 412};
  b.add_chapter(20);
  std::cout << std::boolalpha << b.is_long() << " " << b.pages << "\n";
}
```

> 💡 **Tip:** mark every member function that doesn't modify the object `const`. Without it, the function can't be called on a `const Book&` — which is how most functions receive one.

## class and constructors

`class` and `struct` are the same feature with one difference: members of a `struct` are `public` by default, members of a `class` are `private`. Use a `class` when the data has an invariant to protect — a rule that must always hold.

```cpp
#include <iostream>

class Counter {
 public:
  explicit Counter(int start) : count_{start} {}   // constructor

  void increment() { ++count_; }
  int value() const { return count_; }

 private:
  int count_ = 0;                                   // only Counter touches this
};

int main() {
  Counter c{5};
  c.increment();
  c.increment();
  std::cout << c.value() << "\n";
  // c.count_ = 100;   // compile error: private
}
```

- The **constructor** has the class's name and no return type. It runs when an object is created.
- `: count_{start}` is the *member initializer list*. It initializes members directly; assigning inside the body would default-construct them first.
- `explicit` stops silent conversions, so a stray `Counter c = 5;` doesn't compile.

## Putting it together

```cpp
#include <iostream>
#include <string>
#include <vector>

class Shelf {
 public:
  void add(const std::string& title, int pages) {
    titles_.push_back(title);
    total_pages_ += pages;
  }

  std::size_t size() const { return titles_.size(); }
  int total_pages() const { return total_pages_; }

 private:
  std::vector<std::string> titles_;
  int total_pages_ = 0;
};

int main() {
  Shelf shelf;
  shelf.add("Dune", 412);
  shelf.add("Neuromancer", 271);

  std::cout << shelf.size() << " books, " << shelf.total_pages() << " pages\n";
}
```

`total_pages_` can never drift out of step with the titles, because nothing outside the class can change it. That's the whole point of `private`.

> 💡 **Tip:** a trailing underscore (`count_`) is one common way to mark a private member. Pick a convention and keep it consistent.

## Challenge

> 🎯 **Challenge:** Define a `struct Book` with a `std::string title` and an `int pages`, create one holding `"Dune"` and `412`, and print exactly `Dune has 412 pages`.

```cpp starter
#include <iostream>
#include <string>

// define struct Book here

int main() {
  // create a Book and print its title and pages
}
```

```cpp solution
#include <iostream>
#include <string>

struct Book {
  std::string title;
  int pages = 0;
};

int main() {
  Book dune{"Dune", 412};
  std::cout << dune.title << " has " << dune.pages << " pages\n";
}
```

```cpp check
    Book b{"Test", 7};
    expect(b.title == "Test" && b.pages == 7, "Book needs a string title and an int pages");
    expect(output.size() == 1, "Print one line");
    expect(output[0] == "Dune has 412 pages", "Print exactly: Dune has 412 pages");
```

```quiz
? easy: What does this print?
~~~cpp
#include <iostream>
#include <string>

struct Book {
  std::string title;
  int pages;
};

int main() {
  Book b{"Dune", 412};
  std::cout << b.pages << "\n";
}
~~~
+ 412
- Dune
- 0
- It doesn't compile
> Brace initialization fills the members in declaration order, so `title` gets "Dune" and `pages` gets 412.
? easy: What is the only real difference between `struct` and `class`?
+ Members are public by default in a `struct`, private in a `class`
- A `class` can have member functions, a `struct` can't
- A `struct` can't have constructors
- A `class` is always allocated on the heap
> Everything else is identical. Which keyword you use is a signal to the reader about how the type is meant to be used.
? easy: How do you read a member of an object called `b`?
+ `b.pages`
- `b->pages`
- `b::pages`
- `pages(b)`
> The dot works on an object. `->` is for a pointer to one, and `::` names something inside a type or namespace.
? medium: What does this print?
~~~cpp
#include <iostream>
#include <string>

struct Book {
  std::string title;
  int pages = 0;
};

int main() {
  Book a{"Dune", 412};
  Book b = a;
  b.pages = 1;
  std::cout << a.pages << " " << b.pages << "\n";
}
~~~
+ 412 1
- 1 1
- 412 412
- 0 1
> `Book b = a;` copies every member. To share one object, take a reference: `Book& b = a;`.
? medium: Why mark a member function `const`?
+ So it can be called on a `const` object or a `const` reference
- To make it run faster
- To stop it being overloaded
- To make its return value constant
> A `const` member function promises not to modify the object, and only such functions may be called through a `const Book&` — which is how most code receives one.
? medium: What does `: count_{start}` do in a constructor?
+ It initializes the member `count_` with `start` before the body runs
- It declares a new local variable
- It calls a function named `count_`
- It's the return type of the constructor
> That's the member initializer list. Assigning in the body instead would first default-construct the member and then overwrite it.
? hard: What does this print?
~~~cpp
#include <iostream>

class Counter {
 public:
  explicit Counter(int start) : count_{start} {}
  void increment() { ++count_; }
  int value() const { return count_; }

 private:
  int count_ = 0;
};

int main() {
  Counter c{5};
  c.increment();
  c.increment();
  std::cout << c.value() << "\n";
}
~~~
+ 7
- 5
- 2
- 0
> The constructor starts the count at 5 and each `increment()` adds one. The member initializer wins over the `= 0` default.
? hard: What happens with `c.count_ = 100;` from `main`, where `count_` is private?
+ A compile error
- It works, but only inside the same file
- It silently creates a new variable
- It works because `main` is a friend of every class
> Access control is checked at compile time. The point of `private` is that the class's own functions are the only way to change it.
? hard: Why does `explicit` matter on `Counter(int)`?
+ It stops an `int` converting into a `Counter` implicitly
- It makes the constructor run faster
- It forces callers to use braces
- It makes the constructor public
> Without it, `Counter c = 5;` and a call like `takes_counter(5)` would compile. `explicit` keeps the conversion where you can see it.
```

**Reference:** [Classes](https://en.cppreference.com/w/cpp/language/classes) on cppreference.
