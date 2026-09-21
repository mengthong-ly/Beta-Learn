---
title: Control flow
section: Guide Book
summary: if/elif/else, while, for, break/continue, loop-else and match, and how loops really iterate.
---
## if / elif / else

```python
temp = 23
if temp > 30:
    label = "hot"
elif temp > 15:
    label = "mild"
else:
    label = "cold"
print(label, "|", "warm" if temp > 20 else "cool")
```

Conditions use **truthiness**: `0`, `0.0`, `""`, `None`, and empty `[]` `{}` `()` `set()` are falsy; everything else is truthy.

```python
for value in [0, 1, "", "a", [], [0], None]:
    print(repr(value), "→", bool(value))
```

## while

```python
n, steps = 27, 0
while n != 1:                     # the Collatz sequence
    n = n // 2 if n % 2 == 0 else 3 * n + 1
    steps += 1
print(steps)
```

## for, range, enumerate, zip

```python
for i in range(2, 11, 4):
    print(i)
for i, ch in enumerate("abc", start=1):
    print(i, ch)
for name, score in zip(["Ada", "Bo"], [90, 80], strict=True):
    print(name, score)
```

> 🔍 **Behind the scenes: what `for` actually does**
>
> A `for` loop is really a `while` loop around the **iterator protocol**. `for x in things:` calls `iter(things)` once to get an iterator, then calls `next(iterator)` repeatedly until it raises `StopIteration`, which the loop swallows. In bytecode that's `GET_ITER` then `FOR_ITER`. Any object with `__iter__` works in a `for` loop, which is why you can loop over files, dicts, strings, generators and your own classes. Here's the same loop written by hand:

```python
things = ["a", "b", "c"]
it = iter(things)
while True:
    try:
        x = next(it)
    except StopIteration:
        break
    print(x)
```

> 🔍 **Behind the scenes: `range` doesn't build a list**
>
> `range(10**12)` uses the same tiny amount of memory as `range(3)`. It only stores start, stop and step, and computes each number on demand. Even `in` and `len` are computed with arithmetic, not by looping.

```python
import sys

r = range(10**9)
print(sys.getsizeof(r), len(r), 999_999_999 in r, r[123])
print(sys.maxsize)   # 2147483647 here: this Python is a 32-bit WebAssembly build
```

> 🔍 **Behind the scenes: 32-bit Python**
>
> `len()` must fit in the C type `Py_ssize_t`. On a normal 64-bit machine that's about 9.2 × 10¹⁸, but ThongLearn's Python is compiled to 32-bit WebAssembly, where `sys.maxsize` is only 2,147,483,647. So `len(range(10**12))` raises `OverflowError` here, while `range(10**12)` itself and `in` still work, because Python ints have no size limit.

## break, continue and loop-else

`else` on a loop runs **only if the loop wasn't broken out of**, which is perfect for searches.

```python
def find_even(nums):
    for n in nums:
        if n % 2:
            continue           # skip odd numbers
        print("found", n)
        break
    else:
        print("no even number")

find_even([1, 3, 4, 5])
find_even([1, 3])
```

## match (structural pattern matching)

```python
def describe(event):
    match event:
        case {"type": "click", "x": x, "y": y}:
            return f"click at {x},{y}"
        case {"type": "key", "key": "q" | "Q"}:
            return "quit"
        case [first, *rest]:
            return f"batch of {1 + len(rest)} starting with {first}"
        case str() as text if text:
            return f"text: {text}"
        case _:
            return "unknown"

for e in [{"type": "click", "x": 1, "y": 2}, {"type": "key", "key": "Q"}, [1, 2, 3], "hi", 42]:
    print(describe(e))
```

> 🔍 **Behind the scenes: `match` is not a switch jump table**
>
> Unlike C's `switch`, `match` checks each `case` **top to bottom** and stops at the first one that fits. Patterns can check types (`str()`), destructure sequences and mappings, capture names, and add `if` guards. A bare name like `case x:` **captures** (it matches anything); to compare against a constant, use a dotted name (`case Color.RED:`) or a literal.

> ⚠️ **Gotcha:** don't modify a list while looping over it; items get skipped. Loop over a copy, or build a new list.

```python
nums = [1, 2, 2, 3]
for n in nums[:]:          # iterate over a copy
    if n == 2:
        nums.remove(n)
print(nums)
print([n for n in [1, 2, 2, 3] if n != 2])
```

> 🧭 **Scenario:** Retry with a limit: loop until success or out of attempts, and use `else` to report failure only when every attempt ran.

```python
import random

random.seed(3)
for attempt in range(1, 4):
    ok = random.random() > 0.7
    print(f"attempt {attempt}: {'ok' if ok else 'failed'}")
    if ok:
        break
else:
    print("giving up after 3 attempts")
```
