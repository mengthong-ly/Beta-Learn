---
title: Reading docs and asking for help
section: 5 · When things go wrong
---

Nobody remembers everything. Good programmers look things up all day long, and asking for help well is a skill you can learn.

This lesson is about where to look, and how to ask.

---

## Documentation: the official manual

Every language and tool has **documentation** (usually just "the docs"): the official explanation of how it works, written by the people who made it.

For Python, that's [docs.python.org](https://docs.python.org/3/). It has:

| Part | Good for |
| --- | --- |
| The **Tutorial** | learning the language from the start |
| The **Library Reference** | looking up one exact function, like `len` |
| The **Glossary** | short meanings of words like *argument* |

Other languages have their own: php.net for PHP, react.dev for React, doc.rust-lang.org for Rust.

---

## Reading a docs entry

Here's the Python docs entry for `len`, slightly shortened:

```text
len(object)

    Return the length (the number of items) of an object.
    The argument may be a sequence (such as a string or list) ...
```

Docs entries follow a pattern:

1. The **name** and what goes in the brackets.
2. **What it does** and what it gives back.
3. Details and examples.

> 💡 **Tip:** You don't have to understand every word. Read the first sentence, look at the example, and try it in the editor. Running code is the fastest way to understand a docs page.

---

## Searching an error message

When you hit an error you don't understand, someone has almost certainly hit it before. Copy the **last line** of the traceback into a search engine:

```text
TypeError: can only concatenate str (not "int") to str
```

Leave out the parts that are only about *your* program, like your variable names or file paths, and add the language: `python TypeError can only concatenate str`.

> ⚠️ **Gotcha:** Check how old an answer is and which version it's about. A fix from 2012 may describe an older version of the language.

---

## Asking a good question

When you ask a person (a teacher, a friend, a forum), make it easy for them to help:

| Include | Example |
| --- | --- |
| What you're trying to do | "I want to print the total price" |
| What you expected | "I expected `Total: 12`" |
| What actually happened | the full error message, copied, not retyped |
| What you already tried | "I checked the spelling of `total`" |
| A **minimal example** | the fewest lines that still show the problem |

Making a minimal example is a superpower: while cutting the code down, you often find the bug yourself.

---

## Using AI assistants well

AI chat assistants can be great teachers, if you use them like a tutor and not a vending machine.

- **Ask it to explain**, not just to fix: "Why does this line give a TypeError?"
- **Check its answers.** AI can be confidently wrong. Run the code and compare with the official docs.
- **Don't paste code you don't understand.** If you can't explain what each line does, ask until you can.

> 📝 **Note:** If an assistant writes all your code, you learn very little. Try first, then ask. The struggle is where the learning happens.

---

## A help checklist

When you're stuck, go down this list:

```text
1. Read the error, bottom up
2. Debug: print values, trace by hand
3. Look it up in the official docs
4. Search the last line of the error
5. Ask a person or an AI, with a good question
```

> 🧭 **Scenario:** Ana's program crashes with a `NameError`. She reads the last line, sees `Did you mean: 'count'?`, fixes the typo, and is done at step 1. Most bugs end early on the list.

**Reference:** [Python documentation](https://docs.python.org/3/)

```quiz
? easy: What is documentation?
+ The official explanation of how a language or tool works
- A list of your own errors
- A program that fixes bugs
- A kind of variable
> Documentation ("the docs") is written by the people who made the language or tool.
? easy: Which part of a Python error is best to search for?
+ The last line, with the error type and message
- The file path
- Your variable names
- The first word of your program
> The last line describes the problem in general terms, so other people will have seen the same one.
? medium: Which of these makes a good question to ask for help?
+ What you expected, what happened, what you tried, and a small example
- "My code doesn't work, help"
- Your whole project with no explanation
- Only the line number of the error
> Helpers need to know your goal, the real result, and a small piece of code that shows the problem.
? medium: What is a minimal example?
+ The fewest lines of code that still show the problem
- The shortest program you have ever written
- A program with no bugs
- An example from the docs
> Cutting code down to a minimal example makes it easy to help you, and often reveals the bug on the way.
? hard: An AI assistant gives you code that fixes your bug, but you don't understand it. What should you do?
+ Ask it to explain each line, and check it against the docs before using it
- Paste it in and move on
- Never use AI for anything
- Assume it's always right
> AI can be wrong and you learn little from code you don't understand. Ask for explanations and verify.
```
