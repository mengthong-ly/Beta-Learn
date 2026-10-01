import { Placement } from "@/components/placement"
import { getCourse } from "@/lib/content"

export const metadata = { title: "Start here" }

/** "Start learning": a few placement questions, then straight into the Fundamentals course. */
export default function Start() {
  const lessons = getCourse("fundamentals")!.lessons
  const units = Object.fromEntries(
    lessons.map((l) => [l.id, { title: l.title, section: l.section }])
  )
  return <Placement first={lessons[0].id} units={units} />
}
