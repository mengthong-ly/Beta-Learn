"use client"

import { useState } from "react"
import { CheckIcon, EyeIcon, LightbulbIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Output } from "@/lib/lesson-parser"
import { cn } from "@/lib/utils"

const same = (a: string, b: string) => a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim()

/** The real output of an example the website can't run: predict it first, then reveal it. */
export function PredictOutput({ output }: { output: Output }) {
  const [open, setOpen] = useState(false)
  const [guess, setGuess] = useState("")
  const [shown, setShown] = useState(false)
  const printed = output.lines.filter((l) => l.kind === "out").map((l) => l.text).join("\n")

  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 border-t border-background/60 px-4 py-2 text-left font-sans text-xs text-muted-foreground hover:text-foreground"
      >
        <LightbulbIcon className="size-3.5" />
        Predict: what happens when this runs?
      </button>
    )

  return (
    <div className="grid gap-2 border-t border-background/60 px-4 py-3 font-sans text-sm">
      <label className="grid gap-1.5">
        <span className="text-xs text-muted-foreground">
          Your prediction (optional): what does it print, or does it fail?
        </span>
        <Textarea
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          disabled={shown}
          rows={Math.min(Math.max(output.lines.length, 1), 4)}
          className="bg-background font-mono text-[13px]"
        />
      </label>
      {!shown ? (
        <Button size="sm" variant="outline" className="w-fit" onClick={() => setShown(true)}>
          <EyeIcon data-icon="inline-start" />
          Reveal the real output
        </Button>
      ) : (
        <div className="grid gap-1.5" aria-live="polite">
          {guess.trim() && (
            <p className={cn("flex items-center gap-1.5 text-xs", same(guess, printed) && !output.error ? "text-success" : "text-muted-foreground")}>
              {same(guess, printed) && !output.error ? (
                <>
                  <CheckIcon className="size-3.5" /> Matches what it printed.
                </>
              ) : (
                "Not quite. Compare line by line: what did you expect differently, and why?"
              )}
            </p>
          )}
          <OutputLines output={output} />
          <p className="text-xs text-muted-foreground">Recorded by running this example with the real toolchain.</p>
        </div>
      )}
    </div>
  )
}

export function OutputLines({ output }: { output: Output }) {
  return (
    <pre className="overflow-x-auto rounded-md bg-background px-3 py-2 font-mono text-[13px] leading-relaxed">
      {output.lines.map((l, i) => (
        <div key={i} className={l.kind === "err" ? "text-destructive" : undefined}>
          {l.text || " "}
        </div>
      ))}
      {output.error && <div className="text-destructive">{output.error}</div>}
      {!output.lines.length && !output.error && (
        <div className="text-muted-foreground">(prints nothing)</div>
      )}
    </pre>
  )
}
