---
title: try / except / finally
section: Errors
---

Catch an exception so your program can recover instead of crashing.

```python
try:
    n = int("forty-two")
except ValueError:
    n = 0
    print("Not a number, using 0")
print(n)
```

## The full shape

```python
def divide(a, b):
    try:
        result = a / b
    except ZeroDivisionError:
        return "can't divide by zero"
    except TypeError as e:
        return f"bad input: {e}"
    else:
        return result          # runs only if no exception
    finally:
        print("done")          # always runs, even after return

print(divide(10, 2))
print(divide(1, 0))
print(divide("a", 2))
```

> ⚠️ **Gotcha:** don't write a bare `except:`. It hides every bug, even typos. Catch the specific exception you expect.

> 💡 **Tip:** keep the `try` block small, wrapping only the line that can fail.

## Challenge

> 🎯 **Challenge:** Write `safe_int(text, default=0)` that converts text to an int, or returns `default` if it can't.

```python starter
def safe_int(text, default=0):
    return int(text)

print(safe_int("42"), safe_int("hello"), safe_int("x", -1))
```

```python solution
def safe_int(text, default=0):
    try:
        return int(text)
    except ValueError:
        return default

print(safe_int("42"), safe_int("hello"), safe_int("x", -1))
```

```python check
assert safe_int("42") == 42
assert safe_int("hello") == 0
assert safe_int("x", -1) == -1
assert safe_int(" 7 ") == 7
```
