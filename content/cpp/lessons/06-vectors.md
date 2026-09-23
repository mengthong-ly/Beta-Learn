---
title: Vectors
section: 2 · Data
---

`std::vector` from `<vector>` is the container you should reach for first: a sequence that grows and shrinks at runtime, stores its elements next to each other in memory, and cleans up after itself.

```cpp
#include <iostream>
#include <vector>

int main() {
  std::vector<int> scores{90, 74, 88};

  scores.push_back(61);
  std::cout << scores.size() << " scores, first " << scores.front()
            << ", last " << scores.back() << "\n";
}
```

The `<int>` is the element type — a vector holds one type, decided at compile time. `std::vector<std::string>`, `std::vector<double>` and `std::vector<std::vector<int>>` all work the same way.

## Creating one

```cpp
#include <iostream>
#include <string>
#include <vector>

int main() {
  std::vector<int> empty;              // no elements
  std::vector<int> listed{1, 2, 3};    // these three elements
  std::vector<int> sized(4);           // four elements, each 0
  std::vector<int> filled(3, 7);       // three elements, each 7
  std::vector<std::string> words{"a", "b"};

  std::cout << empty.size() << " " << listed.size() << " " << sized.size()
            << " " << filled[0] << " " << words[1] << "\n";
}
```

> ⚠️ **Gotcha:** braces and parentheses mean different things here. `std::vector<int> v{4}` is *one* element with the value 4; `std::vector<int> v(4)` is *four* elements with the value 0.

## Reading and writing

```cpp
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{10, 20, 30};

  v[1] = 25;
  std::cout << v[0] << " " << v.at(1) << " " << v[2] << "\n";
  std::cout << std::boolalpha << v.empty() << " " << v.size() << "\n";
}
```

`v[i]` doesn't check the index. `v.at(i)` does, and throws `std::out_of_range` if it's wrong. Reading `v[5]` of a three-element vector is undefined behaviour: it may print garbage, corrupt memory, or appear to work.

> ℹ️ **In ThongLearn:** the in-browser clang has exceptions switched off, so a bad `at()` here stops the program instead of throwing a catchable `std::out_of_range`. Either way it tells you; `v[5]` is the one that stays quiet.

## Looping

The range-based `for` is the normal way to visit every element:

```cpp
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{3, 1, 4};
  int total = 0;

  for (int x : v) {
    total += x;
  }
  for (int& x : v) {      // a reference: writes go into the vector
    x *= 2;
  }

  std::cout << total << " " << v[0] << v[1] << v[2] << "\n";
}
```

When you genuinely need the position, index with an unsigned type so the comparison with `size()` doesn't warn:

```cpp
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{5, 6, 7};

  for (std::size_t i = 0; i < v.size(); ++i) {
    std::cout << i << ":" << v[i] << " ";
  }
  std::cout << "\n";
}
```

## Growing and shrinking

```cpp
#include <iostream>
#include <string>
#include <vector>

int main() {
  std::vector<std::string> queue;

  queue.push_back("ada");
  queue.emplace_back("alan");       // builds the string in place, no temporary
  queue.pop_back();                 // removes the last element
  queue.insert(queue.begin(), "grace");

  for (const std::string& name : queue) {
    std::cout << name << " ";
  }
  std::cout << "\n" << queue.size() << "\n";

  queue.clear();
  std::cout << std::boolalpha << queue.empty() << "\n";
}
```

> ⚠️ **Gotcha:** `push_back` may move every element to a bigger block of memory. Any reference, pointer or iterator you were holding into the vector is then dangling. Don't keep one across a `push_back`.

## Algorithms

`<algorithm>` and `<numeric>` work on a **range**, given as a pair of iterators. `v.begin()` points at the first element and `v.end()` just past the last, which is why "not found" is spelled `v.end()`:

```cpp
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>

int main() {
  std::vector<int> v{4, 1, 9, 3};

  std::sort(v.begin(), v.end());
  int sum = std::accumulate(v.begin(), v.end(), 0);
  auto biggest = *std::max_element(v.begin(), v.end());
  bool has_nine = std::find(v.begin(), v.end(), 9) != v.end();

  for (int x : v) {
    std::cout << x << " ";
  }
  std::cout << "| " << sum << " " << biggest << " " << std::boolalpha << has_nine << "\n";
}
```

