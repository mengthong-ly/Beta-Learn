/**
 * Every course. A course appears on Home once it's listed here and has `content/<id>/lessons`.
 *
 * runtime: where code runs.
 *   "pyodide" Python in a browser worker (public/python.worker.js)
 *   "local"   the learner's own toolchain through the opt-in /api/run route (ADR-0001)
 *   "react"   a sandboxed browser iframe (public/react-preview.html)
 * lang: the fence name in lessons ("```dart starter") and the Monaco language.
 */
export const courses = [
  {
    id: "python",
    name: "Python",
    mark: "Py",
    tagline: "From print() to pandas, run in real CPython in your browser.",
    runtime: "pyodide",
    lang: "python",
    file: "main.py",
    comment: "#",
    hello: 'print("Hello, Python!")\n',
  },
  {
    id: "php",
    name: "PHP",
    mark: "Ph",
    tagline: "The language behind most of the web, from syntax to fibers.",
    runtime: "local",
    lang: "php",
    file: "index.php",
    comment: "//",
    hello: '<?php\n\necho "Hello, PHP!\\n";\n',
  },
  {
    id: "laravel",
    name: "Laravel 13",
    mark: "La",
    tagline: "Routing, Eloquent and the rest of the framework, run in a real app.",
    runtime: "local",
    lang: "php",
    file: "lesson.php",
    comment: "//",
    hello: "<?php\n\nuse Illuminate\\Support\\Str;\n\necho Str::of('hello, laravel')->title(), PHP_EOL;\n",
  },
  {
    id: "typescript",
    name: "TypeScript",
    mark: "Ts",
    tagline: "JavaScript with types, checked by the real TypeScript 7 compiler.",
    runtime: "local",
    lang: "typescript",
    file: "main.ts",
    comment: "//",
    hello: 'const greeting: string = "Hello, TypeScript!"\nconsole.log(greeting)\n',
  },
  {
    id: "react",
    name: "React",
    mark: "Re",
    tagline: "Components, state and effects, rendered live next to your code.",
    runtime: "react",
    lang: "tsx",
    file: "App.tsx",
    comment: "//",
    hello: 'export default function App() {\n  return <h1>Hello, React!</h1>\n}\n',
  },
  {
    id: "dart",
    name: "Dart",
    mark: "Da",
    tagline: "A typed, null-safe language, from variables to isolates.",
    runtime: "local",
    lang: "dart",
    file: "main.dart",
    comment: "//",
    hello: "void main() {\n  print('Hello, Dart!');\n}\n",
  },
  {
    id: "flutter",
    name: "Flutter",
    mark: "Fl",
    tagline: "Build UIs from widgets and see them run as a web app.",
    runtime: "local",
    lang: "dart",
    file: "main.dart",
    comment: "//",
    hello: "import 'package:flutter/material.dart';\n\nvoid main() {\n  runApp(\n    const MaterialApp(\n      home: Scaffold(body: Center(child: Text('Hello, Flutter!'))),\n    ),\n  );\n}\n",
  },
] as const

export type Course = (typeof courses)[number]
export type CourseId = Course["id"]

export const findCourse = (id: string): Course =>
  courses.find((c) => c.id === id) ?? courses[0]

/** Editor contents while reading a guide chapter. */
export const guideStarter = (c: Course) =>
  `${c.comment} Press "Try it" on any example in this chapter,\n${c.comment} or write your own and press Run.` +
  (c.runtime === "pyodide" ? " Open the Inspect tab to look inside.\n" : "\n")

/** React and Flutter draw a UI, shown in the Preview tab. */
export const hasPreview = (c: Course) => c.runtime === "react" || c.id === "flutter"
