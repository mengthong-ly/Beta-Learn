import { cookies } from "next/headers"
import { notFound } from "next/navigation"

import { Workspace } from "@/components/workspace"
import { getCourse } from "@/lib/content"
import { courses } from "@/lib/courses"

export const dynamicParams = false

export function generateStaticParams() {
  return courses.map((c) => ({ course: c.id }))
}

export default async function CourseLayout({
  children,
  params,
}: LayoutProps<"/[course]">) {
  const { course } = await params
  const content = getCourse(course)
  if (!content) notFound()
  // Pane state lives in cookies so the server renders it and a refresh doesn't jump.
  const jar = await cookies()
  const layout = (name: string) => {
    try {
      return JSON.parse(jar.get(name)?.value ?? "")
    } catch {}
  }
  return (
    <Workspace
      course={course}
      {...content}
      sidebarOpen={jar.get("sidebar_state")?.value !== "false"}
      layout={{ outer: layout("panes-outer"), inner: layout("panes-inner") }}
    >
      {children}
    </Workspace>
  )
}
