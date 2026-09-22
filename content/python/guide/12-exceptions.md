---
title: Errors & exceptions
section: Guide Book
summary: Reading tracebacks, catching and raising, the exception hierarchy, custom errors, and cleanup with finally and with.
---
## Reading a traceback

Read it **bottom-up**: the last line is *what* happened, and the lines above are *where*, from the outermost call down to the line that failed.

```python
def parse(text):
    return int(text)

def load(values):
    return [parse(v) for v in values]

load(["1", "2", "three"])  # error!
```

## try / except / else / finally

```python
def safe_div(a, b):
    try:
        result = a / b
    except ZeroDivisionError:
        return "can't divide by zero"
    except (TypeError, ValueError) as e:
        return f"bad input: {e}"
    else:
        return result            # only if nothing was raised
    finally:
        print("cleanup always runs")

print(safe_div(6, 3)); print(safe_div(1, 0)); print(safe_div("a", 1))
```

> ⚠️ **Gotcha:** a bare `except:` also catches `KeyboardInterrupt` and `SystemExit`, and hides your own typos. Catch specific exceptions, or `except Exception` at most.

## The hierarchy

```text
BaseException
 ├── KeyboardInterrupt, SystemExit      (don't catch these)
 └── Exception
      ├── ArithmeticError → ZeroDivisionError, OverflowError
      ├── LookupError     → IndexError, KeyError
      ├── ValueError, TypeError, NameError, AttributeError
      ├── OSError         → FileNotFoundError, PermissionError
      └── RuntimeError    → RecursionError, NotImplementedError
```

Catching a parent catches all its children:

```python
for bad in ([].pop, lambda: {}["x"]):
    try:
        bad()
    except LookupError as e:
        print(type(e).__name__, "is a LookupError")
```

## Raising and custom errors

```python
class InsufficientFunds(Exception):
    def __init__(self, needed):
        super().__init__(f"need {needed} more")
        self.needed = needed

def withdraw(balance, amount):
    if amount <= 0:
        raise ValueError("amount must be positive")
    if amount > balance:
        raise InsufficientFunds(amount - balance)
    return balance - amount

try:
    withdraw(50, 80)
except InsufficientFunds as e:
    print("declined:", e, "| short by", e.needed)
```

## Chaining: `raise ... from ...`

```python
class ConfigError(Exception):
    pass

try:
    try:
        int("abc")
    except ValueError as e:
        raise ConfigError("port must be a number") from e
except ConfigError as e:
    print(e, "| caused by:", repr(e.__cause__))
```

> 🔍 **Behind the scenes: how an exception travels**
>
> `raise` creates an exception object and starts **unwinding the stack**. Python checks the current frame's exception table for a matching handler; if there isn't one, the frame is discarded and the search continues in the caller's frame, all the way up. Each discarded frame adds an entry to the exception's **traceback** (`e.__traceback__`), which is exactly the list you read in the error message. If nothing catches it, the top level prints the traceback and stops.

```python
import traceback

def a(): b()
def b(): c()
def c(): raise RuntimeError("deep")

try:
    a()
except RuntimeError as e:
    frames = traceback.extract_tb(e.__traceback__)
    print([f.name for f in frames])
```

> 🔍 **Behind the scenes: `try` is free, `raise` is not**
>
> Since Python 3.11, CPython uses **zero-cost exceptions**: entering a `try` block costs nothing, because the handlers live in a side table that's only consulted when something is raised. Actually raising and unwinding *is* relatively expensive, so don't use exceptions for common, expected control flow in hot loops. For rare errors, "ask forgiveness" (`try/except KeyError`) is perfectly idiomatic.

## Cleanup with `with`

A context manager guarantees cleanup even when an error happens: files get closed, locks get released.

```python
from contextlib import contextmanager

@contextmanager
def step(name):
    print(f"start {name}")
    try:
        yield
    finally:
        print(f"end {name}")        # runs even if the block raises

try:
    with step("import"):
        raise ValueError("bad row")
except ValueError as e:
    print("handled:", e)
```

## Exception groups (3.11+)

```python
try:
    raise ExceptionGroup("batch failed", [ValueError("row 3"), TypeError("row 7")])
except* ValueError as g:
    print("value errors:", g.exceptions)
except* TypeError as g:
    print("type errors:", g.exceptions)
```

> 🧭 **Scenario:** Importing a CSV where some rows are broken: catch `ValueError` **per row**, collect the problems, and keep going, instead of letting one bad row kill the whole import.

```python
rows = ["10", "20", "oops", "40", ""]
good, bad = [], []
for i, raw in enumerate(rows, start=1):
    try:
        good.append(int(raw))
    except ValueError:
        bad.append(i)
print("imported:", good, "| bad rows:", bad)
```
