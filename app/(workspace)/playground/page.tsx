import { Doc } from "@/components/doc"
import { playground } from "@/lib/lesson-parser"

export const metadata = { title: "Playground" }

export default function PlaygroundPage() {
  return <Doc doc={playground} />
}
