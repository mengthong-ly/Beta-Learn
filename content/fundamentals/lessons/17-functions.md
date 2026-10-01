---
title: Functions: reusable steps
section: 4 · Building blocks
---

A **function** is a list of steps with a name. You write the steps once, then run them whenever you want by saying the name.

It's the main way programmers stop repeating themselves.

---

## A name for a list of steps

Back to the tea recipe. Imagine writing out all six steps every time a friend wants a cup. Instead, you'd just say "make tea", and everyone knows what that means.

A function works the same way:

```text
make tea  ──►  1. Fill the kettle
               2. Boil the water
               3. Put a tea bag in a cup
               ...
```

The name stands for the whole list. Saying the name runs every step inside it, in order.

---

## Defining a function with def

In Python, `def` (short for "define") creates a function:

```python
def make_tea():
    print("Boil the water")
    print("Pour it into the cup")

make_tea()
make_tea()
```

- `def make_tea():` gives the function its name. Notice the colon `:` at the end.
- The **indented** lines underneath are its steps, called the function's **body**.
- `make_tea()` on its own line **calls** the function: it runs the body.

Run it: two calls, so the steps happen twice.

> 💡 **Key idea:** Defining a function doesn't run it. It only teaches the computer a new word. Nothing happens until you **call** it, with the name and `()`.

---

## Parameters: giving a function information

Most functions need some information to do their job. A **parameter** is a name inside the brackets of `def` that waits for a value:

```python
def greet(name):
    print("Hello, " + name + "!")

greet("Ana")
greet("Ben")
```

The value you pass in when you call it is an **argument**. Here `name` is the parameter, and `"Ana"` and `"Ben"` are arguments.

| Word | Where it lives | Example |
| --- | --- | --- |
| Parameter | in the definition | `name` in `def greet(name):` |
| Argument | in the call | `"Ana"` in `greet("Ana")` |

---

## More than one parameter

Separate parameters with commas. Arguments are matched to parameters in order: first to first, second to second.

```python
def add(a, b):
    print(a + b)

add(2, 3)
add(10, 20)
```

> ⚠️ **Gotcha:** Call `add` with only one argument and Python stops with an error, because `b` would have no value. The number of arguments has to fit the parameters.

---

## Return: handing back an answer

So far our functions *print*. Often you want a function to **give back** a value you can keep using. That's what `return` does:

```python
def add(a, b):
    return a + b

total = add(2, 3)
print(total)
print(add(total, 10))
```

`return a + b` ends the function and hands the answer back to the place that called it. So `add(2, 3)` becomes `5`, which we store in `total`.

> 📝 **Note:** A function with no `return` still gives back something: a special empty value called `None`.

---

## Print vs return

This trips up almost every beginner, so it's worth a step of its own:

| `print` | `return` |
| --- | --- |
| Shows a value on the screen, for **people** | Hands a value back, for the **program** |
| The value is gone afterwards | You can store it, add to it, pass it on |

Think of a calculator: `print` is the display, `return` is the answer the next step of your sum can use.

---

## You've been calling functions all along

`print` is a function! Python comes with many ready-made **built-in** functions:

```python
print("hello")
print(len("hello"))
print(type(42))
```

- `print(...)` shows values.
- `len(...)` returns how many items something has: `"hello"` has 5 letters.
- `type(...)` returns what kind of value something is.

Same pattern every time: a name, brackets, arguments inside.

---

## The same idea everywhere

Every programming language has functions. Only the spelling changes:

```text
Python       def add(a, b):  return a + b
JavaScript   function add(a, b) { return a + b }
PHP          function add($a, $b) { return $a + $b; }
```

> 💡 **Tip:** Good function names are verbs that say what the function does: `add`, `greet`, `send_email`. Reading the call should tell you what happens.

## Challenge

> 🎯 **Challenge:** Finish `greet(name)` so it **returns** (not prints) the text `Hello, ` + the name + `!`. For example, `greet("Ana")` should give back `Hello, Ana!`.

```python starter
def greet(name):
    pass  # replace this line with a return

print(greet("Ana"))
```

```python solution
def greet(name):
    return "Hello, " + name + "!"

print(greet("Ana"))
```

```python check
got = greet("Ana")
assert got is not None, "greet() gave back None. Did you use return instead of print?"
assert got == "Hello, Ana!", f"greet('Ana') should return 'Hello, Ana!' but returned {got!r}"
got = greet("Sam")
assert got == "Hello, Sam!", f"greet('Sam') should return 'Hello, Sam!' but returned {got!r}. Use the name parameter."
```

**Reference:** [Python tutorial: Defining functions](https://docs.python.org/3/tutorial/controlflow.html#defining-functions)

```quiz
? easy: What is a function?
+ A named list of steps you can run again and again
- A number stored in a variable
- A kind of error
- The screen a program draws on
> A function gives a name to a list of steps. Calling the name runs the steps.
? easy: What does `def` do?
+ Defines (creates) a new function
- Deletes a function
- Runs a function
- Prints a value
> `def` defines a function. The function only runs when you call it.
? medium: What does this print?
~~~python
def shout(word):
    print(word + "!")

shout("hi")
shout("bye")
~~~
+ hi!\nbye!
- hi!
- word!\nword!
- Nothing, the function is never called
> The function is called twice, once with "hi" and once with "bye", so its body runs twice.
? medium: In `greet("Ana")`, what is `"Ana"`?
+ An argument
- A parameter
- A function name
- A return value
> The value you pass in a call is an argument. The name waiting for it in the definition is the parameter.
? hard: What does this print?
~~~python
def double(n):
    return n * 2

x = double(3)
print(double(x))
~~~
+ 12
- 6
- 3
- None
> `double(3)` returns 6, which is stored in `x`. Then `double(6)` returns 12, and that is printed.
```
