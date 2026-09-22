---
title: Tuples & unpacking
section: 2 · Strings & Lists
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

```quiz
? easy: What does this print?
~~~python
point = (3, 4)
print(point[0])
~~~
+ 3
- 4
- (3, 4)
- Error
> Index 0 gets the first item, just like with a list.
? easy: How do you create a tuple with just one item, `42`?
+ `(42,)` — a trailing comma is required
- `(42)` — parentheses alone make a tuple
- `[42]`
- `tuple(42)`
> `(42)` is just the number 42 in parentheses; the comma is what actually makes it a tuple.
? medium: What does this print?
~~~python
name, *rest = ["Ada", "Grace", "Linus"]
print(name, rest)
~~~
+ Ada ['Grace', 'Linus']
- Ada Grace Linus
- ['Ada'] ['Grace', 'Linus']
- Ada ['Ada', 'Grace', 'Linus']
> `*rest` collects all the remaining items into a list, after `name` takes the first one.
? medium: What does this print?
~~~python
def min_max(nums):
    return min(nums), max(nums)

lo, hi = min_max([4, 8, 1, 9])
print(lo, hi)
~~~
+ 1 9
- 4 9
- 9 1
- (1, 9)
> The function returns a tuple (1, 9), which unpacks into lo and hi.
? hard: What does this print?
~~~python
first, *_, last = range(10)
print(first, last)
~~~
+ 0 9
- 0 8
- 1 9
- 9 0
> range(10) produces 0 through 9. `*_` swallows all the middle values, leaving first=0 and last=9.
? hard: Why can a tuple be used as a dictionary key, but a list can't?
+ Tuples are immutable and hashable; lists are mutable and unhashable
- Dictionaries only accept numbers and strings as keys
- Lists are too large to hash
- Tuples are always sorted and lists aren't
> Dict keys must be hashable, and only immutable types like tuples support hashing; lists can't be used.
```
