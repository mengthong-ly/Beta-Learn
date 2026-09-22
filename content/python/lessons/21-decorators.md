---
title: Decorators
section: 4 · Functions & OOP
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

```quiz
? easy: What does this print?
~~~python
def loud(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs) + "!!!"
    return wrapper

@loud
def greet(name):
    return f"hi {name}"

print(greet("bo"))
~~~
+ hi bo!!!
- hi bo
- HI BO!!!
- greet(bo)!!!
> @loud replaces greet with wrapper, which calls the original greet() and appends "!!!" to whatever it returns.
? easy: `@decorator` written above a `def` is shorthand for which line?
+ `func = decorator(func)`
- `func = decorator()`
- `decorator = func()`
- `func()`, called immediately, and its result replaces the function
> The decorator syntax reassigns the function's name to whatever the decorator returns — usually a wrapper.
? medium: What does this print?
~~~python
import functools

def logged(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@logged
def ping():
    return "pong"

print(ping.__name__)
~~~
+ ping
- wrapper
- logged
- pong
> functools.wraps copies the original function's metadata — including __name__ — onto the wrapper, so introspection still reports "ping".
? medium: What happens to a decorated function's `__name__` if the decorator's wrapper does *not* use `functools.wraps`?
+ It becomes the wrapper function's own name, e.g. "wrapper"
- It stays the original function's name
- Python raises an AttributeError
- It becomes None
> Without @wraps, only the inner wrapper function is visible to introspection, so __name__ reports the wrapper's own name, not the original.
? hard: What does this print?
~~~python
import functools

calls = 0

@functools.cache
def square(n):
    global calls
    calls += 1
    return n * n

square(4)
square(4)
square(5)
print(calls)
~~~
+ 2
- 3
- 1
- 0
> functools.cache remembers results per argument. The second square(4) call is a cache hit and skips the function body entirely, so calls only increments for the two distinct arguments, 4 and 5.
? hard: What does this print?
~~~python
import functools

def double_result(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs) * 2
    return wrapper

@double_result
def total(a, b=10):
    return a + b

print(total(5), total(5, b=1))
~~~
+ 30 12
- 15 6
- 30 6
- 15 1
> wrapper forwards everything through *args and **kwargs to the wrapped function first (5+10=15, 5+1=6), then double_result doubles whatever comes back (30, 12).
```
