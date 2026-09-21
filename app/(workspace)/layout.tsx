import { Workspace } from "@/components/workspace"
import { guide, lessons } from "@/lib/content"

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Workspace lessons={lessons} guide={guide}>
      {children}
    </Workspace>
  )
}
