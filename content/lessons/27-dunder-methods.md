---
title: Dunder (magic) methods
section: OOP
---

"Dunder" means **d**ouble **under**score. These special methods let your objects work with Python's built-in syntax: `print`, `+`, `==`, `len`, `for` and more.

```python
class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __repr__(self):              # how it prints
        return f"Vector({self.x}, {self.y})"

    def __add__(self, other):        # v1 + v2
        return Vector(self.x + other.x, self.y + other.y)

    def __eq__(self, other):         # v1 == v2
        return (self.x, self.y) == (other.x, other.y)

    def __abs__(self):               # abs(v)
        return (self.x ** 2 + self.y ** 2) ** 0.5

v = Vector(3, 4) + Vector(1, 1)
print(v, v == Vector(4, 5), abs(Vector(3, 4)))
```

| Method                 | Enables                |
| ---------------------- | ---------------------- |
| `__repr__` / `__str__` | `repr(x)` / `print(x)` |
| `__len__`              | `len(x)`               |
| `__getitem__`          | `x[i]`                 |
| `__iter__`             | `for item in x`        |
| `__contains__`         | `item in x`            |
| `__lt__`               | `x < y`, `sorted()`    |

```python
class Playlist:
    def __init__(self, songs):
        self.songs = songs
    def __len__(self):
        return len(self.songs)
    def __getitem__(self, i):
        return self.songs[i]

p = Playlist(["a", "b", "c"])
print(len(p), p[0], list(p))   # __getitem__ even makes it iterable
```

## Challenge

> 🎯 **Challenge:** Make `Money` support `print` (showing `$12.50`), `+` between two Money objects, and `<` for comparison, so `sorted()` works.

```python starter
class Money:
    def __init__(self, cents):
        self.cents = cents

print(Money(1250))
```

```python solution
class Money:
    def __init__(self, cents):
        self.cents = cents

    def __repr__(self):
        return f"${self.cents / 100:.2f}"

    def __add__(self, other):
        return Money(self.cents + other.cents)

    def __lt__(self, other):
        return self.cents < other.cents

print(Money(1250))
```

```python check
assert str(Money(1250)) == "$12.50", f"print should show $12.50, got {Money(1250)}"
assert (Money(100) + Money(250)).cents == 350
assert Money(1) < Money(2)
assert [m.cents for m in sorted([Money(3), Money(1), Money(2)])] == [1, 2, 3]
```
