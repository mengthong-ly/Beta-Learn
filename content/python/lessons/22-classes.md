---
title: Classes & objects
section: 4 · Functions & OOP
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

```quiz
? easy: What does this print?
~~~python
class Book:
    category = "fiction"

    def __init__(self, title, pages):
        self.title = title
        self.pages = pages

b = Book("Dune", 412)
print(b.title, b.pages, b.category)
~~~
+ Dune 412 fiction
- Dune 412 None
- Book 412 fiction
- Dune fiction 412
> __init__ sets title and pages as instance attributes; category is a class attribute shared by every Book, so b can read it too.
? easy: What must be the first parameter of every instance method?
+ `self`
- `this`
- `cls`
- The class's own name
> Python passes the instance automatically as the first argument to every instance method, conventionally named self.
? medium: What does this print?
~~~python
class Score:
    def __init__(self):
        self.value = 0
    def add(self, n=1):
        self.value += n
        return self

x, y = Score(), Score()
x.add().add(10)
print(x.value, y.value)
~~~
+ 11 0
- 11 11
- 0 0
- 1 0
> Each Score() call makes an independent object with its own value, so changes to x don't touch y. Chaining works because add() returns self, and x's total ends up 1 + 10 = 11.
? medium: What error do you get if a method is defined without `self` as its first parameter, and you then call it normally as `obj.method()`?
+ TypeError: takes 0 positional arguments but 1 was given
- NameError: self is not defined
- AttributeError: no attribute self
- SyntaxError
> Python automatically passes the instance as an argument to every method call; a method with no parameter to receive it complains about the argument count.
? hard: What does this print?
~~~python
class Circle:
    def __init__(self, r):
        self.r = r

    @property
    def area(self):
        return round(3.14159 * self.r ** 2, 2)

c = Circle(2)
print(c.area)
c.r = 3
print(c.area)
~~~
+ 12.57\n28.27
- 12.57\n12.57
- 12.56\n28.27
- Error: can't reassign r
> @property recomputes its value every time it's accessed — there's no caching — so changing c.r changes what c.area returns on the next access. r is a normal attribute, so reassigning it is fine.
? hard: A class defines `perimeter` as a `@property`. What happens if you call it with parentheses, `obj.perimeter()`, instead of `obj.perimeter`?
+ TypeError — the property's value usually isn't callable, so adding () tries to call it and fails
- It works exactly the same as without parentheses
- AttributeError: no such method
- It returns the underlying method object
> @property makes access look like a plain attribute. What you get back (a number, a string, …) generally can't be called, so `()` raises a TypeError.
```
