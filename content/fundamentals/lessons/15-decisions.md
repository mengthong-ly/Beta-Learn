---
title: Making decisions
section: 4 · Building blocks
---

Programs often need to choose: *if* it's raining, take an umbrella. The `if` statement lets your code run some lines **only when** a condition is `True`.

---

## `if`

```python
temperature = 30

if temperature > 25:
    print("It's hot! Drink some water.")

print("Have a nice day.")
```

Read it like English: "if the temperature is greater than 25, show this". The parts are:

| Part                  | Meaning                                    |
| --------------------- | ------------------------------------------ |
| `if`                  | the keyword that starts a decision         |
| `temperature > 25`    | the **condition**: a question that's `True` or `False` |
| `:`                   | "here comes what to do"                    |
| the indented line     | runs **only** if the condition is `True`   |

Change `30` to `20` and run it again. The hot message disappears, but "Have a nice day." still shows, because it isn't indented.

---

## Indentation makes blocks

The lines pushed in by 4 spaces after the `:` are a **block**. The whole block belongs to the `if`:

```python
money = 5

if money >= 10:
    print("You can buy the book.")
    print("Enjoy reading!")

print("Thanks for visiting.")
```

`money >= 10` is `False`, so **both** indented lines are skipped. The last line isn't indented, so it always runs.

> ⚠️ **Gotcha:** In Python, the spaces aren't decoration; they decide which lines belong to the `if`. Forget them and Python stops with an error:

```python
if True:
print("Hi")  # error! IndentationError: expected an indented block after 'if' statement on line 1
```

---

## `else`: the other path

`else` gives a block to run when the condition is `False`. Exactly one of the two blocks runs, never both:

```python
age = 15

if age >= 18:
    print("You can vote.")
else:
    print("Not old enough to vote yet.")
```

It's the diamond from [Flowcharts and tracing](/fundamentals/lesson/flowcharts-and-tracing):

```text
            < age >= 18? >
            /            \
          Yes             No
          /                \
 [ You can vote. ]   [ Not old enough... ]
```

---

## `elif`: more than two choices

`elif` (short for "else if") adds more questions. Python asks them **top to bottom** and runs the **first** block whose condition is `True`, then skips the rest:

```python
score = 72

if score >= 90:
    print("Grade A")
elif score >= 70:
    print("Grade B")
elif score >= 50:
    print("Grade C")
else:
    print("Keep practising!")
```

72 isn't 90 or more, but it is 70 or more, so this shows `Grade B`. The `score >= 50` question is never asked.

You can have as many `elif` parts as you like, or none. `else` is optional too.

> 💡 **Key idea:** Order matters. Put the most specific question first. If `score >= 50` came first, a score of 95 would get a C!

---

## Conditions

A condition is any expression that works out to `True` or `False`. Usually it's a comparison from [Operators and expressions](/fundamentals/lesson/operators-and-expressions):

```python
password = "tea123"

if password == "tea123":
    print("Welcome in!")
else:
    print("Wrong password.")
```

> ⚠️ **Gotcha:** Use `==` to compare. `if password = "tea123":` is an error, because one `=` stores a value instead of asking a question.

---

## Other languages

Every language has `if` and `else`. Many use `{ }` braces to mark the block instead of indentation:

```text
Python                       JavaScript
if age >= 18:                if (age >= 18) {
    print("Adult")               console.log("Adult");
else:                        } else {
    print("Child")               console.log("Child");
                             }
```

## Challenge

> 🎯 **Challenge:** Children under 12 get a child ticket, everyone else gets an adult ticket. Add an `elif` so that people aged **65 or over** get a `Senior ticket`. With `age = 70`, it should show `Senior ticket`.

```python starter
age = 70

if age < 12:
    print("Child ticket")
else:
    print("Adult ticket")
```

```python solution
age = 70

if age < 12:
    print("Child ticket")
elif age >= 65:
    print("Senior ticket")
else:
    print("Adult ticket")
```

```python check
assert __stdout__.strip() == "Senior ticket", "With age = 70 it should show 'Senior ticket', but it showed " + repr(__stdout__.strip())
```

**Reference:** [Python tutorial: if statements](https://docs.python.org/3/tutorial/controlflow.html#if-statements)

```quiz
? easy: When does the indented block under an `if` run?
+ Only when the condition is `True`
- Always
- Only when the condition is `False`
- Twice
> The block under `if` runs only when its condition works out to `True`.
? easy: What does `elif` mean?
+ "else if": another question to ask if the earlier ones were `False`
- "end if": the end of the decision
- It repeats the `if`
- It's a spelling mistake for `else`
> `elif` is short for "else if". It adds another condition to check.
? medium: What does this show?
~~~python
x = 4
if x > 10:
    print("big")
else:
    print("small")
~~~
+ small
- big
- big\nsmall
- Nothing
> 4 > 10 is `False`, so the `else` block runs. Only one of the two blocks ever runs.
? medium: What does this show?
~~~python
rain = False
if rain:
    print("Take an umbrella")
print("Go outside")
~~~
+ Go outside
- Take an umbrella\nGo outside
- Take an umbrella
- Nothing
> `rain` is `False`, so the indented line is skipped. The last line isn't indented, so it always runs.
? hard: What does this show?
~~~python
score = 95
if score >= 50:
    print("C")
elif score >= 70:
    print("B")
elif score >= 90:
    print("A")
~~~
+ C
- A
- C\nB\nA
- B
> Python runs only the first block whose condition is `True`. 95 >= 50 is `True`, so it shows C and skips the rest. That's why order matters.
```
