---
title: Raising exceptions
section: 5 · Files & Libraries
---

Use `raise` to signal that something is wrong. It's better to fail loudly than to continue with bad data.

```python
def set_age(age):
    if age < 0:
        raise ValueError(f"age can't be negative: {age}")
    return age

try:
    set_age(-5)
except ValueError as e:
    print("Caught:", e)
```

## Custom exceptions

Subclass `Exception` to make errors your code can catch precisely:

```python
class InsufficientFunds(Exception):
    pass

def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientFunds(f"need {amount - balance} more")
    return balance - amount

try:
    withdraw(50, 80)
except InsufficientFunds as e:
    print("Declined:", e)
```

`assert` is a quick sanity check. It raises `AssertionError` if the condition is false, which is how PyLearn checks your challenges:

```python
x = 5
assert x > 0, "x must be positive"
print("ok")
```

## Challenge

> 🎯 **Challenge:** Write `parse_percent(text)` that turns `"45%"` into `45`. Raise `ValueError` if the text doesn't end with `%` or if the number isn't between 0 and 100.

```python starter
def parse_percent(text):
    return int(text[:-1])

print(parse_percent("45%"))
```

```python solution
def parse_percent(text):
    if not text.endswith("%"):
        raise ValueError("missing %")
    n = int(text[:-1])
    if not 0 <= n <= 100:
        raise ValueError("out of range")
    return n

print(parse_percent("45%"))
```

```python check
assert parse_percent("45%") == 45
assert parse_percent("0%") == 0 and parse_percent("100%") == 100
for bad in ["45", "101%", "-1%"]:
    try:
        parse_percent(bad)
    except ValueError:
        pass
    else:
        raise AssertionError(f"parse_percent({bad!r}) should raise ValueError")
```
