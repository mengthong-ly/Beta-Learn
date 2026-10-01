---
title: Why learn to code?
section: 1 · What is code?
---

Code is how people get computers to do things for them. Once you can write it, you can make your own small tools instead of waiting for someone else to build them.

---

## What code builds

Almost everything you use on a screen was built with code:

| Area       | What code does there                                     |
| ---------- | -------------------------------------------------------- |
| Websites   | Shows pages, handles sign-ins, takes orders              |
| Apps       | Runs everything on your phone, from maps to messages     |
| Data       | Sorts, counts and charts huge piles of numbers           |
| Games      | Moves characters, keeps score, enforces the rules        |
| Automation | Does boring, repeated jobs for you                       |
| AI         | Finds patterns in data, like the assistants you chat with |

You don't need to want all of these. Most people start with just one thing they'd like to make.

---

## The boring-task problem

Imagine 500 holiday photos with names like `IMG_0001.jpg`. You want them named by date instead, like `2026-07-14-beach.jpg`.

By hand, that's 500 renames: hours of clicking, with mistakes creeping in somewhere around photo 300.

A program does the same job in seconds. It never gets bored and never makes a typo. Write it once, and you can run it again next year.

> 💡 **Key idea:** If you do the same steps over and over, a computer can probably do them for you. That's called **automation**.

---

## Straight from the Python docs

The official Python tutorial starts with this exact idea. It says that if you use computers a lot, sooner or later there's a task you'll want to automate, such as:

- searching and replacing words across lots of text files
- renaming and rearranging a big pile of photos in a complicated way
- making a small database, a custom app with windows and buttons, or a simple game

None of these need a computer science degree. They need someone who can write the steps down clearly.

---

## A taste: let the computer repeat

This tiny program prints 5 reminders, but you only wrote the reminder once:

```python
for day in range(1, 6):
    print("Reminder: drink water, day", day)
```

Press **Try it**, then **Run**. Now change `6` to `101` and run it again: 100 reminders, and you didn't type a single extra line.

> 📝 **Note:** You'll learn what `for` and `range` mean later in the course. For now, just notice how little you had to write.

---

## Coding is a way of thinking

Even if you never code for a living, learning it changes how you tackle problems. You practise:

- breaking a big job into small, clear steps
- spotting the repetitive parts a tool could handle
- trying an idea, watching it fail, fixing it and trying again

These skills help with spreadsheets, planning and everyday problem-solving too.

> 🧭 **Scenario:** A shop owner copies yesterday's sales from emails into a spreadsheet every morning. A short program could do it before she even arrives. Wins like this are why most people start.

**Reference:** [Python tutorial: Whetting your appetite](https://docs.python.org/3/tutorial/appetite.html)

```quiz
? easy: What is **automation**?
+ Getting a computer to do a repeated task for you
- Buying a faster computer
- Doing a task by hand, but very quickly
- Deleting tasks you don't like
> Automation means handing repetitive work to a program, so the computer does the steps instead of you.
? easy: Which of these are built with code?
+ All of them: websites, phone apps and video games
- Only websites
- Only video games
- None of them, they're built with electricity
> Websites, apps and games are all programs. Someone wrote the instructions, and a computer follows them.
? medium: Which task is the best fit for automation?
+ Renaming 500 files using the same pattern
- Deciding what to cook for a friend's birthday
- Choosing your favourite holiday photo
- Comforting a friend who is upset
> Automation shines on jobs with clear, repeated steps. Choices that need taste or feelings are still yours.
? medium: Which task does the official Python tutorial give as an example of something you might automate?
+ Searching and replacing words across many text files
- Repairing a broken laptop screen
- Building a computer from parts
- Typing faster on your keyboard
> The tutorial's examples include search-and-replace over many text files, renaming lots of photos, and making a small database, app or game.
? hard: Your program prints 5 reminders. Now you need 100. What's the best change?
+ Change one number so the same instruction repeats more times
- Copy and paste the `print` line 95 more times
- Write a brand new program for 100 reminders
- Run the program 20 times
> A program that repeats an instruction scales by changing one number. Copying lines by hand is exactly the boring work code is meant to remove.
```