That's four lines you don't have to write, test or debug yourself. Reach for an algorithm before writing a raw loop.

## Passing a vector to a function

Same rule as strings: a `const` reference to read, a plain reference to modify. Passing by value copies every element.

```cpp
#include <iostream>
#include <vector>

int sum_of(const std::vector<int>& values) {
  int total = 0;
  for (int v : values) {
    total += v;
  }
  return total;
}

void double_all(std::vector<int>& values) {
  for (int& v : values) {
    v *= 2;
  }
}

int main() {
  std::vector<int> v{1, 2, 3};
  double_all(v);
  std::cout << sum_of(v) << "\n";
}
```

## Challenge

> 🎯 **Challenge:** `scores` holds `{90, 74, 88, 61}`. Print exactly `sum 313, max 90` — the total of all four, then the largest.

```cpp starter
#include <iostream>
#include <vector>

int main() {
  std::vector<int> scores{90, 74, 88, 61};
  // print the sum and the largest score
}
```

```cpp solution
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>

int main() {
  std::vector<int> scores{90, 74, 88, 61};
  int sum = std::accumulate(scores.begin(), scores.end(), 0);
  int max = *std::max_element(scores.begin(), scores.end());
  std::cout << "sum " << sum << ", max " << max << "\n";
}
```

```cpp check
    expect(output.size() == 1, "Print one line");
    expect(output[0] == "sum 313, max 90", "Print exactly: sum 313, max 90");
```

```quiz
? easy: What does this print?
~~~cpp
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{1, 2, 3};
  v.push_back(4);
  std::cout << v.size() << " " << v.back() << "\n";
}
~~~
+ 4 4
- 3 3
- 4 3
- 3 4
> `push_back` appends, so the vector holds four elements and the last one is the 4 that was just added.
? easy: Which header declares `std::vector`?
+ `<vector>`
- `<array>`
- `<algorithm>`
- `<iostream>`
> Each container has its own header; the algorithms that work on them live in `<algorithm>`.
? easy: What is the index of the first element of a vector?
+ 0
- 1
- -1
- `begin`
> Indexes run from `0` to `size() - 1`, which is why loops are written `i < size()`.
? medium: What is the difference between `std::vector<int> a{4};` and `std::vector<int> b(4);`?
+ `a` has one element (4); `b` has four elements (all 0)
- They are identical
- `a` has four elements; `b` has one
- `b` doesn't compile
> Braces are an initializer list of elements. Parentheses call the constructor that takes a size.
? medium: What does this print?
~~~cpp
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{1, 2, 3};
  for (int& x : v) {
    x += 10;
  }
  std::cout << v[0] << " " << v[2] << "\n";
}
~~~
+ 11 13
- 1 3
- 11 11
- 10 10
> `int&` binds to the element itself, so the additions land in the vector. A plain `int x` would modify a copy.
? medium: What does `v.at(9)` do on a vector with 3 elements?
+ Throws `std::out_of_range`
- Returns 0
- Silently reads whatever is in memory
- Grows the vector to 10 elements
> `at` is the checked accessor. `v[9]` is the unchecked one, and that's the undefined-behaviour path.
? hard: What does this print?
~~~cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{4, 1, 9, 3};
  std::sort(v.begin(), v.end());
  std::cout << v.front() << " " << v.back() << "\n";
}
~~~
+ 1 9
- 4 3
- 9 1
- 1 3
> `std::sort` orders the range ascending in place, so the smallest is at the front and the largest at the back.
? hard: Why can a reference into a vector become invalid after `push_back`?
+ Growing may move every element to a new block of memory
- `push_back` erases the other elements
- References to container elements are never valid
- Only iterators are affected, not references
> A vector keeps its elements contiguous. When it outgrows its buffer it allocates a bigger one and moves everything, leaving old references, pointers and iterators dangling.
? hard: What does this print?
~~~cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{2, 5, 8};
  bool found = std::find(v.begin(), v.end(), 4) != v.end();
  std::cout << std::boolalpha << found << "\n";
}
~~~
+ false
- true
- 0
- It doesn't compile
> `std::find` returns `end()` when there's no match, and `end()` is one past the last element — a position, not a value.
```

**Reference:** [std::vector](https://en.cppreference.com/w/cpp/container/vector) on cppreference.
