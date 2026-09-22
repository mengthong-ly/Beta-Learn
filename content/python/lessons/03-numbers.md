---
title: Numbers & math
section: 1 · Getting Started
---

Python has two main number types: `int` (whole numbers) and `float` (decimals).

| Operator | Meaning                       | Example   | Result |
| -------- | ----------------------------- | --------- | ------ |
| `+ - *`  | add, subtract, multiply       | `3 * 4`   | `12`   |
| `/`      | true division, always a float | `7 / 2`   | `3.5`  |
| `//`     | floor division                | `7 // 2`  | `3`    |
| `%`      | remainder (modulo)            | `7 % 2`   | `1`    |
| `**`     | power                         | `2 ** 10` | `1024` |

```python
print(7 / 2, 7 // 2, 7 % 2, 2 ** 10)
```

Ints can be as big as you like, with no overflow:

```python
print(2 ** 100)
```

> ⚠️ **Gotcha:** floats are approximations. `0.1 + 0.2` is `0.30000000000000004`. Use `round()` when displaying.

```python
print(0.1 + 0.2)
print(round(0.1 + 0.2, 2))
```

## Useful built-ins

```python
print(abs(-5), max(3, 9, 4), min(3, 9, 4), round(3.14159, 2))
print(int("42") + 1, float("2.5") * 2)
```

Shorthand operators update a variable in place:

```python
count = 10
count += 5    # same as count = count + 5
count *= 2
print(count)  # 30
```

> 💡 **Tip:** `%` is great for "every Nth" logic: `n % 2 == 0` means _n is even_.

## Challenge

> 🎯 **Challenge:** A pizza has `slices = 17` and there are `people = 5`. Print how many whole slices each person gets, then how many are left over, e.g. `3 2`.

```python starter
slices = 17
people = 5

```

```python solution
slices = 17
people = 5
print(slices // people, slices % people)
```

```python check
assert __stdout__.strip() == "3 2", "Expected '3 2': use // and %"
```

```quiz
? easy: What does this print?
~~~python
print(7 // 2, 7 % 2)
~~~
+ 3 1
- 3.5 1
- 3 3.5
- 4 1
> `//` floors the division to 3, and `%` gives the remainder, 1.
? easy: Which operator always returns a float, even with two integers?
+ `/`
- `//`
- `%`
- `**`
> True division (`/`) always produces a float in Python 3; `//` gives an int when both operands are ints.
? medium: What does this print?
~~~python
count = 10
count += 5
count *= 2
print(count)
~~~
+ 30
- 15
- 20
- 25
> `count += 5` makes it 15, then `count *= 2` makes it 30.
? medium: Why does `print(0.1 + 0.2)` show `0.30000000000000004` instead of `0.3`?
+ Floats are stored as binary approximations, and 0.1 and 0.2 can't be represented exactly
- Python has a bug in addition
- 0.1 and 0.2 are treated as strings
- round() wasn't used, so Python guesses the digits
> Most decimal fractions can't be represented exactly in binary floating point, so tiny rounding errors show up.
? hard: What does this print?
~~~python
print(-7 // 2)
~~~
+ -4
- -3
- -3.5
- 4
> Floor division rounds toward negative infinity, not toward zero, so -3.5 floors to -4.
? hard: What is `2 ** 100` in Python, compared to many other languages?
+ An exact integer with no overflow, since Python ints have arbitrary precision
- A float, because it's too large for an int
- An OverflowError
- Silently wrapped to a smaller number
> Python ints grow as large as needed; there's no fixed-size overflow like in C or Java.
```
