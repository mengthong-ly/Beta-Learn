---
title: Reading errors
section: Errors
---

When something goes wrong, Python raises an **exception** and prints a _traceback_. Read it **bottom-up**: the last line says what happened, and the lines above say where.

```python
print("before")
print(1 / 0)   # error!
```

Common exceptions you'll meet:

| Exception           | Typical cause                          |
| ------------------- | -------------------------------------- |
| `SyntaxError`       | typo, missing `:` or bracket           |
| `NameError`         | using a variable that doesn't exist    |
| `TypeError`         | wrong type, e.g. `"a" + 1`             |
| `ValueError`        | right type, bad value, e.g. `int("x")` |
| `IndexError`        | list index out of range                |
| `KeyError`          | missing dict key                       |
| `ZeroDivisionError` | dividing by zero                       |

> 💡 **Tip:** in PyLearn, the line that failed is highlighted red in the editor. Run the starter code below to see it.

> ⚠️ **Gotcha:** `"Age: " + 30` is a `TypeError`. Convert first with `str(30)`, or use an f-string.

## Challenge

> 🎯 **Challenge:** The starter code has **three** bugs: a `NameError`, a `TypeError` and an `IndexError`. Fix them so it prints `Total: 6` and then `Last: 3`.

```python starter
nums = [1, 2, 3]
total = sum(num)
print("Total: " + total)
print("Last:", nums[3])
```

```python solution
nums = [1, 2, 3]
total = sum(nums)
print("Total: " + str(total))
print("Last:", nums[-1])
```

```python check
assert __stdout__.splitlines() == ["Total: 6", "Last: 3"], f"Output was {__stdout__!r}"
```
