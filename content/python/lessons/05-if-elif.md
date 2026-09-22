---
title: if / elif / else
section: 1 · Getting Started
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

```quiz
? easy: What does this print?
~~~python
temp = 23
if temp > 30:
    print("Hot")
elif temp > 15:
    print("Nice")
else:
    print("Cold")
~~~
+ Nice
- Hot
- Cold
- Hot Nice
> 23 isn't over 30, but it is over 15, so the elif branch runs. Only the first matching branch runs.
? easy: What must end every `if`, `elif`, and `else` line in Python?
+ `:`
- `;`
- `{}`
- nothing — indentation alone is enough
> Forgetting the colon at the end of `if`/`elif`/`else` is a SyntaxError.
? medium: What does this print?
~~~python
age = 15
label = "adult" if age >= 18 else "minor"
print(label)
~~~
+ minor
- adult
- True
- False
> The conditional expression evaluates `age >= 18` (False), so it returns the value after `else`.
? medium: If several `elif` conditions could all be true for the same value, how many branches run?
+ Only the first one that's true, checked top to bottom
- All of the ones that are true
- The last one that's true
- None — that's an error
> Python checks conditions top to bottom and runs only the first matching branch, then skips the rest.
? hard: What does this print?
~~~python
temp = 40
if temp > 30:
    print("Hot")
elif temp > 35:
    print("Very hot")
else:
    print("Cold")
~~~
+ Hot
- Very hot
- Hot Very hot
- Cold
> temp > 35 is also true, but elif is only checked when the earlier condition was false. Hot matches first, so only it runs.
```
