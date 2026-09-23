---
title: Strings
section: 2 · Data
---

`std::string` from `<string>` is C++'s text type. It owns its characters, grows as needed and frees itself — nothing like the raw `char*` arrays it replaced.

```cpp
#include <iostream>
#include <string>

int main() {
  std::string name = "Ada";
  std::string greeting = "Hello, " + name + "!";
  greeting += " Welcome.";

  std::cout << greeting << "\n";
  std::cout << greeting.size() << " characters\n";
}
```

> ⚠️ **Gotcha:** `+` needs at least one `std::string` on one side. `"Hello, " + "Ada"` is two `const char*` and doesn't compile — there's nothing there that knows how to join them.

## Looking inside

```cpp
#include <iostream>
#include <string>

int main() {
  std::string word = "compiler";

  std::cout << word[0] << " " << word.front() << " " << word.back() << "\n";
  std::cout << word.size() << " " << std::boolalpha << word.empty() << "\n";
  std::cout << word.substr(0, 4) << " " << word.substr(4) << "\n";
}
```

- `word[i]` is fast and unchecked; `word.at(i)` checks the index and throws `std::out_of_range` instead of quietly reading rubbish.
- `substr(pos)` takes everything from `pos`; `substr(pos, count)` takes at most `count` characters.
- `size()` and `length()` are the same function under two names.

## Searching

`find` returns the index of the first match, or the special value `std::string::npos` when there is none. **Always** compare against `npos` before using the result:

```cpp
#include <iostream>
#include <string>

int main() {
  std::string email = "ada@example.com";
  std::size_t at = email.find('@');

  if (at != std::string::npos) {
    std::cout << email.substr(0, at) << " at " << email.substr(at + 1) << "\n";
  } else {
    std::cout << "not an email\n";
  }
}
```

> ℹ️ **In ThongLearn:** the in-browser clang is built without exception support, so here a failed `at()` or `std::stoi` **stops the program** instead of throwing something you could catch. The rule is still C++ — you'll see the real exception on a desktop compiler.

> ⚠️ **Gotcha:** `npos` is the largest `std::size_t`, not `-1` and not `0`. `if (email.find('@'))` is true even when the match is at index 0 and when there's no match at all — the comparison has to be explicit.

## Changing a string

```cpp
#include <iostream>
#include <string>

int main() {
  std::string text = "hello world";

  text[0] = 'H';
  text.replace(6, 5, "there");
  text.insert(0, ">> ");
  text.push_back('!');

  std::cout << text << "\n";
}
```

Every one of these can move the characters around in memory, which is why you keep indexes, not pointers, into a string you're editing.

## Comparing

`==`, `!=`, `<` and friends compare **contents**, not addresses, so they behave the way you'd hope:

```cpp
#include <iostream>
#include <string>

int main() {
  std::string a = "apple";
  std::string b = "banana";

  std::cout << std::boolalpha << (a == "apple") << " " << (a < b) << "\n";
}
```

`<` is a character-by-character comparison, so it's alphabetical for same-case ASCII text — but `"Zoo" < "apple"` is true, because every uppercase letter sorts before every lowercase one.

## Characters

Each element is a `char`. `<cctype>` classifies and converts them:

```cpp
#include <cctype>
#include <iostream>
#include <string>

int main() {
  std::string title = "ada lovelace";
  title[0] = static_cast<char>(std::toupper(title[0]));

  int letters = 0;
  for (char c : title) {
    if (std::isalpha(static_cast<unsigned char>(c))) {
      ++letters;
    }
  }

  std::cout << title << " has " << letters << " letters\n";
}
```

The casts aren't decoration: `std::toupper` takes and returns an `int`, and passing a negative `char` to it is undefined behaviour. `static_cast<unsigned char>` is the standard fix.

## Numbers and text

They're different types, and C++ never converts between them behind your back:

```cpp
#include <iostream>
#include <string>

int main() {
  int year = 1843;
  std::string label = "year " + std::to_string(year);
  int parsed = std::stoi("42");

  std::cout << label << " " << parsed * 2 << "\n";
}
```

> 💡 **Tip:** `std::stoi` throws `std::invalid_argument` on text that isn't a number. It is not a validator — check the input, or catch the exception.

## Passing strings around

Pass by `const std::string&` to read, and by value only when the function needs its own copy:

