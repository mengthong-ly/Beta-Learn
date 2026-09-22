# PHP: full curriculum

Status: claimed
Blocked by: Phase A (done)

## What
Write the full PHP course, about **30 lessons** and **8 guide chapters**, following the official structure:

The php.net Language Reference, in order: Basic syntax, Types (each type), Variables (incl. scope), Constants, Expressions, Operators, Control Structures, Functions (arguments, named args, arrow functions, first-class callables), Classes and Objects (properties, constructors incl. promotion, inheritance, interfaces, traits, abstract, static, readonly, enums), Namespaces, Enumerations, Errors, Exceptions, Generators, Fibers, Attributes, References, plus PHP 8.5 additions from https://www.php.net/releases/8.5/ (e.g. the pipe operator) where they're in the manual. Guide: a PHP reference (e.g. how a request runs, arrays deep dive, strings & encoding, OOP model, error handling, the standard library).

## Runtime & check helpers
Runtime: PHP 8.5.0 (php CLI). Check helpers: `$output` (everything the lesson echoed) and `expect(bool $ok, string $message)`. Lesson code runs first, and the check runs in the same global scope, so it can read the lesson's variables, functions and classes. Every runnable example starts with `<?php`.

## Conventions (all courses)

- **Files:** `content/php/lessons/NN-slug.md` numbered `01…`, plus a guide in `content/php/guide/NN-slug.md`. Keep the existing `01-*.md` tracer lesson, revising it if needed.
- **Lesson frontmatter:**
  ```
  ---
  title: Short title
  section: N · Section name
  ---
  ```
  Sections group lessons in the sidebar, and each one mirrors a chapter of the official docs.
- **Guide frontmatter:** `title`, `section: Guide Book`, and a one-line `summary`. Each guide chapter needs **at least 3** runnable examples. `> 🔍 **Behind the scenes: …**` renders as a collapsible and `> 🧭 **Scenario:**` as a card.
- **Lesson shape:** short prose (explain *why*), runnable examples, then `## Challenge` with `> 🎯 **Challenge:** …` and three fenced blocks: `php starter`, `php solution`, `php check`. The starter must NOT pass the check; the solution must.
- **Runnable examples** are fences in the course lang (```php), which get a "Try it" button and are executed by the checker. Use ```php-snippet for fragments that aren't whole programs, and `bash`/`text`/`yaml`/`blade` for anything else. An example that is *meant* to fail must contain the comment `// error!`.
- **Every file ends with** `**Reference:** [Page title](official URL)` linking the official page the content is based on.
- **Facts come only from the official docs**, via WebFetch (CLAUDE.md rule 2). Never rely on memory for semantics, defaults, error messages or version-specific behaviour. Target the installed versions: PHP 8.5.0 (php CLI).
- **Voice:** match `content/python/lessons/*.md`: short, friendly, concrete, one idea per section, and 💡 tips sparingly.
- **Done when** `npm run check:content -- php` prints "All content passes". Only touch `content/php/` and this ticket file. If the runner itself seems wrong, stop and report it; don't change `lib/` or `scripts/`.

## Comments
