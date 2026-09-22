"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useLiveQuery } from "dexie-react-hooks"
import { toast } from "sonner"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FileCode2Icon,
  FlaskConicalIcon,
  LightbulbIcon,
  PanelBottomIcon,
  PanelRightIcon,
  PlayIcon,
  RotateCcwIcon,
  SquareIcon,
} from "lucide-react"
import {
  usePanelRef,
  type Layout,
  type PanelImperativeHandle,
} from "react-resizable-panels"

import { AppSidebar } from "@/components/app-sidebar"
import { celebrate, Celebrations } from "@/components/celebrate"
import { CommandMenu } from "@/components/command-menu"
import { HistoryList } from "@/components/history-list"
import { InspectPane } from "@/components/inspect-pane"
import { Mascot } from "@/components/mascot"
import { OutputPane } from "@/components/output-pane"
import { PreviewPane } from "@/components/preview-pane"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { WorkspaceContext } from "@/components/workspace-context"
import {
  docHref,
  docKey,
  findDoc,
  guideIndex,
  quizDoc,
  quizHref,
  sections,
  storageKey,
} from "@/lib/docs"
import { useMediaQuery } from "@/hooks/use-mobile"
import { db } from "@/lib/db"
import { pushRow } from "@/lib/sync"
import { findCourse, guideStarter, hasPreview } from "@/lib/courses"
import { playground, type Lesson } from "@/lib/lesson-parser"
import { reset, run, show, stop, useRunner, warmPython } from "@/lib/runner"

// Monaco touches `window`; render it only in the browser.
const CodeEditor = dynamic(
  () => import("@/components/code-editor").then((m) => m.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="p-4 text-sm text-muted-foreground">Loading editor…</div>
    ),
  }
)

