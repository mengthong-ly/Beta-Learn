---
title: Numbers & math operators
section: Guide Book
summary: int, float, complex and the arithmetic operators, including the corners that surprise people.
---
## The number types

| Type | Example | Notes |
|---|---|---|
| `int` | `42`, `-7`, `1_000_000`, `0xff`, `0b1010` | unlimited size |
| `float` | `3.14`, `1e-3`, `float("inf")` | 64-bit IEEE 754 double |
| `complex` | `2+3j` | real + imaginary parts |
| `bool` | `True`, `False` | a subclass of `int` (1 and 0) |

```python
print(2 ** 200)                  # ints never overflow
print(0xff, 0b1010, 0o17, 1_000_000)
print(type(3.0), type(3), type(2+3j))
print(True + True)               # bool is an int: 2
```

## Arithmetic operators

| Operator | Meaning | `7 ? 2` | `-7 ? 2` |
|---|---|---|---|
| `+` `-` `*` | add, subtract, multiply | 9, 5, 14 | -5, -9, -14 |
| `/` | true division, **always float** | 3.5 | -3.5 |
| `//` | floor division, **rounds toward −∞** | 3 | **-4** |
| `%` | remainder, **takes the divisor's sign** | 1 | **1** |
| `**` | power | 49 | 49 |

```python
print(7 / 2, 7 // 2, 7 % 2)
print(-7 // 2, -7 % 2)            # -4 and 1, not -3 and -1!
print(divmod(17, 5))              # (quotient, remainder) in one go
print(2 ** -1, (-8) ** (1/3))     # negative/fractional powers give floats (or complex)
```

> 🔍 **Behind the scenes: why `-7 // 2` is -4**
>
> Python guarantees that `(a // b) * b + (a % b) == a` **and** that `a % b` has the same sign as `b`. Rounding toward negative infinity is the only way to keep both true. The payoff: `n % 7` is always in `0..6`, even for negative `n`, which is exactly what you want for things like weekdays and clock arithmetic. (C, Java and JavaScript truncate toward zero instead.)

## Float precision

Floats are stored in **binary**, so most decimals are approximations:

```python
print(0.1 + 0.2)                  # 0.30000000000000004
print(0.1 + 0.2 == 0.3)           # False!

import math
print(math.isclose(0.1 + 0.2, 0.3))   # True: compare floats with a tolerance
print(round(2.675, 2))            # 2.67, because 2.675 is really 2.67499999…
```

> 🔍 **Behind the scenes: what a float really stores**
>
> A float is 64 bits: 1 sign bit, 11 exponent bits and 52 fraction bits, so about 15–17 significant decimal digits. `0.1` in binary is a repeating fraction (like 1/3 in decimal), so it gets cut off. `float.hex()` and `as_integer_ratio()` show the exact value that's stored.

```python
print((0.1).as_integer_ratio())
print((0.5).as_integer_ratio())   # 0.5 is exact in binary
print(float.hex(0.1))
```

For money, use `decimal.Decimal` or count cents as ints:

```python
from decimal import Decimal

print(Decimal("0.1") + Decimal("0.2"))       # 0.3 exactly
price_cents = 1999
print(f"${price_cents / 100:.2f}")
```

> 🔍 **Behind the scenes: how big ints work**
>
> A CPython `int` is an array of 30-bit "digits" plus a sign and a length. Small numbers use one digit; `2 ** 1000` just uses more. That's why Python can do exact math on enormous numbers, and why `sys.getsizeof` of an int grows with its size.

```python
import sys

for n in (1, 2 ** 30, 2 ** 60, 2 ** 1000):
    print(len(str(n)), "digits →", sys.getsizeof(n), "bytes")
```

## Useful built-ins & `math`

```python
import math

print(abs(-3), round(3.14159, 2), round(2.5), round(3.5))   # banker's rounding: 2, 4
print(max(3, 9, 1), min([4, 2]), sum([1, 2, 3]))
print(int("42"), int("ff", 16), float("1e3"), int(3.99))     # int() truncates
print(math.floor(-2.5), math.ceil(-2.5), math.trunc(-2.5))
print(math.sqrt(16), math.pi, math.gcd(12, 18), math.factorial(5))
```

> ⚠️ **Gotcha:** `round()` uses **banker's rounding**: halves round to the nearest *even* number, so `round(2.5)` is `2`. It avoids bias when you round many values.

> 🧭 **Scenario:** Splitting a bill: 100 among 3 people. `100 / 3` gives 33.333…, but money needs whole cents. Use `divmod` on cents: everyone pays `3333` and the first person pays the remaining `1` cent.

```python
total_cents, people = 10000, 3
share, extra = divmod(total_cents, people)
payments = [share + (1 if i < extra else 0) for i in range(people)]
print(payments, sum(payments) == total_cents)
```
