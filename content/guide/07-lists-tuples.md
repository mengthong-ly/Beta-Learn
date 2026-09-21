---
title: Lists & tuples
section: Guide Book
summary: Ordered sequences: the mutable list, the immutable tuple, slicing, sorting, copying, and how they're stored.
---
## Lists

```python
nums = [5, 2, 9]
nums.append(1)            # add to the end
nums.insert(0, 7)         # insert at an index
nums.extend([3, 3])       # add many
nums.remove(3)            # remove first match
last = nums.pop()         # remove & return last (pop(i) for index i)
print(nums, last, len(nums), nums.index(9), nums.count(3))
```

| Operation | Example | Cost |
|---|---|---|
| index / assign | `a[i]`, `a[i] = x` | O(1) |
| append / pop end | `a.append(x)`, `a.pop()` | O(1) amortized |
| insert / pop front | `a.insert(0, x)`, `a.pop(0)` | **O(n)**: shifts everything |
| search | `x in a`, `a.index(x)` | O(n) |
| sort | `a.sort()` | O(n log n) |

## Slicing

`seq[start:stop:step]`. `stop` is excluded; negative indexes count from the end.

```python
a = list(range(10))
print(a[2:5], a[:3], a[-3:], a[::2], a[::-1])
a[1:3] = ["x", "y", "z"]     # slice assignment can change the length
print(a)
del a[::2]
print(a)
```

## Sorting

```python
words = ["banana", "Apple", "cherry"]
print(sorted(words))                          # new list; uppercase first
print(sorted(words, key=str.lower))           # case-insensitive
print(sorted(words, key=len, reverse=True))
words.sort()                                  # in place, returns None
print(words)

people = [("Ada", 36), ("Bo", 25), ("Cy", 36)]
print(sorted(people, key=lambda p: (-p[1], p[0])))   # age desc, then name
```

> 🔍 **Behind the scenes: Timsort and stability**
>
> Python sorts with **Timsort** (since 2002; Python 3.11 switched its merge strategy to the *Powersort* policy). It finds already-sorted runs in your data and merges them, so nearly-sorted input sorts in close to O(n). It's **stable**: items that compare equal keep their original order. That's why you can sort by a secondary key first, then by the primary key, and the secondary order survives.

## Copying

`b = a` copies nothing. A **shallow copy** copies the outer list only; a **deep copy** copies everything inside too.

```python
import copy

a = [[1, 2], [3, 4]]
shallow = a.copy()          # same as list(a) or a[:]
deep = copy.deepcopy(a)
a[0].append(99)
print(shallow)   # inner lists are shared → shows 99
print(deep)      # fully independent
```

> 🔍 **Behind the scenes: lists over-allocate**
>
> A list is an array of **pointers** to objects plus spare capacity. When you `append` and it's full, CPython grows it by about 12.5%, plus a little, and copies the pointers over. Because it grows proportionally, the occasional copy averages out: **amortized O(1)** appends. Watch `sys.getsizeof` jump in steps as you append:

```python
import sys

a = []
last = sys.getsizeof(a)
for i in range(20):
    a.append(i)
    size = sys.getsizeof(a)
    if size != last:
        print(f"len={len(a):>2} → {size} bytes")
        last = size
```

## Tuples

A tuple is an **immutable** sequence: a fixed record.

```python
point = (3, 4)
single = (5,)            # the comma makes it a tuple, not the parentheses
x, y = point             # unpacking
print(point[0], len(point), single, type(single))
print({(0, 0): "origin"})   # hashable, so usable as dict keys
```

> ⚠️ **Gotcha:** "immutable" means the tuple's *slots* can't be reassigned. If a slot holds a list, the list itself can still change.

```python
t = ([1, 2], "x")
t[0].append(3)
print(t)
```

## Named tuples

```python
from collections import namedtuple

Point = namedtuple("Point", "x y")
p = Point(3, 4)
print(p.x, p[1], p, p._replace(x=10))
```

> 🔍 **Behind the scenes: why tuples are a bit faster and smaller**
>
> A tuple is allocated with exactly the space it needs, with no spare capacity. Tuples of constants are built once at **compile time** and stored in the code object (`LOAD_CONST`), while a list literal is rebuilt every time the line runs (`BUILD_LIST`). Check it in **Inspect → Bytecode** with `a = (1, 2, 3)` versus `b = [1, 2, 3]`.

```python
import sys, dis

print(sys.getsizeof((1, 2, 3)), sys.getsizeof([1, 2, 3]))
dis.dis("t = (1, 2, 3)\nl = [1, 2, 3]")
```

> 🧭 **Scenario:** A queue of jobs: `jobs.pop(0)` on a list is O(n) because every remaining item shifts left. With 100,000 jobs that's billions of moves. Use `collections.deque`, whose `popleft()` is O(1).

```python
from collections import deque

jobs = deque(["build", "test", "deploy"])
jobs.append("notify")
print(jobs.popleft(), jobs)
```
