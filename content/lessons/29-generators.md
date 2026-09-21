---
title: Iterators & generators
section: Pythonic
---

A **generator** function uses `yield` to produce values one at a time, pausing between them. It's lazy, so it can even be infinite.

```python
def countdown(n):
    while n > 0:
        yield n
        n -= 1

for x in countdown(3):
    print(x)
print(list(countdown(5)))
```

Each `yield` hands back a value and freezes the function until the next value is requested:

```python
def numbers():
    print("start")
    yield 1
    print("middle")
    yield 2

gen = numbers()
print(next(gen))
print(next(gen))
```

## Generator expressions

Like a list comprehension, but with `()`. No list is built in memory:

```python
total = sum(n * n for n in range(1_000_000))
print(total)
```

## Infinite and lazy

```python
from itertools import islice

def naturals():
    n = 1
    while True:
        yield n
        n += 1

print(list(islice(naturals(), 5)))
```

> ⚠️ **Gotcha:** a generator can be consumed only **once**. Loop over it again and it's empty.

## Challenge

> 🎯 **Challenge:** Write a generator `fib()` that yields Fibonacci numbers forever: 0, 1, 1, 2, 3, 5, 8…

```python starter
def fib():
    return []

from itertools import islice
print(list(islice(fib(), 10)))
```

```python solution
def fib():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

from itertools import islice
print(list(islice(fib(), 10)))
```

```python check
import inspect
from itertools import islice
assert inspect.isgeneratorfunction(fib), "fib should use yield"
assert list(islice(fib(), 10)) == [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
assert list(islice(fib(), 50))[-1] == 7778742049, "It should keep going forever"
```