function Tip({
  label,
  keys,
  children,
}: {
  label: string
  keys?: string[]
  children: React.ReactElement
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        {label}
        {keys && (
          <KbdGroup className="ml-1">
            {keys.map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
          </KbdGroup>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

let animTimer: ReturnType<typeof setTimeout> | undefined
/**
 * Opens or closes a collapsible pane (toggles when `open` is omitted). `data-animating`
 * turns on the flex-grow transition in globals.css just for this, so dragging stays 1:1.
 */
function setOpen(
  group: HTMLDivElement | null,
  p: PanelImperativeHandle | null,
  open = p?.isCollapsed()
) {
  if (!p || open !== p.isCollapsed()) return
  if (group) {
    group.dataset.animating = ""
    clearTimeout(animTimer)
    animTimer = setTimeout(() => delete group.dataset.animating, 300)
  }
  if (open) p.expand()
  else p.collapse()
}

const saveLayout = (name: string) => (layout: Layout) => {
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(layout))}; path=/; max-age=31536000; SameSite=Lax`
}

/**
 * A course's persistent app shell (lives in the [course] layout, so it survives navigation:
 * Python, the editor and the output never reload). Each page renders into the reading pane.
 */
export function Workspace({
  course,
  lessons,
  guide,
  sidebarOpen,
  layout,
  children,
}: {
  course: string
  lessons: Lesson[]
  guide: Lesson[]
  sidebarOpen: boolean
  layout: { outer?: Layout; inner?: Layout }
  children: React.ReactNode
}) {
  const router = useRouter()
  const c = findCourse(course)
  const preview = hasPreview(c)
  const [, , route, param] = usePathname().split("/")
  const runId = route === "run" ? Number(param) : undefined
  const savedRun = useLiveQuery(
    () => (runId ? db.runs.get(runId) : undefined),
    [runId]
  )
  const done = useLiveQuery(
    async () =>
      (
        await db.progress
          .where("lessonId")
          .startsWith(`${course}/`)
          .primaryKeys()
      ).map((k) => k.slice(course.length + 1)),
    [course],
    [] as string[]
  )

  const doc =
    (route === "lesson"
      ? lessons.find((l) => l.id === param)
      : route === "guide"
        ? param
          ? guide.find((g) => g.id === param)
          : guideIndex
        : route === "quiz"
          ? quizDoc(param)
          : route === "run"
            ? findDoc(savedRun?.lessonId, lessons, guide)
            : undefined) ?? playground
  const key = docKey(doc)
  const saveKey = storageKey(course, key)
  const starter =
    doc.starter || (doc.kind === "playground" ? c.hello : guideStarter(c))
  const siblings =
    doc.kind === "lesson"
      ? lessons
      : doc.kind === "guide" && doc.id !== "guide"
        ? guide
        : []
  const idx = siblings.indexOf(doc)

  const state = useRunner()
  const [code, setCode] = useState("")
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [tab, setTab] = useState("output")
  const [mobileTab, setMobileTab] = useState("read")
  // A line picked in the Inspect tab; cleared whenever a new run starts.
  const [picked, setPicked] = useState<{ line: number; runKey: number }>()
  // Replays the editor glow: `n` remounts the overlay, `kind` picks the strength.
  const [glow, setGlow] = useState<{ n: number; kind: "ok" | "pass" }>()
  const rightPane = usePanelRef()
  const editorPane = usePanelRef()
  const panes = useRef<HTMLDivElement>(null)
  // Below 1024px three panes get too cramped, so switch to tabs.
  const compact = useMediaQuery("(max-width: 1023px)")

  useEffect(() => {
    if (c.runtime === "pyodide") warmPython()
  }, [c.runtime])

  // Load the draft (or starter) when switching docs.
  useEffect(() => {
    if (runId) return
    let live = true
    reset()
    db.drafts.get(saveKey).then((d) => live && setCode(d?.code ?? starter))
    return () => {
      live = false
    }
  }, [saveKey, starter, runId])

  // Restore a past run: editor state during render, output pane via the runner store.
  const [restoredId, setRestoredId] = useState<number>()
  if (savedRun && savedRun.id !== restoredId) {
    setRestoredId(savedRun.id)
    setCode(savedRun.code)
  }
  useEffect(() => {
    if (savedRun) show(savedRun)
  }, [savedRun?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const draftTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const edit = (v: string) => {
    setCode(v)
    clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => {
      const row = { lessonId: saveKey, code: v, updatedAt: Date.now() }
      db.drafts.put(row)
      pushRow("drafts", row)
    }, 400)
  }

  const execute = async (withCheck = false) => {
    setOpen(panes.current, rightPane.current, true)
    setTab(preview && !(withCheck && c.id === "flutter") ? "preview" : "output")
    setMobileTab("output")
    const res = await run(code, withCheck ? doc.check : undefined, c)
    if (res.error) setTab("output")
    if (res.status === "done" && res.check?.pass !== false)
      setGlow((g) => ({
        n: (g?.n ?? 0) + 1,
        kind: res.check?.pass ? "pass" : "ok",
      }))
    await db.runs.add({
      lessonId: saveKey,
      createdAt: Date.now(),
      code,
      status: res.status,
      lines: res.lines,
      ms: res.ms,
      error: res.error,
      errorLine: res.errorLine,
      check: res.check,
      inspect: res.inspect,
    } as never)
    if (res.check?.pass && !done.includes(key)) {
      const row = { lessonId: saveKey, completedAt: Date.now() }
      await db.progress.put(row)
      pushRow("progress", row)
      const finished = [...done, key]
      const next = lessons[lessons.indexOf(doc) + 1]
      const sec = sections(lessons).find((s) => s.lessons.includes(doc))
      const sectionDone = sec?.lessons.every((l) => finished.includes(l.id)) ?? false
      const courseDone = lessons.every((l) => finished.includes(l.id))
      const quizzes = lessons.some((l) => l.quiz?.length)
      const go = (label: string, href: string) => ({ label, onClick: () => router.push(href) })
      celebrate(sectionDone)
      if (courseDone)
        toast.success(`You finished ${c.name}! 🎉`, {
          description: quizzes ? "Prove it with the final exam." : "Every lesson done.",
          action: quizzes ? go("Final exam", quizHref(course, "final")) : undefined,
        })
      else if (sec && sectionDone && sec.lessons.some((l) => l.quiz?.length))
        toast.success(`Section complete: ${sec.name}`, {
          description: "Lock it in with the section quiz.",
          action: go("Section quiz", quizHref(course, sec.id)),
        })
      else
        toast.success(sec && sectionDone ? `Section complete: ${sec.name}` : `${doc.title} complete!`, {
          description: next ? `Up next: ${next.title}` : undefined,
          action: next ? go("Next lesson", docHref(next, course)) : undefined,
        })
    }
  }

  const executeRef = useRef(execute)
  useEffect(() => {
    executeRef.current = execute
  })

  // Global shortcuts (Monaco handles ⌘↵ itself while focused).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      const inEditor = (e.target as HTMLElement).closest?.(".monaco-editor")
      const action = {
        Enter: inEditor ? undefined : () => executeRef.current(),
        ".": stop,
        k: () => setPaletteOpen((o) => !o),
        "\\": () => setOpen(panes.current, rightPane.current),
        j: () => setOpen(panes.current, editorPane.current),
      }[e.key]
      if (!action) return
      e.preventDefault()
      action()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [rightPane, editorPane])

  const running = state.status === "running"
  const docRuns = useLiveQuery(
    () =>
      db.runs.where("lessonId").equals(saveKey).reverse().sortBy("createdAt"),
    [saveKey],
    []
  )

  const tryCode = (c: string) => {
    edit(c)
    setOpen(panes.current, editorPane.current, true)
    setMobileTab("code")
    toast("Loaded into the editor", { description: "Press ⌘↵ to run it." })
  }

  const editor = (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center gap-1.5 border-b px-3">
        <span className="mr-auto flex h-full items-center gap-1.5 border-b-2 border-primary px-1 pt-0.5 font-mono text-xs text-foreground">
          <FileCode2Icon className="size-3.5 text-link" />
          {c.file}
        </span>
        <Tip label="Reset to starter code">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Reset code"
            onClick={() => {
              edit(starter)
              reset()
            }}
          >
            <RotateCcwIcon />
          </Button>
        </Tip>
        {doc.solution && (
          <Tip label="Show solution">
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Show solution"
              onClick={() => edit(doc.solution!)}
            >
              <LightbulbIcon />
            </Button>
          </Tip>
        )}
        {doc.check && (
          <Tip label="Run and check the challenge">
            <Button
              size="sm"
              variant="outline"
              disabled={running}
              onClick={() => execute(true)}
            >
              <FlaskConicalIcon data-icon="inline-start" />
              Check
            </Button>
          </Tip>
        )}
        {running ? (
          <Tip label="Stop" keys={["⌘", "."]}>
            <Button size="sm" variant="secondary" onClick={stop}>
              <SquareIcon data-icon="inline-start" />
              Stop
            </Button>
          </Tip>
        ) : (
          <Tip label="Run" keys={["⌘", "↵"]}>
            <Button size="sm" onClick={() => execute()}>
              <PlayIcon data-icon="inline-start" />
              Run
            </Button>
          </Tip>
        )}
      </div>
      <div className="relative min-h-0 flex-1">
        {glow && (
          <div
            key={glow.n}
            data-glow={glow.kind}
            className="run-glow"
            aria-hidden
          />
        )}
        <CodeEditor
          value={code}
          language={c.lang}
          path={c.file}
          onChange={edit}
          onRun={() => executeRef.current()}
          errorLine={state.status === "error" ? state.errorLine : undefined}
          highlightLine={
            picked?.runKey === state.runKey ? picked.line : undefined
          }
        />
      </div>
    </div>
  )

  const right = (
    <Tabs
      value={tab}
      onValueChange={setTab}
      className="flex h-full flex-col gap-0 bg-sidebar"
    >
      <div className="flex h-11 shrink-0 items-center border-b px-3">
        <TabsList variant="line">
          <TabsTrigger value="output">
            Output
            {running && <Spinner />}
          </TabsTrigger>
          {preview && <TabsTrigger value="preview">Preview</TabsTrigger>}
          {c.runtime === "pyodide" && (
            <TabsTrigger value="inspect">Inspect</TabsTrigger>
          )}
          <TabsTrigger value="history">
            History{docRuns.length ? ` (${docRuns.length})` : ""}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="output" className="min-h-0">
        <OutputPane state={state} />
      </TabsContent>
      {preview && (
        // Always mounted: a React run renders here even while the Output tab is showing.
        <TabsContent
          value="preview"
          forceMount
          className="min-h-0 data-[state=inactive]:hidden"
        >
          <PreviewPane state={state} />
        </TabsContent>
      )}
      <TabsContent value="inspect" className="min-h-0 overflow-auto">
        <InspectPane
          state={state}
          onPickLine={(line) => {
            setPicked({ line, runKey: state.runKey })
            setOpen(panes.current, editorPane.current, true)
            setMobileTab("code")
          }}
        />
      </TabsContent>
      <TabsContent value="history" className="min-h-0 overflow-auto">
        {docRuns.length ? (
          <HistoryList runs={docRuns} activeId={runId} showLesson={false} />
        ) : (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyTitle>No runs yet</EmptyTitle>
              <EmptyDescription>
                Every run on this page is saved here automatically.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </TabsContent>
    </Tabs>
  )

  const reading = (
    <div className="relative h-full overflow-hidden">
      <div key={route + param} className="h-full overflow-auto">
        {children}
      </div>
      <Mascot />
    </div>
  )

  return (
    <WorkspaceContext.Provider
      value={{ course, lessons, guide, done, tryCode }}
    >
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar
          current={key}
          runId={runId}
          onSearch={() => setPaletteOpen(true)}
        />
        <SidebarInset className="h-svh overflow-hidden">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
            <SidebarTrigger />
            <nav className="flex min-w-0 items-center gap-1.5 text-sm">
              <span className="hidden truncate text-muted-foreground sm:inline">
                {doc.section}
              </span>
              <span className="hidden text-muted-foreground sm:inline">/</span>
              <span className="truncate font-medium">{doc.title}</span>
              {runId && (
                <span className="shrink-0 text-muted-foreground">
                  · run #{runId}
                </span>
              )}
            </nav>
            <div className="ml-auto flex items-center gap-1">
              {idx >= 0 && (
                <>
                  <Tip label="Previous">
                    {idx === 0 ? (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Previous"
                        disabled
                      >
                        <ChevronLeftIcon />
                      </Button>
                    ) : (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Previous"
                        asChild
                      >
                        <Link href={docHref(siblings[idx - 1], course)}>
                          <ChevronLeftIcon />
                        </Link>
                      </Button>
                    )}
                  </Tip>
                  <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                    {idx + 1} / {siblings.length}
                  </span>
                  <Tip label="Next">
                    {idx === siblings.length - 1 ? (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Next"
                        disabled
                      >
                        <ChevronRightIcon />
                      </Button>
                    ) : (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Next"
                        asChild
                      >
                        <Link href={docHref(siblings[idx + 1], course)}>
                          <ChevronRightIcon />
                        </Link>
                      </Button>
                    )}
                  </Tip>
                </>
              )}
              {!compact && (
                <>
                  <Tip label="Toggle code editor" keys={["⌘", "J"]}>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Toggle code editor"
                      onClick={() => setOpen(panes.current, editorPane.current)}
                    >
                      <PanelBottomIcon />
                    </Button>
                  </Tip>
                  <Tip label="Toggle output pane" keys={["⌘", "\\"]}>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Toggle output pane"
                      onClick={() => setOpen(panes.current, rightPane.current)}
                    >
                      <PanelRightIcon />
                    </Button>
                  </Tip>
                </>
              )}
            </div>
          </header>

          {compact ? (
            <Tabs
              value={mobileTab}
              onValueChange={setMobileTab}
              className="min-h-0 flex-1 gap-0"
            >
              <TabsList variant="line" className="w-full border-b px-3">
                <TabsTrigger value="read">Read</TabsTrigger>
                <TabsTrigger value="code">Code</TabsTrigger>
                <TabsTrigger value="output">Output</TabsTrigger>
              </TabsList>
              <TabsContent value="read" className="min-h-0">
                {reading}
              </TabsContent>
              <TabsContent value="code" className="min-h-0">
                {editor}
              </TabsContent>
              <TabsContent value="output" className="min-h-0">
                {right}
              </TabsContent>
            </Tabs>
          ) : (
            <ResizablePanelGroup
              elementRef={panes}
              orientation="horizontal"
              className="min-h-0 flex-1"
              defaultLayout={layout.outer}
              onLayoutChanged={saveLayout("panes-outer")}
            >
              <ResizablePanel id="main" minSize="35">
                <ResizablePanelGroup
                  orientation="vertical"
                  defaultLayout={layout.inner}
                  onLayoutChanged={saveLayout("panes-inner")}
                >
                  <ResizablePanel id="reading" defaultSize="55" minSize="15">
                    {reading}
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel
                    id="editor"
                    panelRef={editorPane}
                    // The saved size, not just the default: the library's server render skips a
                    // saved 0, so a closed pane would flash open until hydration.
                    defaultSize={String(layout.inner?.editor ?? 45)}
                    minSize="20"
                    collapsible
                  >
                    {editor}
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel
                id="output"
                panelRef={rightPane}
                defaultSize={String(layout.outer?.output ?? 34)}
                minSize="22"
                collapsible
              >
                {right}
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </SidebarInset>
        <CommandMenu open={paletteOpen} onOpenChange={setPaletteOpen} />
        <Celebrations />
      </SidebarProvider>
    </WorkspaceContext.Provider>
  )
}
