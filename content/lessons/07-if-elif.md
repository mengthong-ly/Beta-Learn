---
title: if / elif / else
section: Control flow
---

Indentation **is** the syntax in Python: the indented block runs only when the condition is truthy. Use 4 spaces.

```python
temp = 23
if temp > 30:
    print("Hot")
elif temp > 15:
    print("Nice")
else:
    print("Cold")
```

Python checks conditions top to bottom and runs **only the first** matching branch.

## Conditional expression

A one-line `if` that produces a value:

```python
age = 15
label = "adult" if age >= 18 else "minor"
print(label)
```

> ⚠️ **Gotcha:** forgetting the colon `:` at the end of `if`/`elif`/`else` is a `SyntaxError`.

## Challenge

> 🎯 **Challenge:** Write `grade(score)` that returns `"A"` for 90+, `"B"` for 80–89, `"C"` for 70–79, and `"F"` otherwise.

```python starter
def grade(score):
    # your if / elif / else here
    return "?"

print(grade(95), grade(85), grade(72), grade(10))
```

```python solution
def grade(score):
    if score >= 90:
        return "A"
    elif score >= 80:
        return "B"
    elif score >= 70:
        return "C"
    else:
        return "F"

print(grade(95), grade(85), grade(72), grade(10))
```

```python check
cases = {100: "A", 90: "A", 89: "B", 80: "B", 79: "C", 70: "C", 69: "F", 0: "F"}
for s, want in cases.items():
    got = grade(s)
    assert got == want, f"grade({s}) should be {want!r}, got {got!r}"
```
