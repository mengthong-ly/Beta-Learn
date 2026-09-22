---
title: Type hints
section: 4 · Functions & OOP
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

```quiz
? easy: Does Python enforce type hints at runtime by default?
+ No — hints are documentation for tools like editors and mypy; Python runs the code regardless
- Yes — calling a function with the wrong type immediately raises a TypeError
- Yes, but only for built-in types like int and str
- Only if the function uses a dataclass
> Type hints are optional documentation. Nothing stops you from calling greet(123) — Python only complains if the wrong type causes an actual operation to fail.
? easy: What does this print?
~~~python
def area(width: float, height: float) -> float:
    return width * height

print(area.__annotations__)
~~~
+ {'width': <class 'float'>, 'height': <class 'float'>, 'return': <class 'float'>}
- {'width': 'float', 'height': 'float', 'return': 'float'}
- ['width', 'height', 'return']
- {}
> __annotations__ collects every hint into a dict, keyed by parameter name (plus "return" for the return type); the values are the actual type objects, not strings.
? medium: What does this print?
~~~python
def total_price(prices: list[int]) -> int:
    return sum(prices)

print(total_price([1, 2, 3]))
print(total_price((4, 5)))
~~~
+ 6\n9
- 6\nTypeError
- TypeError
- 6\n[4, 5]
> Nothing stops you from passing a tuple even though the hint says list[int] — sum() just needs an iterable of numbers, so it works fine either way. That's the point: hints don't change what actually runs.
? medium: What does `int | None` mean as a return type hint?
+ The function might return an int, or it might return None
- The function must return either an int or raise an error
- The function returns a tuple of (int, None)
- The return value is converted to int, treating None as 0
> The `|` union syntax says either type is acceptable — here, a real int or the absence of one, None.
? hard: What does this print?
~~~python
def shout(word: str, times: int = 1) -> str:
    return (word + "! ") * times

try:
    print(shout(5))
except TypeError:
    print("TypeError")
~~~
+ TypeError
- 5! 
- 5555555
- Nothing prints
> The hint `word: str` doesn't stop you from passing 5. Python only raises an error once the code tries to add an int and a string together — the hint itself performs no check.
? hard: `def f(a: int, b, c: str = "x") -> bool: pass`. Which of these is NOT a key in `f.__annotations__`?
+ `b`
- `a`
- `c`
- `return`
> __annotations__ only includes names that were actually given a hint. b has no hint, so it's left out; "return" is the special key for the return hint.
```
