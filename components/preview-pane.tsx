"use client"

import { AppWindowIcon } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { setPreviewFrame, type RunState } from "@/lib/runner"

/** React renders in a sandboxed iframe (public/react-preview.html); Flutter shows its web build. */
export function PreviewPane({ state }: { state: RunState }) {
  const p = state.preview
  if (!p)
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AppWindowIcon />
          </EmptyMedia>
          <EmptyTitle>Nothing to show yet</EmptyTitle>
          <EmptyDescription>Press Run and your app appears here.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  if (p.kind === "url")
    return (
      <iframe
        key={p.url}
        src={p.url}
        title="App preview"
        className="size-full border-0 bg-white"
      />
    )
  if (p.kind !== "react") return null
  return (
    <iframe
      key={state.runKey}
      ref={(el) => setPreviewFrame(el?.contentWindow ?? null)}
      src="/react-preview.html"
      sandbox="allow-scripts"
      title="App preview"
      className="size-full border-0 bg-white"
      onLoad={(e) =>
        e.currentTarget.contentWindow?.postMessage(
          { thonglearn: true, code: p.code, check: p.check },
          "*"
        )
      }
    />
  )
}

/** TypeScript runs out of sight: a hidden sandboxed iframe (public/ts-run.html) per run. */
export function ScriptFrame({ state }: { state: RunState }) {
  const p = state.preview
  if (p?.kind !== "script") return null
  return (
    <iframe
      key={state.runKey}
      ref={(el) => setPreviewFrame(el?.contentWindow ?? null)}
      src="/ts-run.html"
      sandbox="allow-scripts"
      title="TypeScript runner"
      hidden
      onLoad={(e) =>
        e.currentTarget.contentWindow?.postMessage({ thonglearn: true, main: p.main, check: p.check }, "*")
      }
    />
  )
}
