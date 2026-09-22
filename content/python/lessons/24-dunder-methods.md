---
title: Dunder (magic) methods
section: 4 · Functions & OOP
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

```quiz
? easy: What does this print?
~~~python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __repr__(self):
        return f"Point({self.x}, {self.y})"
    def __add__(self, other):
        return Point(self.x + other.x, self.y + other.y)

p = Point(1, 2) + Point(3, 4)
print(p)
~~~
+ Point(4, 6)
- (1, 2)
- TypeError: unsupported operand type(s)
- Point(1, 2, 3, 4)
> __add__ defines what + does between two Points, returning a new Point; __repr__ defines how that Point prints.
? easy: Which dunder method controls what `print(obj)` shows, when a class defines it?
+ `__repr__`
- `__init__`
- `__call__`
- `__format__`
> `__repr__` returns the string used for printing (and for repr()) when a class doesn't define a separate `__str__`.
? medium: What does this print?
~~~python
class Bag:
    def __init__(self, items):
        self.items = items
    def __len__(self):
        return len(self.items)
    def __eq__(self, other):
        return self.items == other.items

b1 = Bag([1, 2, 3])
b2 = Bag([1, 2, 3])
print(len(b1), b1 == b2, b1 is b2)
~~~
+ 3 True False
- 3 False False
- 3 True True
- 3 False True
> len() calls __len__. == calls our __eq__, which compares the items lists by value — True even though b1 and b2 are different objects, which is what `is` checks.
? medium: Which dunder method lets `for item in obj:` work, even when the class never defines `__iter__`?
+ `__getitem__`
- `__len__`
- `__repr__`
- `__next__`
> Python falls back to calling __getitem__(0), __getitem__(1), … until it raises IndexError, so defining __getitem__ alone makes an object iterable.
? hard: What does this print?
~~~python
class Card:
    def __init__(self, rank):
        self.rank = rank
    def __repr__(self):
        return f"Card({self.rank})"
    def __lt__(self, other):
        return self.rank < other.rank

cards = [Card(9), Card(2), Card(5)]
print(sorted(cards))
~~~
+ [Card(2), Card(5), Card(9)]
- [Card(9), Card(2), Card(5)]
- [Card(2), Card(9), Card(5)]
- TypeError: '<' not supported between instances of 'Card'
> sorted() needs a way to compare items; __lt__ provides that, so it can order the cards by rank. Printing the resulting list uses each Card's __repr__.
? hard: What happens if a class defines `__eq__` but not `__repr__` (or `__str__`)?
+ Printing an instance still shows the default `<ClassName object at 0x...>` format
- Printing an instance raises a TypeError
- Printing an instance shows the object's __eq__ result
- Python auto-generates a __repr__ from __eq__'s comparison
> __eq__ only changes what == does. Without a custom __repr__ or __str__, printing falls back to the default object representation — that's why __repr__ is usually the first dunder method people add.
```
