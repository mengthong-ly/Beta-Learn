---
title: "*args & **kwargs"
section: 4 · Functions & OOP
---

`*args` collects extra **positional** arguments into a tuple; `**kwargs` collects extra **keyword** arguments into a dict.

```python
def total(*args):
    return sum(args)

print(total(1, 2, 3), total())

def profile(**kwargs):
    for key, value in kwargs.items():
        print(f"{key} = {value}")

profile(name="Ada", lang="Python")
```

Combine them, in this order: regular, `*args`, keyword-only, `**kwargs`:

```python
def log(level, *messages, sep=" ", **extra):
    print(f"[{level}]", sep.join(messages), extra)

log("INFO", "server", "started", sep=" | ", port=8080)
```

## Unpacking when calling

`*` and `**` also **spread** a list or dict into arguments:

```python
def point(x, y, z):
    return f"({x}, {y}, {z})"

coords = [1, 2, 3]
opts = {"x": 9, "y": 8, "z": 7}
print(point(*coords), point(**opts))
```

> 💡 **Tip:** the names `args` and `kwargs` are only a convention. The `*` and `**` are what matter.

## Challenge

> 🎯 **Challenge:** Write `make_tag(tag, *children, **attrs)` that builds HTML. `make_tag("a", "Click", href="/home")` → `<a href="/home">Click</a>`. Children are joined with no separator.

```python starter
def make_tag(tag, *children, **attrs):
    return ""

print(make_tag("a", "Click", href="/home"))
```

```python solution
def make_tag(tag, *children, **attrs):
    attr_text = "".join(f' {k}="{v}"' for k, v in attrs.items())
    return f"<{tag}{attr_text}>{''.join(children)}</{tag}>"

print(make_tag("a", "Click", href="/home"))
```

```python check
assert make_tag("a", "Click", href="/home") == '<a href="/home">Click</a>'
assert make_tag("p") == "<p></p>"
assert make_tag("b", "x", "y") == "<b>xy</b>"
assert make_tag("img", src="a.png", alt="A") == '<img src="a.png" alt="A"></img>'
```

```quiz
? easy: What data type does `*args` collect its extra positional arguments into?
+ A tuple
- A list
- A dict
- A set
> `*args` gathers any leftover positional arguments into a tuple named `args` (or whatever name follows the `*`).
? easy: What does this print?
~~~python
def total(*args):
    return sum(args)

print(total(2, 4, 6))
~~~
+ 12
- (2, 4, 6)
- 2 4 6
- 0
> args collects 2, 4, 6 into a tuple, and sum() adds them up to 12.
? medium: What does this print?
~~~python
def profile(**kwargs):
    for key, value in kwargs.items():
        print(f"{key}: {value}")

profile(city="Phnom Penh", country="Cambodia")
~~~
+ city: Phnom Penh\ncountry: Cambodia
- kwargs: {'city': 'Phnom Penh', 'country': 'Cambodia'}
- city country
- country: Cambodia\ncity: Phnom Penh
> **kwargs collects keyword arguments into a dict, in the order they were passed. .items() then walks those key, value pairs in that same order.
? medium: Given `coords = [3, 4, 5]` and `def point(x, y, z): ...`, what does `point(*coords)` do?
+ Spreads the list into three separate positional arguments: x=3, y=4, z=5
- Passes the whole list as a single argument to x
- Raises an error, since lists can't be unpacked
- Passes coords in as `**kwargs`
> `*` before a list at a call site spreads its items into separate positional arguments, one per parameter.
? hard: What does this print?
~~~python
def summary(label, *values, sep=", ", **extra):
    return f"{label}: {sep.join(str(v) for v in values)} {extra}"

print(summary("Scores", 10, 20, 30, sep=" | ", passed=True))
~~~
+ Scores: 10 | 20 | 30 {'passed': True}
- Scores: 10, 20, 30 {'passed': True}
- Scores: 10 | 20 | 30 {}
- Scores: 10 | 20 | 30 True
> 10, 20 and 30 are extra positional args, collected into `values`. `sep` is passed by keyword, overriding its default. `passed=True` doesn't match any named parameter, so it lands in `**extra` as a dict.
```
