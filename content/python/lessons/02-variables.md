---
title: Variables
section: 1 · Getting Started
---

A variable is a **name that points at a value**. You create one with `=`, and there's no type declaration: Python figures out the type from the value.

```python
name = "Ada"
age = 36
height = 1.65
is_admin = True
print(name, age, height, is_admin)
```

Variables can be **re-assigned**, even to a value of a different type:

```python
score = 10
score = score + 5
print(score)      # 15
score = "fifteen"
print(score)
```

## Naming rules

- Letters, digits and `_`, but can't start with a digit
- Case-sensitive: `age` and `Age` are different
- Use `snake_case` for variable names, the Python convention

> ⚠️ **Gotcha:** `=` assigns, `==` compares. `x = 5` stores 5; `x == 5` asks "is x equal to 5?"

## Multiple assignment

```python
x, y = 1, 2
x, y = y, x     # swap without a temp variable
print(x, y)     # 2 1
```

Use `type()` to see what a value is:

```python
print(type(42), type(3.14), type("hi"), type(True))
```

## Challenge

> 🎯 **Challenge:** Create `a = 3` and `b = 7`, then **swap** them in one line and print `a` and `b` (should print `7 3`).

```python starter
a = 3
b = 7
# swap a and b here

print(a, b)
```

```python solution
a = 3
b = 7
a, b = b, a
print(a, b)
```

```python check
assert a == 7 and b == 3, "a should be 7 and b should be 3 after the swap."
assert __stdout__.strip() == "7 3", "Print a and b: 7 3"
```
