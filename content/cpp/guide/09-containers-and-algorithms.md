---
title: Containers & algorithms
section: Guide Book
summary: Choosing the right container, the iterator model that connects them to the algorithms, and the algorithms worth knowing by name.
---
## Choosing a container

| Container | Backed by | Lookup | Insert / erase | Use when |
| --- | --- | --- | --- | --- |
| `vector` | contiguous array | O(1) by index | O(1) at the end | **the default** |
| `array` | fixed C array | O(1) | — | size known at compile time |
| `deque` | chunks | O(1) | O(1) at both ends | a queue |
| `list` | doubly linked | O(n) | O(1) anywhere, given an iterator | almost never |
| `map` / `set` | red-black tree | O(log n) | O(log n) | sorted iteration needed |
| `unordered_map` / `unordered_set` | hash table | O(1) average | O(1) average | lookup by key |

```cpp
#include <iostream>
#include <vector>
#include <map>
#include <unordered_map>
#include <set>
#include <deque>

int main() {
  std::vector<int> v{3, 1, 2};
  std::deque<int> d{1, 2};
  std::set<int> s{3, 1, 2, 1};
  std::map<std::string, int> m{{"b", 2}, {"a", 1}};
  std::unordered_map<std::string, int> um{{"x", 1}, {"y", 2}};

  d.push_front(0);

  std::cout << "vector: ";
  for (int x : v) std::cout << x << ' ';
  std::cout << "\ndeque:  ";
  for (int x : d) std::cout << x << ' ';
  std::cout << "\nset (sorted, unique): ";
  for (int x : s) std::cout << x << ' ';
  std::cout << "\nmap (sorted by key):  ";
  for (const auto& [k, val] : m) std::cout << k << '=' << val << ' ';
  std::cout << "\nunordered_map size: " << um.size() << "\n";
}
```

> 💡 **Tip:** Use `std::vector` until you have measured a reason not to. Linked lists look better on paper — O(1) insertion — and lose badly in practice because every node is a separate allocation and a cache miss. A `vector` of 10,000 ints is one contiguous block the CPU prefetches perfectly.

## `vector` in detail

```cpp
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v;
  std::cout << "size " << v.size() << ", capacity " << v.capacity() << "\n";

  for (int i = 0; i < 5; ++i) {
    v.push_back(i);
    std::cout << "  after push " << i << ": size " << v.size()
              << ", capacity " << v.capacity() << "\n";
  }

  v.reserve(100);
  std::cout << "after reserve(100): capacity " << v.capacity() << "\n";

  v.emplace_back(99);              // constructs in place, no temporary
  std::cout << "front " << v.front() << ", back " << v.back() << "\n";
  std::cout << "at(2) " << v.at(2) << "\n";

  v.erase(v.begin() + 1);
  std::cout << "after erase: ";
  for (int x : v) std::cout << x << ' ';
  std::cout << "\n";
}
```

> ⚠️ `v[i]` does not bounds-check; `v.at(i)` throws `std::out_of_range`. Reading `v[99]` on a five-element vector is undefined behaviour, not a crash you can rely on. Any growth past the capacity **invalidates every iterator, pointer and reference** into the vector — which is why saving `v.begin()` across a `push_back` is a bug.

## Maps

```cpp
#include <iostream>
#include <map>
#include <unordered_map>
#include <string>

int main() {
  std::map<std::string, int> scores{{"ada", 10}, {"grace", 12}};

  scores["linus"] = 8;
  scores.insert({"alan", 9});
  scores.emplace("edsger", 7);

  // operator[] INSERTS a default-constructed value if the key is missing.
  std::cout << "missing key via []: " << scores["nobody"] << "\n";
  std::cout << "size is now " << scores.size() << " — [] inserted it\n";

  // The non-inserting lookups:
  if (auto it = scores.find("ada"); it != scores.end()) {
    std::cout << "found ada: " << it->second << "\n";
  }
  std::cout << "contains 'grace': " << std::boolalpha << scores.contains("grace") << "\n";

  for (const auto& [name, score] : scores) {
    std::cout << "  " << name << " = " << score << "\n";
  }
}
```

That `operator[]` behaviour is a genuine footgun: a read-looking expression mutates the map. Use `find`, `contains` or `at` when you only mean to read.

## Iterators

Every container exposes the same interface, and that is what lets one algorithm work on all of them.

