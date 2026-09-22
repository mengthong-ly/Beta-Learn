---
title: Modules & imports
section: Guide Book
summary: How import finds and runs code, sys.modules, packages, `if __name__ == "__main__"`, and a tour of the standard library.
---
## Import forms

```python
import math                       # the module object, use math.sqrt
from math import sqrt, pi         # specific names
from collections import Counter as C   # rename
import json as j

print(math.sqrt(16), sqrt(9), pi, C("aab"), j.dumps({"ok": True}))
```

> ⚠️ **Gotcha:** avoid `from module import *`. It dumps unknown names into your namespace and makes it unclear where anything came from.

> 🔍 **Behind the scenes: what `import` actually does**
>
> 1. **Check the cache.** Look in `sys.modules`. If the module is already there, just bind the name. That's why importing twice doesn't run the module twice.
> 2. **Find it.** Walk the *finders*, looking through the built-in modules, then each folder in `sys.path`.
> 3. **Load it.** Create a new module object, put it in `sys.modules` *before* running it (so circular imports can find the half-built module), then **execute the module's code** top to bottom in the module's namespace.
> 4. **Bind** the name in your namespace.
>
> A module is just an object whose attributes are the global variables its code created.

```python
import sys, math

print("math" in sys.modules, type(math), math.__name__)
print(len(sys.modules), "modules loaded so far")
print(sys.path[:3])
```

## Modules are objects

```python
import math

print([name for name in dir(math) if not name.startswith("_")][:10])
print(getattr(math, "tau"))
```

## `if __name__ == "__main__":`

Every module has a `__name__`. When a file is run directly, its `__name__` is `"__main__"`; when it's imported, it's the module's name. This guard lets a file be both a runnable script and an importable library.

```python
def main():
    print("running as a script")

if __name__ == "__main__":
    main()
else:
    print("imported, so main() doesn't run")
```

## Writing and importing your own module

In ThongLearn everything runs from one editor, but you can write a real module file into the in-memory filesystem and import it:

```python
import sys, importlib

with open("greetings.py", "w") as f:
    f.write('print("module code runs once")\ndef hello(name):\n    return f"hello {name}"\n')

sys.path.insert(0, ".")
import greetings
import greetings            # cached: the print doesn't happen again
print(greetings.hello("Ada"), greetings.__file__)
importlib.reload(greetings) # forces a re-run
```

> 🔍 **Behind the scenes: packages**
>
> A **package** is a folder of modules. `import shop.cart` imports `shop` (running `shop/__init__.py` if it exists), then `shop/cart.py`, and binds the name `shop`, with `cart` reachable as an attribute. Relative imports (`from . import cart`) resolve against the package the current module belongs to.

## A standard library tour

| Module | Use it for |
|---|---|
| `collections` | `Counter`, `defaultdict`, `deque`, `namedtuple` |
| `itertools` / `functools` | iteration tools, `cache`, `partial`, `reduce` |
| `datetime` / `time` | dates, times, durations |
| `json` / `csv` | reading and writing data formats |
| `re` | regular expressions |
| `pathlib` / `os` | files and paths |
| `random` / `statistics` / `math` | numbers |
| `dataclasses` / `typing` / `enum` | modeling data |

```python
import re, json, statistics
from datetime import date, timedelta
from enum import Enum

print(re.findall(r"\d+", "order 12 of 345"))
print(json.loads('{"a": [1, 2]}')["a"])
print(statistics.mean([2, 4, 9]), statistics.median([2, 4, 9]))
print(date(2026, 1, 1) + timedelta(days=45))

class Size(Enum):
    S = 1
    M = 2
print(Size.M, Size(1).name)
```

> 🔍 **Behind the scenes: why ThongLearn can't `pip install`**
>
> Python packages that contain C code have to be compiled specifically for WebAssembly. Pyodide provides many (NumPy, pandas…) through its own package loader, `micropip`, but ThongLearn sticks to the **standard library**. It's large enough to learn the whole language, and every example here runs offline once Python has loaded.

> 🧭 **Scenario:** You split a growing script into `models.py`, `storage.py` and `main.py`. Keep the side effects (printing, starting things) inside `main()` behind the `__name__` guard, so importing `models` from a test file never accidentally runs your whole program.
