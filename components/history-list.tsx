"use client"

import Link from "next/link"
import { Trash2Icon } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { db, type Run } from "@/lib/db"
import { findDoc, useWorkspace } from "@/components/workspace-context"
import { cn } from "@/lib/utils"

const DAY = 86_400_000

function groupByDay(runs: Run[]) {
  const today = new Date().setHours(0, 0, 0, 0)
  const groups: { label: string; runs: Run[] }[] = [
    { label: "Today", runs: [] },
    { label: "Yesterday", runs: [] },
    { label: "Earlier", runs: [] },
  ]
  for (const r of runs)
    groups[
      r.createdAt >= today ? 0 : r.createdAt >= today - DAY ? 1 : 2
    ].runs.push(r)
  return groups.filter((g) => g.runs.length)
}

const statusDot = (r: Pick<Run, "status" | "check">) =>
  r.check?.pass
    ? "bg-success"
    : r.status === "done"
      ? "bg-link"
      : r.status === "error"
        ? "bg-destructive"
        : "bg-warning"

const time = (t: number) =>
  new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })

/** Runs grouped Today / Yesterday / Earlier, like sessions in Claude Code. */
export function HistoryList({
  runs,
  activeId,
  showLesson = true,
}: {
  runs: Run[]
  activeId?: number
  showLesson?: boolean
}) {
  const { lessons, guide } = useWorkspace()
  return groupByDay(runs).map((g) => (
    <SidebarGroup key={g.label}>
      <SidebarGroupLabel className="text-[11px] font-semibold tracking-[1px] uppercase">
        {g.label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {g.runs.map((r) => (
            <SidebarMenuItem key={r.id}>
              <SidebarMenuButton
                asChild
                isActive={r.id === activeId}
                className="h-auto py-1.5"
              >
                <Link href={`/run/${r.id}`}>
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      statusDot(r)
                    )}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">
                      {showLesson
                        ? (findDoc(r.lessonId, lessons, guide)?.title ??
                          r.lessonId)
                        : r.code.split("\n").find((l) => l.trim()) || "(empty)"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {time(r.createdAt)}
                      {r.check
                        ? r.check.pass
                          ? " · passed"
                          : " · check failed"
                        : ""}
                    </span>
                  </span>
                </Link>
              </SidebarMenuButton>
              <SidebarMenuAction
                showOnHover
                aria-label="Delete run"
                onClick={() => db.runs.delete(r.id)}
              >
                <Trash2Icon />
              </SidebarMenuAction>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ))
}
