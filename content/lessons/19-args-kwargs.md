---
title: "*args & **kwargs"
section: Functions
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
