"use client"

import { useState } from "react"
import Link from "next/link"
import { useLiveQuery } from "dexie-react-hooks"
import {
  BookMarkedIcon,
  CheckIcon,
  ChevronRightIcon,
  CodeIcon,
  SearchIcon,
} from "lucide-react"

import { AppearanceMenu } from "@/components/appearance-menu"
import { CourseSwitcher } from "@/components/course-switcher"
import { HistoryList } from "@/components/history-list"
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
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { docHref, docKey, useWorkspace } from "@/components/workspace-context"
import { db } from "@/lib/db"
import { cn } from "@/lib/utils"

const label = "text-[11px] font-semibold tracking-[1px] uppercase"

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
  const recent = useLiveQuery(
    () =>
      db.runs
        .orderBy("createdAt")
        .reverse()
        .filter((r) => r.lessonId.startsWith(`${course}/`))
        .limit(30)
        .toArray(),
    [course],
    []
  )

  const sections = [...new Set(lessons.map((l) => l.section))].map((name) => ({
    name,
    lessons: lessons.filter((l) => l.section === name),
  }))
  const guideOpen = current === "guide" || current.startsWith("guide:")

  // Sections open/close freely, but the current doc's section always opens.
  const currentSection = guideOpen
    ? "Guide Book"
    : sections.find((s) => s.lessons.some((l) => l.id === current))?.name
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
    <Sidebar>
      <SidebarHeader>
        <CourseSwitcher course={course} />
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
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={label}>
            Course sessions
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((s) => {
                const count = s.lessons.filter((l) =>
                  done.includes(l.id)
                ).length
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
                        <SidebarMenuButton className="pr-12" title={s.name}>
                          <ChevronRightIcon className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          <span>{s.name}</span>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <SidebarMenuBadge
                        className={cn(
                          count === s.lessons.length && "text-success"
                        )}
                      >
                        {count}/{s.lessons.length}
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
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {guide.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={label}>Reference</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible
                  asChild
                  open={open.includes("Guide Book")}
                  onOpenChange={(o) => setSection("Guide Book", o)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <ChevronRightIcon className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        <BookMarkedIcon />
                        <span>Guide Book</span>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <SidebarMenuBadge>{guide.length}</SidebarMenuBadge>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={current === "guide" && !runId}
                          >
                            <Link href={`/${course}/guide`}>Contents</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        {guide.map((g, i) => (
                          <SidebarMenuSubItem key={g.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={docKey(g) === current && !runId}
                            >
                              <Link href={docHref(g, course)}>
                                <span className="w-4 shrink-0 text-muted-foreground tabular-nums">
                                  {i + 1}
                                </span>
                                <span className="truncate" title={g.title}>
                                  {g.title}
                                </span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {recent.length > 0 && (
          <>
            <SidebarSeparator />
            <HistoryList runs={recent} activeId={runId} />
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <AppearanceMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
