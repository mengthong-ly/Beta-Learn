---
title: Names, objects & variables
section: Guide Book
summary: Python variables are labels on objects, not boxes. This one idea explains aliasing, `is` vs `==`, and mutation.
---
## Variables are names, not boxes

In many languages a variable is a box that holds a value. In Python a variable is a **name bound to an object**. Assignment never copies anything; it just points a name at an object.

```python
a = [1, 2, 3]
b = a            # b now points at the SAME list
b.append(4)
print(a)         # [1, 2, 3, 4], because there is only one list
print(a is b)    # True: same object
```

Every object has three things:

| Property | How to see it | Can it change? |
|---|---|---|
| **identity** | `id(obj)` | never, for the object's lifetime |
| **type** | `type(obj)` | never |
| **value** | printing it | only if the type is *mutable* |

```python
x = "hello"
print(id(x), type(x), x)
```

> 💡 **Tip:** Run the first example, then open **Inspect**: `a` and `b` show the same highlighted `id`. That's aliasing, made visible.

## `==` vs `is`

`==` asks "equal value?" (it calls `__eq__`). `is` asks "the very same object?" (it compares identities).

```python
a = [1, 2]
b = [1, 2]
print(a == b)   # True: same contents
print(a is b)   # False: two different lists
print(None is None)  # use `is` for None, True, False
```

## Mutable vs immutable

| Immutable (can't change in place) | Mutable (can change in place) |
|---|---|
| `int`, `float`, `bool`, `str`, `tuple`, `frozenset`, `bytes` | `list`, `dict`, `set`, `bytearray`, most class instances |

"Changing" an immutable value really creates a **new object** and rebinds the name:

```python
s = "hi"
old_id = id(s)
s += "!"                 # builds a new string
print(s, id(s) == old_id)  # hi! False

nums = [1]
old_id = id(nums)
nums += [2]              # lists extend in place
print(nums, id(nums) == old_id)  # [1, 2] True
```

> 🔍 **Behind the scenes: reference counting**
>
> Every CPython object carries a counter of how many references point at it. Binding a name, putting the object in a list, or passing it to a function each add one; unbinding (`del`, reassignment, a function returning) removes one. **The moment the count hits zero, the object is freed**, immediately and deterministically. A separate *cycle collector* (`gc` module) occasionally cleans up groups of objects that only reference each other.
>
> The **Inspect** tab shows each variable's `refs`. Try `a = []`, then `b = a`, then `c = [a, a]` and watch the count grow.

```python
import sys

data = []
print(sys.getrefcount(data) - 1)  # -1: getrefcount's own argument
alias = data
holder = [data, data]
print(sys.getrefcount(data) - 1)
```

> 🔍 **Behind the scenes: immortal objects and the small-int cache**
>
> CPython pre-creates the integers **-5 to 256**, plus `None`, `True`, `False` and many short strings, and shares them everywhere. Since Python 3.12 these are **immortal**: their reference count is frozen at a huge constant and they're never freed. That's why the Inspect tab says "immortal" for small numbers. It's also why `is` on numbers seems to work for small values and then mysteriously stops. **Never use `is` to compare numbers or strings**; use `==`.

```python
a = 256
b = 256
print(a is b)          # True: both names use the cached 256
c = int("1000")
d = int("1000")
print(c is d, c == d)  # False True: two separate 1000 objects
```

## Deleting a name

`del` removes a **name**, not an object. The object disappears only when no references are left.

```python
a = [1, 2]
b = a
del a
print(b)   # the list is still alive through b
```

> 🧭 **Scenario:** You write `row = [0] * 3; grid = [row] * 3`, set `grid[0][0] = 1`, and *every* row changes. All three rows are the same list object. Build independent rows instead: `grid = [[0] * 3 for _ in range(3)]`.

```python
row = [0] * 3
grid = [row] * 3
grid[0][0] = 1
print(grid)   # every row changed!

grid = [[0] * 3 for _ in range(3)]
grid[0][0] = 1
print(grid)   # only the first row
```
