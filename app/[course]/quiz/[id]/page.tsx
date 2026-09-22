import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Quiz } from "@/components/quiz"
import { getCourse } from "@/lib/content"
import { quizStoreKey, sections } from "@/lib/docs"
import { finalQuiz, sectionQuiz } from "@/lib/quiz"

export const dynamicParams = false

export function generateStaticParams({
  params: { course },
}: {
  params: { course: string }
}) {
  const lessons = getCourse(course)!.lessons
  return [...sections(lessons).map((s) => s.id), "final"].map((id) => ({ id }))
}

function load(course: string, id: string) {
  const lessons = getCourse(course)!.lessons
  if (id === "final")
    return {
      title: "Final exam",
      intro: "Questions from every section of the course, easy → hard.",
      questions: finalQuiz(lessons),
    }
  const s = sections(lessons).find((s) => s.id === id)
  return (
    s && {
      title: `Section quiz: ${s.name}`,
      intro: `The medium and hard questions from ${s.lessons.length} lessons, easy → hard.`,
      questions: sectionQuiz(s.lessons),
    }
  )
}

export async function generateMetadata({
  params,
}: PageProps<"/[course]/quiz/[id]">): Promise<Metadata> {
  const { course, id } = await params
  return { title: load(course, id)?.title }
}

export default async function QuizPage({
  params,
}: PageProps<"/[course]/quiz/[id]">) {
  const { course, id } = await params
  const quiz = load(course, id)
  if (!quiz?.questions.length) notFound()
  return (
    <article className="mx-auto max-w-[720px] px-5 pt-8 pb-16 text-[length:var(--reading-size)] leading-[1.6] text-slate md:px-8 md:pt-10">
      <h1 className="text-[28px] leading-[1.2] font-semibold tracking-[-0.5px] text-foreground md:text-[36px]">
        {quiz.title}
      </h1>
      <p className="mt-2 text-base text-muted-foreground md:text-lg">
        {quiz.intro}
      </p>
      <Quiz
        title={quiz.title}
        questions={quiz.questions}
        storeKey={quizStoreKey(course, id)}
      />
    </article>
  )
}