```cpp
#include <iostream>
#include <string>

int count_char(const std::string& text, char target) {
  int n = 0;
  for (char c : text) {
    if (c == target) {
      ++n;
    }
  }
  return n;
}

int main() {
  std::cout << count_char("mississippi", 's') << "\n";
}
```

## Challenge

> 🎯 **Challenge:** `email` is `"ada@example.com"`. Split it at the `@` and print exactly `ada example.com` — the name, a space, then the domain. Use `find` and `substr`.

```cpp starter
#include <iostream>
#include <string>

int main() {
  std::string email = "ada@example.com";
  // print the part before the @, a space, and the part after it
}
```

```cpp solution
#include <iostream>
#include <string>

int main() {
  std::string email = "ada@example.com";
  std::size_t at = email.find('@');
  std::cout << email.substr(0, at) << " " << email.substr(at + 1) << "\n";
}
```

```cpp check
    expect(output.size() == 1, "Print one line");
    expect(output[0] == "ada example.com", "Print exactly: ada example.com");
```

```quiz
? easy: What does this print?
~~~cpp
#include <iostream>
#include <string>

int main() {
  std::string s = "hello";
  std::cout << s.size() << "\n";
}
~~~
+ 5
- 4
- 6
- hello
> `size()` counts the characters; there's no hidden terminator in the count.
? easy: What does this print?
~~~cpp
#include <iostream>
#include <string>

int main() {
  std::string name = "Ada";
  std::cout << "Hi, " + name + "!" << "\n";
}
~~~
+ Hi, Ada!
- Hi, +Ada+!
- Hi,Ada!
- It doesn't compile
> One side of each `+` is a `std::string`, so both joins work and produce a new string.
? easy: Which header do you include for `std::string`?
+ `<string>`
- `<iostream>`
- `<cstring>`
- none, it's built in
> `<iostream>` often drags it in by accident; include `<string>` yourself so the program keeps compiling everywhere.
? medium: What does this print?
~~~cpp
#include <iostream>
#include <string>

int main() {
  std::string word = "compiler";
  std::cout << word.substr(0, 4) << " " << word.substr(4) << "\n";
}
~~~
+ comp iler
- comp piler
- compi ler
- comp
> `substr(0, 4)` takes four characters from index 0; `substr(4)` takes everything from index 4 to the end.
? medium: What does `text.find('z')` return when there is no `z`?
+ `std::string::npos`
- `-1`
- `0`
- `text.size() + 1`
> `npos` is the largest `std::size_t`. Compare against it explicitly — a truthiness test on the result is wrong in both directions.
? medium: What does this print?
~~~cpp
#include <iostream>
#include <string>

int main() {
  std::string a = "apple";
  std::string b = "apple";
  std::cout << std::boolalpha << (a == b) << "\n";
}
~~~
+ true
- false
- 1
- It doesn't compile
> `==` on `std::string` compares the characters, not addresses. `std::boolalpha` is what makes it print `true` rather than `1`.
? hard: What does this print?
~~~cpp
#include <iostream>
#include <string>

int main() {
  std::string s = "mississippi";
  std::cout << s.find("ss") << " " << s.rfind("ss") << "\n";
}
~~~
+ 2 5
- 2 2
- 5 5
- 2 6
> `find` gives the first match and `rfind` the last. The two "ss" pairs start at index 2 and index 5.
? hard: Why cast to `unsigned char` before calling `std::isalpha(c)`?
+ A negative `char` value is undefined behaviour for those functions
- It makes the comparison case-insensitive
- `isalpha` only accepts `unsigned char`
- It's needed to avoid a compiler warning, nothing more
> `std::isalpha` takes an `int` that must be representable as `unsigned char` (or EOF). On platforms where `char` is signed, a byte above 127 becomes negative without the cast.
? hard: What does this print?
~~~cpp
#include <iostream>
#include <string>

int main() {
  std::string s = "abc";
  s += std::to_string(12);
  std::cout << s << " " << s.size() << "\n";
}
~~~
+ abc12 5
- abc12 3
- abc 12 5
- It doesn't compile
> `std::to_string(12)` builds the two-character string "12", and `+=` appends it, giving five characters in total.
```

**Reference:** [std::string](https://en.cppreference.com/w/cpp/string/basic_string) on cppreference.
