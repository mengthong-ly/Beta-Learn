"use client"

import { useState } from "react"
import Link from "next/link"
import { useLiveQuery } from "dexie-react-hooks"
import {
  BookMarkedIcon,
  CheckIcon,
  CodeIcon,
  HistoryIcon,
  ListChecksIcon,
  SearchIcon,
  TrophyIcon,
} from "lucide-react"

import { AccountMenu } from "@/components/account-menu"
import { CourseSwitcher } from "@/components/course-switcher"
import { FocusTimer } from "@/components/focus-timer"
import { StatsBadge } from "@/components/stats-badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Kbd } from "@/components/ui/kbd"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { docHref, findDoc, useWorkspace } from "@/components/workspace-context"
import { db } from "@/lib/db"
import { quizHref, quizStoreKey, sections as allSections } from "@/lib/docs"

export function AppSidebar({
  current,
  runId,
  onSearch,
}: {
  current: string
  runId?: number
  onSearch: () => void
}) {
  const { course, lessons, guide, done } = useWorkspace()
  // Latest run per doc, so repeated runs of one lesson show once.
  const recent = useLiveQuery(
    async () => {
      const seen = new Set<string>()
      return (
        await db.runs
          .orderBy("createdAt")
          .reverse()
          .filter((r) => r.lessonId.startsWith(`${course}/`))
          .limit(50)
          .toArray()
      )
        .filter((r) => !seen.has(r.lessonId) && !!seen.add(r.lessonId))
        .slice(0, 5)
    },
    [course],
    []
  )
  const passed = useLiveQuery(
    () =>
      db.quizzes
        .where("key")
        .startsWith(`${course}/`)
        .filter((q) => !!q.passedAt)
        .primaryKeys(),
    [course],
    [] as string[]
  )
  const hasQuizzes = lessons.some((l) => l.quiz?.length)

  const sections = allSections(lessons)
  const guideOpen = current === "guide" || current.startsWith("guide:")

  // Sections open/close freely, but the current doc's section always opens.
  const currentSection = sections.find(
    (s) => s.lessons.some((l) => l.id === current) || current === `quiz:${s.id}`
  )?.name
  const [open, setOpen] = useState<string[]>([])
  const [seen, setSeen] = useState<string>()
  if (currentSection !== seen) {
    setSeen(currentSection)
    if (currentSection && !open.includes(currentSection))
      setOpen([...open, currentSection])
  }
  const setSection = (name: string, o: boolean) =>
    setOpen((prev) => (o ? [...prev, name] : prev.filter((n) => n !== name)))

  return (
    <Sidebar variant="floating">
      <SidebarHeader className="gap-3">
        <CourseSwitcher course={course} />
        <div className="flex items-center justify-between">
          <StatsBadge />
          <FocusTimer />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onSearch}>
              <SearchIcon />
              <span>Search</span>
              <Kbd className="ml-auto">⌘K</Kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={current === "playground" && !runId}
            >
              <Link href={`/${course}/playground`}>
                <CodeIcon />
                <span>Playground</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {guide.length > 0 && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={guideOpen && !runId}>
                <Link href={`/${course}/guide`}>
                  <BookMarkedIcon />
                  <span>Guide Book</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Lessons</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((s) => {
                const count = s.lessons.filter((l) =>
                  done.includes(l.id)
                ).length
                const [num, title] = s.name.split(" · ")
                return (
                  <Collapsible
                    key={s.name}
                    asChild
                    open={open.includes(s.name)}
                    onOpenChange={(o) => setSection(s.name, o)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="pr-10" title={s.name}>
                          <span className="w-4 shrink-0 text-xs text-muted-foreground tabular-nums">
                            {title ? num : ""}
                          </span>
                          <span>{title ?? s.name}</span>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <SidebarMenuBadge
                        aria-label={`${count} of ${s.lessons.length} done`}
                      >
                        {count === s.lessons.length ? (
                          <CheckIcon className="size-3.5 text-success" />
                        ) : (
                          <span className="font-normal text-muted-foreground">
                            {count}/{s.lessons.length}
                          </span>
                        )}
                      </SidebarMenuBadge>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {s.lessons.map((l) => (
                            <SidebarMenuSubItem key={l.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={l.id === current && !runId}
                              >
                                <Link href={docHref(l, course)}>
                                  <span className="truncate" title={l.title}>
                                    {l.title}
                                  </span>
                                  {done.includes(l.id) && (
                                    <CheckIcon className="ml-auto text-success" />
                                  )}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                          {s.lessons.some((l) => l.quiz?.length) && (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton
                                asChild
                                isActive={current === `quiz:${s.id}`}
                              >
                                <Link href={quizHref(course, s.id)}>
                                  <ListChecksIcon />
                                  <span>Section quiz</span>
                                  {passed.includes(
                                    quizStoreKey(course, s.id)
                                  ) && (
                                    <CheckIcon className="ml-auto text-success" />
                                  )}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
              {hasQuizzes && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={current === "quiz:final"}
                  >
                    <Link href={quizHref(course, "final")}>
                      <TrophyIcon />
                      <span>Final exam</span>
                      {passed.includes(quizStoreKey(course, "final")) && (
                        <CheckIcon className="ml-auto text-success" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {recent.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Recent</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recent.map((r) => (
                  <SidebarMenuItem key={r.id}>
                    <SidebarMenuButton asChild isActive={r.id === runId}>
                      <Link href={`/${course}/run/${r.id}`}>
                        <HistoryIcon />
                        <span className="truncate">
                          {findDoc(r.lessonId, lessons, guide)?.title ??
                            r.lessonId}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <AccountMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
