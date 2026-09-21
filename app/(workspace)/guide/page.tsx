import { Doc } from "@/components/doc"
import { guideIndex } from "@/lib/docs"

export const metadata = { title: "Guide Book" }

export default function GuidePage() {
  return <Doc doc={guideIndex} />
}
