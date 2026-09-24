"use client"

import { useEffect } from "react"
import { PauseIcon, PlayIcon, RotateCcwIcon, SkipBackIcon, SkipForwardIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SPEEDS, type Player, type Speed } from "@/lib/viz/use-player"

/** VisualizationTimeline: step, play, scrub and change speed. ← → step, Space plays. */
export function VizTimeline({ player }: { player: Player }) {
  const { index, count, playing } = player

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || t.closest("input, textarea, [contenteditable], [role=slider], button, [role=radio]")) return
      if (e.key === "ArrowRight") player.step()
      else if (e.key === "ArrowLeft") player.back()
      else if (e.key === " ") (playing ? player.pause : player.play)()
      else return
      e.preventDefault()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [player, playing])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" onClick={player.reset} disabled={index === 0} aria-label="Reset to the start">
          <RotateCcwIcon />
        </Button>
        <Button variant="outline" size="icon" onClick={player.back} disabled={index === 0} aria-label="Step back">
          <SkipBackIcon />
        </Button>
        <Button variant="outline" size="icon" onClick={playing ? player.pause : player.play} aria-label={playing ? "Pause" : index >= count ? "Replay" : "Play"}>
          {playing ? <PauseIcon /> : <PlayIcon />}
        </Button>
        <Button onClick={player.step} disabled={index >= count} className="flex-1">
          Step
          <SkipForwardIcon data-icon="inline-end" />
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-24 shrink-0 text-xs text-muted-foreground tabular-nums" aria-live="polite">
          Step {index} of {count}
        </span>
        <Slider value={[index]} min={0} max={count} step={1} onValueChange={([v]) => player.seek(v)} aria-label="Timeline" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={String(player.speed)}
          onValueChange={(v) => v && player.setSpeed(Number(v) as Speed)}
          aria-label="Speed"
        >
          {SPEEDS.map((s) => (
            <ToggleGroupItem key={s} value={String(s)} className="px-2.5 tabular-nums">
              {s}×
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="hidden text-xs text-muted-foreground sm:block">
          <Kbd>←</Kbd> <Kbd>→</Kbd> step · <Kbd>Space</Kbd> play
        </p>
      </div>
    </div>
  )
}
