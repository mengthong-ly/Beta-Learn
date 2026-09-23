/**
 * Every course. A course appears on Home once it's listed here and has `content/<id>/lessons`.
 *
 * runtime: where code runs.
 *   "pyodide" Python in a browser worker (public/python.worker.js)
 *   "php"     PHP 8.5 (php-wasm) in a browser worker (public/php.worker.js) (ADR-0002)
 *   "ts"      TypeScript 6 in a browser worker (public/ts.worker.js), run in a sandboxed iframe (ADR-0002)
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
    runtime: "php",
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
    runtime: "php",
    lang: "php",
    file: "lesson.php",
    comment: "//",
    hello: "<?php\n\nuse Illuminate\\Support\\Str;\n\necho Str::of('hello, laravel')->title(), PHP_EOL;\n",
  },
  {
    id: "typescript",
    name: "TypeScript",
    mark: "Ts",
    tagline: "JavaScript with types, checked by the TypeScript compiler in your browser.",
    runtime: "ts",
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
    id: "cpp",
    name: "C++",
    mark: "Cp",
    tagline: "Types, objects and the standard library, compiled by your own compiler.",
    runtime: "local",
    lang: "cpp",
    file: "main.cpp",
    comment: "//",
    hello: '#include <iostream>\n\nint main() {\n  std::cout << "Hello, C++!" << std::endl;\n}\n',
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
  {
    // extra: listed apart from the language courses on Home and in the course switcher.
    id: "claude-code",
    name: "Claude Code",
    mark: "Cc",
    tagline: "Skills, MCP servers and agentic workflows, practised in TypeScript.",
    runtime: "ts",
    lang: "typescript",
    file: "main.ts",
    comment: "//",
    hello: 'import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"\n\nconst server = new McpServer({ name: "hello", version: "1.0.0" })\nconsole.log("Hello, MCP!", server.isConnected())\n',
    extra: true,
  },
] as const

/** Is this one of the extra (non-language) courses? */
export const isExtra = (c: Course) => "extra" in c && c.extra

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
