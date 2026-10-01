---
title: Files and folders
section: 2 · Your tools
---

Everything you save on a computer lives in a **file**, and files live in **folders**. Code is no different: a program is just a file with text in it.

---

## Files hold data

A **file** is a named chunk of data kept in storage. A photo is a file. So is a song, a spreadsheet, or a program.

Every file has two things:

| Part         | Example                          |
| ------------ | -------------------------------- |
| A **name**   | `main.py`                        |
| **Contents** | `print("Hello! This is your first program.")` |

When you "open" a file, a program reads its contents. When you "save", it writes them back to storage, so they survive after the computer is switched off.

---

## Folders organise files

A **folder** holds files, and other folders too. Folders inside folders make a tree:

```text
Documents/
├── recipes/
│   └── tea.txt
└── my-first-project/
    ├── main.py
    └── notes.txt
```

Programmers usually keep each project in its own folder, so all its files stay together.

> 📝 **Note:** **Directory** is the technical word for a folder. You'll see it a lot, especially in the terminal.

---

## Paths: a file's address

A **path** spells out where a file is: each folder on the way, separated by slashes, then the file name.

| System          | Path to `main.py`                                   |
| --------------- | --------------------------------------------------- |
| macOS / Linux   | `/Users/sam/Documents/my-first-project/main.py`     |
| Windows         | `C:\Users\sam\Documents\my-first-project\main.py`   |

Read it left to right, like directions: start at the top, go into `Users`, then `sam`, and so on. Windows uses backslashes `\`; macOS and Linux use forward slashes `/`.

---

## Relative paths

A path that starts from the very top (`/` or `C:\`) is an **absolute** path. A **relative** path starts from wherever you are now.

If you're in `Documents`:

| Relative path                 | Points to                               |
| ----------------------------- | --------------------------------------- |
| `my-first-project/main.py`    | `main.py`, inside `my-first-project`    |
| `recipes/tea.txt`             | `tea.txt`, inside `recipes`             |
| `..`                          | the folder **above** `Documents`        |

> 💡 **Key idea:** Two dots, `..`, always mean "go up one folder".

---

## File extensions

The **extension** is the part of a name after the last dot. It tells you, and the computer, what kind of file it is and which program should open it.

| Extension | Kind of file           |
| --------- | ---------------------- |
| `.py`     | Python code            |
| `.js`     | JavaScript code        |
| `.html`   | A web page             |
| `.txt`    | Plain text             |
| `.jpg`    | A photo                |

> ⚠️ **Gotcha:** Windows may hide extensions, so `main.py` shows up as just `main`. Turn them on in File Explorer's view options. And don't rename an extension unless you mean to: the file may stop opening properly.

---

## Code is plain text

A code file holds only characters: letters, numbers, spaces and symbols. No fonts, no bold, no colours.

A Word document (`.docx`) is different. It saves lots of hidden formatting alongside your words, so Python can't read it as code. Word also swaps straight quotes `"` for curly ones `“ ”`, and Python rejects those:

```python
print(“Hello”)  # error! SyntaxError: invalid character '“' (U+201C)
```

Press **Try it** and **Run** to see the error. Then retype the quotes with your keyboard's plain `"` key and run it again.

> 💡 **Tip:** Write code in a code editor (next lesson), never in a word processor.

---

## Naming files well

A few habits save a lot of trouble later:

| Do               | Avoid            | Why                                              |
| ---------------- | ---------------- | ------------------------------------------------ |
| `my-notes.txt`   | `My Notes.txt`   | Spaces need extra quotes when you type commands  |
| `photo.jpg`      | `Photo.JPG`      | Many systems treat capitals as different letters |
| `main.py`        | `main`           | The extension says what's inside                 |

Stick to lowercase, use hyphens instead of spaces, and keep the extension.

**Reference:** [MDN: Dealing with files](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Environment_setup/Dealing_with_files)

```quiz
? easy: What does a folder do?
+ Holds and organises files and other folders
- Runs programs
- Makes files smaller
- Turns text into code
> A folder (also called a directory) groups files, and other folders, so they're easy to find.
? easy: Which extension means a file holds Python code?
+ .py
- .txt
- .html
- .docx
> `.py` is the extension for Python files, like `main.py`.
? medium: Why shouldn't you write Python code in a Word document?
+ Word saves hidden formatting and curly quotes, so the file isn't plain code
- Word can't type letters and numbers
- Python only reads files that end in .txt
- Word documents are too small
> Code must be plain text. Word adds formatting and swaps `"` for `“ ”`, which Python rejects.
? medium: In the path `projects/game/main.py`, which folder holds `main.py`?
+ game
- projects
- main
- py
> Read a path left to right: inside `projects` is `game`, and inside `game` is `main.py`.
? hard: You're in the folder `game`, which sits inside `projects`. Where does `../notes.txt` point?
+ To `notes.txt` inside `projects`
- To `notes.txt` inside `game`
- To a folder literally named `..`
- Nowhere, paths can't start with dots
> `..` means "go up one folder", from `game` to `projects`. So the path points to `projects/notes.txt`.
```
