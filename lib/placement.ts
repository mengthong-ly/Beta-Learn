import type { CourseId } from "./courses.ts"

/** The placement questions asked once, at /start, before the Fundamentals course. */
export type Answers = {
  coded: "never" | "tutorial" | "builds"
  tools: "no" | "heard" | "use"
  /** after `x = 5` then `x = x + 1` */
  x: "6" | "5" | "x + 1" | "unsure"
}
export type Goal = "web" | "apps" | "data" | "games" | "unsure"

/** Fundamentals lesson ids where each placement starts (content/fundamentals/lessons). */
export const START_POINTS = {
  basics: "what-is-a-program",
  thinking: "algorithms",
  blocks: "values-and-types",
} as const

type Option<V> = { value: V; label: string }
export type Question<K extends string = string, V extends string = string> = {
  id: K
  prompt: string
  code?: string
  options: Option<V>[]
}

export const QUESTIONS = [
  {
    id: "coded",
    prompt: "Have you written any code before?",
    options: [
      { value: "never", label: "Never, this is my first time" },
      { value: "tutorial", label: "A little, I've followed a tutorial or two" },
      { value: "builds", label: "Yes, I build things with code" },
    ],
  },
  {
    id: "tools",
    prompt: "Do you know what a code editor or a terminal is?",
    options: [
      { value: "no", label: "No idea" },
      { value: "heard", label: "I've heard of them" },
      { value: "use", label: "I use them" },
    ],
  },
  {
    id: "x",
    prompt: "After these two lines run, what is x?",
    code: "x = 5\nx = x + 1",
    options: [
      { value: "6", label: "6" },
      { value: "5", label: "5" },
      { value: "x + 1", label: "x + 1" },
      { value: "unsure", label: "I don't know yet" },
    ],
  },
  {
    id: "goal",
    prompt: "What would you like to build one day?",
    options: [
      { value: "web", label: "Websites" },
      { value: "apps", label: "Phone apps" },
      { value: "data", label: "Data and AI" },
      { value: "games", label: "Games and fast programs" },
      { value: "unsure", label: "Not sure yet" },
    ],
  },
] as const satisfies Question[]

/** The courses to suggest after Fundamentals, first one first. */
export const GOAL_COURSES: Record<Goal, CourseId[]> = {
  web: ["typescript", "react", "php"],
  apps: ["dart", "flutter"],
  data: ["python"],
  games: ["cpp", "rust"],
  unsure: ["python"],
}

/** Where in Fundamentals to start, or "skip" for people who can already code. */
export function placeFrom(a: Answers): string {
  const varsOk = a.x === "6"
  if (a.coded === "builds" && varsOk) return "skip"
  if (a.coded !== "never" && varsOk) return START_POINTS.blocks
  if (a.tools === "use" || a.coded === "builds") return START_POINTS.thinking
  return START_POINTS.basics
}

export type Placement = { start: string; goal: Goal; at: number }
const KEY = "placement"

export function readPlacement(): Placement | null {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null")
  } catch {
    return null
  }
}

export function savePlacement(p: Placement) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* private mode: placement is asked again next time */
  }
}
