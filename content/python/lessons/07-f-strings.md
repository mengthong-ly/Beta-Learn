---
title: f-strings
section: 2 · Strings & Lists
---

Put an `f` before the quotes and you can embed any expression in `{}`. This is the modern way to build strings.

```python
name = "Ada"
age = 36
print(f"{name} is {age} years old")
print(f"Next year: {age + 1}")
```

## Format specs

After a `:` you can control how the value looks:

```python
pi = 3.14159265
price = 1234567.891
print(f"{pi:.2f}")        # 2 decimals → 3.14
print(f"{price:,.2f}")    # thousands separator → 1,234,567.89
print(f"{0.256:.1%}")     # percent → 25.6%
print(f"[{'hi':>6}]")     # right-align in 6 chars
print(f"[{'hi':<6}]")     # left-align
print(f"[{7:03}]")        # zero-pad → 007
```

> 💡 **Tip:** `f"{x=}"` prints the expression _and_ its value, which is perfect for debugging.

```python
x = 42
print(f"{x=}")   # x=42
```

## Challenge

> 🎯 **Challenge:** With `item = "Coffee"`, `price = 3.5` and `qty = 3`, print exactly `3 x Coffee = $10.50`.

```python starter
item = "Coffee"
price = 3.5
qty = 3

```

```python solution
item = "Coffee"
price = 3.5
qty = 3
print(f"{qty} x {item} = ${price * qty:.2f}")
```

```python check
assert __stdout__.strip() == "3 x Coffee = $10.50", f"Expected '3 x Coffee = $10.50', got {__stdout__.strip()!r}"
```
