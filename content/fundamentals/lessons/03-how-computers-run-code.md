---
title: How computers run code
section: 1 · What is code?
---

Inside every computer, a small chip follows instructions billions of times a second. But it only understands one language, and it isn't Python.

---

## The parts that matter

Three parts of a computer do most of the work when a program runs:

| Part                       | Its job                                       | In a kitchen      |
| -------------------------- | --------------------------------------------- | ----------------- |
| **CPU** (the processor)    | Follows instructions, one tiny step at a time | The cook          |
| **Memory** (RAM)           | Holds the data being used right now           | The worktop       |
| **Storage** (disk)         | Keeps your files, even when the power is off  | The cupboard      |

When you run a program, it's copied from storage into memory. Then the CPU works through its instructions, reading and changing data in memory as it goes.

> 📝 **Note:** CPU stands for **Central Processing Unit**. Memory is fast but forgets everything when the power goes off. That's why you save files to storage.

---

## Machine code: the CPU's only language

A CPU only understands **machine code**: instructions written as numbers. Inside the computer, those numbers are stored in **binary**, just 0s and 1s.

Here is one real machine-code instruction for many PC processors:

```text
10110000 01100001
```

It means roughly "put the number 97 into a slot inside the CPU". Writing whole apps like this would be slow and painful, and each family of CPU (a phone chip, a laptop chip) has its own machine code.

---

## Source code: written for people

So we write code in languages people can read, like Python. This text is called **source code**:

```python
print(2 + 3)
print("The CPU never saw this text directly")
```

Press **Try it** and **Run**. It works, but the CPU didn't read your words. Something translated them into steps it understands first.

There are two main ways to do that translating: a **compiler** or an **interpreter**.

---

## Compilers: translate first, run later

A **compiler** translates the whole program into machine code **before** it runs. The result is a separate file you can run, called an **executable** (on Windows, often an `.exe`).

```text
source code ──compiler──▶ executable file ──▶ run it
            (once, ahead of time)        (as often as you like)
```

It's like translating a whole book before it's published: slow to prepare, but quick to read afterwards. C++ and Rust are compiled this way.

---

## Interpreters: translate as you go

An **interpreter** is a program that reads your source code and carries it out as it goes. There's no separate executable to build first.

```text
source code ──▶ interpreter ──▶ runs right away
```

It's like a live interpreter at a meeting, translating as people speak. You can change a line and run it again immediately.

| | Compiled | Interpreted |
| --- | --- | --- |
| When it's translated | Before it runs | While it runs |
| Makes an executable file? | Yes | No, the source runs directly |
| After a change | Compile again, then run | Just run again |
| Speed when running | Usually faster | Usually slower |

---

## Python is interpreted

The official Python glossary calls Python an **interpreted** language: you can run a source file directly, without first making an executable. That's why you can press **Run** here and see results straight away.

> 🔍 **Behind the scenes: bytecode**
>
> Python actually does a quick translation step first. It turns your code into a simpler form called **bytecode**, then runs that. You never see it happen, which is why the glossary says the line between "compiled" and "interpreted" can be blurry.

**Reference:** [Python glossary: interpreted](https://docs.python.org/3/glossary.html#term-interpreted)

```quiz
? easy: Which part of a computer follows a program's instructions?
+ The CPU
- The screen
- The keyboard
- The storage disk
> The CPU (Central Processing Unit) reads and carries out instructions, one tiny step at a time.
? easy: What language does a CPU understand directly?
+ Machine code
- Python
- English
- Any language you type
> A CPU only understands machine code: instructions as numbers, stored in binary.
? medium: What does a compiler do?
+ Translates the whole program into machine code before it runs
- Runs your code line by line as it reads it
- Fixes the mistakes in your code
- Saves your files to the disk
> A compiler translates ahead of time and produces an executable you can run later.
? medium: The power goes off. Which part loses what it was holding?
+ Memory (RAM)
- Storage (the disk)
- Both keep everything
- Neither, computers can't lose data
> Memory is fast but temporary. Storage keeps your saved files when the power is off.
? hard: Why can you edit a Python program and run it again straight away?
+ Python is interpreted, so there's no separate executable to build first
- The CPU understands Python directly
- Python programs always run faster than compiled ones
- Python skips the CPU entirely
> The interpreter runs your source file directly. The CPU still runs machine code; the interpreter handles the translating for you.
```
