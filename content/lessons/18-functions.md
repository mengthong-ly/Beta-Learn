---
title: Functions
section: Functions
---

`def` defines a reusable block of code. `return` sends a value back; without it, the function returns `None`.

```python
def greet(name):
    return f"Hello, {name}!"

message = greet("Ada")
print(message)
```

## Default parameters

```python
def power(base, exp=2):
    return base ** exp

print(power(5), power(2, 10))
print(power(exp=3, base=2))   # keyword arguments, any order
```

> ⚠️ **Gotcha:** never use a mutable default like `def f(items=[])`. The same list is shared across calls. Use `items=None` and create the list inside.

```python
def add_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items

print(add_item("a"), add_item("b"))   # ['a'] ['b']
```

## Docstrings

The first string in a function documents it:

```python
def area(w, h):
    """Return the area of a w × h rectangle."""
    return w * h

print(area.__doc__)
```

> 💡 **Tip:** `print` shows a value, while `return` hands it back to the caller. Functions should usually `return`.

## Challenge

> 🎯 **Challenge:** Write `fizzbuzz(n)` that returns `"Fizz"` if n is divisible by 3, `"Buzz"` if by 5, `"FizzBuzz"` if by both, otherwise the number as a string.

```python starter
def fizzbuzz(n):
    pass

for i in range(1, 16):
    print(fizzbuzz(i))
```

```python solution
def fizzbuzz(n):
    if n % 15 == 0:
        return "FizzBuzz"
    if n % 3 == 0:
        return "Fizz"
    if n % 5 == 0:
        return "Buzz"
    return str(n)

for i in range(1, 16):
    print(fizzbuzz(i))
```

```python check
want = {1: "1", 3: "Fizz", 5: "Buzz", 9: "Fizz", 10: "Buzz", 15: "FizzBuzz", 30: "FizzBuzz", 7: "7"}
for n, w in want.items():
    got = fizzbuzz(n)
    assert got == w, f"fizzbuzz({n}) should return {w!r}, got {got!r}"
```
