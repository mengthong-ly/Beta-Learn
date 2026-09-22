"use client"

import Link from "next/link"
import { CheckIcon, ChevronsUpDownIcon, LayoutGridIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { courses, isExtra, type Course } from "@/lib/courses"

export function CourseMark({ mark }: { mark: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground font-mono text-xs font-bold text-background">
      {mark}
    </span>
  )
}

/** Sidebar header: the current course, with a menu to switch course or go back Home. */
export function CourseSwitcher({ course }: { course: string }) {
  const current = courses.find((c) => c.id === course) ?? courses[0]
  const item = (c: Course) => (
    <DropdownMenuItem key={c.id} asChild>
      <Link href={`/${c.id}`}>
        <span className="font-mono text-xs font-bold text-muted-foreground">
          {c.mark}
        </span>
        {c.name}
        {c.id === current.id && <CheckIcon className="ml-auto" />}
      </Link>
    </DropdownMenuItem>
  )
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg">
              <CourseMark mark={current.mark} />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-semibold">{current.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  ThongLearn
                </span>
              </span>
              <ChevronsUpDownIcon className="ml-auto text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Courses</DropdownMenuLabel>
              {courses.filter((c) => !isExtra(c)).map(item)}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Extra</DropdownMenuLabel>
              {courses.filter(isExtra).map(item)}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/">
                <LayoutGridIcon />
                All courses
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
