# Dart: full curriculum

Status: claimed
Blocked by: Phase A (done)

## What
Write the full Dart course, about **30 lessons** and **8 guide chapters**, following the official structure:

dart.dev/language, in order: Variables, Operators, Comments, Built-in types, Records, Collections, Generics, Typedefs, Type system, Patterns (+ pattern types), Loops, Branches, Error handling, Functions, Libraries & imports (single-file only), Classes, Constructors (incl. primary constructors if in 3.13 docs), Methods, Extend a class, Mixins, Enums, Dot shorthands, Extension methods, Extension types, Callable objects, Class modifiers, Asynchronous programming (async/await, Streams), Isolates, Null safety. Guide: a reference (how Dart runs: JIT/AOT, sound null safety in depth, the type system, collections cookbook, async model, idiomatic Dart from Effective Dart).

## Runtime & check helpers
Runtime: Dart 3.13.4. Every runnable example is a whole program with `void main()`. Check helpers: `output` (List<String> of printed lines), `expect(bool ok, [String message])`, and `lesson.<name>` for the lesson's top-level declarations. The check body can use `await`. The lesson's `main()` runs first.

## Conventions (all courses)

- **Files:** `content/dart/lessons/NN-slug.md` numbered `01…`, plus a guide in `content/dart/guide/NN-slug.md`. Keep the existing `01-*.md` tracer lesson, revising it if needed.
- **Lesson frontmatter:**
  ```
  ---
  title: Short title
  section: N · Section name
  ---
  ```
  Sections group lessons in the sidebar, and each one mirrors a chapter of the official docs.
- **Guide frontmatter:** `title`, `section: Guide Book`, and a one-line `summary`. Each guide chapter needs **at least 3** runnable examples. `> 🔍 **Behind the scenes: …**` renders as a collapsible and `> 🧭 **Scenario:**` as a card.
- **Lesson shape:** short prose (explain *why*), runnable examples, then `## Challenge` with `> 🎯 **Challenge:** …` and three fenced blocks: `dart starter`, `dart solution`, `dart check`. The starter must NOT pass the check; the solution must.
- **Runnable examples** are fences in the course lang (```dart), which get a "Try it" button and are executed by the checker. Use ```dart-snippet for fragments that aren't whole programs, and `bash`/`text`/`yaml`/`blade` for anything else. An example that is *meant* to fail must contain the comment `// error!`.
- **Every file ends with** `**Reference:** [Page title](official URL)` linking the official page the content is based on.
- **Facts come only from the official docs**, via WebFetch (CLAUDE.md rule 2). Never rely on memory for semantics, defaults, error messages or version-specific behaviour. Target the installed versions: Dart 3.13.4.
- **Voice:** match `content/python/lessons/*.md`: short, friendly, concrete, one idea per section, and 💡 tips sparingly.
- **Done when** `npm run check:content -- dart` prints "All content passes". Only touch `content/dart/` and this ticket file. If the runner itself seems wrong, stop and report it; don't change `lib/` or `scripts/`.

## Comments
