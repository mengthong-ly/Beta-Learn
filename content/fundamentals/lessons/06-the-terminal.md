---
title: The terminal
section: 2 · Your tools
---

The **terminal** is a window where you control the computer by typing commands instead of clicking. It looks old-fashioned, but programmers use it every day.

---

## What a terminal is

A terminal is a text window for running programs. You type a command, press Enter, and the result appears as text underneath.

It goes by several names:

| Name you'll hear     | Where                                      |
| -------------------- | ------------------------------------------ |
| Terminal             | macOS and Linux (an app called Terminal)   |
| Command Prompt, PowerShell | Windows                              |
| Command line, shell, console | Anywhere: all mean roughly the same |

> 💡 **Key idea:** Anything you do by clicking folders, you can also do by typing. Typing is often faster, and it can be automated.

---

## The prompt

When the terminal is ready, it shows a **prompt**: a short bit of text with a blinking cursor after it.

```text
sam@laptop ~ %
```

The prompt means "I'm ready, type a command". It often ends in `%`, `$` or `>`. In the examples below, lines starting with `$` are what you type, and the lines under them are the replies.

> ⚠️ **Gotcha:** Don't type the `$` itself. Type only what comes after it.

---

## Where am I? The working directory

A terminal is always "standing in" one folder, called the **working directory** (or current directory). Commands act on that folder unless you say otherwise.

To see where you are, type `pwd` (**p**rint **w**orking **d**irectory):

```text
$ pwd
/Users/sam
```

A new terminal usually starts in your **home folder**, the one with your name on it.

---

## Looking around and moving

`ls` (**l**i**s**t) shows what's in the current folder. `cd` (**c**hange **d**irectory) moves you into another one:

```text
$ ls
Desktop    Documents    Downloads
$ cd Documents
$ pwd
/Users/sam/Documents
$ cd ..
$ pwd
/Users/sam
```

| Command      | What it does                     |
| ------------ | -------------------------------- |
| `pwd`        | Show which folder you're in      |
| `ls`         | List the files and folders here  |
| `cd folder`  | Go into `folder`                 |
| `cd ..`      | Go up one folder                 |

---

## On Windows

Windows has two terminals, and they spell a couple of commands differently:

| Job                   | macOS / Linux | Windows Command Prompt | Windows PowerShell |
| --------------------- | ------------- | ---------------------- | ------------------ |
| Show where you are    | `pwd`         | `cd` (on its own)      | `pwd`              |
| List the folder       | `ls`          | `dir`                  | `ls` or `dir`      |
| Go into a folder      | `cd folder`   | `cd folder`            | `cd folder`        |
| Go up one folder      | `cd ..`       | `cd ..`                | `cd ..`            |

---

## Running a Python program

To run a program, go to its folder, then give Python the file's name:

```text
$ cd my-first-project
$ ls
main.py
$ python main.py
Hello! This is your first program.
```

Python reads `main.py`, runs it from top to bottom, and its output appears in the terminal.

> 📝 **Note:** The command's name depends on your setup. On macOS and Linux it's often `python3 main.py`; on Windows it's often `py main.py`.

> ⚠️ **Gotcha:** "No such file or directory" usually means you're in the wrong folder. Check with `pwd` and `ls`, then `cd` to the right one.

---

## Try Python one line at a time

Type `python` (or `python3`, or `py`) with no file name, and Python opens its own prompt, `>>>`. Each line you type runs straight away:

```text
$ python
>>> 2 + 3
5
>>> quit()
$
```

It's a handy calculator and a quick way to try ideas. `quit()` takes you back to the normal terminal.

> 💡 **Tip:** In ThongLearn, the **Run** button does all of this for you. The terminal is for when you code on your own computer.

**Reference:** [MDN: Command line crash course](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Environment_setup/Command_line)

```quiz
? easy: What is a terminal?
+ A window where you control the computer by typing commands
- A cable that connects to the internet
- The place where programs are stored
- A type of code editor
> A terminal is a text window: you type a command, press Enter, and the result appears as text.
? easy: On macOS or Linux, what does `ls` do?
+ Lists the files and folders in the current folder
- Logs you out
- Saves the current file
- Shows which folder you're in
> `ls` lists what's here. `pwd` is the one that shows where you are.
? medium: You're in `/Users/sam/Documents` and type `cd ..`. Where are you now?
+ /Users/sam
- /Users/sam/Documents/..
- /Users
- Still in /Users/sam/Documents
> `..` means the folder above, so you move up one level, from `Documents` to `sam`.
? medium: Which command lists a folder's contents in the Windows Command Prompt?
+ dir
- pwd
- list
- open
> Command Prompt uses `dir`. PowerShell accepts both `dir` and `ls`.
? hard: You type `python main.py` and get "No such file or directory", but `main.py` definitely exists. What's the most likely reason?
+ The working directory isn't the folder that holds `main.py`
- Python can't run files named main
- The file is too long to run
- You need to type the `$` before the command
> Python looks for `main.py` in the current folder. Use `pwd` and `ls` to check, then `cd` into the right folder.
```
