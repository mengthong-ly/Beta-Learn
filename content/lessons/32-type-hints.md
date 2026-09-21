---
title: Type hints
section: Pythonic
---

Type hints document what types a function expects and returns. Python **doesn't enforce them** at runtime; tools like editors and `mypy` use them to catch bugs early.

```python
def greet(name: str, times: int = 1) -> str:
    return ("Hi " + name + "! ") * times

print(greet("Ada", 2))
print(greet.__annotations__)
```

## Common shapes

```python
from typing import Optional

scores: list[int] = [90, 85]
ages: dict[str, int] = {"Ada": 36}
point: tuple[float, float] = (1.0, 2.0)

def find(name: str) -> int | None:     # "might be None"
    return ages.get(name)

def average(nums: list[float]) -> float:
    return sum(nums) / len(nums)

print(find("Ada"), find("Bo"), average([1, 2, 3]))
```

> ⚠️ **Gotcha:** hints aren't checks. `greet(123)` still runs and fails inside. Validate real input yourself.

## Challenge

> 🎯 **Challenge:** Add type hints to `word_lengths` so it takes a `list[str]` and returns a `dict[str, int]`, then implement it.

```python starter
def word_lengths(words):
    pass

print(word_lengths(["hi", "hello"]))
```

```python solution
def word_lengths(words: list[str]) -> dict[str, int]:
    return {w: len(w) for w in words}

print(word_lengths(["hi", "hello"]))
```

```python check
assert word_lengths(["hi", "hello"]) == {"hi": 2, "hello": 5}
ann = word_lengths.__annotations__
assert ann.get("words") == list[str], "Hint the parameter as list[str]"
assert ann.get("return") == dict[str, int], "Hint the return as dict[str, int]"
```
