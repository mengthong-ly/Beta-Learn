"use client"

import { useRouter } from "next/navigation"
import { useLiveQuery } from "dexie-react-hooks"
import {
  BookMarkedIcon,
  BookOpenIcon,
  CheckIcon,
  CodeIcon,
  HistoryIcon,
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
import { db } from "@/lib/db"
import { findDoc, useWorkspace } from "@/components/workspace-context"

export function CommandMenu({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const router = useRouter()
  const { lessons, guide, done } = useWorkspace()
  const sections = [...new Set(lessons.map((l) => l.section))].map((name) => ({
    name,
    lessons: lessons.filter((l) => l.section === name),
  }))
  const recent = useLiveQuery(
    () => db.runs.orderBy("createdAt").reverse().limit(8).toArray(),
    [],
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
            <CommandItem onSelect={() => pick("/playground")}>
              <CodeIcon />
              Playground
            </CommandItem>
          </CommandGroup>
          {sections.map((s) => (
            <CommandGroup key={s.name} heading={s.name}>
              {s.lessons.map((l) => (
                <CommandItem
                  key={l.id}
                  value={`${s.name} ${l.title}`}
                  onSelect={() => pick(`/lesson/${l.id}`)}
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
                onSelect={() => pick(`/guide/${g.id}`)}
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
                    onSelect={() => pick(`/run/${r.id}`)}
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
