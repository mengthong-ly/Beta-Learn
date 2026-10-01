"use client"

import { useEffect } from "react"

/**
 * Pointer tilt for every `[data-tilt]` card on the landing: the card leans
 * towards the cursor and a glare follows it. One delegated listener for the
 * whole page instead of one per card.
 *
 * The lean is the `rotate` property, not `transform`, so it composes with the
 * scroll-driven 3D entrance that already animates `transform` on the same card.
 * The card's parent supplies the `perspective`.
 *
 * Only for a fine pointer that hovers, and never under reduced motion.
 */
const MAX_DEG = 7

export function TiltCards() {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)")
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (!fine.matches || reduced.matches) return

    let active: HTMLElement | null = null
    let frame = 0
    let last: PointerEvent | null = null

    const reset = (el: HTMLElement) => {
      el.style.removeProperty("rotate")
      el.style.removeProperty("--glare-x")
      el.style.removeProperty("--glare-y")
      delete el.dataset.tilting
    }

    const apply = () => {
      frame = 0
      if (!active || !last) return
      const r = active.getBoundingClientRect()
      // -0.5 … 0.5 from the card's centre.
      const x = (last.clientX - r.left) / r.width - 0.5
      const y = (last.clientY - r.top) / r.height - 0.5
      const angle = Math.hypot(x, y) * 2 * MAX_DEG
      // Rotate about the axis perpendicular to the pointer's offset, so the
      // corner under the cursor dips towards it.
      active.style.rotate = `${-y} ${x} 0 ${angle.toFixed(2)}deg`
      active.style.setProperty("--glare-x", `${((x + 0.5) * 100).toFixed(1)}%`)
      active.style.setProperty("--glare-y", `${((y + 0.5) * 100).toFixed(1)}%`)
      active.dataset.tilting = ""
    }

    const onMove = (e: PointerEvent) => {
      const card = (e.target as Element | null)?.closest<HTMLElement>(
        "[data-tilt]"
      )
      if (card !== active) {
        if (active) reset(active)
        active = card ?? null
      }
      if (!active) return
      last = e
      frame ||= requestAnimationFrame(apply)
    }
    const onLeave = () => {
      if (active) reset(active)
      active = null
    }

    document.addEventListener("pointermove", onMove, { passive: true })
    document.documentElement.addEventListener("pointerleave", onLeave)
    return () => {
      document.removeEventListener("pointermove", onMove)
      document.documentElement.removeEventListener("pointerleave", onLeave)
      cancelAnimationFrame(frame)
      if (active) reset(active)
    }
  }, [])

  return null
}
