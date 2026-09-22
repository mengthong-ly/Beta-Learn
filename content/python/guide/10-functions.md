---
title: Functions & scope
section: Guide Book
summary: Defining functions, every kind of parameter, return values, scope rules, closures, lambdas and decorators.
---
## Defining and calling

```python
def greet(name, greeting="Hello"):
    """Return a greeting."""
    return f"{greeting}, {name}!"

print(greet("Ada"), greet("Bo", greeting="Hi"), greet(greeting="Yo", name="Cy"))
print(greet)                  # functions are objects too
```

A function without `return` returns `None`.

## Every kind of parameter

```python
def f(pos_only, /, normal, *args, kw_only, **kwargs):
    print(pos_only, normal, args, kw_only, kwargs)

f(1, 2, 3, 4, kw_only=5, extra=6)
f(1, normal=2, kw_only=3)
```

| Syntax | Meaning |
|---|---|
| `a, b` | positional or keyword |
| `a=1` | default value |
| `/` | parameters before it are positional-only |
| `*args` | extra positionals collected into a tuple |
| `*` (bare) | parameters after it are keyword-only |
| `**kwargs` | extra keywords collected into a dict |

```python
def total(*nums, round_to=2):
    return round(sum(nums), round_to)

values = [1.234, 2.345]
print(total(*values), total(1, 2, 3, round_to=0))      # * spreads a list into arguments
opts = {"sep": " | ", "end": "!\n"}
print("a", "b", **opts)                                # ** spreads a dict into keywords
```

> 🔍 **Behind the scenes: `def` runs at runtime, and defaults are evaluated once**
>
> `def` is an executable statement: when it runs, Python builds a **function object** (`MAKE_FUNCTION`) from the pre-compiled code object. **Default values are evaluated right then, once**, and stored on the function (`f.__defaults__`). That's why a mutable default like `def add(x, items=[])` keeps growing across calls: every call shares the same list.

```python
def add(x, items=[]):
    items.append(x)
    return items

print(add(1), add(2))            # [1, 2] [1, 2]: the same list!
print(add.__defaults__)

def add_fixed(x, items=None):
    items = [] if items is None else items
    items.append(x)
    return items

print(add_fixed(1), add_fixed(2))
```

## Scope: LEGB

A name is looked up in **L**ocal → **E**nclosing → **G**lobal → **B**uilt-in scope, in that order.

```python
x = "global"

def outer():
    x = "enclosing"
    def inner():
        return x          # finds the enclosing x
    return inner()

print(outer(), x, len)    # len comes from builtins
```

> 🔍 **Behind the scenes: locals are decided at compile time**
>
> When Python compiles a function, any name **assigned anywhere** in it becomes a local, stored in a fast array slot (`LOAD_FAST`/`STORE_FAST`) instead of a dict. The compiler decides this *before* the function runs, so reading a name before assigning it raises `UnboundLocalError`, even if a global of the same name exists. `global` and `nonlocal` change that decision.

```python
count = 0

def broken():
    try:
        count += 1          # assignment makes count local → can't read it first
    except UnboundLocalError as e:
        print("UnboundLocalError:", e)

def works():
    global count
    count += 1

broken(); works()
print(count)
```

## Closures

An inner function **remembers** variables from the function that created it, even after that function has returned.

```python
def make_counter():
    n = 0
    def step():
        nonlocal n
        n += 1
        return n
    return step

c = make_counter()
print(c(), c(), c())
print(c.__closure__[0].cell_contents)   # the remembered variable
```

> 🔍 **Behind the scenes: cells**
>
> A variable captured by an inner function is stored in a **cell**, a tiny box that both functions reference (`MAKE_CELL`, `LOAD_DEREF`). The inner function keeps the cell alive through `__closure__`. That's also the cause of the famous "late binding" surprise: a loop of lambdas all share one cell, so they all see its final value.

```python
fs = [lambda: i for i in range(3)]
print([f() for f in fs])                 # [2, 2, 2]
fs = [lambda i=i: i for i in range(3)]   # a default freezes the current value
print([f() for f in fs])                 # [0, 1, 2]
```

## Lambdas and functions as values

```python
people = [("Ada", 36), ("Bo", 25)]
print(sorted(people, key=lambda p: p[1]))
ops = {"+": lambda a, b: a + b, "*": lambda a, b: a * b}
print(ops["*"](6, 7), list(map(str.upper, ["a", "b"])))
```

## Decorators

A decorator takes a function and returns a replacement: `@deco` above `def f` means `f = deco(f)`.

```python
import functools, time

def timed(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            print(f"{func.__name__} took {(time.perf_counter() - start) * 1000:.2f} ms")
    return wrapper

@timed
def slow_sum(n):
    return sum(range(n))

print(slow_sum(1_000_000))
```

> 🔍 **Behind the scenes: every call creates a frame**
>
> Calling a function creates a **frame**: a record holding its local variables, its value stack, and a pointer back to the caller. Recursion stacks frames; Python caps the depth (`sys.getrecursionlimit()`, usually 1000) and raises `RecursionError` beyond it instead of crashing. Since 3.11 frames are allocated cheaply in a contiguous chunk, which made calls noticeably faster.

```python
import sys

def depth(n):
    return depth(n + 1) if n < 50 else sys._getframe().f_back.f_code.co_name

print(sys.getrecursionlimit(), depth(0))
```

> 🧭 **Scenario:** Caching an expensive function (an API lookup, or a slow recursive computation) is one decorator: `@functools.cache`. The second call with the same arguments returns instantly from a dict.

```python
import functools

@functools.cache
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(100), fib.cache_info())
```
