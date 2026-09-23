"use client"

import dynamic from "next/dynamic"
import { CircleCheckIcon, FileInputIcon } from "lucide-react"

import { OutputLines } from "@/components/predict-output"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { checkItems } from "@/lib/check-items"
import type { Lesson } from "@/lib/lesson-parser"

const CodeDiff = dynamic(() => import("@/components/code-editor").then((m) => m.CodeDiff), {
  ssr: false,
  loading: () => <div className="p-4 text-sm text-muted-foreground">Loading…</div>,
})

const PROMPTS = [
  "Where your code differs, does it do the same thing? How can you tell?",
  "Why might the solution do it this way?",
]

/** Write-only lessons can't be checked, so compare your attempt with the solution instead of replacing it. */
export function SolutionCompare({
  doc,
  code,
  language,
  open,
  onOpenChange,
  onLoad,
}: {
  doc: Lesson
  code: string
  language: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onLoad: () => void
}) {
  const items = checkItems(doc.check)
  const output = doc.solution ? doc.outputs?.[doc.solution.trim()] : undefined
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full data-[side=right]:sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle>Compare with the solution</SheetTitle>
          <SheetDescription>
            Red is your code, green is the solution&apos;s. Your code stays as it is.
          </SheetDescription>
        </SheetHeader>
        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto px-4">
          <div className="h-[45vh] min-h-64 overflow-hidden rounded-lg border">
            <CodeDiff original={code} modified={doc.solution ?? ""} language={language} />
          </div>
          {output && (
            <section className="grid gap-2">
              <h3 className="font-medium">What the solution prints</h3>
              <OutputLines output={output} />
            </section>
          )}
          {items.length > 0 && (
            <section className="grid gap-2">
              <h3 className="font-medium">The check wants your code to…</h3>
              <ul className="grid gap-1.5">
                {items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="grid gap-2 pb-2">
            <h3 className="font-medium">Think it through</h3>
            <ol className="grid list-decimal gap-1.5 pl-5 text-muted-foreground">
              {PROMPTS.map((p) => (
                <li key={p}>{p}</li>
              ))}
              <li>
                {items.length
                  ? "Go through the list above: would each point be true for your code?"
                  : "What would a check test here? Would your code pass it?"}
              </li>
            </ol>
          </section>
        </div>
        <SheetFooter className="flex-row justify-end">
          <Button variant="outline" onClick={onLoad}>
            <FileInputIcon data-icon="inline-start" />
            Load the solution into the editor
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
