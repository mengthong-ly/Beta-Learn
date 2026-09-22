# Flutter: full curriculum

Status: claimed
Blocked by: Phase A (done)

## What
Write the full Flutter course, about **18 lessons** and **6 guide chapters**, following the official structure:

The docs.flutter.dev learning pathway, in order: Widget fundamentals, Layout, Handle user input, Stateful widgets, Implicit animations, State management (ChangeNotifier, ListenableBuilder), HTTP requests (use a fake/local data source, no network in checks), Advanced UI, Adaptive layouts, Scrolling and slivers, Navigation, How Flutter works. Add Material widgets, themes and forms from docs.flutter.dev/ui where the pathway assumes them. Guide: a reference (the three trees, build/layout/paint, constraints go down / sizes go up, keys, state management options, the app architecture guide (MVVM)).

## Runtime & check helpers
Runtime: Flutter 3.47.5 / Dart 3.13.4 (each Run is a `flutter build web`, about 15 s; Check is `flutter test`). Every runnable example is a whole app with `void main()` and `import 'package:flutter/material.dart';`. Check blocks are the **body of a `testWidgets`** that has already run `app.main()` and `await tester.pumpAndSettle()`: use `find`, `expect(…, findsOneWidget)`, `await tester.tap(...)`, `await tester.pump()` and so on. Checks run with `flutter test` in the shared `runtimes/flutter` project, so only run one flutter check at a time. Examples are smoke-tested (pumped) by `npm run check:content -- flutter`.

## Conventions (all courses)

- **Files:** `content/flutter/lessons/NN-slug.md` numbered `01…`, plus a guide in `content/flutter/guide/NN-slug.md`. Keep the existing `01-*.md` tracer lesson, revising it if needed.
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
- **Facts come only from the official docs**, via WebFetch (CLAUDE.md rule 2). Never rely on memory for semantics, defaults, error messages or version-specific behaviour. Target the installed versions: Flutter 3.47.5 / Dart 3.13.4 (each Run is a `flutter build web`, about 15 s; Check is `flutter test`).
- **Voice:** match `content/python/lessons/*.md`: short, friendly, concrete, one idea per section, and 💡 tips sparingly.
- **Done when** `npm run check:content -- flutter` prints "All content passes". Only touch `content/flutter/` and this ticket file. If the runner itself seems wrong, stop and report it; don't change `lib/` or `scripts/`.

## Comments
