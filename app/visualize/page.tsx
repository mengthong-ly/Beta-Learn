import { Suspense } from "react"

import { Playground } from "@/components/viz/playground"

export const metadata = { title: "Visualizer" }

export default function VisualizePage() {
  // Playground reads ?demo= with useSearchParams, which needs a Suspense boundary on a prerendered page.
  return (
    <Suspense>
      <Playground />
    </Suspense>
  )
}
