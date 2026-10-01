---
title: Saving your history with Git
section: 6 · Becoming a programmer
---

Have you ever saved files called `essay.doc`, `essay-final.doc` and `essay-final-REALLY.doc`? Programmers have a much better way to keep old versions: **version control**.

The most popular version control tool in the world is called **Git**.

---

## What version control is

**Version control** is a system that records changes to your files over time, so you can get back any earlier version later.

It's like a save point in a video game. Before trying something risky, you save. If it goes wrong, you load the save and you're back where you were.

With version control you can:

- go back to how a file (or the whole project) looked last week
- compare what changed between two versions
- see who changed what, and when
- recover easily when you break or lose something

---

## Snapshots, not copies

Git doesn't make a messy pile of copies. Each time you save a version, Git takes a **snapshot**: a picture of what every file in your project looks like at that moment.

```text
snapshot 1        snapshot 2        snapshot 3
"First page"  ──► "Add menu"    ──► "Fix typo in menu"
```

The snapshots line up into a timeline, the project's **history**. Git is clever about space: if a file didn't change, it just points to the copy it already has.

> 💡 **Key idea:** Your project folder shows the *latest* version. Git quietly keeps every snapshot you saved, so no version is ever really lost.

---

## Commits: saving a snapshot

In Git, a snapshot is called a **commit**. Each commit stores the files, who made it, when, and a short **message** saying what changed.

Saving a commit takes two steps, typed in the terminal:

```text
git add menu.py
git commit -m "Add a menu to the home page"
```

1. `git add` picks which changed files go into the next snapshot (this is called **staging**).
2. `git commit` takes the snapshot, with your message.

> 💡 **Tip:** Write messages for your future self: "Fix total when the list is empty" beats "stuff".

---

## Setting up a project

To start using Git in a project folder, you run one command, once:

```text
git init
```

That creates a hidden `.git` folder where Git keeps all the snapshots. You'll rarely look inside it.

To see what's going on at any time, ask Git:

```text
git status
```

It tells you which files you've changed and which are staged, ready for the next commit.

---

## Looking at your history

`git log` lists your commits, newest first. With `--oneline`, each fits on one line:

```text
git log --oneline

c3f9a12 Fix typo in menu
8b21d07 Add menu
4e7a0c5 First page
```

The odd code at the start of each line (like `c3f9a12`) is the commit's **ID**. Git uses it to find exactly that snapshot.

---

## Going back

Broke something since your last commit? Put the file back the way it was in the last snapshot:

```text
git restore menu.py
```

You can also bring back a file from an older commit, using its ID:

```text
git restore --source=8b21d07 menu.py
```

> ⚠️ **Gotcha:** `git restore` throws away changes you haven't committed. Git can only bring back what you saved in a commit, so commit often.

---

## GitHub: sharing your history

Git runs on your own computer. **GitHub** is a website where you can upload a copy of a Git project, to back it up, share it, or work on it with other people.

> 📝 **Note:** Git and GitHub aren't the same thing. Git is the tool; GitHub is one popular place to keep Git projects online. Others include GitLab and Bitbucket.

Almost every programming job uses Git every day, whatever the language. It's worth learning early.

**Reference:** [Pro Git: About Version Control](https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control)

```quiz
? easy: What does version control do?
+ Records changes to your files over time, so you can get old versions back
- Makes your program run faster
- Checks your code for errors
- Translates code into another language
> Version control keeps a history of your project, so you can go back, compare and recover.
? easy: In Git, what is a commit?
+ A saved snapshot of your project, with a message
- A deleted file
- An error message
- A kind of variable
> A commit is a snapshot of your files at one moment, plus who made it, when, and a message.
? medium: What does `git add` do before a commit?
+ Picks which changed files go into the next snapshot
- Uploads your project to GitHub
- Creates a new project
- Deletes the history
> `git add` stages changes. `git commit` then saves the staged files as a snapshot.
? medium: What is the difference between Git and GitHub?
+ Git is the version control tool; GitHub is a website for keeping Git projects online
- They are two names for the same thing
- GitHub runs on your computer, Git runs online
- Git is for Python, GitHub is for websites
> Git works on your own computer. GitHub is one place to share and back up Git projects.
? hard: You change a file, don't add or commit it, then run `git restore` on it. What happens?
+ Your uncommitted changes are thrown away, and the file goes back to the last commit
- Git saves your changes automatically first
- Nothing happens
- The whole history is deleted
> Git can only bring back what you committed. Restoring replaces the file with the last committed version, so uncommitted changes are lost.
```
