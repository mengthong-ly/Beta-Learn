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
  return (
    <Workspace course={course} {...content}>
      {children}
    </Workspace>
  )
}
