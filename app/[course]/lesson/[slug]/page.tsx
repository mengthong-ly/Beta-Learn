import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Doc } from "@/components/doc"
import { getCourse } from "@/lib/content"

export const dynamicParams = false

export function generateStaticParams({
  params: { course },
}: {
  params: { course: string }
}) {
  return getCourse(course)!.lessons.map((l) => ({ slug: l.id }))
}

export async function generateMetadata({
  params,
}: PageProps<"/[course]/lesson/[slug]">): Promise<Metadata> {
  const { course, slug } = await params
  const lessons = getCourse(course)!.lessons
  return { title: lessons.find((l) => l.id === slug)?.title }
}

export default async function LessonPage({
  params,
}: PageProps<"/[course]/lesson/[slug]">) {
  const { course, slug } = await params
  const lessons = getCourse(course)!.lessons
  const lesson = lessons.find((l) => l.id === slug)
  if (!lesson) notFound()
  return <Doc doc={lesson} />
}
