"use client"

import { useEffect, useRef } from "react"
import Editor, {
  DiffEditor,
  loader,
  type BeforeMount,
  type OnMount,
} from "@monaco-editor/react"
import type * as Monaco from "monaco-editor"
import { useTheme } from "next-themes"

// Monaco's AMD build from the CDN, pinned to the version whose types we compile against.
// (Next.js has no `?worker` imports, so bundling Monaco's workers ourselves isn't worth it.)
loader.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.56.0/min/vs" },
})

const setup: BeforeMount = (monaco) => {
  // Lessons are single files: Monaco can't see `react` or the lesson's other files, so it
  // checks syntax only. Type errors come from the real compiler when you press Run.
  monaco.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
  })
  monaco.typescript.typescriptDefaults.setCompilerOptions({
    jsx: monaco.typescript.JsxEmit.ReactJSX,
    target: monaco.typescript.ScriptTarget.ESNext,
  })
  defineThemes(monaco)
}

const defineThemes: BeforeMount = (monaco) => {
  const common = { "editorLineNumber.activeForeground": "#9b9a97" }
  monaco.editor.defineTheme("notion-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "a4a097", fontStyle: "italic" },
      { token: "keyword", foreground: "5645d4" },
      { token: "string", foreground: "1a8a3a" },
      { token: "number", foreground: "dd5b00" },
    ],
    colors: {
      ...common,
      "editor.background": "#ffffff",
      "editor.foreground": "#37352f",
      "editorLineNumber.foreground": "#c8c4be",
      "editor.lineHighlightBackground": "#f6f5f4",
      "editor.selectionBackground": "#dcecfa",
      "editorCursor.foreground": "#37352f",
      "editorIndentGuide.background1": "#ede9e4",
    },
  })
  monaco.editor.defineTheme("notion-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "7f7e7b", fontStyle: "italic" },
      { token: "keyword", foreground: "a99cf5" },
      { token: "string", foreground: "7cc68d" },
      { token: "number", foreground: "ffa066" },
    ],
    colors: {
      ...common,
      "editor.background": "#191919",
      "editor.foreground": "#e3e2e0",
      "editorLineNumber.foreground": "#5a5a58",
      "editor.lineHighlightBackground": "#202020",
      "editor.selectionBackground": "#264f78",
      "editorIndentGuide.background1": "#2f2f2f",
    },
  })
}

export function CodeEditor({
  value,
  language,
  path,
  onChange,
  onRun,
  errorLine,
  highlightLine,
}: {
  value: string
  /** a course's `lang`; "tsx" is TypeScript with JSX */
  language: string
  /** the file name, e.g. "App.tsx": Monaco uses it to enable JSX */
  path: string
  onChange: (v: string) => void
  onRun: () => void
  errorLine?: number
  /** a line picked in the Inspect tab */
  highlightLine?: number
}) {
  const { resolvedTheme } = useTheme()
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor>(null)
  const monacoRef = useRef<typeof Monaco>(null)
  const decorations = useRef<Monaco.editor.IEditorDecorationsCollection>(null)
  const runRef = useRef(onRun)
  useEffect(() => {
    runRef.current = onRun
  })

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
    decorations.current = editor.createDecorationsCollection()
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () =>
      runRef.current()
    )
    editor.focus()
  }

  useEffect(() => {
    const monaco = monacoRef.current
    if (!monaco) return
    const mark = (line: number, className: string, glyph?: string) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className,
        linesDecorationsClassName: glyph,
      },
    })
    decorations.current?.set([
      ...(errorLine ? [mark(errorLine, "error-line", "error-glyph")] : []),
      ...(highlightLine
        ? [mark(highlightLine, "inspect-line", "inspect-glyph")]
        : []),
    ])
    const focus = highlightLine ?? errorLine
    if (focus) editorRef.current?.revealLineInCenterIfOutsideViewport(focus)
  }, [errorLine, highlightLine])

  return (
    <Editor
      language={language === "tsx" ? "typescript" : language}
      path={path}
      value={value}
      onChange={(v) => onChange(v ?? "")}
      beforeMount={setup}
      onMount={onMount}
      theme={resolvedTheme === "dark" ? "notion-dark" : "notion-light"}
      loading={
        <div className="p-4 text-sm text-muted-foreground">Loading editor…</div>
      }
      options={{
        fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
        fontSize: 14,
        lineHeight: 22,
        fontLigatures: false, // "!=" must not render as "≠" for beginners
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
        renderLineHighlight: "line",
        tabSize: language === "python" || language === "php" ? 4 : 2,
        automaticLayout: true,
        smoothScrolling: true,
        cursorSmoothCaretAnimation: "on",
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        overviewRulerLanes: 0,
      }}
    />
  )
}

/** Read-only, side by side: the learner's code (left) against the solution (right). */
export function CodeDiff({
  original,
  modified,
  language,
}: {
  original: string
  modified: string
  language: string
}) {
  const { resolvedTheme } = useTheme()
  return (
    <DiffEditor
      original={original}
      modified={modified}
      language={language === "tsx" ? "typescript" : language}
      // Two fixed, reused models: letting the component dispose them on close throws
      // "TextModel got disposed before DiffEditorWidget model got reset".
      originalModelPath="inmemory://compare/yours"
      modifiedModelPath="inmemory://compare/solution"
      keepCurrentOriginalModel
      keepCurrentModifiedModel
      beforeMount={defineThemes}
      theme={resolvedTheme === "dark" ? "notion-dark" : "notion-light"}
      loading={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}
      options={{
        readOnly: true,
        originalEditable: false,
        useInlineViewWhenSpaceIsLimited: true,
        fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
        fontSize: 13,
        lineHeight: 20,
        fontLigatures: false,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        renderOverviewRuler: false,
        automaticLayout: true,
      }}
    />
  )
}
