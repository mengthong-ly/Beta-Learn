---
title: Flowcharts and tracing
section: 3 · Thinking like a programmer
---

A **flowchart** is a drawing of the steps in a program, with arrows showing which step comes next. **Tracing** is following a program by hand, step by step, to see what it really does.

Both help you think before you code, and find mistakes after.

---

## The four shapes

A flowchart only needs four shapes. Here's how we'll draw them in plain text:

| Shape           | Drawn as            | Means                              |
| --------------- | ------------------- | ---------------------------------- |
| Rounded box     | `( Start )`         | Where the program starts or ends   |
| Box             | `[ Boil the water ]` | One step to do                    |
| Diamond         | `< Is it boiling? >` | A question with a yes or no answer |
| Arrow           | `-->` or a line ending in `v` | Which way to go next    |

> 📝 **Note:** On paper, the question shape is drawn as a diamond (a square tipped on its corner).

---

## A simple flowchart

Steps with no questions just go straight down, one after another:

```text
      ( Start )
          |
          v
 [ Fill the kettle ]
          |
          v
 [ Boil the water ]
          |
          v
 [ Pour into the cup ]
          |
          v
       ( End )
```

This is the same as a numbered list. Flowcharts get useful when there's a **choice**.

---

## Decisions: the diamond

A diamond asks a question. Two arrows leave it: one for **Yes**, one for **No**. You follow the one that matches the answer.

```text
         ( Start )
             |
             v
     < Want sugar? > --No--+
             |             |
            Yes            |
             |             |
             v             |
  [ Add a spoon of sugar ] |
             |             |
             v             |
      [ Stir the tea ] <---+
             |
             v
          ( End )
```

Follow it twice: once answering Yes, once answering No. Both paths reach the end, but they do different things on the way.

---

## Going round again

An arrow can point **back up**. That makes the steps repeat until the answer changes:

```text
          ( Start )
              |
              v
    [ Switch the kettle on ]
              |
              v
  +--> < Is the water boiling? > --Yes--> [ Pour into the cup ] --> ( End )
  |               |
  |              No
  |               |
  |               v
  +------- [ Wait 1 minute ]
```

While the answer is No, you wait and ask again. As soon as it's Yes, you leave the loop. Programs do this all the time; you'll write one in [Loops: repeating steps](/fundamentals/lesson/loops).

> 💡 **Key idea:** Every program, however big, is built from just three moves: do steps **in order**, **choose** between paths, and **repeat** steps.

---

## Tracing: be the computer

Tracing means reading a program one line at a time, doing exactly what the computer would, and writing down every value in a table.

Here's a short program. `total = 0` means "let `total` hold the number 0". You'll learn more about that in [Variables](/fundamentals/lesson/variables).

```python
total = 0
total = total + 5
total = total + 3
print(total)
```

| Line | What happens                | `total` after |
| ---- | --------------------------- | ------------- |
| 1    | `total` starts at 0         | 0             |
| 2    | 0 + 5 is 5                  | 5             |
| 3    | 5 + 3 is 8                  | 8             |
| 4    | show `total`                | 8             |

The table predicts the program shows `8`. Press **Try it**, then **Run**, to check.

---

## Why trace?

When a program does something you didn't expect, tracing shows you **where** it went wrong. You look for the first row in your table where the value isn't what you wanted.

> 💡 **Tip:** Trace with a pencil and paper. Write one row per line the computer runs, never skip a line, and never guess. Computers don't guess either.

> 📝 **Note:** Flowcharts and tracing work for any programming language. The shapes and the tables don't change; only the way the code is written does.

**Reference:** [Python tutorial: First steps towards programming](https://docs.python.org/3/tutorial/introduction.html#first-steps-towards-programming)

```quiz
? easy: In a flowchart, what does the diamond shape mean?
+ A question with a yes or no answer
- The start of the program
- A step to do
- The end of the program
> A diamond is a decision. One arrow leaves for Yes and one for No.
? easy: What is tracing?
+ Following a program by hand, line by line, writing down the values
- Copying code from another program
- Drawing over a picture of the code
- Running a program as fast as possible
> Tracing means doing what the computer would do, one line at a time, and recording every value.
? medium: Trace this program. What does it show?
~~~python
total = 0
total = total + 4
total = total + 4
print(total)
~~~
+ 8
- 4
- 0
- 44
> `total` goes 0, then 0 + 4 = 4, then 4 + 4 = 8.
? medium: In a flowchart, an arrow points back up to an earlier question. What does that create?
+ A loop: the steps repeat until the answer changes
- An error in the flowchart
- The end of the program
- A second, separate program
> Going back to an earlier step makes those steps repeat. That's a loop.
? hard: Trace this program. What does it show?
~~~python
score = 10
score = score - 3
score = score + score
print(score)
~~~
+ 14
- 7
- 20
- 17
> `score` is 10, then 10 - 3 = 7, then 7 + 7 = 14. Use the current value at every line.
```
