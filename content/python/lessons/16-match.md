---
title: match (pattern matching)
section: 3 · Loops & Iterations
---

Python 3.10 added `match`, which is like a `switch` but can also **destructure** values.

```python
def http_status(code):
    match code:
        case 200:
            return "OK"
        case 404:
            return "Not Found"
        case 500 | 502 | 503:
            return "Server error"
        case _:
            return "Unknown"

print(http_status(404), http_status(502), http_status(1))
```

`_` is the wildcard: it matches anything.

## Matching shapes

Patterns can unpack sequences and capture parts into names:

```python
def describe(point):
    match point:
        case (0, 0):
            return "origin"
        case (0, y):
            return f"on the y-axis at {y}"
        case (x, 0):
            return f"on the x-axis at {x}"
        case (x, y):
            return f"at ({x}, {y})"

print(describe((0, 0)), "|", describe((0, 5)), "|", describe((3, 4)))
```

Add a **guard** with `if`:

```python
def sign(n):
    match n:
        case x if x > 0:
            return "positive"
        case 0:
            return "zero"
        case _:
            return "negative"

print(sign(5), sign(0), sign(-2))
```

## Challenge

> 🎯 **Challenge:** Write `command(cmd)` using `match` on a list of words:
>
> - `["go", direction]` → `"Going " + direction`
> - `["quit"]` → `"Bye"`
> - anything else → `"Unknown command"`

```python starter
def command(cmd):
    words = cmd.split()
    # match words here
    return "?"

print(command("go north"))
```

```python solution
def command(cmd):
    words = cmd.split()
    match words:
        case ["go", direction]:
            return "Going " + direction
        case ["quit"]:
            return "Bye"
        case _:
            return "Unknown command"

print(command("go north"))
```

```python check
assert command("go north") == "Going north"
assert command("go west") == "Going west"
assert command("quit") == "Bye"
assert command("dance") == "Unknown command"
assert command("go") == "Unknown command", "'go' alone has no direction"
assert "match" in __src__, "Use a match statement"
```
