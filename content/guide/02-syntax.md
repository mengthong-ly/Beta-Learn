---
title: Syntax & indentation
section: Guide Book
summary: Statements, expressions, blocks, comments and line continuation: the grammar everything else is written in.
---
## Statements vs expressions

An **expression** produces a value: `2 + 3`, `len(name)`, `x > 5`. A **statement** does something: `x = 5`, `if`, `for`, `def`, `import`. You can put an expression anywhere a value is expected, but not a statement.

```python
x = 2 + 3                 # statement containing an expression
print(x * 10)             # a call is an expression
result = "big" if x > 3 else "small"   # conditional *expression*
print(result)
```

## Blocks are made by indentation

A line ending in `:` opens a block; every line of that block must be indented by the same amount (4 spaces by convention). The block ends when indentation returns to the previous level.

```python
for n in range(3):
    if n % 2 == 0:
        print(n, "is even")
    else:
        print(n, "is odd")
print("done")  # back at the outer level: runs once
```

> ⚠️ **Gotcha:** an empty block is a syntax error. Use `pass` as a placeholder:

```python
def todo():
    pass

class Empty:
    pass

print(todo(), Empty)
```

## Comments & docstrings

`#` starts a comment that the tokenizer throws away. A string literal as the *first statement* of a module, class or function is a **docstring**: it's kept and stored on the object.

```python
def area(r):
    """Return the area of a circle of radius r."""
    return 3.14159 * r * r  # a comment is discarded

print(area.__doc__)
help(area)
```

## Long lines

Inside `()`, `[]` or `{}`, a line can continue freely. Otherwise use a trailing `\`, which is fragile, so prefer brackets.

```python
total = (1 + 2 + 3
         + 4 + 5)
colors = [
    "red",
    "green",   # trailing commas are fine and make diffs cleaner
]
print(total, colors)
```

## Several statements on one line

A `;` separates statements. It's legal but rarely good style.

```python
a = 1; b = 2; print(a + b)
```

> 🔍 **Behind the scenes: why `print` is a function but `if` is not**
>
> Keywords like `if`, `for`, `def`, `return`, `import` are part of the **grammar**; the parser turns them into special nodes, and they compile to jumps or dedicated instructions. `print` is just a name that happens to point at a built-in function object, looked up at runtime through the `builtins` module. You can prove it: you can't assign to `if`, but you *can* shadow `print` (please don't!).

```python
import keyword

print(len(keyword.kwlist), "keywords:", keyword.kwlist[:8], "...")
print(keyword.issoftkeyword("match"))  # soft keyword: only special inside match statements
print(type(print))
```

> 🔍 **Behind the scenes: soft keywords**
>
> `match`, `case`, `type` and `_` are **soft keywords**: they're only keywords in specific positions. That's how Python 3.10 added `match` without breaking the millions of programs that already had a variable named `match`.

```python
match = "still a valid variable name"
print(match)
```

> 🧭 **Scenario:** You paste code from a website and get `IndentationError: unindent does not match any outer indentation level`. The page probably mixed tabs and spaces. Re-indent the block with spaces only (in the editor, select it and press Shift+Tab / Tab).
