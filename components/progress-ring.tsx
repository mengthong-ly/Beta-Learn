import { cn } from "@/lib/utils"

const R = 6
const C = 2 * Math.PI * R

/** A small ring that fills as value approaches max; animates via CSS on change. */
export function ProgressRing({
  value,
  max,
  className,
}: {
  value: number
  max: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={cn("size-3.5 -rotate-90", className)}
    >
      <circle
        cx="8"
        cy="8"
        r={R}
        fill="none"
        strokeWidth="2.5"
        className="stroke-border"
      />
      <circle
        cx="8"
        cy="8"
        r={R}
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - (max ? value / max : 0))}
        className="stroke-success transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
      />
    </svg>
  )
}
