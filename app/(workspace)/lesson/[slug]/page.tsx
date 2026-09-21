import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Doc } from "@/components/doc"
import { lessons } from "@/lib/content"

export const dynamicParams = false

export function generateStaticParams() {
  return lessons.map((l) => ({ slug: l.id }))
}

export async function generateMetadata({
  params,
}: PageProps<"/lesson/[slug]">): Promise<Metadata> {
  const { slug } = await params
  return { title: lessons.find((l) => l.id === slug)?.title }
}

export default async function LessonPage({
  params,
}: PageProps<"/lesson/[slug]">) {
  const { slug } = await params
  const lesson = lessons.find((l) => l.id === slug)
  if (!lesson) notFound()
  return <Doc doc={lesson} />
}
