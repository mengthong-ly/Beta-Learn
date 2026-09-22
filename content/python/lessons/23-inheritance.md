---
title: Inheritance
section: 4 · Functions & OOP
---

A subclass **inherits** everything from its parent and can add to it or override it. `super()` calls the parent's version.

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

    def intro(self):
        return f"I'm {self.name}: {self.speak()}"

class Cat(Animal):
    def speak(self):               # override
        return "meow"

class Parrot(Animal):
    def __init__(self, name, words):
        super().__init__(name)     # reuse parent setup
        self.words = words

    def speak(self):
        return " ".join(self.words)

for a in [Animal("Blob"), Cat("Tom"), Parrot("Polly", ["hello", "cracker"])]:
    print(a.intro())
```

Notice that `intro()` is written once in `Animal` but calls each subclass's own `speak()`. That's **polymorphism**.

```python
class Animal: pass
class Cat(Animal): pass

tom = Cat()
print(isinstance(tom, Cat), isinstance(tom, Animal), issubclass(Cat, Animal))
```

> 💡 **Tip:** prefer shallow hierarchies. If a subclass overrides almost everything, composition (holding another object) is usually a better fit.

## Challenge

> 🎯 **Challenge:** `Shape` has an `area()` method that returns 0 and a `describe()` method. Create `Rectangle(w, h)` and `Square(side)`, where **Square inherits from Rectangle** and calls `super().__init__`.

```python starter
class Shape:
    def area(self):
        return 0

    def describe(self):
        return f"{type(self).__name__} with area {self.area()}"

# Rectangle and Square here

print(Square(3).describe())
```

```python solution
class Shape:
    def area(self):
        return 0

    def describe(self):
        return f"{type(self).__name__} with area {self.area()}"

class Rectangle(Shape):
    def __init__(self, w, h):
        self.w = w
        self.h = h

    def area(self):
        return self.w * self.h

class Square(Rectangle):
    def __init__(self, side):
        super().__init__(side, side)

print(Square(3).describe())
```

```python check
assert Rectangle(2, 5).area() == 10
assert Square(3).area() == 9
assert issubclass(Square, Rectangle) and issubclass(Rectangle, Shape), "Square → Rectangle → Shape"
assert Square(3).describe() == "Square with area 9"
assert "super()" in __src__, "Use super().__init__ in Square"
```

```quiz
? easy: What does this print?
~~~python
class Vehicle:
    def __init__(self, name):
        self.name = name
    def sound(self):
        return "..."
    def describe(self):
        return f"{self.name} goes {self.sound()}"

class Car(Vehicle):
    def sound(self):
        return "vroom"

print(Car("Tesla").describe())
~~~
+ Tesla goes vroom
- Tesla goes ...
- Car goes vroom
- vroom
> describe() is defined once on Vehicle but calls self.sound(), which looks up Car's overridden version — that's polymorphism.
? easy: Which call do you use inside a subclass to reuse the parent class's `__init__` (or other methods)?
+ `super().__init__(...)`
- `parent().__init__(...)`
- `self.__init__(...)`
- `base.__init__(...)`
> super() gives you a proxy to the parent class, so you can call its methods — most commonly __init__ — without duplicating its code.
? medium: What does this print?
~~~python
class Shape: pass
class Polygon(Shape): pass
class Triangle(Polygon): pass

t = Triangle()
print(isinstance(t, Shape), isinstance(t, Polygon), issubclass(Shape, Triangle))
~~~
+ True True False
- True True True
- False True False
- True False False
> isinstance() checks the whole chain, so a Triangle counts as both a Polygon and a Shape. issubclass(Shape, Triangle) asks the reverse question — is Shape a Triangle? — which is False.
? medium: A subclass overrides `__init__` and also wants to run the parent's setup code. What's the idiomatic way to do that?
+ Call `super().__init__(...)` inside the subclass's `__init__`
- Copy the parent's __init__ code into the subclass
- Rename the subclass's method to `__init__parent__`
- Python runs both __init__ methods automatically
> super().__init__() explicitly calls the parent's initializer so you don't have to duplicate its setup logic.
? hard: What does this print?
~~~python
class Employee:
    def __init__(self, name):
        self.name = name
    def pay(self):
        return 1000
    def summary(self):
        return f"{self.name}: {self.pay()}"

class Manager(Employee):
    def __init__(self, name, bonus):
        super().__init__(name)
        self.bonus = bonus
    def pay(self):
        return 1000 + self.bonus

team = [Employee("Al"), Manager("Bo", 500)]
print(", ".join(e.summary() for e in team))
~~~
+ Al: 1000, Bo: 1500
- Al: 1000, Bo: 1000
- Al: 1500, Bo: 1500
- Bo: 1500, Al: 1000
> summary() is written once on Employee but calls self.pay(), so each object dispatches to its own class's pay() — Manager adds its bonus, Employee doesn't.
? hard: `class Animal: pass` and `class Dog(Animal): pass`. For `d = Dog()`, how do `type(d) == Animal` and `isinstance(d, Animal)` compare?
+ `type(d) == Animal` is False, but `isinstance(d, Animal)` is True
- Both are True
- Both are False
- `type(d) == Animal` is True, but `isinstance(d, Animal)` is False
> type() gives the exact class, Dog, which isn't equal to Animal. isinstance() checks the whole inheritance chain, so a Dog still counts as an Animal.
```
