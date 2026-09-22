---
title: Comprehensions
section: 6 · Lists & Loop Patterns
---

A comprehension builds a collection in one expression: `[expression for item in iterable if condition]`.

```python
squares = [n * n for n in range(6)]
evens = [n for n in range(10) if n % 2 == 0]
print(squares, evens)
```

The loop version of `squares`, for comparison:

```python
squares = []
for n in range(6):
    squares.append(n * n)
print(squares)
```

## Dict and set comprehensions

```python
words = ["apple", "kiwi", "banana"]
lengths = {w: len(w) for w in words}
initials = {w[0] for w in words}
print(lengths, initials)
```

## With if/else

The conditional expression goes **before** the `for`:

```python
labels = ["even" if n % 2 == 0 else "odd" for n in range(4)]
print(labels)
```

Nested loops read left to right:

```python
pairs = [(x, y) for x in range(2) for y in "ab"]
print(pairs)
```

> 💡 **Tip:** if a comprehension no longer fits on one readable line, use a normal loop instead.

## Challenge

> 🎯 **Challenge:** Using **one comprehension each**:
>
> 1. `shout` = the words longer than 3 letters, uppercased
> 2. `index` = a dict mapping each word to its length

```python starter
words = ["hi", "hello", "hey", "python", "code"]
shout = []
index = {}
print(shout, index)
```

```python solution
words = ["hi", "hello", "hey", "python", "code"]
shout = [w.upper() for w in words if len(w) > 3]
index = {w: len(w) for w in words}
print(shout, index)
```

```python check
assert shout == ["HELLO", "PYTHON", "CODE"], f"shout = {shout}"
assert index == {"hi": 2, "hello": 5, "hey": 3, "python": 6, "code": 4}, f"index = {index}"
```
