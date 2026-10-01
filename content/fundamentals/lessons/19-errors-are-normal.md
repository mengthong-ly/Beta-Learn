---
title: Errors are normal
section: 5 · When things go wrong
---

Your code will break. A lot. That's not a sign you're bad at this: it's what programming looks like, for beginners and experts alike.

An error message isn't the computer telling you off. It's the computer telling you **where to look**.

---

## Everyone sees errors, all day

Professional programmers run their code many times an hour, and much of the time something is wrong. A typo, a missing bracket, a value that isn't what they expected.

The difference between a beginner and an expert isn't fewer errors. It's that the expert **reads** the error calmly and knows what to do next.

> 💡 **Key idea:** An error is information, not failure. The message usually tells you what went wrong and on which line.

Errors come in three kinds. Let's meet each one.

---

## Kind 1: syntax errors

**Syntax** is the grammar of a programming language: where brackets, colons and quotes go. A **syntax error** means the computer can't even understand your code, so it doesn't run *any* of it.

```python
age = 30
if age > 18   # error!
    print("adult")
```

Python points at the problem and says `SyntaxError: expected ':'`. The `if` line is missing its colon.

> ⚠️ **Gotcha:** The arrow shows where Python *noticed* the problem, which isn't always where the mistake is. If the line looks fine, check the line just above it, for example for a bracket you never closed.

---

## Kind 2: runtime errors

Sometimes the grammar is fine, but something goes wrong **while the program is running**: you divide by zero, or use a name that doesn't exist. Python calls these **exceptions**.

```python
print("Starting...")
price = 4
count = 3
total = price * cout   # error!
print(total)
```

Run it. `Starting...` appears, because the first lines worked. Then the program stops at the broken line, and nothing after it runs.

---

## Reading the message: bottom up

The error message Python printed is called a **traceback**. Here it is again:

```text
Traceback (most recent call last):
  File "main.py", line 4, in <module>
    total = price * cout
                    ^^^^
NameError: name 'cout' is not defined. Did you mean: 'count'?
```

Read it from the **bottom up**:

| Part | What it tells you |
| --- | --- |
| `NameError` | the **type** of error |
| `name 'cout' is not defined...` | the **message**: what happened |
| `line 4` | **where**: the line number |
| `total = price * cout` | the line itself, with `^^^^` under the problem |

Python even guesses the fix: you meant `count`.

---

## Errors you'll meet often

The last line always starts with the error's type. These are the most common ones:

| Error | Usually means |
| --- | --- |
| `SyntaxError` | a typo in the grammar: missing `:`, `)` or quote |
| `NameError` | a name that doesn't exist yet, often a typo |
| `TypeError` | the wrong kind of value, like adding text to a number |
| `IndexError` | a list position that doesn't exist |
| `ZeroDivisionError` | dividing by zero |

```python
items = ["a", "b"]
print(items[2])   # error!
```

That one is an `IndexError: list index out of range`. The list only has positions 0 and 1.

---

## Kind 3: logic errors

The sneakiest kind. The program runs, prints an answer, and shows **no error at all**. The answer is just wrong.

```python
a = 4
b = 8
average = a + b / 2
print("Average:", average)
```

The average of 4 and 8 is 6, but this prints `8.0`. Division happens before addition, so Python worked out `4 + (8 / 2)`. The fix is brackets: `(a + b) / 2`.

> 📝 **Note:** The computer did exactly what you *wrote*, not what you *meant*. That's why you should always check that an answer makes sense, not just that the program ran.

---

## The three kinds side by side

| Kind | When it shows up | Error message? |
| --- | --- | --- |
| Syntax error | before anything runs | yes |
| Runtime error (exception) | while it runs, at the bad line | yes |
| Logic error | never, the answer is just wrong | **no** |

Every language has these same three kinds. Only the wording of the messages changes. The next lesson shows how to track down the tricky ones.

## Challenge

> 🎯 **Challenge:** This program should print `Total: 12`, but it has **two** bugs. Run it, read the error from the bottom up, fix that line, then run it again to find the next one.

```python starter
price = 4
count = 3
total = price * cout
print("Total: " + total)
```

```python solution
price = 4
count = 3
total = price * count
print("Total: " + str(total))
```

```python check
assert total == 12, f"total should be 12 but is {total!r}"
assert __stdout__.strip() == "Total: 12", f"Print exactly: Total: 12 (you printed {__stdout__.strip()!r})"
```

> 💡 **Tip:** Stuck on the second bug? It's a `TypeError`: you can't join text and a number with `+`. Turn the number into text with `str(total)`, or use a comma: `print("Total:", total)`.

**Reference:** [Python tutorial: Errors and exceptions](https://docs.python.org/3/tutorial/errors.html)

```quiz
? easy: You see an error message. What does it usually mean?
+ Something specific went wrong, and the message says what and where
- You are bad at programming
- The computer is broken
- You should delete the program and start again
> Errors are normal. The message tells you the type of problem and the line to look at.
? easy: Which part of a Python traceback should you read first?
+ The last line, with the error type and message
- The first line
- The middle
- None of it, just guess
> Read from the bottom up: the last line says what happened, the lines above say where.
? medium: The program runs with no error message, but prints the wrong answer. What kind of error is that?
+ A logic error
- A syntax error
- A runtime error
- It isn't an error
> A logic error gives no message at all. The program does what you wrote, which isn't what you meant.
? medium: What kind of error is a missing colon at the end of an `if` line?
+ A syntax error
- A logic error
- An IndexError
- No error, the colon is optional
> The colon is part of Python's grammar (syntax). Without it, Python can't understand the code, so nothing runs.
? hard: What does this print?
~~~python
a = 4
b = 8
print(a + b / 2)
~~~
+ 8.0
- 6.0
- 6
- 12
> Division happens before addition, so this is 4 + 4.0 = 8.0. A classic logic error: to get the average, write (a + b) / 2.
```
