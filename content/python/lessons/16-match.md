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

```quiz
? easy: What does `case _:` do in a `match` statement?
+ Matches anything — it's the default, catch-all case
- Matches only literal underscores
- Marks a syntax error, since `_` is reserved
- Matches only if it's the very first case
> `_` is the wildcard pattern: it always succeeds and binds no name, so it's used as the fallback.
? easy: What does this print?
~~~python
def size(n):
    match n:
        case 1:
            return "one"
        case 2 | 3:
            return "a couple"
        case _:
            return "many"

print(size(3), size(5))
~~~
+ a couple many
- one many
- a couple a couple
- many many
> `2 | 3` matches either value, so size(3) hits that case. size(5) doesn't match any listed value, so it falls to the wildcard.
? medium: What does this print?
~~~python
def axis(point):
    match point:
        case (0, 0):
            return "origin"
        case (x, 0):
            return f"x-axis at {x}"
        case (0, y):
            return f"y-axis at {y}"
        case (x, y):
            return f"at ({x}, {y})"

print(axis((7, 0)))
~~~
+ x-axis at 7
- y-axis at 7
- at (7, 0)
- origin
> Patterns are tried top to bottom. (7, 0) isn't (0, 0), but it does match `(x, 0)` since its second element is 0 — that case is checked before the generic `(x, y)`.
? medium: What does `case x if x > 0:` do?
+ Matches when x binds successfully AND the condition after `if` is true
- Matches only the literal values greater than 0
- Ignores the `if` part and always matches
- Raises an error whenever x isn't greater than 0
> A guard adds an extra condition after a pattern matches; the case is only chosen if both the pattern and the guard succeed.
? hard: What does this print?
~~~python
def classify(n):
    match n:
        case x if x < 0:
            return "negative"
        case 0:
            return "zero"
        case x if x % 2 == 0:
            return "even"
        case _:
            return "odd"

print(classify(-4), classify(0), classify(6), classify(7))
~~~
+ negative zero even odd
- negative zero odd even
- negative negative even odd
- zero zero even odd
> Each call is checked top to bottom: negative numbers hit the first guard, exactly 0 hits the literal case, even numbers hit the second guard, and everything else — like 7 — falls through to the wildcard.
```