```cpp
#include <iostream>
#include <vector>
#include <list>
#include <set>
#include <algorithm>

template <typename Container>
void printAll(const Container& c, const char* label) {
  std::cout << label << ": ";
  for (auto it = c.begin(); it != c.end(); ++it) std::cout << *it << ' ';
  std::cout << "\n";
}

int main() {
  std::vector<int> v{3, 1, 2};
  std::list<int> l{3, 1, 2};
  std::set<int> s{3, 1, 2};

  printAll(v, "vector");
  printAll(l, "list");
  printAll(s, "set");

  std::cout << "distance: " << std::distance(v.begin(), v.end()) << "\n";
  std::cout << "reverse:  ";
  for (auto it = v.rbegin(); it != v.rend(); ++it) std::cout << *it << ' ';
  std::cout << "\n";
}
```

A range is a half-open pair `[begin, end)`. `end()` points one past the last element, which is why `begin() == end()` means empty and why loops terminate cleanly.

## The algorithms

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>

int main() {
  std::vector<int> v{5, 3, 9, 1, 7, 3};

  std::sort(v.begin(), v.end());
  std::cout << "sorted:   ";
  for (int x : v) std::cout << x << ' ';
  std::cout << "\n";

  std::cout << "sum:      " << std::accumulate(v.begin(), v.end(), 0) << "\n";
  std::cout << "max:      " << *std::max_element(v.begin(), v.end()) << "\n";
  std::cout << "count(3): " << std::count(v.begin(), v.end(), 3) << "\n";
  std::cout << "any > 8:  " << std::boolalpha
            << std::any_of(v.begin(), v.end(), [](int n) { return n > 8; }) << "\n";
  std::cout << "binary_search(7): "
            << std::binary_search(v.begin(), v.end(), 7) << "\n";

  std::vector<int> doubled(v.size());
  std::transform(v.begin(), v.end(), doubled.begin(), [](int n) { return n * 2; });
  std::cout << "doubled:  ";
  for (int x : doubled) std::cout << x << ' ';
  std::cout << "\n";
}
```

## The erase-remove idiom

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
  std::vector<int> v{1, 2, 3, 4, 5, 6};

  // std::remove does NOT remove — it shuffles kept elements to the front
  // and returns the new logical end. erase does the actual removal.
  auto newEnd = std::remove_if(v.begin(), v.end(), [](int n) { return n % 2 == 0; });
  std::cout << "size before erase: " << v.size() << "\n";
  v.erase(newEnd, v.end());

  std::cout << "after: ";
  for (int x : v) std::cout << x << ' ';
  std::cout << "\n";

  // C++20 gives it a name:
  std::vector<int> w{1, 2, 3, 4, 5, 6};
  std::erase_if(w, [](int n) { return n % 2 == 0; });
  std::cout << "std::erase_if: ";
  for (int x : w) std::cout << x << ' ';
  std::cout << "\n";
}
```

> 🔍 **Behind the scenes: why `remove` cannot remove**
>
> An algorithm sees only a pair of iterators — it has no idea what container they came from, or whether one exists at all. It cannot call `erase`, because it cannot reach the container. So it does the only thing it can: rearrange elements within the range and report where the useful part ends. Understanding this explains the whole design of the algorithm library, and why `std::erase_if` (which *does* know the container) had to be a separate, container-aware function.

## Sorting with a comparator

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <string>

struct Person {
  std::string name;
  int age;
};

int main() {
  std::vector<Person> people{{"Ada", 36}, {"Grace", 85}, {"Linus", 54}};

  std::sort(people.begin(), people.end(),
            [](const Person& a, const Person& b) { return a.age > b.age; });

  for (const auto& p : people) std::cout << p.name << '(' << p.age << ") ";
  std::cout << "\n";

  std::stable_sort(people.begin(), people.end(),
                   [](const Person& a, const Person& b) { return a.name < b.name; });

  for (const auto& p : people) std::cout << p.name << ' ';
  std::cout << "\n";

  auto oldest = std::max_element(people.begin(), people.end(),
                                 [](const Person& a, const Person& b) { return a.age < b.age; });
  std::cout << "oldest: " << oldest->name << "\n";
}
```

A comparator must be a **strict weak ordering**: `comp(a, a)` must be false. Writing `<=` instead of `<` breaks that rule, and `std::sort` is allowed to read out of bounds when it does — an undefined-behaviour bug that usually surfaces as a crash on large inputs only.

**Reference:** [Containers](https://en.cppreference.com/w/cpp/container) and [Algorithms](https://en.cppreference.com/w/cpp/algorithm) on cppreference.
