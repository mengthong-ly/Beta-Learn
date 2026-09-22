"use client"

import { createContext, useContext } from "react"

import type { Lesson } from "@/lib/lesson-parser"

export type Workspace = {
  /** course id, e.g. "python" */
  course: string
  lessons: Lesson[]
  guide: Lesson[]
  /** doc keys (within this course) with a passed challenge */
  done: string[]
  /** load code into the editor (the "Try it" buttons) */
  tryCode: (code: string) => void
}

export const WorkspaceContext = createContext<Workspace | null>(null)

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error("useWorkspace must be used inside <Workspace>")
  return ctx
}

export { docHref, docKey, findDoc, guideIndex, storageKey } from "@/lib/docs"
