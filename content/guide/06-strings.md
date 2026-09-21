---
title: Strings & text
section: Guide Book
summary: Immutable sequences of Unicode characters: literals, slicing, methods, formatting, and bytes vs text.
---
## Literals

```python
a = 'single'
b = "double"
c = """triple quotes
span lines"""
d = r"C:\new\table"          # raw: backslashes stay literal
e = "tab\tnewline\nquote\"end"
print(a, b, c, d, e, sep="\n")
```

| Escape | Meaning |
|---|---|
| `\n` `\t` | newline, tab |
| `\\` `\'` `\"` | backslash, quotes |
| `\u00e9` | Unicode code point (é) |

## Strings are sequences

```python
s = "Python"
print(s[0], s[-1], s[1:4], s[::-1], len(s))
print("th" in s, s.count("o"), s.find("z"))   # find returns -1 if missing
for ch in "hey":
    print(ch, ord(ch))
```

## Common methods

Strings are **immutable**: every method returns a *new* string.

| Group | Methods |
|---|---|
| case | `upper` `lower` `title` `capitalize` `casefold` `swapcase` |
| trim | `strip` `lstrip` `rstrip` `removeprefix` `removesuffix` |
| search | `find` `index` `count` `startswith` `endswith` |
| test | `isdigit` `isalpha` `isalnum` `isspace` `isupper` |
| split/join | `split` `rsplit` `splitlines` `partition` `join` |
| replace | `replace` `translate` |
| align | `center` `ljust` `rjust` `zfill` |

```python
line = "  name=Ada, lang=Python  "
clean = line.strip()
pairs = [p.split("=") for p in clean.split(", ")]
print(dict(pairs))
print("report.pdf".removesuffix(".pdf"), "42".zfill(5), "x".center(7, "*"))
print(" ".join(["a", "b", "c"]), "a-b-c".split("-", 1), "k=v=w".partition("="))
```

## Formatting

f-strings are the modern choice. After the `:` comes a **format spec**:

```python
name, score, ratio = "Ada", 1234.5678, 0.4567
print(f"{name!r:>8} | {score:,.2f} | {ratio:.1%} | {42:08b} | {255:#x}")
print(f"{score=}")                      # self-documenting: score=1234.5678
width = 10
print(f"[{name:^{width}}]")             # nested fields
print("{} is {}".format("pi", 3.14), "%s=%d" % ("x", 5))   # older styles
```

> 🔍 **Behind the scenes: string interning**
>
> Strings that look like identifiers (`"hello"`, `"user_id"`) and names in your code are **interned**: CPython keeps a single shared copy, so comparing them can be a pointer check. That's why `"hello" is "hello"` is often `True`, while two strings built at runtime usually aren't the same object. `sys.intern()` lets you opt in explicitly. It's an optimization, never something to rely on: **compare strings with `==`**.

```python
import sys

a = "hello"
b = "hello"
c = "".join(["hel", "lo"])
print(a is b, a is c, a == c)
print(sys.intern(c) is a)
```

> 🔍 **Behind the scenes: why `+=` in a loop can be slow, and when it isn't**
>
> Because strings are immutable, `s += x` normally builds a brand-new string and copies everything: O(n²) for a long loop. CPython has a trick: if nothing else references `s`, it resizes the string in place. You can't count on that (it doesn't hold in other Pythons or when anything else holds a reference), so the idiom for building text is to collect the pieces in a list and `"".join()` them once.

```python
import time

t = time.perf_counter()
parts = [str(i) for i in range(100_000)]
text = "".join(parts)
print(len(text), f"{(time.perf_counter() - t) * 1000:.1f} ms")
```

## Text vs bytes

A `str` is Unicode **text**; `bytes` are raw **bytes**. You `encode` text to bytes and `decode` bytes to text.

```python
word = "café"
raw = word.encode("utf-8")
print(len(word), len(raw), raw)      # 4 characters, 5 bytes: é takes 2 bytes
print(raw.decode("utf-8"))
print("😀".encode("utf-8"), len("😀"))
```

> 🔍 **Behind the scenes: how CPython stores a string**
>
> CPython (PEP 393) picks the smallest storage that fits the widest character: 1 byte per character for pure ASCII/Latin-1, 2 bytes if anything needs it, 4 bytes if any character is outside the Basic Multilingual Plane (like emoji). A single emoji can quadruple the memory of a long string. `sys.getsizeof` shows it.

```python
import sys

print(sys.getsizeof("a" * 100), sys.getsizeof("é" * 100), sys.getsizeof("😀" * 100))
```

> 🧭 **Scenario:** Normalizing user input before comparing: people type `"  ADA@Example.com "`. Use `email.strip().casefold()` (`casefold` is a stronger `lower()` that also handles characters like the German ß) before checking whether it's already registered.

```python
inputs = ["  ADA@Example.com ", "ada@example.COM", "Straße", "STRASSE"]
print({s.strip().casefold() for s in inputs})
```
