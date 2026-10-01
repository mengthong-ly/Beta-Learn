---
title: Breaking problems down
section: 3 · Thinking like a programmer
---

Big problems feel impossible. Programmers handle them the same way every time: they split a big problem into smaller ones, and keep splitting until every piece is easy.

This is called **decomposition**, and it's the most useful skill in this whole course.

---

## Big problems are made of small ones

"Plan a birthday party" is too big to do in one go. Where would you even start? But you can split it:

```text
Plan a birthday party
├── Choose a date
├── Invite friends
├── Get food
└── Decorate the room
```

Each of those four is smaller than the whole party. None of them is scary on its own.

> 💡 **Key idea:** You never solve a big problem directly. You solve lots of small problems, and together they add up to the big one.

---

## Keep splitting until it's easy

Some pieces are still too big. "Get food" isn't one action, so split it again:

```text
Plan a birthday party
├── Choose a date
├── Invite friends
│   ├── Write the guest list
│   └── Send each friend a message
├── Get food
│   ├── Order the cake
│   ├── Buy snacks
│   └── Buy drinks
└── Decorate the room
    ├── Buy balloons
    └── Hang them up
```

When do you stop? When every piece at the edge of the tree is something you know **exactly** how to do. "Buy drinks" is clear. "Get food" wasn't.

---

## A worked example: a to-do app

Programmers use the same trick on software. Say you want to build a to-do list app:

```text
To-do app
├── Show the list
│   ├── Get the saved tasks
│   └── Show each task on screen
├── Add a task
│   ├── Read what the user typed
│   ├── Add it to the list
│   └── Save the list
└── Tick off a task
    ├── Find the task the user tapped
    ├── Mark it as done
    └── Save the list
```

"Build a to-do app" sounds hard. "Add it to the list" sounds like something you could learn in an afternoon. That's the whole point.

---

## The small pieces become code

Each small piece usually turns into just a few lines of code. Here's the tea recipe from lesson 1, split into three parts, with a `#` note above each part:

```python
# Get ready
print("Fill the kettle")
print("Boil the water")

# Make the tea
print("Put a tea bag in the cup")
print("Pour in the water")

# Finish
print("Wait 3 minutes")
print("Take out the tea bag")
```

A line starting with `#` is a **comment**: a note for people. The computer skips it. Writing your plan as comments first, then filling in the code under each one, is a great way to start any program.

---

## Spotting patterns

Once a problem is broken down, you often see the **same** small step more than once:

```text
Send Ana a message
Send Ben a message
Send Chen a message
```

These are one step, "send a friend a message", repeated with a different name. And in the to-do app, "Save the list" appears twice.

Spotting repeats like these is called **pattern recognition**. Later you'll learn tools that let you write a repeated step **once** and reuse it: loops and functions.

> 💡 **Tip:** If you notice yourself writing nearly the same thing again and again, there's almost always a shorter way.

---

## When you're stuck

Every programmer gets stuck. The fix is nearly always the same:

| If…                                  | Try…                                  |
| ------------------------------------ | ------------------------------------- |
| You don't know where to start        | Write the big goal at the top of a tree and split it once |
| A piece still feels hard             | Split that piece again                |
| There are too many pieces            | Pick one, finish it, check it works, then move on |

> 📝 **Note:** This works in every programming language, and outside programming too: in cooking, studying and planning trips.

**Reference:** [MDN: A first splash into JavaScript, "Thinking like a programmer"](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/A_first_splash#thinking_like_a_programmer)

```quiz
? easy: What is decomposition?
+ Splitting a big problem into smaller, easier problems
- Deleting code you don't need
- Writing a program as fast as possible
- Running a program many times
> Decomposition means breaking a problem down until every piece is easy to solve.
? easy: When should you stop splitting a problem into smaller pieces?
+ When you know exactly how to do every piece
- After exactly three levels
- As soon as you have two pieces
- Never, you should always keep splitting
> Stop when each piece at the edge of the tree is clear and small enough to just do.
? medium: What does the computer do with this line?
~~~python
# Boil the water
print("Pour the tea")
~~~
+ Pour the tea
- Boil the water\nPour the tea
- # Boil the water\nPour the tea
- Boil the water
> A line starting with `#` is a comment, a note for people. The computer skips it, so only the `print` line shows anything.
? medium: In the to-do app tree, "Save the list" appears under both "Add a task" and "Tick off a task". What does that suggest?
+ It's a repeated step you could write once and reuse
- One of them is a mistake and should be deleted
- The app will save the list twice as fast
- The tree has been split too much
> Spotting the same step in several places is pattern recognition. Repeated steps can be written once and reused.
? hard: You're stuck on "Get food" in your party plan. What's the best next step?
+ Split it again into smaller steps like "Order the cake" and "Buy drinks"
- Skip it and hope it works out
- Start the whole plan again from the beginning
- Make "Get food" the first step instead of the third
> When a piece still feels hard, it's too big. Split it again until each new piece is clear.
```
