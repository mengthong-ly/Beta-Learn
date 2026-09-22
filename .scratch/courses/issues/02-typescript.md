# TypeScript: full curriculum

Status: claimed
Blocked by: Phase A (done)

## What
Write the full TypeScript course, about **25 lessons** and **8 guide chapters**, following the official structure:

The TypeScript Handbook, in order: The Basics, Everyday Types, Narrowing, More on Functions, Object Types, Type Manipulation (Generics, keyof, typeof, Indexed Access, Conditional, Mapped, Template Literal types), Classes, Modules; then useful Reference pages (Utility Types, Enums, Iterators and Generators, Decorators, Type Inference, Type Compatibility). Guide: a reference (how tsc works, the type system mental model, structural typing, strictness flags, declaration files).

## Runtime & check helpers
Runtime: TypeScript 7.0.2 (tsc, strict) + Node 23. Check helpers: `output` (lines passed to console.log), `expect(ok, message)`, and `lesson.*` for anything the lesson code **exports**, so a challenge that needs values checked must `export` them. A type error stops the run (it's shown as an error): use `// error!` examples to teach type errors.

## Conventions (all courses)

- **Files:** `content/typescript/lessons/NN-slug.md` numbered `01…`, plus a guide in `content/typescript/guide/NN-slug.md`. Keep the existing `01-*.md` tracer lesson, revising it if needed.
- **Lesson frontmatter:**
  ```
  ---
  title: Short title
  section: N · Section name
  ---
  ```
  Sections group lessons in the sidebar, and each one mirrors a chapter of the official docs.
- **Guide frontmatter:** `title`, `section: Guide Book`, and a one-line `summary`. Each guide chapter needs **at least 3** runnable examples. `> 🔍 **Behind the scenes: …**` renders as a collapsible and `> 🧭 **Scenario:**` as a card.
- **Lesson shape:** short prose (explain *why*), runnable examples, then `## Challenge` with `> 🎯 **Challenge:** …` and three fenced blocks: `typescript starter`, `typescript solution`, `typescript check`. The starter must NOT pass the check; the solution must.
- **Runnable examples** are fences in the course lang (```typescript), which get a "Try it" button and are executed by the checker. Use ```typescript-snippet for fragments that aren't whole programs, and `bash`/`text`/`yaml`/`blade` for anything else. An example that is *meant* to fail must contain the comment `// error!`.
- **Every file ends with** `**Reference:** [Page title](official URL)` linking the official page the content is based on.
- **Facts come only from the official docs**, via WebFetch (CLAUDE.md rule 2). Never rely on memory for semantics, defaults, error messages or version-specific behaviour. Target the installed versions: TypeScript 7.0.2 (tsc, strict) + Node 23.
- **Voice:** match `content/python/lessons/*.md`: short, friendly, concrete, one idea per section, and 💡 tips sparingly.
- **Done when** `npm run check:content -- typescript` prints "All content passes". Only touch `content/typescript/` and this ticket file. If the runner itself seems wrong, stop and report it; don't change `lib/` or `scripts/`.

## Comments
