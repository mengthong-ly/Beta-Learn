---
title: Debugging
section: 5 · When things go wrong
---

A mistake in a program is called a **bug**. Finding and fixing it is called **debugging**.

Debugging isn't magic or genius. It's a calm, step-by-step search, and there's a method you can follow every time.

---

## The debugging loop

Whenever something is wrong, work through these steps:

```text
1. Reproduce   Make the bug happen again, on purpose
2. Read        Read the error message, bottom up
3. Look        Print values to see what's really going on
4. Think       Trace the code by hand, line by line
5. Change      Change ONE thing, then run again
```

If the bug is still there, go round the loop again. Each pass, you know a little more than before.

---

## 1. Reproduce it

You can't fix what you can't see. First, find a way to make the bug happen **every time**: which values, which button, which order of steps.

Once you can reproduce it, you can also tell when it's **gone**. Run the same steps after your fix and check the result.

> 💡 **Tip:** Write down exactly what you did, what you expected, and what happened instead. You'll need those three things again when asking for help.

---

## 2. Read the error

If there's an error message, it's your best clue. As in the last lesson, read it bottom up: the type, the message, the line number.

Go to that line. Read it slowly. Most bugs with an error message are found right there, or on the line just above.

But a **logic error** has no message. For those, you need to look inside the program while it runs.

---

## 3. Print values to see inside

This program should take 10% off a price of 20, giving 18. It prints `10` instead:

```python
price = 20
discount = 10
new_price = price - discount
print(new_price)
```

Add a `print` to show what each value really is:

```python
price = 20
discount = 10
print("price:", price, "discount:", discount)
new_price = price - discount
print(new_price)
```

Now it's clear: `discount` is just the number 10, so we subtracted 10, not **10 percent** of the price. The fix is `price - price * discount / 100`.

> 📝 **Note:** Printing values is the oldest debugging trick there is, and experts still use it every day. Remove the extra prints once the bug is fixed.

---

## 4. Trace it by hand

**Tracing** means playing computer: go through the code one line at a time and write down every variable's value in a table.

```python
total = 0
for n in [2, 3]:
    total = total + n
print(total)
```

| Step | `n` | `total` |
| --- | --- | --- |
| start | – | 0 |
| loop 1 | 2 | 2 |
| loop 2 | 3 | 5 |

When your table and the real output disagree, the bug is between the last line where they matched and the first where they didn't.

---

## 5. Change one thing at a time

It's tempting to change five things at once and hope. Don't. If it starts working, you won't know which change fixed it; if it gets worse, you won't know which change broke it.

Make **one** small change, run the program, and look at the result. Then decide on the next change.

> ⚠️ **Gotcha:** If a change didn't help, undo it before trying the next idea. Otherwise you slowly pile new bugs on top of the old one.

---

## Rubber duck debugging

Here's a famous trick: explain your code, line by line, out loud, to a rubber duck (or a plant, or a patient friend).

```text
"This line sets total to 0. Then for each number... oh.
 I set total to n, I never ADD n to it."
```

Explaining forces you to say what each line *really* does, not what you hoped it did. Surprisingly often, you spot the bug halfway through a sentence.

---

## Debuggers: pausing a program

Code editors such as VS Code have a built-in **debugger**: a tool that runs your program and lets you pause it.

- A **breakpoint** is a marker on a line (click in the margin next to the line number, or press F9). The program pauses there.
- While paused, you can see every variable's current value.
- **Step Over** (F10) runs one line at a time, so you can watch values change.

It's like the print trick, without editing your code. You'll use one once you set up your own editor.

## Challenge

> 🎯 **Challenge:** This program should print the average of the scores, `Average: 8.0`, but it prints the wrong answer and no error. Use the debugging loop (a `print` inside the loop helps) to find the bug, and fix it.

```python starter
scores = [8, 6, 10]
total = 0

for score in scores:
    total = score

average = total / len(scores)
print("Average:", average)
```

```python solution
scores = [8, 6, 10]
total = 0

for score in scores:
    total = total + score

average = total / len(scores)
print("Average:", average)
```

```python check
assert total == 24, f"After the loop, total should be 8 + 6 + 10 = 24, but it is {total!r}. Is each score added to the total?"
assert __stdout__.strip().splitlines()[-1] == "Average: 8.0", f"The last line should be 'Average: 8.0' but was {__stdout__.strip().splitlines()[-1]!r}"
```

**Reference:** [VS Code: Debugging](https://code.visualstudio.com/docs/debugtest/debugging)

```quiz
? easy: What is a bug?
+ A mistake in a program
- A virus
- A slow computer
- A kind of function
> A bug is any mistake that makes a program behave differently from what you meant. Debugging is finding and fixing it.
? easy: What is the first step in fixing a bug?
+ Make the bug happen again, on purpose
- Rewrite the whole program
- Change lots of lines at once
- Ignore it and hope
> Reproduce it first. If you can make it happen every time, you can also check when it's gone.
? medium: Why should you change only one thing at a time?
+ So you know which change fixed (or broke) the program
- Because the computer can only handle one change
- Because changes are expensive
- It doesn't matter how many you change
> With one change per run, every result tells you something clear.
? medium: What is a breakpoint?
+ A marker that pauses the program on a line so you can look at its values
- A line that crashes the program
- The line where an error happened
- A way to delete a line
> In a debugger, a breakpoint pauses the program on that line. While paused, you can inspect variables and step line by line.
? hard: What does this print?
~~~python
total = 0
for n in [1, 2, 3]:
    total = n
print(total)
~~~
+ 3
- 6
- 0
- 1
> `total = n` replaces the total each time instead of adding to it, so only the last value, 3, is left. That's a logic bug: it should be `total = total + n`.
```
