"use client"

import { useCallback, useEffect, useState } from "react"

export const SPEEDS = [0.5, 1, 2] as const
export type Speed = (typeof SPEEDS)[number]

/**
 * Timeline state for a demo with `count` steps. `index` is a frame index: 0 is before the
 * first step, count is after the last. `forward` tells the renderer whether to play the
 * step's flights (stepping back just rewinds the state).
 */
export function usePlayer(count: number) {
  const [pos, setPos] = useState({ index: 0, forward: true })
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1)

  const step = useCallback(() => setPos((p) => (p.index < count ? { index: p.index + 1, forward: true } : p)), [count])
  const back = useCallback(() => setPos((p) => (p.index > 0 ? { index: p.index - 1, forward: false } : p)), [])
  const seek = useCallback((index: number) => setPos((p) => ({ index, forward: index === p.index + 1 })), [])
  const reset = useCallback(() => {
    setPlaying(false)
    setPos({ index: 0, forward: false })
  }, [])
  const play = useCallback(() => {
    // Play from the start again when already at the end (Replay).
    setPos((p) => (p.index >= count ? { index: 0, forward: false } : p))
    setPlaying(true)
  }, [count])
  const pause = useCallback(() => setPlaying(false), [])

  useEffect(() => {
    if (!playing || pos.index >= count) return
    const t = setTimeout(() => {
      step()
      if (pos.index + 1 >= count) setPlaying(false)
    }, (pos.index === 0 ? 350 : 1300) / speed)
    return () => clearTimeout(t)
  }, [playing, pos.index, count, speed, step])

  return { ...pos, count, playing, speed, setSpeed, step, back, seek, reset, play, pause }
}

export type Player = ReturnType<typeof usePlayer>
