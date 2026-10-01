---
title: "Loops: repeating steps"
section: 4 · Building blocks
---

Computers are brilliant at doing the same thing again and again without getting bored. A **loop** runs the same steps many times, so you only have to write them once.

---

## Why repeat?

Say you want to count to 5. Without a loop:

```python
print(1)
print(2)
print(3)
print(4)
print(5)
```

That works, but counting to 1,000 would take 1,000 lines. With a loop, it's two lines however high you count:

```python
for number in range(1, 6):
    print(number)
```

This is the **pattern** idea from [Breaking problems down](/fundamentals/lesson/breaking-problems-down): spot the step that repeats, and write it once.

---

## `for` with `range`

A `for` loop runs its block once for each value it's given. `range` makes a run of numbers:

```python
for i in range(5):
    print(i)
```

This shows `0 1 2 3 4`, one per line. Each time round, `i` refers to the next number.

| You write        | You get           |
| ---------------- | ----------------- |
| `range(5)`       | 0, 1, 2, 3, 4     |
| `range(1, 6)`    | 1, 2, 3, 4, 5     |
| `range(0, 10, 2)` | 0, 2, 4, 6, 8    |

> ⚠️ **Gotcha:** `range` starts at 0 unless you say otherwise, and it **stops before** the end number. `range(5)` gives five numbers, but never 5 itself.

---

## The loop's block

Like `if`, the loop's block is the indented lines after the `:`. Only they repeat:

```python
for i in range(3):
    print("Hip hip")
    print("Hooray!")
print("Happy birthday!")
```

The two indented lines run 3 times. The last line isn't indented, so it runs **once**, after the loop is finished.

---

## `while`: repeat while something is true

A `while` loop keeps going **as long as** its condition is `True`. It checks the condition before every round:

```python
countdown = 3
while countdown > 0:
    print(countdown)
    countdown = countdown - 1
print("Liftoff!")
```

This shows `3`, `2`, `1`, then `Liftoff!`. Each round takes 1 off `countdown`. When it reaches 0, `countdown > 0` is `False` and the loop stops. It's the "go round again" arrow from [Flowcharts and tracing](/fundamentals/lesson/flowcharts-and-tracing).

---

## `for` or `while`?

| Use…     | When you…                                  | Example                          |
| -------- | ------------------------------------------ | -------------------------------- |
| `for`    | know how many times to repeat              | print 10 lines                   |
| `while`  | repeat **until something changes**         | keep asking until the answer is right |

Lots of problems can be solved with either. When in doubt, start with `for`: it's harder to get wrong.

---

## Infinite loops

If a `while` condition never becomes `False`, the loop never ends. That's an **infinite loop**:

```python-snippet
countdown = 3
while countdown > 0:
    print(countdown)
    # oops: forgot countdown = countdown - 1
```

`countdown` stays 3 forever, so this prints `3` again and again and never stops.

> ⚠️ **Gotcha:** In every `while` loop, make sure something inside the block changes the condition. If a program ever seems stuck, press **Stop** and look for the line you forgot.

---

## Tracing a loop

Loops are easiest to understand with a trace table: one row per round.

```python
total = 0
for n in range(1, 4):
    total = total + n
print(total)
```

| Round | `n` | `total = total + n` | `total` after |
| ----- | --- | ------------------- | ------------- |
| start | –   | –                   | 0             |
| 1     | 1   | 0 + 1               | 1             |
| 2     | 2   | 1 + 2               | 3             |
| 3     | 3   | 3 + 3               | 6             |

`range(1, 4)` is 1, 2, 3, so there are three rounds, and the program shows `6`.

> 📝 **Note:** Every language has loops. JavaScript writes the counting loop as `for (let i = 0; i < 5; i++) { ... }` and has `while` too. Different spelling, same idea.

## Challenge

> 🎯 **Challenge:** The loop shows 1 to 5. Change the `print` line so it shows the 3 times table instead: `3`, `6`, `9`, `12`, `15`, one per line.

```python starter
for n in range(1, 6):
    print(n)
```

```python solution
for n in range(1, 6):
    print(n * 3)
```

```python check
lines = __stdout__.strip().splitlines()
assert lines == ["3", "6", "9", "12", "15"], "It should show 3, 6, 9, 12, 15 on separate lines, but showed " + ", ".join(lines)
```

**Reference:** [Python tutorial: for statements and the range() function](https://docs.python.org/3/tutorial/controlflow.html#for-statements)

```quiz
? easy: What is a loop for?
+ Running the same steps many times
- Making a choice between two paths
- Giving a value a name
- Stopping a program
> A loop repeats a block of code, so you only write the steps once.
? easy: Which numbers does `range(4)` give?
+ 0, 1, 2, 3
- 1, 2, 3, 4
- 0, 1, 2, 3, 4
- 4
> `range` starts at 0 and stops before the end number.
? medium: What does this show?
~~~python
for i in range(2):
    print("hi")
print("bye")
~~~
+ hi\nhi\nbye
- hi\nbye\nhi\nbye
- hi\nhi\nbye\nbye
- hi\nbye
> The indented line repeats twice. `print("bye")` isn't indented, so it runs once, after the loop.
? medium: `n` starts at 1, and the loop `while n < 5:` has only `print(n)` inside. Why does it never stop?
+ Nothing changes `n`, so `n < 5` is always `True`
- `while` loops always run forever
- `print` stops loops from ending
- `n` starts at 1 instead of 0
> If nothing in the block changes the condition, it stays `True` forever. Adding `n = n + 1` would fix it.
? hard: Trace this program. What does it show?
~~~python
total = 0
for n in range(1, 5):
    total = total + n
print(total)
~~~
+ 10
- 15
- 6
- 1\n3\n6\n10
> `n` is 1, 2, 3, 4, so `total` goes 1, 3, 6, 10. The `print` isn't indented, so it shows only the final value.
```
