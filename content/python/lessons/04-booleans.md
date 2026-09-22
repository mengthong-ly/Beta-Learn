---
title: Booleans & comparisons
section: 1 · Getting Started
---

A boolean is `True` or `False`. Comparisons produce booleans:

| Operator          | Meaning                      |
| ----------------- | ---------------------------- |
| `==` / `!=`       | equal / not equal            |
| `<` `<=` `>` `>=` | ordering                     |
| `in`              | membership                   |
| `is`              | same object (use for `None`) |

```python
print(3 > 2, 3 == 3.0, "a" < "b", 5 != 5)
print(1 < 5 < 10)   # chained comparison!
```

Combine with `and`, `or`, `not`:

```python
age = 20
has_ticket = True
print(age >= 18 and has_ticket)
print(not has_ticket or age > 65)
```

## Truthiness

Every value is "truthy" or "falsy". These are **falsy**: `False`, `None`, `0`, `0.0`, `""`, `[]`, `{}`, `()`. Everything else is truthy.

```python
print(bool(0), bool(""), bool([]), bool("hi"), bool([0]))
```

> ⚠️ **Gotcha:** compare to `None` with `is`: `x is None`, not `x == None`.

## Challenge

> 🎯 **Challenge:** Set `can_vote` to `True` only if `age` is at least 18 **and** `registered` is true. Print it.

```python starter
age = 19
registered = True
can_vote = False  # fix this line

print(can_vote)
```

```python solution
age = 19
registered = True
can_vote = age >= 18 and registered
print(can_vote)
```

```python check
assert can_vote is True, "With age 19 and registered, can_vote should be True"
src = globals().get("__src__", "")
assert "and" in src, "Use the `and` operator"
```

```quiz
? easy: What does this print?
~~~python
print(3 > 2, 3 == 3.0)
~~~
+ True True
- True False
- False True
- False False
> 3 > 2 is True, and == compares value not type, so 3 == 3.0 is also True.
? easy: Which of these values is falsy?
+ `[]`
- `[0]`
- `"0"`
- `" "`
> An empty list is falsy. A list with an item, and any non-empty string (even `"0"` or `" "`), are truthy.
? medium: What does this print?
~~~python
print(1 < 5 < 10)
~~~
+ True
- False
- Error
- 1
> Chained comparisons check `1 < 5 and 5 < 10` — both are true.
? medium: How should you compare a variable to `None`?
+ `x is None`
- `x == None`
- `x = None`
- `x != None` to check equality
> Use `is` for `None`: it checks identity, which is the correct way to test for `None`.
? hard: What does this print?
~~~python
age = 20
has_ticket = True
print(not has_ticket or age > 65)
~~~
+ False
- True
- None
- Error
> `not has_ticket` is False, and `age > 65` is also False, so `False or False` is False.
```
