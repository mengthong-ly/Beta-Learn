import { emojiCode } from "@/lib/emoji"
import { EMOJI } from "@/lib/emoji-manifest"
import { cn } from "@/lib/utils"

/** A Fluent 3D icon for `char`, or the plain emoji when there's no vendored icon. */
export function Emoji({ char, className, label = "" }: { char: string; className?: string; label?: string }) {
  const code = emojiCode(char)
  if (!EMOJI.has(code))
    return <span role={label ? "img" : undefined} aria-label={label || undefined} aria-hidden={!label || undefined} className={cn("leading-none", className)}>{char}</span>
  return <img src={`/emoji/${code}.webp`} alt={label} draggable={false} className={cn("select-none", className)} />
}
