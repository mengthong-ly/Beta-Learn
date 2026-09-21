---
title: Tuples & unpacking
section: Collections
---

A tuple is like a list but **immutable**: once created it can't change. Use it for fixed groups of values.

```python
point = (3, 4)
rgb = 255, 128, 0         # parentheses are optional
single = (42,)            # one-item tuple needs the comma!
print(point[0], len(rgb), type(single))
```

## Unpacking

Assign each item to a name in one line:

```python
x, y = (3, 4)
name, *rest = ["Ada", "Grace", "Linus"]
first, *_, last = range(10)
print(x, y, name, rest, first, last)
```

Functions return tuples when they return several values:

```python
def min_max(nums):
    return min(nums), max(nums)

lo, hi = min_max([4, 8, 1, 9])
print(lo, hi)
```

> ⚠️ **Gotcha:** `(42)` is just the number 42 in parentheses. A tuple needs a comma: `(42,)`.

Tuples can be dict keys (lists can't), because they're immutable:

```python
distances = {("NYC", "LA"): 2790}
print(distances[("NYC", "LA")])
```

## Challenge

> 🎯 **Challenge:** Write `stats(nums)` returning a tuple `(smallest, largest, average)`, then unpack it into three variables and print them.

```python starter
def stats(nums):
    pass

lo, hi, avg = stats([2, 4, 6, 8])
print(lo, hi, avg)
```

```python solution
def stats(nums):
    return min(nums), max(nums), sum(nums) / len(nums)

lo, hi, avg = stats([2, 4, 6, 8])
print(lo, hi, avg)
```

```python check
r = stats([2, 4, 6, 8])
assert isinstance(r, tuple), "Return a tuple"
assert r == (2, 8, 5.0), f"Expected (2, 8, 5.0), got {r}"
assert stats([5]) == (5, 5, 5.0)
```
