---
title: Iterators, generators & comprehensions
section: Guide Book
summary: The iterator protocol, lazy generators, comprehensions, and the itertools toolbox for processing data in streams.
---
## Iterables vs iterators

An **iterable** can produce an iterator (`iter(x)`); an **iterator** hands out values one at a time (`next(it)`) and raises `StopIteration` when done.

```python
nums = [10, 20, 30]
it = iter(nums)
print(next(it), next(it), next(it))
print(next(it, "done"))       # a default instead of StopIteration
```

## Your own iterator

```python
class Countdown:
    def __init__(self, start):
        self.n = start
    def __iter__(self):
        return self
    def __next__(self):
        if self.n <= 0:
            raise StopIteration
        self.n -= 1
        return self.n + 1

print(list(Countdown(3)))
```

## Generators: iterators the easy way

A function containing `yield` returns a **generator**. Each `next()` runs the body until the next `yield`, then pauses.

```python
def countdown(n):
    print("starting")
    while n > 0:
        yield n
        n -= 1
    print("finished")

gen = countdown(2)
print(gen)          # nothing has run yet
print(next(gen))
print(next(gen))
print(list(gen))    # runs to the end
```

> 🔍 **Behind the scenes: a paused frame**
>
> Calling a generator function doesn't run its body. It creates a generator object that owns a **suspended frame** (`RETURN_GENERATOR` in the bytecode). Each `next()` resumes that frame exactly where `yield` (`YIELD_VALUE`) paused it, with all its local variables intact, and hands out one value. When the function returns, the generator raises `StopIteration`. Only one value exists at a time, so a generator over a billion items uses almost no memory.

```python
import sys, inspect

def squares(n):
    for i in range(n):
        yield i * i

g = squares(10**9)
print(sys.getsizeof(g), inspect.getgeneratorstate(g))
print(next(g), next(g), inspect.getgeneratorstate(g), g.gi_frame.f_locals)
```

## Generator expressions & `yield from`

```python
total = sum(x * x for x in range(1_000_000))      # no list is built
print(total)

def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)               # delegate to a sub-generator
        else:
            yield item

print(list(flatten([1, [2, [3, 4]], 5])))
```

## Comprehensions

```python
nums = range(10)
squares = [n * n for n in nums if n % 2 == 0]
by_parity = {n: "even" if n % 2 == 0 else "odd" for n in range(4)}
letters = {c for c in "mississippi"}
matrix = [[r * 3 + c for c in range(3)] for r in range(3)]
flat = [x for row in matrix for x in row]          # left-to-right = outer-to-inner
print(squares, by_parity, sorted(letters), flat, sep="\n")
```

> 🔍 **Behind the scenes: comprehension variables don't leak**
>
> The loop variable in a comprehension stays inside it. Before 3.12 each comprehension was compiled as a hidden nested function; since 3.12 (PEP 709) it's **inlined** for speed (you'll see `LOAD_FAST_AND_CLEAR` in the bytecode saving and restoring your variable), but the isolation is kept.

```python
x = "outer"
squares = [x * 2 for x in range(3)]
print(x, squares)     # x is still "outer"
```

## itertools: the power tools

```python
from itertools import islice, count, cycle, chain, groupby, pairwise, accumulate, product, batched

print(list(islice(count(10, 5), 4)))              # 10 15 20 25
print(list(islice(cycle("AB"), 5)))
print(list(chain([1, 2], (3,), "ab")))
print(list(pairwise([1, 4, 9, 16])))
print(list(accumulate([3, 1, 4, 1])))              # running totals
print(list(product("ab", repeat=2)))
print(list(batched(range(7), 3)))                   # chunks of 3
for key, grp in groupby("aaabccd"):
    print(key, len(list(grp)))
```

> ⚠️ **Gotcha:** an iterator can be consumed **once**. A second loop over the same generator finds it empty.

```python
g = (n for n in range(3))
print(list(g), list(g))
```

> 🧭 **Scenario:** Processing a huge log file line by line. A pipeline of generators reads one line at a time, so memory use stays flat even for a 10 GB file:

```python
logs = ["INFO start", "ERROR disk full", "INFO ok", "ERROR timeout", "WARN slow"]

lines = (line for line in logs)                 # in real life: open("app.log")
errors = (l for l in lines if l.startswith("ERROR"))
messages = (l.split(" ", 1)[1] for l in errors)
print(list(messages))
```
