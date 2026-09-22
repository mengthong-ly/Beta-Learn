---
title: Reading & writing files
section: 5 · Files & Libraries
---

Programs forget everything when they stop. Files are how data survives: you **write** results to a file and **read** data someone else saved.

> 📝 **Note:** Here, files live in your browser's memory, not on your disk. A few practice files are always available: `sales.csv`, `sales_raw.csv`, `students.csv` and `branches.csv`. They're reset before every run, so you can't break them.

```python
import os
print(os.listdir())
```

## Opening a file

`open(path, mode)` gives you a file object. Always use it in a `with` block: the file is closed for you when the block ends, even if an error happens.

| Mode  | Meaning                                    |
| ----- | ------------------------------------------ |
| `"r"` | read (the default); error if missing       |
| `"w"` | write; **creates or wipes** the file first |
| `"a"` | append to the end; creates if missing      |

```python
with open("notes.txt", "w", encoding="utf-8") as f:
    f.write("first line\n")
    f.write("second line\n")

with open("notes.txt", encoding="utf-8") as f:
    print(f.read())
```

> ⚠️ **Gotcha:** `write()` does **not** add a newline for you. Put `\n` at the end of every line, or your lines run together.

## Three ways to read

```python
with open("students.csv") as f:
    text = f.read()          # the whole file as one string
print(len(text), "characters")

with open("students.csv") as f:
    lines = f.readlines()    # a list of lines, each still ending in "\n"
print(lines[0])

with open("students.csv") as f:
    for line in f:           # one line at a time (best for big files)
        print(line.strip())  # .strip() removes the trailing "\n"
        break
```

## Appending

`"a"` adds to the end instead of starting over: perfect for logs.

```python
for day in ["Mon", "Tue"]:
    with open("log.txt", "a") as f:
        f.write(f"{day}: opened shop\n")

with open("log.txt") as f:
    print(f.read())
```

## When the file isn't there

Reading a missing file raises `FileNotFoundError`. Catch it when a missing file is a normal situation.

```python
try:
    with open("missing.txt") as f:
        print(f.read())
except FileNotFoundError:
    print("No file yet: starting fresh.")
```

## pathlib: the modern shortcut

`pathlib.Path` wraps a path with handy methods, so short reads and writes are one line.

```python
from pathlib import Path

p = Path("hello.txt")
p.write_text("Hello from pathlib!\n")
print(p.exists(), p.suffix, p.read_text())
```

> 🔍 **Behind the scenes: why the `with` block matters**
>
> Writing is **buffered**: `f.write()` puts text in memory and Python sends it to the file in chunks. Closing the file flushes whatever is left. Forget to close (or crash before you do) and the end of your data can simply be missing. `with` calls `f.close()` for you, which is why it's the only way you should open files.

## Challenge

> 🎯 **Challenge:** Write two functions. `save_lines(path, items)` writes each item on its own line. `count_lines(path)` returns how many **non-empty** lines the file has (ignore lines that are blank or only spaces).

```python starter
def save_lines(path, items):
    pass

def count_lines(path):
    return 0

save_lines("todo.txt", ["buy milk", "study pandas", "call Dara"])
print(count_lines("todo.txt"))
```

```python solution
def save_lines(path, items):
    with open(path, "w") as f:
        for item in items:
            f.write(f"{item}\n")

def count_lines(path):
    count = 0
    with open(path) as f:
        for line in f:
            if line.strip():
                count += 1
    return count

save_lines("todo.txt", ["buy milk", "study pandas", "call Dara"])
print(count_lines("todo.txt"))
```

```python check
save_lines("_t.txt", ["a", "b"])
assert open("_t.txt").read() == "a\nb\n", "Each item should be on its own line, ending with \\n."
save_lines("_t.txt", ["only"])
assert open("_t.txt").read() == "only\n", "save_lines should replace the old contents (use mode 'w')."
with open("_t.txt", "w") as f:
    f.write("x\n\n   \ny\n")
assert count_lines("_t.txt") == 2, "Skip blank lines."
assert count_lines("students.csv") == 13
```
