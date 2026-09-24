"use client"

import { useLayoutEffect, useRef } from "react"
import { useReducedMotion } from "motion/react"

/**
 * A particle that travels once along a path: execution or data moving along a connection.
 * SMIL <animateMotion> (React Flow's own animated-edge pattern), started before paint
 * so it never flashes at the origin. Remount it (new key) to play it again.
 */
export function ExecutionParticle({
  d,
  seconds,
}: {
  d: string
  seconds: number
}) {
  const reduce = useReducedMotion()
  const move = useRef<SVGAnimateMotionElement>(null)
  const fade = useRef<SVGAnimateElement>(null)
  useLayoutEffect(() => {
    move.current?.beginElement()
    fade.current?.beginElement()
  }, [])
  if (reduce) return null
  return (
    <circle r={4} opacity={0} style={{ fill: "var(--iso-accent)" }} aria-hidden>
      <animateMotion
        ref={move}
        path={d}
        dur={`${seconds}s`}
        begin="indefinite"
        fill="freeze"
        calcMode="spline"
        keyTimes="0;1"
        keySplines="0.4 0 0.2 1"
      />
      <animate
        ref={fade}
        attributeName="opacity"
        values="0;1;1;0"
        keyTimes="0;0.1;0.85;1"
        dur={`${seconds}s`}
        begin="indefinite"
        fill="freeze"
      />
    </circle>
  )
}
