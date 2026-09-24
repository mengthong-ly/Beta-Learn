import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Doc } from "@/components/doc"
import { getCourse } from "@/lib/content"

export async function generateMetadata({
  params,
}: PageProps<"/[course]/guide/[chapter]">): Promise<Metadata> {
  const { course, chapter } = await params
  const guide = getCourse(course)!.guide
  return { title: guide.find((g) => g.id === chapter)?.title }
}

export default async function GuideChapterPage({
  params,
}: PageProps<"/[course]/guide/[chapter]">) {
  const { course, chapter } = await params
  const guide = getCourse(course)!.guide
  const index = guide.findIndex((g) => g.id === chapter)
  if (index < 0) notFound()
  return <Doc doc={guide[index]} chapter={index + 1} />
}
