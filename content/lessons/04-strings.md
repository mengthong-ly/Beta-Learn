---
title: Strings
section: Basics
---

Strings are text in quotes. Single `'…'` and double `"…"` quotes are identical; triple quotes span lines.

```python
a = 'hello'
b = "world"
poem = """Roses are red,
Python is neat."""
print(a, b)
print(poem)
```

## Operations

```python
s = "Python"
print(len(s))        # 6
print(s + "!" * 3)   # concatenate and repeat
print(s[0], s[-1])   # first and last character
print("th" in s)     # membership test → True
```

## Handy methods

Strings are **immutable**: methods return a _new_ string.

```python
s = "  Hello, World  "
print(s.strip())
print(s.lower(), s.upper())
print(s.replace("World", "Python"))
print("a,b,c".split(","))
print("-".join(["x", "y", "z"]))
print("hello".startswith("he"), "hello".count("l"))
```

> ⚠️ **Gotcha:** `s.upper()` does **not** change `s`. Write `s = s.upper()` to keep the result.

## Challenge

> 🎯 **Challenge:** Given `raw = "  python IS fun  "`, print it stripped of spaces and in title case (`Python Is Fun`). Then print its word count (`3`) on the next line.

```python starter
raw = "  python IS fun  "

```

```python solution
raw = "  python IS fun  "
clean = raw.strip().title()
print(clean)
print(len(clean.split()))
```

```python check
lines = __stdout__.splitlines()
assert lines[:1] == ["Python Is Fun"], "Line 1 should be 'Python Is Fun' (try .strip() and .title())"
assert lines[1:2] == ["3"], "Line 2 should be the word count: 3"
```
