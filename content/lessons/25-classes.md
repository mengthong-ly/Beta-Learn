---
title: Classes & objects
section: OOP
---

A class is a blueprint that bundles **data** (attributes) with **behavior** (methods). `__init__` runs when you create an object, and `self` is the object itself.

```python
class Dog:
    species = "Canis familiaris"      # class attribute, shared by all dogs

    def __init__(self, name, age):
        self.name = name              # instance attributes
        self.age = age

    def bark(self):
        return f"{self.name} says woof!"

rex = Dog("Rex", 3)
print(rex.bark(), rex.age, rex.species)
```

Objects are independent:

```python
class Counter:
    def __init__(self):
        self.value = 0

    def increment(self, by=1):
        self.value += by
        return self

a, b = Counter(), Counter()
a.increment().increment(5)
print(a.value, b.value)
```

> ⚠️ **Gotcha:** every method needs `self` as its first parameter. Forgetting it gives a confusing `TypeError: takes 0 positional arguments but 1 was given`.

## Properties

`@property` makes a method read like an attribute:

```python
class Circle:
    def __init__(self, r):
        self.r = r

    @property
    def area(self):
        return 3.14159 * self.r ** 2

print(round(Circle(2).area, 2))
```

## Challenge

> 🎯 **Challenge:** Build a `BankAccount` class with:
>
> - `__init__(self, owner, balance=0)`
> - `deposit(amount)` which adds to the balance
> - `withdraw(amount)` which subtracts, but raises `ValueError` if there isn't enough money

```python starter
class BankAccount:
    pass

acct = BankAccount("Ada", 100)
print(acct.owner, acct.balance)
```

```python solution
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount

acct = BankAccount("Ada", 100)
print(acct.owner, acct.balance)
```

```python check
a = BankAccount("Ada", 100)
assert a.owner == "Ada" and a.balance == 100
a.deposit(50); a.withdraw(30)
assert a.balance == 120, f"balance should be 120, got {a.balance}"
assert BankAccount("Bo").balance == 0, "balance defaults to 0"
try:
    a.withdraw(1000)
except ValueError:
    pass
else:
    raise AssertionError("withdrawing too much should raise ValueError")
assert a.balance == 120, "a failed withdraw must not change the balance"
```
