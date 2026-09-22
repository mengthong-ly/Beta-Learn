"use client"

import { useRouter } from "next/navigation"
import { useLiveQuery } from "dexie-react-hooks"
import {
  BookMarkedIcon,
  BookOpenIcon,
  CheckIcon,
  CodeIcon,
  HistoryIcon,
  LayoutGridIcon,
} from "lucide-react"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { courses } from "@/lib/courses"
import { db } from "@/lib/db"
import { docHref, findDoc, useWorkspace } from "@/components/workspace-context"

export function CommandMenu({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const router = useRouter()
  const { course, lessons, guide, done } = useWorkspace()
  const sections = [...new Set(lessons.map((l) => l.section))].map((name) => ({
    name,
    lessons: lessons.filter((l) => l.section === name),
  }))
  const recent = useLiveQuery(
    () =>
      db.runs
        .orderBy("createdAt")
        .reverse()
        .filter((r) => r.lessonId.startsWith(`${course}/`))
        .limit(8)
        .toArray(),
    [course],
    []
  )
  const pick = (path: string) => {
    router.push(path)
    onOpenChange(false)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Jump to a lesson or a past run"
    >
      <Command>
        <CommandInput placeholder="Search lessons and history…" />
        <CommandList>
          <CommandEmpty>Nothing found.</CommandEmpty>
          <CommandGroup heading="Go to">
            <CommandItem onSelect={() => pick(`/${course}/playground`)}>
              <CodeIcon />
              Playground
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Courses">
            <CommandItem onSelect={() => pick("/")}>
              <LayoutGridIcon />
              All courses
            </CommandItem>
            {courses
              .filter((c) => c.id !== course)
              .map((c) => (
                <CommandItem
                  key={c.id}
                  value={`course ${c.name}`}
                  onSelect={() => pick(`/${c.id}`)}
                >
                  <span className="w-4 font-mono text-xs font-bold text-muted-foreground">
                    {c.mark}
                  </span>
                  {c.name}
                </CommandItem>
              ))}
          </CommandGroup>
          {sections.map((s) => (
            <CommandGroup key={s.name} heading={s.name}>
              {s.lessons.map((l) => (
                <CommandItem
                  key={l.id}
                  value={`${s.name} ${l.title}`}
                  onSelect={() => pick(docHref(l, course))}
                >
                  <BookOpenIcon />
                  {l.title}
                  {done.includes(l.id) && (
                    <CheckIcon className="ml-auto text-success" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          <CommandGroup heading="Guide Book">
            {guide.map((g, i) => (
              <CommandItem
                key={g.id}
                value={`guide ${g.title} ${g.summary ?? ""}`}
                onSelect={() => pick(docHref(g, course))}
              >
                <BookMarkedIcon />
                <span className="w-5 text-muted-foreground tabular-nums">
                  {i + 1}
                </span>
                {g.title}
              </CommandItem>
            ))}
          </CommandGroup>
          {recent.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Recent runs">
                {recent.map((r) => (
                  <CommandItem
                    key={r.id}
                    value={`run ${r.id} ${r.code.slice(0, 80)}`}
                    onSelect={() => pick(`/${course}/run/${r.id}`)}
                  >
                    <HistoryIcon />
                    <span className="truncate">
                      {findDoc(r.lessonId, lessons, guide)?.title ?? r.lessonId}{" "}
                      ·{" "}
                      {new Date(r.createdAt).toLocaleString([], {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
