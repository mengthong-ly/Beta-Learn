---
title: Scope & closures
section: 4 · Functions & OOP
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

```quiz
? easy: What does this print?
~~~python
y = "outer"

def show():
    y = "inner"
    print(y)

show()
print(y)
~~~
+ inner\nouter
- inner\ninner
- outer\ninner
- outer\nouter
> The `y` inside show() is a new local variable that only exists there; the print() after the call still sees the module-level y, untouched.
? easy: Which keyword lets a function rebind (assign to) a global variable from inside itself?
+ `global`
- `nonlocal`
- `static`
- `public`
> `global` tells Python to use the module-level variable instead of silently creating a new local one when you assign to that name.
? medium: What does this print?
~~~python
def make_adder(n):
    def add(x):
        return x + n
    return add

add5 = make_adder(5)
add10 = make_adder(10)
print(add5(1), add10(1))
~~~
+ 6 11
- 6 6
- 11 11
- 1 1
> Each call to make_adder() creates a new closure that remembers its own n — 5 for add5, 10 for add10 — so the two behave independently.
? medium: What does `nonlocal` do, as opposed to `global`?
+ Lets an inner function rebind a variable from its enclosing function's scope, not the module's global scope
- Lets an inner function rebind a variable from the global scope
- Makes a variable local to only the inner function
- Declares a variable as a constant that can't change
> nonlocal reaches into the nearest enclosing function's scope. Reaching all the way to the module scope is what `global` is for.
? hard: A function does `print(count); count += 1`, and `count` is never declared `global` inside it, even though a variable named `count` exists at module level. What happens when the function runs?
+ UnboundLocalError, because assigning to `count` anywhere in the function makes it local for the whole function, including the print() before the assignment
- It prints the module-level count, then increments a new local copy
- It prints the module-level count, then updates the module-level count
- NameError, because count was never defined
> Assigning to a name anywhere in a function makes Python treat it as local for the *entire* function body. The print() runs before the local count has a value, so it fails.
? hard: What does this print?
~~~python
def make_counter(start):
    n = start
    def step():
        nonlocal n
        n += 2
        return n
    return step

c = make_counter(10)
print(c(), c(), c())
~~~
+ 12 14 16
- 10 12 14
- 12 12 12
- 2 4 6
> Each call to step() adds 2 to the enclosing n via nonlocal, starting from 10: 12, then 14, then 16.
```
