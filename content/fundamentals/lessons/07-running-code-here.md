---
title: Running code in ThongLearn
section: 2 · Your tools
---

Everything you need to write and run code is already on this page: no installs, no terminal. Here's a quick tour of how it works.

---

## Lessons come in steps

Each lesson is split into short steps, like this one. The bar at the top shows where you are, for example "Step 2 of 9".

| To                    | Do this                                    |
| --------------------- | ------------------------------------------ |
| Move on               | Press **Continue**, or the → arrow key     |
| Go back               | Press **Back**, or the ← arrow key         |
| Jump to any step      | Click its segment in the bar               |

Your step is kept in the page address, so reloading puts you back in the same place. The last steps are a short quiz and a finish card.

---

## The editor

Next to the lesson is the **editor**: a code editor holding a file called `main.py`. Click in it and type, just like a text box.

- It colours your code (syntax highlighting) as you type.
- Your code is saved in this browser automatically, so you can leave and come back.
- The ↺ **Reset** button puts back the starting code if you get in a tangle.

> 📝 **Note:** On a phone, the lesson, code and output sit in separate tabs: **Read**, **Code** and **Output**.

---

## Run it

Press the **Run** button above the editor, or use the keyboard:

| Mac   | Windows / Linux |
| ----- | --------------- |
| **⌘↵** (Cmd+Enter) | **Ctrl+Enter** |

What your program prints appears in the **Output** pane. Press **Try it** on this example, then run it:

```python
print("Hello from ThongLearn!")
print(2 + 2)
```

> 📝 **Note:** The very first run downloads Python into your browser (about 10 MB), so it takes a moment. After that, runs are quick. Your code runs right here in your browser.

---

## Try it on examples

Every runnable example has a **Try it** button in its top corner. It copies the example into the editor so you can run it, change it and run it again.

You can't break anything. Experimenting is the fastest way to learn, so change numbers and words and see what happens.

> 💡 **Tip:** Boxes labelled `text` are for reading only: diagrams, terminal sessions and plain-English steps. They have no **Try it** button.

---

## Predict before you run

Under each example you'll find **Predict: what will this print?** Open it, type your guess, then press **Run it**. It runs the example and shows whether your guess matched, pointing to the first line that differs.

Try it on this one. Look closely at the quotes:

```python
print("3 + 4")
print(3 + 4)
```

> 💡 **Key idea:** Guessing first makes you think it through, so a surprise shows you exactly what you misunderstood. That's when learning happens.

---

## Errors are normal

Every programmer sees errors every day. An error just means "I couldn't follow this instruction". Run this one:

```python
print("This line runs")
prnt("This one has a typo")  # error! NameError: name 'prnt' is not defined
```

The first line runs. Then Python stops and shows a red error in the Output pane, and the editor marks the line that failed:

```text
NameError: name 'prnt' is not defined. Did you mean: 'print'?
```

> 💡 **Tip:** Read the **last line** of an error first: it says what went wrong. Python often suggests the fix, too.

---

## Check, quiz and history

| Feature     | Where to find it                         | What it does                                          |
| ----------- | ---------------------------------------- | ----------------------------------------------------- |
| **Check**   | Above the editor, in lessons with a challenge | Runs your code and tests whether it solves the challenge |
| **Quiz**    | The "Check your understanding" step      | 5 questions, easy to hard. Get 4 right to complete the lesson |
| **History** | A tab next to **Output**                 | Every run you've made in this lesson                  |

You'll also see **Inspect** and **Visualize** tabs. They show what's inside your program while it runs; later lessons use them.

> 📝 **Note:** Your code, progress and history are saved in this browser. Signing in is optional: it copies your progress and code to your other browsers.

**Reference:** [Python tutorial: Errors and exceptions](https://docs.python.org/3/tutorial/errors.html)

```quiz
? easy: Which keys run your code on a Mac?
+ ⌘↵ (Cmd+Enter)
- ⌘S (Cmd+S)
- The space bar
- ⌘Q (Cmd+Q)
> Press ⌘↵ on a Mac, or Ctrl+Enter on Windows and Linux. The Run button does the same.
? easy: What does the **Try it** button on an example do?
+ Copies the example into the editor so you can run it
- Marks the lesson as complete
- Deletes your code
- Shows the answer to the quiz
> Try it loads the example into the editor. Then press Run, change it, and run it again.
? medium: What does this program show?
~~~python
print(3 + 4)
~~~
+ 7
- 3 + 4
- "7"
- print(3 + 4)
> Without quotes, `3 + 4` is a sum, so Python works it out and prints `7`. With quotes, `"3 + 4"` would be printed as text.
? medium: Your code shows a red error. What's the best next step?
+ Read the last line of the error, fix the code and run again
- Close the page and start the lesson again
- Assume the app is broken
- Delete all your code
> Errors are normal. The last line says what went wrong, and Python often suggests a fix.
? hard: Why does Predict ask for your guess **before** it shows the output?
+ Committing to a guess makes you think, so a surprise shows what you misunderstood
- So it can give you a grade
- Because the program can't run until you type something
- To slow you down on purpose
> Guessing first turns reading into thinking. When your guess and the real output differ, you've found exactly what to learn.
```
