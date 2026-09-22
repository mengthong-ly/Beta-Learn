# Laravel 13: full curriculum

Status: claimed
Blocked by: Phase A (done)

## What
Write the full Laravel 13 course, about **30 lessons** and **6 guide chapters**, following the official structure:

laravel.com/docs/13.x: The Basics (Routing, Middleware, CSRF, Controllers, Requests, Responses, Views and Blade via `view()`/`Blade::render()`, URL generation, Session, Validation, Error Handling, Logging), then Digging Deeper (Collections, Helpers, Strings, Cache, Events, HTTP Client with `Http::fake()`, Queues with sync, Task Scheduling concepts), Database (Query Builder, Pagination, Migrations via `Schema::create` inside the lesson, Seeding), Eloquent (Getting Started, Relationships, Collections, Mutators/Casts, API Resources, Serialization, Factories), Security (Authentication concepts, Authorization with Gate, Hashing, Encryption), Testing concepts. Guide: architecture (request lifecycle, service container, service providers, facades, directory structure, configuration & .env).

## Runtime & check helpers
Runtime: Laravel 13.32 on PHP 8.5 (runs inside a real app, SQLite in memory, migrated fresh each run). Lesson code runs inside a booted Laravel 13 app (`runtimes/laravel`), so facades, `app()`, `config()` and the like all work. Helpers: `visit($uri, $method = 'GET', $data = [])` sends a request through the HTTP kernel and returns the Response, plus `$output` and `expect()` as in PHP. The DB is SQLite `:memory:` with the default migrations (users, cache, jobs), so create extra tables with `Schema::create` in the lesson. Classes (models, controllers) may be declared in the lesson file. Every runnable example starts with `<?php`. For things that live in other files (routes/web.php, Blade files, config), explain with `-snippet`/`blade` fences and make the runnable version self-contained.

## Conventions (all courses)

- **Files:** `content/laravel/lessons/NN-slug.md` numbered `01…`, plus a guide in `content/laravel/guide/NN-slug.md`. Keep the existing `01-*.md` tracer lesson, revising it if needed.
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
- **Facts come only from the official docs**, via WebFetch (CLAUDE.md rule 2). Never rely on memory for semantics, defaults, error messages or version-specific behaviour. Target the installed versions: Laravel 13.32 on PHP 8.5 (runs inside a real app, SQLite in memory, migrated fresh each run).
- **Voice:** match `content/python/lessons/*.md`: short, friendly, concrete, one idea per section, and 💡 tips sparingly.
- **Done when** `npm run check:content -- laravel` prints "All content passes". Only touch `content/laravel/` and this ticket file. If the runner itself seems wrong, stop and report it; don't change `lib/` or `scripts/`.

## Comments
