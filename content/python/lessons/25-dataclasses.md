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

```quiz
? easy: What does this print?
~~~python
from dataclasses import dataclass

@dataclass
class Item:
    name: str
    qty: int = 1

a = Item("pen")
b = Item("pen", 1)
print(a, a == b)
~~~
+ Item(name='pen', qty=1) True
- Item('pen', 1) True
- Item(name='pen', qty=1) False
- <Item object at 0x...> True
> @dataclass auto-writes __repr__ (showing field=value pairs) and __eq__ (comparing field by field), so two Items with the same values print alike and compare equal.
? easy: Which three special methods does `@dataclass` generate by default?
+ `__init__`, `__repr__`, `__eq__`
- `__init__`, `__len__`, `__str__`
- `__new__`, `__repr__`, `__hash__`
- `__init__` only
> Those three are the defaults. order=True and frozen=True add more (comparisons, immutability) if you ask for them.
? medium: What does this print?
~~~python
from dataclasses import dataclass, field

@dataclass
class Cart:
    items: list = field(default_factory=list)

c1 = Cart()
c2 = Cart()
c1.items.append("apple")
print(c1.items, c2.items)
~~~
+ ['apple'] []
- ['apple'] ['apple']
- [] []
- ['apple']
> default_factory=list calls list() fresh for every new Cart, so c1 and c2 start with independent empty lists — appending to one doesn't touch the other.
? medium: Why does `items: list = []` raise an error as a dataclass field, instead of just working like a normal default argument?
+ Because a plain mutable default would be shared by every instance, so @dataclass forbids it and asks for `field(default_factory=list)` instead
- Because dataclasses don't support the list type at all
- Because `[]` isn't valid Python syntax inside a class body
- Because dataclasses require every field to have a default of int or str
> Mutable defaults shared across instances are a classic bug; @dataclass catches this at class-definition time and asks you to use default_factory so each instance gets its own list.
? hard: What does this print?
~~~python
from dataclasses import dataclass

@dataclass(order=True, frozen=True)
class Release:
    major: int
    minor: int = 0

versions = sorted([Release(1, 5), Release(1, 2), Release(2, 0)])
print(versions)
~~~
+ [Release(major=1, minor=2), Release(major=1, minor=5), Release(major=2, minor=0)]
- [Release(major=1, minor=5), Release(major=1, minor=2), Release(major=2, minor=0)]
- [Release(major=2, minor=0), Release(major=1, minor=5), Release(major=1, minor=2)]
- TypeError: '<' not supported between instances of 'Release'
> order=True generates comparisons that treat the fields as a tuple (major, minor), so sorted() orders first by major, then by minor.
? hard: What happens if you try to reassign a field on a `frozen=True` dataclass instance, e.g. `release.major = 3`?
+ It raises `FrozenInstanceError` (a subclass of AttributeError)
- It silently does nothing
- It works, but only the first time
- It raises a TypeError about missing arguments
> frozen=True adds a __setattr__ that blocks attribute assignment, raising FrozenInstanceError to emulate immutability.
```
