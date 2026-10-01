"use client"

import { useLessonLayout } from "@/components/appearance-menu"
import { LessonStepper } from "@/components/lesson-stepper"
import { Doc as ClassicDoc } from "@/components/v1/doc"
import type { Lesson } from "@/lib/lesson-parser"

/** Lessons render step by step unless "Classic" is picked in Appearance; everything else scrolls (V1). */
export function Doc({ doc, chapter }: { doc: Lesson; chapter?: number }) {
  const layout = useLessonLayout()
  return doc.kind === "lesson" && layout === "steps" ? (
    <LessonStepper doc={doc} />
  ) : (
    <ClassicDoc doc={doc} chapter={chapter} />
  )
}
