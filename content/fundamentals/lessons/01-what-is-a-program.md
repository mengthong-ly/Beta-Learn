---
title: What is a program?
section: 1 · What is code?
---

A **program** is a list of instructions that a computer follows, one after another. **Code** is how we write those instructions down.

That's it. Everything else in programming builds on this one idea.

---

## A recipe is a program for people

Think of a recipe for making tea:

```text
1. Fill the kettle with water
2. Boil the water
3. Put a tea bag in a cup
4. Pour the hot water into the cup
5. Wait 3 minutes
6. Take out the tea bag
```

It has the same three features as a computer program:

| Recipe                    | Program                              |
| ------------------------- | ------------------------------------ |
| A list of steps           | A list of instructions               |
| Done **in order**, top to bottom | Run **in order**, top to bottom |
| Written for someone to follow | Written for a computer to follow |

---

## Computers follow instructions exactly

A person reading the recipe fills in the gaps. If step 3 is missing, they'd still notice there's no tea bag.

A computer never fills in gaps. It does **exactly** what the instructions say, nothing more and nothing less. Swap steps 2 and 4 and a person would stop you; a computer would happily pour cold water.

> 💡 **Key idea:** A computer is very fast and never gets tired, but it can't guess what you *meant*. Programming is the skill of saying exactly what you mean.

---

## Your first look at real code

Here is a real program. It has three instructions, and the computer runs them top to bottom:

```python
print("Fill the kettle")
print("Boil the water")
print("Pour into the cup")
```

`print` is an instruction that means "show this text". Press **Try it** to load it into the editor, then press **Run**. You just ran a program!

> 📝 **Note:** This is Python, a programming language. You don't need to learn it yet. In this course, code is just a way to see each idea working.

---

## Programs are everywhere

Every app on your phone, every website, every game and every bank machine is a program: someone wrote a list of instructions, and a computer follows them.

Some are short, like the three lines above. Others, like a web browser, are millions of lines long. Big programs aren't made of harder instructions, just **more** of them, organised well. Learning to organise instructions is what this course is about.

**Reference:** [Python tutorial: Whetting your appetite](https://docs.python.org/3/tutorial/appetite.html)

```quiz
? easy: What is a program?
+ A list of instructions a computer follows
- A computer's screen
- A website you visit
- A type of computer
> A program is a list of instructions. Apps, websites and games are all programs.
? easy: In what order does a computer run a simple program's instructions?
+ Top to bottom, one after another
- Bottom to top
- All at the same time
- In whatever order makes sense
> Instructions run in order, one at a time, from the top down.
? medium: What does this program show?
~~~python
print("Boil the water")
~~~
+ Boil the water
- "Boil the water"
- print("Boil the water")
- Nothing, the kettle is empty
> `print` shows the text between the quotes, without the quotes. The computer doesn't know about kettles; it just follows the instruction.
? medium: A step is missing from your instructions. What does the computer do?
+ Exactly what the instructions say, with the step still missing
- Guesses the missing step
- Asks you what you meant
- Refuses to run
> Computers follow instructions exactly. They can't guess what you meant.
? hard: Why is a web browser's code millions of lines long?
+ It has many more instructions, organised into parts
- Its instructions are a harder kind of instruction
- Computers need long code to run fast
> Big programs are made of the same simple kind of instructions, just many more of them, well organised.
```
