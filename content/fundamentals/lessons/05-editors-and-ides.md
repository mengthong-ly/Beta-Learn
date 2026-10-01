---
title: Code editors and IDEs
section: 2 · Your tools
---

You could write code in any plain text editor. But programmers use tools built for code: they colour it, finish your words, catch mistakes and run your program with one click.

---

## Three kinds of tool

| Tool                  | What it is                                         | Examples                                  |
| --------------------- | -------------------------------------------------- | ----------------------------------------- |
| **Plain text editor** | Edits text, nothing more                           | Notepad (Windows), TextEdit in plain-text mode (macOS) |
| **Code editor**       | A text editor that understands code                | VS Code                                   |
| **IDE**               | Everything for coding in one app                   | PyCharm and other JetBrains IDEs, IDLE    |

**IDE** stands for **Integrated Development Environment**. "Integrated" means the editor, the run button, the debugger and more are built in together.

> 📝 **Note:** The line is blurry. Add a few extensions to VS Code and it behaves a lot like an IDE.

---

## Syntax highlighting

A code editor colours each part of your code by what it is. This is called **syntax highlighting**:

| Part of the code     | Example           |
| -------------------- | ----------------- |
| Keywords             | `for`, `if`       |
| Text in quotes       | `"Sam"`           |
| Numbers              | `2`               |
| Comments (notes)     | `# say hello`     |

The exact colours depend on the editor's theme. Press **Try it** to see this code in the editor's colours:

```python
# say hello twice
name = "Sam"
for n in range(2):
    print("Hello", name)
```

Colours make mistakes easier to spot, like a missing quote that turns the rest of a line the wrong colour.

---

## Autocomplete

Start typing and a code editor suggests what comes next. Press Enter or Tab to accept, and it finishes the word for you.

VS Code calls this family of features **IntelliSense**: completing code, and showing quick info about what a piece of code does and what it needs. You can ask for suggestions any time with **Ctrl+Space** (**⌃Space** on a Mac).

> 💡 **Tip:** Autocomplete isn't cheating. It saves typing and, more importantly, prevents typos in long names.

---

## Error underlines

Many editors check your code **as you type**. When something looks wrong, it gets a red wavy underline, before you even run it:

```python-snippet
print("Hello"
```

The closing bracket is missing, so the editor flags it. In VS Code, you can see every problem in one list in the **Problems** panel.

> ⚠️ **Gotcha:** No underline doesn't mean no mistakes. Some errors only show up when the program runs.

---

## Run, terminal and debugger

| Feature               | What it does                                                       |
| --------------------- | ------------------------------------------------------------------ |
| **Run button**        | Runs the file you're editing. In VS Code with Python, it's a ▷ play button at the top right |
| **Built-in terminal** | A terminal inside the editor (next lesson). In VS Code: **Ctrl+`** |
| **Debugger**          | Pauses your program at a line you choose, steps through it one line at a time, and shows the values as it goes |

The pause points are called **breakpoints**. A debugger is like watching a slow-motion replay of your program.

---

## Which one should you use?

- **Right now:** this app. It has an editor and a Run button, and there's nothing to install.
- **IDLE** comes free with Python. The Python glossary calls it an "Integrated Development and Learning Environment": a simple editor plus a place to run code.
- **VS Code** is free, popular, and works with almost every language.
- **JetBrains IDEs**, like PyCharm for Python, are full-featured tools built around one language.

> 💡 **Key idea:** The tool matters less than you'd think. The code is the same plain text in all of them.

**Reference:** [VS Code docs: IntelliSense](https://code.visualstudio.com/docs/editing/intellisense)

```quiz
? easy: What does IDE stand for?
+ Integrated Development Environment
- Internet Data Explorer
- Instant Debugging Engine
- Interactive Design Editor
> An IDE is an Integrated Development Environment: an editor, a run button, a debugger and more in one app.
? easy: What is syntax highlighting?
+ Colouring the parts of code so it's easier to read
- Marking the lines that have already run
- Making text bold, like in a Word document
- Highlighting the code you copied
> The editor colours keywords, text, numbers and comments differently, so the shape of the code stands out.
? medium: The editor puts a red wavy line under your code before you run it. What does that most likely mean?
+ The editor spotted a likely mistake on that line
- The line will run faster
- The line has been saved
- The line is a comment
> Editors check code as you type and underline problems, like a missing bracket.
? medium: What does a debugger let you do?
+ Pause the program and step through it line by line, watching the values
- Delete all the mistakes automatically
- Translate Python into English
- Make the program run faster
> A debugger pauses at breakpoints so you can step through the program and see what's happening.
? hard: You write code in VS Code, then open the same file in Notepad. What do you see?
+ The same code, without the colours
- The code with the same colours
- Nothing, the file is locked to VS Code
- Random symbols, because VS Code encrypts files
> Code is plain text. Colours are added by the editor while you look at it; they aren't saved in the file.
```
