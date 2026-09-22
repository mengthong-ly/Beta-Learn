---
title: print() & comments
section: 1 · Getting Started
---

`print()` shows values in the output pane. It's how you talk to yourself while learning: print everything.

```python
print("Hello, world!")
print(42)
print("Sum:", 2 + 3)
```

Pass several values separated by commas and `print` puts a space between them. Two keyword arguments change that:

| Argument | Default | What it does                     |
| -------- | ------- | -------------------------------- |
| `sep`    | `" "`   | what goes _between_ values       |
| `end`    | `"\n"`  | what goes _after_ the last value |

```python
print("a", "b", "c", sep="-")   # a-b-c
print("no newline", end="")
print(" …continued")
```

## Comments

Anything after `#` is ignored by Python. Use comments to explain _why_, not _what_.

```python
# This whole line is a comment
print("hi")  # so is this part
```

> 💡 **Tip:** Press **⌘↵** (Ctrl+Enter on Windows) to run your code without leaving the keyboard.

## Challenge

> 🎯 **Challenge:** Print `Hello, Python!` on the first line, then print the numbers `1`, `2`, `3` on the second line separated by a space, a pipe and a space, like this: `1 | 2 | 3`.

```python starter
# Line 1: Hello, Python!
# Line 2: 1 | 2 | 3

```

```python solution
print("Hello, Python!")
print(1, 2, 3, sep=" | ")
```

```python check
lines = __stdout__.splitlines()
assert len(lines) >= 2, "Print two lines."
assert lines[0] == "Hello, Python!", f"Line 1 should be 'Hello, Python!' but was {lines[0]!r}"
assert lines[1] == "1 | 2 | 3", f"Line 2 should be '1 | 2 | 3' but was {lines[1]!r}"
```
