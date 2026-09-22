"use client"

import { Children, isValidElement, useState } from "react"
import Link from "next/link"
import Markdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  BookMarkedIcon,
  CheckCircle2Icon,
  ChevronRightIcon,
  PlayIcon,
} from "lucide-react"

import { Quiz } from "@/components/quiz"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { docHref, storageKey, useWorkspace } from "@/components/workspace-context"
import { findCourse } from "@/lib/courses"
import type { Lesson } from "@/lib/lesson-parser"
import { cn } from "@/lib/utils"

type HastNode = {
  type: string
  value?: string
  children?: HastNode[]
  properties?: { className?: string[] }
}
const toText = (n?: HastNode): string =>
  (n?.value ?? "") + (n?.children ?? []).map(toText).join("")

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const CALLOUT_TINT: [string, string][] = [
  ["💡", "bg-tint-sky"],
  ["⚠️", "bg-tint-peach"],
  ["🎯", "bg-tint-lavender"],
  ["✅", "bg-tint-mint"],
  ["📝", "bg-tint-yellow"],
  ["🧭", "bg-tint-rose"],
]

/** `> 🔍 **Behind the scenes: …**` — the first paragraph is the always-visible title. */
function BehindTheScenes({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [title, ...rest] = Children.toArray(children).filter(isValidElement)
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="my-4 rounded-lg border bg-muted/40 text-foreground"
    >
      <CollapsibleTrigger className="flex w-full items-start gap-2 rounded-lg px-4 py-3 text-left hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <span className="flex-1 [&_p]:m-0">{title}</span>
        <ChevronRightIcon
          className={cn(
            "mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-90"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-3 [&_p]:my-2">
        {rest}
      </CollapsibleContent>
    </Collapsible>
  )
}

function GuideContents() {
  const { course, guide } = useWorkspace()
  return (
    <>
      <p className="my-3">
        A reference you can read front to back or dip into. Every chapter
        explains the syntax, and most topics have a{" "}
        <strong>🔍 Behind the scenes</strong> section you can open to see what
        Python is actually doing, the details classes usually skip. Look for{" "}
        <strong>🧭 Scenario</strong> cards for real-world uses, and press{" "}
        <strong>Try it</strong> on any example, then open the{" "}
        <strong>Inspect</strong> tab to look inside.
      </p>
      <ol className="mt-8 grid gap-3 sm:grid-cols-2">
        {guide.map((g, i) => (
          <li key={g.id}>
            <Link
              href={docHref(g, course)}
              className="flex h-full flex-col gap-1 rounded-lg border p-4 transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="text-xs text-muted-foreground tabular-nums">
                Chapter {i + 1}
              </span>
              <span className="font-semibold text-foreground">{g.title}</span>
              {g.summary && <span className="text-sm">{g.summary}</span>}
            </Link>
          </li>
        ))}
      </ol>
    </>
  )
}

export function Doc({ doc, chapter }: { doc: Lesson; chapter?: number }) {
  const { course, done, tryCode } = useWorkspace()
  const courseLang = findCourse(course).lang

  const components: Components = {
    h2: ({ children }) => (
      <h2
        id={slug(String(children))}
        className="mt-10 mb-3 scroll-mt-4 text-[22px] leading-[1.3] font-semibold text-foreground"
      >
        {children}
      </h2>
    ),
    h3: (p) => (
      <h3 className="mt-6 mb-2 text-lg font-semibold text-foreground" {...p} />
    ),
    p: (p) => <p className="my-3" {...p} />,
    ul: (p) => (
      <ul className="my-3 flex list-disc flex-col gap-1 pl-6" {...p} />
    ),
    ol: (p) => (
      <ol className="my-3 flex list-decimal flex-col gap-1 pl-6" {...p} />
    ),
    a: ({ href = "", ...p }) =>
      href.startsWith("/") ? (
        <Link
          href={href}
          className="text-link underline-offset-2 hover:underline"
          {...p}
        />
      ) : (
        <a
          href={href}
          className="text-link underline-offset-2 hover:underline"
          target="_blank"
          rel="noreferrer"
          {...p}
        />
      ),
    strong: (p) => <strong className="font-semibold text-foreground" {...p} />,
    table: (p) => (
      <div className="my-4 overflow-x-auto rounded-md border">
        <table className="w-full text-sm" {...p} />
      </div>
    ),
    th: (p) => (
      <th
        className="border-b bg-muted px-3 py-2 text-left font-medium"
        {...p}
      />
    ),
    td: (p) => (
      <td
        className="border-b px-3 py-2 align-top [tr:last-child_&]:border-0"
        {...p}
      />
    ),
    code: ({ className, ...p }) => (
      <code
        className={cn(
          className ??
            "rounded-sm bg-muted box-decoration-clone px-1.5 py-0.5 font-mono text-[0.85em] text-code-inline"
        )}
        {...p}
      />
    ),
    blockquote: ({ node, children }) => {
      const text = toText(node as HastNode).trim()
      if (text.startsWith("🔍"))
        return <BehindTheScenes>{children}</BehindTheScenes>
      const tint = CALLOUT_TINT.find(([e]) => text.startsWith(e))?.[1]
      return tint ? (
        <div
          className={cn(
            "my-4 rounded-lg px-4 py-1 text-foreground [&_code]:bg-background/70 [&_p]:my-2",
            tint
          )}
        >
          {children}
        </div>
      ) : (
        <blockquote className="my-4 border-l-[3px] border-foreground pl-4">
          {children}
        </blockquote>
      )
    },
    pre: ({ node }) => {
      const code = toText(node as HastNode).replace(/\n$/, "")
      const lang =
        (node as HastNode).children?.[0]?.properties?.className?.[0]?.replace(
          "language-",
          ""
        ) ?? "text"
      return (
        <div className="my-4 min-h-8 overflow-hidden rounded-lg bg-muted">
          <div className="flex h-8 items-center justify-between pr-1 pl-4 font-mono text-xs text-muted-foreground">
            <span>{lang.replace(/-snippet$/, "")}</span>
            {lang === courseLang && (
              <Button
                size="xs"
                variant="ghost"
                className="font-sans text-link"
                onClick={() => tryCode(code + "\n")}
              >
                <PlayIcon data-icon="inline-start" />
                Try it
              </Button>
            )}
          </div>
          <pre className="overflow-x-auto px-4 pb-4 font-mono text-[13px] leading-relaxed text-foreground">
            {code}
          </pre>
        </div>
      )
    },
  }

  return (
    <article className="mx-auto max-w-[720px] px-5 pt-8 pb-16 text-[length:var(--reading-size)] leading-[1.6] tracking-[var(--reading-tracking)] text-slate md:px-8 md:pt-10">
      <div className="mb-3 flex items-center gap-2">
        <Badge
          variant="secondary"
          className="rounded-sm bg-tint-lavender text-tag-purple-fg"
        >
          {doc.kind === "guide" && <BookMarkedIcon data-icon="inline-start" />}
          {doc.kind === "guide" && chapter
            ? `Guide Book · Chapter ${chapter}`
            : doc.section}
        </Badge>
        {doc.kind === "lesson" && done.includes(doc.id) && (
          <Badge
            variant="secondary"
            className="rounded-sm bg-tint-mint text-success"
          >
            <CheckCircle2Icon data-icon="inline-start" />
            Completed
          </Badge>
        )}
      </div>
      <h1 className="text-[28px] leading-[1.2] font-semibold tracking-[-0.5px] text-foreground md:text-[36px]">
        {doc.title}
      </h1>
      {doc.summary && (
        <p className="mt-2 text-base text-muted-foreground md:text-lg">
          {doc.summary}
        </p>
      )}
      {doc.id === "guide" && doc.kind === "guide" ? (
        <GuideContents />
      ) : (
        <Markdown remarkPlugins={[remarkGfm]} components={components}>
          {doc.body}
        </Markdown>
      )}
      {doc.kind === "lesson" && doc.quiz?.length ? (
        <Quiz
          key={doc.id}
          title="Check your understanding"
          questions={doc.quiz}
          storeKey={storageKey(course, doc.id)}
        />
      ) : null}
    </article>
  )
}
