---
title: Scope & closures
section: Functions
---

Variables created inside a function are **local**: they vanish when it returns. Python looks names up in the order **L**ocal → **E**nclosing → **G**lobal → **B**uilt-in (LEGB).

```python
x = "global"

def show():
    x = "local"
    print(x)

show()
print(x)
```

To _rebind_ a global from inside a function, declare it with `global`. It's rarely a good idea:

```python
counter = 0

def bump():
    global counter
    counter += 1

bump(); bump()
print(counter)
```

## Closures

An inner function **remembers** the variables of the function that created it:

```python
def make_multiplier(n):
    def multiply(x):
        return x * n
    return multiply

triple = make_multiplier(3)
print(triple(10))
```

Use `nonlocal` to modify an enclosing variable:

```python
def make_counter():
    count = 0
    def step():
        nonlocal count
        count += 1
        return count
    return step

c = make_counter()
print(c(), c(), c())
```

> ⚠️ **Gotcha:** assigning to a name anywhere in a function makes it local for the **whole** function. Reading it before the assignment raises `UnboundLocalError`.

## Challenge

> 🎯 **Challenge:** Write `make_accumulator()` returning a function that adds its argument to a running total and returns the total. `acc(5)` → `5`, then `acc(10)` → `15`.

```python starter
def make_accumulator():
    pass

acc = make_accumulator()
print(acc(5), acc(10))
```

```python solution
def make_accumulator():
    total = 0
    def add(n):
        nonlocal total
        total += n
        return total
    return add

acc = make_accumulator()
print(acc(5), acc(10))
```

```python check
a = make_accumulator()
assert a(5) == 5 and a(10) == 15 and a(-3) == 12
b = make_accumulator()
assert b(1) == 1, "Each accumulator needs its own total"
```
