---
title: Strings, views & ranges
section: Guide Book
summary: `std::string` and its cheap non-owning view, formatting with `std::format`, and the C++20 ranges that finally made algorithms composable.
---
## `std::string`

```cpp
#include <iostream>
#include <string>

int main() {
  std::string s = "The quick brown fox";

  std::cout << s.size() << ' ' << s.length() << ' ' << std::boolalpha << s.empty() << "\n";
  std::cout << s.substr(4, 5) << "\n";
  std::cout << s.find("brown") << "\n";
  std::cout << (s.find("zebra") == std::string::npos ? "not found" : "found") << "\n";
  std::cout << s.starts_with("The") << ' ' << s.ends_with("fox") << "\n";
  std::cout << s.contains("quick") << "\n";

  s += " jumps";
  s.append("!");
  s.insert(0, ">> ");
  std::cout << s << "\n";

  s.replace(0, 3, "");
  std::cout << s << "\n";
}
```

`std::string::npos` is the "not found" sentinel — a huge unsigned value, which is why comparing the result of `find` to `npos` is the correct test rather than checking for a negative number.

## `std::string_view`

A pointer and a length. No allocation, no copy — and no ownership.

```cpp
#include <iostream>
#include <string>
#include <string_view>

// Takes a string, a string literal or a substring, with zero allocations.
std::size_t countVowels(std::string_view text) {
  std::size_t count = 0;
  for (char c : text) {
    if (std::string_view{"aeiouAEIOU"}.find(c) != std::string_view::npos) ++count;
  }
  return count;
}

int main() {
  std::string owned = "the quick brown fox";

  std::cout << countVowels(owned) << "\n";
  std::cout << countVowels("a literal, with no std::string created") << "\n";

  std::string_view view = owned;
  std::cout << view.substr(4, 5) << "\n";      // a view of a view: still no copy

  view.remove_prefix(4);
  std::cout << view << "\n";
}
```

> ⚠️ A `string_view` does not keep its string alive. `std::string_view v = makeString();` dangles at the semicolon, and storing a view in a member outlives its source sooner or later. Use `string_view` for **parameters**; use `std::string` for anything you store.

## `std::format`

```cpp
#include <iostream>
#include <format>
#include <string>

int main() {
  std::cout << std::format("{} is {} years old\n", "Ada", 36);
  std::cout << std::format("{1} before {0}\n", "second", "first");
  std::cout << std::format("pi = {:.3f}\n", 3.14159265);
  std::cout << std::format("[{:>10}] [{:<10}] [{:^10}]\n", "right", "left", "mid");
  std::cout << std::format("{:08.2f}\n", 3.14159);
  std::cout << std::format("hex {:x}, oct {:o}, bin {:b}\n", 255, 255, 255);
  std::cout << std::format("{:*^20}\n", " title ");

  std::string built = std::format("{}-{}-{}", 2026, 1, 15);
  std::cout << built << "\n";
}
```

`std::format` is type-safe — a mismatched specifier is a compile error, not the run-time undefined behaviour that a wrong `printf` format gives you.

## Ranges

C++20's ranges take a whole container instead of an iterator pair, and views compose lazily.

```cpp
#include <iostream>
#include <vector>
#include <algorithm>
#include <ranges>

int main() {
  std::vector<int> v{5, 3, 9, 1, 7};

  std::ranges::sort(v);                    // no .begin(), .end()
  std::cout << "sorted: ";
  for (int x : v) std::cout << x << ' ';
  std::cout << "\n";

  std::cout << "max: " << std::ranges::max(v) << "\n";
  std::cout << "contains 7: " << std::boolalpha << std::ranges::contains(v, 7) << "\n";
  std::cout << "count > 4: " << std::ranges::count_if(v, [](int n) { return n > 4; }) << "\n";
}
```

## Views and the pipe

```cpp
#include <iostream>
#include <vector>
#include <ranges>

int main() {
  std::vector<int> v{1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

  auto result = v
              | std::views::filter([](int n) { return n % 2 == 0; })
              | std::views::transform([](int n) { return n * n; })
              | std::views::take(3);

  std::cout << "even squares, first three: ";
  for (int x : result) std::cout << x << ' ';
  std::cout << "\n";

  for (int x : std::views::iota(1, 6)) std::cout << x << ' ';
  std::cout << "\n";

  for (int x : v | std::views::reverse | std::views::take(3)) std::cout << x << ' ';
  std::cout << "\n";

  // Pairing each element with its index, without views::enumerate:
  for (auto [i, value] : std::views::zip(std::views::iota(0), v | std::views::take(3))) {
    std::cout << i << ':' << value << ' ';
  }
  std::cout << "\n";
}
```

> 🔍 **Behind the scenes: views are lazy and cost nothing**
>
> `filter | transform | take` builds no intermediate containers. The pipeline is a nest of small objects, and the work happens element by element as the range-based `for` pulls from it — so `take(3)` really does stop after three, and the `transform` runs three times rather than ten. Compare with the pre-ranges version: a `copy_if` into a temporary vector, then a `transform` into another, both allocated and both fully populated.

```cpp
#include <iostream>
#include <vector>
#include <ranges>

int main() {
  std::vector<int> v{1, 2, 3};

  auto lazy = v | std::views::transform([](int n) {
                std::cout << "  transforming " << n << "\n";
                return n * 2;
              });

  std::cout << "nothing has run yet\n";
  std::cout << "first: " << *lazy.begin() << "\n";
  std::cout << "now the whole thing:\n";
  for (int x : lazy) std::cout << "  got " << x << "\n";
}
```

## Splitting and joining

```cpp
#include <iostream>
#include <string>
#include <string_view>
#include <ranges>
#include <vector>

int main() {
  constexpr std::string_view csv = "alpha,beta,gamma,delta";

  std::vector<std::string> parts;
  for (auto part : csv | std::views::split(',')) {
    parts.emplace_back(part.begin(), part.end());
  }

  std::cout << parts.size() << " parts:\n";
  for (const auto& p : parts) std::cout << "  [" << p << "]\n";

  std::string joined;
  for (std::size_t i = 0; i < parts.size(); ++i) {
    if (i) joined += " | ";
    joined += parts[i];
  }
  std::cout << joined << "\n";
}
```

## Characters and conversion

```cpp
#include <iostream>
#include <string>
#include <cctype>
#include <algorithm>
#include <charconv>

int main() {
  std::string s = "Hello World 42";

  std::string upper = s;
  std::transform(upper.begin(), upper.end(), upper.begin(),
                 [](unsigned char c) { return std::toupper(c); });
  std::cout << upper << "\n";

  std::cout << std::stoi("42") + 1 << "\n";
  std::cout << std::stod("3.14") * 2 << "\n";
  std::cout << std::to_string(255) + "!" << "\n";

  // from_chars: no allocation, no locale, no exceptions.
  int value = 0;
  std::string_view digits = "1234";
  auto [ptr, ec] = std::from_chars(digits.data(), digits.data() + digits.size(), value);
  std::cout << "parsed " << value << ", ok: " << std::boolalpha
            << (ec == std::errc{}) << "\n";
}
```

> 💡 **Tip:** `std::toupper` takes an `int` and has undefined behaviour for negative values — which a `char` can be on platforms where `char` is signed. Casting to `unsigned char` first, as above, is the standard fix, and it is why that lambda looks over-careful.

**Reference:** [std::string](https://en.cppreference.com/w/cpp/string/basic_string), [std::format](https://en.cppreference.com/w/cpp/utility/format/format) and [Ranges](https://en.cppreference.com/w/cpp/ranges) on cppreference.
