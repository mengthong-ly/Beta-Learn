---
title: Classes & objects
section: Guide Book
summary: Defining classes, instances, methods, inheritance, properties and dunder methods, and how attribute lookup really works.
---
## A class and its instances

```python
class Account:
    bank = "PyBank"                      # class attribute, shared

    def __init__(self, owner, balance=0):
        self.owner = owner               # instance attributes
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount
        return self

    def __repr__(self):
        return f"Account({self.owner!r}, {self.balance})"

a = Account("Ada").deposit(50).deposit(25)
print(a, a.bank, a.__dict__)
```

> 🔍 **Behind the scenes: what `self` really is**
>
> `a.deposit(50)` is shorthand for `Account.deposit(a, 50)`. Looking up `deposit` on an instance returns a **bound method**, a small object remembering both the function and the instance, and calling it slips the instance in as the first argument. `self` is just the conventional name for that argument.

```python
class Account:
    def __init__(self):
        self.balance = 0
    def deposit(self, amount):
        self.balance += amount

a = Account()
m = a.deposit
print(m, m.__self__ is a, m.__func__ is Account.deposit)
Account.deposit(a, 10)
print(a.balance)
```

## Attribute lookup order

For `obj.name`, Python checks:

1. **data descriptors** on the class (like `@property`)
2. the instance's own `__dict__`
3. the class, then its parents in **MRO** order
4. `__getattr__`, if defined, as a last resort

```python
class Temperature:
    def __init__(self, celsius):
        self._c = celsius

    @property
    def fahrenheit(self):              # computed on every access
        return self._c * 9 / 5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value):
        self._c = (value - 32) * 5 / 9

t = Temperature(100)
print(t.fahrenheit)
t.fahrenheit = 32
print(t._c)
```

> 🔍 **Behind the scenes: a class is created by running its body**
>
> A `class` statement **executes** its body like a function, collecting everything defined there into a namespace dict. It then calls the **metaclass** (normally `type`) with the name, bases and namespace to build the class object. So `class Dog: ...` is the same as `Dog = type("Dog", (), {...})`, and classes are ordinary objects you can pass around.

```python
Dog = type("Dog", (), {"sound": "woof", "speak": lambda self: self.sound})
print(Dog().speak(), type(Dog), Dog.__name__)
```

## Inheritance and `super()`

```python
class Animal:
    def __init__(self, name):
        self.name = name
    def speak(self):
        return "..."
    def intro(self):
        return f"{self.name}: {self.speak()}"

class Dog(Animal):
    def speak(self):
        return "woof"

class Puppy(Dog):
    def __init__(self, name, age):
        super().__init__(name)
        self.age = age
    def speak(self):
        return super().speak() + " (tiny)"

p = Puppy("Rex", 1)
print(p.intro(), isinstance(p, Animal), [c.__name__ for c in Puppy.__mro__])
```

> 🔍 **Behind the scenes: the MRO**
>
> With multiple inheritance, Python computes a single **Method Resolution Order** using the *C3 linearization* algorithm: children come before parents, and the order you list the bases in is kept. `super()` doesn't mean "my parent"; it means **"the next class in the MRO of the actual object"**. That's what makes cooperative multiple inheritance work.

```python
class A:
    def hi(self): return "A"
class B(A):
    def hi(self): return "B→" + super().hi()
class C(A):
    def hi(self): return "C→" + super().hi()
class D(B, C):
    def hi(self): return "D→" + super().hi()

print(D().hi(), [k.__name__ for k in D.__mro__])
```

## Dunder methods

They hook your objects into Python's syntax:

| You write | Python calls |
|---|---|
| `len(x)` | `x.__len__()` |
| `x[i]` | `x.__getitem__(i)` |
| `x == y` | `x.__eq__(y)` |
| `x + y` | `x.__add__(y)` |
| `for i in x` | `x.__iter__()` |
| `str(x)` / `repr(x)` | `__str__` / `__repr__` |
| `with x:` | `__enter__` / `__exit__` |
| `x()` | `x.__call__()` |

```python
class Deck:
    def __init__(self):
        self.cards = [f"{r}{s}" for s in "♠♥" for r in "AKQ"]
    def __len__(self):
        return len(self.cards)
    def __getitem__(self, i):
        return self.cards[i]

d = Deck()
print(len(d), d[0], d[-1], "Q♥" in d, list(reversed(d))[:2])   # __getitem__ gives iteration & `in` for free
```

## Dataclasses

```python
from dataclasses import dataclass, field

@dataclass(order=True)
class Item:
    price: float
    name: str = field(compare=False)
    tags: list = field(default_factory=list, compare=False)

items = [Item(3.5, "tea"), Item(1.2, "gum")]
print(sorted(items)[0], Item(1, "a") == Item(1, "b"))
```

> 🔍 **Behind the scenes: `__slots__`**
>
> Every normal instance carries a `__dict__` for its attributes, which is flexible but costs memory. Declaring `__slots__ = ("x", "y")` replaces the dict with fixed slots: smaller objects, slightly faster access, and no new attributes allowed. It's useful when you create millions of small objects.

```python
import sys

class P:
    def __init__(self): self.x, self.y = 1, 2
class S:
    __slots__ = ("x", "y")
    def __init__(self): self.x, self.y = 1, 2

p, s = P(), S()
print(sys.getsizeof(p) + sys.getsizeof(p.__dict__), sys.getsizeof(s), hasattr(s, "__dict__"))
```

> 🧭 **Scenario:** Modeling an online shop: a `Cart` class holding `Item`s, with `__len__` for the item count, `__iter__` to loop over items, and a `total` property. The rest of your code can then write `len(cart)` and `for item in cart:` naturally.
