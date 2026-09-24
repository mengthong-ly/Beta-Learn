import { cn } from "@/lib/utils"

/**
 * Read-only demo code with the line that caused the current step highlighted. The same
 * tint as the Inspect tab's picked line (.inspect-line), with a gutter marker.
 */
export function CodePanel({ code, line }: { code: string; line?: number }) {
  return (
    <pre className="overflow-x-auto rounded-lg border bg-background py-2 font-mono text-[13px] leading-6" aria-label="Code">
      {code.split("\n").map((text, i) => {
        const active = i + 1 === line
        return (
          <div
            key={i}
            aria-current={active ? "step" : undefined}
            className={cn("flex border-l-2 border-transparent pr-3 transition-colors duration-200", active && "inspect-line border-(--iso-accent)")}
          >
            <span className={cn("w-9 shrink-0 pr-3 text-right text-muted-foreground tabular-nums select-none", active && "text-(--iso-accent)")}>{i + 1}</span>
            <span className="whitespace-pre text-foreground">{text || " "}</span>
          </div>
        )
      })}
    </pre>
  )
}
