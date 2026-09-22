---
title: How Python runs your code
section: Guide Book
summary: From the text you type to instructions a virtual machine executes, step by step.
---
When you press **Run**, Python doesn't read your file line by line like a person would. It goes through a small pipeline, and knowing that pipeline explains a lot of "why does Python do that?" moments.

```text
your text ──► tokens ──► syntax tree (AST) ──► bytecode ──► Python Virtual Machine
 "x = 1"      NAME OP    Assign(x, 1)          LOAD_SMALL_INT   runs it, one
              NUMBER                           STORE_NAME       instruction at a time
```

## 1. Tokenizing: cutting text into words

The tokenizer splits your source into tokens: names, operators, numbers, strings, and, uniquely for Python, `INDENT` and `DEDENT` tokens that come from whitespace.

```python
import io, tokenize

src = "if x > 1:\n    y = x * 2\n"
for tok in tokenize.generate_tokens(io.StringIO(src).readline):
    print(f"{tokenize.tok_name[tok.type]:<10} {tok.string!r}")
```

> 🔍 **Behind the scenes: indentation is a token, not decoration**
>
> Most languages throw whitespace away. Python's tokenizer keeps a stack of indentation levels. When a line is indented deeper, it emits `INDENT`; when it returns to an earlier level, it emits one `DEDENT` per level closed. The parser then sees `INDENT ... DEDENT` exactly like other languages see `{ ... }`. That's why mixing tabs and spaces, or an indent that matches no earlier level, is a *syntax* error: the tokenizer can't decide which block you meant.

## 2. Parsing: building a syntax tree

The parser checks the grammar and builds an **Abstract Syntax Tree**, a tree of what your code *means*. `SyntaxError` is raised here, before a single line runs, which is why a typo on line 50 stops line 1 from ever executing.

```python
import ast

tree = ast.parse("total = price * 2 + tax")
print(ast.dump(tree.body[0], indent=2))
```

## 3. Compiling: turning the tree into bytecode

The compiler walks the tree and produces **bytecode**: compact instructions for an imaginary machine. You can see them with the `dis` module, or just press Run and open the **Inspect** tab, which shows the bytecode for your own code.

```python
import dis

def area(w, h):
    return w * h

dis.dis(area)
```

> 🔍 **Behind the scenes: where do the instructions live?**
>
> Every function (and every module, class body and comprehension) is compiled into a **code object**. It holds the bytecode (`co_code`), the constants it uses (`co_consts`), the names it reads (`co_names`), its local variable names (`co_varnames`) and a table mapping instructions back to line numbers. That table is how a traceback can tell you "line 12" even though the machine only knows instruction offsets.
>
> When you `import` a module, CPython saves the compiled code to a `.pyc` file in `__pycache__/` so the next import can skip steps 1–3 entirely.

```python
def greet(name):
    message = "Hello, " + name
    return message

code = greet.__code__
print("constants:", code.co_consts)
print("locals:   ", code.co_varnames)
print("args:     ", code.co_argcount)
```

## 4. Running: the virtual machine

The **Python Virtual Machine** is a loop in C (`ceval.c`) that fetches the next instruction, executes it, and repeats. Most instructions push and pop values on a small **value stack** inside the current **frame**: one frame per running function call.

```text
x = a + b   compiles to:
  LOAD_NAME a     stack: [a]
  LOAD_NAME b     stack: [a, b]
  BINARY_OP +     stack: [a+b]      (calls a.__add__(b))
  STORE_NAME x    stack: []         (binds the name x)
```

> 🔍 **Behind the scenes: Python rewrites its own bytecode while it runs**
>
> Since Python 3.11, CPython has a **specializing adaptive interpreter**. After an instruction runs a few times, the interpreter swaps it for a faster, specialized version based on what it actually saw. For example, `BINARY_OP` becomes `BINARY_OP_ADD_INT` if both sides keep being ints. If the guess ever turns out wrong, it quietly falls back. That's a big part of why 3.11+ is much faster than 3.10, with no change to your code.

## Where does *this* Python run?

ThongLearn runs real **CPython 3.14**, compiled to **WebAssembly** (the Pyodide project), inside a background thread of your browser called a Web Worker. Nothing is sent to a server. That's also why an infinite loop can't freeze the page: the worker is simply thrown away and a fresh one started.

```python
import sys, platform

print(sys.version)
print(sys.platform)          # "emscripten": the WebAssembly toolchain
print(platform.python_implementation())
```

> 🧭 **Scenario:** Your script has a typo in a function you never call, yet it still crashes before printing anything. Now you know why: **SyntaxErrors happen at parse time** (step 2), before execution starts. A `NameError` in an uncalled function, on the other hand, never happens, because names are only looked up when the instruction runs (step 4).

> 💡 **Tip:** Try any example above, then open **Inspect → Bytecode** and hover the instruction names to read what each one does.
