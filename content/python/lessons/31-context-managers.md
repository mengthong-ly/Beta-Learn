---
title: Context managers (with)
section: 5 · Files & Libraries
---

`with` guarantees that setup and cleanup both happen, even if an error occurs in between. The classic example is files:

```python
with open("notes.txt", "w") as f:
    f.write("line one\nline two\n")
# the file is closed here automatically

with open("notes.txt") as f:
    for line in f:
        print(line.strip())
```

> 💡 **Tip:** PyLearn runs Python in your browser with an in-memory file system, so files you write exist only during that run.

## Writing your own

The easiest way is `contextlib.contextmanager`: code before `yield` is setup, code after is cleanup.

```python
from contextlib import contextmanager
import time

@contextmanager
def timer(label):
    start = time.perf_counter()
    try:
        yield
    finally:
        print(f"{label}: {(time.perf_counter() - start) * 1000:.1f} ms")

with timer("loop"):
    sum(range(100_000))
```

Or as a class with `__enter__` and `__exit__`:

```python
class Indent:
    level = 0
    def __enter__(self):
        Indent.level += 1
        return self
    def __exit__(self, *exc):
        Indent.level -= 1
    def say(self, text):
        print("  " * Indent.level + text)

with Indent() as a:
    a.say("one level")
    with Indent() as b:
        b.say("two levels")
```

## Challenge

> 🎯 **Challenge:** Write a context manager `tag(name)` using `@contextmanager` that prints `<name>` on entry and `</name>` on exit.

```python starter
from contextlib import contextmanager

def tag(name):
    pass

with tag("p"):
    print("hello")
```

```python solution
from contextlib import contextmanager

@contextmanager
def tag(name):
    print(f"<{name}>")
    yield
    print(f"</{name}>")

with tag("p"):
    print("hello")
```

```python check
assert __stdout__.splitlines() == ["<p>", "hello", "</p>"], f"Output was {__stdout__!r}"
```
