---
title: Dataclasses
section: 4 · Functions & OOP
---

`@dataclass` writes `__init__`, `__repr__` and `__eq__` for you. It's ideal for classes that mainly hold data.

```python
from dataclasses import dataclass, field

@dataclass
class Point:
    x: float
    y: float = 0.0

p = Point(3)
print(p, p == Point(3, 0.0))
```

Compare that with the manual class you'd otherwise write: `__init__`, `__repr__` and `__eq__`, all by hand.

## Options

```python
from dataclasses import dataclass, field

@dataclass(order=True, frozen=True)
class Version:
    major: int
    minor: int = 0

print(sorted([Version(2, 1), Version(1, 9), Version(2, 0)]))

@dataclass
class Cart:
    items: list = field(default_factory=list)   # safe mutable default

c = Cart()
c.items.append("book")
print(c)
```

- `order=True` generates `<`, `>` and friends, so instances sort
- `frozen=True` makes instances immutable (and hashable)

> ⚠️ **Gotcha:** `items: list = []` raises an error in a dataclass. Use `field(default_factory=list)`.

## Challenge

> 🎯 **Challenge:** Create a dataclass `Task` with `title: str`, `priority: int = 3` and `done: bool = False`, plus a method `complete()` that sets `done` to `True`.

```python starter
from dataclasses import dataclass

class Task:
    pass

t = Task("Learn dataclasses", 1)
t.complete()
print(t)
```

```python solution
from dataclasses import dataclass

@dataclass
class Task:
    title: str
    priority: int = 3
    done: bool = False

    def complete(self):
        self.done = True

t = Task("Learn dataclasses", 1)
t.complete()
print(t)
```

```python check
import dataclasses
assert dataclasses.is_dataclass(Task), "Decorate Task with @dataclass"
t = Task("x")
assert t.priority == 3 and t.done is False
t.complete()
assert t.done is True
assert Task("a", 1) == Task("a", 1), "dataclasses compare by value"
```
