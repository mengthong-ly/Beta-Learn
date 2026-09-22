---
title: Strings
section: 2 · Strings & Lists
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

```quiz
? easy: What does this print?
~~~python
s = "Python"
print(len(s))
~~~
+ 6
- 5
- 7
- Error
> "Python" has 6 characters, so len(s) is 6.
? easy: Strings in Python are:
+ Immutable — methods return a new string
- Mutable — methods change the string in place
- Only mutable if triple-quoted
- Converted to a list automatically
> Every string method returns a brand new string; the original is never changed in place.
? medium: What does this print?
~~~python
s = "Python"
print(s + "!" * 3)
~~~
+ Python!!!
- Python!Python!Python!
- (Python!)3
- Error
> `*` binds tighter than `+`, so `"!" * 3` becomes `"!!!"` first, then it's concatenated onto s.
? medium: What does this print?
~~~python
s = "Hello, World"
print(s.replace("World", "Python"))
print(s)
~~~
+ Hello, Python\nHello, World
- Hello, Python\nHello, Python
- Hello, World\nHello, World
- Error
> replace() returns a new string; s itself never changes, because strings are immutable.
? hard: What does this print?
~~~python
words = "a-b-c".split("-")
print("+".join(words))
~~~
+ a+b+c
- a-b-c
- ['a', 'b', 'c']
- Error
> split("-") turns "a-b-c" into ["a", "b", "c"], and join() glues them back together with "+" between each.
```
