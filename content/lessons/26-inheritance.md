---
title: Inheritance
section: OOP
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
