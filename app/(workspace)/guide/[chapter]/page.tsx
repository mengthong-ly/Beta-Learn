import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Doc } from "@/components/doc"
import { guide } from "@/lib/content"

export const dynamicParams = false

export function generateStaticParams() {
  return guide.map((g) => ({ chapter: g.id }))
}

export async function generateMetadata({
  params,
}: PageProps<"/guide/[chapter]">): Promise<Metadata> {
  const { chapter } = await params
  return { title: guide.find((g) => g.id === chapter)?.title }
}

export default async function GuideChapterPage({
  params,
}: PageProps<"/guide/[chapter]">) {
  const { chapter } = await params
  const index = guide.findIndex((g) => g.id === chapter)
  if (index < 0) notFound()
  return <Doc doc={guide[index]} chapter={index + 1} />
}
