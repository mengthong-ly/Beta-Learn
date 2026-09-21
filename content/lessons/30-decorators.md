---
title: Decorators
section: Pythonic
---

A decorator is a function that **wraps another function** to add behavior. `@decorator` above a `def` is shorthand for `func = decorator(func)`.

```python
def shout(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs).upper() + "!"
    return wrapper

@shout
def greet(name):
    return f"hello {name}"

print(greet("ada"))
```

## A practical one: timing

```python
import functools, time

def timed(func):
    @functools.wraps(func)            # keeps the original name and docstring
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        ms = (time.perf_counter() - start) * 1000
        print(f"{func.__name__} took {ms:.2f} ms")
        return result
    return wrapper

@timed
def slow_sum(n):
    return sum(range(n))

print(slow_sum(1_000_000))
```

## Built-in decorators you'll use

```python
import functools

@functools.cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(80))    # instant, thanks to memoization
```

> 💡 **Tip:** always use `@functools.wraps(func)` in your wrappers, or the decorated function loses its `__name__`.

## Challenge

> 🎯 **Challenge:** Write a decorator `count_calls` that tracks how many times a function was called in an attribute `wrapper.calls`.

```python starter
import functools

def count_calls(func):
    return func

@count_calls
def ping():
    return "pong"

ping(); ping(); ping()
print(ping.calls)
```

```python solution
import functools

def count_calls(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return func(*args, **kwargs)
    wrapper.calls = 0
    return wrapper

@count_calls
def ping():
    return "pong"

ping(); ping(); ping()
print(ping.calls)
```

```python check
@count_calls
def add(a, b):
    return a + b
assert add.calls == 0, "calls should start at 0"
assert add(2, 3) == 5, "The wrapped function must still return its result"
add(1, 1)
assert add.calls == 2
assert add.__name__ == "add", "Use functools.wraps"
```
