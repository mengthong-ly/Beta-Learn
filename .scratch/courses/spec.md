# Spec: all courses (Dart, Flutter, PHP, Laravel 13, TypeScript, React)

Status: Phase A (runtimes) done 2026-09-22 · Phase B (curricula) in progress

## Goal
Each course on Home is a full course based on its creator's official docs, runnable and auto-checked, just like the Python course.

## Phase A: done
- Course model: `lib/courses.ts` (runtime, lang, file, hello).
- Local runner: `lib/local-runner.ts`, `/api/run` and its guards (ADR-0001). React preview: `public/react-preview.html`.
- `npm run setup:runtimes`, `npm run check:runner`, `npm run check:content -- <course>`.
- One tracer lesson per course: `content/<course>/lessons/01-*.md`.

## Phase B: one ticket per course (issues/)
The subagents writing curricula follow the conventions in each ticket. The official outlines are in `.design/thonglearn/research/courses-research.md`.
