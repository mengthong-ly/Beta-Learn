"use client"

import { createContext, useContext } from "react"

/** The house easing (components/output-pane.tsx): for things entering or leaving. */
export const EASE = [0.23, 1, 0.32, 1] as const
/** For things moving across the world: accelerate, then settle, like a physical object. */
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const

/** Playback speed of the visualizer: 1 is normal, 2 is twice as fast. */
export const SpeedContext = createContext(1)

/** Seconds at 1× → seconds at the current speed. */
export function useDur() {
  const speed = useContext(SpeedContext)
  return (seconds: number) => seconds / speed
}
