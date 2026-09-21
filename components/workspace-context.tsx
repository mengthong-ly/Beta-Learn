"use client"

import { createContext, useContext } from "react"

import type { Lesson } from "@/lib/lesson-parser"

export type Workspace = {
  lessons: Lesson[]
  guide: Lesson[]
  /** lesson ids with a passed challenge */
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

export { docHref, docKey, findDoc, guideIndex } from "@/lib/docs"
