# How to add a lesson

A complete walkthrough, from a fresh clone to a green `check:content`. Follow it in order the
first time; after that you'll only need [step 3](#3-write-the-lesson) and
[step 5](#5-verify).

[content-authoring.md](content-authoring.md) is the reference for the file format. This page is
the procedure.

---

## 1. Set up for the course you're writing for

**Where lessons live:**

```
content/<course>/lessons/NN-slug.md
```

`<course>` is the `id` in [`lib/courses.ts`](../lib/courses.ts): `python`, `php`, `laravel`,
`typescript`, `react`, `cpp`, `dart`, `flutter`, `claude-code`.

**What you need installed** depends on that course's `runtime`:

| Writing for | You need |
| --- | --- |
| `python`, `react`, `typescript`, `claude-code`, `php`, `laravel` | nothing beyond `npm install` — they run in the browser |
| `cpp`, `dart`, `flutter` | the toolchain below, plus `npm run setup:runtimes` once |

```bash
npm install
npm run setup:runtimes    # only for C++, Dart and Flutter
npm run dev               # http://localhost:3000
```

| Course | Needs on your PATH | Version |
| --- | --- | --- |
| `cpp` | `c++` | C++23 support — clang 15+ or g++ 13+ |
| `dart` | `dart` | ≥ 3.13 |
| `flutter` | `flutter` (brings its own `dart`) | ≥ 3.47 |

Open **<http://localhost:3000/setup>** — it tells you exactly which tool is missing and which
version it wants, per course, and it's the fastest way to confirm you're ready. If it reports a
tool you know you have, see [runtimes.md § Troubleshooting](runtimes.md#troubleshooting): version
managers often aren't on the dev server's `PATH`.

macOS or Linux only. The local runner requires an OS sandbox; on Linux install it with
`sudo apt install bubblewrap socat`. Windows can't run those courses at all — you can still
author the browser courses there.

For C++ and Dart, also re-record the real outputs that write-only learners on the website see:
`npm run check:content -- --record dart` (commits `content/dart/outputs.json`). `check:content`
fails when an example or solution has no recording.

---

## 2. Pick the number, the slug and the section

```bash
ls content/python/lessons
# 01-print.md  02-variables.md  03-strings.md  …
```

- **Order comes from the numeric prefix**, nothing else. To insert between 03 and 04, renumber
  everything from 04 up — and then grep for links to the lessons you renamed.
- **The slug is a permanent key.** `04-loops.md` → URL `/python/lesson/loops`, storage key
  `python/loops`. Renaming it later orphans every learner's progress and drafts for that lesson.
  Choose it once and leave it.
- **`section:` groups lessons in the sidebar** and defines the section quiz. Copy the exact
  string from the neighbouring lesson — `"2 · Strings & Lists"`. The part before ` ·` is the
  section id, so that one is section quiz `2` at `/python/quiz/2`.

Copying the previous lesson as a starting point is the fastest route:

```bash
cp content/python/lessons/03-strings.md content/python/lessons/04-loops.md
```

---

## 3. Write the lesson

### 3a. Check the official source first

Not optional, and not something to do from memory — this is `CLAUDE.md` rule 2. Verify every
claim, default, edge case and error message against the official docs, and finish the lesson with
a **Reference** link to the page you used.

| Course | Source |
| --- | --- |
| Python | <https://docs.python.org/3/>, <https://docs.python.org/3/whatsnew/> for 3.14 behaviour |
| PHP | <https://www.php.net/manual/> |
| Laravel | <https://laravel.com/docs/13.x> |
| TypeScript | <https://www.typescriptlang.org/docs/> |
| React | <https://react.dev> |
| C++ | <https://en.cppreference.com/> |
| Dart / Flutter | <https://dart.dev>, <https://docs.flutter.dev> |

### 3b. The skeleton

Replace `<lang>` with the course's `lang` from `lib/courses.ts` — **not** its id. They differ:
Laravel uses `php`, React uses `tsx`, Flutter uses `dart`, Claude Code uses `typescript`.

````markdown
---
title: Loops
section: 2 · Strings & Lists
---

One or two sentences on what this lesson is for. No preamble, no "in this lesson we will".

```python
for name in ["ana", "bo"]:
    print(name)
```

## A subheading per idea

Prose, then an example. Every ```python fence gets a **Try it** button and is executed by
`check:content`, so it must run clean — no stray warnings.

> 💡 **Tip:** short asides go in a tinted callout.

## Challenge

> 🎯 **Challenge:** Print each name in `names` on its own line, uppercased.

```python starter
names = ["ana", "bo"]
# your code here
```

```python solution
names = ["ana", "bo"]
for name in names:
    print(name.upper())
```

```python check
lines = __stdout__.splitlines()
assert lines == ["ANA", "BO"], f"Expected ANA then BO, got {lines}"
```

```quiz
? easy: What does `for x in []` do?
+ nothing — the body never runs
- raises an error
> An empty sequence means zero iterations.
```

**Reference:** [The for statement](https://docs.python.org/3/tutorial/controlflow.html#for-statements) in the Python tutorial.
````

### 3c. The four rules `check:content` enforces

1. **The starter must not pass the check.** If it does, the challenge is already solved. Leave a
   `# your code here` gap, or seed a bug the learner has to find.
2. **The solution must pass the check.**
3. **Every ```` ```<lang> ```` example must run clean.** For code that is *meant* to fail, mark the
   failing line with an `error!` comment — ```` message() // error! Not callable ```` — and the
   checker asserts it really fails. For a fragment that isn't a whole program, use
   ```` ```<lang>-snippet ````; it's displayed but never run. Use ```` ```text ```` for output
   and diagrams.
4. **Quiz `~~~` code questions are only verified for Python and C++ today.** Adding one to any
   other course fails with *"quiz code questions are only verified for Python and C++ so far"*.
   Write plain questions there, or extend `assertOutput` in
   [`scripts/check-content.ts`](../scripts/check-content.ts).

### 3d. Writing the check

The check runs *after* the learner's code, inside a wrapper the runner generates. What's in scope
depends on the course:

| Course | In scope |
| --- | --- |
| Python | `__stdout__` (all output as one string) and the lesson's own globals. Use `assert …, "message"` |
| PHP, Laravel | `$output` (string), `expect($ok, $msg)`; Laravel adds `visit($uri)` |
| TypeScript, Claude Code | `output` (`string[]`, one per `console.log`), `expect(ok, msg)`, `lesson.*` for exports |
| C++ | `output` (`std::vector<std::string>`), `expect(ok, msg)` |
| Dart | `output` (`List<String>`), `expect(ok, msg)`, `lesson.*` |
| React | `$`, `$$`, `click(el)`, `type(el, value)`, `tick(ms)`, `expect(ok, msg)` — runs against the live DOM |
| Flutter | a `testWidgets` body: `tester`, `find`, `expect`; the app is already pumped |

Write the failure message for the learner:

```python
assert lines[0] == "Hello", f"Line 1 should be 'Hello' but was {lines[0]!r}"   # good
assert lines[0] == "Hello"                                                     # useless
```

Check what the lesson *taught*, not how it was written. Asserting on output is usually right;
asserting that they used a `for` loop usually isn't.

> ⚠️ React checks need a real DOM, so `check:content` can't verify them — it only confirms the
> component renders. Always run a React lesson in the browser and watch the check actually pass
> and fail.

---

## 4. Guide chapters (Python only, so far)

`content/python/guide/NN-slug.md`. Same format, with these differences:

- `summary:` in the frontmatter is **required** — it's the line on the Guide Book index.
- No starter/solution/check. A chapter is reference, not a challenge.
- **At least 3 runnable examples**, or the check fails.
- Two extra callouts: `> 🔍 **Behind the scenes: …**` renders as a collapsible (its first
  paragraph is the always-visible title) and `> 🧭 **Scenario:**` renders as a card.

---

## 5. Verify

```bash
npm run check:content -- python     # just the course you touched
```

It really runs everything: every example, the solution against the check, the starter against the
check, and quiz answers where supported. Output is one line per file:

```
python/lessons
✓ 01-print.md
✗ 04-loops.md  → starter already passes the check
```

Common failures and what they mean:

| Message | Fix |
| --- | --- |
| `missing starter` / `missing solution/check` | a lesson needs all three fenced blocks |
| `starter already passes the check` | make the starter incomplete or wrong |
| `solution fails: …` | your solution doesn't satisfy your own check |
| `example fails: …` | an example errors and isn't marked `error!` |
| `example marked "error!" didn't fail` | it runs fine — drop the marker |
| `missing summary` | a guide chapter without `summary:` |
| `only N examples` | a guide chapter needs 3+ |
| `quiz answer wrong for "…"` | the `+` option isn't what the code actually prints |
| `no correct answer` / `two correct answers` | exactly one `+` per question |

Then look at it in the browser — `check:content` can't see layout, and it can't verify a React
check at all:

```bash
npm run dev
```

Open `/<course>/lesson/<slug>` and confirm: it appears in the right sidebar section, **Try it**
loads each example, **Run** on the starter *fails* the check, and the solution *passes* it.

Before the PR:

```bash
npm run lint && npm run typecheck && npm test
```

Branch off `develop`.

---

## Adding a whole new course

A course exists once it's in `lib/courses.ts` and has a `content/<id>/lessons` folder. For a
browser-run course that's all. For one that runs on the learner's machine, wire up five more
places — `git show 0c8a557` is the C++ course doing exactly this, and is the best template:

| File | What to add |
| --- | --- |
| `lib/courses.ts` | the course entry: `id`, `name`, `mark`, `tagline`, `runtime`, `lang`, `file`, `comment`, `hello` |
| `content/<id>/lessons/01-….md` | at least one lesson |
| `lib/local-runner.ts` | add to `LOCAL_COURSES`, a `TIMEOUT` entry, a `run<Course>()`, a `runLocal` case, and a check wrapper |
| `lib/runner-status.ts` | a `requirements()` row, so `/setup` can report it |
| `scripts/setup-runtimes.ts` | only if it needs a generated sandbox under `runtimes/` |
| `scripts/check-runner.ts` | a couple of assertions: output, an error line, a passing and a failing check |
| `app/setup/page.tsx` | name the course in the intro sentence |

Then `npm run check:runner` and `npm run check:content -- <id>`.

Two things that bite when writing a new runner: the check must run in a **generated wrapper** that
prints `@@thonglearn-check {"pass":…}` on stderr, and compiler/runtime errors must report the
line number of *the learner's file*, which usually means keeping the wrapper's line offsets at
zero. [runtimes.md § Per-course behaviour](runtimes.md#per-course-behaviour) explains how each
existing course solves both.
