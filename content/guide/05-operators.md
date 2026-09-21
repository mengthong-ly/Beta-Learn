---
title: All the operators
section: Guide Book
summary: Comparison, logical, identity, membership, bitwise, assignment and the walrus, plus precedence and what each operator really calls.
---
## Comparison

| Operator | Meaning | Calls |
|---|---|---|
| `==` / `!=` | equal / not equal | `__eq__` / `__ne__` |
| `<` `<=` `>` `>=` | ordering | `__lt__` `__le__` `__gt__` `__ge__` |

Comparisons **chain**: `a < b < c` means `a < b and b < c`, with `b` evaluated once.

```python
x = 5
print(1 < x < 10, 1 < x > 3, 3 == 3.0)
print("apple" < "banana", [1, 2] < [1, 3], (1, "a") < (1, "b"))   # compared item by item
```

## Logical: `and`, `or`, `not`

`and` / `or` **short-circuit**, and they return **one of the operands**, not necessarily `True`/`False`.

| Expression | Returns |
|---|---|
| `a or b` | `a` if `a` is truthy, else `b` |
| `a and b` | `a` if `a` is falsy, else `b` |
| `not a` | always a real `bool` |

```python
print(0 or "default", "set" or "default")   # default  set
print(0 and 1 / 0)       # 0: the division never runs (short-circuit!)
print(not "", not [0])   # True False

name = ""
print(name or "Anonymous")   # a classic default-value idiom
```

> 🔍 **Behind the scenes: `and`/`or` are jumps, not function calls**
>
> There's no `__and__` for the logical `and`, so you can't overload it. The compiler turns `a or b` into: evaluate `a`, and if it's truthy, **jump past** `b` and keep `a`. That's why the right side may never run. Truthiness itself comes from `__bool__`, or `__len__` if there's no `__bool__`, or else "always true".

```python
import dis

dis.dis("a or b")
```

## Identity & membership

```python
items = [1, 2, 3]
print(2 in items, 5 not in items)
print("py" in "python", "key" in {"key": 1})   # dicts test *keys*
x = None
print(x is None, x is not None)
```

> 🔍 **Behind the scenes: how fast is `in`?**
>
> `in` calls `__contains__`. For a `list` or `tuple` it's a **linear scan**, checking every item with `==`. For a `set` or `dict` it's a **hash lookup**: roughly constant time no matter the size. Testing membership in a 1,000,000-item list is a million comparisons; in a set it's about one.

```python
import time

data_list = list(range(1_000_000))
data_set = set(data_list)
for container in (data_list, data_set):
    t = time.perf_counter()
    for _ in range(100):
        999_999 in container
    print(type(container).__name__, f"{(time.perf_counter() - t) * 1000:.2f} ms")
```

## Bitwise

They work on the binary digits of ints (and on sets: `|` union, `&` intersection).

| Op | Meaning | `0b1100 ? 0b1010` |
|---|---|---|
| `&` | and | `0b1000` (8) |
| `\|` | or | `0b1110` (14) |
| `^` | xor | `0b0110` (6) |
| `~x` | invert | `~12 == -13` |
| `<<` `>>` | shift | `1 << 4 == 16` |

```python
a, b = 0b1100, 0b1010
print(a & b, a | b, a ^ b, ~a, 1 << 4, 256 >> 2)
print(bin(a & b))

READ, WRITE, EXEC = 1, 2, 4          # permission flags
perms = READ | WRITE
print(bool(perms & WRITE), bool(perms & EXEC))
```

## Assignment operators

`x += 1` is **augmented assignment**. For mutable objects it modifies **in place** (`__iadd__`); for immutable ones it builds a new object.

```python
a = [1]
b = a
a += [2]        # in place: b sees it
print(b)

s = "x"
t = s
s += "y"        # new string: t does not change
print(t, s)
```

## The walrus operator `:=`

Assigns **and** returns a value inside an expression (Python 3.8+).

```python
data = [4, 8, 15, 16, 23, 42]
if (n := len(data)) > 5:
    print(f"long list: {n} items")

print([y for x in data if (y := x * 2) > 20])
```

## Unpacking operators `*` and `**`

```python
first, *middle, last = [1, 2, 3, 4, 5]
print(first, middle, last)
merged = {**{"a": 1}, **{"b": 2}}
print([*range(3), *"ab"], merged)
```

## Precedence (highest first)

| Level | Operators |
|---|---|
| 1 | `()` `[]` `.` calls, indexing, attributes |
| 2 | `**` (right-associative: `2**3**2 == 2**9`) |
| 3 | unary `+x` `-x` `~x` |
| 4 | `*` `/` `//` `%` `@` |
| 5 | `+` `-` |
| 6 | `<<` `>>` |
| 7 | `&` |
| 8 | `^` |
| 9 | `\|` |
| 10 | comparisons, `in`, `is` (all chainable) |
| 11 | `not` |
| 12 | `and` |
| 13 | `or` |
| 14 | `x if c else y` |
| 15 | `:=` |

```python
print(-2 ** 2)          # -4: ** binds tighter than unary minus
print(2 ** 3 ** 2)      # 512
print(not 1 == 2)       # True: == happens first
print(1 + 2 * 3, (1 + 2) * 3)
```

> 🔍 **Behind the scenes: `a + b` is really a method call, with a fallback**
>
> For `a + b`, Python first tries `a.__add__(b)`. If that returns the special value `NotImplemented` (it doesn't know how to add a `b`), Python tries the **reflected** method `b.__radd__(a)`. Only if both give up do you get a `TypeError`. That's how `3 * "ab"` works: `int` can't multiply by a string, so `str.__rmul__` takes over.

```python
class Meters:
    def __init__(self, v):
        self.v = v
    def __add__(self, other):
        if isinstance(other, (int, float)):
            return Meters(self.v + other)
        return NotImplemented
    __radd__ = __add__           # so that 5 + Meters(2) works too
    def __repr__(self):
        return f"{self.v}m"

print(Meters(2) + 5, 5 + Meters(2), 3 * "ab")
```

> 🧭 **Scenario:** Reading a config value that might be missing or empty: `timeout = config.get("timeout") or 30`. Careful: if `0` is a valid timeout, `or` would replace it with 30, since 0 is falsy. Use an explicit `None` check instead: `t = config.get("timeout"); timeout = 30 if t is None else t`.
